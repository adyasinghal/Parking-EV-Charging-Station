package models

type SpotStatusEvent struct {
	SpotID uint64 `db:"spot_id" json:"spot_id"`
	Status string `db:"status" json:"status"`
}

type ChargerStatusEvent struct {
	ChargerID   uint64 `db:"charger_id" json:"charger_id"`
	ChargerCode string `db:"charger_code" json:"charger_code"`
	Status      string `db:"status" json:"status"`
}
