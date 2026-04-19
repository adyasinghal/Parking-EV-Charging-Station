import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { reservationsApi } from "../../api/reservations";
import { spotsApi } from "../../api/spots";
import { getApiErrorMessage } from "../../lib/errors";
import type { Reservation, Spot } from "../../types";

const dt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed: { bg: "#dcfce7", color: "#16a34a" },
  Cancelled: { bg: "#fee2e2", color: "#dc2626" },
  Completed: { bg: "#dbeafe", color: "#2563eb" },
  No_Show: { bg: "#fef9c3", color: "#ca8a04" },
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : dt.format(parsed);
}

export default function ReservationDetailPage() {
  const { id } = useParams();
  const reservationId = Number(id);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      setError("Invalid reservation id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const reservationData = await reservationsApi.getById(reservationId);
      setReservation(reservationData);
      const spotData = await spotsApi.getById(reservationData.spot_id).catch(() => null);
      setSpot(spotData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load reservation details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [reservationId]);

  const style = reservation ? statusStyle[reservation.status] ?? { bg: "#f3f4f6", color: "#374151" } : null;

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Reservation details</h2>
          <p>View booking timeline, assigned spot, and current status.</p>
        </div>
        <Link className="button-secondary" to="/reservations">Back to reservations</Link>
      </div>

      {loading && <p className="table-state">Loading reservation...</p>}
      {error && <p className="error table-state">{error}</p>}

      {!loading && !error && reservation && style && (
        <div className="card" style={{ padding: "1.2rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p className="subtle">Reservation</p>
              <h3 style={{ margin: 0 }}>#{reservation.reservation_id}</h3>
            </div>
            <span
              style={{
                background: style.bg,
                color: style.color,
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                height: "fit-content",
              }}
            >
              {reservation.status.replace("_", " ")}
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.55rem" }}>
            <div><span className="subtle">User ID:</span> #{reservation.user_id}</div>
            <div><span className="subtle">Vehicle ID:</span> {reservation.vehicle_id ? `#${reservation.vehicle_id}` : "Not set"}</div>
            <div>
              <span className="subtle">Spot:</span>{" "}
              {spot ? `${spot.spot_code} (${spot.type}) · Zone #${spot.zone_id}` : `#${reservation.spot_id}`}
            </div>
            <div><span className="subtle">Start:</span> {formatDate(reservation.start_time)}</div>
            <div><span className="subtle">End:</span> {formatDate(reservation.end_time)}</div>
            <div><span className="subtle">Created:</span> {formatDate(reservation.created_at)}</div>
          </div>
        </div>
      )}
    </section>
  );
}

