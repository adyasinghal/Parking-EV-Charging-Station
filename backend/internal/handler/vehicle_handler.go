package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"

	"voltpark/internal/models"
	"voltpark/internal/service"
)

type VehicleHandler struct {
	svc *service.VehicleService
}

func NewVehicleHandler(svc *service.VehicleService) *VehicleHandler {
	return &VehicleHandler{svc: svc}
}

func (h *VehicleHandler) List(c *gin.Context) {
	list, err := h.svc.ListByUser(c.Request.Context(), c.GetUint64("user_id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch vehicles", "code": "INTERNAL_ERROR"})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *VehicleHandler) Create(c *gin.Context) {
	var req models.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	vehicle, err := h.svc.Create(c.Request.Context(), c.GetUint64("user_id"), req)
	if err != nil {
		if isVehicleDuplicateErr(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "license plate already exists", "code": "LICENSE_PLATE_EXISTS"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to create vehicle", "code": "CREATE_FAILED"})
		return
	}
	c.JSON(http.StatusCreated, vehicle)
}

func (h *VehicleHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	var req models.UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "code": "VALIDATION_ERROR"})
		return
	}

	vehicle, err := h.svc.Update(c.Request.Context(), c.GetUint64("user_id"), id, req)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found", "code": "NOT_FOUND"})
			return
		}
		if isVehicleDuplicateErr(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "license plate already exists", "code": "LICENSE_PLATE_EXISTS"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to update vehicle", "code": "UPDATE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, vehicle)
}

func (h *VehicleHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id", "code": "VALIDATION_ERROR"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), c.GetUint64("user_id"), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "vehicle not found", "code": "NOT_FOUND"})
			return
		}
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "failed to delete vehicle", "code": "DELETE_FAILED"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "vehicle deleted"})
}

func isVehicleDuplicateErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1062
}
