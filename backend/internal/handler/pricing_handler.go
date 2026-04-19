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

type PricingHandler struct {
	svc *service.PricingService
}

func NewPricingHandler(svc *service.PricingService) *PricingHandler {
	return &PricingHandler{svc: svc}
}

func (h *PricingHandler) List(c *gin.Context) {
	list, err := h.svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch pricing rules", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *PricingHandler) Create(c *gin.Context) {
	var req models.CreatePricingRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}
	rule, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create pricing rule", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, rule)
}

func (h *PricingHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	var req models.UpdatePricingRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}
	rule, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "pricing rule not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to update pricing rule", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, rule)
}

func (h *PricingHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "pricing rule not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete pricing rule", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "pricing rule deleted"})
}
