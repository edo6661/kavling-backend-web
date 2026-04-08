import type { IUnitRepository } from "../../../domain/repositories/IUnitRepo.js";

export class DeleteUnitUseCase {
  constructor(private readonly unitRepo: IUnitRepository) {}

  async execute(id: number): Promise<void> {
    await this.unitRepo.delete(id);
  }
}
