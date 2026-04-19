import { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../../api/analytics";
import { getApiErrorMessage } from "../../lib/errors";
import { useChargerSSE } from "../../hooks/useSSE";
import { useSSEStore } from "../../store/sseStore";
import type {
  ChargerEfficiency,
  ChargerUtilization,
  HeatmapPoint,
  HighTrafficZone,
  OvertimeSession,
  ParkingOnlyUser,
  SessionFrequency,
  TopSpender,
  ZoneNoShowRate,
} from "../../types";

type TabKey = "traffic" | "chargers" | "billing" | "demand";
type EndpointKey =
  | "highTraffic"
  | "efficiency"
  | "topSpenders"
  | "noShow"
  | "heatmap"
  | "utilization"
  | "parkingOnly"
  | "overtime"
  | "frequency";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "traffic", label: "Traffic" },
  { key: "chargers", label: "Chargers" },
  { key: "billing", label: "Billing" },
  { key: "demand", label: "Demand" },
];

const endpointTitles: Record<EndpointKey, string> = {
  highTraffic: "high-traffic",
  efficiency: "charger-efficiency",
  topSpenders: "top-spenders",
  noShow: "no-show-rate",
  heatmap: "heatmap",
  utilization: "charger-utilization",
  parkingOnly: "parking-only-users",
  overtime: "overtime-sessions",
  frequency: "session-frequency",
};

const tabEndpoints: Record<TabKey, EndpointKey[]> = {
  traffic: ["highTraffic"],
  chargers: ["efficiency", "utilization"],
  billing: ["topSpenders", "noShow", "parkingOnly"],
  demand: ["heatmap", "overtime", "frequency"],
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("traffic");
  const [highTraffic, setHighTraffic] = useState<HighTrafficZone[]>([]);
  const [efficiency, setEfficiency] = useState<ChargerEfficiency[]>([]);
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [noShow, setNoShow] = useState<ZoneNoShowRate[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [utilization, setUtilization] = useState<ChargerUtilization[]>([]);
  const [parkingOnly, setParkingOnly] = useState<ParkingOnlyUser[]>([]);
  const [overtime, setOvertime] = useState<OvertimeSession[]>([]);
  const [frequency, setFrequency] = useState<SessionFrequency[]>([]);
  const [errors, setErrors] = useState<Partial<Record<EndpointKey, string>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useChargerSSE(true);
  const liveChargers = useSSEStore((s) => s.chargerStatuses);

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const nextErrors: Partial<Record<EndpointKey, string>> = {};
    const captureError = (key: EndpointKey, err: unknown) => {
      nextErrors[key] = getApiErrorMessage(err, `Failed to load ${endpointTitles[key]}`);
    };

    await Promise.all([
      analyticsApi.highTraffic()
        .then((data) => setHighTraffic(data))
        .catch((err: unknown) => captureError("highTraffic", err)),
      analyticsApi.chargerEfficiency()
        .then((data) => setEfficiency(data))
        .catch((err: unknown) => captureError("efficiency", err)),
      analyticsApi.topSpenders()
        .then((data) => setTopSpenders(data))
        .catch((err: unknown) => captureError("topSpenders", err)),
      analyticsApi.noShowRate()
        .then((data) => setNoShow(data))
        .catch((err: unknown) => captureError("noShow", err)),
      analyticsApi.heatmap()
        .then((data) => setHeatmap(data))
        .catch((err: unknown) => captureError("heatmap", err)),
      analyticsApi.chargerUtilization()
        .then((data) => setUtilization(data))
        .catch((err: unknown) => captureError("utilization", err)),
      analyticsApi.parkingOnlyUsers()
        .then((data) => setParkingOnly(data))
        .catch((err: unknown) => captureError("parkingOnly", err)),
      analyticsApi.overtimeSessions()
        .then((data) => setOvertime(data))
        .catch((err: unknown) => captureError("overtime", err)),
      analyticsApi.sessionFrequency()
        .then((data) => setFrequency(data))
        .catch((err: unknown) => captureError("frequency", err)),
    ]);

    setErrors(nextErrors);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const tabErrorMessages = useMemo(() => {
    const keys = tabEndpoints[activeTab];
    return keys.map((k) => errors[k]).filter((msg): msg is string => Boolean(msg));
  }, [activeTab, errors]);

  const liveCount = useMemo(() => Object.keys(liveChargers).length, [liveChargers]);
  const totalSessions = useMemo(
    () => highTraffic.reduce((sum, zone) => sum + zone.total_sessions, 0),
    [highTraffic],
  );
  const totalRevenue = useMemo(
    () => highTraffic.reduce((sum, zone) => sum + zone.total_revenue, 0),
    [highTraffic],
  );
  const avgUtilization = useMemo(() => {
    if (utilization.length === 0) return 0;
    const total = utilization.reduce((sum, item) => sum + item.utilization_pct, 0);
    return total / utilization.length;
  }, [utilization]);

  const statusPillClass = (status: string) => {
    if (status === "Available") return "pill pill-success";
    if (status === "Faulted" || status === "Offline") return "pill pill-warning";
    return "pill pill-muted";
  };

  const heatmapPeak = useMemo(
    () => heatmap.reduce((max, item) => Math.max(max, item.sessions_started), 0),
    [heatmap],
  );

  return (
    <section className="page-panel">
      <div className="page-header card">
        <div>
          <h2>Analytics</h2>
          <p>Live operations intelligence across traffic, chargers, billing, and demand.</p>
        </div>
        <button className="button-secondary" onClick={() => void load(true)} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="stat-grid">
        <article className="card stat-card">
          <p>Revenue tracked</p>
          <h3>{currency.format(totalRevenue)}</h3>
          <span>from high-traffic zones</span>
        </article>
        <article className="card stat-card">
          <p>Total sessions</p>
          <h3>{totalSessions}</h3>
          <span>across active zone records</span>
        </article>
        <article className="card stat-card">
          <p>Avg charger utilization</p>
          <h3>{avgUtilization.toFixed(1)}%</h3>
          <span>from utilization procedure output</span>
        </article>
        <article className="card stat-card">
          <p>Live charger statuses</p>
          <h3>{liveCount}</h3>
          <span>streamed through SSE</span>
        </article>
      </div>

      <div className="card analytics-tabs-card">
        <div className="analytics-tabs" role="tablist" aria-label="Analytics sections">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? "analytics-tab analytics-tab-active" : "analytics-tab"}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="table-state">Loading analytics data...</p>}

      {!loading && tabErrorMessages.length > 0 && (
        <div className="card table-card">
          <div className="table-head"><h2>Partial data warning</h2></div>
          {tabErrorMessages.map((msg) => (
            <p key={msg} className="error table-state">{msg}</p>
          ))}
        </div>
      )}

      {!loading && activeTab === "traffic" && (
        <>
          <div className="card table-card">
            <div className="table-head"><h2>Zone traffic overview</h2></div>
            {highTraffic.length === 0 && <p className="table-state">No traffic records available.</p>}
            {highTraffic.length > 0 && (
              <div className="usage-bars">
                {highTraffic.slice(0, 8).map((zone) => {
                  const width = totalSessions > 0 ? (zone.total_sessions / totalSessions) * 100 : 0;
                  return (
                    <div className="usage-item" key={zone.zone_id}>
                      <div>
                        <strong>{zone.zone_name}</strong>
                        <span>{zone.total_sessions} sessions</span>
                      </div>
                      <div className="usage-track">
                        <span className="usage-fill" style={{ width: `${Math.max(width, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>High traffic zones</h2></div>
            {highTraffic.length === 0 && <p className="table-state">No rows to display.</p>}
            {highTraffic.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>City</th>
                    <th>Total sessions</th>
                    <th>Avg session (hrs)</th>
                    <th>Total kWh</th>
                    <th>Total revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...highTraffic].sort((a, b) => b.total_sessions - a.total_sessions).map((zone) => (
                    <tr key={zone.zone_id}>
                      <td><strong>{zone.zone_name}</strong></td>
                      <td>{zone.city}</td>
                      <td>{zone.total_sessions}</td>
                      <td>{zone.avg_session_hrs.toFixed(2)}</td>
                      <td>{zone.total_kwh_delivered.toFixed(2)}</td>
                      <td>{currency.format(zone.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!loading && activeTab === "chargers" && (
        <>
          <div className="card table-card">
            <div className="table-head"><h2>Charger efficiency</h2></div>
            {efficiency.length === 0 && <p className="table-state">No efficiency rows available.</p>}
            {efficiency.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Charger</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Sessions</th>
                    <th>Avg kWh/session</th>
                    <th>Errors</th>
                    <th>Error rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[...efficiency].sort((a, b) => b.error_rate_pct - a.error_rate_pct).map((row) => (
                    <tr key={row.charger_id}>
                      <td><strong>{row.charger_code}</strong></td>
                      <td>{row.charger_type}</td>
                      <td><span className={statusPillClass(row.status)}>{row.status}</span></td>
                      <td>{row.total_sessions}</td>
                      <td>{row.avg_kwh_per_session.toFixed(2)}</td>
                      <td>{row.total_errors}</td>
                      <td>{row.error_rate_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>Charger utilization</h2></div>
            {utilization.length === 0 && <p className="table-state">No utilization rows available.</p>}
            {utilization.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Charger</th>
                    <th>Sessions</th>
                    <th>Usage hours</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {[...utilization].sort((a, b) => b.utilization_pct - a.utilization_pct).map((row) => (
                    <tr key={row.charger_id}>
                      <td><strong>{row.charger_code}</strong></td>
                      <td>{row.total_sessions}</td>
                      <td>{row.usage_hours.toFixed(2)}</td>
                      <td>{row.utilization_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!loading && activeTab === "billing" && (
        <>
          <div className="card table-card">
            <div className="table-head"><h2>Top spenders</h2></div>
            {topSpenders.length === 0 && <p className="table-state">No spender data available.</p>}
            {topSpenders.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Total spend</th>
                  </tr>
                </thead>
                <tbody>
                  {[...topSpenders].sort((a, b) => b.total_spend - a.total_spend).map((row) => (
                    <tr key={row.user_id}>
                      <td><strong>{row.full_name}</strong></td>
                      <td>{row.email}</td>
                      <td>{currency.format(row.total_spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>No-show rate by zone</h2></div>
            {noShow.length === 0 && <p className="table-state">No no-show data available.</p>}
            {noShow.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>No-shows</th>
                    <th>Total reservations</th>
                    <th>No-show rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[...noShow].sort((a, b) => b.no_show_rate_pct - a.no_show_rate_pct).map((row) => (
                    <tr key={row.zone_id}>
                      <td><strong>{row.zone_name}</strong></td>
                      <td>{row.no_show_count}</td>
                      <td>{row.total_count}</td>
                      <td>{row.no_show_rate_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>Parking-only users</h2></div>
            {parkingOnly.length === 0 && <p className="table-state">No parking-only users found.</p>}
            {parkingOnly.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parkingOnly.map((row) => (
                    <tr key={row.user_id}>
                      <td><strong>{row.full_name}</strong></td>
                      <td>{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!loading && activeTab === "demand" && (
        <>
          <div className="card table-card">
            <div className="table-head"><h2>Hourly demand heatmap</h2></div>
            {heatmap.length === 0 && <p className="table-state">No heatmap points returned.</p>}
            {heatmap.length > 0 && (
              <div className="analytics-heatmap-grid">
                {heatmap.map((point) => {
                  const ratio = heatmapPeak > 0 ? point.sessions_started / heatmapPeak : 0;
                  const alpha = Math.min(0.16 + ratio * 0.84, 1);
                  return (
                    <div
                      key={point.hour_of_day}
                      className="analytics-heatmap-cell"
                      style={{ backgroundColor: `oklch(72% 0.17 142 / ${alpha})` }}
                      title={`${point.time_window}: ${point.sessions_started} sessions`}
                    >
                      <span>{point.time_window}</span>
                      <strong>{point.sessions_started}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>Overtime sessions</h2></div>
            {overtime.length === 0 && <p className="table-state">No overtime sessions detected.</p>}
            {overtime.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>User</th>
                    <th>Charger</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {[...overtime].sort((a, b) => b.duration_hours - a.duration_hours).map((row) => (
                    <tr key={row.session_id}>
                      <td>#{row.session_id}</td>
                      <td><strong>{row.full_name}</strong></td>
                      <td>{row.charger_code}</td>
                      <td>{row.duration_hours.toFixed(2)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card table-card">
            <div className="table-head"><h2>Session frequency by user</h2></div>
            {frequency.length === 0 && <p className="table-state">No session frequency records available.</p>}
            {frequency.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...frequency].sort((a, b) => b.session_count - a.session_count).map((row) => (
                    <tr key={row.user_id}>
                      <td><strong>{row.full_name}</strong></td>
                      <td>{row.session_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}

