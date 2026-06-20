import type { IPekerjaanInfraRepository } from "../../../domain/repositories/pekerjaanInfraRepo.js";
import type {
  CreatePekerjaanInfraDTO,
  UpdatePekerjaanInfraDTO,
} from "../../../domain/dtos/PekerjaanInfraDTO.js";
import type { PekerjaanInfraEntity } from "../../../domain/entities/PekerjaanInfra.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class GetPekerjaanInfraListUseCase {
  constructor(private readonly repo: IPekerjaanInfraRepository) {}
  async execute(): Promise<PekerjaanInfraEntity[]> {
    return await this.repo.findAllActive();
  }
}

export class CreatePekerjaanInfraUseCase {
  constructor(private readonly repo: IPekerjaanInfraRepository) {}
  async execute(data: CreatePekerjaanInfraDTO): Promise<PekerjaanInfraEntity> {
    return await this.repo.create(data);
  }
}

export class UpdatePekerjaanInfraUseCase {
  constructor(private readonly repo: IPekerjaanInfraRepository) {}
  async execute(
    id: number,
    data: UpdatePekerjaanInfraDTO,
  ): Promise<PekerjaanInfraEntity> {
    return await this.repo.update(id, data);
  }
}

export class DeletePekerjaanInfraUseCase {
  constructor(private readonly repo: IPekerjaanInfraRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}

export class GetPekerjaanInfraByIdUseCase {
  constructor(private readonly repo: IPekerjaanInfraRepository) {}
  async execute(id: number): Promise<PekerjaanInfraEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Pekerjaan infrastruktur tidak ditemukan");
    return result;
  }
}
