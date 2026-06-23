import { Prisma, Role, type Role as RoleType } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { IUserRepository } from "./IUserRepo";
import type { UserEntity } from "../entities/User";
import type {
  RegisterUserDTO,
  UpdateUserDTO,
  UserFilterDTO,
} from "../dtos/UserDTO";
import type { MandorRekeningInput } from "../mandor/mandorRekening.js";
import { UserMapper } from "../../infrastructure/mapper/UserMapper";
import { ConflictError } from "../errors/ConflictError";
import { NotFoundError } from "../errors/NotFoundError.js";
import type { CursorPaginatedData } from "../../types/response.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  private readonly userInclude = UserMapper.include;

  private async syncDefaultMandorRekening(
    tx: Prisma.TransactionClient,
    mandorId: number,
    data: {
      namaBank: string;
      noRekening: string;
      atasNamaRekening: string;
    },
  ) {
    const existingDefault = await tx.mandorRekening.findFirst({
      where: { mandorId, isDefault: true },
      orderBy: { id: "asc" },
    });

    if (existingDefault) {
      await tx.mandorRekening.update({
        where: { id: existingDefault.id },
        data: {
          namaBank: data.namaBank,
          noRekening: data.noRekening,
          atasNamaRekening: data.atasNamaRekening,
        },
      });
      return;
    }

    const anyRekening = await tx.mandorRekening.findFirst({
      where: { mandorId },
      orderBy: { id: "asc" },
    });

    if (anyRekening) {
      await tx.mandorRekening.update({
        where: { id: anyRekening.id },
        data: {
          isDefault: true,
          namaBank: data.namaBank,
          noRekening: data.noRekening,
          atasNamaRekening: data.atasNamaRekening,
        },
      });
      return;
    }

    await tx.mandorRekening.create({
      data: {
        mandorId,
        label: "Utama",
        namaBank: data.namaBank,
        noRekening: data.noRekening,
        atasNamaRekening: data.atasNamaRekening,
        isDefault: true,
      },
    });
  }

  private async syncMandorRekeningList(
    tx: Prisma.TransactionClient,
    mandorId: number,
    rekeningList: MandorRekeningInput[],
  ) {
    if (!rekeningList.length) {
      throw new Error("MANDOR_REKENING_EMPTY");
    }

    const normalized = rekeningList.map((item, index) => ({
      id: item.id,
      label: item.label?.trim() || (index === 0 ? "Utama" : `Rekening ${index + 1}`),
      namaBank: item.namaBank.trim(),
      noRekening: item.noRekening.trim(),
      atasNamaRekening: item.atasNamaRekening.trim(),
      isDefault: item.isDefault ?? false,
    }));

    const defaultCount = normalized.filter((item) => item.isDefault).length;
    if (defaultCount === 0) {
      normalized[0]!.isDefault = true;
    } else if (defaultCount > 1) {
      let foundDefault = false;
      for (const item of normalized) {
        if (item.isDefault && !foundDefault) {
          foundDefault = true;
          continue;
        }
        item.isDefault = false;
      }
    }

    const defaultRekening =
      normalized.find((item) => item.isDefault) ?? normalized[0]!;

    await tx.mandor.update({
      where: { id: mandorId },
      data: {
        namaBank: defaultRekening.namaBank,
        noRekening: defaultRekening.noRekening,
        atasNamaRekening: defaultRekening.atasNamaRekening,
      },
    });

    const existing = await tx.mandorRekening.findMany({
      where: { mandorId },
      select: { id: true },
    });
    const keepIds = new Set(
      normalized.map((item) => item.id).filter((id): id is number => !!id),
    );
    const deleteIds = existing
      .map((item) => item.id)
      .filter((id) => !keepIds.has(id));

    if (deleteIds.length) {
      await tx.mandorRekening.deleteMany({
        where: { id: { in: deleteIds }, mandorId },
      });
    }

    for (const item of normalized) {
      if (item.id) {
        await tx.mandorRekening.update({
          where: { id: item.id, mandorId },
          data: {
            label: item.label,
            namaBank: item.namaBank,
            noRekening: item.noRekening,
            atasNamaRekening: item.atasNamaRekening,
            isDefault: item.isDefault,
          },
        });
      } else {
        await tx.mandorRekening.create({
          data: {
            mandorId,
            label: item.label,
            namaBank: item.namaBank,
            noRekening: item.noRekening,
            atasNamaRekening: item.atasNamaRekening,
            isDefault: item.isDefault,
          },
        });
      }
    }
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: UserFilterDTO,
  ): Promise<CursorPaginatedData<UserEntity>> {
    const where: Prisma.UserWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { username: { contains: filters.search } },
        { email: { contains: filters.search } },
      ];
    }
    if (filters?.role) {
      where.role = filters.role;
    }

    let orderByClause: Prisma.UserOrderByWithRelationInput[] = [
      { createdAt: "desc" },
      { id: "asc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      const validFields = ["username", "email", "role", "createdAt"];
      if (validFields.includes(field)) {
        orderByClause = [{ [field]: direction }, { id: "asc" }];
      }
    }

    const items = await this.db.user.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: orderByClause,
      include: this.userInclude,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const nextCursor = hasNextPage ? (items.at(-1)?.id ?? null) : null;

    return {
      items: items.map((item) => UserMapper.toDomain(item)),
      meta: { nextCursor, hasNextPage },
    };
  }

  async create(data: RegisterUserDTO): Promise<UserEntity> {
    try {
      const result = await this.db.$transaction(async (tx) => {
        const createData: Prisma.UserCreateInput = {
          username: data.username,
          email: data.email,
          password: data.password ?? "",
          role: data.role,
        };

        if (data.mandor) {
          createData.mandorProfile = {
            create: {
              namaBank: data.mandor.namaBank,
              noRekening: data.mandor.noRekening,
              atasNamaRekening: data.mandor.atasNamaRekening,
              rekeningList: {
                create: {
                  label: "Utama",
                  namaBank: data.mandor.namaBank,
                  noRekening: data.mandor.noRekening,
                  atasNamaRekening: data.mandor.atasNamaRekening,
                  isDefault: true,
                },
              },
            },
          };
        }

        return tx.user.create({
          data: createData,
          include: this.userInclude,
        });
      });

      return UserMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Email sudah terdaftar");
      }
      throw error;
    }
  }

  async update(id: number, data: UpdateUserDTO): Promise<UserEntity> {
    try {
      const result = await this.db.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError("User tidak ditemukan");

        const updateData: Prisma.UserUpdateInput = {};

        if (data.username !== undefined) updateData.username = data.username;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.password !== undefined) updateData.password = data.password;
        if (data.role !== undefined) updateData.role = data.role;

        if (data.mandor !== undefined) {
          updateData.mandorProfile = {
            upsert: {
              create: {
                namaBank: data.mandor.namaBank,
                noRekening: data.mandor.noRekening,
                atasNamaRekening: data.mandor.atasNamaRekening,
              },
              update: {
                namaBank: data.mandor.namaBank,
                noRekening: data.mandor.noRekening,
                atasNamaRekening: data.mandor.atasNamaRekening,
              },
            },
          };
        }

        const updated = await tx.user.update({
          where: { id },
          data: updateData,
          include: this.userInclude,
        });

        if (data.mandor && updated.mandorProfile) {
          await this.syncDefaultMandorRekening(
            tx,
            updated.mandorProfile.id,
            data.mandor,
          );
        }

        if (data.mandorRekeningList?.length) {
          const defaultRek =
            data.mandorRekeningList.find((item) => item.isDefault) ??
            data.mandorRekeningList[0]!;
          let mandorProfileId = updated.mandorProfile?.id;
          if (!mandorProfileId) {
            const createdMandor = await tx.mandor.create({
              data: {
                userId: id,
                namaBank: defaultRek.namaBank.trim(),
                noRekening: defaultRek.noRekening.trim(),
                atasNamaRekening: defaultRek.atasNamaRekening.trim(),
              },
            });
            mandorProfileId = createdMandor.id;
          }
          await this.syncMandorRekeningList(
            tx,
            mandorProfileId,
            data.mandorRekeningList,
          );
        }

        if (data.role !== undefined && data.role !== Role.MANDOR) {
          await tx.mandor.deleteMany({ where: { userId: id } });
        }

        const refreshed = await tx.user.findUnique({
          where: { id },
          include: this.userInclude,
        });
        if (!refreshed) throw new NotFoundError("User tidak ditemukan");
        return refreshed;
      });

      return UserMapper.toDomain(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError("Email sudah digunakan user lain.");
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db.user.findUnique({
      where: { email },
      include: this.userInclude,
    });
    if (!result) return null;
    return UserMapper.toDomain(result);
  }

  async findById(id: number): Promise<UserEntity | null> {
    const result = await this.db.user.findUnique({
      where: { id },
      include: this.userInclude,
    });
    if (!result) return null;
    return UserMapper.toDomain(result);
  }

  async findAll(): Promise<UserEntity[]> {
    const results = await this.db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: this.userInclude,
    });
    return results.map((u) => UserMapper.toDomain(u));
  }

  async findByRole(role: RoleType) {
    return await this.db.user.findMany({
      where: { role },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    });
  }

  async findMandorRekeningByUserId(userId: number) {
    const mandor = await this.db.mandor.findUnique({
      where: { userId },
      include: {
        rekeningList: {
          orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        },
      },
    });
    if (!mandor) return null;
    return mandor.rekeningList.map((item) => ({
      id: item.id,
      label: item.label,
      namaBank: item.namaBank,
      noRekening: item.noRekening,
      atasNamaRekening: item.atasNamaRekening,
      isDefault: item.isDefault,
    }));
  }

  async delete(id: number): Promise<void> {
    const existing = await this.db.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("User tidak ditemukan");

    await this.db.user.delete({ where: { id } });
  }
}
