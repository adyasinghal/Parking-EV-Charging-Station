package service

import (
	"context"
	"database/sql"
	"errors"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type PricingService struct {
	repo *repository.PricingRepo
}

func NewPricingService(repo *repository.PricingRepo) *PricingService {
	return &PricingService{repo: repo}
}

func (s *PricingService) List(ctx context.Context) ([]models.PricingRule, error) {
	return s.repo.List(ctx)
}

func (s *PricingService) Create(ctx context.Context, req models.CreatePricingRuleRequest) (*models.PricingRule, error) {
	return s.repo.Create(ctx, req)
}

func (s *PricingService) Update(ctx context.Context, id uint64, req models.UpdatePricingRuleRequest) (*models.PricingRule, error) {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return s.repo.Update(ctx, id, req)
}

func (s *PricingService) Delete(ctx context.Context, id uint64) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return sql.ErrNoRows
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}
