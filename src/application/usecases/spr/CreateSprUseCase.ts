import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type {
  CreateSprDTO,
  SprResponseDTO,
} from "../../../domain/dtos/SprDTO.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class CreateSprUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(data: CreateSprDTO): Promise<SprResponseDTO> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const nomorSpr = `SPR-${dateStr}-${randomStr}`;

    const spr = await this.sprRepo.create(data, nomorSpr);

    return SprMapper.toDomain(spr);
  }
}
