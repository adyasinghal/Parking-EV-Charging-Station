package models

import "time"

type Wallet struct {
	WalletID    uint64    `db:"wallet_id" json:"wallet_id"`
	UserID      uint64    `db:"user_id" json:"user_id"`
	Balance     float64   `db:"balance" json:"balance"`
	Currency    string    `db:"currency" json:"currency"`
	LastUpdated time.Time `db:"last_updated" json:"last_updated"`
}

type TopUpRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

type TopupApprovalRequest struct {
	RequestID   uint64     `db:"request_id"   json:"request_id"`
	UserID      uint64     `db:"user_id"       json:"user_id"`
	Amount      float64    `db:"amount"        json:"amount"`
	Status      string     `db:"status"        json:"status"`
	Note        *string    `db:"note"          json:"note,omitempty"`
	RequestedAt time.Time  `db:"requested_at"  json:"requested_at"`
	ProcessedAt *time.Time `db:"processed_at"  json:"processed_at,omitempty"`
	ProcessedBy *uint64    `db:"processed_by"  json:"processed_by,omitempty"`
	FullName    *string    `db:"full_name"     json:"full_name,omitempty"`
	Email       *string    `db:"email"         json:"email,omitempty"`
}

type CreateTopupRequestPayload struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Note   *string `json:"note"`
}
