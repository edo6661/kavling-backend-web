import type { AgentEntity } from "../entities/Agent.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../dtos/AgentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IAgentRepository {
  create(data: CreateAgentDTO): Promise<AgentEntity>;
  findById(id: number): Promise<AgentEntity | null>;
  update(id: number, data: UpdateAgentDTO): Promise<AgentEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: AgentFilterDTO,
  ): Promise<CursorPaginatedData<AgentEntity>>;
  findByUserId(userId: number): Promise<AgentEntity | null>;
}
