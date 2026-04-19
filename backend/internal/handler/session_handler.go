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

type SessionHandler struct {
	svc *service.SessionService
}

func NewSessionHandler(svc *service.SessionService) *SessionHandler {
	return &SessionHandler{svc: svc}
}

func (h *SessionHandler) Start(c *gin.Context) {
	var req models.StartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	session, err := h.svc.Start(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to start session", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, session)
}

func (h *SessionHandler) End(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	var req models.EndSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	cost, err := h.svc.End(c.Request.Context(), id, c.GetUint64("user_id"), c.GetString("role"), req)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrInvalidKwhEnd):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		case errors.Is(err, sql.ErrNoRows):
			c.JSON(http.StatusNotFound, gin.H{"error": "session not found", "code": "NOT_FOUND"})
		case errors.Is(err, models.ErrForbiddenResource):
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "code": "FORBIDDEN"})
		default:
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to end session", "code": "END_FAILED"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session ended", "total_cost": cost})
}

func (h *SessionHandler) Active(c *gin.Context) {
	session, err := h.svc.GetActive(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "active session not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch active session", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *SessionHandler) ListMine(c *gin.Context) {
	list, err := h.svc.ListByUser(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sessions", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *SessionHandler) ListAll(c *gin.Context) {
	list, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sessions", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}
