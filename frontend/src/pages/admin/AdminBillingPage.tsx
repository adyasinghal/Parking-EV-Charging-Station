import { useEffect, useMemo, useState } from "react";
import { billingApi } from "../../api/billing";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../lib/errors";
import type { BillingRecord, User } from "../../types";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : dt.format(parsed);
}

function normalizeType(type: string): "Credit" | "Debit" | "Other" {
  const value = type.toLowerCase();
  if (value.includes("refund") || value.includes("top") || value.includes("credit")) return "Credit";
  if (value.includes("fee") || value.includes("charge") || value.includes("debit")) return "Debit";
  return "Other";
}

export default function AdminBillingPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [billingData, usersData] = await Promise.all([
        billingApi.listAll(),
        usersApi.list().catch(() => [] as User[]),
      ]);
      setRecords(billingData.sort((a, b) => new Date(b.billed_at).getTime() - new Date(a.billed_at).getTime()));
      setUsers(usersData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load billing records"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const usersById = useMemo(() => new Map(users.map((u) => [u.user_id, u])), [users]);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const normalized = normalizeType(record.billing_type);
        const user = usersById.get(record.user_id);
        const matchesType = typeFilter === "all" || normalized === typeFilter;
        const q = search.trim().toLowerCase();
        const matchesSearch =
          q.length === 0 ||
          record.billing_type.toLowerCase().includes(q) ||
          String(record.billing_id).includes(q) ||
          String(record.user_id).includes(q) ||
          (user?.full_name ?? "").toLowerCase().includes(q) ||
          (user?.email ?? "").toLowerCase().includes(q);
        return matchesType && matchesSearch;
      }),
    [records, search, typeFilter, usersById],
  );

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const record of records) {
      const amount = Math.abs(record.amount);
      const type = normalizeType(record.billing_type);
      if (type === "Credit") credits += amount;
      else if (type === "Debit") debits += amount;
    }
    return { count: records.length, credits, debits };
  }, [records]);

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Admin billing</h2>
          <p>Audit all billing records across users, reservations, and sessions.</p>
        </div>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Total records</p>
          <h3>{totals.count}</h3>
          <span>System-wide transactions</span>
        </article>
        <article className="card stat-card">
          <p>Credits</p>
          <h3 style={{ color: "#16a34a" }}>{money.format(totals.credits)}</h3>
          <span>Refunds and top-ups</span>
        </article>
        <article className="card stat-card">
          <p>Debits</p>
          <h3 style={{ color: "#dc2626" }}>{money.format(totals.debits)}</h3>
          <span>Fees and charges</span>
        </article>
      </div>

      <div className="card table-card">
        <div className="filter-row">
          <input
            placeholder="Search by billing id, user, email, or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {loading && <p className="table-state">Loading billing records...</p>}
        {error && <p className="error table-state">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="table-state">No billing records found for this filter.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reservation</th>
                <th>Session</th>
                <th>Billed at</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const user = usersById.get(record.user_id);
                const normalized = normalizeType(record.billing_type);
                return (
                  <tr key={record.billing_id}>
                    <td className="subtle">#{record.billing_id}</td>
                    <td>
                      <strong>{user?.full_name ?? `User #${record.user_id}`}</strong>
                      <div className="subtle">{user?.email ?? "-"}</div>
                    </td>
                    <td>
                      <span className={normalized === "Credit" ? "pill pill-success" : normalized === "Debit" ? "pill pill-warning" : "pill pill-muted"}>
                        {record.billing_type}
                      </span>
                    </td>
                    <td>
                      <span className={normalized === "Credit" ? "amount-positive" : normalized === "Debit" ? "amount-negative" : ""}>
                        {normalized === "Credit" ? "+" : normalized === "Debit" ? "-" : ""}
                        {money.format(Math.abs(record.amount))}
                      </span>
                    </td>
                    <td>{record.reservation_id ? `#${record.reservation_id}` : "-"}</td>
                    <td>{record.session_id ? `#${record.session_id}` : "-"}</td>
                    <td>{formatDate(record.billed_at)}</td>
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

