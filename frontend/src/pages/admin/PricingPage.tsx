import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { pricingApi } from "../../api/pricing";
import { zonesApi } from "../../api/zones";
import { getApiErrorMessage } from "../../lib/errors";
import type { PricingRule, Zone } from "../../types";

export default function PricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const [form, setForm] = useState({
    zone_id: "",
    rule_name: "",
    is_peak: false,
    peak_start_time: "",
    peak_end_time: "",
    base_rate_per_hr: "",
    peak_multiplier: "",
    energy_rate_kwh: "",
    effective_from: "",
    effective_until: "",
  });

  const load = () => {
    Promise.all([pricingApi.list(), zonesApi.list()])
      .then(([r, z]) => { setRules(r); setZones(z); })
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load pricing rules")));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ zone_id: "", rule_name: "", is_peak: false, peak_start_time: "", peak_end_time: "",
      base_rate_per_hr: "", peak_multiplier: "", energy_rate_kwh: "", effective_from: "", effective_until: "" });
    setEditingRule(null);
    setShowForm(false);
  };

  const openEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setForm({
      zone_id: String(rule.zone_id),
      rule_name: rule.rule_name || "",
      is_peak: rule.is_peak,
      peak_start_time: rule.peak_start_time || "",
      peak_end_time: rule.peak_end_time || "",
      base_rate_per_hr: String(rule.base_rate_per_hr),
      peak_multiplier: rule.peak_multiplier != null ? String(rule.peak_multiplier) : "",
      energy_rate_kwh: rule.energy_rate_kwh != null ? String(rule.energy_rate_kwh) : "",
      effective_from: rule.effective_from,
      effective_until: rule.effective_until || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      zone_id: Number(form.zone_id),
      rule_name: form.rule_name || undefined,
      is_peak: form.is_peak,
      peak_start_time: form.peak_start_time || undefined,
      peak_end_time: form.peak_end_time || undefined,
      base_rate_per_hr: Number(form.base_rate_per_hr),
      peak_multiplier: form.peak_multiplier ? Number(form.peak_multiplier) : undefined,
      energy_rate_kwh: form.energy_rate_kwh ? Number(form.energy_rate_kwh) : undefined,
      effective_from: form.effective_from,
      effective_until: form.effective_until || undefined,
    };
    try {
      if (editingRule) {
        await pricingApi.update(editingRule.rule_id, payload);
      } else {
        await pricingApi.create(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save pricing rule"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this pricing rule?")) return;
    try {
      await pricingApi.remove(id);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete pricing rule"));
    }
  };

  const zoneName = (id: number) => zones.find((z) => z.zone_id === id)?.zone_name || String(id);

  return (
    <section>
      <h1>Pricing Rules</h1>
      {error && <p className="error">{error}</p>}

      <button onClick={() => { resetForm(); setShowForm(true); }} style={{ marginBottom: "1rem" }}>
        + Add Rule
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ border: "1px solid #e5e7eb", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <h3>{editingRule ? "Edit Rule" : "New Rule"}</h3>
          <div className="inline-form" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <select value={form.zone_id} onChange={(e) => setForm({ ...form, zone_id: e.target.value })} required>
              <option value="">Select zone</option>
              {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
            </select>
            <input placeholder="Rule name" value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} />
            <label>
              <input type="checkbox" checked={form.is_peak} onChange={(e) => setForm({ ...form, is_peak: e.target.checked })} />
              {" "}Peak pricing
            </label>
            {form.is_peak && (
              <>
                <input type="time" placeholder="Peak start" value={form.peak_start_time} onChange={(e) => setForm({ ...form, peak_start_time: e.target.value })} />
                <input type="time" placeholder="Peak end" value={form.peak_end_time} onChange={(e) => setForm({ ...form, peak_end_time: e.target.value })} />
                <input type="number" step="0.01" placeholder="Peak multiplier" value={form.peak_multiplier} onChange={(e) => setForm({ ...form, peak_multiplier: e.target.value })} />
              </>
            )}
            <input type="number" step="0.0001" placeholder="Base rate/hr (₹)" value={form.base_rate_per_hr} onChange={(e) => setForm({ ...form, base_rate_per_hr: e.target.value })} required />
            <input type="number" step="0.0001" placeholder="Energy rate/kWh" value={form.energy_rate_kwh} onChange={(e) => setForm({ ...form, energy_rate_kwh: e.target.value })} />
            <input type="date" placeholder="Effective from" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} required />
            <input type="date" placeholder="Effective until" value={form.effective_until} onChange={(e) => setForm({ ...form, effective_until: e.target.value })} />
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button type="submit">{editingRule ? "Save Changes" : "Create Rule"}</button>
            <button type="button" onClick={resetForm} style={{ marginLeft: "0.5rem" }}>Cancel</button>
          </div>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Zone</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Base Rate/hr</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Energy/kWh</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Peak</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Effective From</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Until</th>
            <th style={{ textAlign: "left", padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.rule_id} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.5rem" }}>{zoneName(rule.zone_id)}</td>
              <td style={{ padding: "0.5rem" }}>{rule.rule_name || "—"}</td>
              <td style={{ padding: "0.5rem" }}>₹{rule.base_rate_per_hr}</td>
              <td style={{ padding: "0.5rem" }}>{rule.energy_rate_kwh != null ? `₹${rule.energy_rate_kwh}` : "—"}</td>
              <td style={{ padding: "0.5rem" }}>
                {rule.is_peak ? (
                  <span style={{ background: "#f59e0b", color: "#fff", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.75rem" }}>
                    Peak {rule.peak_start_time}–{rule.peak_end_time}
                  </span>
                ) : "No"}
              </td>
              <td style={{ padding: "0.5rem" }}>{rule.effective_from}</td>
              <td style={{ padding: "0.5rem" }}>{rule.effective_until || "—"}</td>
              <td style={{ padding: "0.5rem" }}>
                <button onClick={() => openEdit(rule)}>Edit</button>
                <button onClick={() => handleDelete(rule.rule_id)} style={{ marginLeft: "0.25rem" }}>Delete</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>No pricing rules found</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
