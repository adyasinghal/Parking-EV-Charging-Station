package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type ZoneRepo struct {
	db *sqlx.DB
}

func NewZoneRepo(db *sqlx.DB) *ZoneRepo {
	return &ZoneRepo{db: db}
}

func (r *ZoneRepo) ListActive(ctx context.Context) ([]models.ParkingZone, error) {
	var zones []models.ParkingZone
	err := r.db.SelectContext(ctx, &zones, `SELECT * FROM Parking_Zones WHERE is_active = 1 ORDER BY zone_id ASC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if zones == nil {
		return []models.ParkingZone{}, nil
	}
	return zones, nil
}

func (r *ZoneRepo) GetByID(ctx context.Context, zoneID uint64) (*models.ParkingZone, error) {
	var zone models.ParkingZone
	err := r.db.GetContext(ctx, &zone, `SELECT * FROM Parking_Zones WHERE zone_id = ? LIMIT 1`, zoneID)
	if err != nil {
		return nil, err
	}
	return &zone, nil
}

func (r *ZoneRepo) Create(ctx context.Context, req models.CreateZoneRequest) (*models.ParkingZone, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Parking_Zones (zone_name, city, address, total_spots, is_active) VALUES (?, ?, ?, ?, ?)`,
		req.ZoneName, req.City, req.Address, req.TotalSpots, isActive,
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

func (r *ZoneRepo) Update(ctx context.Context, zoneID uint64, req models.UpdateZoneRequest) (*models.ParkingZone, error) {
	current, err := r.GetByID(ctx, zoneID)
	if err != nil {
		return nil, err
	}

	zoneName := current.ZoneName
	city := current.City
	address := current.Address
	totalSpots := current.TotalSpots
	isActive := current.IsActive

	if req.ZoneName != nil {
		zoneName = *req.ZoneName
	}
	if req.City != nil {
		city = *req.City
	}
	if req.Address != nil {
		address = req.Address
	}
	if req.TotalSpots != nil {
		totalSpots = *req.TotalSpots
	}
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE Parking_Zones SET zone_name = ?, city = ?, address = ?, total_spots = ?, is_active = ? WHERE zone_id = ?`,
		zoneName, city, address, totalSpots, isActive, zoneID,
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, zoneID)
}
