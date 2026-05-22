import { Prisma } from "@prisma/client";
import type { PrismaClient, Customer } from "@prisma/client";
import type { ICustomerRepository } from "./ICustomerRepo.js";
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerFilterDTO,
} from "../dtos/CustomerDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateCustomerDTO): Promise<Customer> {
    const existingCustomer = await this.findByNik(data.nikKtp);
    if (existingCustomer) {
      throw new ConflictError("Customer dengan NIK tersebut sudah terdaftar");
    }

    return await this.db.customer.create({
      data: {
        userId: data.userId ?? null,
        nikKtp: data.nikKtp,
        nama: data.nama,
        noHp: data.noHp,
        email: data.email ?? null,
        pekerjaan: data.pekerjaan ?? null,
        perusahaan: data.perusahaan ?? null,
        bank: data.bank ?? null,
        alamatKoresponden: data.alamatKoresponden ?? null,
        alamatKtp: data.alamatKtp,
        alamatTinggal: data.alamatTinggal ?? null,
      },
    });
  }

  async findById(id: number): Promise<Customer | null> {
    return await this.db.customer.findUnique({ where: { id } });
  }

  async findByNik(nikKtp: string): Promise<Customer | null> {
    return await this.db.customer.findUnique({ where: { nikKtp } });
  }

  async update(id: number, data: UpdateCustomerDTO): Promise<Customer> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Customer tidak ditemukan");

    if (data.nikKtp && data.nikKtp !== existing.nikKtp) {
      const checkDuplicate = await this.findByNik(data.nikKtp);
      if (checkDuplicate) {
        throw new ConflictError("NIK sudah digunakan oleh customer lain");
      }
    }

    const updateData: Prisma.CustomerUncheckedUpdateInput = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.nikKtp !== undefined) updateData.nikKtp = data.nikKtp;
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.noHp !== undefined) updateData.noHp = data.noHp;
    if (data.email !== undefined) updateData.email = data.email ?? null;
    if (data.pekerjaan !== undefined)
      updateData.pekerjaan = data.pekerjaan ?? null;
    if (data.perusahaan !== undefined)
      updateData.perusahaan = data.perusahaan ?? null;
    if (data.bank !== undefined) updateData.bank = data.bank ?? null;
    if (data.alamatKoresponden !== undefined)
      updateData.alamatKoresponden = data.alamatKoresponden ?? null;
    if (data.alamatKtp !== undefined) updateData.alamatKtp = data.alamatKtp;
    if (data.alamatTinggal !== undefined)
      updateData.alamatTinggal = data.alamatTinggal ?? null;
    if (data.fileKtp !== undefined) updateData.fileKtp = data.fileKtp ?? null;
    if (data.fileKk !== undefined) updateData.fileKk = data.fileKk ?? null;
    if (data.fileNpwp !== undefined)
      updateData.fileNpwp = data.fileNpwp ?? null;

    if (data.dokumenLainnya !== undefined)
      updateData.dokumenLainnya = data.dokumenLainnya ?? Prisma.DbNull;

    return await this.db.customer.update({
      where: { id },
      data: updateData,
    });
  }
  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: CustomerFilterDTO,
  ): Promise<OffsetPaginatedData<Customer>> {
    const where: Prisma.CustomerWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { nama: { contains: filters.search } },
        { nikKtp: { contains: filters.search } },
        { noHp: { contains: filters.search } },
        {
          penjualan: {
            some: {
              status: { not: "BATAL" },
              kavling: {
                OR: [
                  { blok: { contains: filters.search } },
                  { nomorUnit: { contains: filters.search } },
                ],
              },
            },
          },
        },
      ];
    }

    const sortField = filters?.orderBy?.field;
    const sortByKavling = sortField === "blokNomorUnit";
    const skip = (page - 1) * limit;

    let orderByClause: Prisma.CustomerOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy && !sortByKavling) {
      const { field, direction } = filters.orderBy;
      const validFields = ["nama", "nikKtp", "noHp", "createdAt"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const parseNomorUnit = (val: string) => {
      const n = Number.parseInt(String(val).trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const compareKavling = (
      a: { blok: string; nomorUnit: string },
      b: { blok: string; nomorUnit: string },
      direction: "asc" | "desc",
    ) => {
      const blokCmp = a.blok.localeCompare(b.blok, "id", {
        numeric: true,
        sensitivity: "base",
      });
      if (blokCmp !== 0) {
        return direction === "asc" ? blokCmp : -blokCmp;
      }
      const diff = parseNomorUnit(a.nomorUnit) - parseNomorUnit(b.nomorUnit);
      return direction === "asc" ? diff : -diff;
    };

    const pickPrimaryKavling = (
      penjualan: { kavling: { blok: string; nomorUnit: string } }[],
    ) => {
      if (penjualan.length === 0) return null;
      return [...penjualan]
        .map((p) => p.kavling)
        .sort((a, b) => compareKavling(a, b, "asc"))[0]!;
    };

    let items: Customer[];
    let totalItems: number;

    if (sortByKavling) {
      const direction = filters!.orderBy!.direction;

      const matching = await this.db.customer.findMany({
        where,
        select: {
          id: true,
          penjualan: {
            where: { status: { not: "BATAL" } },
            select: { kavling: { select: { blok: true, nomorUnit: true } } },
          },
        },
      });

      matching.sort((a, b) => {
        const kavA = pickPrimaryKavling(a.penjualan);
        const kavB = pickPrimaryKavling(b.penjualan);
        if (!kavA && !kavB) return a.id - b.id;
        if (!kavA) return 1;
        if (!kavB) return -1;
        const cmp = compareKavling(kavA, kavB, direction);
        return cmp !== 0 ? cmp : a.id - b.id;
      });

      totalItems = matching.length;
      const pageIds = matching.slice(skip, skip + limit).map((r) => r.id);

      if (pageIds.length === 0) {
        items = [];
      } else {
        const unsorted = await this.db.customer.findMany({
          where: { id: { in: pageIds } },
        });
        const orderMap = new Map(pageIds.map((id, i) => [id, i]));
        items = [...unsorted].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
      }
    } else {
      [items, totalItems] = await Promise.all([
        this.db.customer.findMany({
          take: limit,
          skip,
          where,
          orderBy: orderByClause,
        }),
        this.db.customer.count({ where }),
      ]);
    }

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
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
  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("Customer tidak ditemukan");

    try {
      await this.db.customer.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictError(
          "Customer tidak dapat dihapus karena sudah memiliki data SPR/Booking.",
        );
      }
      throw error;
    }
  }
  async findByUserId(userId: number): Promise<Customer | null> {
    return await this.db.customer.findFirst({ where: { userId } });
  }
}
