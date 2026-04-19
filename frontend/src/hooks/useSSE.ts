import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSSEStore } from "../store/sseStore";
import type { ChargerStatusEvent, SpotStatusEvent } from "../types";

function getBaseApi() {
  return import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
}

export function useSpotSSE(zoneId: number | null) {
  const token = useAuthStore((s) => s.token);
  const setSpots = useSSEStore((s) => s.setSpots);

  useEffect(() => {
    if (!token || !zoneId) {
      return;
    }
    const es = new EventSource(`${getBaseApi()}/sse/spots/${zoneId}?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      const payload = JSON.parse(e.data) as SpotStatusEvent[];
      setSpots(payload);
    };
    return () => es.close();
  }, [token, zoneId, setSpots]);
}

export function useChargerSSE(enabled: boolean) {
  const token = useAuthStore((s) => s.token);
  const setChargers = useSSEStore((s) => s.setChargers);

  useEffect(() => {
    if (!token || !enabled) {
      return;
    }
    const es = new EventSource(`${getBaseApi()}/sse/chargers?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      const payload = JSON.parse(e.data) as ChargerStatusEvent[];
      setChargers(payload);
    };
    return () => es.close();
  }, [token, enabled, setChargers]);
}

