package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type ZoneService struct {
	repo *repository.ZoneRepo
}

func NewZoneService(repo *repository.ZoneRepo) *ZoneService {
	return &ZoneService{repo: repo}
}

func (s *ZoneService) ListActive(ctx context.Context) ([]models.ParkingZone, error) {
	return s.repo.ListActive(ctx)
}

func (s *ZoneService) GetByID(ctx context.Context, zoneID uint64) (*models.ParkingZone, error) {
	return s.repo.GetByID(ctx, zoneID)
}

func (s *ZoneService) Create(ctx context.Context, req models.CreateZoneRequest) (*models.ParkingZone, error) {
	return s.repo.Create(ctx, req)
}

func (s *ZoneService) Update(ctx context.Context, zoneID uint64, req models.UpdateZoneRequest) (*models.ParkingZone, error) {
	return s.repo.Update(ctx, zoneID, req)
}
