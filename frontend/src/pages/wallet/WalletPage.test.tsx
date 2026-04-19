import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { chargersApi } from "../../api/chargers";
import { reservationsApi } from "../../api/reservations";
import { sessionsApi } from "../../api/sessions";
import { walletApi } from "../../api/wallet";
import WalletPage from "./WalletPage";

vi.mock("../../api/wallet", () => ({
  walletApi: {
    get: vi.fn(),
    transactions: vi.fn(),
    topUp: vi.fn(),
    requestTopUp: vi.fn(),
    myTopupRequests: vi.fn(),
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

vi.mock("../../api/chargers", () => ({
  chargersApi: {
    list: vi.fn(),
  },
}));

describe("WalletPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(walletApi.get).mockResolvedValue({
      wallet_id: 1,
      user_id: 2,
      balance: 150,
      currency: "INR",
      last_updated: "2026-04-18T10:00:00Z",
    });
    vi.mocked(walletApi.transactions).mockResolvedValue([
      {
        billing_id: 88,
        user_id: 2,
        billing_type: "Charging_Fee",
        amount: 25,
        session_id: 11,
        billed_at: "2026-04-18T11:00:00Z",
      },
    ]);
    vi.mocked(reservationsApi.list).mockResolvedValue([]);
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        session_id: 11,
        charger_id: 4,
        vehicle_id: 9,
        plug_in_time: "2026-04-18T10:00:00Z",
        status: "Ended",
        kwh_start: 1,
      },
    ]);
    vi.mocked(chargersApi.list).mockResolvedValue([
      {
        charger_id: 4,
        spot_id: 20,
        charger_code: "EV-4",
        charger_type: "AC",
        power_kw: 22,
        status: "Available",
      },
    ]);
    vi.mocked(walletApi.myTopupRequests).mockResolvedValue([]);
  });

  it("renders enriched transaction details", async () => {
    render(<WalletPage />);

    expect(await screen.findByText("Transaction history")).toBeInTheDocument();
    expect(await screen.findByText("SESSION-11")).toBeInTheDocument();
    expect(await screen.findByText("Charging session #11 on EV-4")).toBeInTheDocument();
  });

  it("submits top-up and reloads data", async () => {
    vi.mocked(walletApi.topUp).mockResolvedValue({
      wallet_id: 1,
      user_id: 2,
      balance: 250,
      currency: "INR",
      last_updated: "2026-04-18T12:00:00Z",
    });

    render(<WalletPage />);

    await screen.findByText("Wallet balance");
    fireEvent.change(screen.getByPlaceholderText("Top-up amount"), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "Top up wallet" }));

    await waitFor(() => {
      expect(walletApi.topUp).toHaveBeenCalledWith(120);
      expect(walletApi.get).toHaveBeenCalledTimes(2);
    });
  });
});

