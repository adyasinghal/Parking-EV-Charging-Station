package models

import "time"

// SpotConflictWindow represents an existing confirmed reservation window that overlaps a requested window.
type SpotConflictWindow struct {
	StartTime time.Time `db:"start_time" json:"start_time"`
	EndTime   time.Time `db:"end_time" json:"end_time"`
}
