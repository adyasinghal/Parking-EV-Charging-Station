package models

type PricingRule struct {
	RuleID         uint64   `db:"rule_id"           json:"rule_id"`
	ZoneID         uint64   `db:"zone_id"           json:"zone_id"`
	RuleName       *string  `db:"rule_name"         json:"rule_name,omitempty"`
	IsPeak         bool     `db:"is_peak"           json:"is_peak"`
	PeakStartTime  *string  `db:"peak_start_time"   json:"peak_start_time,omitempty"`
	PeakEndTime    *string  `db:"peak_end_time"     json:"peak_end_time,omitempty"`
	BaseRatePerHr  float64  `db:"base_rate_per_hr"  json:"base_rate_per_hr"`
	PeakMultiplier *float64 `db:"peak_multiplier"   json:"peak_multiplier,omitempty"`
	EnergyRateKwh  *float64 `db:"energy_rate_kwh"   json:"energy_rate_kwh,omitempty"`
	EffectiveFrom  string   `db:"effective_from"    json:"effective_from"`
	EffectiveUntil *string  `db:"effective_until"   json:"effective_until,omitempty"`
}

type CreatePricingRuleRequest struct {
	ZoneID         uint64   `json:"zone_id"          binding:"required"`
	RuleName       *string  `json:"rule_name"`
	IsPeak         bool     `json:"is_peak"`
	PeakStartTime  *string  `json:"peak_start_time"`
	PeakEndTime    *string  `json:"peak_end_time"`
	BaseRatePerHr  float64  `json:"base_rate_per_hr" binding:"required,min=0"`
	PeakMultiplier *float64 `json:"peak_multiplier"`
	EnergyRateKwh  *float64 `json:"energy_rate_kwh"`
	EffectiveFrom  string   `json:"effective_from"   binding:"required"`
	EffectiveUntil *string  `json:"effective_until"`
}

type UpdatePricingRuleRequest struct {
	RuleName       *string  `json:"rule_name"`
	IsPeak         *bool    `json:"is_peak"`
	PeakStartTime  *string  `json:"peak_start_time"`
	PeakEndTime    *string  `json:"peak_end_time"`
	BaseRatePerHr  *float64 `json:"base_rate_per_hr"`
	PeakMultiplier *float64 `json:"peak_multiplier"`
	EnergyRateKwh  *float64 `json:"energy_rate_kwh"`
	EffectiveFrom  *string  `json:"effective_from"`
	EffectiveUntil *string  `json:"effective_until"`
}
