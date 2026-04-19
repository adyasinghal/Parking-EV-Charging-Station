package models

import "time"

type User struct {
	UserID       uint64    `db:"user_id" json:"user_id"`
	FullName     string    `db:"full_name" json:"full_name"`
	Email        string    `db:"email" json:"email"`
	Phone        *string   `db:"phone" json:"phone,omitempty"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Role         string    `db:"role" json:"role"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type CreateUserRequest struct {
	FullName string  `json:"full_name" binding:"required,min=2,max=120"`
	Email    string  `json:"email" binding:"required,email"`
	Phone    *string `json:"phone"`
	Password string  `json:"password" binding:"required,min=8"`
	Role     string  `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateMeRequest allows partial updates for profile fields.
type UpdateMeRequest struct {
	FullName *string `json:"full_name" binding:"omitempty,min=2,max=120"`
	Phone    *string `json:"phone"`
}

type TokenResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
