package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"voltpark/internal/repository"
)

type PublicHandler struct {
	repo *repository.PublicRepo
}

func NewPublicHandler(repo *repository.PublicRepo) *PublicHandler {
	return &PublicHandler{repo: repo}
}

func (h *PublicHandler) Stats(c *gin.Context) {
	stats, err := h.repo.Stats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *PublicHandler) Zones(c *gin.Context) {
	zones, err := h.repo.Zones(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch zones", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, zones)
}
