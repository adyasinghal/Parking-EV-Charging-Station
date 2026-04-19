package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"voltpark/internal/repository"
)

type SSEHandler struct {
	repo *repository.SSERepo
}

func NewSSEHandler(repo *repository.SSERepo) *SSEHandler {
	return &SSEHandler{repo: repo}
}

func (h *SSEHandler) SpotStream(c *gin.Context) {
	zoneID, err := strconv.ParseUint(c.Param("zone_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid zone id", "code": "VALIDATION_ERROR"})
		return
	}

	streamSSE(c, func() (any, error) {
		return h.repo.SpotStatusesByZone(c.Request.Context(), zoneID)
	})
}

func (h *SSEHandler) ChargerStream(c *gin.Context) {
	streamSSE(c, func() (any, error) {
		return h.repo.ChargerStatuses(c.Request.Context())
	})
}

func streamSSE(c *gin.Context, loader func() (any, error)) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "stream unsupported", "code": "INTERNAL_ERROR"})
		return
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case <-ticker.C:
			payload, err := loader()
			if err != nil {
				continue
			}
			data, err := json.Marshal(payload)
			if err != nil {
				continue
			}
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}
