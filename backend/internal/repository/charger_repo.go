package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type ChargerRepo struct {
	db *sqlx.DB
}

func NewChargerRepo(db *sqlx.DB) *ChargerRepo {
	return &ChargerRepo{db: db}
}

func (r *ChargerRepo) List(ctx context.Context) ([]models.EVCharger, error) {
	var list []models.EVCharger
	err := r.db.SelectContext(ctx, &list,
		`SELECT
			ec.charger_id,
			ec.spot_id,
			ps.zone_id,
			ps.spot_code,
			ps.type AS spot_type,
			ec.charger_code,
			ec.charger_type,
			ec.power_kw,
			ec.connector_type,
			ec.status,
			ec.installed_at
		 FROM EV_Chargers ec
		 JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
		 ORDER BY ec.charger_id ASC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.EVCharger{}, nil
	}
	return list, nil
}

func (r *ChargerRepo) GetByID(ctx context.Context, id uint64) (*models.EVCharger, error) {
	var c models.EVCharger
	err := r.db.GetContext(ctx, &c,
		`SELECT
			ec.charger_id,
			ec.spot_id,
			ps.zone_id,
			ps.spot_code,
			ps.type AS spot_type,
			ec.charger_code,
			ec.charger_type,
			ec.power_kw,
			ec.connector_type,
			ec.status,
			ec.installed_at
		 FROM EV_Chargers ec
		 JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
		 WHERE ec.charger_id = ?
		 LIMIT 1`, id,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ChargerRepo) Create(ctx context.Context, req models.CreateChargerRequest) (*models.EVCharger, error) {
	status := models.ChargerStatusAvailable
	if req.Status != nil {
		status = *req.Status
	}

	res, err := r.db.ExecContext(ctx,
		`INSERT INTO EV_Chargers (spot_id, charger_code, charger_type, power_kw, connector_type, status, installed_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		req.SpotID, req.ChargerCode, req.ChargerType, req.PowerKW, req.ConnectorType, status, req.InstalledAt,
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

func (r *ChargerRepo) Update(ctx context.Context, id uint64, req models.UpdateChargerRequest) (*models.EVCharger, error) {
	if req.Status != nil {
		if _, err := r.db.ExecContext(ctx,
			`UPDATE EV_Chargers SET status = ? WHERE charger_id = ?`, *req.Status, id,
		); err != nil {
			return nil, err
		}
	}
	if req.ConnectorType != nil {
		if _, err := r.db.ExecContext(ctx,
			`UPDATE EV_Chargers SET connector_type = ? WHERE charger_id = ?`, *req.ConnectorType, id,
		); err != nil {
			return nil, err
		}
	}
	return r.GetByID(ctx, id)
}

func (r *ChargerRepo) LogError(ctx context.Context, chargerID uint64, req models.LogChargerErrorRequest) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx,
		`INSERT INTO Charger_Error_Log (charger_id, error_code, error_message) VALUES (?, ?, ?)`,
		chargerID, req.ErrorCode, req.ErrorMessage,
	); err != nil {
		return err
	}

	reason := req.ErrorCode
	if req.ErrorMessage != nil && *req.ErrorMessage != "" {
		reason = req.ErrorCode + ": " + *req.ErrorMessage
	}
	if _, err = tx.ExecContext(ctx,
		`INSERT INTO Maintenance_Alerts (charger_id, reason) VALUES (?, ?)`,
		chargerID, reason,
	); err != nil {
		return err
	}

	return tx.Commit()
}
