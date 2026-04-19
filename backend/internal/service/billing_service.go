package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type BillingService struct {
	repo *repository.BillingRepo
}

func NewBillingService(repo *repository.BillingRepo) *BillingService {
	return &BillingService{repo: repo}
}

func (s *BillingService) ListByUser(ctx context.Context, userID uint64) ([]models.BillingRecord, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *BillingService) ListAll(ctx context.Context) ([]models.BillingRecord, error) {
	return s.repo.ListAll(ctx)
}
