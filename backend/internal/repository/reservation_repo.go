package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type ReservationRepo struct {
	db *sqlx.DB
}

func NewReservationRepo(db *sqlx.DB) *ReservationRepo {
	return &ReservationRepo{db: db}
}

func (r *ReservationRepo) Create(
	ctx context.Context,
	userID uint64,
	spotID uint64,
	vehicleID *uint64,
	startTime time.Time,
	endTime time.Time,
) (*models.Reservation, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Reservations (spot_id, user_id, vehicle_id, start_time, end_time, status)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		spotID, userID, vehicleID, startTime, endTime, models.ReservationStatusConfirmed,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, uint64(id))
}

// CallMakeReservation invokes sp_make_reservation and returns the created record.
func (r *ReservationRepo) CallMakeReservation(
	ctx context.Context,
	spotID, userID uint64,
	vehicleID *uint64,
	start, end string,
) (*models.Reservation, error) {
	var vehicleArg interface{}
	if vehicleID != nil {
		vehicleArg = *vehicleID
	}

	rows, err := r.db.QueryContext(ctx,
		`CALL sp_make_reservation(?, ?, ?, ?, ?)`,
		spotID, userID, vehicleArg, start, end,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result string
	var reservationID uint64
	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	if err := rows.Scan(&result, &reservationID); err != nil {
		return nil, err
	}
	return r.GetByID(ctx, reservationID)
}

func (r *ReservationRepo) GetByID(ctx context.Context, reservationID uint64) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.GetContext(ctx, &reservation,
		`SELECT * FROM Reservations WHERE reservation_id = ? LIMIT 1`, reservationID,
	)
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

func (r *ReservationRepo) GetByIDAndUser(ctx context.Context, reservationID, userID uint64) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.GetContext(ctx, &reservation,
		`SELECT * FROM Reservations WHERE reservation_id = ? AND user_id = ? LIMIT 1`, reservationID, userID,
	)
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

func (r *ReservationRepo) ListByUser(ctx context.Context, userID uint64) ([]models.Reservation, error) {
	var list []models.Reservation
	err := r.db.SelectContext(ctx, &list,
		`SELECT * FROM Reservations WHERE user_id = ? ORDER BY created_at DESC`, userID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.Reservation{}, nil
	}
	return list, nil
}

func (r *ReservationRepo) ListAll(ctx context.Context) ([]models.Reservation, error) {
	var list []models.Reservation
	err := r.db.SelectContext(ctx, &list, `SELECT * FROM Reservations ORDER BY created_at DESC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.Reservation{}, nil
	}
	return list, nil
}

func (r *ReservationRepo) CancelByID(ctx context.Context, reservationID uint64) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE Reservations SET status = ? WHERE reservation_id = ? AND status = ?`,
		models.ReservationStatusCancelled, reservationID, models.ReservationStatusConfirmed,
	)
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

func (r *ReservationRepo) CancelByIDAndUser(ctx context.Context, reservationID, userID uint64) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE Reservations
		 SET status = ?
		 WHERE reservation_id = ? AND user_id = ? AND status = ?`,
		models.ReservationStatusCancelled, reservationID, userID, models.ReservationStatusConfirmed,
	)
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

// CancelByProcedure invokes sp_cancel_reservation.
func (r *ReservationRepo) CancelByProcedure(ctx context.Context, reservationID, userID uint64) error {
	_, err := r.db.ExecContext(ctx, `CALL sp_cancel_reservation(?, ?)`, reservationID, userID)
	return err
}
