import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo.js";
import type {
  CreateUnitDTO,
  UnitResponseDTO,
} from "../../../domain/dtos/UnitDTO.js";

export class CreateUnitUseCase {
  constructor(private readonly unitRepo: IUnitRepository) {}

  async execute(data: CreateUnitDTO): Promise<UnitResponseDTO> {
    const unit = await this.unitRepo.create(data);

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
