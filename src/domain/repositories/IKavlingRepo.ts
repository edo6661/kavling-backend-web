import type { KavlingEntity } from "../entities/Kavling.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
} from "../dtos/KavlingDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IKavlingRepository {
  create(data: CreateKavlingDTO): Promise<KavlingEntity>;
  findById(id: number): Promise<KavlingEntity | null>;
  update(id: number, data: UpdateKavlingDTO): Promise<KavlingEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: KavlingFilterDTO,
  ): Promise<CursorPaginatedData<KavlingEntity>>;
}
