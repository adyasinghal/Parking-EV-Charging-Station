import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RoleRoute from "./RoleRoute";
import { useAuthStore } from "../../store/authStore";

describe("RoleRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("blocks user without required role", () => {
    useAuthStore.setState({
      token: "token-1",
      user: { user_id: 1, full_name: "Driver", email: "d@example.com", role: "Driver" },
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<RoleRoute allowed={["Admin"]} />}>
            <Route path="/admin" element={<div>Admin Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("allows user with required role", () => {
    useAuthStore.setState({
      token: "token-1",
      user: { user_id: 2, full_name: "Admin", email: "a@example.com", role: "Admin" },
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<RoleRoute allowed={["Admin"]} />}>
            <Route path="/admin" element={<div>Admin Panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});

