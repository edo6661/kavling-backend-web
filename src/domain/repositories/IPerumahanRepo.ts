import type { Perumahan } from "@prisma/client";
import type {
  CreatePerumahanDTO,
  UpdatePerumahanDTO,
  PerumahanFilterDTO,
} from "../dtos/PerumahanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IPerumahanRepository {
  create(data: CreatePerumahanDTO): Promise<Perumahan>;
  findById(id: number): Promise<Perumahan | null>;
  update(id: number, data: UpdatePerumahanDTO): Promise<Perumahan>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PerumahanFilterDTO,
  ): Promise<CursorPaginatedData<Perumahan>>;
}
