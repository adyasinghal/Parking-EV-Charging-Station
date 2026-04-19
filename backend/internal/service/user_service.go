package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type UserService struct {
	repo *repository.UserRepo
}

func NewUserService(repo *repository.UserRepo) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetMe(ctx context.Context, userID uint64) (*models.User, error) {
	return s.repo.FindByID(ctx, userID)
}

func (s *UserService) UpdateMe(ctx context.Context, userID uint64, req models.UpdateMeRequest) (*models.User, error) {
	return s.repo.UpdateMe(ctx, userID, req)
}

func (s *UserService) ListAll(ctx context.Context) ([]models.User, error) {
	return s.repo.ListAll(ctx)
}

func (s *UserService) GetByID(ctx context.Context, userID uint64) (*models.User, error) {
	return s.repo.FindByID(ctx, userID)
}

func (s *UserService) DeleteByID(ctx context.Context, userID uint64) error {
	return s.repo.DeleteByID(ctx, userID)
}
