import { axios$ } from "../..";
import { normalizeTransactionRow } from "../../../lib/normalizeTransaction";
import type { Transaction } from "../../../types/transaction";
import { getAdminToken, getToken } from "../../cookies";

export type AdminGetTransactionsListParams = {
  /** 1-based page index (matches the ledger API). */
  page: number;
  page_size?: number;
  /** Inclusive ISO datetimes, e.g. `2026-05-24T14:00:29.000Z`. */
  from?: string;
  to?: string;
  search?: string;
  status?: "completed";
};

function compactListParams(
  params: AdminGetTransactionsListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    page_size: params.page_size ?? 12,
  };
  if (typeof params.from === "string" && params.from.trim() !== "") {
    out.from = params.from.trim();
  }
  if (typeof params.to === "string" && params.to.trim() !== "") {
    out.to = params.to.trim();
  }
  if (typeof params.search === "string" && params.search.trim() !== "") {
    out.search = params.search.trim();
  }
  if (params.status) {
    out.status = params.status;
  }
  return out;
}

export type AdminExportTransactionsType = "pdf" | "xls" | "csv";

const EXPORT_ACCEPT: Record<AdminExportTransactionsType, string> = {
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

export type AdminExportTransactionsParams = {
  type: AdminExportTransactionsType;
  status?: "completed";
  /** Calendar dates `YYYY-MM-DD` (inclusive). */
  from?: string;
  to?: string;
};

async function messageFromResponseBlob(blob: Blob): Promise<string> {
  const text = (await blob.text()).trim();
  if (!text) return "Export failed.";
  try {
    const body = JSON.parse(text) as { message?: string; error?: string };
    return body.message?.trim() || body.error?.trim() || text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

function isErrorPayloadBlob(blob: Blob): boolean {
  const mime = blob.type.toLowerCase();
  return mime.includes("json") || mime.includes("text/html");
}

/**
 * `GET /admin/transactions/export` — server-rendered export file.
 * Uses `fetch` (not the shared axios client) so binary responses are not
 * mangled by the JSON response interceptor or opaque blob error bodies.
 */
export const adminExportTransactions = async (
  params: AdminExportTransactionsParams,
): Promise<Blob> => {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!base?.trim()) {
    throw new Error("API base URL is not configured.");
  }

  const qs = new URLSearchParams({ type: params.type });
  if (params.status) qs.set("status", params.status);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const token = getAdminToken() || getToken();
  const res = await fetch(`${base.replace(/\/$/, "")}/admin/transactions/export?${qs}`, {
    method: "GET",
    headers: {
      Accept: EXPORT_ACCEPT[params.type],
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const blob = await res.blob();

  if (!res.ok) {
    throw new Error(await messageFromResponseBlob(blob));
  }

  if (blob.size === 0) {
    throw new Error("Export returned an empty file.");
  }

  if (isErrorPayloadBlob(blob)) {
    throw new Error(await messageFromResponseBlob(blob));
  }

  const mime = blob.type || EXPORT_ACCEPT[params.type];
  return blob.type ? blob : new Blob([await blob.arrayBuffer()], { type: mime });
};

/** Trigger a browser download for an export blob. */
export function downloadTransactionExportFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Paginated ledger: `{ data, page, page_size, total, total_pages }`. */
export const adminGetTransactionsList = async (
  params: AdminGetTransactionsListParams,
  signal?: AbortSignal,
): Promise<unknown> => {
  const data = await axios$.get("/admin/transactions", {
    signal,
    params: compactListParams(params),
  });
  return data as unknown;
};

/**
 * `GET /admin/transactions/:id` - one ledger row.
 * Shape (camelCase): amount, channel, createdAt, customerName, id, notes, reference, status, vehicleType.
 * If the server wraps the row as `{ data: { ... } }`, that is unwrapped before normalization.
 */
function unwrapSingleTransactionBody(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  const inner = o.data;
  if (
    inner != null &&
    typeof inner === "object" &&
    !Array.isArray(inner)
  ) {
    return inner;
  }
  return raw;
}

export async function adminGetTransactionById(
  id: string,
): Promise<Transaction | null> {
  const raw = await axios$.get(`/admin/transactions/${encodeURIComponent(id)}`);
  return normalizeTransactionRow(unwrapSingleTransactionBody(raw));
}

/** Request body for `PATCH /admin/transactions/:id`. */
export type AdminPatchTransactionBody = {
  amount: number;
  channel: "cash" | "pos" | "transfer" | "ussd" | "epayment";
  createdAt: string;
  vehicleType: "car" | "small_SUV" | "big_SUV" | "bus" | "coaster";
};

/**
 * `PATCH /admin/transactions/:id` - response is the updated row (camelCase):
 * amount, channel, createdAt, customerName, id, notes, reference, status, vehicleType.
 * Same shape as {@link adminGetTransactionById}. Wrapped `{ data: row }` is unwrapped.
 */
export async function adminUpdateTransactionById(
  id: string,
  data: AdminPatchTransactionBody,
): Promise<Transaction | null> {
  const raw = await axios$.patch(
    `/admin/transactions/${encodeURIComponent(id)}`,
    data,
  );
  return normalizeTransactionRow(unwrapSingleTransactionBody(raw));
}

/**
 * Bulk delete - body `{ ids: string[] }` where each entry is a ticket reference
 * (e.g. `"TKT-001"`), not stringified JSON.
 */
export const adminDeleteBulkTransactions = async (ids: string[] | undefined) => {
  const list = [
    ...new Set(
      (ids ?? [])
        .map((x) => (typeof x === 'string' ? x.trim() : String(x ?? '').trim()))
        .filter((x) => x.length > 0),
    ),
  ];
  const response = await axios$.delete(`/admin/transactions`, {
    data: { ids: list },
    headers: { 'Content-Type': 'application/json' },
  });
  return response;
};
