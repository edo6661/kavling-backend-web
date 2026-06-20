import type {
  ProgressPenjualanResponseDTO,
  CreateProgressPenjualanDTO,
  UpdateProgressPenjualanDTO,
  UpdateProgressSertifikatTambahanDTO,
} from "../dtos/ProgressPenjualanDTO.js";

export interface IProgressPenjualanRepository {
  create(
    data: CreateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO>;
  findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressPenjualanResponseDTO | null>;
  update(
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO>;
  getJumlahSertifikatTanah(penjualanId: number): Promise<number>;
  updateSertifikatTambahan(
    penjualanId: number,
    urutan: number,
    data: UpdateProgressSertifikatTambahanDTO,
  ): Promise<ProgressPenjualanResponseDTO>;
  uploadSertifikatTambahanDocument(
    penjualanId: number,
    urutan: number,
    docType: "filePpjb" | "fileAjb",
    fileUrl: string,
  ): Promise<ProgressPenjualanResponseDTO>;
  findSertifikatTambahanFileUrl(
    penjualanId: number,
    urutan: number,
    docType: "filePpjb" | "fileAjb",
  ): Promise<string | null>;
}
