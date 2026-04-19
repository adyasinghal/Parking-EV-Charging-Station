import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">V</div>
          VoltPark
        </div>
        <h1>Sign in</h1>
        <p className="auth-sub">Welcome back. Park it, charge it, done.</p>
        <form onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="button-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="auth-footer">
          No account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
