import { create } from "zustand";
import type { ChargerStatusEvent, SpotStatusEvent } from "../types";

interface SSEState {
  spotStatuses: Record<number, SpotStatusEvent>;
  chargerStatuses: Record<number, ChargerStatusEvent>;
  setSpots: (spots: SpotStatusEvent[]) => void;
  setChargers: (chargers: ChargerStatusEvent[]) => void;
}

export const useSSEStore = create<SSEState>((set) => ({
  spotStatuses: {},
  chargerStatuses: {},
  setSpots: (spots) =>
    set(() => ({
      spotStatuses: Object.fromEntries(spots.map((s) => [s.spot_id, s])),
    })),
  setChargers: (chargers) =>
    set(() => ({
      chargerStatuses: Object.fromEntries(chargers.map((c) => [c.charger_id, c])),
    })),
}));

