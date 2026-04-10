import type { NotarisEntity } from "../entities/Notaris.js";
import type {
  CreateNotarisDTO,
  UpdateNotarisDTO,
  NotarisFilterDTO,
} from "../dtos/NotarisDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface INotarisRepository {
  create(data: CreateNotarisDTO): Promise<NotarisEntity>;
  findById(id: number): Promise<NotarisEntity | null>;
  update(id: number, data: UpdateNotarisDTO): Promise<NotarisEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: NotarisFilterDTO,
  ): Promise<CursorPaginatedData<NotarisEntity>>;
}
