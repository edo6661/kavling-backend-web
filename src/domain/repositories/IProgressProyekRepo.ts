import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import type {
  CreateProgressProyekDTO,
  UpdateProgressProyekDTO,
} from "../dtos/ProgressProyekDTO.js";

export interface IProgressProyekRepository {
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
