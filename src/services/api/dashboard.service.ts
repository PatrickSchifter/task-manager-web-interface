import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type DashboardSummaryDTO = components["schemas"]["DashboardSummaryDTO"];

class DashboardService {
  async getSummary(): Promise<DashboardSummaryDTO> {
    const api = await getServerApi();
    return api.get<DashboardSummaryDTO>("/v1/dashboard/summary");
  }
}

export const dashboardService = new DashboardService();
