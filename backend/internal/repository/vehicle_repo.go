package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type VehicleRepo struct {
	db *sqlx.DB
}

func NewVehicleRepo(db *sqlx.DB) *VehicleRepo {
	return &VehicleRepo{db: db}
}

func (r *VehicleRepo) ListByUserID(ctx context.Context, userID uint64) ([]models.Vehicle, error) {
	var list []models.Vehicle
	err := r.db.SelectContext(ctx, &list,
		`SELECT * FROM Vehicles WHERE user_id = ? ORDER BY registered_at DESC`, userID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.Vehicle{}, nil
	}
	return list, nil
}

func (r *VehicleRepo) Create(ctx context.Context, userID uint64, req models.CreateVehicleRequest) (*models.Vehicle, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Vehicles (user_id, license_plate, make, model, year, is_ev, battery_kw)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		userID, req.LicensePlate, req.Make, req.Model, req.Year, req.IsEV, req.BatteryKW,
	)
	if err != nil {
		return nil, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByUserAndID(ctx, userID, uint64(id))
}

func (r *VehicleRepo) GetByUserAndID(ctx context.Context, userID, vehicleID uint64) (*models.Vehicle, error) {
	var v models.Vehicle
	err := r.db.GetContext(ctx, &v,
		`SELECT * FROM Vehicles WHERE user_id = ? AND vehicle_id = ? LIMIT 1`, userID, vehicleID,
	)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VehicleRepo) Update(ctx context.Context, userID, vehicleID uint64, req models.UpdateVehicleRequest) (*models.Vehicle, error) {
	current, err := r.GetByUserAndID(ctx, userID, vehicleID)
	if err != nil {
		return nil, err
	}

	licensePlate := current.LicensePlate
	make := current.Make
	model := current.Model
	year := current.Year
	isEV := current.IsEV
	batteryKW := current.BatteryKW

	if req.LicensePlate != nil {
		licensePlate = *req.LicensePlate
	}
	if req.Make != nil {
		make = req.Make
	}
	if req.Model != nil {
		model = req.Model
	}
	if req.Year != nil {
		year = req.Year
	}
	if req.IsEV != nil {
		isEV = *req.IsEV
	}
	if req.BatteryKW != nil {
		batteryKW = req.BatteryKW
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE Vehicles
		 SET license_plate = ?, make = ?, model = ?, year = ?, is_ev = ?, battery_kw = ?
		 WHERE user_id = ? AND vehicle_id = ?`,
		licensePlate, make, model, year, isEV, batteryKW, userID, vehicleID,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByUserAndID(ctx, userID, vehicleID)
}

func (r *VehicleRepo) Delete(ctx context.Context, userID, vehicleID uint64) error {
	res, err := r.db.ExecContext(ctx,
		`DELETE FROM Vehicles WHERE user_id = ? AND vehicle_id = ?`, userID, vehicleID,
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
