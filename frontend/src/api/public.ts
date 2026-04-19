import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1$/, "/api/v1");

const publicClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export type PublicStats = {
  total_spots: number;
  active_zones: number;
  cities: number;
  available_chargers: number;
  peak_power_kw: number;
  total_sessions: number;
};

export type PublicZone = {
  zone_id: number;
  zone_name: string;
  city: string;
  address?: string;
  total_spots: number;
  open_spots: number;
  available_chargers: number;
};

export const publicApi = {
  stats: () => publicClient.get<PublicStats>("/public/stats").then((r) => r.data),
  zones: () => publicClient.get<PublicZone[]>("/public/zones").then((r) => r.data),
};
