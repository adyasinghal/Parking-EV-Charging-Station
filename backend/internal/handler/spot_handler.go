package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"voltpark/internal/models"
	"voltpark/internal/service"
)

type SpotHandler struct {
	svc *service.SpotService
}

func NewSpotHandler(svc *service.SpotService) *SpotHandler {
	return &SpotHandler{svc: svc}
}

func (h *SpotHandler) ListByZone(c *gin.Context) {
	zoneID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		zoneID, err = strconv.ParseUint(c.Param("zone_id"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid zone id", "code": "VALIDATION_ERROR"})
			return
		}
	}

	spots, err := h.svc.ListByZone(c.Request.Context(), zoneID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch spots", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, spots)
}

func (h *SpotHandler) GetByID(c *gin.Context) {
	spotID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	spot, err := h.svc.GetByID(c.Request.Context(), spotID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "spot not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch spot", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, spot)
}

func (h *SpotHandler) Availability(c *gin.Context) {
	spotID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	startRaw := c.Query("start_time")
	endRaw := c.Query("end_time")
	if startRaw == "" || endRaw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_time and end_time are required", "code": "VALIDATION_ERROR"})
		return
	}

	startTime, err := time.Parse(time.RFC3339, startRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time", "code": "VALIDATION_ERROR"})
		return
	}
	endTime, err := time.Parse(time.RFC3339, endRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time", "code": "VALIDATION_ERROR"})
		return
	}

	available, err := h.svc.IsAvailable(c.Request.Context(), spotID, startTime, endTime)
	if err != nil {
		if errors.Is(err, models.ErrInvalidTimeRange) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check availability", "code": "INTERNAL_ERROR"})
		return
	}

	conflicts := []models.SpotConflictWindow{}
	if !available {
		conflicts, err = h.svc.GetConflicts(c.Request.Context(), spotID, startTime, endTime)
		if err != nil {
			if errors.Is(err, models.ErrInvalidTimeRange) {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check availability", "code": "INTERNAL_ERROR"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"spot_id":   spotID,
		"available": available,
		"conflicts": conflicts,
	})
}

func (h *SpotHandler) Create(c *gin.Context) {
	var req models.CreateSpotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	spot, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "invalid spot type" || err.Error() == "invalid spot status" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create spot", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, spot)
}

func (h *SpotHandler) UpdateStatus(c *gin.Context) {
	spotID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	var req models.UpdateSpotStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	spot, err := h.svc.UpdateStatus(c.Request.Context(), spotID, req.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "spot not found", "code": "NOT_FOUND"})
			return
		}
		if err.Error() == "invalid spot status" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to update spot status", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, spot)
}
