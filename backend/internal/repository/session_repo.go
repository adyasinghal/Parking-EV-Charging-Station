package repository

import (
	"context"
	"database/sql"
	"math"
	"time"

	"github.com/jmoiron/sqlx"

	"voltpark/internal/models"
)

type SessionRepo struct {
	db *sqlx.DB
}

func NewSessionRepo(db *sqlx.DB) *SessionRepo {
	return &SessionRepo{db: db}
}

func (r *SessionRepo) Start(ctx context.Context, req models.StartSessionRequest) (*models.ChargingSession, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO Charging_Sessions (charger_id, vehicle_id, reservation_id, kwh_start, status)
		 VALUES (?, ?, ?, ?, ?)`,
		req.ChargerID, req.VehicleID, req.ReservationID, req.KwhStart, models.SessionStatusActive,
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

func (r *SessionRepo) EndByProcedure(ctx context.Context, sessionID uint64, kwhEnd float64, plugOut string) (float64, error) {
	plugOutTime, err := time.Parse(time.DateTime, plugOut)
	if err != nil {
		return 0, err
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var session struct {
		SessionID     uint64        `db:"session_id"`
		VehicleID     uint64        `db:"vehicle_id"`
		ReservationID sql.NullInt64 `db:"reservation_id"`
		ChargerID     uint64        `db:"charger_id"`
		ZoneID        uint64        `db:"zone_id"`
		PlugInTime    time.Time     `db:"plug_in_time"`
		KwhStart      float64       `db:"kwh_start"`
	}

	err = tx.GetContext(ctx, &session,
		`SELECT
			cs.session_id,
			cs.vehicle_id,
			cs.reservation_id,
			cs.charger_id,
			ps.zone_id,
			cs.plug_in_time,
			cs.kwh_start
		 FROM Charging_Sessions cs
		 JOIN EV_Chargers ec ON ec.charger_id = cs.charger_id
		 JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
		 WHERE cs.session_id = ? AND cs.status = ?
		 FOR UPDATE`,
		sessionID,
		models.SessionStatusActive,
	)
	if err != nil {
		return 0, err
	}

	if kwhEnd <= session.KwhStart {
		return 0, models.ErrInvalidKwhEnd
	}

	kwhConsumed := kwhEnd - session.KwhStart
	durationHours := plugOutTime.Sub(session.PlugInTime).Hours()
	if durationHours < 0 {
		durationHours = 0
	}

	terms, err := r.findApplicablePricingTermsTx(ctx, tx, session.ZoneID, plugOutTime)
	if err != nil {
		return 0, err
	}

	cost := round2((kwhConsumed * terms.energyRateKwh) + (durationHours * terms.baseRatePerHr * terms.peakMultiplier))

	_, err = tx.ExecContext(ctx,
		`UPDATE Charging_Sessions
		 SET kwh_end = ?, plug_out_time = ?, status = ?, total_cost = ?
		 WHERE session_id = ?`,
		kwhEnd,
		plugOutTime,
		models.SessionStatusComplete,
		cost,
		sessionID,
	)
	if err != nil {
		return 0, err
	}

	var userID sql.NullInt64
	err = tx.GetContext(ctx, &userID,
		`SELECT user_id FROM Vehicles WHERE vehicle_id = ? LIMIT 1`,
		session.VehicleID,
	)
	if err != nil && err != sql.ErrNoRows {
		return 0, err
	}

	if userID.Valid {
		_, err = tx.ExecContext(ctx,
			`INSERT IGNORE INTO Wallets (user_id, balance, currency) VALUES (?, 0.00, 'INR')`,
			userID.Int64,
		)
		if err != nil {
			return 0, err
		}

		_, err = tx.ExecContext(ctx,
			`UPDATE Wallets SET balance = balance - ? WHERE user_id = ?`,
			cost,
			userID.Int64,
		)
		if err != nil {
			return 0, err
		}

		var reservationID any
		if session.ReservationID.Valid {
			reservationID = session.ReservationID.Int64
		}

		_, err = tx.ExecContext(ctx,
			`INSERT INTO Billing_Records (user_id, session_id, reservation_id, billing_type, amount, description)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			userID.Int64,
			sessionID,
			reservationID,
			models.BillingTypeEnergyFee,
			cost,
			"Charging session fee",
		)
		if err != nil {
			return 0, err
		}
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE EV_Chargers SET status = ? WHERE charger_id = ?`,
		models.ChargerStatusAvailable,
		session.ChargerID,
	)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return cost, nil
}

type pricingTerms struct {
	baseRatePerHr  float64
	peakMultiplier float64
	energyRateKwh  float64
}

func (r *SessionRepo) findApplicablePricingTermsTx(ctx context.Context, tx *sqlx.Tx, zoneID uint64, eventTime time.Time) (pricingTerms, error) {
	var rules []models.PricingRule
	err := tx.SelectContext(ctx, &rules,
		`SELECT *
		 FROM Pricing_Rules
		 WHERE zone_id = ?
		   AND effective_from <= ?
		   AND (effective_until IS NULL OR effective_until >= ?)
		 ORDER BY effective_from DESC, rule_id DESC`,
		zoneID,
		eventTime.Format("2006-01-02"),
		eventTime.Format("2006-01-02"),
	)
	if err != nil && err != sql.ErrNoRows {
		return pricingTerms{}, err
	}

	if len(rules) == 0 {
		return pricingTerms{peakMultiplier: 1}, nil
	}

	selected := choosePricingRule(rules, eventTime)
	if selected == nil {
		return pricingTerms{peakMultiplier: 1}, nil
	}

	terms := pricingTerms{
		baseRatePerHr:  selected.BaseRatePerHr,
		peakMultiplier: 1,
		energyRateKwh:  0,
	}
	if selected.PeakMultiplier != nil {
		terms.peakMultiplier = *selected.PeakMultiplier
	}
	if selected.EnergyRateKwh != nil {
		terms.energyRateKwh = *selected.EnergyRateKwh
	}
	return terms, nil
}

func choosePricingRule(rules []models.PricingRule, eventTime time.Time) *models.PricingRule {
	var fallback *models.PricingRule

	for i := range rules {
		rule := &rules[i]
		if rule.IsPeak {
			if matchesPeakWindow(rule, eventTime) {
				return rule
			}
			continue
		}
		if fallback == nil {
			fallback = rule
		}
	}

	return fallback
}

func matchesPeakWindow(rule *models.PricingRule, eventTime time.Time) bool {
	if rule.PeakStartTime == nil || rule.PeakEndTime == nil {
		return false
	}

	start, ok := parseClock(*rule.PeakStartTime)
	if !ok {
		return false
	}
	end, ok := parseClock(*rule.PeakEndTime)
	if !ok {
		return false
	}

	eventClock := eventTime.Hour()*3600 + eventTime.Minute()*60 + eventTime.Second()
	if start == end {
		return true
	}
	if start < end {
		return eventClock >= start && eventClock < end
	}
	return eventClock >= start || eventClock < end
}

func parseClock(v string) (int, bool) {
	for _, layout := range []string{"15:04:05", "15:04"} {
		t, err := time.Parse(layout, v)
		if err == nil {
			return t.Hour()*3600 + t.Minute()*60 + t.Second(), true
		}
	}
	return 0, false
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func (r *SessionRepo) GetByID(ctx context.Context, sessionID uint64) (*models.ChargingSession, error) {
	var s models.ChargingSession
	err := r.db.GetContext(ctx, &s,
		`SELECT * FROM Charging_Sessions WHERE session_id = ? LIMIT 1`, sessionID,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepo) GetActiveByUser(ctx context.Context, userID uint64) (*models.ChargingSession, error) {
	var s models.ChargingSession
	err := r.db.GetContext(ctx, &s,
		`SELECT cs.*
		 FROM Charging_Sessions cs
		 JOIN Vehicles v ON v.vehicle_id = cs.vehicle_id
		 WHERE v.user_id = ? AND cs.status = ?
		 ORDER BY cs.plug_in_time DESC
		 LIMIT 1`,
		userID, models.SessionStatusActive,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SessionRepo) ListByUser(ctx context.Context, userID uint64) ([]models.ChargingSession, error) {
	var list []models.ChargingSession
	err := r.db.SelectContext(ctx, &list,
		`SELECT cs.*
		 FROM Charging_Sessions cs
		 JOIN Vehicles v ON v.vehicle_id = cs.vehicle_id
		 WHERE v.user_id = ?
		 ORDER BY cs.plug_in_time DESC`, userID,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ChargingSession{}, nil
	}
	return list, nil
}

func (r *SessionRepo) ListAll(ctx context.Context) ([]models.ChargingSession, error) {
	var list []models.ChargingSession
	err := r.db.SelectContext(ctx, &list,
		`SELECT * FROM Charging_Sessions ORDER BY plug_in_time DESC`,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if list == nil {
		return []models.ChargingSession{}, nil
	}
	return list, nil
}
