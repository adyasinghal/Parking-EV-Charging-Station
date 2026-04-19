import api from "./client";
import type { Reservation } from "../types";

export const reservationsApi = {
  list: () => api.get<Reservation[] | null>("/reservations").then((r) => r.data ?? []),
  listAll: () => api.get<Reservation[] | null>("/reservations/admin/all").then((r) => r.data ?? []),
  getById: (id: number) => api.get<Reservation>(`/reservations/${id}`).then((r) => r.data),
  create: (payload: {
    spot_id: number;
    vehicle_id?: number;
    start_time: string;
    end_time: string;
  }) => api.post<Reservation>("/reservations", payload).then((r) => r.data),
  cancel: (id: number) => api.delete(`/reservations/${id}`).then((r) => r.data),
};
