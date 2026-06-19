import type {
  AgentPencairanFilterDTO,
  BayarAgentPencairanDTO,
  PersistAgentPencairanDTO,
  SetAgentBsiCmsDilaporkanDTO,
} from "../dtos/AgentPencairanDTO.js";
import type {
  AgentPencairanEntity,
  AgentPencairanTahap,
} from "../entities/AgentPencairan.js";
import type { OffsetPaginatedData } from "../../types/response.js";

export interface IAgentPencairanRepository {
  findById(id: number): Promise<AgentPencairanEntity | null>;
  findByFeeAgentId(feeAgentId: number): Promise<AgentPencairanEntity[]>;
  findByFeeAgentIdAndTahap(
    feeAgentId: number,
    tahap: AgentPencairanTahap,
  ): Promise<AgentPencairanEntity | null>;
  findPaginated(
    page: number,
    limit: number,
    filters?: AgentPencairanFilterDTO,
  ): Promise<OffsetPaginatedData<AgentPencairanEntity>>;
  create(data: PersistAgentPencairanDTO): Promise<AgentPencairanEntity>;
  updatePendingAjukan(
    id: number,
    data: {
      closingNominal: number;
      marketingNominal: number;
      potonganPph: number;
      totalNominal: number;
      fileInvoice?: string;
    },
  ): Promise<AgentPencairanEntity>;
  markAsPaid(data: BayarAgentPencairanDTO): Promise<AgentPencairanEntity>;
  setBsiCmsDilaporkan(
    data: SetAgentBsiCmsDilaporkanDTO,
  ): Promise<AgentPencairanEntity[]>;
}
