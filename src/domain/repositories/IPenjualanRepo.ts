import type { Prisma } from "@prisma/client";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";
export type PenjualanWithRelations = Prisma.PenjualanGetPayload<{
  include: {
    customer: { select: { id: true; nama: true } };
    kavling: {
      select: {
        id: true;
        blok: true;
        nomorUnit: true;
        perumahan: { select: { nama: true } };
      };
    };
  };
}>;
export interface IPenjualanRepository {
  createWithTransaction(
    data: CreatePenjualanDTO,
  ): Promise<PenjualanWithRelations>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PenjualanFilterDTO,
  ): Promise<CursorPaginatedData<any>>;
}
