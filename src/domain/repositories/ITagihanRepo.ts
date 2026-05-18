import type {
  TagihanResponseDTO,
  CreateTagihanDTO,
  UpdateTagihanDTO,
  TagihanFilterDTO,
} from "../dtos/TagihanDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface ITagihanRepository {
  create(
    data: CreateTagihanDTO,
    noTagihan: string,
  ): Promise<TagihanResponseDTO>;
  findById(id: number): Promise<TagihanResponseDTO | null>;
  update(id: number, data: UpdateTagihanDTO): Promise<TagihanResponseDTO>;
  delete(id: number): Promise<void>;
  findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: TagihanFilterDTO,
  ): Promise<OffsetPaginatedData<TagihanResponseDTO>>;
  count(): Promise<number>;
  findByNoTagihan(noTagihan: string): Promise<TagihanResponseDTO | null>;
}
