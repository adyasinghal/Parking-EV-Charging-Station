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

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) GetMe(c *gin.Context) {
	user, err := h.svc.GetMe(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		handleLookupError(c, err, "user")
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	var req models.UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	user, err := h.svc.UpdateMe(c.Request.Context(), c.GetUint64("user_id"), req)
	if err != nil {
		handleLookupError(c, err, "user")
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) List(c *gin.Context) {
	users, err := h.svc.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list users", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	user, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		handleLookupError(c, err, "user")
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	if err := h.svc.DeleteByID(c.Request.Context(), id); err != nil {
		handleLookupError(c, err, "user")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}

func handleLookupError(c *gin.Context, err error, resource string) {
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": resource + " not found", "code": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "request failed", "code": "INTERNAL_ERROR"})
}
