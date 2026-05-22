import type { AgentEntity } from "../entities/Agent.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../dtos/AgentDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface IAgentRepository {
  create(data: CreateAgentDTO): Promise<AgentEntity>;
  findById(id: number): Promise<AgentEntity | null>;
  update(id: number, data: UpdateAgentDTO): Promise<AgentEntity>;
  delete(id: number): Promise<void>;
  findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: AgentFilterDTO,
  ): Promise<OffsetPaginatedData<AgentEntity>>;
  findByUserId(userId: number): Promise<AgentEntity | null>;
}
