import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { chargersApi } from "../../api/chargers";
import { reservationsApi } from "../../api/reservations";
import { sessionsApi } from "../../api/sessions";
import { walletApi } from "../../api/wallet";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import type { BillingRecord, ChargingSession, EVCharger, Reservation, TopupRequest, Wallet } from "../../types";

type EnrichedTransaction = {
  id: number;
  date: string;
  type: string;
  amount: number;
  description: string;
  reference: string;
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function isToday(iso: string): boolean {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;
  const now = new Date();
  return (
    value.getUTCFullYear() === now.getUTCFullYear() &&
    value.getUTCMonth() === now.getUTCMonth() &&
    value.getUTCDate() === now.getUTCDate()
  );
}

function formatDate(iso: string): string {
  const value = new Date(iso);
  return Number.isNaN(value.getTime()) ? "Unknown" : dateTime.format(value);
}

function buildDescription(
  tx: BillingRecord,
  reservationsById: Map<number, Reservation>,
  sessionsById: Map<number, ChargingSession>,
  chargersById: Map<number, EVCharger>,
): string {
  if (tx.description) return tx.description;
  if (tx.session_id) {
    const session = sessionsById.get(tx.session_id);
    if (!session) return "Charging session";
    const chargerCode = chargersById.get(session.charger_id)?.charger_code;
    return `Charging session #${tx.session_id}${chargerCode ? ` on ${chargerCode}` : ""}`;
  }
  if (tx.reservation_id) {
    const reservation = reservationsById.get(tx.reservation_id);
    if (!reservation) return "Parking reservation";
    return `Reservation #${tx.reservation_id} for spot ${reservation.spot_id}`;
  }
  return "Wallet transaction";
}

function normalizeType(type: string): "Credit" | "Debit" | "Other" {
  const value = type.toLowerCase();
  if (value.includes("top") || value.includes("refund") || value.includes("credit")) return "Credit";
  if (value.includes("charge") || value.includes("fee") || value.includes("debit") || value.includes("payment"))
    return "Debit";
  return "Other";
}

const requestStatusStyle: Record<string, { bg: string; color: string }> = {
  Pending:  { bg: "#fef9c3", color: "#a16207" },
  Approved: { bg: "#dcfce7", color: "#16a34a" },
  Rejected: { bg: "#fee2e2", color: "#dc2626" },
};

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const isDriver = user?.role === "Driver";

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, txData, reservations, sessions, chargers, requests] = await Promise.all([
        walletApi.get(),
        walletApi.transactions(),
        reservationsApi.list().catch(() => [] as Reservation[]),
        sessionsApi.list().catch(() => [] as ChargingSession[]),
        chargersApi.list().catch(() => [] as EVCharger[]),
        walletApi.myTopupRequests().catch(() => [] as TopupRequest[]),
      ]);

      const reservationsById = new Map(reservations.map((r) => [r.reservation_id, r]));
      const sessionsById = new Map(sessions.map((s) => [s.session_id, s]));
      const chargersById = new Map(chargers.map((c) => [c.charger_id, c]));

      const enriched = txData
        .map((tx) => {
          const type = normalizeType(tx.billing_type);
          const amountValue = type === "Credit" ? Math.abs(tx.amount) : -Math.abs(tx.amount);
          return {
            id: tx.billing_id,
            date: tx.billed_at,
            type,
            amount: amountValue,
            description: buildDescription(tx, reservationsById, sessionsById, chargersById),
            reference: tx.session_id
              ? `SESSION-${tx.session_id}`
              : tx.reservation_id
                ? `RES-${tx.reservation_id}`
                : `TX-${tx.billing_id}`,
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setWallet(walletData);
      setTransactions(enriched);
      setTopupRequests(requests);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load wallet"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const handleRequestTopup = async (e: FormEvent) => {
    e.preventDefault();
    setTopupError(null);
    setTopupSuccess(null);
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setTopupError("Enter a valid amount greater than 0.");
      return;
    }
    try {
      await walletApi.requestTopUp(parsed, note.trim() || undefined);
      setTopupSuccess("Top-up request submitted. It will be reviewed by an admin.");
      setAmount("100");
      setNote("");
      await load();
    } catch (err: unknown) {
      setTopupError(getApiErrorMessage(err, "Failed to submit request"));
    }
  };

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const matchesSearch =
          search.trim().length === 0 ||
          tx.description.toLowerCase().includes(search.toLowerCase()) ||
          tx.reference.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [search, transactions, typeFilter],
  );

  const summary = useMemo(() => {
    const creditsToday = transactions
      .filter((tx) => tx.amount > 0 && isToday(tx.date))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const debitsToday = transactions
      .filter((tx) => tx.amount < 0 && isToday(tx.date))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { creditsToday, debitsToday, count: transactions.length };
  }, [transactions]);

  const pendingRequests = topupRequests.filter((r) => r.status === "Pending");

  return (
    <section className="page-panel">
      <div className="wallet-grid">
        <article className="card wallet-balance-card">
          <h2>Wallet balance</h2>
          <p className="wallet-balance-value">
            {wallet ? money.format(wallet.balance) : loading ? "Loading..." : money.format(0)}
          </p>
          <p className="subtle">{wallet?.currency || "INR"}</p>

          {isDriver ? (
            <form onSubmit={handleRequestTopup} className="wallet-topup-form" style={{ marginTop: "1rem" }}>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ marginTop: "0.5rem" }}
              />
              <button className="button-primary" type="submit" style={{ marginTop: "0.5rem" }}>
                Request top-up
              </button>
              {topupError && <p className="error" style={{ marginTop: "0.5rem" }}>{topupError}</p>}
              {topupSuccess && <p style={{ color: "#16a34a", marginTop: "0.5rem", fontSize: "0.85rem" }}>{topupSuccess}</p>}
              {pendingRequests.length > 0 && (
                <p style={{ color: "#a16207", fontSize: "0.82rem", marginTop: "0.5rem" }}>
                  {pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""} awaiting admin review.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setTopupError(null);
              const parsed = Number(amount);
              if (Number.isNaN(parsed) || parsed <= 0) { setTopupError("Enter a valid amount."); return; }
              try {
                await walletApi.topUp(parsed);
                setAmount("");
                await load();
              } catch (err: unknown) { setTopupError(getApiErrorMessage(err, "Top-up failed")); }
            }} className="inline-form wallet-topup-form">
              <input type="number" min="1" step="1" placeholder="Top-up amount" value={amount}
                onChange={(e) => setAmount(e.target.value)} required />
              <button className="button-primary" type="submit">Top up wallet</button>
              {topupError && <p className="error">{topupError}</p>}
            </form>
          )}
        </article>

        <article className="card stat-card">
          <p>Credits today</p>
          <h3>{money.format(summary.creditsToday)}</h3>
          <span>Incoming transactions</span>
        </article>
        <article className="card stat-card">
          <p>Debits today</p>
          <h3>{money.format(Math.abs(summary.debitsToday))}</h3>
          <span>Charges and fees</span>
        </article>
        <article className="card stat-card">
          <p>Total transactions</p>
          <h3>{summary.count}</h3>
          <span>Wallet activity records</span>
        </article>
      </div>

      {isDriver && topupRequests.length > 0 && (
        <div className="card table-card">
          <div className="table-head">
            <h2>My top-up requests</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {topupRequests.map((r) => {
                const style = requestStatusStyle[r.status] ?? { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={r.request_id}>
                    <td className="subtle">#{r.request_id}</td>
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
                    <td className="subtle">{formatDate(r.requested_at)}</td>
                    <td className="subtle">{r.processed_at ? formatDate(r.processed_at) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card table-card">
        <div className="table-head">
          <h2>Transaction history</h2>
        </div>
        <div className="filter-row">
          <input
            placeholder="Search by reference or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="Credit">Credits</option>
            <option value="Debit">Debits</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {loading && <p className="table-state">Loading wallet transactions...</p>}
        {error && <p className="error table-state">{error}</p>}
        {!loading && !error && filteredTransactions.length === 0 && (
          <p className="table-state">No transactions found for this filter.</p>
        )}

        {!loading && !error && filteredTransactions.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.date)}</td>
                  <td>
                    <span className={
                      tx.type === "Credit" ? "pill pill-success"
                      : tx.type === "Debit" ? "pill pill-warning"
                      : "pill pill-muted"
                    }>
                      {tx.type}
                    </span>
                  </td>
                  <td>{tx.reference}</td>
                  <td>{tx.description}</td>
                  <td className={tx.amount >= 0 ? "amount-positive" : "amount-negative"}>
                    {tx.amount >= 0 ? "+" : "-"}{money.format(Math.abs(tx.amount))}
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
