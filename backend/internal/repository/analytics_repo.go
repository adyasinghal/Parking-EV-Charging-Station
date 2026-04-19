package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type AnalyticsRepo struct {
	db *sqlx.DB
}

func NewAnalyticsRepo(db *sqlx.DB) *AnalyticsRepo {
	return &AnalyticsRepo{db: db}
}

func (r *AnalyticsRepo) HighTraffic(ctx context.Context) ([]models.HighTrafficZone, error) {
	var list []models.HighTrafficZone
	err := r.db.SelectContext(ctx, &list, `SELECT * FROM vw_high_traffic_zones ORDER BY total_sessions DESC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.HighTrafficZone{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) ChargerEfficiency(ctx context.Context) ([]models.ChargerEfficiency, error) {
	var list []models.ChargerEfficiency
	err := r.db.SelectContext(ctx, &list, `SELECT * FROM vw_charger_efficiency ORDER BY error_rate_pct DESC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ChargerEfficiency{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) TopSpenders(ctx context.Context) ([]models.TopSpender, error) {
	var list []models.TopSpender
	err := r.db.SelectContext(ctx, &list,
		`SELECT u.user_id, u.full_name, u.email,
		 COALESCE(SUM(CASE WHEN br.amount > 0 THEN br.amount ELSE 0 END), 0) AS total_spend
		 FROM Users u
		 LEFT JOIN Billing_Records br ON br.user_id = u.user_id
		 GROUP BY u.user_id, u.full_name, u.email
		 ORDER BY total_spend DESC
		 LIMIT 10`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.TopSpender{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) NoShowRate(ctx context.Context) ([]models.ZoneNoShowRate, error) {
	var list []models.ZoneNoShowRate
	err := r.db.SelectContext(ctx, &list,
		`SELECT pz.zone_id, pz.zone_name,
		 SUM(CASE WHEN rs.status = 'No_Show' THEN 1 ELSE 0 END) AS no_show_count,
		 COUNT(rs.reservation_id) AS total_count,
		 ROUND((SUM(CASE WHEN rs.status = 'No_Show' THEN 1 ELSE 0 END) / NULLIF(COUNT(rs.reservation_id), 0)) * 100, 2) AS no_show_rate_pct
		 FROM Parking_Zones pz
		 LEFT JOIN Parking_Spots ps ON ps.zone_id = pz.zone_id
		 LEFT JOIN Reservations rs ON rs.spot_id = ps.spot_id
		 GROUP BY pz.zone_id, pz.zone_name
		 ORDER BY no_show_rate_pct DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ZoneNoShowRate{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) Heatmap(ctx context.Context, from, to time.Time) ([]models.HeatmapPoint, error) {
	rows, err := r.db.QueryContext(ctx, `CALL sp_hourly_demand_heatmap(?, ?)`, from.Format(time.DateTime), to.Format(time.DateTime))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.HeatmapPoint, 0)
	for rows.Next() {
		var item models.HeatmapPoint
		if err := rows.Scan(&item.HourOfDay, &item.TimeWindow, &item.SessionsStarted); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r *AnalyticsRepo) ChargerUtilization(ctx context.Context, from, to time.Time) ([]models.ChargerUtilization, error) {
	rows, err := r.db.QueryContext(ctx, `CALL sp_charger_utilization(?, ?)`, from.Format(time.DateTime), to.Format(time.DateTime))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.ChargerUtilization, 0)
	for rows.Next() {
		var item models.ChargerUtilization
		if err := rows.Scan(&item.ChargerID, &item.ChargerCode, &item.TotalSessions, &item.UsageHours, &item.UtilizationPct); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r *AnalyticsRepo) ParkingOnlyUsers(ctx context.Context) ([]models.ParkingOnlyUser, error) {
	var list []models.ParkingOnlyUser
	err := r.db.SelectContext(ctx, &list,
		`SELECT u.user_id, u.full_name, u.email
		 FROM Users u
		 WHERE EXISTS (
		   SELECT 1 FROM Reservations r WHERE r.user_id = u.user_id
		 )
		 AND NOT EXISTS (
		   SELECT 1
		   FROM Charging_Sessions cs
		   JOIN Vehicles v ON v.vehicle_id = cs.vehicle_id
		   WHERE v.user_id = u.user_id
		 )
		 ORDER BY u.user_id DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ParkingOnlyUser{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) OvertimeSessions(ctx context.Context) ([]models.OvertimeSession, error) {
	var list []models.OvertimeSession
	err := r.db.SelectContext(ctx, &list,
		`SELECT cs.session_id, u.user_id, u.full_name, ec.charger_code,
		 ROUND(TIMESTAMPDIFF(MINUTE, cs.plug_in_time, COALESCE(cs.plug_out_time, NOW())) / 60, 2) AS duration_hours
		 FROM Charging_Sessions cs
		 JOIN Vehicles v ON v.vehicle_id = cs.vehicle_id
		 JOIN Users u ON u.user_id = v.user_id
		 JOIN EV_Chargers ec ON ec.charger_id = cs.charger_id
		 WHERE TIMESTAMPDIFF(MINUTE, cs.plug_in_time, COALESCE(cs.plug_out_time, NOW())) > 240
		 ORDER BY duration_hours DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.OvertimeSession{}, nil
	}
	return list, nil
}

func (r *AnalyticsRepo) SessionFrequency(ctx context.Context) ([]models.SessionFrequency, error) {
	var list []models.SessionFrequency
	err := r.db.SelectContext(ctx, &list,
		`SELECT u.user_id, u.full_name, COUNT(cs.session_id) AS session_count
		 FROM Users u
		 JOIN Vehicles v ON v.user_id = u.user_id
		 JOIN Charging_Sessions cs ON cs.vehicle_id = v.vehicle_id
		 GROUP BY u.user_id, u.full_name
		 ORDER BY session_count DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.SessionFrequency{}, nil
	}
	return list, nil
}
