import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../lib/errors";
import type { User } from "../../types";

const dt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "-" : dt.format(parsed);
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setError("Invalid user id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getById(userId);
      setUser(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load user"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Delete ${user.full_name} (#${user.user_id})?`)) return;
    setDeleting(true);
    setError(null);
    try {
      await usersApi.remove(user.user_id);
      navigate("/admin/users", { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete user"));
      setDeleting(false);
    }
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>User details</h2>
          <p>Inspect account information and remove account access if needed.</p>
        </div>
        <Link className="button-secondary" to="/admin/users">Back to users</Link>
      </div>

      {loading && <p className="table-state">Loading user...</p>}
      {error && <p className="error table-state">{error}</p>}

      {!loading && !error && user && (
        <div className="card" style={{ padding: "1.2rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div><span className="subtle">User ID:</span> <strong>#{user.user_id}</strong></div>
            <div><span className="subtle">Name:</span> <strong>{user.full_name}</strong></div>
            <div><span className="subtle">Email:</span> {user.email}</div>
            <div><span className="subtle">Phone:</span> {user.phone || "-"}</div>
            <div><span className="subtle">Role:</span> <span className="pill pill-muted">{user.role}</span></div>
            <div><span className="subtle">Created:</span> {formatDate(user.created_at)}</div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="button-secondary"
              style={{ color: "#dc2626", borderColor: "#fca5a5" }}
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete user"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

