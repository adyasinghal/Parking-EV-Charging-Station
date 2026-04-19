import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usersApi } from "../../api/users";
import UsersPage from "./UsersPage";

vi.mock("../../api/users", () => ({
  usersApi: {
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders users with role badges", async () => {
    vi.mocked(usersApi.list).mockResolvedValue([
      { user_id: 1, full_name: "Alice Admin", email: "a@example.com", role: "Admin" },
      { user_id: 2, full_name: "Oscar Operator", email: "o@example.com", role: "Operator" },
    ]);

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("Oscar Operator")).toBeInTheDocument();

    const adminRow = screen.getByText("Alice Admin").closest("tr");
    const operatorRow = screen.getByText("Oscar Operator").closest("tr");
    expect(adminRow).not.toBeNull();
    expect(operatorRow).not.toBeNull();

    if (adminRow && operatorRow) {
      expect(within(adminRow).getByText("Admin")).toBeInTheDocument();
      expect(within(operatorRow).getByText("Operator")).toBeInTheDocument();
    }
  });

  it("filters by role and search", async () => {
    vi.mocked(usersApi.list).mockResolvedValue([
      { user_id: 1, full_name: "Derek Driver", email: "d@example.com", role: "Driver" },
      { user_id: 2, full_name: "Amy Admin", email: "amy@example.com", role: "Admin" },
    ]);

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );

    await screen.findByText("Derek Driver");

    fireEvent.change(screen.getByDisplayValue("All roles"), { target: { value: "Admin" } });
    expect(screen.getByText("Amy Admin")).toBeInTheDocument();
    expect(screen.queryByText("Derek Driver")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search by name or email"), { target: { value: "none" } });
    expect(screen.getByText("No users found for this filter.")).toBeInTheDocument();
  });
});

