import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { SprResponseDTO } from "../../../domain/dtos/SprDTO.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class GetSprByIdUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(id: number): Promise<SprResponseDTO> {
    const spr = await this.sprRepo.findById(id);
    if (!spr) {
      throw new NotFoundError("Data SPR tidak ditemukan");
    }
    return SprMapper.toDomain(spr);
  }
}
