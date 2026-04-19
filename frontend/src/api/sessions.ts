import api from "./client";
import type { ChargingSession } from "../types";

type StartSessionPayload = {
  charger_id: number;
  vehicle_id: number;
  reservation_id?: number;
  kwh_start: number;
};

export const sessionsApi = {
  start: (payload: StartSessionPayload) => api.post<ChargingSession>("/sessions", payload).then((r) => r.data),
  active: async () => {
    try {
      const response = await api.get<ChargingSession>("/sessions/active");
      return response.data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw error;
    }
  },
  list: () => api.get<ChargingSession[] | null>("/sessions").then((r) => r.data ?? []),
  listAll: () => api.get<ChargingSession[] | null>("/sessions/admin/all").then((r) => r.data ?? []),
  end: (id: number, payload: { kwh_end: number; plug_out_time: string }) =>
    api.put<{ message: string; total_cost: number }>(`/sessions/${id}/end`, payload).then((r) => r.data),
};
