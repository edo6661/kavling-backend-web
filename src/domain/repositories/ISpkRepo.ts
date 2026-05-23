import type { CursorPaginatedData } from "../../types/response.js";
import type { CreateSpkDTO, SpkFilterDTO, UpdateSpkDTO } from "../dtos/SpkDTO.js";
import type { SpkEntity } from "../entities/Spk.js";

export interface ISpkRepository {
  create(data: CreateSpkDTO): Promise<SpkEntity>;
  findById(id: number): Promise<SpkEntity | null>;
  update(id: number, data: UpdateSpkDTO): Promise<SpkEntity>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SpkFilterDTO,
  ): Promise<CursorPaginatedData<SpkEntity>>;
  delete(id: number): Promise<void>;
  findKavlingIdsAssignedToOtherSpk(
    kavlingIds: number[],
    excludeSpkId?: number,
  ): Promise<number[]>;
}
