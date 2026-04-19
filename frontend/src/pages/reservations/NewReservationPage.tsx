import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zonesApi } from "../../api/zones";
import { spotsApi } from "../../api/spots";
import { vehiclesApi } from "../../api/vehicles";
import { reservationsApi } from "../../api/reservations";
import { getApiErrorMessage } from "../../lib/errors";
import type { Spot, Vehicle, Zone } from "../../types";

type Step = 1 | 2 | 3;

const SPOT_TYPE_ICONS: Record<string, string> = {
  EV_Enabled: "⚡",
  Handicapped: "♿",
  Compact: "🚗",
  Oversized: "🚛",
  Standard: "🅿",
};

export default function NewReservationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState("");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ start_time: string; end_time: string }>>([]);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => {});
    vehiclesApi.list().then(setVehicles).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedZoneId) return;
    zonesApi
      .spots(Number(selectedZoneId))
      .then((s) => setSpots(s.filter((sp) => sp.status !== "Under_Maintenance")))
      .catch(() => setSpots([]));
    const t = window.setTimeout(() => {
      setSelectedSpotId("");
      setAvailability(null);
      setConflicts([]);
    }, 0);
    return () => window.clearTimeout(t);
  }, [selectedZoneId]);

  const checkAvailability = async () => {
    if (!selectedSpotId || !startTime || !endTime) return;
    setError(null);
    setCheckingAvail(true);
    try {
      const result = await spotsApi.availability(
        Number(selectedSpotId),
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
      );
      setAvailability(result.available);
      setConflicts(result.conflicts ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to check availability"));
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await reservationsApi.create({
        spot_id: Number(selectedSpotId),
        vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      });
      navigate("/reservations");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create reservation"));
      setSubmitting(false);
    }
  };

  const selectedSpot = spots.find((s) => s.spot_id === Number(selectedSpotId));
  const selectedZone = zones.find((z) => z.zone_id === Number(selectedZoneId));
  const selectedVehicle = vehicles.find((v) => v.vehicle_id === Number(selectedVehicleId));

  const durationHrs = startTime && endTime
    ? ((new Date(endTime).getTime() - new Date(startTime).getTime()) / 3_600_000).toFixed(1)
    : null;

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>New reservation</h2>
          <p>Select a zone, spot, and time window to book your parking slot.</p>
        </div>
        <Link className="button-secondary" to="/reservations">← Back to reservations</Link>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "6px 16px",
                borderRadius: "9999px",
                background: step === s ? "#3b82f6" : step > s ? "#22c55e" : "#f3f4f6",
                color: step >= s ? "#fff" : "#6b7280",
                fontSize: "0.82rem", fontWeight: 600,
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                background: step > s ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.12)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem",
              }}>
                {step > s ? "✓" : s}
              </span>
              {s === 1 ? "Choose spot" : s === 2 ? "Date & time" : "Confirm"}
            </div>
          ))}
        </div>

        {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}

        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Select a parking zone</h3>
            <div className="form-stack" style={{ maxWidth: 420 }}>
              <label>
                Zone
                <select value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)}>
                  <option value="">Select zone…</option>
                  {zones.filter((z) => z.is_active).map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.zone_name} — {z.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedZoneId && (
              <>
                <h3 style={{ margin: "1.25rem 0 0.75rem" }}>Spots in zone</h3>
                {spots.length === 0 ? (
                  <p className="subtle">No reservable spots in this zone right now.</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                    {spots.map((spot) => (
                      <button
                        key={spot.spot_id}
                        type="button"
                        onClick={() => setSelectedSpotId(String(spot.spot_id))}
                        style={{
                          padding: "10px 18px",
                          border: selectedSpotId === String(spot.spot_id)
                            ? "2px solid #3b82f6"
                            : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          background: selectedSpotId === String(spot.spot_id) ? "#eff6ff" : "#fff",
                          cursor: "pointer",
                          minWidth: 80,
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {SPOT_TYPE_ICONS[spot.type] ?? "🅿"} {spot.spot_code}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 2 }}>
                          {spot.type.replace("_", " ")} · Floor {spot.floor_level ?? 0}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: "1.5rem" }}>
              <button
                className="button-primary"
                disabled={!selectedSpotId}
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "0.75rem 1rem", marginBottom: "1.25rem",
              display: "flex", gap: "1rem", flexWrap: "wrap",
            }}>
              <span><span className="subtle">Zone:</span> <strong>{selectedZone?.zone_name}</strong></span>
              <span><span className="subtle">Spot:</span> <strong>{selectedSpot?.spot_code}</strong> ({selectedSpot?.type.replace("_", " ")})</span>
            </div>

            <h3 style={{ marginBottom: "1rem" }}>Choose date & time</h3>
            <div className="form-stack" style={{ maxWidth: 420 }}>
              <label>
                Start time
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); setAvailability(null); setConflicts([]); }}
                />
              </label>
              <label>
                End time
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setAvailability(null); setConflicts([]); }}
                />
              </label>

              {startTime && endTime && durationHrs && Number(durationHrs) > 0 && (
                <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                  Duration: <strong>{durationHrs} hrs</strong>
                </p>
              )}

              <button
                type="button"
                className="button-secondary"
                onClick={checkAvailability}
                disabled={!startTime || !endTime || checkingAvail}
              >
                {checkingAvail ? "Checking…" : "Check availability"}
              </button>

              {availability === true && (
                <p style={{ color: "#16a34a", fontWeight: 500 }}>✓ Spot is available for this window.</p>
              )}
              {availability === false && (
                <div style={{ color: "#dc2626", fontWeight: 500 }}>
                  <p>✗ Spot is not available for the selected window.</p>
                  {conflicts.length > 0 && (
                    <>
                      <p style={{ marginTop: "0.35rem" }}>Conflicting reservations:</p>
                      <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontWeight: 400 }}>
                        {conflicts.map((conflict, idx) => (
                          <li key={`${conflict.start_time}-${conflict.end_time}-${idx}`}>
                            {new Date(conflict.start_time).toLocaleString()} to {new Date(conflict.end_time).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              <label>
                Vehicle (optional)
                <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                  <option value="">No vehicle selected</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate}{v.make ? ` · ${v.make}` : ""}{v.model ? ` ${v.model}` : ""}
                      {v.is_ev ? " ⚡" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
              <button className="button-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="button-primary"
                disabled={!startTime || !endTime || availability !== true}
                onClick={() => setStep(3)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: "1rem" }}>Review & confirm</h3>
            <div style={{
              border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.25rem",
              marginBottom: "1.25rem", display: "grid", gap: "0.6rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="subtle">Zone</span>
                <strong>{selectedZone?.zone_name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="subtle">Spot</span>
                <strong>{selectedSpot?.spot_code} · {selectedSpot?.type.replace("_", " ")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="subtle">Start</span>
                <span>{new Date(startTime).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="subtle">End</span>
                <span>{new Date(endTime).toLocaleString()}</span>
              </div>
              {durationHrs && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="subtle">Duration</span>
                  <span>{durationHrs} hrs</span>
                </div>
              )}
              {selectedVehicle && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="subtle">Vehicle</span>
                  <span>{selectedVehicle.license_plate}{selectedVehicle.is_ev ? " ⚡" : ""}</span>
                </div>
              )}
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: "1rem" }}>
              A minimum wallet balance of ₹50 is required to confirm a reservation.
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" className="button-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button type="submit" className="button-primary" disabled={submitting}>
                {submitting ? "Confirming…" : "Confirm reservation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
