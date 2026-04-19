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

type ChargerHandler struct {
	svc *service.ChargerService
}

func NewChargerHandler(svc *service.ChargerService) *ChargerHandler {
	return &ChargerHandler{svc: svc}
}

func (h *ChargerHandler) List(c *gin.Context) {
	list, err := h.svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch chargers", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ChargerHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	charger, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "charger not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch charger", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, charger)
}

func (h *ChargerHandler) Create(c *gin.Context) {
	var req models.CreateChargerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	charger, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "invalid charger type" || err.Error() == "invalid charger status" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create charger", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, charger)
}

func (h *ChargerHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	var req models.UpdateChargerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}
	charger, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "charger not found", "code": "NOT_FOUND"})
			return
		}
		if err.Error() == "invalid charger status" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to update charger", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, charger)
}

func (h *ChargerHandler) LogError(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	var req models.LogChargerErrorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}
	if err := h.svc.LogError(c.Request.Context(), id, req); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "charger not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to log error", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "error logged"})
}
