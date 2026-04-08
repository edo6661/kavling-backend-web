import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo.js";
import type {
  UnitFilterDTO,
  UnitResponseDTO,
} from "../../../domain/dtos/UnitDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";

export class GetUnitsPaginatedUseCase {
  constructor(private readonly unitRepo: IUnitRepository) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: UnitFilterDTO,
  ): Promise<CursorPaginatedData<UnitResponseDTO>> {
    const result = await this.unitRepo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );

    const mappedItems: UnitResponseDTO[] = result.items.map((unit) => ({
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
    }));

    return {
      items: mappedItems,
      meta: result.meta,
    };
  }
}
