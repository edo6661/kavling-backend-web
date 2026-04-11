import type {
  TagihanResponseDTO,
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
} from "../dtos/TagihanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface ITagihanRepository {
  create(
    data: CreateTagihanDTO,
    noTagihan: string,
  ): Promise<TagihanResponseDTO>;
  findById(id: number): Promise<TagihanResponseDTO | null>;
  update(id: number, data: UpdateTagihanDTO): Promise<TagihanResponseDTO>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: TagihanFilterDTO,
  ): Promise<CursorPaginatedData<TagihanResponseDTO>>;
  count(): Promise<number>;
}
