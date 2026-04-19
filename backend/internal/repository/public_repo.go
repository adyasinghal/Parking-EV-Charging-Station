package repository

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"
)

type PublicStats struct {
	TotalSpots        int     `db:"total_spots"        json:"total_spots"`
	ActiveZones       int     `db:"active_zones"       json:"active_zones"`
	Cities            int     `db:"cities"             json:"cities"`
	AvailableChargers int     `db:"available_chargers" json:"available_chargers"`
	PeakPowerKW       float64 `db:"peak_power_kw"      json:"peak_power_kw"`
	TotalSessions     int     `db:"total_sessions"     json:"total_sessions"`
}

type PublicZone struct {
	ZoneID            uint64  `db:"zone_id"            json:"zone_id"`
	ZoneName          string  `db:"zone_name"          json:"zone_name"`
	City              string  `db:"city"               json:"city"`
	Address           *string `db:"address"            json:"address,omitempty"`
	TotalSpots        int     `db:"total_spots"        json:"total_spots"`
	OpenSpots         int     `db:"open_spots"         json:"open_spots"`
	AvailableChargers int     `db:"available_chargers" json:"available_chargers"`
}

type PublicRepo struct {
	db *sqlx.DB
}

func NewPublicRepo(db *sqlx.DB) *PublicRepo {
	return &PublicRepo{db: db}
}

func (r *PublicRepo) Stats(ctx context.Context) (*PublicStats, error) {
	var stats PublicStats
	err := r.db.GetContext(ctx, &stats, `
		SELECT
			COUNT(*)                                                                  AS active_zones,
			COUNT(DISTINCT city)                                                      AS cities,
			COALESCE(SUM(total_spots), 0)                                             AS total_spots,
			(SELECT COUNT(*) FROM EV_Chargers WHERE status = 'Available')             AS available_chargers,
			(SELECT COALESCE(MAX(power_kw), 0) FROM EV_Chargers)                     AS peak_power_kw,
			(SELECT COUNT(*) FROM Charging_Sessions)                                  AS total_sessions
		FROM Parking_Zones
		WHERE is_active = 1
	`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	return &stats, nil
}

func (r *PublicRepo) Zones(ctx context.Context) ([]PublicZone, error) {
	var zones []PublicZone
	err := r.db.SelectContext(ctx, &zones, `
		SELECT
			pz.zone_id,
			pz.zone_name,
			pz.city,
			pz.address,
			pz.total_spots,
			GREATEST(pz.total_spots - COALESCE(active_res.reserved, 0), 0) AS open_spots,
			COALESCE(avail_ch.cnt, 0)                                       AS available_chargers
		FROM Parking_Zones pz
		LEFT JOIN (
			SELECT ps.zone_id, COUNT(*) AS reserved
			FROM Reservations rs
			JOIN Parking_Spots ps ON ps.spot_id = rs.spot_id
			WHERE rs.status NOT IN ('Cancelled', 'No_Show')
			  AND NOW() BETWEEN rs.start_time AND rs.end_time
			GROUP BY ps.zone_id
		) active_res ON active_res.zone_id = pz.zone_id
		LEFT JOIN (
			SELECT ps.zone_id, COUNT(*) AS cnt
			FROM EV_Chargers ec
			JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
			WHERE ec.status = 'Available'
			GROUP BY ps.zone_id
		) avail_ch ON avail_ch.zone_id = pz.zone_id
		WHERE pz.is_active = 1
		ORDER BY pz.zone_name
	`)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if zones == nil {
		return []PublicZone{}, nil
	}
	return zones, nil
}
