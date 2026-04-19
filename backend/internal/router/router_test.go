package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"voltpark/internal/config"
	"voltpark/internal/handler"
)

func TestHealthAndReadyEndpoints(t *testing.T) {
	cfg := &config.Config{Env: "test", JWTSecret: "test-secret"}

	r := New(
		cfg,
		handler.NewAuthHandler(nil),
		handler.NewUserHandler(nil),
		handler.NewWalletHandler(nil),
		handler.NewVehicleHandler(nil),
		handler.NewZoneHandler(nil),
		handler.NewSpotHandler(nil),
		handler.NewChargerHandler(nil),
		handler.NewPricingHandler(nil),
		handler.NewReservationHandler(nil),
		handler.NewSessionHandler(nil),
		handler.NewBillingHandler(nil),
		handler.NewMaintenanceHandler(nil),
		handler.NewAnalyticsHandler(nil),
		handler.NewSSEHandler(nil),
		handler.NewPublicHandler(nil),
	)

	wHealth := httptest.NewRecorder()
	reqHealth := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	r.ServeHTTP(wHealth, reqHealth)
	if wHealth.Code != http.StatusOK {
		t.Fatalf("healthz expected 200, got %d", wHealth.Code)
	}

	wReady := httptest.NewRecorder()
	reqReady := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	r.ServeHTTP(wReady, reqReady)
	if wReady.Code != http.StatusOK {
		t.Fatalf("readyz expected 200, got %d", wReady.Code)
	}
}
