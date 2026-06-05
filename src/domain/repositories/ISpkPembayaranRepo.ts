import type {
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  SetBsiCmsDilaporkanDTO,
  SpkPembayaranFilterDTO,
  UpdateSpkKasbonDTO,
  UpdateSpkUpahDTO,
} from "../dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface ISpkPembayaranRepository {
  findBySpkId(spkId: number): Promise<SpkPembayaranEntity[]>;
  findById(id: number): Promise<SpkPembayaranEntity | null>;
  createRequest(data: CreateSpkPembayaranDTO): Promise<SpkPembayaranEntity>;
  findKasbonDraft(spkId: number, diajukanOlehId: number): Promise<SpkPembayaranEntity | null>;
  upsertKasbonDraft(
    spkId: number,
    diajukanOlehId: number,
    kasbonBaris: NonNullable<CreateSpkPembayaranDTO["kasbonBaris"]>,
  ): Promise<SpkPembayaranEntity>;
  submitKasbonDraft(spkId: number, diajukanOlehId: number): Promise<SpkPembayaranEntity>;
  markAsPaid(data: BayarSpkPembayaranDTO): Promise<SpkPembayaranEntity>;
  findPaginated(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>>;
  setBsiCmsDilaporkan(data: SetBsiCmsDilaporkanDTO): Promise<SpkPembayaranEntity[]>;
  updateKasbon(data: UpdateSpkKasbonDTO): Promise<SpkPembayaranEntity>;
  updateUpah(data: UpdateSpkUpahDTO): Promise<SpkPembayaranEntity>;
  deletePengurangan(id: number): Promise<void>;
}
