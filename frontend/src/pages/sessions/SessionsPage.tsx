import { useEffect, useMemo, useState } from "react";
import { chargersApi } from "../../api/chargers";
import { sessionsApi } from "../../api/sessions";
import { vehiclesApi } from "../../api/vehicles";
import { getApiErrorMessage } from "../../lib/errors";
import { useAuthStore } from "../../store/authStore";
import type { ChargingSession } from "../../types";

const NON_EV_KWH_PLACEHOLDER = 0.1;

function formatTimestamp(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function SessionsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";

  const [active, setActive] = useState<ChargingSession | null>(null);
  const [list, setList] = useState<ChargingSession[]>([]);
  const [kwhEnd, setKwhEnd] = useState("10");
  const [chargerId, setChargerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [kwhStart, setKwhStart] = useState("0");
  const [chargers, setChargers] = useState<Array<{ charger_id: number; charger_code: string; status: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ vehicle_id: number; license_plate: string; is_ev: boolean }>>([]);
  const [selectedEndSessionId, setSelectedEndSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSessions = useMemo(
    () => list.filter((session) => session.status === "Active"),
    [list],
  );

  const vehicleLabelById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle.license_plate])),
    [vehicles],
  );

  const vehicleById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.vehicle_id, vehicle])),
    [vehicles],
  );

  const selectedVehicle = vehicleById.get(Number(vehicleId));
  const isSelectedVehicleEV = selectedVehicle?.is_ev ?? true;

  const selectedEndSession = useMemo(
    () => activeSessions.find((session) => String(session.session_id) === selectedEndSessionId) ?? null,
    [activeSessions, selectedEndSessionId],
  );

  const sessionToEnd = selectedEndSession ?? active ?? activeSessions[0] ?? null;
  const endSessionVehicle = sessionToEnd ? vehicleById.get(sessionToEnd.vehicle_id) : null;
  const isEndingSessionEV = endSessionVehicle?.is_ev ?? true;
  const hasKnownVehicleForEndingSession = sessionToEnd ? vehicleById.has(sessionToEnd.vehicle_id) : false;

  const canStartSession = !loading && !actionBusy && chargers.length > 0 && vehicles.length > 0;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [history, activeSession, chargerList, vehicleList] = await Promise.all([
        isAdmin ? sessionsApi.listAll() : sessionsApi.list(),
        sessionsApi.active(),
        chargersApi.list().catch(() => []),
        vehiclesApi.list().catch(() => []),
      ]);

      setList(history);
      setActive(activeSession);
      setChargers(chargerList.map((item) => ({
        charger_id: item.charger_id,
        charger_code: item.charger_code,
        status: item.status,
      })));
      setVehicles(vehicleList.map((item) => ({
        vehicle_id: item.vehicle_id,
        license_plate: item.license_plate,
        is_ev: item.is_ev,
      })));

      if (!chargerId && chargerList.length > 0) {
        setChargerId(String(chargerList[0].charger_id));
      }
      if (!vehicleId && vehicleList.length > 0) {
        setVehicleId(String(vehicleList[0].vehicle_id));
      }
      const openSessions = history.filter((session) => session.status === "Active");
      if (openSessions.length > 0) {
        const preferred = activeSession?.session_id ?? openSessions[0].session_id;
        setSelectedEndSessionId(String(preferred));
      } else {
        setSelectedEndSessionId("");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load sessions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isAdmin]);

  const start = async () => {
    setNotice(null);
    setError(null);

    const parsedChargerId = Number(chargerId);
    const parsedVehicleId = Number(vehicleId);
    const parsedReservationId = reservationId.trim().length > 0 ? Number(reservationId) : undefined;
    const parsedKwhStart = isSelectedVehicleEV ? Number(kwhStart) : NON_EV_KWH_PLACEHOLDER;

    if (!parsedChargerId || Number.isNaN(parsedChargerId)) {
      setError("Select a valid charger.");
      return;
    }
    if (!parsedVehicleId || Number.isNaN(parsedVehicleId)) {
      setError("Select a valid vehicle.");
      return;
    }
    if (parsedReservationId !== undefined && Number.isNaN(parsedReservationId)) {
      setError("Reservation ID must be a number.");
      return;
    }
    if (isSelectedVehicleEV && (Number.isNaN(parsedKwhStart) || parsedKwhStart < 0)) {
      setError("kWh start must be 0 or greater.");
      return;
    }

    setActionBusy(true);
    try {
      await sessionsApi.start({
        charger_id: parsedChargerId,
        vehicle_id: parsedVehicleId,
        reservation_id: parsedReservationId,
        kwh_start: parsedKwhStart,
      });
      const sessionType = isSelectedVehicleEV ? "charging" : "parking";
      setNotice(`New ${sessionType} session started successfully.`);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to start session"));
    } finally {
      setActionBusy(false);
    }
  };

  const end = async () => {
    if (!sessionToEnd) {
      setError("Select an active session to end.");
      return;
    }

    setNotice(null);
    setError(null);
    const parsedKwhEnd = isEndingSessionEV
      ? Number(kwhEnd)
      : Math.max(sessionToEnd.kwh_start || NON_EV_KWH_PLACEHOLDER, NON_EV_KWH_PLACEHOLDER);
    if (isEndingSessionEV && (Number.isNaN(parsedKwhEnd) || parsedKwhEnd <= 0)) {
      setError("kWh end must be greater than 0.");
      return;
    }

    setActionBusy(true);
    try {
      await sessionsApi.end(sessionToEnd.session_id, {
        kwh_end: parsedKwhEnd,
        plug_out_time: new Date().toISOString(),
      });
      setNotice(`Session #${sessionToEnd.session_id} ended successfully.`);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to end session"));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <section className="page-panel">
      <div className="card sessions-actions-card">
        <h2>Session actions</h2>
        <p className="subtle">Start one or more sessions, then end any active session from the selector below.</p>

        <div className="inline-form sessions-actions-form">
          <label className="sessions-field">
            <span>Charger</span>
            <select
              value={chargerId}
              onChange={(e) => setChargerId(e.target.value)}
              aria-label="Charger"
              disabled={!canStartSession}
            >
              <option value="">Select charger</option>
              {chargers.map((charger) => (
                <option key={charger.charger_id} value={charger.charger_id}>
                  {charger.charger_code} ({charger.status})
                </option>
              ))}
            </select>
          </label>

          <label className="sessions-field">
            <span>Vehicle (license plate)</span>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              aria-label="Vehicle"
              disabled={!canStartSession}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.license_plate} {vehicle.is_ev ? "(EV)" : "(Non-EV)"}
                </option>
              ))}
            </select>
          </label>

          <label className="sessions-field sessions-field-compact">
            <span>Meter at plug-in (kWh)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 12.3"
              value={kwhStart}
              onChange={(e) => setKwhStart(e.target.value)}
              disabled={!canStartSession || !isSelectedVehicleEV}
            />
          </label>

          <label className="sessions-field sessions-field-compact">
            <span>Reservation ID (optional)</span>
            <input
              type="number"
              min="1"
              placeholder="Only if linked"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              disabled={!canStartSession}
            />
          </label>

          <button className="button-primary" onClick={start} disabled={!canStartSession}>
            Start session
          </button>
        </div>

        {!isSelectedVehicleEV && (
          <p className="subtle sessions-helper-text">
            Non-EV vehicle selected: meter values are not required for this session.
          </p>
        )}

        {!loading && chargers.length === 0 && (
          <p className="subtle sessions-helper-text">No chargers available right now.</p>
        )}
        {!loading && vehicles.length === 0 && (
          <p className="subtle sessions-helper-text">Add a vehicle first, then start a charging session.</p>
        )}

        {sessionToEnd ? (
          <div className="sessions-active-block">
            <p>Active sessions: <strong>{activeSessions.length}</strong></p>

            {activeSessions.length > 1 && (
              <div className="sessions-end-picker">
                <label className="sessions-field sessions-field-compact">
                  <span>Session to end</span>
                  <select
                    value={selectedEndSessionId}
                    onChange={(e) => setSelectedEndSessionId(e.target.value)}
                    aria-label="Session to end"
                    disabled={actionBusy || loading}
                  >
                    {activeSessions.map((item) => (
                      <option key={item.session_id} value={item.session_id}>
                        #{item.session_id} - {vehicleLabelById.get(item.vehicle_id) ?? `Vehicle ${item.vehicle_id}`} - Charger {item.charger_id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <p className="sessions-helper-text">
              Ending <strong>#{sessionToEnd.session_id}</strong> on charger #{sessionToEnd.charger_id}
            </p>
            <div className="inline-form sessions-end-form">
              {isEndingSessionEV ? (
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={kwhEnd}
                  onChange={(e) => setKwhEnd(e.target.value)}
                  aria-label="kWh end"
                />
              ) : (
                <input value="Not required for non-EV session" aria-label="kWh end" disabled />
              )}
              <button onClick={end} disabled={actionBusy || loading || !hasKnownVehicleForEndingSession}>End selected session</button>
            </div>
            {!hasKnownVehicleForEndingSession && (
              <p className="subtle sessions-helper-text">
                Vehicle details for this session are unavailable in your current vehicle list.
              </p>
            )}
          </div>
        ) : (
          <p className="sessions-active-block">No active session.</p>
        )}

        {notice && <p className="sessions-feedback sessions-feedback-success">{notice}</p>}
        {error && <p className="error sessions-feedback">{error}</p>}
      </div>

      <div className="card table-card">
        <div className="table-head">
          <h2>{isAdmin ? "All sessions" : "Session history"}</h2>
        </div>
        {loading && <p className="table-state">Loading sessions...</p>}
        {!loading && list.length === 0 && !error && (
          <p className="table-state">No sessions yet.</p>
        )}

        {!loading && list.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Charger</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>kWh</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {list.map((session) => (
                <tr key={session.session_id}>
                  <td>#{session.session_id}</td>
                  <td>#{session.charger_id}</td>
                  <td>
                    {vehicleLabelById.get(session.vehicle_id)
                      ? `${vehicleLabelById.get(session.vehicle_id)} (#${session.vehicle_id})`
                      : `Unknown vehicle (#${session.vehicle_id})`}
                  </td>
                  <td>
                    <span className={session.status === "Active" ? "pill pill-success" : "pill pill-muted"}>
                      {session.status}
                    </span>
                  </td>
                  <td>{formatTimestamp(session.plug_in_time)}</td>
                  <td>{formatTimestamp(session.plug_out_time)}</td>
                  <td>
                    {session.kwh_consumed !== undefined
                      ? session.kwh_consumed.toFixed(2)
                      : session.kwh_end !== undefined
                        ? Math.max(session.kwh_end - session.kwh_start, 0).toFixed(2)
                        : "-"}
                  </td>
                  <td>{session.total_cost !== undefined ? `INR ${session.total_cost.toFixed(2)}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!vehicles.length && (
        <p className="subtle sessions-empty-note">
          No vehicles found for your account. Add one in the Vehicles page before starting a session.
        </p>
      )}
    </section>
  );
}
