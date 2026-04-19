import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AnalyticsPage from "./AnalyticsPage";
import { analyticsApi } from "../../api/analytics";

vi.mock("../../api/analytics", () => ({
  analyticsApi: {
    highTraffic: vi.fn(),
    chargerEfficiency: vi.fn(),
    topSpenders: vi.fn(),
    noShowRate: vi.fn(),
    heatmap: vi.fn(),
    chargerUtilization: vi.fn(),
    parkingOnlyUsers: vi.fn(),
    overtimeSessions: vi.fn(),
    sessionFrequency: vi.fn(),
  },
}));

vi.mock("../../hooks/useSSE", () => ({
  useChargerSSE: vi.fn(),
}));

vi.mock("../../store/sseStore", () => ({
  useSSEStore: (selector: (state: { chargerStatuses: Record<number, unknown> }) => unknown) =>
    selector({ chargerStatuses: { 1: { charger_id: 1, status: "Available" } } }),
}));

function mockSuccessResponses() {
  vi.mocked(analyticsApi.highTraffic).mockResolvedValue([
    {
      zone_id: 1,
      zone_name: "Central Plaza",
      city: "Pune",
      total_sessions: 30,
      avg_session_hrs: 2.4,
      total_kwh_delivered: 180,
      total_revenue: 22500,
    },
  ]);
  vi.mocked(analyticsApi.chargerEfficiency).mockResolvedValue([
    {
      charger_id: 10,
      charger_code: "CH-10",
      charger_type: "DC_Fast",
      power_kw: 60,
      status: "Available",
      total_sessions: 20,
      avg_kwh_per_session: 12.5,
      total_errors: 2,
      maintenance_count: 1,
      error_rate_pct: 10,
    },
  ]);
  vi.mocked(analyticsApi.topSpenders).mockResolvedValue([
    { user_id: 11, full_name: "Aarav", email: "aarav@example.com", total_spend: 5200 },
  ]);
  vi.mocked(analyticsApi.noShowRate).mockResolvedValue([
    { zone_id: 1, zone_name: "Central Plaza", no_show_count: 2, total_count: 20, no_show_rate_pct: 10 },
  ]);
  vi.mocked(analyticsApi.heatmap).mockResolvedValue([
    { hour_of_day: "09", time_window: "09:00", sessions_started: 4 },
  ]);
  vi.mocked(analyticsApi.chargerUtilization).mockResolvedValue([
    { charger_id: 10, charger_code: "CH-10", total_sessions: 20, usage_hours: 8, utilization_pct: 66.5 },
  ]);
  vi.mocked(analyticsApi.parkingOnlyUsers).mockResolvedValue([
    { user_id: 34, full_name: "Meera", email: "meera@example.com" },
  ]);
  vi.mocked(analyticsApi.overtimeSessions).mockResolvedValue([
    { session_id: 100, user_id: 45, full_name: "Rohan", charger_code: "CH-10", duration_hours: 5.5 },
  ]);
  vi.mocked(analyticsApi.sessionFrequency).mockResolvedValue([
    { user_id: 45, full_name: "Rohan", session_count: 14 },
  ]);
}

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads analytics and lets admin switch tabs", async () => {
    mockSuccessResponses();

    render(<AnalyticsPage />);

    expect(await screen.findByText("High traffic zones")).toBeInTheDocument();
    expect(screen.getAllByText("Central Plaza").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Chargers" }));
    expect(await screen.findByText("Charger efficiency")).toBeInTheDocument();
    expect(screen.getAllByText("CH-10").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Demand" }));
    expect(await screen.findByText("Hourly demand heatmap")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
  });

  it("shows partial warning but keeps rendering successful sections", async () => {
    mockSuccessResponses();
    vi.mocked(analyticsApi.topSpenders).mockRejectedValue({ response: { data: { error: "top spenders unavailable" } } });

    render(<AnalyticsPage />);

    fireEvent.click(await screen.findByRole("tab", { name: "Billing" }));

    await waitFor(() => {
      expect(screen.getByText("top spenders unavailable")).toBeInTheDocument();
      expect(screen.getByText("No-show rate by zone")).toBeInTheDocument();
      expect(screen.getByText("Parking-only users")).toBeInTheDocument();
    });
  });
});

