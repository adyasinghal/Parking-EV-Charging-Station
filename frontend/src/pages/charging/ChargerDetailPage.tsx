import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { chargersApi } from "../../api/chargers";
import { getApiErrorMessage } from "../../lib/errors";
import type { EVCharger } from "../../types";

const dt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const statusColor: Record<string, string> = {
  Available: "#16a34a",
  In_Use: "#2563eb",
  Faulted: "#dc2626",
  Under_Maintenance: "#ca8a04",
  Offline: "#6b7280",
};

function formatDate(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : dt.format(parsed);
}

export default function ChargerDetailPage() {
  const { id } = useParams();
  const chargerId = Number(id);

  const [charger, setCharger] = useState<EVCharger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!Number.isFinite(chargerId) || chargerId <= 0) {
      setError("Invalid charger id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await chargersApi.getById(chargerId);
      setCharger(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load charger details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [chargerId]);

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Charger details</h2>
          <p>Review charger metadata and operational state.</p>
        </div>
        <Link className="button-secondary" to="/chargers">Back to chargers</Link>
      </div>

      {loading && <p className="table-state">Loading charger...</p>}
      {error && <p className="error table-state">{error}</p>}

      {!loading && !error && charger && (
        <div className="card" style={{ padding: "1.2rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p className="subtle">Charger code</p>
              <h3 style={{ margin: 0 }}>{charger.charger_code}</h3>
            </div>
            <span
              style={{
                background: statusColor[charger.status] ?? "#6b7280",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                height: "fit-content",
              }}
            >
              {charger.status.replace("_", " ")}
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.55rem" }}>
            <div><span className="subtle">Charger ID:</span> #{charger.charger_id}</div>
            <div><span className="subtle">Spot:</span> {charger.spot_code || `#${charger.spot_id}`}</div>
            <div><span className="subtle">Zone ID:</span> {charger.zone_id ? `#${charger.zone_id}` : "-"}</div>
            <div><span className="subtle">Type:</span> {charger.charger_type}</div>
            <div><span className="subtle">Power:</span> {charger.power_kw} kW</div>
            <div><span className="subtle">Connector:</span> {charger.connector_type || "-"}</div>
            <div><span className="subtle">Installed:</span> {formatDate(charger.installed_at)}</div>
          </div>
        </div>
      )}
    </section>
  );
}

