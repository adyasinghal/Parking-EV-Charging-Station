package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"voltpark/internal/models"
	"voltpark/internal/service"
)

type ReservationHandler struct {
	svc *service.ReservationService
}

func NewReservationHandler(svc *service.ReservationService) *ReservationHandler {
	return &ReservationHandler{svc: svc}
}

func (h *ReservationHandler) Create(c *gin.Context) {
	var req models.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	res, err := h.svc.Create(c.Request.Context(), c.GetUint64("user_id"), req)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrInvalidTimeRange):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "INVALID_TIME_RANGE"})
		case errors.Is(err, models.ErrSpotUnavailable):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error(), "code": "SPOT_UNAVAILABLE"})
		default:
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create reservation", "code": "CREATE_FAILED"})
		}
		return
	}
	c.JSON(http.StatusCreated, res)
}

func (h *ReservationHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListByUser(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reservations", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ReservationHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	res, err := h.svc.GetByID(c.Request.Context(), id, c.GetUint64("user_id"), c.GetString("role"))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reservation", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (h *ReservationHandler) Cancel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	err = h.svc.Cancel(c.Request.Context(), id, c.GetUint64("user_id"), c.GetString("role"))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found or not cancellable", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to cancel reservation", "code": "CANCEL_FAILED"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "reservation cancelled"})
}

func (h *ReservationHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reservations", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}
