package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type SessionService struct {
	repo *repository.SessionRepo
}

func NewSessionService(repo *repository.SessionRepo) *SessionService {
	return &SessionService{repo: repo}
}

func (s *SessionService) Start(ctx context.Context, req models.StartSessionRequest) (*models.ChargingSession, error) {
	return s.repo.Start(ctx, req)
}

func (s *SessionService) End(ctx context.Context, sessionID, userID uint64, role string, req models.EndSessionRequest) (float64, error) {
	if req.KwhEnd <= 0 {
		return 0, models.ErrInvalidKwhEnd
	}

	plugOut, err := time.Parse(time.RFC3339, req.PlugOutTime)
	if err != nil {
		return 0, err
	}

	if role != models.RoleAdmin {
		session, err := s.repo.GetByID(ctx, sessionID)
		if err != nil {
			return 0, err
		}
		if err := s.ensureSessionOwner(ctx, session.VehicleID, userID); err != nil {
			return 0, err
		}
	}

	return s.repo.EndByProcedure(ctx, sessionID, req.KwhEnd, plugOut.Format(time.DateTime))
}

func (s *SessionService) GetActive(ctx context.Context, userID uint64) (*models.ChargingSession, error) {
	return s.repo.GetActiveByUser(ctx, userID)
}

func (s *SessionService) ListByUser(ctx context.Context, userID uint64) ([]models.ChargingSession, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *SessionService) ListAll(ctx context.Context) ([]models.ChargingSession, error) {
	return s.repo.ListAll(ctx)
}

func (s *SessionService) ensureSessionOwner(ctx context.Context, vehicleID, userID uint64) error {
	list, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		return err
	}
	for _, item := range list {
		if item.VehicleID == vehicleID {
			return nil
		}
	}
	return models.ErrForbiddenResource
}

func IsSQLNotFound(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}
