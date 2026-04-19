import api from "./client";
import type { BillingRecord } from "../types";

export const billingApi = {
  listMine: () => api.get<BillingRecord[] | null>("/billing").then((r) => r.data ?? []),
  listAll: () => api.get<BillingRecord[] | null>("/billing/admin/all").then((r) => r.data ?? []),
};
