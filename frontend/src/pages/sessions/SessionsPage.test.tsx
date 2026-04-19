import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { chargersApi } from "../../api/chargers";
import { sessionsApi } from "../../api/sessions";
import { vehiclesApi } from "../../api/vehicles";
import SessionsPage from "./SessionsPage";

vi.mock("../../api/sessions", () => ({
  sessionsApi: {
    start: vi.fn(),
    active: vi.fn(),
    list: vi.fn(),
    listAll: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../api/chargers", () => ({
  chargersApi: {
    list: vi.fn(),
  },
}));

vi.mock("../../api/vehicles", () => ({
  vehiclesApi: {
    list: vi.fn(),
  },
}));

describe("SessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a new session with selected charger and vehicle", async () => {
    vi.mocked(sessionsApi.list).mockResolvedValue([]);
    vi.mocked(sessionsApi.listAll).mockResolvedValue([]);
    vi.mocked(sessionsApi.active).mockResolvedValue(null);
    vi.mocked(chargersApi.list).mockResolvedValue([
      {
        charger_id: 14,
        spot_id: 5,
        charger_code: "EV-14",
        charger_type: "DC_Fast",
        power_kw: 80,
        status: "Available",
      },
    ]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      {
        vehicle_id: 8,
        user_id: 2,
        license_plate: "MH12AB1234",
        is_ev: true,
      },
    ]);
    vi.mocked(sessionsApi.start).mockResolvedValue({
      session_id: 51,
      charger_id: 14,
      vehicle_id: 8,
      plug_in_time: "2026-04-18T12:00:00Z",
      status: "Active",
      kwh_start: 0,
    });

    render(<SessionsPage />);

    await screen.findByText("Session actions");
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    await waitFor(() => {
      expect(sessionsApi.start).toHaveBeenCalledWith({
        charger_id: 14,
        vehicle_id: 8,
        reservation_id: undefined,
        kwh_start: 0,
      });
    });
  });

  it("ends the active session", async () => {
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        session_id: 1,
        charger_id: 14,
        vehicle_id: 8,
        plug_in_time: "2026-04-18T12:00:00Z",
        status: "Active",
        kwh_start: 2,
      },
    ]);
    vi.mocked(sessionsApi.listAll).mockResolvedValue([]);
    vi.mocked(sessionsApi.active).mockResolvedValue({
      session_id: 1,
      charger_id: 14,
      vehicle_id: 8,
      plug_in_time: "2026-04-18T12:00:00Z",
      status: "Active",
      kwh_start: 2,
    });
    vi.mocked(chargersApi.list).mockResolvedValue([]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      {
        vehicle_id: 8,
        user_id: 2,
        license_plate: "MH12AB1234",
        is_ev: true,
      },
    ]);
    vi.mocked(sessionsApi.end).mockResolvedValue({ message: "session ended", total_cost: 120 });

    render(<SessionsPage />);

    await screen.findByRole("button", { name: "End selected session" });
    fireEvent.change(screen.getByLabelText("kWh end"), { target: { value: "12.5" } });
    fireEvent.click(screen.getByRole("button", { name: "End selected session" }));

    await waitFor(() => {
      expect(sessionsApi.end).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          kwh_end: 12.5,
          plug_out_time: expect.any(String),
        }),
      );
    });
  });

  it("allows starting another session even when an active one exists", async () => {
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        session_id: 44,
        charger_id: 3,
        vehicle_id: 8,
        plug_in_time: "2026-04-18T12:00:00Z",
        status: "Complete",
        kwh_start: 2,
      },
    ]);
    vi.mocked(sessionsApi.listAll).mockResolvedValue([]);
    vi.mocked(sessionsApi.active).mockResolvedValue({
      session_id: 55,
      charger_id: 14,
      vehicle_id: 8,
      plug_in_time: "2026-04-18T12:00:00Z",
      status: "Active",
      kwh_start: 3,
    });
    vi.mocked(chargersApi.list).mockResolvedValue([
      {
        charger_id: 14,
        spot_id: 5,
        charger_code: "EV-14",
        charger_type: "DC_Fast",
        power_kw: 80,
        status: "Available",
      },
    ]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      {
        vehicle_id: 8,
        user_id: 2,
        license_plate: "MH12AB1234",
        is_ev: true,
      },
    ]);

    render(<SessionsPage />);

    expect(await screen.findByText(/Active sessions:/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start session" })).toBeEnabled();
    expect(screen.getByText("MH12AB1234 (#8)")).toBeInTheDocument();
  });

  it("uses meterless defaults for non-EV start and end", async () => {
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        session_id: 90,
        charger_id: 3,
        vehicle_id: 10,
        plug_in_time: "2026-04-18T12:00:00Z",
        status: "Active",
        kwh_start: 0.1,
      },
    ]);
    vi.mocked(sessionsApi.listAll).mockResolvedValue([]);
    vi.mocked(sessionsApi.active).mockResolvedValue(null);
    vi.mocked(chargersApi.list).mockResolvedValue([
      {
        charger_id: 14,
        spot_id: 5,
        charger_code: "EV-14",
        charger_type: "DC_Fast",
        power_kw: 80,
        status: "Available",
      },
    ]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      {
        vehicle_id: 10,
        user_id: 2,
        license_plate: "MH14CD7890",
        is_ev: false,
      },
    ]);
    vi.mocked(sessionsApi.start).mockResolvedValue({
      session_id: 91,
      charger_id: 14,
      vehicle_id: 10,
      plug_in_time: "2026-04-18T12:00:00Z",
      status: "Active",
      kwh_start: 0.1,
    });
    vi.mocked(sessionsApi.end).mockResolvedValue({ message: "session ended", total_cost: 0 });

    render(<SessionsPage />);

    await screen.findByText(/Non-EV vehicle selected/i);
    expect(screen.getByPlaceholderText("e.g. 12.3")).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Start session" }));

    await waitFor(() => {
      expect(sessionsApi.start).toHaveBeenCalledWith({
        charger_id: 14,
        vehicle_id: 10,
        reservation_id: undefined,
        kwh_start: 0.1,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "End selected session" }));

    await waitFor(() => {
      expect(sessionsApi.end).toHaveBeenCalledWith(
        90,
        expect.objectContaining({
          kwh_end: 0.1,
          plug_out_time: expect.any(String),
        }),
      );
    });
  });

  it("ends whichever active session is selected", async () => {
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        session_id: 100,
        charger_id: 7,
        vehicle_id: 8,
        plug_in_time: "2026-04-18T10:00:00Z",
        status: "Active",
        kwh_start: 2,
      },
      {
        session_id: 101,
        charger_id: 9,
        vehicle_id: 9,
        plug_in_time: "2026-04-18T11:00:00Z",
        status: "Active",
        kwh_start: 3,
      },
    ]);
    vi.mocked(sessionsApi.listAll).mockResolvedValue([]);
    vi.mocked(sessionsApi.active).mockResolvedValue(null);
    vi.mocked(chargersApi.list).mockResolvedValue([]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      { vehicle_id: 8, user_id: 2, license_plate: "AA11", is_ev: true },
      { vehicle_id: 9, user_id: 2, license_plate: "BB22", is_ev: true },
    ]);
    vi.mocked(sessionsApi.end).mockResolvedValue({ message: "session ended", total_cost: 120 });

    render(<SessionsPage />);

    await screen.findByLabelText("Session to end");
    fireEvent.change(screen.getByLabelText("Session to end"), { target: { value: "101" } });
    fireEvent.change(screen.getByLabelText("kWh end"), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "End selected session" }));

    await waitFor(() => {
      expect(sessionsApi.end).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          kwh_end: 15,
          plug_out_time: expect.any(String),
        }),
      );
    });
  });
});

