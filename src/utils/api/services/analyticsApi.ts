import { axios$ } from "../..";

export const adminGetAnalytics = async () => {
  const response = await axios$.get("/admin/analytics");
  return response;
};