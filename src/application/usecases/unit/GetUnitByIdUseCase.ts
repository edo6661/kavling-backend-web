import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo.js";
import type { UnitResponseDTO } from "../../../domain/dtos/UnitDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class GetUnitByIdUseCase {
  constructor(private readonly unitRepo: IUnitRepository) {}

  async execute(id: number): Promise<UnitResponseDTO> {
    const unit = await this.unitRepo.findById(id);

    if (!unit) {
      throw new NotFoundError("Unit tidak ditemukan");
    }

    return {
      id: unit.id,
      namaPerumahan: unit.namaPerumahan,
      blok: unit.blok,
      nomorUnit: unit.nomorUnit,
      tipe: unit.tipe,
      luasTanah: unit.luasTanah,
      luasBangunan: unit.luasBangunan,
      lantai: unit.lantai,
      lokasiStrategis: unit.lokasiStrategis,
      status: unit.status,
      createdAt: unit.createdAt,
    };
  }
}
