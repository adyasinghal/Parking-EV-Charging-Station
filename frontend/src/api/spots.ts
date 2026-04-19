import api from "./client";
import type { Spot } from "../types";

export const spotsApi = {
  getById: (id: number) => api.get<Spot>(`/spots/${id}`).then((r) => r.data),
  availability: (id: number, start_time: string, end_time: string) =>
    api
      .get<{ spot_id: number; available: boolean; conflicts: Array<{ start_time: string; end_time: string }> }>(
        `/spots/${id}/availability?start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`,
      )
      .then((r) => r.data),
  create: (payload: { zone_id: number; spot_code: string; floor_level?: number; type: string; status?: string }) =>
    api.post<Spot>("/spots", payload).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    api.put<Spot>(`/spots/${id}/status`, { status }).then((r) => r.data),
};

