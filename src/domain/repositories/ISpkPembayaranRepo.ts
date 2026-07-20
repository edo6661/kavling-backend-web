import type { Role } from "@prisma/client";
import type {
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  SetBsiCmsDilaporkanDTO,
  SpkPembayaranFilterDTO,
  SpkPembayaranKasbonBarisInput,
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
    kasbonBaris: SpkPembayaranKasbonBarisInput[],
  ): Promise<SpkPembayaranEntity>;
  submitKasbonDraft(
    spkId: number,
    diajukanOlehId: number,
    mandorRekeningId?: number,
    dokumen?: { dokumenInvoice: string; dokumenMaterial: string },
    spkProgress?: number,
  ): Promise<SpkPembayaranEntity>;
  markAsPaid(data: BayarSpkPembayaranDTO): Promise<SpkPembayaranEntity>;
  findPaginated(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>>;
  setBsiCmsDilaporkan(data: SetBsiCmsDilaporkanDTO): Promise<SpkPembayaranEntity[]>;
  updateKasbon(
    data: UpdateSpkKasbonDTO,
    options?: { force?: boolean },
  ): Promise<SpkPembayaranEntity>;
  updateUpah(
    data: UpdateSpkUpahDTO,
    options?: { force?: boolean },
  ): Promise<SpkPembayaranEntity>;
  deletePengurangan(id: number): Promise<void>;
  /** Hard delete semua jenis & status; sync nominal SPK. Khusus Superadmin. */
  forceDeletePembayaran(id: number): Promise<void>;
  approvePengajuan(
    id: number,
    disetujuiOlehId: number,
    userRole: Role,
  ): Promise<SpkPembayaranEntity>;
}
