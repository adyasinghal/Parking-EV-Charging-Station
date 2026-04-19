import api from "./client";
import type { Vehicle } from "../types";

export const vehiclesApi = {
  list: () => api.get<Vehicle[] | null>("/vehicles").then((r) => r.data ?? []),
  create: (payload: {
    license_plate: string;
    make?: string;
    model?: string;
    year?: number;
    is_ev: boolean;
    battery_kw?: number;
  }) => api.post<Vehicle>("/vehicles", payload).then((r) => r.data),
  update: (
    id: number,
    payload: {
      license_plate?: string;
      make?: string;
      model?: string;
      year?: number;
      is_ev?: boolean;
      battery_kw?: number;
    },
  ) => api.put<Vehicle>(`/vehicles/${id}`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/vehicles/${id}`).then((r) => r.data),
};
