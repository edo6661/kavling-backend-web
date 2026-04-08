import type { Spr } from "@prisma/client";
import type {
  CreateSprDTO,
  UpdateSprDTO,
  SprFilterDTO,
  FastEntrySprDTO,
} from "../dtos/SprDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export interface ISprRepository {
  create(data: CreateSprDTO, nomorSpr: string): Promise<Spr>;
  createFastEntry(
    data: FastEntrySprDTO,
    fileUrls: Record<string, string | undefined>,
    nomorSpr: string,
  ): Promise<Spr>;
  findById(id: number): Promise<Spr | null>;
  findByNomor(nomorSpr: string): Promise<Spr | null>;
  update(id: number, data: UpdateSprDTO): Promise<Spr>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SprFilterDTO,
  ): Promise<CursorPaginatedData<Spr>>;
  findTrackRecordByCustomerId(customerId: number): Promise<Spr[]>;

  cancelSpr(id: number, alasanBatal: string): Promise<Spr>;
}
