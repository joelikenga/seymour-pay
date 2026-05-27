import { axios$ } from "../..";
import { normalizeTransactionRow } from "../../../lib/normalizeTransaction";
import type { Transaction } from "../../../types/transaction";

export type AdminGetTransactionsListParams = {
  page: number;
  page_size?: number;
  search?: string;
  /** Inclusive local `YYYY-MM-DD` - both sent when filtering by period. */
  from?: string;
  to?: string;
};

/** Paginated ledger: `{ data, page, page_size, total, total_pages }`. */
export const adminGetTransactionsList = async (
  params: AdminGetTransactionsListParams,
  signal?: AbortSignal,
): Promise<unknown> => {
  const page_size = params.page_size ?? 12;
  const hasRange =
    typeof params.from === "string" &&
    params.from.trim() !== "" &&
    typeof params.to === "string" &&
    params.to.trim() !== "";
  const trimmedSearch = params.search?.trim() ?? "";
  const data = await axios$.get("/admin/transactions", {
    signal,
    params: {
      page: params.page,
      page_size,
      ...(trimmedSearch
        ? { search: trimmedSearch, q: trimmedSearch }
        : {}),
      ...(hasRange
        ? { from: params.from!.trim(), to: params.to!.trim() }
        : {}),
    },
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