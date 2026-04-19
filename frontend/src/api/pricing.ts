import api from "./client";
import type { PricingRule } from "../types";

export const pricingApi = {
  list: () => api.get<PricingRule[]>("/pricing").then((r) => r.data),
  create: (payload: Omit<PricingRule, "rule_id">) =>
    api.post<PricingRule>("/pricing", payload).then((r) => r.data),
  update: (id: number, payload: Partial<Omit<PricingRule, "rule_id">>) =>
    api.put<PricingRule>(`/pricing/${id}`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/pricing/${id}`).then((r) => r.data),
};
