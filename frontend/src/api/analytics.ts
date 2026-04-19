import api from "./client";
import type {
  ChargerEfficiency,
  ChargerUtilization,
  HeatmapPoint,
  HighTrafficZone,
  OvertimeSession,
  ParkingOnlyUser,
  SessionFrequency,
  TopSpender,
  ZoneNoShowRate,
} from "../types";

function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const analyticsApi = {
  highTraffic: () => api.get<HighTrafficZone[] | null>("/analytics/high-traffic").then((r) => asList(r.data)),
  chargerEfficiency: () => api.get<ChargerEfficiency[] | null>("/analytics/charger-efficiency").then((r) => asList(r.data)),
  topSpenders: () => api.get<TopSpender[] | null>("/analytics/top-spenders").then((r) => asList(r.data)),
  noShowRate: () => api.get<ZoneNoShowRate[] | null>("/analytics/no-show-rate").then((r) => asList(r.data)),
  heatmap: (from?: string, to?: string) => {
    const qs = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : "";
    return api.get<HeatmapPoint[] | null>(`/analytics/heatmap${qs}`).then((r) => asList(r.data));
  },
  chargerUtilization: (from?: string, to?: string) => {
    const qs = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : "";
    return api.get<ChargerUtilization[] | null>(`/analytics/charger-utilization${qs}`).then((r) => asList(r.data));
  },
  parkingOnlyUsers: () => api.get<ParkingOnlyUser[] | null>("/analytics/parking-only-users").then((r) => asList(r.data)),
  overtimeSessions: () => api.get<OvertimeSession[] | null>("/analytics/overtime-sessions").then((r) => asList(r.data)),
  sessionFrequency: () => api.get<SessionFrequency[] | null>("/analytics/session-frequency").then((r) => asList(r.data)),
};
