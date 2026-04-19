import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { chargersApi } from "../../api/chargers";
import { zonesApi } from "../../api/zones";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import type { EVCharger, Spot, Zone } from "../../types";

const CHARGER_STATUSES = ["Available", "In_Use", "Faulted", "Under_Maintenance", "Offline"];
const CHARGER_TYPES = ["Level1_AC", "Level2_AC", "DC_Fast", "Ultra_Fast"];

type CreateChargerFormState = {
  zone_id: string;
  spot_id: string;
  charger_code: string;
  charger_type: string;
  power_kw: string;
  connector_type: string;
  status: string;
  installed_at: string;
};

const defaultCreateForm: CreateChargerFormState = {
  zone_id: "",
  spot_id: "",
  charger_code: "",
  charger_type: "Level2_AC",
  power_kw: "",
  connector_type: "",
  status: "Available",
  installed_at: "",
};

export default function ChargersPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";
  const isAdminOrOperator = user?.role === "Admin" || user?.role === "Operator";

  const [chargers, setChargers] = useState<EVCharger[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const [logErrorId, setLogErrorId] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneSpots, setZoneSpots] = useState<Spot[]>([]);
  const [createForm, setCreateForm] = useState<CreateChargerFormState>(defaultCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    chargersApi
      .list()
      .then(setChargers)
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load chargers")));
  };

  useEffect(() => {
    load();
  }, []);

  const availableEVSpots = zoneSpots.filter((spot) => spot.type === "EV_Enabled" && !spot.charger);

  const openCreateModal = async () => {
    setCreateError(null);
    setCreateForm(defaultCreateForm);
    setZoneSpots([]);
    setShowCreate(true);
    try {
      const zoneList = await zonesApi.list();
      setZones(zoneList);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Failed to load zones"));
    }
  };

  const handleZoneChange = async (zoneIdRaw: string) => {
    setCreateForm((prev) => ({ ...prev, zone_id: zoneIdRaw, spot_id: "" }));
    setZoneSpots([]);
    if (!zoneIdRaw) return;
    try {
      const spots = await zonesApi.spots(Number(zoneIdRaw));
      setZoneSpots(spots);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Failed to load spots"));
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!createForm.spot_id) {
      setCreateError("Select an EV-enabled spot.");
      return;
    }
    if (!createForm.charger_code.trim()) {
      setCreateError("Charger code is required.");
      return;
    }
    if (!createForm.power_kw || Number(createForm.power_kw) <= 0) {
      setCreateError("Power must be greater than zero.");
      return;
    }

    setCreating(true);
    try {
      await chargersApi.create({
        spot_id: Number(createForm.spot_id),
        charger_code: createForm.charger_code.trim(),
        charger_type: createForm.charger_type,
        power_kw: Number(createForm.power_kw),
        connector_type: createForm.connector_type.trim() || undefined,
        status: createForm.status || undefined,
        installed_at: createForm.installed_at ? `${createForm.installed_at}T00:00:00Z` : undefined,
      });
      setShowCreate(false);
      setCreateForm(defaultCreateForm);
      setZoneSpots([]);
      load();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Failed to create charger"));
    } finally {
      setCreating(false);
    }
  };

  const filtered = chargers.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterType && c.charger_type !== filterType) return false;
    return true;
  });

  const handleUpdateStatus = async (id: number) => {
    if (!newStatus) return;
    try {
      await chargersApi.update(id, { status: newStatus });
      setEditingId(null);
      setNewStatus("");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update charger"));
    }
  };

  const handleLogError = async (id: number) => {
    if (!errorCode) return;
    try {
      await chargersApi.logError(id, { error_code: errorCode, error_message: errorMessage || undefined });
      setLogErrorId(null);
      setErrorCode("");
      setErrorMessage("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to log error"));
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Available": return "#22c55e";
      case "In_Use": return "#3b82f6";
      case "Faulted": return "#ef4444";
      case "Under_Maintenance": return "#f59e0b";
      case "Offline": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const chargerTypes = [...new Set(chargers.map((c) => c.charger_type))];

  return (
    <section>
      <h1>EV Chargers</h1>
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <div style={{ marginBottom: "1rem" }}>
          <button className="button-primary" onClick={() => void openCreateModal()}>
            + Add Charger
          </button>
        </div>
      )}

      <div className="inline-form" style={{ marginBottom: "1rem" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {CHARGER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {chargerTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Code</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Zone</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Spot</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Power (kW)</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Connector</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Status</th>
            {isAdminOrOperator && <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((charger) => (
            <tr key={charger.charger_id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.5rem" }}>
                <Link to={`/chargers/${charger.charger_id}`}>{charger.charger_code}</Link>
              </td>
              <td style={{ padding: "0.5rem" }}>{charger.zone_id ? `#${charger.zone_id}` : "—"}</td>
              <td style={{ padding: "0.5rem" }}>{charger.spot_code || `#${charger.spot_id}`}</td>
              <td style={{ padding: "0.5rem" }}>{charger.charger_type}</td>
              <td style={{ padding: "0.5rem" }}>{charger.power_kw}</td>
              <td style={{ padding: "0.5rem" }}>{charger.connector_type || "—"}</td>
              <td style={{ padding: "0.5rem" }}>
                <span style={{
                  background: statusColor(charger.status),
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                }}>
                  {charger.status}
                </span>
              </td>
              {isAdminOrOperator && (
                <td style={{ padding: "0.5rem" }}>
                  {editingId === charger.charger_id ? (
                    <span>
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                        <option value="">Select status</option>
                        {CHARGER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button onClick={() => handleUpdateStatus(charger.charger_id)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </span>
                  ) : logErrorId === charger.charger_id ? (
                    <span>
                      <input
                        placeholder="Error code"
                        value={errorCode}
                        onChange={(e) => setErrorCode(e.target.value)}
                      />
                      <input
                        placeholder="Message (optional)"
                        value={errorMessage}
                        onChange={(e) => setErrorMessage(e.target.value)}
                      />
                      <button onClick={() => handleLogError(charger.charger_id)}>Submit</button>
                      <button onClick={() => setLogErrorId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <span>
                      <Link to={`/chargers/${charger.charger_id}`} className="button-secondary" style={{ marginRight: "0.35rem" }}>
                        View
                      </Link>
                      <button onClick={() => { setEditingId(charger.charger_id); setNewStatus(charger.status); }}>
                        Update Status
                      </button>
                      <button onClick={() => setLogErrorId(charger.charger_id)}>Log Error</button>
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={isAdminOrOperator ? 8 : 7} style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                No chargers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Add Charger</h3>
            {createError && <p className="error">{createError}</p>}

            <div className="form-stack">
              <label>
                Zone *
                <select value={createForm.zone_id} onChange={(e) => void handleZoneChange(e.target.value)}>
                  <option value="">Select zone</option>
                  {zones.map((zone) => (
                    <option key={zone.zone_id} value={zone.zone_id}>
                      {zone.zone_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Spot *
                <select
                  value={createForm.spot_id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, spot_id: e.target.value }))}
                  disabled={!createForm.zone_id}
                >
                  <option value="">Select EV-enabled spot</option>
                  {availableEVSpots.map((spot) => (
                    <option key={spot.spot_id} value={spot.spot_id}>
                      {spot.spot_code} (Floor {spot.floor_level ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Charger code *
                <input
                  value={createForm.charger_code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, charger_code: e.target.value }))}
                  placeholder="e.g. CHG-A-101"
                />
              </label>

              <label>
                Charger type *
                <select
                  value={createForm.charger_type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, charger_type: e.target.value }))}
                >
                  {CHARGER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Power (kW) *
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.power_kw}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, power_kw: e.target.value }))}
                />
              </label>

              <label>
                Connector type
                <input
                  value={createForm.connector_type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, connector_type: e.target.value }))}
                  placeholder="e.g. CCS2"
                />
              </label>

              <label>
                Initial status
                <select value={createForm.status} onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}>
                  {CHARGER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Installed date
                <input
                  type="date"
                  value={createForm.installed_at}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, installed_at: e.target.value }))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="button-secondary" onClick={() => setShowCreate(false)} disabled={creating}>
                Cancel
              </button>
              <button className="button-primary" onClick={() => void handleCreate()} disabled={creating}>
                {creating ? "Adding..." : "Add charger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
