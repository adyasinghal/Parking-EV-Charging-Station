package service

import (
	"context"
	"time"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type AnalyticsService struct {
	repo *repository.AnalyticsRepo
}

func NewAnalyticsService(repo *repository.AnalyticsRepo) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) HighTraffic(ctx context.Context) ([]models.HighTrafficZone, error) {
	return s.repo.HighTraffic(ctx)
}

func (s *AnalyticsService) ChargerEfficiency(ctx context.Context) ([]models.ChargerEfficiency, error) {
	return s.repo.ChargerEfficiency(ctx)
}

func (s *AnalyticsService) TopSpenders(ctx context.Context) ([]models.TopSpender, error) {
	return s.repo.TopSpenders(ctx)
}

func (s *AnalyticsService) NoShowRate(ctx context.Context) ([]models.ZoneNoShowRate, error) {
	return s.repo.NoShowRate(ctx)
}

func (s *AnalyticsService) Heatmap(ctx context.Context, from, to time.Time) ([]models.HeatmapPoint, error) {
	return s.repo.Heatmap(ctx, from, to)
}

func (s *AnalyticsService) ChargerUtilization(ctx context.Context, from, to time.Time) ([]models.ChargerUtilization, error) {
	return s.repo.ChargerUtilization(ctx, from, to)
}

func (s *AnalyticsService) ParkingOnlyUsers(ctx context.Context) ([]models.ParkingOnlyUser, error) {
	return s.repo.ParkingOnlyUsers(ctx)
}

func (s *AnalyticsService) OvertimeSessions(ctx context.Context) ([]models.OvertimeSession, error) {
	return s.repo.OvertimeSessions(ctx)
}

func (s *AnalyticsService) SessionFrequency(ctx context.Context) ([]models.SessionFrequency, error) {
	return s.repo.SessionFrequency(ctx)
}
