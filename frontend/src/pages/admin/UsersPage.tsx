import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../lib/errors";
import type { User, UserRole } from "../../types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const roleOptions = useMemo(() => {
    return ["all", ...new Set(users.map((user) => user.role))];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          search.trim().length === 0 ||
          user.full_name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [roleFilter, search, users]);

  const roleCounts = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((user) => user.role === "Admin").length,
      operator: users.filter((user) => user.role === "Operator").length,
      driver: users.filter((user) => user.role === "Driver").length,
    };
  }, [users]);

  const roleClass = (role: UserRole) => {
    if (role === "Admin") {
      return "pill pill-warning";
    }
    if (role === "Operator") {
      return "pill pill-success";
    }
    return "pill pill-muted";
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(`Delete user #${userId}? This action cannot be undone.`)) return;
    setDeletingUserId(userId);
    setError(null);
    try {
      await usersApi.remove(userId);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete user"));
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>User management</h2>
          <p>Browse user accounts and roles across the VoltPark platform.</p>
        </div>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Total users</p>
          <h3>{roleCounts.total}</h3>
          <span>All registered accounts</span>
        </article>
        <article className="card stat-card">
          <p>Admins</p>
          <h3>{roleCounts.admin}</h3>
          <span>Platform administrators</span>
        </article>
        <article className="card stat-card">
          <p>Operators</p>
          <h3>{roleCounts.operator}</h3>
          <span>Zone and charger operations</span>
        </article>
        <article className="card stat-card">
          <p>Drivers</p>
          <h3>{roleCounts.driver}</h3>
          <span>End users</span>
        </article>
      </div>

      <div className="card table-card">
        <div className="table-head">
          <h2>Users</h2>
        </div>

        <div className="filter-row">
          <input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All roles" : role}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="table-state">Loading users...</p>}
        {error && <p className="error table-state">{error}</p>}

        {!loading && !error && filteredUsers.length === 0 && (
          <p className="table-state">No users found for this filter.</p>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>User ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id}>
                  <td>
                    <strong>{user.full_name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={roleClass(user.role)}>{user.role}</span>
                  </td>
                  <td>{user.phone || "-"}</td>
                  <td>{user.user_id}</td>
                  <td>
                    <span style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                      <Link className="button-secondary" to={`/admin/users/${user.user_id}`}>View</Link>
                      <button
                        type="button"
                        className="button-secondary"
                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                        disabled={deletingUserId === user.user_id}
                        onClick={() => handleDelete(user.user_id)}
                      >
                        {deletingUserId === user.user_id ? "Deleting..." : "Delete"}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
