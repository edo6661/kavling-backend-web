import type { DetailKavlingPajakEntity } from "../entities/DetailKavlingPajak.js";
import type {
  CreateDetailKavlingPajakDTO,
  UpdateDetailKavlingPajakDTO,
} from "../dtos/DetailKavlingPajakDTO.js";

export interface IDetailKavlingPajakRepository {
  create(data: CreateDetailKavlingPajakDTO): Promise<DetailKavlingPajakEntity>;
  update(
    penjualanId: number,
    data: UpdateDetailKavlingPajakDTO,
  ): Promise<DetailKavlingPajakEntity>;
  findByPenjualanId(
    penjualanId: number,
  ): Promise<DetailKavlingPajakEntity | null>;
}
