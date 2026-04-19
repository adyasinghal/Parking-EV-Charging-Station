import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { chargersApi } from "../../api/chargers";
import { reservationsApi } from "../../api/reservations";
import { sessionsApi } from "../../api/sessions";
import { zonesApi } from "../../api/zones";
import ZonesPage from "./ZonesPage";

vi.mock("../../api/zones", () => ({
  zonesApi: {
    list: vi.fn(),
    spots: vi.fn(),
  },
}));

vi.mock("../../api/chargers", () => ({
  chargersApi: {
    list: vi.fn(),
  },
}));

vi.mock("../../api/reservations", () => ({
  reservationsApi: {
    list: vi.fn(),
  },
}));

vi.mock("../../api/sessions", () => ({
  sessionsApi: {
    list: vi.fn(),
  },
}));

describe("ZonesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders computed zone metrics in the table", async () => {
    vi.mocked(zonesApi.list).mockResolvedValue([
      { zone_id: 1, zone_name: "Downtown", city: "Boston", total_spots: 10, is_active: true },
    ]);
    vi.mocked(zonesApi.spots).mockResolvedValue([
      { spot_id: 11, zone_id: 1, spot_code: "D-1", type: "Car", status: "Open" },
      { spot_id: 12, zone_id: 1, spot_code: "D-2", type: "Car", status: "Open" },
    ]);
    vi.mocked(chargersApi.list).mockResolvedValue([
      { charger_id: 7, spot_id: 11, charger_code: "EV-7", charger_type: "DC", power_kw: 60, status: "Available" },
    ]);
    vi.mocked(reservationsApi.list).mockResolvedValue([]);
    vi.mocked(sessionsApi.list).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ZonesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Downtown")).toBeInTheDocument();
    const row = screen.getByText("Downtown").closest("tr");
    expect(row).not.toBeNull();
    if (row) {
      expect(within(row).getByText("Boston")).toBeInTheDocument();
      expect(within(row).getByText("10")).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "View" })).toBeInTheDocument();
  });

  it("filters zones by search text", async () => {
    vi.mocked(zonesApi.list).mockResolvedValue([
      { zone_id: 1, zone_name: "Downtown", city: "Boston", total_spots: 8, is_active: true },
      { zone_id: 2, zone_name: "Seaside", city: "Miami", total_spots: 8, is_active: true },
    ]);
    vi.mocked(zonesApi.spots).mockResolvedValue([]);
    vi.mocked(chargersApi.list).mockResolvedValue([]);
    vi.mocked(reservationsApi.list).mockResolvedValue([]);
    vi.mocked(sessionsApi.list).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ZonesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Downtown");
    fireEvent.change(screen.getByPlaceholderText("Search by zone or city"), { target: { value: "sea" } });

    expect(screen.queryByText("Downtown")).not.toBeInTheDocument();
    expect(screen.getByText("Seaside")).toBeInTheDocument();
  });
});

