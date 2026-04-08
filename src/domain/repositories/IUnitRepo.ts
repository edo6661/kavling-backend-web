import type { Unit } from "@prisma/client";
import type {
  CreateUnitDTO,
  UpdateUnitDTO,
  UnitFilterDTO,
} from "../dtos/UnitDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IUnitRepository {
  create(data: CreateUnitDTO): Promise<Unit>;
  findById(id: number): Promise<Unit | null>;
  findByBlok(
    namaPerumahan: string,
    blok: string,
    nomorUnit: string,
  ): Promise<Unit | null>;
  update(id: number, data: UpdateUnitDTO): Promise<Unit>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: UnitFilterDTO,
  ): Promise<CursorPaginatedData<Unit>>;
}
