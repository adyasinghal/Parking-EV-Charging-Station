import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { zonesApi } from "../../api/zones";
import { spotsApi } from "../../api/spots";
import { useSpotSSE } from "../../hooks/useSSE";
import { useSSEStore } from "../../store/sseStore";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import type { Spot, Zone } from "../../types";

const SPOT_TYPES = ["Standard", "EV_Enabled", "Handicapped", "Compact", "Oversized"];
const SPOT_STATUSES = ["Available", "Occupied", "Reserved", "Under_Maintenance"];

const statusColor: Record<string, string> = {
  Available: "#22c55e",
  Occupied: "#ef4444",
  Reserved: "#3b82f6",
  Under_Maintenance: "#f59e0b",
};

const chargerStatusColor: Record<string, string> = {
  Available: "#22c55e",
  In_Use: "#3b82f6",
  Faulted: "#ef4444",
  Under_Maintenance: "#f59e0b",
  Offline: "#6b7280",
};

type SpotFormState = { spot_code: string; floor_level: string; type: string; status: string };
const emptySpotForm: SpotFormState = { spot_code: "", floor_level: "0", type: "Standard", status: "Available" };

export default function ZoneDetailPage() {
  const { id } = useParams();
  const zoneId = Number(id);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";
  const isAdminOrOp = isAdmin || user?.role === "Operator";

  const [zone, setZone] = useState<Zone | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAddSpot, setShowAddSpot] = useState(false);
  const [spotForm, setSpotForm] = useState<SpotFormState>(emptySpotForm);
  const [spotFormError, setSpotFormError] = useState<string | null>(null);
  const [savingSpot, setSavingSpot] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");

  useSpotSSE(zoneId || null);
  const spotStatuses = useSSEStore((s) => s.spotStatuses);

  const loadData = async () => {
    if (!zoneId) return;
    setLoading(true);
    try {
      const [zoneData, spotData] = await Promise.all([zonesApi.getById(zoneId), zonesApi.spots(zoneId)]);
      setZone(zoneData);
      setSpots(spotData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load zone details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [zoneId]);

  const spotsWithLiveStatus = useMemo(
    () =>
      spots.map((spot) => ({
        ...spot,
        status: spotStatuses[spot.spot_id]?.status || spot.status,
      })),
    [spots, spotStatuses],
  );

  const handleAddSpot = async () => {
    setSpotFormError(null);
    if (!spotForm.spot_code.trim()) {
      setSpotFormError("Spot code is required.");
      return;
    }
    setSavingSpot(true);
    try {
      await spotsApi.create({
        zone_id: zoneId,
        spot_code: spotForm.spot_code.trim(),
        floor_level: parseInt(spotForm.floor_level, 10) || 0,
        type: spotForm.type,
        status: spotForm.status,
      });
      setShowAddSpot(false);
      setSpotForm(emptySpotForm);
      await loadData();
    } catch (err: unknown) {
      setSpotFormError(getApiErrorMessage(err, "Failed to create spot"));
    } finally {
      setSavingSpot(false);
    }
  };

  const handleUpdateStatus = async (spotId: number) => {
    if (!newStatus) return;
    try {
      await spotsApi.updateStatus(spotId, newStatus);
      setUpdatingStatusId(null);
      setNewStatus("");
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update spot status"));
    }
  };

  const spotsByStatus = useMemo(() => {
    const counts: Record<string, number> = { Available: 0, Occupied: 0, Reserved: 0, Under_Maintenance: 0 };
    for (const s of spotsWithLiveStatus) counts[s.status] = (counts[s.status] ?? 0) + 1;
    return counts;
  }, [spotsWithLiveStatus]);

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>{zone?.zone_name ?? "Zone details"}</h2>
          {zone && (
            <p className="subtle">
              {zone.city}
              {zone.address ? ` · ${zone.address}` : ""}
              {" · "}
              <span className={zone.is_active ? "pill pill-success" : "pill pill-muted"} style={{ display: "inline-block" }}>
                {zone.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          )}
        </div>
        {isAdmin && (
          <button className="button-primary" onClick={() => { setShowAddSpot(true); setSpotFormError(null); }}>
            + Add Spot
          </button>
        )}
      </div>

      <div className="stat-grid">
        {Object.entries(statusColor).map(([status, color]) => (
          <article key={status} className="card stat-card">
            <p>{status.replace("_", " ")}</p>
            <h3 style={{ color }}>{spotsByStatus[status] ?? 0}</h3>
            <span>spots</span>
          </article>
        ))}
      </div>

      {loading && <p className="table-state">Loading spots…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && spotsWithLiveStatus.length === 0 && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
          No spots in this zone yet.
          {isAdmin && (
            <div style={{ marginTop: "0.75rem" }}>
              <button className="button-primary" onClick={() => setShowAddSpot(true)}>
                Add the first spot
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && spotsWithLiveStatus.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Status</th>
                <th>Charger</th>
                {isAdminOrOp && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {spotsWithLiveStatus.map((spot) => (
                <tr key={spot.spot_id}>
                  <td><strong>{spot.spot_code}</strong></td>
                  <td>
                    {spot.type}
                    {spot.type === "EV_Enabled" && " ⚡"}
                  </td>
                  <td>{spot.floor_level ?? 0}</td>
                  <td>
                    <span
                      style={{
                        background: statusColor[spot.status] ?? "#6b7280",
                        color: "#fff",
                        padding: "2px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {spot.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {spot.charger ? (
                      <div style={{ display: "grid", gap: "0.2rem" }}>
                        <strong>{spot.charger.charger_code}</strong>
                        <span className="subtle">{spot.charger.charger_type} · {spot.charger.power_kw} kW</span>
                        <span
                          style={{
                            background: chargerStatusColor[spot.charger.status] ?? "#6b7280",
                            color: "#fff",
                            padding: "2px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            width: "fit-content",
                          }}
                        >
                          {spot.charger.status.replace("_", " ")}
                        </span>
                      </div>
                    ) : spot.type === "EV_Enabled" ? (
                      <span className="subtle">No charger mapped</span>
                    ) : (
                      <span className="subtle">Not applicable</span>
                    )}
                  </td>
                  {isAdminOrOp && (
                    <td>
                      {updatingStatusId === spot.spot_id ? (
                        <span style={{ display: "flex", gap: "0.4rem" }}>
                          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                            <option value="">Select</option>
                            {SPOT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => handleUpdateStatus(spot.spot_id)}>Save</button>
                          <button onClick={() => setUpdatingStatusId(null)}>×</button>
                        </span>
                      ) : (
                        <button
                          className="button-secondary"
                          onClick={() => { setUpdatingStatusId(spot.spot_id); setNewStatus(spot.status); }}
                        >
                          Change status
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddSpot && (
        <div className="modal-overlay" onClick={() => setShowAddSpot(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Add Spot to {zone?.zone_name}</h3>
            {spotFormError && <p className="error">{spotFormError}</p>}
            <div className="form-stack">
              <label>
                Spot code *
                <input
                  value={spotForm.spot_code}
                  onChange={(e) => setSpotForm((s) => ({ ...s, spot_code: e.target.value }))}
                  placeholder="e.g. A-01"
                />
              </label>
              <label>
                Floor level
                <input
                  type="number"
                  value={spotForm.floor_level}
                  onChange={(e) => setSpotForm((s) => ({ ...s, floor_level: e.target.value }))}
                />
              </label>
              <label>
                Type
                <select value={spotForm.type} onChange={(e) => setSpotForm((s) => ({ ...s, type: e.target.value }))}>
                  {SPOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                Initial status
                <select value={spotForm.status} onChange={(e) => setSpotForm((s) => ({ ...s, status: e.target.value }))}>
                  {SPOT_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="button-secondary" onClick={() => setShowAddSpot(false)} disabled={savingSpot}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleAddSpot} disabled={savingSpot}>
                {savingSpot ? "Adding…" : "Add spot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
