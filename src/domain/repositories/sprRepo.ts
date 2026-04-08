import { Prisma } from "@prisma/client";
import type { PrismaClient, Spr } from "@prisma/client";
import type { ISprRepository } from "./ISprRepo.js";
import type {
  CreateSprDTO,
  UpdateSprDTO,
  SprFilterDTO,
  FastEntrySprDTO,
} from "../dtos/SprDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class SprRepository implements ISprRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateSprDTO, nomorSpr: string): Promise<Spr> {
    const checkDuplicate = await this.findByNomor(nomorSpr);
    if (checkDuplicate) {
      throw new ConflictError("Nomor SPR sudah terdaftar");
    }

    const unit = await this.db.unit.findUnique({ where: { id: data.unitId } });
    if (unit?.status !== "TERSEDIA") {
      throw new ConflictError("Unit tidak ditemukan atau sudah tidak tersedia");
    }

    const paymentsToCreate: Prisma.SprPaymentCreateWithoutSprInput[] = [];

    if (data.bookingFee) {
      paymentsToCreate.push({
        keterangan: "Booking Fee",
        jatuhTempo: new Date(),
        nilai: data.bookingFee,
        statusPembayaran: "BELUM_BAYAR",
      });
    }

    if (data.closingFee) {
      paymentsToCreate.push({
        keterangan: "Closing Fee",
        jatuhTempo: new Date(),
        nilai: data.closingFee,
        statusPembayaran: "BELUM_BAYAR",
      });
    }

    if (data.marketingFee) {
      paymentsToCreate.push({
        keterangan: "Marketing Fee",
        jatuhTempo: new Date(),
        nilai: data.marketingFee,
        statusPembayaran: "BELUM_BAYAR",
      });
    }

    try {
      return await this.db.$transaction(async (tx) => {
        const spr = await tx.spr.create({
          data: {
            nomorSpr,
            customerId: data.customerId,
            unitId: data.unitId,
            marketingUserId: data.marketingUserId,
            bankRekeningPtId: data.bankRekeningPtId,
            hargaJual: data.hargaJual,
            diskonPenjualan: data.diskonPenjualan ?? null,
            paketPromosi: data.paketPromosi ?? null,
            caraPembayaran: data.caraPembayaran,
            nilaiPengajuanKpr: data.nilaiPengajuanKpr ?? null,
            bankKpr: data.bankKpr ?? null,
            agent: data.agent ?? null,
            payments: {
              create: paymentsToCreate,
            },
          },
        });

        await tx.unit.update({
          where: { id: data.unitId },
          data: { status: "BOOKING" },
        });

        return spr;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        const constraint = error.meta?.constraint as
          | string[]
          | string
          | undefined;
        const constraintStr = Array.isArray(constraint)
          ? constraint.join(",")
          : String(constraint);

        if (constraintStr.includes("marketing_user_id")) {
          throw new NotFoundError(
            "Gagal membuat SPR: Akun Marketing (User ID) tidak ditemukan di database.",
          );
        }
        if (constraintStr.includes("customer_id")) {
          throw new NotFoundError(
            "Gagal membuat SPR: Data Customer tidak ditemukan di database.",
          );
        }
        if (constraintStr.includes("bank_rekening_pt_id")) {
          throw new NotFoundError(
            "Gagal membuat SPR: Data Rekening PT tidak ditemukan di database.",
          );
        }

        throw new ConflictError(
          "Gagal menyimpan SPR karena referensi ID tidak valid.",
        );
      }

      throw error;
    }
  }

  async findById(id: number): Promise<Spr | null> {
    return await this.db.spr.findUnique({
      where: { id },
      include: {
        customer: true,
        unit: true,
        payments: true,
      },
    });
  }

  async findByNomor(nomorSpr: string): Promise<Spr | null> {
    return await this.db.spr.findUnique({ where: { nomorSpr } });
  }

  async update(id: number, data: UpdateSprDTO): Promise<Spr> {
    const existing = await this.db.spr.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Data SPR tidak ditemukan");

    const updateData: Prisma.SprUpdateInput = {};
    if (data.hargaJual !== undefined) updateData.hargaJual = data.hargaJual;
    if (data.diskonPenjualan !== undefined)
      updateData.diskonPenjualan = data.diskonPenjualan ?? null;
    if (data.paketPromosi !== undefined)
      updateData.paketPromosi = data.paketPromosi ?? null;
    if (data.caraPembayaran !== undefined)
      updateData.caraPembayaran = data.caraPembayaran;
    if (data.nilaiPengajuanKpr !== undefined)
      updateData.nilaiPengajuanKpr = data.nilaiPengajuanKpr ?? null;
    if (data.bankKpr !== undefined) updateData.bankKpr = data.bankKpr ?? null;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.ttdPemesan !== undefined)
      updateData.ttdPemesan = data.ttdPemesan ?? null;
    if (data.tanggalTtdPemesan !== undefined)
      updateData.tanggalTtdPemesan = data.tanggalTtdPemesan ?? null;
    if (data.ttdMarketing !== undefined)
      updateData.ttdMarketing = data.ttdMarketing ?? null;
    if (data.tanggalTtdMarketing !== undefined)
      updateData.tanggalTtdMarketing = data.tanggalTtdMarketing ?? null;
    if (data.ttdSupervisor !== undefined)
      updateData.ttdSupervisor = data.ttdSupervisor ?? null;
    if (data.tanggalTtdSupervisor !== undefined)
      updateData.tanggalTtdSupervisor = data.tanggalTtdSupervisor ?? null;
    if (data.ttdManager !== undefined)
      updateData.ttdManager = data.ttdManager ?? null;
    if (data.tanggalTtdManager !== undefined)
      updateData.tanggalTtdManager = data.tanggalTtdManager ?? null;
    if (data.ttdSalesAdmin !== undefined)
      updateData.ttdSalesAdmin = data.ttdSalesAdmin ?? null;
    if (data.tanggalTtdSalesAdmin !== undefined)
      updateData.tanggalTtdSalesAdmin = data.tanggalTtdSalesAdmin ?? null;
    if (data.agent !== undefined) updateData.agent = data.agent ?? null;
    return await this.db.spr.update({
      where: { id },
      data: updateData,
    });
  }
  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SprFilterDTO,
  ): Promise<CursorPaginatedData<Spr>> {
    const where: Prisma.SprWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.nomorSpr = { contains: filters.search };
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.caraPembayaran) where.caraPembayaran = filters.caraPembayaran;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.unitId) where.unitId = filters.unitId;

    let orderByClause: Prisma.SprOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = [
        "nomorSpr",
        "hargaJual",
        "status",
        "caraPembayaran",
        "createdAt",
      ];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.spr.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: orderByClause,
      include: {
        customer: true,
        unit: true,
        payments: true,
      },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return { items, meta: { nextCursor, hasNextPage } };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.db.spr.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Data SPR tidak ditemukan");

    await this.db.$transaction(async (tx) => {
      await tx.spr.delete({ where: { id } });

      await tx.unit.update({
        where: { id: existing.unitId },
        data: { status: "TERSEDIA" },
      });
    });
  }
  async findTrackRecordByCustomerId(customerId: number): Promise<Spr[]> {
    return await this.db.spr.findMany({
      where: { customerId },
      include: {
        unit: true,
        payments: {
          orderBy: { jatuhTempo: "asc" },
        },
        progressMaster: true,
        bankRekeningPt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelSpr(id: number, alasanBatal: string): Promise<Spr> {
    const existing = await this.db.spr.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Data SPR tidak ditemukan");
    if (existing.status === "DIBATALKAN")
      throw new ConflictError("SPR ini sudah dibatalkan.");

    return await this.db.$transaction(async (tx) => {
      const spr = await tx.spr.update({
        where: { id },
        data: {
          status: "DIBATALKAN",
          alasanBatal: alasanBatal,
        },
      });

      await tx.unit.update({
        where: { id: existing.unitId },
        data: { status: "TERSEDIA" },
      });

      return spr;
    });
  }
  async createFastEntry(
    data: FastEntrySprDTO,
    fileUrls: Record<string, string | undefined>,
    nomorSpr: string,
  ): Promise<Spr> {
    const checkDuplicateSpr = await this.findByNomor(nomorSpr);
    if (checkDuplicateSpr) {
      throw new ConflictError("Nomor SPR sudah terdaftar");
    }

    const unit = await this.db.unit.findUnique({ where: { id: data.unitId } });
    if (unit?.status !== "TERSEDIA") {
      throw new ConflictError("Unit tidak ditemukan atau sudah tidak tersedia");
    }

    return await this.db.$transaction(async (tx) => {
      let customerId = 0;
      const existingCustomer = await tx.customer.findUnique({
        where: { nikKtp: data.nikKtp },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;

        await tx.customer.update({
          where: { id: customerId },
          data: {
            nama: data.nama,
            noHp: data.noHp,
            email: data.email ?? null,
            pekerjaan: data.pekerjaan ?? null,
            perusahaan: data.perusahaan ?? null,
            alamatKorespondensi: data.alamatKorespondensi ?? null,
            alamatKtp: data.alamatKtp,
            alamatTinggal: data.alamatTinggal ?? null,
            ...(fileUrls.fileKtp && { fileKtp: fileUrls.fileKtp }),
            ...(fileUrls.fileKk && { fileKk: fileUrls.fileKk }),
            ...(fileUrls.fileNpwp && { fileNpwp: fileUrls.fileNpwp }),
          },
        });
      } else {
        const newCustomer = await tx.customer.create({
          data: {
            nikKtp: data.nikKtp,
            nama: data.nama,
            noHp: data.noHp,
            email: data.email ?? null,
            pekerjaan: data.pekerjaan ?? null,
            perusahaan: data.perusahaan ?? null,
            alamatKorespondensi: data.alamatKorespondensi ?? null,
            alamatKtp: data.alamatKtp,
            alamatTinggal: data.alamatTinggal ?? null,
            fileKtp: fileUrls.fileKtp ?? null,
            fileKk: fileUrls.fileKk ?? null,
            fileNpwp: fileUrls.fileNpwp ?? null,
          },
        });
        customerId = newCustomer.id;
      }

      const paymentsToCreate: Prisma.SprPaymentCreateWithoutSprInput[] = [];

      if (data.bookingFee) {
        paymentsToCreate.push({
          keterangan: "Booking Fee",
          jatuhTempo: data.tanggalTransferBookingFee ?? new Date(),
          nilai: data.bookingFee,
          statusPembayaran: data.tanggalTransferBookingFee
            ? "LUNAS"
            : "BELUM_BAYAR",
          buktiTransfer: fileUrls.buktiTransferBookingFee ?? null,
        });
      }
      if (data.closingFee) {
        paymentsToCreate.push({
          keterangan: "Closing Fee",
          jatuhTempo: data.tanggalTransferClosingFee ?? new Date(),
          nilai: data.closingFee,
          statusPembayaran: data.tanggalTransferClosingFee
            ? "LUNAS"
            : "BELUM_BAYAR",
          buktiTransfer: fileUrls.buktiTransferClosingFee ?? null,
        });
      }
      if (data.marketingFee) {
        paymentsToCreate.push({
          keterangan: "Marketing Fee",
          jatuhTempo: data.tanggalTransferMarketingFee ?? new Date(),
          nilai: data.marketingFee,
          statusPembayaran: data.tanggalTransferMarketingFee
            ? "LUNAS"
            : "BELUM_BAYAR",
          buktiTransfer: fileUrls.buktiTransferMarketingFee ?? null,
        });
      }

      const spr = await tx.spr.create({
        data: {
          nomorSpr,
          customerId: customerId,
          unitId: data.unitId,
          marketingUserId: data.marketingUserId!,
          bankRekeningPtId: data.bankRekeningPtId,
          hargaJual: data.hargaJual,
          caraPembayaran: data.caraPembayaran,
          bankKpr: data.bankKpr ?? null,
          agent: data.agent ?? null,
          payments: {
            create: paymentsToCreate,
          },
          progressMaster: {
            create: {
              statusAkadPpjb: data.statusAkadPpjb ?? null,
              tanggalAkadPpjb: data.tanggalAkadPpjb ?? null,
              tanggalAkadAjbPpat: data.tanggalAkadAjbPpat ?? null,
              tanggalPembayaranPph: data.tanggalPembayaranPph ?? null,
              tanggalPembayaranBphtb: data.tanggalPembayaranBphtb ?? null,
              pembiayaan: data.pembiayaan ?? null,
              sp3r: data.sp3r ?? null,
              hargaLebihTanah: data.hargaLebihTanah ?? 0,
              biayaStrategis: data.biayaStrategis ?? 0,
              biayaKpr: data.biayaKpr ?? 0,
              biayaAsuransi: data.biayaAsuransi ?? 0,
              diskonAngsuran: data.diskonAngsuran ?? 0,
              diskonCashKeras: data.diskonCashKeras ?? 0,
              diskonLainnya: data.diskonLainnya ?? 0,
              biayaBalikNama: data.biayaBalikNama ?? 0,
              biayaNotarisAjb: data.biayaNotarisAjb ?? 0,
              biayaAppraisal: data.biayaAppraisal ?? 0,
              biayaBphtb: data.biayaBphtb ?? 0,
              biayaLainLain: data.biayaLainLain ?? 0,
              ppn: data.ppn ?? 0,
              pph: data.pph ?? 0,
              njopTanahPerMeter: data.njopTanahPerMeter ?? 0,
              njopBangunanPerMeter: data.njopBangunanPerMeter ?? 0,
              uping: data.uping ?? 0,
            },
          },
        },
        include: {
          customer: true,
          unit: true,
          payments: true,
          progressMaster: true,
        },
      });

      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: "BOOKING" },
      });

      return spr;
    });
  }
}
