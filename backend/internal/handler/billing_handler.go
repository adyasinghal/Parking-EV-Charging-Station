package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"voltpark/internal/service"
)

type BillingHandler struct {
	svc *service.BillingService
}

func NewBillingHandler(svc *service.BillingService) *BillingHandler {
	return &BillingHandler{svc: svc}
}

func (h *BillingHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListByUser(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch billing records", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *BillingHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch billing records", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}
