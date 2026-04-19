package service

import (
	"context"
	"database/sql"
	"errors"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type ChargerService struct {
	repo *repository.ChargerRepo
}

func NewChargerService(repo *repository.ChargerRepo) *ChargerService {
	return &ChargerService{repo: repo}
}

func (s *ChargerService) List(ctx context.Context) ([]models.EVCharger, error) {
	return s.repo.List(ctx)
}

func (s *ChargerService) GetByID(ctx context.Context, id uint64) (*models.EVCharger, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ChargerService) Create(ctx context.Context, req models.CreateChargerRequest) (*models.EVCharger, error) {
	if _, ok := models.AllowedChargerTypes[req.ChargerType]; !ok {
		return nil, errors.New("invalid charger type")
	}
	if req.Status != nil {
		if _, ok := models.AllowedChargerStatuses[*req.Status]; !ok {
			return nil, errors.New("invalid charger status")
		}
	}
	return s.repo.Create(ctx, req)
}

func (s *ChargerService) Update(ctx context.Context, id uint64, req models.UpdateChargerRequest) (*models.EVCharger, error) {
	if req.Status != nil {
		if _, ok := models.AllowedChargerStatuses[*req.Status]; !ok {
			return nil, errors.New("invalid charger status")
		}
	}
	charger, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	_ = charger
	return s.repo.Update(ctx, id, req)
}

func (s *ChargerService) LogError(ctx context.Context, chargerID uint64, req models.LogChargerErrorRequest) error {
	if _, err := s.repo.GetByID(ctx, chargerID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return sql.ErrNoRows
		}
		return err
	}
	return s.repo.LogError(ctx, chargerID, req)
}
