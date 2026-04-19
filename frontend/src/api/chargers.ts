import api from "./client";
import type { EVCharger } from "../types";

export const chargersApi = {
  list: () => api.get<EVCharger[]>("/chargers").then((r) => r.data),
  getById: (id: number) => api.get<EVCharger>(`/chargers/${id}`).then((r) => r.data),
  create: (payload: {
    spot_id: number;
    charger_code: string;
    charger_type: string;
    power_kw: number;
    connector_type?: string;
    status?: string;
    installed_at?: string;
  }) => api.post<EVCharger>("/chargers", payload).then((r) => r.data),
  update: (id: number, payload: { status?: string; connector_type?: string }) =>
    api.put<EVCharger>(`/chargers/${id}`, payload).then((r) => r.data),
  logError: (id: number, payload: { error_code: string; error_message?: string }) =>
    api.post(`/chargers/${id}/errors`, payload).then((r) => r.data),
};
