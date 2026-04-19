package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type BillingRepo struct {
	db *sqlx.DB
}

func NewBillingRepo(db *sqlx.DB) *BillingRepo {
	return &BillingRepo{db: db}
}

func (r *BillingRepo) ListByUser(ctx context.Context, userID uint64) ([]models.BillingRecord, error) {
	var list []models.BillingRecord
	err := r.db.SelectContext(ctx, &list,
		`SELECT * FROM Billing_Records WHERE user_id = ? ORDER BY billed_at DESC`, userID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.BillingRecord{}, nil
	}
	return list, nil
}

func (r *BillingRepo) ListAll(ctx context.Context) ([]models.BillingRecord, error) {
	var list []models.BillingRecord
	err := r.db.SelectContext(ctx, &list, `SELECT * FROM Billing_Records ORDER BY billed_at DESC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.BillingRecord{}, nil
	}
	return list, nil
}
