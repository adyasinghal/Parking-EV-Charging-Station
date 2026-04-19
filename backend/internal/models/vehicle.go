package models

import "time"

type Vehicle struct {
	VehicleID    uint64    `db:"vehicle_id" json:"vehicle_id"`
	UserID       uint64    `db:"user_id" json:"user_id"`
	LicensePlate string    `db:"license_plate" json:"license_plate"`
	Make         *string   `db:"make" json:"make,omitempty"`
	Model        *string   `db:"model" json:"model,omitempty"`
	Year         *int      `db:"year" json:"year,omitempty"`
	IsEV         bool      `db:"is_ev" json:"is_ev"`
	BatteryKW    *float64  `db:"battery_kw" json:"battery_kw,omitempty"`
	RegisteredAt time.Time `db:"registered_at" json:"registered_at"`
}

type CreateVehicleRequest struct {
	LicensePlate string   `json:"license_plate" binding:"required"`
	Make         *string  `json:"make"`
	Model        *string  `json:"model"`
	Year         *int     `json:"year" binding:"omitempty,min=1990,max=2100"`
	IsEV         bool     `json:"is_ev"`
	BatteryKW    *float64 `json:"battery_kw" binding:"omitempty,gt=0"`
}

type UpdateVehicleRequest struct {
	LicensePlate *string  `json:"license_plate"`
	Make         *string  `json:"make"`
	Model        *string  `json:"model"`
	Year         *int     `json:"year" binding:"omitempty,min=1990,max=2100"`
	IsEV         *bool    `json:"is_ev"`
	BatteryKW    *float64 `json:"battery_kw" binding:"omitempty,gt=0"`
}
