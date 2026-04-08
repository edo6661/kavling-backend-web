import type { IUserRepository } from "../../../domain/repositories/IUserRepo";
import type {
  UserFilterDTO,
  UserResponseDTO,
} from "../../../domain/dtos/UserDTO";
import type { CursorPaginatedData } from "../../../types/response";

export class GetUsersPaginatedUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    limit: number,
    cursor?: number,
    filters?: UserFilterDTO,
  ): Promise<CursorPaginatedData<UserResponseDTO>> {
    const result = await this.userRepo.findWithCursorPagination(
      limit,
      cursor,
      filters,
    );

    const mappedItems: UserResponseDTO[] = result.items.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return {
      items: mappedItems,
      meta: result.meta,
    };
  }
}
