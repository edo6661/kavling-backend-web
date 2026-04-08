import type { DashboardSummaryResponseDTO } from "../dtos/DashboardDTO.js";

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummaryResponseDTO>;
}
