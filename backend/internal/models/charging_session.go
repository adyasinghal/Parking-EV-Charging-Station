package models

import "time"

type ChargingSession struct {
	SessionID     uint64     `db:"session_id" json:"session_id"`
	ChargerID     uint64     `db:"charger_id" json:"charger_id"`
	VehicleID     uint64     `db:"vehicle_id" json:"vehicle_id"`
	ReservationID *uint64    `db:"reservation_id" json:"reservation_id,omitempty"`
	PlugInTime    time.Time  `db:"plug_in_time" json:"plug_in_time"`
	PlugOutTime   *time.Time `db:"plug_out_time" json:"plug_out_time,omitempty"`
	KwhStart      float64    `db:"kwh_start" json:"kwh_start"`
	KwhEnd        *float64   `db:"kwh_end" json:"kwh_end,omitempty"`
	KwhConsumed   *float64   `db:"kwh_consumed" json:"kwh_consumed,omitempty"`
	Status        string     `db:"status" json:"status"`
	TotalCost     *float64   `db:"total_cost" json:"total_cost,omitempty"`
	Notes         *string    `db:"notes" json:"notes,omitempty"`
}

type StartSessionRequest struct {
	ChargerID     uint64  `json:"charger_id" binding:"required"`
	VehicleID     uint64  `json:"vehicle_id" binding:"required"`
	ReservationID *uint64 `json:"reservation_id"`
	KwhStart      float64 `json:"kwh_start"`
}

type EndSessionRequest struct {
	KwhEnd      float64 `json:"kwh_end" binding:"required,gt=0"`
	PlugOutTime string  `json:"plug_out_time" binding:"required"`
}
