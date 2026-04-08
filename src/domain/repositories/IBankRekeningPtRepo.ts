import type { BankRekeningPt } from "@prisma/client";
import type {
  CreateBankRekeningPtDTO,
  UpdateBankRekeningPtDTO,
  BankRekeningPtFilterDTO,
} from "../dtos/BankRekeningPtDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface IBankRekeningPtRepository {
  create(data: CreateBankRekeningPtDTO): Promise<BankRekeningPt>;
  findById(id: number): Promise<BankRekeningPt | null>;
  update(id: number, data: UpdateBankRekeningPtDTO): Promise<BankRekeningPt>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: BankRekeningPtFilterDTO,
  ): Promise<CursorPaginatedData<BankRekeningPt>>;
}
