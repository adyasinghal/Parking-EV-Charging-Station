package models

type ParkingZone struct {
	ZoneID     uint64  `db:"zone_id" json:"zone_id"`
	ZoneName   string  `db:"zone_name" json:"zone_name"`
	City       string  `db:"city" json:"city"`
	Address    *string `db:"address" json:"address,omitempty"`
	TotalSpots int     `db:"total_spots" json:"total_spots"`
	IsActive   bool    `db:"is_active" json:"is_active"`
}

type CreateZoneRequest struct {
	ZoneName   string  `json:"zone_name" binding:"required,min=2,max=120"`
	City       string  `json:"city" binding:"required,min=2,max=80"`
	Address    *string `json:"address"`
	TotalSpots int     `json:"total_spots" binding:"required,gt=0"`
	IsActive   *bool   `json:"is_active"`
}

type UpdateZoneRequest struct {
	ZoneName   *string `json:"zone_name" binding:"omitempty,min=2,max=120"`
	City       *string `json:"city" binding:"omitempty,min=2,max=80"`
	Address    *string `json:"address"`
	TotalSpots *int    `json:"total_spots" binding:"omitempty,gt=0"`
	IsActive   *bool   `json:"is_active"`
}
