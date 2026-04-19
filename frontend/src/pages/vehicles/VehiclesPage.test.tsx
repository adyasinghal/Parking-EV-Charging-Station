import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vehiclesApi } from "../../api/vehicles";
import VehiclesPage from "./VehiclesPage";

vi.mock("../../api/vehicles", () => ({
  vehiclesApi: {
    list: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("VehiclesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vehicles and supports filtering", async () => {
    vi.mocked(vehiclesApi.list).mockResolvedValue([
      { vehicle_id: 1, user_id: 1, license_plate: "EV-100", is_ev: true, make: "Tesla", model: "Model 3" },
      { vehicle_id: 2, user_id: 1, license_plate: "ICE-200", is_ev: false, make: "Toyota", model: "Corolla" },
    ]);

    render(<VehiclesPage />);

    expect(await screen.findByText("EV-100")).toBeInTheDocument();
    expect(screen.getByText("ICE-200")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("All types"), { target: { value: "ev" } });
    expect(screen.getByText("EV-100")).toBeInTheDocument();
    expect(screen.queryByText("ICE-200")).not.toBeInTheDocument();
  });

  it("adds and removes a vehicle with optional details", async () => {
    vi.mocked(vehiclesApi.list)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ vehicle_id: 3, user_id: 1, license_plate: "NEW-300", is_ev: true }])
      .mockResolvedValueOnce([]);
    vi.mocked(vehiclesApi.create).mockResolvedValue({ vehicle_id: 3, user_id: 1, license_plate: "NEW-300", is_ev: true });
    vi.mocked(vehiclesApi.remove).mockResolvedValue({ message: "ok" });

    render(<VehiclesPage />);

    await screen.findByText("No vehicles found for this filter.");

    fireEvent.change(screen.getByPlaceholderText("License plate"), { target: { value: "new-300" } });
    fireEvent.change(screen.getByPlaceholderText("Make (optional)"), { target: { value: "Tesla" } });
    fireEvent.change(screen.getByPlaceholderText("Model (optional)"), { target: { value: "Model Y" } });
    fireEvent.change(screen.getByPlaceholderText("Year (optional)"), { target: { value: "2025" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "EV enabled" }));
    fireEvent.change(screen.getByPlaceholderText("Battery kW (EV only)"), { target: { value: "82.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Add vehicle" }));

    await waitFor(() => {
      expect(vehiclesApi.create).toHaveBeenCalledWith({
        license_plate: "NEW-300",
        make: "Tesla",
        model: "Model Y",
        year: 2025,
        is_ev: true,
        battery_kw: 82.5,
      });
    });

    expect(await screen.findByText("NEW-300")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(vehiclesApi.remove).toHaveBeenCalledWith(3);
    });
  });

  it("disables EV battery input until EV is enabled", async () => {
    vi.mocked(vehiclesApi.list).mockResolvedValue([]);

    render(<VehiclesPage />);

    await screen.findByText("No vehicles found for this filter.");

    const batteryInput = screen.getByPlaceholderText("Battery kW (EV only)");
    expect(batteryInput).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "EV enabled" }));
    expect(batteryInput).not.toBeDisabled();
  });
});

