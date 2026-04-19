package models

type ParkingSpot struct {
	SpotID     uint64 `db:"spot_id" json:"spot_id"`
	ZoneID     uint64 `db:"zone_id" json:"zone_id"`
	SpotCode   string `db:"spot_code" json:"spot_code"`
	FloorLevel *int   `db:"floor_level" json:"floor_level,omitempty"`
	Type       string `db:"type" json:"type"`
	Status     string `db:"status" json:"status"`
}

// SpotWithCharger keeps the parking spot model intact while optionally attaching the
// charger installed on that spot. Not all spots are charger-enabled.
type SpotWithCharger struct {
	SpotID     uint64            `json:"spot_id"`
	ZoneID     uint64            `json:"zone_id"`
	SpotCode   string            `json:"spot_code"`
	FloorLevel *int              `json:"floor_level,omitempty"`
	Type       string            `json:"type"`
	Status     string            `json:"status"`
	Charger    *EVChargerSummary `json:"charger,omitempty"`
}

type CreateSpotRequest struct {
	ZoneID     uint64 `json:"zone_id" binding:"required"`
	SpotCode   string `json:"spot_code" binding:"required,max=20"`
	FloorLevel *int   `json:"floor_level"`
	Type       string `json:"type"`
	Status     string `json:"status"`
}

type UpdateSpotStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
