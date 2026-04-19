package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type PricingRepo struct {
	db *sqlx.DB
}

func NewPricingRepo(db *sqlx.DB) *PricingRepo {
	return &PricingRepo{db: db}
}

func (r *PricingRepo) List(ctx context.Context) ([]models.PricingRule, error) {
	var list []models.PricingRule
	err := r.db.SelectContext(ctx, &list,
		`SELECT * FROM Pricing_Rules ORDER BY zone_id ASC, effective_from DESC`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.PricingRule{}, nil
	}
	return list, nil
}

func (r *PricingRepo) GetByID(ctx context.Context, id uint64) (*models.PricingRule, error) {
	var rule models.PricingRule
	err := r.db.GetContext(ctx, &rule, `SELECT * FROM Pricing_Rules WHERE rule_id = ? LIMIT 1`, id)
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *PricingRepo) Create(ctx context.Context, req models.CreatePricingRuleRequest) (*models.PricingRule, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Pricing_Rules
		 (zone_id, rule_name, is_peak, peak_start_time, peak_end_time,
		  base_rate_per_hr, peak_multiplier, energy_rate_kwh, effective_from, effective_until)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.ZoneID, req.RuleName, req.IsPeak, req.PeakStartTime, req.PeakEndTime,
		req.BaseRatePerHr, req.PeakMultiplier, req.EnergyRateKwh, req.EffectiveFrom, req.EffectiveUntil,
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

func (r *PricingRepo) Update(ctx context.Context, id uint64, req models.UpdatePricingRuleRequest) (*models.PricingRule, error) {
	rule, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.RuleName != nil {
		rule.RuleName = req.RuleName
	}
	if req.IsPeak != nil {
		rule.IsPeak = *req.IsPeak
	}
	if req.PeakStartTime != nil {
		rule.PeakStartTime = req.PeakStartTime
	}
	if req.PeakEndTime != nil {
		rule.PeakEndTime = req.PeakEndTime
	}
	if req.BaseRatePerHr != nil {
		rule.BaseRatePerHr = *req.BaseRatePerHr
	}
	if req.PeakMultiplier != nil {
		rule.PeakMultiplier = req.PeakMultiplier
	}
	if req.EnergyRateKwh != nil {
		rule.EnergyRateKwh = req.EnergyRateKwh
	}
	if req.EffectiveFrom != nil {
		rule.EffectiveFrom = *req.EffectiveFrom
	}
	if req.EffectiveUntil != nil {
		rule.EffectiveUntil = req.EffectiveUntil
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE Pricing_Rules SET
		 rule_name=?, is_peak=?, peak_start_time=?, peak_end_time=?,
		 base_rate_per_hr=?, peak_multiplier=?, energy_rate_kwh=?,
		 effective_from=?, effective_until=?
		 WHERE rule_id=?`,
		rule.RuleName, rule.IsPeak, rule.PeakStartTime, rule.PeakEndTime,
		rule.BaseRatePerHr, rule.PeakMultiplier, rule.EnergyRateKwh,
		rule.EffectiveFrom, rule.EffectiveUntil, id,
	)
	if err != nil {
		return nil, err
	}
	return rule, nil
}

func (r *PricingRepo) Delete(ctx context.Context, id uint64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM Pricing_Rules WHERE rule_id = ?`, id)
	return err
}
