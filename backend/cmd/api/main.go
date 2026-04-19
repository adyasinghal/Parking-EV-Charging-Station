package main

import (
	"log"

	"voltpark/internal/config"
	"voltpark/internal/database"
	"voltpark/internal/handler"
	"voltpark/internal/repository"
	"voltpark/internal/router"
	"voltpark/internal/service"
)

func main() {
	cfg := config.Load()

	db, err := database.NewDB(cfg)
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}
	defer db.Close()

	userRepo := repository.NewUserRepo(db)
	walletRepo := repository.NewWalletRepo(db)
	vehicleRepo := repository.NewVehicleRepo(db)
	zoneRepo := repository.NewZoneRepo(db)
	spotRepo := repository.NewSpotRepo(db)
	chargerRepo := repository.NewChargerRepo(db)
	pricingRepo := repository.NewPricingRepo(db)
	reservationRepo := repository.NewReservationRepo(db)
	sessionRepo := repository.NewSessionRepo(db)
	billingRepo := repository.NewBillingRepo(db)
	maintenanceRepo := repository.NewMaintenanceRepo(db)
	analyticsRepo := repository.NewAnalyticsRepo(db)
	sseRepo := repository.NewSSERepo(db)
	publicRepo := repository.NewPublicRepo(db)

	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTTokenTTLHours)
	userSvc := service.NewUserService(userRepo)
	walletSvc := service.NewWalletService(walletRepo)
	vehicleSvc := service.NewVehicleService(vehicleRepo)
	zoneSvc := service.NewZoneService(zoneRepo)
	spotSvc := service.NewSpotService(spotRepo)
	chargerSvc := service.NewChargerService(chargerRepo)
	pricingSvc := service.NewPricingService(pricingRepo)
	reservationSvc := service.NewReservationService(reservationRepo, spotRepo, cfg.UseDBProcedures)
	sessionSvc := service.NewSessionService(sessionRepo)
	billingSvc := service.NewBillingService(billingRepo)
	maintenanceSvc := service.NewMaintenanceService(maintenanceRepo)
	analyticsSvc := service.NewAnalyticsService(analyticsRepo)

	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc)
	walletHandler := handler.NewWalletHandler(walletSvc)
	vehicleHandler := handler.NewVehicleHandler(vehicleSvc)
	zoneHandler := handler.NewZoneHandler(zoneSvc)
	spotHandler := handler.NewSpotHandler(spotSvc)
	chargerHandler := handler.NewChargerHandler(chargerSvc)
	pricingHandler := handler.NewPricingHandler(pricingSvc)
	reservationHandler := handler.NewReservationHandler(reservationSvc)
	sessionHandler := handler.NewSessionHandler(sessionSvc)
	billingHandler := handler.NewBillingHandler(billingSvc)
	maintenanceHandler := handler.NewMaintenanceHandler(maintenanceSvc)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsSvc)
	sseHandler := handler.NewSSEHandler(sseRepo)
	publicHandler := handler.NewPublicHandler(publicRepo)

	r := router.New(
		cfg,
		authHandler,
		userHandler,
		walletHandler,
		vehicleHandler,
		zoneHandler,
		spotHandler,
		chargerHandler,
		pricingHandler,
		reservationHandler,
		sessionHandler,
		billingHandler,
		maintenanceHandler,
		analyticsHandler,
		sseHandler,
		publicHandler,
	)
	log.Printf("VoltPark API listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server run: %v", err)
	}
}
