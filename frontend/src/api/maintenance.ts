import api from "./client";
import type { MaintenanceAlert, MaintenanceRiskAlert } from "../types";

export const maintenanceApi = {
  alerts: () => api.get<MaintenanceAlert[] | null>("/maintenance/alerts").then((r) => r.data ?? []),
  resolve: (id: number) => api.put(`/maintenance/alerts/${id}/resolve`).then((r) => r.data),
  risk: () => api.get<MaintenanceRiskAlert[] | null>("/maintenance/risk").then((r) => r.data ?? []),
};
