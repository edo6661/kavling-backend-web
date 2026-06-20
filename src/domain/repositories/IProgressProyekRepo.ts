import type { ProgressProyekEntity } from "../entities/ProgressProyek.js";
import type {
  CreateProgressProyekByKavlingDTO,
  CreateProgressProyekDTO,
  ProgressInfraDetailDTO,
  ProgressInfraListFilterDTO,
  ProgressInfraListItemDTO,
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
  createByKavlingId(
    data: CreateProgressProyekByKavlingDTO,
  ): Promise<ProgressProyekEntity>;
  findByPenjualanId(penjualanId: number): Promise<ProgressProyekEntity | null>;
  findByKavlingId(kavlingId: number): Promise<ProgressProyekEntity | null>;
  findSpkMandorIdByPenjualanId(penjualanId: number): Promise<number | null>;
  findSpkMandorIdByKavlingId(kavlingId: number): Promise<number | null>;
  attachKavlingProgressToPenjualan(
    kavlingId: number,
    penjualanId: number,
  ): Promise<void>;
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
  addTahapanLogByKavlingId(
    kavlingId: number,
    logData: {
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: Date;
      foto: string[];
      reportedById?: number | null;
    },
  ): Promise<ProgressProyekEntity>;
  updateByKavlingId(
    kavlingId: number,
    data: UpdateProgressProyekDTO,
  ): Promise<ProgressProyekEntity>;

  setTotalPersentaseByKavlingId(
    kavlingId: number,
    persentase: number,
  ): Promise<ProgressProyekEntity>;

  resetTotalPersentaseByKavlingId(
    kavlingId: number,
  ): Promise<ProgressProyekEntity>;

  findInfraProyekListPaginated(
    page: number,
    limit: number,
    filters?: ProgressInfraListFilterDTO,
  ): Promise<OffsetPaginatedData<ProgressInfraListItemDTO>>;

  findInfraDetailBySpkId(spkId: number): Promise<ProgressInfraDetailDTO | null>;

  findSpkMandorIdBySpkId(spkId: number): Promise<number | null>;

  createBySpkId(spkId: number, mandorId?: number | null): Promise<ProgressProyekEntity>;

  addTahapanLogBySpkId(
    spkId: number,
    logData: {
      namaTahapan: string;
      persentase: number;
      deskripsi: string;
      tanggal: Date;
      foto: string[];
      reportedById?: number | null;
    },
  ): Promise<ProgressProyekEntity>;

  setTotalPersentaseBySpkId(
    spkId: number,
    persentase: number,
  ): Promise<ProgressProyekEntity>;

  resetTotalPersentaseBySpkId(spkId: number): Promise<ProgressProyekEntity>;
}
