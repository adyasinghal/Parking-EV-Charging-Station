package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type WalletRepo struct {
	db *sqlx.DB
}

func NewWalletRepo(db *sqlx.DB) *WalletRepo {
	return &WalletRepo{db: db}
}

func (r *WalletRepo) Ensure(ctx context.Context, userID uint64) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT IGNORE INTO Wallets (user_id, balance, currency) VALUES (?, 0.00, 'INR')`,
		userID,
	)
	return err
}

func (r *WalletRepo) GetByUserID(ctx context.Context, userID uint64) (*models.Wallet, error) {
	if err := r.Ensure(ctx, userID); err != nil {
		return nil, err
	}
	var wallet models.Wallet
	err := r.db.GetContext(ctx, &wallet, `SELECT * FROM Wallets WHERE user_id = ? LIMIT 1`, userID)
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func (r *WalletRepo) TopUp(ctx context.Context, userID uint64, amount float64) (*models.Wallet, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx,
		`INSERT IGNORE INTO Wallets (user_id, balance, currency) VALUES (?, 0.00, 'INR')`,
		userID,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE Wallets SET balance = balance + ? WHERE user_id = ?`,
		amount, userID,
	)
	if err != nil {
		return nil, err
	}

	desc := "Wallet top-up"
	_, err = tx.ExecContext(ctx,
		`INSERT INTO Billing_Records (user_id, billing_type, amount, description) VALUES (?, ?, ?, ?)`,
		userID, models.BillingTypeTopUp, amount, desc,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.GetByUserID(ctx, userID)
}

func (r *WalletRepo) CreateTopupRequest(ctx context.Context, userID uint64, payload models.CreateTopupRequestPayload) (*models.TopupApprovalRequest, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Wallet_Topup_Requests (user_id, amount, note) VALUES (?, ?, ?)`,
		userID, payload.Amount, payload.Note,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetTopupRequestByID(ctx, uint64(id))
}

func (r *WalletRepo) GetTopupRequestByID(ctx context.Context, id uint64) (*models.TopupApprovalRequest, error) {
	var req models.TopupApprovalRequest
	err := r.db.GetContext(ctx, &req,
		`SELECT tr.*, u.full_name, u.email
		 FROM Wallet_Topup_Requests tr
		 JOIN Users u ON u.user_id = tr.user_id
		 WHERE tr.request_id = ? LIMIT 1`,
		id,
	)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *WalletRepo) ListTopupRequestsByUser(ctx context.Context, userID uint64) ([]models.TopupApprovalRequest, error) {
	var list []models.TopupApprovalRequest
	err := r.db.SelectContext(ctx, &list,
		`SELECT tr.*, u.full_name, u.email
		 FROM Wallet_Topup_Requests tr
		 JOIN Users u ON u.user_id = tr.user_id
		 WHERE tr.user_id = ?
		 ORDER BY tr.requested_at DESC`,
		userID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.TopupApprovalRequest{}, nil
	}
	return list, nil
}

func (r *WalletRepo) ListPendingTopupRequests(ctx context.Context) ([]models.TopupApprovalRequest, error) {
	var list []models.TopupApprovalRequest
	err := r.db.SelectContext(ctx, &list,
		`SELECT tr.*, u.full_name, u.email
		 FROM Wallet_Topup_Requests tr
		 JOIN Users u ON u.user_id = tr.user_id
		 ORDER BY tr.requested_at DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.TopupApprovalRequest{}, nil
	}
	return list, nil
}

func (r *WalletRepo) ApproveTopupRequest(ctx context.Context, requestID uint64, adminID uint64) error {
	req, err := r.GetTopupRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "Pending" {
		return errors.New("request is not pending")
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx,
		`UPDATE Wallet_Topup_Requests SET status = 'Approved', processed_at = NOW(), processed_by = ? WHERE request_id = ?`,
		adminID, requestID,
	); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx,
		`INSERT IGNORE INTO Wallets (user_id, balance, currency) VALUES (?, 0.00, 'INR')`,
		req.UserID,
	); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx,
		`UPDATE Wallets SET balance = balance + ? WHERE user_id = ?`,
		req.Amount, req.UserID,
	); err != nil {
		return err
	}

	desc := "Wallet top-up (admin approved)"
	if _, err = tx.ExecContext(ctx,
		`INSERT INTO Billing_Records (user_id, billing_type, amount, description) VALUES (?, ?, ?, ?)`,
		req.UserID, models.BillingTypeTopUp, req.Amount, desc,
	); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *WalletRepo) RejectTopupRequest(ctx context.Context, requestID uint64, adminID uint64) error {
	req, err := r.GetTopupRequestByID(ctx, requestID)
	if err != nil {
		return err
	}
	if req.Status != "Pending" {
		return errors.New("request is not pending")
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE Wallet_Topup_Requests SET status = 'Rejected', processed_at = NOW(), processed_by = ? WHERE request_id = ?`,
		adminID, requestID,
	)
	return err
}

func (r *WalletRepo) TransactionsByUserID(ctx context.Context, userID uint64) ([]models.BillingRecord, error) {
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
