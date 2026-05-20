import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IDetailKavlingPajakRepository } from "../../../domain/repositories/IDetailKavlingPajakRepo.js";
import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type {
  UpdateCustomerKavlingDTO,
  CustomerKavlingFilterDTO,
} from "../../../domain/dtos/CustomerKavlingDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import type {
  CreateDetailKavlingPajakDTO,
  UpdateDetailKavlingPajakDTO,
} from "../../../domain/dtos/DetailKavlingPajakDTO.js";
export class GetCustomerKavlingsPaginatedUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: CustomerKavlingFilterDTO,
  ): Promise<CursorPaginatedData<any>> {
    const where: Prisma.PenjualanWhereInput = {
      status: { in: ["BOOKED", "PROSES", "LUNAS"] },
    };

    if (filters?.search) {
      where.customer = { nama: { contains: filters.search } };
    }

    const items = await this.db.penjualan.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],
      include: {
        customer: { select: { nama: true } },
        kavling: { include: { perumahan: true } },
        detailKavlingPajak: { include: { notaris: true } },
        agent: { select: { nama: true } },
      },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const mappedItems = items.map((p) => {
      // Omit `pembiayaan` from detail spread: it is a separate DetailKavlingPajak column
      // and null rows would overwrite Penjualan.caraPembayaran (the real payment method).
      const { id: _, pembiayaan: _detailPembiayaan, ...restDetailPajak } =
        p.detailKavlingPajak ?? {};

      return {
        id: p.id.toString(),
        customerId: p.customerId,
        namaCustomer: p.customer?.nama || "-",
        perumahan: p.kavling.perumahan?.nama || "",

        status: p.status,
        statusKavling: p.kavling.status,
        blok: p.kavling.blok,
        unit: p.kavling.nomorUnit,
        tipe: p.kavling.namaTipe,
        luasBangunan: Number(p.kavling.luasBangunan),
        luasTanah: Number(p.kavling.luasTanah),

        hargaDasarKavling: Number(p.kavling.hargaDasar),
        diskonPenjualan: Number(p.diskonPenjualan ?? 0),
        totalHargaJual: Number(p.hargaJual),

        pembiayaan: p.caraPembayaran ?? _detailPembiayaan,
        agent: p.agent?.nama ?? "Nama Agent",

        ...restDetailPajak,

        notarisId: p.detailKavlingPajak?.notarisId ?? "",
        createdBy: p.createdBy ?? "Admin",
      };
    });

    return {
      items: mappedItems,
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }
}

export class UpdateCustomerKavlingUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly kavlingRepo: IKavlingRepository,
    private readonly detailPajakRepo: IDetailKavlingPajakRepository,
  ) {}

  async execute(penjualanId: number, data: UpdateCustomerKavlingDTO) {
    const penjualan = await this.db.penjualan.findUnique({
      where: { id: penjualanId },
      include: { kavling: true },
    });

    if (!penjualan) {
      throw new NotFoundError("Data Penjualan tidak ditemukan");
    }

    const {
      statusKavling,
      namaTipe,
      luasBangunan,
      luasTanah,
      hargaDasarKavling,
      rekeningTujuanId,
      ...detailPajakData
    } = data;

    if (
      statusKavling !== undefined ||
      namaTipe !== undefined ||
      luasBangunan !== undefined ||
      luasTanah !== undefined ||
      hargaDasarKavling !== undefined ||
      rekeningTujuanId !== undefined
    ) {
      await this.kavlingRepo.update(penjualan.kavlingId, {
        status: statusKavling,
        namaTipe: namaTipe,
        luasBangunan: luasBangunan,
        luasTanah: luasTanah,
        hargaDasar: hargaDasarKavling,
        rekeningTujuanId: rekeningTujuanId ?? undefined,
      });
    }

    const createDataPayload: Record<string, unknown> = { penjualanId };
    const updateDataPayload: Record<string, unknown> = {};

    if (luasBangunan !== undefined) {
      createDataPayload.luasBangunan = luasBangunan.toString();
      updateDataPayload.luasBangunan = luasBangunan.toString();
    }

    for (const [key, value] of Object.entries(detailPajakData)) {
      if (value !== undefined) {
        createDataPayload[key] = value;
        updateDataPayload[key] = value;
      }
    }

    const existingDetail =
      await this.detailPajakRepo.findByPenjualanId(penjualanId);

    if (existingDetail) {
      await this.detailPajakRepo.update(
        penjualanId,
        updateDataPayload as unknown as UpdateDetailKavlingPajakDTO,
      );
    } else {
      await this.detailPajakRepo.create(
        createDataPayload as unknown as CreateDetailKavlingPajakDTO,
      );
    }

    return {
      success: true,
      message: "Data Kavling Customer berhasil diperbarui",
    };
  }
}
