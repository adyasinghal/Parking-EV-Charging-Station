import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MaintenancePage from "./MaintenancePage";
import { maintenanceApi } from "../../api/maintenance";

vi.mock("../../api/maintenance", () => ({
  maintenanceApi: {
    alerts: vi.fn(),
    risk: vi.fn(),
    resolve: vi.fn(),
  },
}));

describe("MaintenancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders alerts and risk data on load", async () => {
    vi.mocked(maintenanceApi.alerts).mockResolvedValue([
      {
        alert_id: 1,
        charger_id: 9,
        charger_code: "C-09",
        reason: "Cable fault",
        raised_at: "2026-04-17T10:00:00Z",
        is_resolved: false,
      },
    ]);
    vi.mocked(maintenanceApi.risk).mockResolvedValue([
      { charger_id: 9, charger_code: "C-09", errors_last_24h: 4 },
    ]);

    render(<MaintenancePage />);

    expect(await screen.findByText("Cable fault")).toBeInTheDocument();
    expect(screen.getAllByText("C-09").length).toBeGreaterThan(0);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("resolves an alert and reloads data", async () => {
    vi.mocked(maintenanceApi.alerts)
      .mockResolvedValueOnce([
        {
          alert_id: 2,
          charger_id: 3,
          charger_code: "C-03",
          reason: "Overheat",
          raised_at: "2026-04-17T11:00:00Z",
          is_resolved: false,
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(maintenanceApi.risk).mockResolvedValue([]);
    vi.mocked(maintenanceApi.resolve).mockResolvedValue({ message: "ok" });

    render(<MaintenancePage />);

    const button = await screen.findByRole("button", { name: "Resolve" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(maintenanceApi.resolve).toHaveBeenCalledWith(2);
      expect(maintenanceApi.alerts).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("Overheat")).not.toBeInTheDocument();
    });
  });

  it("shows backend error when loading fails", async () => {
    vi.mocked(maintenanceApi.alerts).mockRejectedValue({
      response: { data: { error: "DB temporarily unavailable" } },
    });
    vi.mocked(maintenanceApi.risk).mockResolvedValue([]);

    render(<MaintenancePage />);

    expect(await screen.findByText("DB temporarily unavailable")).toBeInTheDocument();
  });

  it("shows fallback message when resolve fails without API message", async () => {
    vi.mocked(maintenanceApi.alerts).mockResolvedValue([
      {
        alert_id: 5,
        charger_id: 8,
        charger_code: "C-08",
        reason: "Connector mismatch",
        raised_at: "2026-04-17T12:00:00Z",
        is_resolved: false,
      },
    ]);
    vi.mocked(maintenanceApi.risk).mockResolvedValue([]);
    vi.mocked(maintenanceApi.resolve).mockRejectedValue(new Error("network down"));

    render(<MaintenancePage />);

    const button = await screen.findByRole("button", { name: "Resolve" });
    fireEvent.click(button);

    expect(await screen.findByText("Failed to resolve alert")).toBeInTheDocument();
  });
});

