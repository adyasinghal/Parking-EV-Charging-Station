import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/errors";
import { loadLiveDashboardData } from "../../lib/liveMetrics";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof loadLiveDashboardData>>["kpis"]>([]);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof loadLiveDashboardData>>["activity"]>([]);
  const [chargerLoad, setChargerLoad] = useState<Awaited<ReturnType<typeof loadLiveDashboardData>>["chargerLoad"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadLiveDashboardData()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setKpis(data.kpis);
        setActivity(data.activity);
        setChargerLoad(data.chargerLoad);
      })
      .catch((err: unknown) => {
        if (!isMounted) {
          return;
        }
        setError(getApiErrorMessage(err, "Failed to load dashboard data"));
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="dashboard-page">
      <div className="dashboard-intro card">
        <div>
          <h2>Welcome back, {user?.full_name}.</h2>
          <p>
            Your network is healthy today. Keep an eye on reservation flow and charger utilization
            to stay ahead of peak demand.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/reservations/new" className="button-primary">
            New reservation
          </Link>
          <Link to="/chargers" className="button-secondary">
            View chargers
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="card stat-card">
            <p>{kpi.label}</p>
            <h3>{kpi.value}</h3>
            <span>{kpi.trend}</span>
          </article>
        ))}
      </div>

      {loading && <p>Loading live dashboard data...</p>}
      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <article className="card">
          <h3>Recent activity</h3>
          {activity.length > 0 ? (
            <ul className="activity-list">
              {activity.map((entry) => (
                <li key={`${entry.time}-${entry.text}`}>
                  <strong>{entry.time}</strong>
                  <span>{entry.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            !loading && <p>No recent activity yet.</p>
          )}
        </article>

        <article className="card">
          <h3>Charger load by zone</h3>
          {chargerLoad.length > 0 ? (
            <div className="usage-bars">
              {chargerLoad.map((item) => (
                <div key={item.zone} className="usage-item">
                  <div>
                    <strong>{item.zone}</strong>
                    <span>{item.load}%</span>
                  </div>
                  <div className="usage-track">
                    <span className="usage-fill" style={{ width: `${item.load}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && <p>No zone utilization data available yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}
