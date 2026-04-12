import type { CursorPaginatedData } from "../../types/response.js";
import type {
  CreateFeeAgentDTO,
  UpdateFeeAgentDTO,
  FeeAgentFilterDTO,
  FeeAgentResponseDTO,
} from "../dtos/FeeAgentDTO.js";

export interface IFeeAgentRepository {
  create(data: CreateFeeAgentDTO): Promise<FeeAgentResponseDTO>;
  update(id: number, data: UpdateFeeAgentDTO): Promise<FeeAgentResponseDTO>;
  findById(id: number): Promise<FeeAgentResponseDTO | null>;
  findByPenjualanId(penjualanId: number): Promise<FeeAgentResponseDTO | null>;
  findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: FeeAgentFilterDTO,
  ): Promise<CursorPaginatedData<FeeAgentResponseDTO>>;
}
