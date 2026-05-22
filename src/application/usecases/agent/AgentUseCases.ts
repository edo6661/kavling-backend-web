import type { IAgentRepository } from "../../../domain/repositories/IAgentRepo.js";
import type {
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentFilterDTO,
} from "../../../domain/dtos/AgentDTO.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import type { AgentEntity } from "../../../domain/entities/Agent.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";

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
    page: number,
    limit: number,
    filters?: AgentFilterDTO,
  ): Promise<OffsetPaginatedData<AgentEntity>> {
    return await this.repo.findWithOffsetPagination(page, limit, filters);
  }
}
export class DeleteAgentUseCase {
  constructor(
    private readonly repo: IAgentRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: number): Promise<void> {
    const agent = await this.repo.findById(id);
    if (!agent) throw new NotFoundError("Agent tidak ditemukan");

    const filesToDelete = [
      agent.fileKtp,
      agent.fileNpwp,
      agent.kwitansiBookingFee,
      agent.fileSuratPernyataan,
      agent.fileSuratKeterangan,
      agent.fileKtpDirektur,
      agent.fileNpwpPerusahaan,
    ].filter(Boolean) as string[];

    for (const url of filesToDelete) {
      await this.cloudinaryService
        .deleteImageByUrl(url)
        .catch((err) =>
          console.error(`Gagal hapus file saat delete agent: ${url}`, err),
        );
    }

    await this.repo.delete(id);
  }
}
export class GetAgentProfileUseCase {
  constructor(private readonly repo: IAgentRepository) {}
  async execute(userId: number): Promise<AgentEntity> {
    const result = await this.repo.findByUserId(userId);
    if (!result)
      throw new NotFoundError(
        "Profil agent tidak ditemukan. Pastikan akun tertaut dengan benar.",
      );
    return result;
  }
}
