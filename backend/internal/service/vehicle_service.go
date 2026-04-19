package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type VehicleService struct {
	repo *repository.VehicleRepo
}

func NewVehicleService(repo *repository.VehicleRepo) *VehicleService {
	return &VehicleService{repo: repo}
}

func (s *VehicleService) ListByUser(ctx context.Context, userID uint64) ([]models.Vehicle, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *VehicleService) Create(ctx context.Context, userID uint64, req models.CreateVehicleRequest) (*models.Vehicle, error) {
	return s.repo.Create(ctx, userID, req)
}

func (s *VehicleService) Update(ctx context.Context, userID, vehicleID uint64, req models.UpdateVehicleRequest) (*models.Vehicle, error) {
	return s.repo.Update(ctx, userID, vehicleID, req)
}

func (s *VehicleService) Delete(ctx context.Context, userID, vehicleID uint64) error {
	return s.repo.Delete(ctx, userID, vehicleID)
}
