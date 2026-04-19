import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { reservationsApi } from "../../api/reservations";
import { zonesApi } from "../../api/zones";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import type { Reservation, Spot } from "../../types";

const dt = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dt.format(d);
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed:  { bg: "#dcfce7", color: "#16a34a" },
  Cancelled:  { bg: "#fee2e2", color: "#dc2626" },
  Completed:  { bg: "#dbeafe", color: "#2563eb" },
  No_Show:    { bg: "#fef9c3", color: "#ca8a04" },
};

export default function ReservationsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spotMap, setSpotMap] = useState<Map<number, Spot & { zone_name: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async (all: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const [resData, zonesData] = await Promise.all([
        all ? reservationsApi.listAll() : reservationsApi.list(),
        zonesApi.list(),
      ]);

      const spotsByZone = await Promise.all(
        zonesData.map((z) =>
          zonesApi.spots(z.zone_id).then((spots) =>
            spots.map((s) => ({ ...s, zone_name: z.zone_name }))
          ).catch(() => [])
        )
      );
      const map = new Map<number, Spot & { zone_name: string }>();
      for (const arr of spotsByZone) for (const s of arr) map.set(s.spot_id, s);
      setSpotMap(map);
      setReservations(resData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load reservations"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(viewAll); }, [viewAll]);

  const filtered = useMemo(
    () =>
      reservations.filter((r) => {
        const spot = spotMap.get(r.spot_id);
        const matchesSearch =
          search.trim().length === 0 ||
          String(r.reservation_id).includes(search) ||
          (spot?.spot_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (spot?.zone_name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [reservations, search, statusFilter, spotMap],
  );

  const counts = useMemo(() => {
    const c = { Confirmed: 0, Completed: 0, Cancelled: 0, No_Show: 0 };
    for (const r of reservations) c[r.status as keyof typeof c] = (c[r.status as keyof typeof c] ?? 0) + 1;
    return c;
  }, [reservations]);

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this reservation?")) return;
    setError(null);
    try {
      await reservationsApi.cancel(id);
      await load(viewAll);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to cancel reservation"));
    }
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Reservations</h2>
          <p>Manage parking reservations and track status.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isAdmin && (
            <label className="checkbox-label" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={viewAll}
                onChange={(e) => setViewAll(e.target.checked)}
              />
              View all users
            </label>
          )}
          <Link className="button-primary" to="/reservations/new">
            + New reservation
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        {(["Confirmed", "Completed", "Cancelled", "No_Show"] as const).map((s) => (
          <article key={s} className="card stat-card">
            <p>{s.replace("_", " ")}</p>
            <h3 style={{ color: statusStyle[s]?.color }}>{counts[s]}</h3>
            <span>reservations</span>
          </article>
        ))}
      </div>

      <div className="card table-card">
        <div className="filter-row">
          <input
            placeholder="Search by ID, spot, or zone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No_Show">No Show</option>
          </select>
        </div>

        {loading && <p className="table-state">Loading reservations…</p>}
        {error && <p className="error table-state">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="table-state" style={{ textAlign: "center" }}>
            <p style={{ marginBottom: "0.75rem" }}>No reservations found.</p>
            <Link className="button-primary" to="/reservations/new">Make your first reservation</Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                {viewAll && <th>User</th>}
                <th>Zone / Spot</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const spot = spotMap.get(r.spot_id);
                const style = statusStyle[r.status] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={r.reservation_id}>
                    <td>
                      <Link to={`/reservations/${r.reservation_id}`} className="subtle" style={{ textDecoration: "none" }}>
                        #{r.reservation_id}
                      </Link>
                    </td>
                    {viewAll && <td><span className="subtle">{r.user_id}</span></td>}
                    <td>
                      {spot ? (
                        <>
                          <strong>{spot.zone_name}</strong>
                          <div className="subtle">{spot.spot_code} · {spot.type}</div>
                        </>
                      ) : (
                        <span className="subtle">Spot #{r.spot_id}</span>
                      )}
                    </td>
                    <td>{formatDate(r.start_time)}</td>
                    <td>{formatDate(r.end_time)}</td>
                    <td>
                      <span
                        style={{
                          background: style.bg,
                          color: style.color,
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="subtle">{formatDate(r.created_at)}</td>
                    <td>
                      <span style={{ display: "flex", gap: "0.4rem" }}>
                        <Link className="button-secondary" to={`/reservations/${r.reservation_id}`}>View</Link>
                        {r.status === "Confirmed" && (
                          <button
                            className="button-secondary"
                            style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                            onClick={() => handleCancel(r.reservation_id)}
                          >
                            Cancel
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
