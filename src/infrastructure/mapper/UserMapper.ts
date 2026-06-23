import type { Prisma } from "@prisma/client";
import type { UserEntity } from "../../domain/entities/User.js";
import type { MandorRekeningSnapshot } from "../../domain/mandor/mandorRekening.js";

export const userInclude = {
  mandorProfile: {
    include: {
      rekeningList: {
        orderBy: [{ isDefault: "desc" as const }, { id: "asc" as const }],
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

export class UserMapper {
  static readonly include = userInclude;

  private static mapRekeningList(
    rekeningList: UserWithRelations["mandorProfile"] extends infer M
      ? M extends { rekeningList: infer R }
        ? R
        : never
      : never,
  ): MandorRekeningSnapshot[] {
    return (rekeningList ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      namaBank: item.namaBank,
      noRekening: item.noRekening,
      atasNamaRekening: item.atasNamaRekening,
      isDefault: item.isDefault,
    }));
  }

  static toDomain(prismaUser: UserWithRelations): UserEntity {
    const rekeningList = prismaUser.mandorProfile
      ? this.mapRekeningList(prismaUser.mandorProfile.rekeningList)
      : undefined;

    return {
      id: prismaUser.id,
      username: prismaUser.username,
      email: prismaUser.email,
      password: prismaUser.password,
      role: prismaUser.role,
      mandor: prismaUser.mandorProfile
        ? {
            namaBank: prismaUser.mandorProfile.namaBank,
            noRekening: prismaUser.mandorProfile.noRekening,
            atasNamaRekening: prismaUser.mandorProfile.atasNamaRekening,
            rekeningList,
          }
        : null,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
