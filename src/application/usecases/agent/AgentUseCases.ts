import type { IAgentRepository } from "../../../domain/repositories/IAgentRepo.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../../../domain/dtos/AgentDTO.js";
import type { CursorPaginatedData } from "../../../types/response.js";
import type { AgentEntity } from "../../../domain/entities/Agent.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class CreateAgentUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(data: CreateAgentDTO): Promise<AgentEntity> {
    return await this.repo.create(data);
  }
}

export class UpdateAgentUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(id: number, data: UpdateAgentDTO): Promise<AgentEntity> {
    return await this.repo.update(id, data);
  }
}

export class GetAgentByIdUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(id: number): Promise<AgentEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Agent tidak ditemukan");
    return result;
  }
}

export class GetAgentsPaginatedUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(
    limit: number,
    cursor?: number,
    filters?: AgentFilterDTO,
  ): Promise<CursorPaginatedData<AgentEntity>> {
    return await this.repo.findWithCursorPagination(limit, cursor, filters);
  }
}

export class DeleteAgentUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
