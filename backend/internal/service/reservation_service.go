package service

import (
	"context"
	"database/sql"
	"time"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type ReservationService struct {
	repo            *repository.ReservationRepo
	spotRepo        *repository.SpotRepo
	useDBProcedures bool
}

func NewReservationService(
	repo *repository.ReservationRepo,
	spotRepo *repository.SpotRepo,
	useDBProcedures bool,
) *ReservationService {
	return &ReservationService{repo: repo, spotRepo: spotRepo, useDBProcedures: useDBProcedures}
}

func (s *ReservationService) Create(ctx context.Context, userID uint64, req models.CreateReservationRequest) (*models.Reservation, error) {
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, err
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, err
	}
	if !endTime.After(startTime) {
		return nil, models.ErrInvalidTimeRange
	}

	available, err := s.spotRepo.IsAvailable(ctx, req.SpotID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	if !available {
		return nil, models.ErrSpotUnavailable
	}

	if s.useDBProcedures {
		return s.repo.CallMakeReservation(
			ctx,
			req.SpotID,
			userID,
			req.VehicleID,
			startTime.Format(time.DateTime),
			endTime.Format(time.DateTime),
		)
	}

	return s.repo.Create(ctx, userID, req.SpotID, req.VehicleID, startTime, endTime)
}

func (s *ReservationService) ListByUser(ctx context.Context, userID uint64) ([]models.Reservation, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *ReservationService) GetByID(ctx context.Context, reservationID, userID uint64, role string) (*models.Reservation, error) {
	if role == models.RoleAdmin {
		return s.repo.GetByID(ctx, reservationID)
	}
	return s.repo.GetByIDAndUser(ctx, reservationID, userID)
}

func (s *ReservationService) Cancel(ctx context.Context, reservationID, userID uint64, role string) error {
	if s.useDBProcedures {
		cancelUserID := userID
		if role == models.RoleAdmin {
			reservation, err := s.repo.GetByID(ctx, reservationID)
			if err != nil {
				return err
			}
			cancelUserID = reservation.UserID
		}
		return s.repo.CancelByProcedure(ctx, reservationID, cancelUserID)
	}

	if role == models.RoleAdmin {
		return s.repo.CancelByID(ctx, reservationID)
	}
	return s.repo.CancelByIDAndUser(ctx, reservationID, userID)
}

func (s *ReservationService) ListAll(ctx context.Context) ([]models.Reservation, error) {
	return s.repo.ListAll(ctx)
}

func IsNotFound(err error) bool {
	return err == sql.ErrNoRows
}
