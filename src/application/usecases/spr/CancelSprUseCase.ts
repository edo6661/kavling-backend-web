import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { SprResponseDTO } from "../../../domain/dtos/SprDTO.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class CancelSprUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(id: number, alasanBatal: string): Promise<SprResponseDTO> {
    const spr = await this.sprRepo.cancelSpr(id, alasanBatal);
    return SprMapper.toDomain(spr);
  }
}
