package models

type HighTrafficZone struct {
	ZoneID            uint64  `db:"zone_id" json:"zone_id"`
	ZoneName          string  `db:"zone_name" json:"zone_name"`
	City              string  `db:"city" json:"city"`
	TotalSessions     int     `db:"total_sessions" json:"total_sessions"`
	AvgSessionHrs     float64 `db:"avg_session_hrs" json:"avg_session_hrs"`
	TotalKwhDelivered float64 `db:"total_kwh_delivered" json:"total_kwh_delivered"`
	TotalRevenue      float64 `db:"total_revenue" json:"total_revenue"`
}

type ChargerEfficiency struct {
	ChargerID        uint64  `db:"charger_id" json:"charger_id"`
	ChargerCode      string  `db:"charger_code" json:"charger_code"`
	ChargerType      string  `db:"charger_type" json:"charger_type"`
	PowerKW          float64 `db:"power_kw" json:"power_kw"`
	Status           string  `db:"status" json:"status"`
	TotalSessions    int     `db:"total_sessions" json:"total_sessions"`
	AvgKwhPerSession float64 `db:"avg_kwh_per_session" json:"avg_kwh_per_session"`
	TotalErrors      int     `db:"total_errors" json:"total_errors"`
	MaintenanceCount int     `db:"maintenance_count" json:"maintenance_count"`
	ErrorRatePct     float64 `db:"error_rate_pct" json:"error_rate_pct"`
}

type TopSpender struct {
	UserID     uint64  `db:"user_id" json:"user_id"`
	FullName   string  `db:"full_name" json:"full_name"`
	Email      string  `db:"email" json:"email"`
	TotalSpend float64 `db:"total_spend" json:"total_spend"`
}

type ZoneNoShowRate struct {
	ZoneID        uint64  `db:"zone_id" json:"zone_id"`
	ZoneName      string  `db:"zone_name" json:"zone_name"`
	NoShowCount   int     `db:"no_show_count" json:"no_show_count"`
	TotalCount    int     `db:"total_count" json:"total_count"`
	NoShowRatePct float64 `db:"no_show_rate_pct" json:"no_show_rate_pct"`
}

type HeatmapPoint struct {
	HourOfDay       string `db:"hour_of_day" json:"hour_of_day"`
	TimeWindow      string `db:"time_window" json:"time_window"`
	SessionsStarted int    `db:"sessions_started" json:"sessions_started"`
}

type ChargerUtilization struct {
	ChargerID      uint64  `db:"charger_id" json:"charger_id"`
	ChargerCode    string  `db:"charger_code" json:"charger_code"`
	TotalSessions  int     `db:"total_sessions" json:"total_sessions"`
	UsageHours     float64 `db:"usage_hours" json:"usage_hours"`
	UtilizationPct float64 `db:"utilization_pct" json:"utilization_pct"`
}

type ParkingOnlyUser struct {
	UserID   uint64 `db:"user_id" json:"user_id"`
	FullName string `db:"full_name" json:"full_name"`
	Email    string `db:"email" json:"email"`
}

type OvertimeSession struct {
	SessionID     uint64  `db:"session_id" json:"session_id"`
	UserID        uint64  `db:"user_id" json:"user_id"`
	FullName      string  `db:"full_name" json:"full_name"`
	ChargerCode   string  `db:"charger_code" json:"charger_code"`
	DurationHours float64 `db:"duration_hours" json:"duration_hours"`
}

type SessionFrequency struct {
	UserID       uint64 `db:"user_id" json:"user_id"`
	FullName     string `db:"full_name" json:"full_name"`
	SessionCount int    `db:"session_count" json:"session_count"`
}
