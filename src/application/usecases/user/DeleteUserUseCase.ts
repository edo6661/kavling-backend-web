import type { IUserRepository } from "../../../domain/repositories/IUserRepo.js";

export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }
}
