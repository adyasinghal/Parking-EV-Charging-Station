package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"

	"voltpark/internal/models"
	"voltpark/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	res, err := h.svc.Register(c.Request.Context(), req)
	if err != nil {
		if isDuplicateEntryError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "email already exists", "code": "EMAIL_EXISTS"})
			return
		}
		if err.Error() == "invalid role" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register user", "code": "INTERNAL_ERROR"})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	res, err := h.svc.Login(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "invalid credentials" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error(), "code": "INVALID_CREDENTIALS"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to authenticate", "code": "INTERNAL_ERROR"})
		return
	}

	c.JSON(http.StatusOK, res)
}

func isDuplicateEntryError(err error) bool {
	var mysqlErr *mysql.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1062
}
