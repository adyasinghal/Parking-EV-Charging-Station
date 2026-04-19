package models

import "time"

type EVCharger struct {
	ChargerID     uint64     `db:"charger_id"     json:"charger_id"`
	SpotID        uint64     `db:"spot_id"        json:"spot_id"`
	ZoneID        uint64     `db:"zone_id"        json:"zone_id"`
	SpotCode      string     `db:"spot_code"      json:"spot_code"`
	SpotType      string     `db:"spot_type"      json:"spot_type"`
	ChargerCode   string     `db:"charger_code"   json:"charger_code"`
	ChargerType   string     `db:"charger_type"   json:"charger_type"`
	PowerKW       float64    `db:"power_kw"       json:"power_kw"`
	ConnectorType *string    `db:"connector_type" json:"connector_type,omitempty"`
	Status        string     `db:"status"         json:"status"`
	InstalledAt   *time.Time `db:"installed_at"   json:"installed_at,omitempty"`
}

type EVChargerSummary struct {
	ChargerID     uint64     `json:"charger_id"`
	ChargerCode   string     `json:"charger_code"`
	ChargerType   string     `json:"charger_type"`
	PowerKW       float64    `json:"power_kw"`
	ConnectorType *string    `json:"connector_type,omitempty"`
	Status        string     `json:"status"`
	InstalledAt   *time.Time `json:"installed_at,omitempty"`
}

type CreateChargerRequest struct {
	SpotID        uint64     `json:"spot_id" binding:"required"`
	ChargerCode   string     `json:"charger_code" binding:"required,max=30"`
	ChargerType   string     `json:"charger_type" binding:"required"`
	PowerKW       float64    `json:"power_kw" binding:"required,gt=0"`
	ConnectorType *string    `json:"connector_type"`
	Status        *string    `json:"status"`
	InstalledAt   *time.Time `json:"installed_at"`
}

type UpdateChargerRequest struct {
	Status        *string `json:"status"`
	ConnectorType *string `json:"connector_type"`
}

type LogChargerErrorRequest struct {
	ErrorCode    string  `json:"error_code"    binding:"required,max=50"`
	ErrorMessage *string `json:"error_message"`
}
