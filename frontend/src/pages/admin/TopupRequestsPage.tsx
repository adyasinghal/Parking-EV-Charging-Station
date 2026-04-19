import { useEffect, useMemo, useState } from "react";
import { walletApi } from "../../api/wallet";
import { getApiErrorMessage } from "../../lib/errors";
import type { TopupRequest } from "../../types";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dt = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dt.format(d);
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:  { bg: "#fef9c3", color: "#a16207" },
  Approved: { bg: "#dcfce7", color: "#16a34a" },
  Rejected: { bg: "#fee2e2", color: "#dc2626" },
};

export default function TopupRequestsPage() {
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [processing, setProcessing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await walletApi.adminTopupRequests();
      setRequests(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load topup requests"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? requests
        : requests.filter((r) => r.status === statusFilter),
    [requests, statusFilter],
  );

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0 };
    for (const r of requests) c[r.status as keyof typeof c] = (c[r.status as keyof typeof c] ?? 0) + 1;
    return c;
  }, [requests]);

  const pendingTotal = useMemo(
    () => requests.filter((r) => r.status === "Pending").reduce((s, r) => s + r.amount, 0),
    [requests],
  );

  const handleApprove = async (id: number) => {
    setActionError(null);
    setProcessing(id);
    try {
      await walletApi.approveTopup(id);
      await load();
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, "Failed to approve request"));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Reject this top-up request?")) return;
    setActionError(null);
    setProcessing(id);
    try {
      await walletApi.rejectTopup(id);
      await load();
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, "Failed to reject request"));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Wallet Top-up Requests</h2>
          <p>Review and approve driver wallet top-up requests.</p>
        </div>
        <button className="button-secondary" onClick={load}>Refresh</button>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Pending</p>
          <h3 style={{ color: "#a16207" }}>{counts.Pending}</h3>
          <span>{money.format(pendingTotal)} awaiting</span>
        </article>
        <article className="card stat-card">
          <p>Approved</p>
          <h3 style={{ color: "#16a34a" }}>{counts.Approved}</h3>
          <span>all time</span>
        </article>
        <article className="card stat-card">
          <p>Rejected</p>
          <h3 style={{ color: "#dc2626" }}>{counts.Rejected}</h3>
          <span>all time</span>
        </article>
      </div>

      <div className="card table-card">
        <div className="filter-row">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {actionError && <p className="error" style={{ margin: "0 1rem 0.5rem" }}>{actionError}</p>}
        {loading && <p className="table-state">Loading requests…</p>}
        {error && <p className="error table-state">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="table-state">No {statusFilter !== "all" ? statusFilter.toLowerCase() : ""} requests found.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Processed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const style = statusStyle[r.status] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={r.request_id}>
                    <td className="subtle">#{r.request_id}</td>
                    <td>
                      <strong>{r.full_name ?? `User #${r.user_id}`}</strong>
                      {r.email && <div className="subtle">{r.email}</div>}
                    </td>
                    <td><strong>{money.format(r.amount)}</strong></td>
                    <td className="subtle">{r.note ?? "—"}</td>
                    <td>
                      <span style={{
                        background: style.bg, color: style.color,
                        padding: "2px 10px", borderRadius: "9999px",
                        fontSize: "0.78rem", fontWeight: 600,
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="subtle">{fmtDate(r.requested_at)}</td>
                    <td className="subtle">{r.processed_at ? fmtDate(r.processed_at) : "—"}</td>
                    <td>
                      {r.status === "Pending" && (
                        <span style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            className="button-primary"
                            style={{ padding: "4px 12px", fontSize: "0.82rem" }}
                            disabled={processing === r.request_id}
                            onClick={() => handleApprove(r.request_id)}
                          >
                            {processing === r.request_id ? "…" : "Approve"}
                          </button>
                          <button
                            className="button-secondary"
                            style={{ padding: "4px 12px", fontSize: "0.82rem", color: "#dc2626", borderColor: "#fca5a5" }}
                            disabled={processing === r.request_id}
                            onClick={() => handleReject(r.request_id)}
                          >
                            Reject
                          </button>
                        </span>
                      )}
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
