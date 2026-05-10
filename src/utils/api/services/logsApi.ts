import { axios$ } from "../..";
import type { AdminLogsPaginatedResponse } from "../../../types/adminLogs";

export type AdminGetLogsParams = {
  page: number;
  page_size?: number;
  action?: string;
};

export const adminGetLogs = async (
  params: AdminGetLogsParams,
): Promise<AdminLogsPaginatedResponse> => {
  const page_size = params.page_size ?? 50;
  const data = await axios$.get("/admin/logs", {
    params: {
      page: params.page,
      page_size,
      ...(params.action ? { action: params.action } : {}),
    },
  });
  return data as unknown as AdminLogsPaginatedResponse;
};

export type AdminAuditAction =
  | 'navigation'
  | 'login'
  | 'export'
  | 'reconciliation'
  | 'settings'

/** Body for `POST /admin/logs` */
export type AdminAuditLogPayload = {
  action: AdminAuditAction
  detail: string
  summary: string
}

export const adminAddLog = async (payload: AdminAuditLogPayload) => {
  return axios$.post('/admin/logs', {
    action: payload.action,
    detail: payload.detail,
    summary: payload.summary,
  })
}