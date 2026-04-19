package models

import "time"

type BillingRecord struct {
	BillingID     uint64    `db:"billing_id" json:"billing_id"`
	UserID        uint64    `db:"user_id" json:"user_id"`
	SessionID     *uint64   `db:"session_id" json:"session_id,omitempty"`
	ReservationID *uint64   `db:"reservation_id" json:"reservation_id,omitempty"`
	BillingType   string    `db:"billing_type" json:"billing_type"`
	Amount        float64   `db:"amount" json:"amount"`
	Description   *string   `db:"description" json:"description,omitempty"`
	BilledAt      time.Time `db:"billed_at" json:"billed_at"`
}
