package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"voltpark/internal/service"
)

type AnalyticsHandler struct {
	svc *service.AnalyticsService
}

func NewAnalyticsHandler(svc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

func (h *AnalyticsHandler) HighTraffic(c *gin.Context) {
	list, err := h.svc.HighTraffic(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch high traffic zones", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) ChargerEfficiency(c *gin.Context) {
	list, err := h.svc.ChargerEfficiency(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch charger efficiency", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) TopSpenders(c *gin.Context) {
	list, err := h.svc.TopSpenders(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch top spenders", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) NoShowRate(c *gin.Context) {
	list, err := h.svc.NoShowRate(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch no-show rate", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) Heatmap(c *gin.Context) {
	from, to, ok := parseRange(c)
	if !ok {
		return
	}
	list, err := h.svc.Heatmap(c.Request.Context(), from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch heatmap", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) ChargerUtilization(c *gin.Context) {
	from, to, ok := parseRange(c)
	if !ok {
		return
	}
	list, err := h.svc.ChargerUtilization(c.Request.Context(), from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch charger utilization", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) ParkingOnlyUsers(c *gin.Context) {
	list, err := h.svc.ParkingOnlyUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch parking-only users", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) OvertimeSessions(c *gin.Context) {
	list, err := h.svc.OvertimeSessions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch overtime sessions", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *AnalyticsHandler) SessionFrequency(c *gin.Context) {
	list, err := h.svc.SessionFrequency(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch session frequency", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func parseRange(c *gin.Context) (time.Time, time.Time, bool) {
	fromRaw := c.Query("from")
	toRaw := c.Query("to")

	if fromRaw == "" || toRaw == "" {
		to := time.Now()
		from := to.Add(-24 * time.Hour)
		return from, to, true
	}

	from, err := time.Parse(time.RFC3339, fromRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid from", "code": "VALIDATION_ERROR"})
		return time.Time{}, time.Time{}, false
	}
	to, err := time.Parse(time.RFC3339, toRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid to", "code": "VALIDATION_ERROR"})
		return time.Time{}, time.Time{}, false
	}
	return from, to, true
}
