package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	JWTSecret        string
	JWTTokenTTLHours int
	UseDBProcedures  bool
	Port             string
	Env              string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	return &Config{
		DBHost:           getEnv("DB_HOST", "localhost"),
		DBPort:           getEnv("DB_PORT", "3306"),
		DBUser:           getEnv("DB_USER", "voltpark"),
		DBPassword:       getEnv("DB_PASSWORD", "voltpark_secret"),
		DBName:           getEnv("DB_NAME", "voltpark"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
		JWTTokenTTLHours: getEnvAsInt("JWT_TOKEN_TTL_HOURS", 24),
		UseDBProcedures:  getEnvAsBool("USE_DB_PROCEDURES", false),
		Port:             getEnv("PORT", "8080"),
		Env:              getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func getEnvAsBool(key string, fallback bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	switch v {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}
