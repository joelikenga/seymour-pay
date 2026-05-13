import axiosInstance from "./axios/axiosConfig";
import { AuthApi, OverviewApi, TransactionsApi, SettlementApi, PublicApi, LogsApi, UsersApi } from "./api";

export {
    axiosInstance as axios$,
    AuthApi,
    OverviewApi,
    TransactionsApi,
    SettlementApi,
    PublicApi,
    LogsApi,
    UsersApi,
};
