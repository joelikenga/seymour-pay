import { axios$ } from "../..";
import { normalizeDashboardOverview } from "../../../lib/normalizeDashboardOverview";
import type { DashboardOverviewResponse } from "../../../types/dashboardOverview";

export const adminGetOverview = async (): Promise<DashboardOverviewResponse> => {
  const data = await axios$.get("/admin/analytics/dashboard");
  return normalizeDashboardOverview(data);
};

