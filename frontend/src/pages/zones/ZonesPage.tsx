import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { chargersApi } from "../../api/chargers";
import { reservationsApi } from "../../api/reservations";
import { sessionsApi } from "../../api/sessions";
import { zonesApi } from "../../api/zones";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import type { Reservation, Spot, Zone } from "../../types";

type ZoneMetrics = {
  zone: Zone;
  spotCount: number;
  activeReservations: number;
  availableSpots: number;
  chargersTotal: number;
  chargersAvailable: number;
  sessionsToday: number;
};

function isSameUtcDay(iso: string, now: Date): boolean {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;
  return (
    value.getUTCFullYear() === now.getUTCFullYear() &&
    value.getUTCMonth() === now.getUTCMonth() &&
    value.getUTCDate() === now.getUTCDate()
  );
}

function isActiveReservation(reservation: Reservation, now: Date): boolean {
  if (reservation.status.toLowerCase() === "cancelled") return false;
  const start = new Date(reservation.start_time);
  const end = new Date(reservation.end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= now && end >= now;
}

type ZoneFormState = {
  zone_name: string;
  city: string;
  address: string;
  total_spots: string;
  is_active: boolean;
};

const emptyForm: ZoneFormState = { zone_name: "", city: "", address: "", total_spots: "", is_active: true };

export default function ZonesPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";

  const [metrics, setMetrics] = useState<ZoneMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [formState, setFormState] = useState<ZoneFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const [zones, chargers, reservations, sessions] = await Promise.all([
        zonesApi.list(),
        chargersApi.list(),
        reservationsApi.list(),
        sessionsApi.list(),
      ]);

      const spotsByZone = await Promise.all(
        zones.map(async (zone) => ({
          zoneId: zone.zone_id,
          spots: await zonesApi.spots(zone.zone_id).catch(() => [] as Spot[]),
        })),
      );

      const spotToZone = new Map<number, number>();
      for (const entry of spotsByZone) {
        for (const spot of entry.spots) spotToZone.set(spot.spot_id, entry.zoneId);
      }

      const zoneByCharger = new Map<number, number>();
      for (const charger of chargers) {
        const zoneId = spotToZone.get(charger.spot_id);
        if (zoneId) zoneByCharger.set(charger.charger_id, zoneId);
      }

      const computed: ZoneMetrics[] = zones.map((zone) => {
        const spots = spotsByZone.find((e) => e.zoneId === zone.zone_id)?.spots ?? [];
        const spotCount = Math.max(zone.total_spots, spots.length);
        const activeReservations = reservations.filter(
          (r) => isActiveReservation(r, now) && spotToZone.get(r.spot_id) === zone.zone_id,
        ).length;
        const chargersInZone = chargers.filter((c) => spotToZone.get(c.spot_id) === zone.zone_id);
        const sessionsToday = sessions.filter(
          (s) => isSameUtcDay(s.plug_in_time, now) && zoneByCharger.get(s.charger_id) === zone.zone_id,
        ).length;
        return {
          zone,
          spotCount,
          activeReservations,
          availableSpots: Math.max(spotCount - activeReservations, 0),
          chargersTotal: chargersInZone.length,
          chargersAvailable: chargersInZone.filter((c) => c.status === "Available").length,
          sessionsToday,
        };
      });

      setMetrics(computed);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load zones"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        const now = new Date();
        const [zones, chargers, reservations, sessions] = await Promise.all([
          zonesApi.list(),
          chargersApi.list(),
          reservationsApi.list(),
          sessionsApi.list(),
        ]);
        const spotsByZone = await Promise.all(
          zones.map(async (zone) => ({
            zoneId: zone.zone_id,
            spots: await zonesApi.spots(zone.zone_id).catch(() => [] as Spot[]),
          })),
        );
        const spotToZone = new Map<number, number>();
        for (const entry of spotsByZone)
          for (const spot of entry.spots) spotToZone.set(spot.spot_id, entry.zoneId);
        const zoneByCharger = new Map<number, number>();
        for (const charger of chargers) {
          const zoneId = spotToZone.get(charger.spot_id);
          if (zoneId) zoneByCharger.set(charger.charger_id, zoneId);
        }
        const computed: ZoneMetrics[] = zones.map((zone) => {
          const spots = spotsByZone.find((e) => e.zoneId === zone.zone_id)?.spots ?? [];
          const spotCount = Math.max(zone.total_spots, spots.length);
          const activeReservations = reservations.filter(
            (r) => isActiveReservation(r, now) && spotToZone.get(r.spot_id) === zone.zone_id,
          ).length;
          const chargersInZone = chargers.filter((c) => spotToZone.get(c.spot_id) === zone.zone_id);
          const sessionsToday = sessions.filter(
            (s) => isSameUtcDay(s.plug_in_time, now) && zoneByCharger.get(s.charger_id) === zone.zone_id,
          ).length;
          return {
            zone,
            spotCount,
            activeReservations,
            availableSpots: Math.max(spotCount - activeReservations, 0),
            chargersTotal: chargersInZone.length,
            chargersAvailable: chargersInZone.filter((c) => c.status === "Available").length,
            sessionsToday,
          };
        });
        if (isMounted) setMetrics(computed);
      } catch (err: unknown) {
        if (isMounted) setError(getApiErrorMessage(err, "Failed to load zones"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, []);

  const cities = useMemo(() => ["all", ...new Set(metrics.map((item) => item.zone.city))], [metrics]);

  const filtered = useMemo(
    () =>
      metrics.filter((item) => {
        const matchesSearch =
          search.trim().length === 0 ||
          item.zone.zone_name.toLowerCase().includes(search.toLowerCase()) ||
          item.zone.city.toLowerCase().includes(search.toLowerCase());
        const matchesCity = cityFilter === "all" || item.zone.city === cityFilter;
        const matchesActive =
          activeFilter === "all" ||
          (activeFilter === "active" && item.zone.is_active) ||
          (activeFilter === "inactive" && !item.zone.is_active);
        return matchesSearch && matchesCity && matchesActive;
      }),
    [activeFilter, cityFilter, metrics, search],
  );

  const totals = useMemo(
    () => ({
      zones: metrics.length,
      activeZones: metrics.filter((item) => item.zone.is_active).length,
      spots: metrics.reduce((sum, item) => sum + item.spotCount, 0),
      availableSpots: metrics.reduce((sum, item) => sum + item.availableSpots, 0),
      chargers: metrics.reduce((sum, item) => sum + item.chargersTotal, 0),
      chargersAvailable: metrics.reduce((sum, item) => sum + item.chargersAvailable, 0),
    }),
    [metrics],
  );

  const openCreate = () => {
    setFormState(emptyForm);
    setFormError(null);
    setShowCreateModal(true);
    setEditZone(null);
  };

  const openEdit = (zone: Zone) => {
    setFormState({
      zone_name: zone.zone_name,
      city: zone.city,
      address: zone.address ?? "",
      total_spots: String(zone.total_spots),
      is_active: zone.is_active,
    });
    setFormError(null);
    setEditZone(zone);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditZone(null);
    setFormError(null);
  };

  const handleSave = async () => {
    setFormError(null);
    const spots = parseInt(formState.total_spots, 10);
    if (!formState.zone_name.trim() || !formState.city.trim() || isNaN(spots) || spots < 1) {
      setFormError("Zone name, city, and a valid spot count (≥1) are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        zone_name: formState.zone_name.trim(),
        city: formState.city.trim(),
        address: formState.address.trim() || undefined,
        total_spots: spots,
        is_active: formState.is_active,
      };
      if (editZone) {
        await zonesApi.update(editZone.zone_id, payload);
      } else {
        await zonesApi.create(payload);
      }
      closeModal();
      await loadMetrics();
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, "Failed to save zone"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (zone: Zone) => {
    try {
      await zonesApi.update(zone.zone_id, { is_active: !zone.is_active });
      await loadMetrics();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update zone"));
    }
  };

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Zones overview</h2>
          <p>Track zone capacity, active reservations, and EV charger readiness in one view.</p>
        </div>
        {isAdmin && (
          <button className="button-primary" onClick={openCreate}>
            + Create Zone
          </button>
        )}
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Total zones</p>
          <h3>{totals.zones}</h3>
          <span>{totals.activeZones} active</span>
        </article>
        <article className="card stat-card">
          <p>Parking spots</p>
          <h3>{totals.spots}</h3>
          <span>{totals.availableSpots} currently open</span>
        </article>
        <article className="card stat-card">
          <p>EV chargers</p>
          <h3>{totals.chargers}</h3>
          <span>{totals.chargersAvailable} available</span>
        </article>
      </div>

      <div className="card table-card">
        <div className="filter-row">
          <input
            placeholder="Search by zone or city"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city === "all" ? "All cities" : city}
              </option>
            ))}
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        {loading && <p className="table-state">Loading zones...</p>}
        {error && <p className="error table-state">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="table-state">No zones match your filters.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Status</th>
                <th>Spots</th>
                <th>Chargers</th>
                <th>Sessions today</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.zone.zone_id}>
                  <td>
                    <strong>{item.zone.zone_name}</strong>
                    <div className="subtle">{item.zone.city}{item.zone.address ? ` · ${item.zone.address}` : ""}</div>
                  </td>
                  <td>
                    <span className={item.zone.is_active ? "pill pill-success" : "pill pill-muted"}>
                      {item.zone.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <strong>{item.availableSpots}</strong> / {item.spotCount}
                    <div className="subtle">{item.activeReservations} active reservations</div>
                  </td>
                  <td>
                    <strong>{item.chargersAvailable}</strong> / {item.chargersTotal}
                    <div className="subtle">available / total</div>
                  </td>
                  <td>{item.sessionsToday}</td>
                  <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <Link className="button-secondary" to={`/zones/${item.zone.zone_id}`}>
                      View
                    </Link>
                    {isAdmin && (
                      <>
                        <button className="button-secondary" onClick={() => openEdit(item.zone)}>
                          Edit
                        </button>
                        <button
                          className="button-secondary"
                          onClick={() => handleToggleActive(item.zone)}
                        >
                          {item.zone.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editZone ? "Edit Zone" : "Create Zone"}</h3>
            {formError && <p className="error">{formError}</p>}
            <div className="form-stack">
              <label>
                Zone name *
                <input
                  value={formState.zone_name}
                  onChange={(e) => setFormState((s) => ({ ...s, zone_name: e.target.value }))}
                  placeholder="e.g. Central Parking Hub"
                />
              </label>
              <label>
                City *
                <input
                  value={formState.city}
                  onChange={(e) => setFormState((s) => ({ ...s, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                />
              </label>
              <label>
                Address
                <input
                  value={formState.address}
                  onChange={(e) => setFormState((s) => ({ ...s, address: e.target.value }))}
                  placeholder="e.g. 12 MG Road, Andheri"
                />
              </label>
              <label>
                Total spots *
                <input
                  type="number"
                  min="1"
                  value={formState.total_spots}
                  onChange={(e) => setFormState((s) => ({ ...s, total_spots: e.target.value }))}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={(e) => setFormState((s) => ({ ...s, is_active: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div className="modal-actions">
              <button className="button-secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="button-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editZone ? "Save changes" : "Create zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
