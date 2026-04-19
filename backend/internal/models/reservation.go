package models

import "time"

type Reservation struct {
	ReservationID uint64    `db:"reservation_id" json:"reservation_id"`
	SpotID        uint64    `db:"spot_id" json:"spot_id"`
	UserID        uint64    `db:"user_id" json:"user_id"`
	VehicleID     *uint64   `db:"vehicle_id" json:"vehicle_id,omitempty"`
	StartTime     time.Time `db:"start_time" json:"start_time"`
	EndTime       time.Time `db:"end_time" json:"end_time"`
	Status        string    `db:"status" json:"status"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}

type CreateReservationRequest struct {
	SpotID    uint64  `json:"spot_id" binding:"required"`
	VehicleID *uint64 `json:"vehicle_id"`
	StartTime string  `json:"start_time" binding:"required"`
	EndTime   string  `json:"end_time" binding:"required"`
}
