import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type {
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
  TagihanResponseDTO,
} from "../../../domain/dtos/TagihanDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { inferTagihanTujuanFromPembayaran } from "../../../domain/tagihan/tagihanTujuan.js";

type ITtdData = Record<
  string,
  {
    nama: string;
    tanggal: string;
    url: string;
  }
>;

export class CreateTagihanUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(data: CreateTagihanDTO): Promise<TagihanResponseDTO> {
    const count = await this.repo.count();
    const noTagihan = `INV-${String(count + 1).padStart(3, "0")}`;
    const tujuan =
      data.tujuan ?? inferTagihanTujuanFromPembayaran(data.pembayaran);
    return await this.repo.create({ ...data, tujuan }, noTagihan);
  }
}

export class UpdateTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly db: PrismaClient,
  ) {}

  async execute(
    id: number,
    data: UpdateTagihanDTO,
  ): Promise<TagihanResponseDTO> {
    const before = await this.repo.findById(id);
    if (!before) throw new NotFoundError("Tagihan tidak ditemukan");

    const updated = await this.repo.update(id, data);

    const newNominal =
      data.nominal !== undefined ? Number(data.nominal) : before.nominal;
    const nominalChanged =
      data.nominal !== undefined && newNominal !== before.nominal;

    const penjualanRow = await this.db.penjualan.findUnique({
      where: { id: before.penjualanId },
      select: { noTransaksi: true },
    });
    const isCanonicalDpInvoice =
      !!penjualanRow &&
      before.noTagihan === `INV-DP-${penjualanRow.noTransaksi}`;

    if (
      nominalChanged &&
      isCanonicalDpInvoice &&
      before.penjualanId &&
      newNominal > 0
    ) {
      await this.syncPenjualanDpFromDpTagihanNominal(
        before.penjualanId,
        newNominal,
      );
    }

    return updated;
  }

  /**
   * Saat nominal tagihan "Down Payment (DP)" diubah, samakan kolom DP di
   * `penjualan` dengan aturan yang sama seperti generate SPR / update penjualan:
   * - CASH_BERTAHAP → `dp`
   * - KPR → `dp_dibayar` + `dp` jika dp_dibayar > 0, selain itu `dp_tidak_dibayar` + `dp`
   * Untuk cash bertahap dengan termin, nominal cicilan ikut dihitung ulang.
   */
  private async syncPenjualanDpFromDpTagihanNominal(
    penjualanId: number,
    newNominal: number,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const pjj = await tx.penjualan.findUnique({
        where: { id: penjualanId },
      });
      if (!pjj) return;

      const cara = pjj.caraPembayaran;

      if (cara === "CASH_BERTAHAP") {
        await tx.penjualan.update({
          where: { id: penjualanId },
          data: { dp: newNominal },
        });
        await this.recalcCicilanAfterDpChange(tx, {
          penjualanId,
          noTransaksi: pjj.noTransaksi,
          tanggal: pjj.tanggal,
          customerId: pjj.customerId,
          hargaJual: Number(pjj.hargaJual ?? 0),
          bookingFee: Number(pjj.bookingFee ?? 0),
          termin: pjj.termin,
          dp: newNominal,
        });
      } else if (cara === "KPR") {
        const dpDibayarNum = Number(pjj.dpDibayar ?? 0);
        if (dpDibayarNum > 0) {
          await tx.penjualan.update({
            where: { id: penjualanId },
            data: {
              dpDibayar: newNominal,
              dp: newNominal,
            },
          });
        } else {
          await tx.penjualan.update({
            where: { id: penjualanId },
            data: {
              dpTidakDibayar: newNominal,
              dp: newNominal,
            },
          });
        }
      }
    });
  }

  private async recalcCicilanAfterDpChange(
    tx: Prisma.TransactionClient,
    args: {
      penjualanId: number;
      noTransaksi: string;
      tanggal: Date;
      customerId: number;
      hargaJual: number;
      bookingFee: number;
      termin: number | null;
      dp: number;
    },
  ): Promise<void> {
    const termin = args.termin ?? 0;
    if (termin <= 0) return;

    const sisaPembayaran = Math.max(
      0,
      args.hargaJual - args.dp - args.bookingFee,
    );
    const cicilanPerBulan = sisaPembayaran / termin;

    const existingCicilans = await tx.tagihan.findMany({
      where: {
        penjualanId: args.penjualanId,
        OR: [
          { noTagihan: { startsWith: `INV-CCL-${args.noTransaksi}-` } },
          { pembayaran: { startsWith: "Cicilan Ke-" } },
        ],
      },
    });

    const parseCicilanIndex = (pembayaran: string): number => {
      const m = /^Cicilan Ke-(\d+)$/.exec(pembayaran.trim());
      return m ? parseInt(m[1]!, 10) : 0;
    };

    const byIndex = new Map<number, (typeof existingCicilans)[number]>();
    for (const c of existingCicilans) {
      const idx = parseCicilanIndex(c.pembayaran);
      if (idx > 0) byIndex.set(idx, c);
    }

    const baseDate = new Date(args.tanggal);

    for (let i = 1; i <= termin; i++) {
      const jatuhTempoCicilan = new Date(baseDate);
      jatuhTempoCicilan.setMonth(jatuhTempoCicilan.getMonth() + i);

      const existing = byIndex.get(i);
      if (!existing) {
        if (sisaPembayaran <= 0) continue;
        await tx.tagihan.create({
          data: {
            noTagihan: `INV-CCL-${args.noTransaksi}-${i}`,
            customerId: args.customerId,
            penjualanId: args.penjualanId,
            pembayaran: `Cicilan Ke-${i}`,
            tujuan: "HARGA_JUAL",
            nominal: cicilanPerBulan,
            jatuhTempo: jatuhTempoCicilan,
            status: "BELUM_BAYAR",
          },
        });
      } else {
        const patch: { nominal?: number; jatuhTempo?: Date } = {};
        if (Number(existing.nominal) !== cicilanPerBulan) {
          patch.nominal = cicilanPerBulan;
        }
        if (
          existing.status === "BELUM_BAYAR" &&
          existing.jatuhTempo.getTime() !== jatuhTempoCicilan.getTime()
        ) {
          patch.jatuhTempo = jatuhTempoCicilan;
        }
        if (Object.keys(patch).length > 0) {
          await tx.tagihan.update({
            where: { id: existing.id },
            data: patch,
          });
        }
      }
    }

    for (const [idx, cicilan] of byIndex) {
      if (idx <= termin) continue;
      if (cicilan.status === "BELUM_BAYAR") {
        await tx.tagihan.delete({ where: { id: cicilan.id } });
      } else {
        throw new ConflictError(
          `Tidak dapat memperpendek termin: cicilan ke-${idx} sudah lunas atau menunggu konfirmasi.`,
        );
      }
    }
  }
}

export class GetTagihanByIdUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(id: number): Promise<TagihanResponseDTO> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Tagihan tidak ditemukan");
    return result;
  }
}

export class GetTagihansPaginatedUseCase {
  constructor(private readonly repo: ITagihanRepository) {}
  async execute(
    page: number, // <-- Ubah cursor jadi page
    limit: number,
    filters?: TagihanFilterDTO,
  ): Promise<OffsetPaginatedData<TagihanResponseDTO>> {
    // <-- Ubah return type
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}
export class DeleteTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number): Promise<void> {
    const tagihan = await this.repo.findById(id);
    if (!tagihan) throw new NotFoundError("Tagihan tidak ditemukan");

    const filesToDelete = [tagihan.fileBukti, tagihan.fileBuktiRefund].filter(
      Boolean,
    ) as string[];

    if (tagihan.ttdData) {
      const ttdObj = tagihan.ttdData as unknown as ITtdData;
      Object.values(ttdObj).forEach((ttd) => {
        if (ttd?.url) filesToDelete.push(ttd.url);
      });
    }

    for (const url of filesToDelete) {
      await this.cloudinaryService
        .deleteImageByUrl(url)
        .catch((err) =>
          console.error(`Gagal hapus file saat delete tagihan: ${url}`, err),
        );
    }

    await this.repo.delete(id);
  }
}
