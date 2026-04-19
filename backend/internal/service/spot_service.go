package service

import (
	"context"
	"errors"
	"time"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type SpotService struct {
	repo *repository.SpotRepo
}

func NewSpotService(repo *repository.SpotRepo) *SpotService {
	return &SpotService{repo: repo}
}

func (s *SpotService) ListByZone(ctx context.Context, zoneID uint64) ([]models.SpotWithCharger, error) {
	return s.repo.GetByZone(ctx, zoneID)
}

func (s *SpotService) GetByID(ctx context.Context, spotID uint64) (*models.ParkingSpot, error) {
	return s.repo.GetByID(ctx, spotID)
}

func (s *SpotService) Create(ctx context.Context, req models.CreateSpotRequest) (*models.ParkingSpot, error) {
	if req.Type != "" {
		if _, ok := models.AllowedSpotTypes[req.Type]; !ok {
			return nil, errors.New("invalid spot type")
		}
	}
	if req.Status != "" {
		if _, ok := models.AllowedSpotStatuses[req.Status]; !ok {
			return nil, errors.New("invalid spot status")
		}
	}
	return s.repo.Create(ctx, req)
}

func (s *SpotService) UpdateStatus(ctx context.Context, spotID uint64, status string) (*models.ParkingSpot, error) {
	if _, ok := models.AllowedSpotStatuses[status]; !ok {
		return nil, errors.New("invalid spot status")
	}
	return s.repo.UpdateStatus(ctx, spotID, status)
}

func (s *SpotService) IsAvailable(ctx context.Context, spotID uint64, startTime, endTime time.Time) (bool, error) {
	if !endTime.After(startTime) {
		return false, models.ErrInvalidTimeRange
	}
	return s.repo.IsAvailable(ctx, spotID, startTime, endTime)
}

func (s *SpotService) GetConflicts(ctx context.Context, spotID uint64, startTime, endTime time.Time) ([]models.SpotConflictWindow, error) {
	if !endTime.After(startTime) {
		return nil, models.ErrInvalidTimeRange
	}
	return s.repo.GetConflicts(ctx, spotID, startTime, endTime)
}
