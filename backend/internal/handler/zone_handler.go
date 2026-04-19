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

type ZoneHandler struct {
	svc *service.ZoneService
}

func NewZoneHandler(svc *service.ZoneService) *ZoneHandler {
	return &ZoneHandler{svc: svc}
}

func (h *ZoneHandler) List(c *gin.Context) {
	list, err := h.svc.ListActive(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch zones", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *ZoneHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	zone, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "zone not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch zone", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, zone)
}

func (h *ZoneHandler) Create(c *gin.Context) {
	var req models.CreateZoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	zone, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create zone", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, zone)
}

func (h *ZoneHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	var req models.UpdateZoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	zone, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "zone not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to update zone", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, zone)
}
