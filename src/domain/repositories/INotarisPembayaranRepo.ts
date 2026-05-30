import type {
  BayarNotarisPembayaranDTO,
  NotarisPembayaranFilterDTO,
  SetNotarisBsiCmsDilaporkanDTO,
} from "../dtos/NotarisPembayaranDTO.js";
import type { NotarisPembayaranEntity } from "../entities/NotarisPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface INotarisPembayaranRepository {
  findById(id: number): Promise<NotarisPembayaranEntity | null>;
  markAsPaid(data: BayarNotarisPembayaranDTO): Promise<NotarisPembayaranEntity>;
  findPaginated(
    page: number,
    limit: number,
    filters?: NotarisPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<NotarisPembayaranEntity>>;
  setBsiCmsDilaporkan(
    data: SetNotarisBsiCmsDilaporkanDTO,
  ): Promise<NotarisPembayaranEntity[]>;
}
