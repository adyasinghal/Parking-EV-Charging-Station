package models

import "time"

type MaintenanceAlert struct {
	AlertID     uint64     `db:"alert_id" json:"alert_id"`
	ChargerID   uint64     `db:"charger_id" json:"charger_id"`
	Reason      string     `db:"reason" json:"reason"`
	RaisedAt    time.Time  `db:"raised_at" json:"raised_at"`
	ResolvedAt  *time.Time `db:"resolved_at" json:"resolved_at,omitempty"`
	IsResolved  bool       `db:"is_resolved" json:"is_resolved"`
	ChargerCode *string    `db:"charger_code" json:"charger_code,omitempty"`
}

type MaintenanceRiskAlert struct {
	ChargerID     uint64 `db:"charger_id" json:"charger_id"`
	ChargerCode   string `db:"charger_code" json:"charger_code"`
	ErrorsLast24h int    `db:"errors_last_24h" json:"errors_last_24h"`
}
