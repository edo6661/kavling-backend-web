import type { UserEntity } from "../entities/User";
import type {
  RegisterUserDTO,
  UpdateUserDTO,
  UserFilterDTO,
} from "../dtos/UserDTO";
import type { CursorPaginatedData } from "../../types/response";

export interface IUserRepository {
  create(data: RegisterUserDTO): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  update(id: number, data: UpdateUserDTO): Promise<UserEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: UserFilterDTO,
  ): Promise<CursorPaginatedData<UserEntity>>;
}
