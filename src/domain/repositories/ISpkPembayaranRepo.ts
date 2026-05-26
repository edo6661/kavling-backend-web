import type {
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  SpkPembayaranFilterDTO,
} from "../dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface ISpkPembayaranRepository {
  findBySpkId(spkId: number): Promise<SpkPembayaranEntity[]>;
  findById(id: number): Promise<SpkPembayaranEntity | null>;
  createRequest(data: CreateSpkPembayaranDTO): Promise<SpkPembayaranEntity>;
  markAsPaid(data: BayarSpkPembayaranDTO): Promise<SpkPembayaranEntity>;
  findPaginated(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>>;
}
