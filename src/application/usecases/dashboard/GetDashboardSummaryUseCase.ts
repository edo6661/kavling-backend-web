import type { IDashboardRepository } from "../../../domain/repositories/IDashboardRepo.js";
import type { DashboardSummaryResponseDTO } from "../../../domain/dtos/DashboardDTO.js";

export class GetDashboardSummaryUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async execute(): Promise<DashboardSummaryResponseDTO> {
    return await this.dashboardRepo.getSummary();
  }
}
