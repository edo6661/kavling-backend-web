import type { SprPayment } from "@prisma/client";
import type {
  CreateSprPaymentDTO,
  UpdateSprPaymentDTO,
  SprPaymentFilterDTO,
} from "../dtos/SprPaymentDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface ISprPaymentRepository {
  create(data: CreateSprPaymentDTO): Promise<SprPayment>;
  findById(id: number): Promise<SprPayment | null>;
  update(id: number, data: UpdateSprPaymentDTO): Promise<SprPayment>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SprPaymentFilterDTO,
  ): Promise<CursorPaginatedData<SprPayment>>;
}
