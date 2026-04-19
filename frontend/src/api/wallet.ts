import api from "./client";
import type { BillingRecord, TopupRequest, Wallet } from "../types";

export const walletApi = {
  get: () => api.get<Wallet>("/wallet").then((r) => r.data),
  topUp: (amount: number) => api.post<Wallet>("/wallet/topup", { amount }).then((r) => r.data),
  transactions: () => api.get<BillingRecord[] | null>("/wallet/transactions").then((r) => r.data ?? []),
  requestTopUp: (amount: number, note?: string) =>
    api.post<TopupRequest>("/wallet/topup-request", { amount, note }).then((r) => r.data),
  myTopupRequests: () =>
    api.get<TopupRequest[] | null>("/wallet/topup-requests").then((r) => r.data ?? []),
  adminTopupRequests: () =>
    api.get<TopupRequest[] | null>("/wallet/topup-requests/admin").then((r) => r.data ?? []),
  approveTopup: (id: number) =>
    api.put(`/wallet/topup-requests/${id}/approve`).then((r) => r.data),
  rejectTopup: (id: number) =>
    api.put(`/wallet/topup-requests/${id}/reject`).then((r) => r.data),
};
