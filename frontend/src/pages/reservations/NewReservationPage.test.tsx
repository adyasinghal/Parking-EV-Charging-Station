import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { spotsApi } from "../../api/spots";
import { zonesApi } from "../../api/zones";
import { vehiclesApi } from "../../api/vehicles";
import NewReservationPage from "./NewReservationPage";

const mockedNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockedNavigate,
}));

vi.mock("../../api/zones", () => ({
  zonesApi: {
    list: vi.fn(),
    spots: vi.fn(),
  },
}));

vi.mock("../../api/vehicles", () => ({
  vehiclesApi: {
    list: vi.fn(),
  },
}));

vi.mock("../../api/spots", () => ({
  spotsApi: {
    availability: vi.fn(),
  },
}));

vi.mock("../../api/reservations", () => ({
  reservationsApi: {
    create: vi.fn(),
  },
}));

describe("NewReservationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps reserved spots visible for time-window based booking", async () => {
    vi.mocked(zonesApi.list).mockResolvedValue([
      { zone_id: 1, zone_name: "Downtown", city: "Pune", total_spots: 10, is_active: true },
    ]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([]);
    vi.mocked(zonesApi.spots).mockResolvedValue([
      {
        spot_id: 101,
        zone_id: 1,
        spot_code: "A-01",
        floor_level: 1,
        type: "Standard",
        status: "Reserved",
      },
      {
        spot_id: 102,
        zone_id: 1,
        spot_code: "A-02",
        floor_level: 1,
        type: "Standard",
        status: "Under_Maintenance",
      },
    ]);

    render(<NewReservationPage />);

    const zoneSelect = await screen.findByLabelText("Zone");
    fireEvent.change(zoneSelect, { target: { value: "1" } });

    await waitFor(() => {
      expect(zonesApi.spots).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText(/A-01/)).toBeInTheDocument();
    expect(screen.queryByText(/A-02/)).not.toBeInTheDocument();
  });

  it("shows conflicting reservation windows when spot is unavailable", async () => {
    vi.mocked(zonesApi.list).mockResolvedValue([
      { zone_id: 1, zone_name: "Downtown", city: "Pune", total_spots: 10, is_active: true },
    ]);
    vi.mocked(vehiclesApi.list).mockResolvedValue([]);
    vi.mocked(zonesApi.spots).mockResolvedValue([
      {
        spot_id: 101,
        zone_id: 1,
        spot_code: "A-01",
        floor_level: 1,
        type: "Standard",
        status: "Reserved",
      },
    ]);
    vi.mocked(spotsApi.availability).mockResolvedValue({
      spot_id: 101,
      available: false,
      conflicts: [
        { start_time: "2026-04-18T09:00:00Z", end_time: "2026-04-18T10:00:00Z" },
        { start_time: "2026-04-18T10:30:00Z", end_time: "2026-04-18T11:00:00Z" },
      ],
    });

    render(<NewReservationPage />);

    fireEvent.change(await screen.findByLabelText("Zone"), { target: { value: "1" } });
    fireEvent.click(await screen.findByRole("button", { name: /A-01/ }));
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));

    fireEvent.change(screen.getByLabelText("Start time"), { target: { value: "2026-04-18T09:15" } });
    fireEvent.change(screen.getByLabelText("End time"), { target: { value: "2026-04-18T10:45" } });
    fireEvent.click(screen.getByRole("button", { name: "Check availability" }));

    expect(await screen.findByText("Conflicting reservations:")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
  });
});

