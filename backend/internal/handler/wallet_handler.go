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

type WalletHandler struct {
	svc *service.WalletService
}

func NewWalletHandler(svc *service.WalletService) *WalletHandler {
	return &WalletHandler{svc: svc}
}

func (h *WalletHandler) Get(c *gin.Context) {
	wallet, err := h.svc.Get(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch wallet", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

func (h *WalletHandler) TopUp(c *gin.Context) {
	var req models.TopUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	wallet, err := h.svc.TopUp(c.Request.Context(), c.GetUint64("user_id"), req.Amount)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "top-up failed", "code": "TOPUP_FAILED"})
		return
	}
	c.JSON(http.StatusOK, wallet)
}

func (h *WalletHandler) Transactions(c *gin.Context) {
	list, err := h.svc.Transactions(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch transactions", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *WalletHandler) RequestTopUp(c *gin.Context) {
	var req models.CreateTopupRequestPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}
	result, err := h.svc.RequestTopUp(c.Request.Context(), c.GetUint64("user_id"), req)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create topup request", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, result)
}

func (h *WalletHandler) ListMyTopupRequests(c *gin.Context) {
	list, err := h.svc.ListMyTopupRequests(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *WalletHandler) ListAllTopupRequests(c *gin.Context) {
	list, err := h.svc.ListAllTopupRequests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *WalletHandler) ApproveTopup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	if err := h.svc.ApproveTopup(c.Request.Context(), id, c.GetUint64("user_id")); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "request not found", "code": "NOT_FOUND"})
			return
		}
		if err.Error() == "request is not pending" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "code": "CONFLICT"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to approve request", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "topup approved"})
}

func (h *WalletHandler) RejectTopup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}
	if err := h.svc.RejectTopup(c.Request.Context(), id, c.GetUint64("user_id")); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "request not found", "code": "NOT_FOUND"})
			return
		}
		if err.Error() == "request is not pending" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "code": "CONFLICT"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to reject request", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "topup rejected"})
}
