package service

import (
	"context"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type WalletService struct {
	repo *repository.WalletRepo
}

func NewWalletService(repo *repository.WalletRepo) *WalletService {
	return &WalletService{repo: repo}
}

func (s *WalletService) Get(ctx context.Context, userID uint64) (*models.Wallet, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *WalletService) TopUp(ctx context.Context, userID uint64, amount float64) (*models.Wallet, error) {
	return s.repo.TopUp(ctx, userID, amount)
}

func (s *WalletService) Transactions(ctx context.Context, userID uint64) ([]models.BillingRecord, error) {
	return s.repo.TransactionsByUserID(ctx, userID)
}

func (s *WalletService) RequestTopUp(ctx context.Context, userID uint64, payload models.CreateTopupRequestPayload) (*models.TopupApprovalRequest, error) {
	return s.repo.CreateTopupRequest(ctx, userID, payload)
}

func (s *WalletService) ListMyTopupRequests(ctx context.Context, userID uint64) ([]models.TopupApprovalRequest, error) {
	return s.repo.ListTopupRequestsByUser(ctx, userID)
}

func (s *WalletService) ListAllTopupRequests(ctx context.Context) ([]models.TopupApprovalRequest, error) {
	return s.repo.ListPendingTopupRequests(ctx)
}

func (s *WalletService) ApproveTopup(ctx context.Context, requestID uint64, adminID uint64) error {
	return s.repo.ApproveTopupRequest(ctx, requestID, adminID)
}

func (s *WalletService) RejectTopup(ctx context.Context, requestID uint64, adminID uint64) error {
	return s.repo.RejectTopupRequest(ctx, requestID, adminID)
}
