import { type PrismaClient, PenjualanStatus } from "@prisma/client";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import { resolveAgentCommercialProfile } from "../../../domain/agent/agentCommercialProfile.js";

export interface CreateManualBatalPenjualanDTO {
  customerId: number;
  blok: string;
  nomorUnit: string;
  agent: string;
  alasanBatal?: string;
  bookingFeeLunasBatal?: boolean;
  tanggal?: string;
}

/**
 * Membuat penjualan berstatus BATAL secara manual (data historis / rekonstruksi).
 *
 * AMAN untuk production:
 * - TIDAK mengubah status kavling (kavling yang sudah terjual orang lain tetap TERJUAL)
 * - TIDAK menyentuh penjualan aktif lain pada kavling yang sama
 * - TIDAK membuat tagihan / SPR / progress
 * - Hanya membuat baris Penjualan(BATAL) + FeeAgent agar closing fee agent bisa diajukan
 */
export class CreateManualBatalPenjualanUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(data: CreateManualBatalPenjualanDTO, createdBy?: string) {
    const blok = data.blok.trim();
    const nomorUnit = data.nomorUnit.trim();
    const agentNama = data.agent.trim();
    const bookingFeeLunasBatal = data.bookingFeeLunasBatal ?? true;
    const alasanBatal =
      data.alasanBatal?.trim() ||
      "Rekonstruksi data penjualan batal (historis)";

    if (!blok || !nomorUnit) {
      throw new ConflictError("Blok dan nomor unit wajib diisi.");
    }
    if (!agentNama) {
      throw new ConflictError("Agent wajib diisi.");
    }

    return await this.db.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });
      if (!customer) {
        throw new NotFoundError("Customer tidak ditemukan.");
      }

      // Cari kavling tanpa mengubah status-nya (boleh BOOKING/TERJUAL/AVAILABLE)
      const kavlingCandidates = await tx.kavling.findMany({
        where: { blok, nomorUnit },
        include: { perumahan: { select: { nama: true } } },
      });
      if (kavlingCandidates.length === 0) {
        throw new NotFoundError(
          `Kavling Blok ${blok}-${nomorUnit} tidak ditemukan.`,
        );
      }
      if (kavlingCandidates.length > 1) {
        const labels = kavlingCandidates
          .map((k) => `${k.perumahan.nama} (id:${k.id})`)
          .join(", ");
        throw new ConflictError(
          `Ditemukan lebih dari satu kavling Blok ${blok}-${nomorUnit}: ${labels}. Hubungi admin untuk penanganan khusus.`,
        );
      }
      const kavling = kavlingCandidates[0]!;

      const existingBatal = await tx.penjualan.findFirst({
        where: {
          customerId: customer.id,
          kavlingId: kavling.id,
          status: PenjualanStatus.BATAL,
        },
        select: { id: true, noTransaksi: true },
      });
      if (existingBatal) {
        throw new ConflictError(
          `Customer ini sudah punya penjualan batal untuk Blok ${blok}-${nomorUnit} (${existingBatal.noTransaksi}). Edit data yang ada saja.`,
        );
      }

      const agent = await tx.agent.findFirst({
        where: { nama: agentNama },
        include: { perusahaanAgent: true },
      });
      if (!agent) {
        throw new NotFoundError(
          `Agent "${agentNama}" tidak ditemukan di master. Pastikan nama agent sudah terdaftar.`,
        );
      }

      const tanggal = data.tanggal
        ? new Date(data.tanggal)
        : new Date();
      const noTransaksi = `TRX-BTL-${blok}${nomorUnit}-${Date.now()}`;

      const commercial = resolveAgentCommercialProfile(agent);
      const closingNominal =
        commercial.feeClosingNominal != null &&
        Number(commercial.feeClosingNominal) > 0
          ? commercial.feeClosingNominal
          : undefined;

      const penjualan = await tx.penjualan.create({
        data: {
          noTransaksi,
          tanggal,
          status: PenjualanStatus.BATAL,
          alasanBatal,
          bookingFeeLunasBatal,
          hargaDasar: kavling.hargaDasar,
          hargaJual: kavling.hargaDasar,
          bookingFee: 0,
          fileBuktiBooking: "-",
          customerId: customer.id,
          kavlingId: kavling.id,
          agentId: agent.id,
          rekeningTujuanId: kavling.rekeningTujuanId,
          createdBy: createdBy ?? "manual-batal",
        },
      });

      await tx.feeAgent.create({
        data: {
          agentId: agent.id,
          penjualanId: penjualan.id,
          ...(closingNominal != null ? { closingNominal } : {}),
        },
      });

      return await tx.penjualan.findUniqueOrThrow({
        where: { id: penjualan.id },
        include: {
          customer: true,
          agent: true,
          kavling: true,
          feeAgent: true,
          tagihan: true,
        },
      });
    });
  }
}
