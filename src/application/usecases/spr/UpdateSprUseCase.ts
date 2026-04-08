import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type {
  UpdateSprDTO,
  SprResponseDTO,
} from "../../../domain/dtos/SprDTO.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class UpdateSprUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(id: number, data: UpdateSprDTO): Promise<SprResponseDTO> {
    const spr = await this.sprRepo.update(id, data);
    return SprMapper.toDomain(spr);
  }
}
