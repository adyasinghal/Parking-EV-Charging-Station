package router

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"voltpark/internal/config"
	"voltpark/internal/handler"
	"voltpark/internal/middleware"
	"voltpark/internal/models"
)

func New(
	cfg *config.Config,
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	walletHandler *handler.WalletHandler,
	vehicleHandler *handler.VehicleHandler,
	zoneHandler *handler.ZoneHandler,
	spotHandler *handler.SpotHandler,
	chargerHandler *handler.ChargerHandler,
	pricingHandler *handler.PricingHandler,
	reservationHandler *handler.ReservationHandler,
	sessionHandler *handler.SessionHandler,
	billingHandler *handler.BillingHandler,
	maintenanceHandler *handler.MaintenanceHandler,
	analyticsHandler *handler.AnalyticsHandler,
	sseHandler *handler.SSEHandler,
	publicHandler *handler.PublicHandler,
) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"https://semirespectable-undejectedly-maia.ngrok-free.dev",
		},
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
		MaxAge:        12 * time.Hour,
	}))

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/readyz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ready", "env": cfg.Env})
	})

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		pub := api.Group("/public")
		{
			pub.GET("/stats", publicHandler.Stats)
			pub.GET("/zones", publicHandler.Zones)
		}

		protected := api.Group("")
		protected.Use(middleware.JWTAuth(cfg.JWTSecret))
		{
			protected.GET("/users/me", userHandler.GetMe)
			protected.PUT("/users/me", userHandler.UpdateMe)

			protected.GET("/wallet", walletHandler.Get)
			protected.POST("/wallet/topup", walletHandler.TopUp)
			protected.GET("/wallet/transactions", walletHandler.Transactions)
			protected.POST("/wallet/topup-request", walletHandler.RequestTopUp)
			protected.GET("/wallet/topup-requests", walletHandler.ListMyTopupRequests)

			protected.GET("/vehicles", vehicleHandler.List)
			protected.POST("/vehicles", vehicleHandler.Create)
			protected.PUT("/vehicles/:id", vehicleHandler.Update)
			protected.DELETE("/vehicles/:id", vehicleHandler.Delete)

			protected.GET("/zones", zoneHandler.List)
			protected.GET("/zones/:id", zoneHandler.GetByID)
			protected.GET("/zones/:id/spots", spotHandler.ListByZone)

			protected.GET("/spots/:id", spotHandler.GetByID)
			protected.GET("/spots/:id/availability", spotHandler.Availability)

			protected.GET("/chargers", chargerHandler.List)
			protected.GET("/chargers/:id", chargerHandler.GetByID)
			protected.POST("/chargers/:id/errors", chargerHandler.LogError)

			protected.GET("/reservations", reservationHandler.ListMine)
			protected.POST("/reservations", reservationHandler.Create)
			protected.GET("/reservations/:id", reservationHandler.GetByID)
			protected.DELETE("/reservations/:id", reservationHandler.Cancel)

			protected.POST("/sessions", sessionHandler.Start)
			protected.GET("/sessions/active", sessionHandler.Active)
			protected.PUT("/sessions/:id/end", sessionHandler.End)
			protected.GET("/sessions", sessionHandler.ListMine)

			protected.GET("/billing", billingHandler.ListMine)

			protected.GET("/sse/spots/:zone_id", sseHandler.SpotStream)
			protected.GET("/sse/chargers", sseHandler.ChargerStream)

			adminOrOperator := protected.Group("")
			adminOrOperator.Use(middleware.RequireRole(models.RoleAdmin, models.RoleOperator))
			{
				adminOrOperator.PUT("/spots/:id/status", spotHandler.UpdateStatus)
				adminOrOperator.PUT("/chargers/:id", chargerHandler.Update)
			}

			admin := protected.Group("")
			admin.Use(middleware.RequireRole(models.RoleAdmin))
			{
				admin.GET("/wallet/topup-requests/admin", walletHandler.ListAllTopupRequests)
				admin.PUT("/wallet/topup-requests/:id/approve", walletHandler.ApproveTopup)
				admin.PUT("/wallet/topup-requests/:id/reject", walletHandler.RejectTopup)

				admin.GET("/users", userHandler.List)
				admin.GET("/users/:id", userHandler.GetByID)
				admin.DELETE("/users/:id", userHandler.Delete)

				admin.POST("/zones", zoneHandler.Create)
				admin.PUT("/zones/:id", zoneHandler.Update)
				admin.POST("/spots", spotHandler.Create)
				admin.POST("/chargers", chargerHandler.Create)

				admin.GET("/pricing", pricingHandler.List)
				admin.POST("/pricing", pricingHandler.Create)
				admin.PUT("/pricing/:id", pricingHandler.Update)
				admin.DELETE("/pricing/:id", pricingHandler.Delete)

				admin.GET("/reservations/admin/all", reservationHandler.ListAll)

				admin.GET("/sessions/admin/all", sessionHandler.ListAll)
				admin.GET("/billing/admin/all", billingHandler.ListAll)

				admin.GET("/maintenance/alerts", maintenanceHandler.ListAlerts)
				admin.PUT("/maintenance/alerts/:id/resolve", maintenanceHandler.Resolve)
				admin.GET("/maintenance/risk", maintenanceHandler.Risk)

				admin.GET("/analytics/high-traffic", analyticsHandler.HighTraffic)
				admin.GET("/analytics/charger-efficiency", analyticsHandler.ChargerEfficiency)
				admin.GET("/analytics/top-spenders", analyticsHandler.TopSpenders)
				admin.GET("/analytics/no-show-rate", analyticsHandler.NoShowRate)
				admin.GET("/analytics/heatmap", analyticsHandler.Heatmap)
				admin.GET("/analytics/charger-utilization", analyticsHandler.ChargerUtilization)
				admin.GET("/analytics/parking-only-users", analyticsHandler.ParkingOnlyUsers)
				admin.GET("/analytics/overtime-sessions", analyticsHandler.OvertimeSessions)
				admin.GET("/analytics/session-frequency", analyticsHandler.SessionFrequency)
			}
		}
	}

	return r
}
