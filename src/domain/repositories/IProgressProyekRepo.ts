import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import type {
  CreateProgressProyekDTO,
  ProgressProyekListFilterDTO,
  ProgressProyekListItemDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface IProgressProyekRepository {
  findProyekListPaginated(
    page: number,
    limit: number,
    filters?: ProgressProyekListFilterDTO,
  ): Promise<OffsetPaginatedData<ProgressProyekListItemDTO>>;
  create(data: CreateProgressProyekDTO): Promise<ProgressProyekEntity>;
  findByPenjualanId(penjualanId: number): Promise<ProgressProyekEntity | null>;
  update(
    penjualanId: number,
    data: UpdateProgressProyekDTO,
  ): Promise<ProgressProyekEntity>;
  addTahapanLog(
    penjualanId: number,
    logData: {
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: Date;
      foto: string[];
      reportedById?: number | null;
    },
  ): Promise<ProgressProyekEntity>;
}
