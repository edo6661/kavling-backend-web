import type { KavlingEntity } from "../entities/Kavling.js";
import type {
  CreateKavlingDTO,
  UpdateKavlingDTO,
  KavlingFilterDTO,
  KavlingPengeluaranExportRow,
} from "../dtos/KavlingDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface IKavlingRepository {
  create(data: CreateKavlingDTO): Promise<KavlingEntity>;
  findById(id: number): Promise<KavlingEntity | null>;
  update(id: number, data: UpdateKavlingDTO): Promise<KavlingEntity>;
  delete(id: number): Promise<void>;
  findWithCursorPagination(
    page: number,
    limit: number,
    filters?: KavlingFilterDTO,
  ): Promise<OffsetPaginatedData<KavlingEntity>>;
  findAll(filters?: KavlingFilterDTO): Promise<KavlingEntity[]>;
  findAllForPengeluaranExport(
    filters?: KavlingFilterDTO,
  ): Promise<KavlingPengeluaranExportRow[]>;
  upsertSertifikatTambahanDocument(
    kavlingId: number,
    urutan: number,
    docType: "filePbg" | "fileSertifikatTanah" | "fileNopPbb",
    fileUrl: string,
  ): Promise<KavlingEntity>;
}
