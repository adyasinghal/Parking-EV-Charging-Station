package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type MaintenanceRepo struct {
	db *sqlx.DB
}

func NewMaintenanceRepo(db *sqlx.DB) *MaintenanceRepo {
	return &MaintenanceRepo{db: db}
}

func (r *MaintenanceRepo) ListUnresolved(ctx context.Context) ([]models.MaintenanceAlert, error) {
	var list []models.MaintenanceAlert
	err := r.db.SelectContext(ctx, &list,
		`SELECT ma.*, ec.charger_code
		 FROM Maintenance_Alerts ma
		 JOIN EV_Chargers ec ON ec.charger_id = ma.charger_id
		 WHERE ma.is_resolved = 0
		 ORDER BY ma.raised_at DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.MaintenanceAlert{}, nil
	}
	return list, nil
}

func (r *MaintenanceRepo) Resolve(ctx context.Context, alertID uint64) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE Maintenance_Alerts
		 SET is_resolved = 1, resolved_at = NOW()
		 WHERE alert_id = ? AND is_resolved = 0`,
		alertID,
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

func (r *MaintenanceRepo) RiskAlerts(ctx context.Context) ([]models.MaintenanceRiskAlert, error) {
	rows, err := r.db.QueryContext(ctx, `CALL sp_maintenance_risk_alerts()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.MaintenanceRiskAlert, 0)
	for rows.Next() {
		var item models.MaintenanceRiskAlert
		if err := rows.Scan(&item.ChargerID, &item.ChargerCode, &item.ErrorsLast24h); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}
