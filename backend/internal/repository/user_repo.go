package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type UserRepo struct {
	db *sqlx.DB
}

func NewUserRepo(db *sqlx.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, req models.CreateUserRequest, passwordHash string) (*models.User, error) {
	role := req.Role
	if role == "" {
		role = models.RoleDriver
	}

	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
		req.FullName, req.Email, req.Phone, passwordHash, role,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.FindByID(ctx, uint64(id))
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.GetContext(ctx, &user, `SELECT * FROM Users WHERE email = ? LIMIT 1`, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) FindByID(ctx context.Context, userID uint64) (*models.User, error) {
	var user models.User
	err := r.db.GetContext(ctx, &user, `SELECT * FROM Users WHERE user_id = ? LIMIT 1`, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) ListAll(ctx context.Context) ([]models.User, error) {
	var users []models.User
	err := r.db.SelectContext(ctx, &users, `SELECT * FROM Users ORDER BY created_at DESC`)
	return users, err
}

func (r *UserRepo) UpdateMe(ctx context.Context, userID uint64, req models.UpdateMeRequest) (*models.User, error) {
	current, err := r.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	fullName := current.FullName
	phone := current.Phone
	if req.FullName != nil {
		fullName = *req.FullName
	}
	if req.Phone != nil {
		phone = req.Phone
	}

	_, err = r.db.ExecContext(ctx, `UPDATE Users SET full_name = ?, phone = ? WHERE user_id = ?`, fullName, phone, userID)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, userID)
}

func (r *UserRepo) DeleteByID(ctx context.Context, userID uint64) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM Users WHERE user_id = ?`, userID)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
