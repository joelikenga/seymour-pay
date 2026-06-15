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

const EXPORT_TIMEOUT_MS = 180_000
const EXPORT_MAX_ATTEMPTS = 3
const EXPORT_RETRY_STATUS = new Set([502, 503, 504])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function exportHttpError(status: number): string {
  if (status === 502) {
    return (
      "Export server timed out (502 Bad Gateway). The PDF may be too large for " +
      "the server — try a shorter date range, or wait a few seconds and retry."
    )
  }
  if (status === 503 || status === 504) {
    return `Export server unavailable (HTTP ${status}). Please try again shortly.`
  }
  if (status === 401 || status === 403) {
    return "Not authorized to export. Sign in again and retry."
  }
  return `Export failed (HTTP ${status}).`
}

async function messageFromBlob(blob: Blob): Promise<string> {
  const text = (await blob.text()).trim();
  if (!text) return "Export failed.";
  try {
    const body = JSON.parse(text) as { message?: string; error?: string };
    return body.message?.trim() || body.error?.trim() || text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

async function looksLikeJsonBlob(blob: Blob): Promise<boolean> {
  const head = (await blob.slice(0, 256).text()).trimStart();
  return head.startsWith("{") || head.startsWith("[");
}

function withExportMime(blob: Blob, mime: string): Blob {
  if (blob.type && blob.type !== "application/octet-stream") return blob;
  return new Blob([blob], { type: mime });
}

function exportMimeFromResponse(
  res: Response,
  type: AdminExportTransactionsType,
): string {
  const raw = res.headers.get("content-type")?.split(";")[0]?.trim();
  if (raw) return raw;
  return EXPORT_ACCEPT[type];
}

/**
 * `GET /admin/transactions/export` — server-rendered export file.
 * Retries transient gateway errors (502/503/504).
 */
export const adminExportTransactions = async (
  params: AdminExportTransactionsParams,
): Promise<Blob> => {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!base?.trim()) {
    throw new Error("API base URL is not configured.");
  }

  const from = params.from?.trim();
  const to = params.to?.trim();
  if (!from || !to) {
    throw new Error(
      "Pick a date range before exporting. The server requires from and to dates (YYYY-MM-DD).",
    );
  }

  const qs = new URLSearchParams({ type: params.type, from, to });
  if (params.status) qs.set("status", params.status);

  const token = getAdminToken() || getToken();
  const url = `${base.replace(/\/$/, "")}/admin/transactions/export?${qs}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= EXPORT_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      EXPORT_TIMEOUT_MS,
    );

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: EXPORT_ACCEPT[params.type],
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      const blob = await res.blob();

      if (!res.ok) {
        const detail =
          blob.size > 0
            ? await messageFromBlob(blob)
            : exportHttpError(res.status);
        lastError = new Error(detail);
        if (EXPORT_RETRY_STATUS.has(res.status) && attempt < EXPORT_MAX_ATTEMPTS) {
          await sleep(2000 * attempt);
          continue;
        }
        throw lastError;
      }

      if (blob.size === 0) {
        throw new Error("Export returned an empty file.");
      }

      if (await looksLikeJsonBlob(blob)) {
        throw new Error(await messageFromBlob(blob));
      }

      if (params.type === "pdf") {
        const sig = await blob.slice(0, 5).text();
        if (!sig.startsWith("%PDF")) {
          throw new Error(
            (await messageFromBlob(blob)) ||
              "Export did not return a valid PDF file.",
          );
        }
      }

      const mime = exportMimeFromResponse(res, params.type);
      return withExportMime(blob, mime);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error(
          "Export timed out while waiting for the server. Try a shorter date range.",
        );
        if (attempt < EXPORT_MAX_ATTEMPTS) {
          await sleep(2000 * attempt);
          continue;
        }
        throw lastError;
      }
      if (err instanceof TypeError) {
        lastError = new Error(
          "Could not reach the export server. Check your connection and try again.",
        );
        if (attempt < EXPORT_MAX_ATTEMPTS) {
          await sleep(2000 * attempt);
          continue;
        }
        throw lastError;
      }
      if (err instanceof Error) throw err;
      throw new Error("Export failed.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new Error("Export failed.");
};

/** Trigger a browser download for an export blob. */
export function downloadTransactionExportFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Keep the anchor and blob URL alive until the browser finishes the download.
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
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
