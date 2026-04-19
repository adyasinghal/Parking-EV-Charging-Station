import { useSSEStore } from "./sseStore";

describe("useSSEStore", () => {
  beforeEach(() => {
    useSSEStore.setState({
      spotStatuses: {},
      chargerStatuses: {},
      setSpots: useSSEStore.getState().setSpots,
      setChargers: useSSEStore.getState().setChargers,
    });
  });

  it("normalizes spot status payload by spot_id", () => {
    useSSEStore.getState().setSpots([
      { spot_id: 1, status: "Available" },
      { spot_id: 2, status: "Occupied" },
    ]);

    const state = useSSEStore.getState();
    expect(state.spotStatuses[1].status).toBe("Available");
    expect(state.spotStatuses[2].status).toBe("Occupied");
  });

  it("normalizes charger status payload by charger_id", () => {
    useSSEStore.getState().setChargers([
      { charger_id: 7, charger_code: "C-007", status: "Available" },
      { charger_id: 8, charger_code: "C-008", status: "In_Use" },
    ]);

    const state = useSSEStore.getState();
    expect(state.chargerStatuses[7].charger_code).toBe("C-007");
    expect(state.chargerStatuses[8].status).toBe("In_Use");
  });
});

