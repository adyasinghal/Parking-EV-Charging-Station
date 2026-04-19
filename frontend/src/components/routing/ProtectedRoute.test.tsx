import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuthStore } from "../../store/authStore";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("redirects to login when no token", () => {
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<div>Private Screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
  });

  it("renders child route when token exists", () => {
    useAuthStore.setState({
      token: "token-1",
      user: { user_id: 1, full_name: "User", email: "u@example.com", role: "Driver" },
    });

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<div>Private Screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Private Screen")).toBeInTheDocument();
  });
});

