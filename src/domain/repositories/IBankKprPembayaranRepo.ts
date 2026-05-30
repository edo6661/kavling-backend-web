import type {
  BayarBankKprPembayaranDTO,
  BankKprPembayaranFilterDTO,
  SetBankKprBsiCmsDilaporkanDTO,
} from "../dtos/BankKprPembayaranDTO.js";
import type { BankKprPembayaranEntity } from "../entities/BankKprPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface IBankKprPembayaranRepository {
  findById(id: number): Promise<BankKprPembayaranEntity | null>;
  markAsPaid(data: BayarBankKprPembayaranDTO): Promise<BankKprPembayaranEntity>;
  findPaginated(
    page: number,
    limit: number,
    filters?: BankKprPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<BankKprPembayaranEntity>>;
  setBsiCmsDilaporkan(
    data: SetBankKprBsiCmsDilaporkanDTO,
  ): Promise<BankKprPembayaranEntity[]>;
}
