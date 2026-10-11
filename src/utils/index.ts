import axiosInstance from "./axios/axiosConfig";
import { AuthApi, OverviewApi, TransactionsApi, SettlementApi, PublicApi, LogsApi, UsersApi, CashierAccountsApi } from "./api";

export {
    axiosInstance as axios$,
    AuthApi,
    OverviewApi,
    TransactionsApi,
    SettlementApi,
    PublicApi,
    LogsApi,
    UsersApi,
    CashierAccountsApi,
};
