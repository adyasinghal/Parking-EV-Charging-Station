package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type SpotRepo struct {
	db *sqlx.DB
}

func NewSpotRepo(db *sqlx.DB) *SpotRepo {
	return &SpotRepo{db: db}
}

func (r *SpotRepo) GetByZone(ctx context.Context, zoneID uint64) ([]models.SpotWithCharger, error) {
	type spotWithChargerRow struct {
		SpotID             uint64     `db:"spot_id"`
		ZoneID             uint64     `db:"zone_id"`
		SpotCode           string     `db:"spot_code"`
		FloorLevel         *int       `db:"floor_level"`
		Type               string     `db:"type"`
		Status             string     `db:"status"`
		ChargerID          *uint64    `db:"charger_id"`
		ChargerCode        *string    `db:"charger_code"`
		ChargerType        *string    `db:"charger_type"`
		PowerKW            *float64   `db:"power_kw"`
		ConnectorType      *string    `db:"connector_type"`
		ChargerStatus      *string    `db:"charger_status"`
		ChargerInstalledAt *time.Time `db:"charger_installed_at"`
	}

	var rows []spotWithChargerRow
	err := r.db.SelectContext(ctx, &rows,
		`SELECT
			ps.spot_id,
			ps.zone_id,
			ps.spot_code,
			ps.floor_level,
			ps.type,
			ps.status,
			ec.charger_id,
			ec.charger_code,
			ec.charger_type,
			ec.power_kw,
			ec.connector_type,
			ec.status AS charger_status,
			ec.installed_at AS charger_installed_at
		 FROM Parking_Spots ps
		 LEFT JOIN EV_Chargers ec ON ec.spot_id = ps.spot_id
		 WHERE ps.zone_id = ?
		 ORDER BY ps.spot_id ASC`, zoneID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if rows == nil {
		return []models.SpotWithCharger{}, nil
	}

	spots := make([]models.SpotWithCharger, 0, len(rows))
	for _, row := range rows {
		item := models.SpotWithCharger{
			SpotID:     row.SpotID,
			ZoneID:     row.ZoneID,
			SpotCode:   row.SpotCode,
			FloorLevel: row.FloorLevel,
			Type:       row.Type,
			Status:     row.Status,
		}
		if row.ChargerID != nil && row.ChargerCode != nil && row.ChargerType != nil && row.PowerKW != nil && row.ChargerStatus != nil {
			item.Charger = &models.EVChargerSummary{
				ChargerID:     *row.ChargerID,
				ChargerCode:   *row.ChargerCode,
				ChargerType:   *row.ChargerType,
				PowerKW:       *row.PowerKW,
				ConnectorType: row.ConnectorType,
				Status:        *row.ChargerStatus,
				InstalledAt:   row.ChargerInstalledAt,
			}
		}
		spots = append(spots, item)
	}

	return spots, nil
}

func (r *SpotRepo) GetByID(ctx context.Context, spotID uint64) (*models.ParkingSpot, error) {
	var spot models.ParkingSpot
	err := r.db.GetContext(ctx, &spot, `SELECT * FROM Parking_Spots WHERE spot_id = ? LIMIT 1`, spotID)
	if err != nil {
		return nil, err
	}
	return &spot, nil
}

func (r *SpotRepo) Create(ctx context.Context, req models.CreateSpotRequest) (*models.ParkingSpot, error) {
	spotType := req.Type
	if spotType == "" {
		spotType = models.SpotTypeStandard
	}
	status := req.Status
	if status == "" {
		status = models.SpotStatusAvailable
	}

	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Parking_Spots (zone_id, spot_code, floor_level, type, status) VALUES (?, ?, ?, ?, ?)`,
		req.ZoneID, req.SpotCode, req.FloorLevel, spotType, status,
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

func (r *SpotRepo) UpdateStatus(ctx context.Context, spotID uint64, status string) (*models.ParkingSpot, error) {
	_, err := r.db.ExecContext(ctx, `UPDATE Parking_Spots SET status = ? WHERE spot_id = ?`, status, spotID)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, spotID)
}

func (r *SpotRepo) IsAvailable(ctx context.Context, spotID uint64, startTime, endTime time.Time) (bool, error) {
	var conflicts int
	err := r.db.GetContext(ctx, &conflicts,
		`SELECT COUNT(1)
		 FROM Reservations
		 WHERE spot_id = ?
		   AND status = ?
		   AND NOT (? >= end_time OR ? <= start_time)`,
		spotID, models.ReservationStatusConfirmed, startTime, endTime,
	)
	if err != nil {
		return false, err
	}
	return conflicts == 0, nil
}

func (r *SpotRepo) GetConflicts(ctx context.Context, spotID uint64, startTime, endTime time.Time) ([]models.SpotConflictWindow, error) {
	var windows []models.SpotConflictWindow
	err := r.db.SelectContext(ctx, &windows,
		`SELECT start_time, end_time
		 FROM Reservations
		 WHERE spot_id = ?
		   AND status = ?
		   AND NOT (? >= end_time OR ? <= start_time)
		 ORDER BY start_time ASC`,
		spotID, models.ReservationStatusConfirmed, startTime, endTime,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if windows == nil {
		return []models.SpotConflictWindow{}, nil
	}
	return windows, nil
}
