import { axios$ } from "../..";

export type AdminGetSettlementParams = {
  page: number;
  page_size?: number;
};

/** Paginated Fidelity settlement rows — matches `{ data, page, page_size, total, total_pages }`. */
export const adminGetSettlement = async (
  params: AdminGetSettlementParams,
): Promise<unknown> => {
  const page_size = params.page_size ?? 20;
  const data = await axios$.get("/admin/settlement", {
    params: {
      page: params.page,
      page_size,
    },
  });
  return data as unknown;
};
