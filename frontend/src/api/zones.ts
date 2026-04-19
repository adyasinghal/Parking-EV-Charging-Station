import api from "./client";
import type { Spot, Zone } from "../types";

export const zonesApi = {
  list: () => api.get<Zone[] | null>("/zones").then((r) => r.data ?? []),
  getById: (id: number) => api.get<Zone>(`/zones/${id}`).then((r) => r.data),
  spots: (id: number) => api.get<Spot[] | null>(`/zones/${id}/spots`).then((r) => r.data ?? []),
  create: (payload: { zone_name: string; city: string; address?: string; total_spots: number; is_active?: boolean }) =>
    api.post<Zone>("/zones", payload).then((r) => r.data),
  update: (id: number, payload: { zone_name?: string; city?: string; address?: string; total_spots?: number; is_active?: boolean }) =>
    api.put<Zone>(`/zones/${id}`, payload).then((r) => r.data),
};
