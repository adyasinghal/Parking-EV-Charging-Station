import { useEffect, useState } from "react";
import { maintenanceApi } from "../../api/maintenance";
import { getApiErrorMessage } from "../../lib/errors";
import type { MaintenanceAlert, MaintenanceRiskAlert } from "../../types";

const dt = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dt.format(d);
};

export default function MaintenancePage() {
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [risk, setRisk] = useState<MaintenanceRiskAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertsData, riskData] = await Promise.all([maintenanceApi.alerts(), maintenanceApi.risk()]);
      setAlerts(alertsData);
      setRisk(riskData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load maintenance data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([maintenanceApi.alerts(), maintenanceApi.risk()])
      .then(([alertsData, riskData]) => {
        if (cancelled) return;
        setAlerts(alertsData);
        setRisk(riskData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Failed to load maintenance data"));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const resolve = async (id: number) => {
    setError(null);
    setResolving(id);
    try {
      await maintenanceApi.resolve(id);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to resolve alert"));
    } finally {
      setResolving(null);
    }
  };

  const riskLevel = (count: number) => {
    if (count >= 10) return { label: "Critical", color: "#dc2626", bg: "#fee2e2" };
    if (count >= 5)  return { label: "High",     color: "#ea580c", bg: "#ffedd5" };
    if (count >= 2)  return { label: "Medium",   color: "#a16207", bg: "#fef9c3" };
    return               { label: "Low",      color: "#16a34a", bg: "#dcfce7" };
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Maintenance</h2>
          <p>Track unresolved charger alerts and risk signals from the last 24 hours.</p>
        </div>
        <button className="button-secondary" onClick={load}>Refresh</button>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Open alerts</p>
          <h3 style={{ color: alerts.length > 0 ? "#dc2626" : "#16a34a" }}>{alerts.length}</h3>
          <span>unresolved</span>
        </article>
        <article className="card stat-card">
          <p>At-risk chargers</p>
          <h3 style={{ color: risk.length > 0 ? "#ea580c" : "#16a34a" }}>{risk.length}</h3>
          <span>errors in 24h window</span>
        </article>
        <article className="card stat-card">
          <p>Total errors (24h)</p>
          <h3>{risk.reduce((s, r) => s + r.errors_last_24h, 0)}</h3>
          <span>across all chargers</span>
        </article>
      </div>

      {loading && <p className="table-state">Loading maintenance data…</p>}
      {error && <p className="error">{error}</p>}

      <div className="card table-card">
        <div className="table-head"><h2>Unresolved alerts</h2></div>
        {!loading && alerts.length === 0 && (
          <p className="table-state" style={{ color: "#16a34a" }}>
            All clear — no unresolved alerts.
          </p>
        )}
        {alerts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Charger</th>
                <th>Reason</th>
                <th>Raised</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.alert_id}>
                  <td className="subtle">#{alert.alert_id}</td>
                  <td>
                    <strong>{alert.charger_code ?? `#${alert.charger_id}`}</strong>
                  </td>
                  <td>{alert.reason}</td>
                  <td className="subtle">{fmtDate(String(alert.raised_at))}</td>
                  <td>
                    <button
                      className="button-primary"
                      style={{ padding: "4px 14px", fontSize: "0.82rem" }}
                      disabled={resolving === alert.alert_id}
                      onClick={() => resolve(alert.alert_id)}
                    >
                      {resolving === alert.alert_id ? "Resolving…" : "Resolve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card table-card">
        <div className="table-head">
          <h2>Risk alerts — last 24 hours</h2>
        </div>
        {!loading && risk.length === 0 && (
          <p className="table-state" style={{ color: "#16a34a" }}>No chargers flagged as at risk.</p>
        )}
        {risk.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Charger</th>
                <th>Errors (24h)</th>
                <th>Risk level</th>
              </tr>
            </thead>
            <tbody>
              {[...risk].sort((a, b) => b.errors_last_24h - a.errors_last_24h).map((item) => {
                const { label, color, bg } = riskLevel(item.errors_last_24h);
                return (
                  <tr key={item.charger_id}>
                    <td><strong>{item.charger_code}</strong></td>
                    <td>
                      <strong style={{ color }}>{item.errors_last_24h}</strong>
                    </td>
                    <td>
                      <span style={{
                        background: bg, color, padding: "2px 10px",
                        borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 600,
                      }}>
                        {label}
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
