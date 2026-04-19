package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type SSERepo struct {
	db *sqlx.DB
}

func NewSSERepo(db *sqlx.DB) *SSERepo {
	return &SSERepo{db: db}
}

func (r *SSERepo) SpotStatusesByZone(ctx context.Context, zoneID uint64) ([]models.SpotStatusEvent, error) {
	var list []models.SpotStatusEvent
	err := r.db.SelectContext(ctx, &list,
		`SELECT spot_id, status FROM Parking_Spots WHERE zone_id = ? ORDER BY spot_id ASC`, zoneID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.SpotStatusEvent{}, nil
	}
	return list, nil
}

func (r *SSERepo) ChargerStatuses(ctx context.Context) ([]models.ChargerStatusEvent, error) {
	var list []models.ChargerStatusEvent
	err := r.db.SelectContext(ctx, &list,
		`SELECT charger_id, charger_code, status FROM EV_Chargers ORDER BY charger_id ASC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ChargerStatusEvent{}, nil
	}
	return list, nil
}
