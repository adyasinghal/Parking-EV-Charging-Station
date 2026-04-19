import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { vehiclesApi } from "../../api/vehicles";
import type { Vehicle } from "../../types";
import { getApiErrorMessage } from "../../lib/errors";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [licensePlate, setLicensePlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [isEV, setIsEV] = useState(false);
  const [batteryKW, setBatteryKW] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editLicensePlate, setEditLicensePlate] = useState("");
  const [editMake, setEditMake] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editIsEV, setEditIsEV] = useState(false);
  const [editBatteryKW, setEditBatteryKW] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehiclesApi.list();
      setVehicles(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load vehicles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const parsedYear = year.trim().length > 0 ? Number.parseInt(year.trim(), 10) : undefined;
      const parsedBatteryKW = isEV && batteryKW.trim().length > 0 ? Number.parseFloat(batteryKW.trim()) : undefined;
      const normalizedYear = parsedYear !== undefined && !Number.isNaN(parsedYear) ? parsedYear : undefined;
      const normalizedBatteryKW =
        parsedBatteryKW !== undefined && !Number.isNaN(parsedBatteryKW) ? parsedBatteryKW : undefined;

      await vehiclesApi.create({
        license_plate: licensePlate.trim(),
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: normalizedYear,
        is_ev: isEV,
        battery_kw: normalizedBatteryKW,
      });
      setLicensePlate("");
      setMake("");
      setModel("");
      setYear("");
      setIsEV(false);
      setBatteryKW("");
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create vehicle"));
    }
  };

  const remove = async (id: number) => {
    setError(null);
    try {
      await vehiclesApi.remove(id);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to remove vehicle"));
    }
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditLicensePlate(vehicle.license_plate);
    setEditMake(vehicle.make ?? "");
    setEditModel(vehicle.model ?? "");
    setEditYear(vehicle.year ? String(vehicle.year) : "");
    setEditIsEV(vehicle.is_ev);
    setEditBatteryKW(vehicle.battery_kw !== undefined ? String(vehicle.battery_kw) : "");
  };

  const closeEdit = () => {
    setEditingVehicle(null);
    setSavingEdit(false);
  };

  const saveEdit = async () => {
    if (!editingVehicle) return;
    setError(null);
    setSavingEdit(true);
    try {
      const parsedYear = editYear.trim().length > 0 ? Number.parseInt(editYear.trim(), 10) : undefined;
      const parsedBatteryKW = editIsEV && editBatteryKW.trim().length > 0
        ? Number.parseFloat(editBatteryKW.trim())
        : undefined;
      const normalizedYear = parsedYear !== undefined && !Number.isNaN(parsedYear) ? parsedYear : undefined;
      const normalizedBatteryKW =
        parsedBatteryKW !== undefined && !Number.isNaN(parsedBatteryKW) ? parsedBatteryKW : undefined;

      await vehiclesApi.update(editingVehicle.vehicle_id, {
        license_plate: editLicensePlate.trim().toUpperCase() || undefined,
        make: editMake.trim() || undefined,
        model: editModel.trim() || undefined,
        year: normalizedYear,
        is_ev: editIsEV,
        battery_kw: normalizedBatteryKW,
      });
      closeEdit();
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update vehicle"));
      setSavingEdit(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((vehicle) => {
        const matchesSearch =
          search.trim().length === 0 ||
          vehicle.license_plate.toLowerCase().includes(search.toLowerCase()) ||
          `${vehicle.make || ""} ${vehicle.model || ""}`.toLowerCase().includes(search.toLowerCase());

        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "ev" && vehicle.is_ev) ||
          (typeFilter === "non-ev" && !vehicle.is_ev);

        return matchesSearch && matchesType;
      })
      .sort((a, b) => a.license_plate.localeCompare(b.license_plate));
  }, [search, typeFilter, vehicles]);

  const totals = useMemo(() => {
    return {
      total: vehicles.length,
      ev: vehicles.filter((vehicle) => vehicle.is_ev).length,
      nonEv: vehicles.filter((vehicle) => !vehicle.is_ev).length,
    };
  }, [vehicles]);

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Vehicles</h2>
          <p>Manage registered vehicles for reservations and charging sessions.</p>
        </div>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Total vehicles</p>
          <h3>{totals.total}</h3>
          <span>Registered in your account</span>
        </article>
        <article className="card stat-card">
          <p>EV vehicles</p>
          <h3>{totals.ev}</h3>
          <span>Eligible for charging sessions</span>
        </article>
        <article className="card stat-card">
          <p>Non-EV vehicles</p>
          <h3>{totals.nonEv}</h3>
          <span>Parking only</span>
        </article>
      </div>

      <div className="card table-card">
        <div className="table-head">
          <h2>Add vehicle</h2>
        </div>
        <form onSubmit={add} className="filter-row">
          <input
            placeholder="License plate"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            required
          />
          <input
            placeholder="Make (optional)"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
          <input
            placeholder="Model (optional)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <input
            type="number"
            min={1990}
            max={2100}
            placeholder="Year (optional)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <label className="checkbox-pill">
            <input type="checkbox" checked={isEV} onChange={(e) => setIsEV(e.target.checked)} />
            EV enabled
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Battery kW (EV only)"
            value={batteryKW}
            onChange={(e) => setBatteryKW(e.target.value)}
            disabled={!isEV}
          />
          <button className="button-primary" type="submit">Add vehicle</button>
        </form>
      </div>

      <div className="card table-card">
        <div className="table-head">
          <h2>Vehicle list</h2>
        </div>

        <div className="filter-row">
          <input
            placeholder="Search by plate, make, or model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="ev">EV only</option>
            <option value="non-ev">Non-EV only</option>
          </select>
        </div>

        {loading && <p className="table-state">Loading vehicles...</p>}
        {error && <p className="error table-state">{error}</p>}

        {!loading && !error && filteredVehicles.length === 0 && (
          <p className="table-state">No vehicles found for this filter.</p>
        )}

        {!loading && !error && filteredVehicles.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>License plate</th>
                <th>Type</th>
                <th>Make / Model</th>
                <th>Year</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.vehicle_id}>
                  <td>
                    <strong>{vehicle.license_plate}</strong>
                  </td>
                  <td>
                    <span className={vehicle.is_ev ? "pill pill-success" : "pill pill-muted"}>
                      {vehicle.is_ev ? "EV" : "Non-EV"}
                    </span>
                  </td>
                  <td>{[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Unknown"}</td>
                  <td>{vehicle.year || "-"}</td>
                  <td>
                    <span style={{ display: "flex", gap: "0.4rem" }}>
                      <button type="button" className="button-secondary" onClick={() => openEdit(vehicle)}>
                        Edit
                      </button>
                      <button type="button" className="button-secondary" onClick={() => remove(vehicle.vehicle_id)}>
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingVehicle && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Edit vehicle #{editingVehicle.vehicle_id}</h3>
            <div className="form-stack">
              <label>
                License plate
                <input
                  value={editLicensePlate}
                  onChange={(e) => setEditLicensePlate(e.target.value.toUpperCase())}
                />
              </label>
              <label>
                Make
                <input value={editMake} onChange={(e) => setEditMake(e.target.value)} />
              </label>
              <label>
                Model
                <input value={editModel} onChange={(e) => setEditModel(e.target.value)} />
              </label>
              <label>
                Year
                <input
                  type="number"
                  min={1990}
                  max={2100}
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                />
              </label>
              <label className="checkbox-label" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={editIsEV} onChange={(e) => setEditIsEV(e.target.checked)} />
                EV enabled
              </label>
              <label>
                Battery kW
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={editBatteryKW}
                  onChange={(e) => setEditBatteryKW(e.target.value)}
                  disabled={!editIsEV}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="button-secondary" onClick={closeEdit} disabled={savingEdit}>
                Cancel
              </button>
              <button className="button-primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
