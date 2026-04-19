package models

import "errors"

var (
	ErrSpotUnavailable   = errors.New("spot unavailable for requested time window")
	ErrInvalidTimeRange  = errors.New("end time must be after start time")
	ErrForbiddenResource = errors.New("forbidden")
	ErrInvalidKwhEnd     = errors.New("kwh_end must be greater than zero")
)
