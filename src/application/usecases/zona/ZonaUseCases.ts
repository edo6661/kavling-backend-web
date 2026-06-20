import type { IZonaRepository } from "../../../domain/repositories/zonaRepo.js";
import type {
  CreateZonaDTO,
  UpdateZonaDTO,
  ZonaFilterDTO,
} from "../../../domain/dtos/ZonaDTO.js";
import type { ZonaEntity } from "../../../domain/entities/Zona.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class CreateZonaUseCase {
  constructor(private readonly repo: IZonaRepository) {}
  async execute(data: CreateZonaDTO): Promise<ZonaEntity> {
    return await this.repo.create(data);
  }
}

export class UpdateZonaUseCase {
  constructor(private readonly repo: IZonaRepository) {}
  async execute(id: number, data: UpdateZonaDTO): Promise<ZonaEntity> {
    return await this.repo.update(id, data);
  }
}

export class GetZonaByIdUseCase {
  constructor(private readonly repo: IZonaRepository) {}
  async execute(id: number): Promise<ZonaEntity> {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundError("Zona tidak ditemukan");
    return result;
  }
}

export class GetZonaListUseCase {
  constructor(private readonly repo: IZonaRepository) {}
  async execute(filters?: ZonaFilterDTO): Promise<ZonaEntity[]> {
    return await this.repo.findAll(filters);
  }
}

export class DeleteZonaUseCase {
  constructor(private readonly repo: IZonaRepository) {}
  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
