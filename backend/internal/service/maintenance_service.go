package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type MaintenanceService struct {
	repo *repository.MaintenanceRepo
}

func NewMaintenanceService(repo *repository.MaintenanceRepo) *MaintenanceService {
	return &MaintenanceService{repo: repo}
}

func (s *MaintenanceService) ListUnresolved(ctx context.Context) ([]models.MaintenanceAlert, error) {
	return s.repo.ListUnresolved(ctx)
}

func (s *MaintenanceService) Resolve(ctx context.Context, alertID uint64) error {
	return s.repo.Resolve(ctx, alertID)
}

func (s *MaintenanceService) RiskAlerts(ctx context.Context) ([]models.MaintenanceRiskAlert, error) {
	return s.repo.RiskAlerts(ctx)
}
