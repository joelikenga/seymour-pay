import { axios$ } from "../..";

export type AdminGetSettlementParams = {
  page: number;
  page_size?: number;
  search?: string;
};

/** Paginated Fidelity settlement rows - matches `{ data, page, page_size, total, total_pages }`. */
export const adminGetSettlement = async (
  params: AdminGetSettlementParams,
): Promise<unknown> => {
  const page_size = params.page_size ?? 20;
  const search = params.search?.trim();
  const data = await axios$.get("/admin/settlement", {
    params: {
      page: params.page,
      page_size,
      ...(search ? { search } : {}),
    },
  });
  return data as unknown;
};
