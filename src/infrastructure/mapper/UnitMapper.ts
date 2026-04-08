import type { Unit as PrismaUnit } from "@prisma/client";
import type { UnitEntity } from "../../domain/entities/Unit.js";

export class UnitMapper {
  static toDomain(prismaUnit: PrismaUnit): UnitEntity {
    return {
      id: prismaUnit.id,
      namaPerumahan: prismaUnit.namaPerumahan,
      blok: prismaUnit.blok,
      nomorUnit: prismaUnit.nomorUnit,
      tipe: prismaUnit.tipe,
      luasTanah: prismaUnit.luasTanah,
      luasBangunan: prismaUnit.luasBangunan,
      lantai: prismaUnit.lantai,
      lokasiStrategis: prismaUnit.lokasiStrategis,
      status: prismaUnit.status,
      createdAt: prismaUnit.createdAt,
      updatedAt: prismaUnit.updatedAt,
    };
  }
}
