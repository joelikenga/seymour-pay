import { axios$ } from "../..";
import { normalizeDashboardOverview } from "../../../lib/normalizeDashboardOverview";
import type { DashboardOverviewResponse } from "../../../types/dashboardOverview";

export const adminGetOverview = async (
  signal?: AbortSignal,
): Promise<DashboardOverviewResponse> => {
  const data = await axios$.get("/admin/analytics/dashboard", { signal });
  return normalizeDashboardOverview(data);
};

