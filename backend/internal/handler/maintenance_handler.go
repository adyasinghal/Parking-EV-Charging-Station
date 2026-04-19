package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"voltpark/internal/service"
)

type MaintenanceHandler struct {
	svc *service.MaintenanceService
}

func NewMaintenanceHandler(svc *service.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{svc: svc}
}

func (h *MaintenanceHandler) ListAlerts(c *gin.Context) {
	list, err := h.svc.ListUnresolved(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch maintenance alerts", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *MaintenanceHandler) Resolve(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	if err := h.svc.Resolve(c.Request.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "alert not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to resolve alert", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "alert resolved"})
}

func (h *MaintenanceHandler) Risk(c *gin.Context) {
	list, err := h.svc.RiskAlerts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch risk alerts", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}
