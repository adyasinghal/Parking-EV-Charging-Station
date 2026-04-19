package models

const (
	RoleDriver   = "Driver"
	RoleAdmin    = "Admin"
	RoleOperator = "Operator"
)

var AllowedRoles = map[string]struct{}{
	RoleDriver:   {},
	RoleAdmin:    {},
	RoleOperator: {},
}

const (
	BillingTypeParkingFee = "Parking_Fee"
	BillingTypeEnergyFee  = "Energy_Fee"
	BillingTypeCombined   = "Combined"
	BillingTypeRefund     = "Refund"
	BillingTypeTopUp      = "Top_Up"
)

const (
	SpotTypeStandard    = "Standard"
	SpotTypeEVEnabled   = "EV_Enabled"
	SpotTypeHandicapped = "Handicapped"
	SpotTypeCompact     = "Compact"
	SpotTypeOversized   = "Oversized"
)

var AllowedSpotTypes = map[string]struct{}{
	SpotTypeStandard:    {},
	SpotTypeEVEnabled:   {},
	SpotTypeHandicapped: {},
	SpotTypeCompact:     {},
	SpotTypeOversized:   {},
}

const (
	SpotStatusAvailable        = "Available"
	SpotStatusOccupied         = "Occupied"
	SpotStatusReserved         = "Reserved"
	SpotStatusUnderMaintenance = "Under_Maintenance"
)

var AllowedSpotStatuses = map[string]struct{}{
	SpotStatusAvailable:        {},
	SpotStatusOccupied:         {},
	SpotStatusReserved:         {},
	SpotStatusUnderMaintenance: {},
}

const (
	ReservationStatusConfirmed = "Confirmed"
	ReservationStatusCancelled = "Cancelled"
	ReservationStatusCompleted = "Completed"
	ReservationStatusNoShow    = "No_Show"
)

const (
	SessionStatusActive      = "Active"
	SessionStatusComplete    = "Complete"
	SessionStatusInterrupted = "Interrupted"
)

const (
	ChargerStatusAvailable        = "Available"
	ChargerStatusInUse            = "In_Use"
	ChargerStatusFaulted          = "Faulted"
	ChargerStatusUnderMaintenance = "Under_Maintenance"
	ChargerStatusOffline          = "Offline"
)

var AllowedChargerStatuses = map[string]struct{}{
	ChargerStatusAvailable:        {},
	ChargerStatusInUse:            {},
	ChargerStatusFaulted:          {},
	ChargerStatusUnderMaintenance: {},
	ChargerStatusOffline:          {},
}

const (
	ChargerTypeLevel1AC  = "Level1_AC"
	ChargerTypeLevel2AC  = "Level2_AC"
	ChargerTypeDCFast    = "DC_Fast"
	ChargerTypeUltraFast = "Ultra_Fast"
)

var AllowedChargerTypes = map[string]struct{}{
	ChargerTypeLevel1AC:  {},
	ChargerTypeLevel2AC:  {},
	ChargerTypeDCFast:    {},
	ChargerTypeUltraFast: {},
}
