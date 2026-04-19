import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi, type PublicStats, type PublicZone } from "../../api/public";
import { useAuthStore } from "../../store/authStore";

const opPattern = [
  0,0,1,1,2,3,3,2,1,0,0,0,
  0,1,1,2,2,3,3,3,2,1,0,0,
  0,0,1,2,2,3,2,2,1,1,0,0,
  0,0,0,1,1,2,2,1,1,0,0,0,
];

function formatClock() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function zoneStatus(z: PublicZone): "open" | "busy" | "full" {
  const pct = z.total_spots > 0 ? (z.total_spots - z.open_spots) / z.total_spots : 1;
  if (pct >= 1) return "full";
  if (pct >= 0.75) return "busy";
  return "open";
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

const PIN_POSITIONS = [
  { left: "32%", top: "30%" },
  { left: "68%", top: "26%" },
  { left: "60%", top: "70%" },
  { left: "22%", top: "62%" },
  { left: "86%", top: "75%" },
];

export default function LandingPage() {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState(0);
  const [clock, setClock] = useState(formatClock());
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [zones, setZones] = useState<PublicZone[]>([]);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    publicApi.stats().then(setStats).catch(() => {});
    publicApi.zones().then(setZones).catch(() => {});
  }, []);

  const displayZones = zones.slice(0, 5);
  const totalOpenSpots = zones.reduce((s, z) => s + z.open_spots, 0);
  const totalZonesShown = displayZones.length;

  return (
    <div className="vp-page">

      {/* ── Nav ── */}
      <div className="vp-wrap">
        <nav className="vp-nav">
          <Link to="/" className="vp-logo">
            <div className="vp-logo-mark">V</div>
            <span>VoltPark</span>
          </Link>
          <div className="vp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#operators">For operators</a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {token ? (
              <Link to="/dashboard" className="vp-btn vp-btn-primary vp-btn-sm">Dashboard →</Link>
            ) : (
              <>
                <Link to="/login"    className="vp-btn vp-btn-ghost vp-btn-sm">Sign in</Link>
                <Link to="/register" className="vp-btn vp-btn-primary vp-btn-sm">Get started →</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <div className="vp-wrap">
        <div className="vp-hero">

          {/* Left */}
          <div>
            <div className="vp-eyebrow">
              <span className="vp-pulse" />
              {stats ? `${fmtNumber(stats.total_spots)} spots live right now` : "Live network"}
            </div>
            <h1 className="vp-hero-title">
              Park it. <em>Charge it.</em><br />Done.
            </h1>
            <p className="vp-hero-sub">
              Reserve a curbside spot, plug into any charger, and settle the bill from one place.
              Built for drivers who don't want to think about it.
            </p>
            <div className="vp-hero-cta">
              <Link
                to={token ? "/dashboard" : "/register"}
                className="vp-btn vp-btn-primary vp-btn-lg"
              >
                {token ? "Open dashboard →" : "Find a spot near me →"}
              </Link>
              <a href="#how" className="vp-btn vp-btn-ghost vp-btn-lg">How it works</a>
            </div>
            <div className="vp-hero-meta">
              <div className="vp-stat">
                <div className="vp-stat-n">
                  {stats ? fmtNumber(stats.total_sessions) : "—"}
                </div>
                <div className="vp-stat-l">Sessions total</div>
              </div>
              <div className="vp-stat">
                <div className="vp-stat-n">
                  {stats ? `${stats.cities} cities` : "—"}
                </div>
                <div className="vp-stat-l">Live network</div>
              </div>
              <div className="vp-stat">
                <div className="vp-stat-n">
                  {stats ? `${Math.round(stats.peak_power_kw)}kW` : "—"}
                </div>
                <div className="vp-stat-l">Peak DC fast</div>
              </div>
            </div>
          </div>

          {/* Station widget */}
          <div className="vp-station-widget">
            <div className="vp-sw-head">
              <div className="vp-sw-live"><i />Live · active zones</div>
              <div className="vp-sw-clock">{clock}</div>
            </div>

            {/* Map — pins mapped to real zones */}
            <div className="vp-map">
              <div className="vp-road vp-road-h" style={{ top: "25%" }} />
              <div className="vp-road vp-road-h" style={{ top: "68%" }} />
              <div className="vp-road vp-road-v" style={{ left: "35%" }} />
              <div className="vp-road vp-road-v" style={{ left: "72%" }} />
              <div className="vp-road vp-road-diag" />
              <div className="vp-you" />
              {displayZones.map((z, i) => {
                const pos = PIN_POSITIONS[i] ?? { left: "50%", top: "50%" };
                const st = zoneStatus(z);
                return (
                  <button
                    key={z.zone_id}
                    type="button"
                    className={`vp-pin ${st === "open" ? "" : st} ${selected === i ? "selected" : ""}`.trim()}
                    style={{ left: pos.left, top: pos.top }}
                    onClick={() => setSelected(i)}
                    aria-label={`Select ${z.zone_name}`}
                  >
                    <div className="vp-pin-dot" />
                  </button>
                );
              })}
              <div className="vp-legend">
                <span><i className="vp-dot-open" />Open</span>
                <span><i className="vp-dot-busy" />Busy</span>
                <span><i className="vp-dot-full" />Full</span>
              </div>
            </div>

            <div className="vp-sw-list">
              {displayZones.length === 0 && (
                <div style={{ padding: "14px 10px", color: "var(--vp-ink-3)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                  Loading stations…
                </div>
              )}
              {displayZones.map((z, i) => {
                const st = zoneStatus(z);
                const openLabel = z.open_spots > 0 ? `${z.open_spots} open` : "FULL";
                const chargerLabel = z.available_chargers > 0 ? ` · ${z.available_chargers} charger${z.available_chargers !== 1 ? "s" : ""}` : "";
                return (
                  <div
                    key={z.zone_id}
                    className={`vp-sw-row${i === selected ? " active" : ""}`}
                    onClick={() => setSelected(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(i)}
                  >
                    <div className="vp-sw-idx">{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="vp-sw-name">{z.zone_name}</div>
                      <div className="vp-sw-sub">{z.city}{z.address ? ` · ${z.address}` : ""}{chargerLabel}</div>
                    </div>
                    <div className="vp-sw-open-count">{openLabel}</div>
                    <div className={`vp-sw-pill ${st}`}>{st}</div>
                  </div>
                );
              })}
            </div>

            <div className="vp-sw-foot">
              <div className="vp-sw-total">
                {totalZonesShown > 0
                  ? `${totalZonesShown} zones · ${totalOpenSpots} open spots`
                  : "Loading…"}
              </div>
              <Link
                to={token ? "/reservations/new" : "/register"}
                className="vp-sw-book"
              >
                Reserve a spot →
              </Link>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="vp-marquee">
          <div className="vp-marquee-label">The Team</div>
          <div className="vp-marquee-logos">
            <span>Aditya Singh</span>
            <span>Adya Singhal</span>
            <span>Avani Agarwal</span>
            <span>Bhavya Yadav</span>
            <span>Manan Raina Kumar</span>
            {/*<span>Vestra</span>*/}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="vp-wrap" id="features">
        <section className="vp-features">
          <div className="vp-sec-head">
            <div><div className="vp-sec-label">What you get</div></div>
            <div>
              <h2>Everything you need to get where you're going — nothing you don't.</h2>
            </div>
          </div>

          {/* 01 */}
          <div className="vp-feat-row">
            <div className="vp-feat-num">01 / 04</div>
            <div>
              <h3>Reserve the block, not just the spot.</h3>
              <p>Hold your curbside spot up to 6 hours in advance. Live traffic and occupancy data keep your reservation accurate — we release the spot if you don't show.</p>
              <div className="vp-tags">
                <span className="vp-tag">Live ETA</span>
                <span className="vp-tag">Hold &amp; release</span>
                <span className="vp-tag">Permit zones</span>
              </div>
            </div>
            <div className="vp-feat-visual">
              <div className="vp-lanes">
                <div className="vp-lane vp-lane-active">
                  <span>A-12</span>
                  <div className="vp-lane-bar" style={{ "--w": "90%" } as React.CSSProperties} />
                  <span>BOOKED</span>
                </div>
                <div className="vp-lane">
                  <span>A-13</span>
                  <div className="vp-lane-bar" style={{ "--w": "20%" } as React.CSSProperties} />
                  <span>OPEN</span>
                </div>
                <div className="vp-lane vp-lane-hold">
                  <span>A-14</span>
                  <div className="vp-lane-bar" style={{ "--w": "60%" } as React.CSSProperties} />
                  <span>HOLD</span>
                </div>
                <div className="vp-lane vp-lane-closed">
                  <span>A-15</span>
                  <div className="vp-lane-bar" style={{ "--w": "100%" } as React.CSSProperties} />
                  <span>CLOSED</span>
                </div>
              </div>
            </div>
          </div>

          {/* 02 */}
          <div className="vp-feat-row">
            <div className="vp-feat-num">02 / 04</div>
            <div>
              <h3>Charging that matches your car's curve.</h3>
              <p>Tap any plug — CCS, NACS, or J1772. VoltPark negotiates the fastest safe speed for your battery state and shows you the real cost per kWh, not a surprise.</p>
              <div className="vp-tags">
                <span className="vp-tag">Plug &amp; charge</span>
                {stats && <span className="vp-tag">{Math.round(stats.peak_power_kw)}kW peak</span>}
                <span className="vp-tag">Battery-aware</span>
              </div>
            </div>
            <div className="vp-feat-visual">
              <div className="vp-charge-vis">
                <div className="vp-charge-stat">
                  72%<small>SOC · 12 min left</small>
                </div>
                <svg viewBox="0 0 300 160" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--vp-accent)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--vp-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,140 C40,130 60,50 110,40 C150,32 180,45 210,70 C240,95 270,120 300,135 L300,160 L0,160 Z" fill="url(#cg)" />
                  <path d="M0,140 C40,130 60,50 110,40 C150,32 180,45 210,70 C240,95 270,120 300,135" fill="none" stroke="var(--vp-accent)" strokeWidth="2" />
                  <circle cx="135" cy="36" r="4" fill="var(--vp-accent)" stroke="white" strokeWidth="2" />
                </svg>
                <div className="vp-charge-lbl">
                  Charge curve{stats ? ` · ${Math.round(stats.peak_power_kw)}kW peak` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* 03 */}
          <div className="vp-feat-row">
            <div className="vp-feat-num">03 / 04</div>
            <div>
              <h3>One wallet. Every swipe.</h3>
              <p>Stop juggling receipts. Auto-top-up covers parking, charging, and toll-road transfers. Split receipts for business and personal with a single tap.</p>
              <div className="vp-tags">
                <span className="vp-tag">Auto top-up</span>
                <span className="vp-tag">Business split</span>
                <span className="vp-tag">Export CSV</span>
              </div>
            </div>
            <div className="vp-feat-visual">
              <div className="vp-wallet">
                <div className="vp-wallet-head">
                  <span>VoltPark wallet</span>
                  <span>APR 19</span>
                </div>
                <div className="vp-wallet-bal">$142.<small>08</small></div>
                <div className="vp-wallet-row">
                  <span>Curbside reservation</span>
                  <span>–$4.25</span>
                </div>
                <div className="vp-wallet-row">
                  <span>DC fast · 18 kWh</span>
                  <span>–$8.10</span>
                </div>
                <div className="vp-wallet-row">
                  <span className="vp-wallet-plus">Auto top-up</span>
                  <span className="vp-wallet-plus">+$50.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 04 */}
          <div className="vp-feat-row" id="operators">
            <div className="vp-feat-num">04 / 04</div>
            <div>
              <h3>Operator tools that don't need a manual.</h3>
              <p>
                For cities and fleet owners: dynamic pricing, maintenance alerts, and real-time heatmaps.
                {stats
                  ? ` Manage ${stats.active_zones} active zone${stats.active_zones !== 1 ? "s" : ""} across ${stats.cities} ${stats.cities !== 1 ? "cities" : "city"}.`
                  : " Deploy a charger on Monday, watch utilization by Friday."}
              </p>
              <div className="vp-tags">
                <span className="vp-tag">Admin console</span>
                <span className="vp-tag">API + webhooks</span>
                <span className="vp-tag">SLA reporting</span>
                {stats && <span className="vp-tag">{stats.active_zones} active zones</span>}
              </div>
            </div>
            <div className="vp-feat-visual">
              <div className="vp-op-grid">
                {opPattern.map((l, i) => (
                  <div key={i} className={`vp-op-cell${l ? ` l${l}` : ""}`} />
                ))}
              </div>
              <div className="vp-op-legend">
                <span>Utilization · live</span>
                <span>0% ▬▬▬ 100%</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── How it works ── */}
      <div className="vp-how" id="how">
        <div className="vp-wrap">
          <section style={{ padding: "72px 0", display: "block" }}>
            <div className="vp-sec-head">
              <div><div className="vp-sec-label">How it works</div></div>
              <div>
                <h2>Three taps from kerb to charge.</h2>
                <p>No app install required on the station side. Browser or native — VoltPark adapts to whatever car, charger, or block you're in.</p>
              </div>
            </div>
            <div className="vp-steps">
              <div className="vp-step">
                <div className="vp-step-n">01</div>
                <h4>Spot it</h4>
                <p>
                  See live availability{stats ? ` across ${stats.active_zones} zones in ${stats.cities} cities` : " within a quarter-mile of your destination"}.
                  Filter by charger type, ceiling height, or accessibility.
                </p>
              </div>
              <div className="vp-step">
                <div className="vp-step-n">02</div>
                <h4>Hold it</h4>
                <p>Reserve for 15 minutes free while you navigate. The spot stays blocked until you arrive — or auto-releases if you bail.</p>
              </div>
              <div className="vp-step">
                <div className="vp-step-n">03</div>
                <h4>Plug &amp; go</h4>
                <p>Tap your card or phone, the session starts. Billing settles in the background. Walk away whenever you want.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="vp-wrap">
        <div className="vp-cta">
          <h2>Pull up. <em>Plug in.</em><br />Drive on.</h2>
          <p>
            {stats && stats.total_sessions > 0
              ? `Join ${fmtNumber(stats.total_sessions)} sessions already completed on VoltPark.`
              : "Join drivers who stopped circling the block."}
          </p>
          <Link
            to={token ? "/dashboard" : "/register"}
            className="vp-btn vp-btn-primary vp-btn-xl"
          >
            {token ? "Open dashboard →" : "Create free account →"}
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="vp-footer">
        <div className="vp-wrap">
          <div className="vp-foot-grid">
            <div>
              <div className="vp-logo" style={{ marginBottom: 14 }}>
                <div className="vp-logo-mark">V</div>
                <span>VoltPark</span>
              </div>
              <p className="vp-foot-about">
                Reservation, charging, and settlement — stitched together for drivers, operators, and the cities in between.
              </p>
            </div>
            <div>
              <h5>Product</h5>
              <Link to="/zones">Find a spot</Link>
              <Link to="/chargers">EV charging</Link>
              <Link to="/wallet">Wallet</Link>
              <Link to="/reservations">Reservations</Link>
            </div>
            <div>
              <h5>Operators</h5>
              <Link to="/admin/analytics">Analytics</Link>
              <Link to="/admin/pricing">Pricing rules</Link>
              <Link to="/admin/maintenance">Maintenance</Link>
              <Link to="/admin/users">User management</Link>
            </div>
            <div>
              <h5>Account</h5>
              <Link to="/register">Get started</Link>
              <Link to="/login">Sign in</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/vehicles">Vehicles</Link>
            </div>
            <div>
              <h5>Platform</h5>
              <Link to="/sessions">Sessions</Link>
              <Link to="/zones">Parking zones</Link>
              <Link to="/chargers">Chargers</Link>
              <Link to="/wallet">Billing</Link>
            </div>
          </div>
          <div className="vp-foot-bottom">
            <span>© 2026 VoltPark, Inc.</span>
            <span>
              {stats ? `${stats.active_zones} zones · ${stats.cities} cities` : "Built for drivers"}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
