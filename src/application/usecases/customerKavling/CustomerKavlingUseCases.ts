import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IDetailKavlingPajakRepository } from "../../../domain/repositories/IDetailKavlingPajakRepo.js";
import type { IKavlingRepository } from "../../../domain/repositories/IKavlingRepo.js";
import type {
  UpdateCustomerKavlingDTO,
  CustomerKavlingFilterDTO,
} from "../../../domain/dtos/CustomerKavlingDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import type {
  CreateDetailKavlingPajakDTO,
  UpdateDetailKavlingPajakDTO,
} from "../../../domain/dtos/DetailKavlingPajakDTO.js";
export class GetCustomerKavlingsPaginatedUseCase {
  constructor(private readonly db: PrismaClient) {}

  async execute(
    page: number,
    limit: number,
    filters?: CustomerKavlingFilterDTO,
  ): Promise<OffsetPaginatedData<any>> {
    const where: Prisma.PenjualanWhereInput = {
      status: { in: ["BOOKED", "PROSES", "LUNAS"] },
    };

    if (filters?.search) {
      where.OR = [
        { customer: { nama: { contains: filters.search } } },
        { kavling: { blok: { contains: filters.search } } },
        { kavling: { nomorUnit: { contains: filters.search } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as "BOOKED" | "PROSES" | "LUNAS";
    }

    if (filters?.caraPembayaran) {
      where.caraPembayaran = filters.caraPembayaran as
        | "KPR"
        | "CASH_KERAS"
        | "CASH_BERTAHAP";
    }

    const listInclude = {
      customer: { select: { nama: true } },
      kavling: { include: { perumahan: true } },
      detailKavlingPajak: { include: { notaris: true } },
      agent: { select: { nama: true } },
    } satisfies Prisma.PenjualanInclude;

    const sortField = filters?.orderBy?.field;
    const sortByKavling =
      sortField === "nomorUnit" || sortField === "blokNomorUnit";

    let orderByClause: Prisma.PenjualanOrderByWithRelationInput[] = [
      { id: "desc" },
    ];

    if (filters?.orderBy && !sortByKavling) {
      const { field, direction } = filters.orderBy;
      if (field === "nama") {
        orderByClause = [{ customer: { nama: direction } }, { id: "desc" }];
      } else if (field === "totalHargaJual") {
        orderByClause = [{ hargaJual: direction }, { id: "desc" }];
      } else {
        orderByClause = [{ [field]: direction }, { id: "desc" }];
      }
    }

    const skip = (page - 1) * limit;

    const parseNomorUnit = (val: string) => {
      const n = Number.parseInt(String(val).trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    type PenjualanListRow = Prisma.PenjualanGetPayload<{
      include: typeof listInclude;
    }>;

    let items: PenjualanListRow[];
    let totalItems: number;

    if (sortByKavling) {
      const direction = filters!.orderBy!.direction;

      const matching = await this.db.penjualan.findMany({
        where,
        select: {
          id: true,
          kavling: { select: { blok: true, nomorUnit: true } },
        },
      });

      matching.sort((a, b) => {
        if (sortField === "blokNomorUnit") {
          const blokCmp = a.kavling.blok.localeCompare(b.kavling.blok, "id", {
            numeric: true,
            sensitivity: "base",
          });
          if (blokCmp !== 0) {
            return direction === "asc" ? blokCmp : -blokCmp;
          }
        }
        const diff =
          parseNomorUnit(a.kavling.nomorUnit) -
          parseNomorUnit(b.kavling.nomorUnit);
        return direction === "asc" ? diff : -diff;
      });

      totalItems = matching.length;
      const pageIds = matching.slice(skip, skip + limit).map((r) => r.id);

      if (pageIds.length === 0) {
        items = [];
      } else {
        const unsorted = await this.db.penjualan.findMany({
          where: { id: { in: pageIds } },
          include: listInclude,
        });
        const orderMap = new Map(pageIds.map((id, i) => [id, i]));
        items = [...unsorted].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
      }
    } else {
      [items, totalItems] = await Promise.all([
        this.db.penjualan.findMany({
          take: limit,
          skip,
          where,
          orderBy: orderByClause,
          include: listInclude,
        }),
        this.db.penjualan.count({ where }),
      ]);
    }

    const totalPages = Math.ceil(totalItems / limit) || 1;

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
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
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

    const normalizedRekeningTujuanId =
      rekeningTujuanId && rekeningTujuanId > 0 ? rekeningTujuanId : undefined;

    if (
      statusKavling !== undefined ||
      namaTipe !== undefined ||
      luasBangunan !== undefined ||
      luasTanah !== undefined ||
      hargaDasarKavling !== undefined ||
      normalizedRekeningTujuanId !== undefined
    ) {
      await this.kavlingRepo.update(penjualan.kavlingId, {
        status: statusKavling,
        namaTipe: namaTipe,
        luasBangunan: luasBangunan,
        luasTanah: luasTanah,
        hargaDasar: hargaDasarKavling,
        rekeningTujuanId: normalizedRekeningTujuanId,
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
