import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";

export class DeleteSprUseCase {
  constructor(private readonly sprRepo: ISprRepository) {}

  async execute(id: number): Promise<void> {
    await this.sprRepo.delete(id);
  }
}
