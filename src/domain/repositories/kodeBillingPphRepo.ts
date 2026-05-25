import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type {
  KodeBillingPphFilterDTO,
  KodeBillingPphResponseDTO,
  StatusKodeBillingPph,
} from "../dtos/KodeBillingPphDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

const includeRelations = {
  customer: { select: { nama: true } },
  penjualan: {
    include: {
      kavling: {
        include: {
          perumahan: { select: { nama: true } },
        },
      },
    },
  },
} satisfies Prisma.KodeBillingPphInclude;

type KodeBillingPphRow = Prisma.KodeBillingPphGetPayload<{
  include: typeof includeRelations;
}>;

function toDomain(
  row: KodeBillingPphRow,
  fileSuket: string | null = null,
): KodeBillingPphResponseDTO {
  return {
    id: row.id,
    customerId: row.customerId,
    namaCustomer: row.customer.nama,
    penjualanId: row.penjualanId,
    perumahan: row.penjualan?.kavling?.perumahan?.nama ?? null,
    blok: row.penjualan?.kavling?.blok ?? null,
    nomorUnit: row.penjualan?.kavling?.nomorUnit ?? null,
    kodeBilling: row.kodeBilling,
    fileBilling: row.fileBilling,
    fileSuket,
    fileBuktiBayar: row.fileBuktiBayar,
    status: row.status as StatusKodeBillingPph,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function fetchSuketMapByPenjualanIds(
  db: PrismaClient,
  penjualanIds: number[],
): Promise<Map<number, string>> {
  if (penjualanIds.length === 0) return new Map();
  const rows = await db.suketPph.findMany({
    where: { penjualanId: { in: penjualanIds } },
    select: { penjualanId: true, fileSuket: true },
  });
  return new Map(rows.map((r) => [r.penjualanId, r.fileSuket]));
}

export class KodeBillingPphRepository {
  constructor(private readonly db: PrismaClient) {}

  private async enrichOne(row: KodeBillingPphRow): Promise<KodeBillingPphResponseDTO> {
    const suketMap = await fetchSuketMapByPenjualanIds(this.db, [row.penjualanId]);
    return toDomain(row, suketMap.get(row.penjualanId) ?? null);
  }

  private async enrichMany(rows: KodeBillingPphRow[]): Promise<KodeBillingPphResponseDTO[]> {
    const suketMap = await fetchSuketMapByPenjualanIds(
      this.db,
      rows.map((r) => r.penjualanId),
    );
    return rows.map((row) => toDomain(row, suketMap.get(row.penjualanId) ?? null));
  }

  async create(data: {
    customerId: number;
    penjualanId: number;
    kodeBilling: string;
    fileBilling: string;
    uploadedBy?: number | null;
  }): Promise<KodeBillingPphResponseDTO> {
    const result = await this.db.kodeBillingPph.create({
      data: {
        customerId: data.customerId,
        penjualanId: data.penjualanId,
        kodeBilling: data.kodeBilling,
        fileBilling: data.fileBilling,
        uploadedBy: data.uploadedBy ?? null,
        status: "MENUNGGU_BAYAR",
      },
      include: includeRelations,
    });
    return this.enrichOne(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<KodeBillingPphResponseDTO | null> {
    const result = await this.db.kodeBillingPph.findFirst({
      where: { penjualanId },
      orderBy: { updatedAt: "desc" },
      include: includeRelations,
    });
    return result ? this.enrichOne(result) : null;
  }

  async replaceBilling(
    id: number,
    data: {
      kodeBilling: string;
      fileBilling: string;
      uploadedBy?: number | null;
    },
  ): Promise<KodeBillingPphResponseDTO> {
    const result = await this.db.kodeBillingPph.update({
      where: { id },
      data: {
        kodeBilling: data.kodeBilling,
        fileBilling: data.fileBilling,
        uploadedBy: data.uploadedBy ?? null,
        status: "MENUNGGU_BAYAR",
        fileBuktiBayar: null,
        paidAt: null,
      },
      include: includeRelations,
    });
    return this.enrichOne(result);
  }

  async findById(id: number): Promise<KodeBillingPphResponseDTO | null> {
    const result = await this.db.kodeBillingPph.findUnique({
      where: { id },
      include: includeRelations,
    });
    return result ? this.enrichOne(result) : null;
  }

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: KodeBillingPphFilterDTO,
  ): Promise<OffsetPaginatedData<KodeBillingPphResponseDTO>> {
    const where: Prisma.KodeBillingPphWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.penjualanId) where.penjualanId = filters.penjualanId;

    if (filters?.search) {
      where.OR = [
        { kodeBilling: { contains: filters.search } },
        { customer: { nama: { contains: filters.search } } },
        { customer: { nikKtp: { contains: filters.search } } },
      ];
    }

    let orderBy: Prisma.KodeBillingPphOrderByWithRelationInput[] = [
      { createdAt: "desc" },
    ];
    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      if (["createdAt", "updatedAt", "kodeBilling", "status"].includes(field)) {
        orderBy = [{ [field]: direction }];
      }
    }

    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      this.db.kodeBillingPph.findMany({
        take: limit,
        skip,
        where,
        orderBy,
        include: includeRelations,
      }),
      this.db.kodeBillingPph.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    return {
      items: await this.enrichMany(items),
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

  async updateBuktiBayar(
    id: number,
    fileBuktiBayar: string,
  ): Promise<KodeBillingPphResponseDTO> {
    const result = await this.db.kodeBillingPph.update({
      where: { id },
      data: {
        fileBuktiBayar,
        status: "SUDAH_BAYAR",
        paidAt: new Date(),
      },
      include: includeRelations,
    });
    return this.enrichOne(result);
  }
}
