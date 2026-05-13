import type { PerusahaanAgentEntity } from "../entities/PerusahaanAgent.js";
import type {
  CreatePerusahaanAgentDTO,
  UpdatePerusahaanAgentDTO,
  PerusahaanAgentFilterDTO,
} from "../dtos/PerusahaanAgentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IPerusahaanAgentRepository {
  create(data: CreatePerusahaanAgentDTO): Promise<PerusahaanAgentEntity>;
  findById(id: number): Promise<PerusahaanAgentEntity | null>;
  update(
    id: number,
    data: UpdatePerusahaanAgentDTO,
  ): Promise<PerusahaanAgentEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PerusahaanAgentFilterDTO,
  ): Promise<CursorPaginatedData<PerusahaanAgentEntity>>;
}
