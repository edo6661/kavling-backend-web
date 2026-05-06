import type {
  ProgressPenjualanResponseDTO,
  CreateProgressPenjualanDTO,
  UpdateProgressPenjualanDTO,
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
}
