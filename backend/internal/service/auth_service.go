package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"voltpark/internal/models"
	"voltpark/internal/repository"
)

type AuthService struct {
	userRepo      *repository.UserRepo
	jwtSecret     string
	jwtTTLInHours int
}

func NewAuthService(userRepo *repository.UserRepo, secret string, jwtTTLInHours int) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: secret, jwtTTLInHours: jwtTTLInHours}
}

func (s *AuthService) Register(ctx context.Context, req models.CreateUserRequest) (*models.TokenResponse, error) {
	if req.Role == "" {
		req.Role = models.RoleDriver
	}
	if _, ok := models.AllowedRoles[req.Role]; !ok {
		return nil, errors.New("invalid role")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user, err := s.userRepo.Create(ctx, req, string(hash))
	if err != nil {
		return nil, err
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.TokenResponse{Token: token, User: *user}, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.TokenResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.TokenResponse{Token: token, User: *user}, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	expiresAt := time.Now().Add(time.Duration(s.jwtTTLInHours) * time.Hour)
	claims := jwt.MapClaims{
		"sub":  user.UserID,
		"role": user.Role,
		"exp":  expiresAt.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
