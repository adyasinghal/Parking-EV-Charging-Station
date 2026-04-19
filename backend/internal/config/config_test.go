package config

import "testing"

func TestLoadUsesEnvOverrides(t *testing.T) {
	t.Setenv("DB_HOST", "db-host")
	t.Setenv("DB_PORT", "4406")
	t.Setenv("DB_USER", "db-user")
	t.Setenv("DB_PASSWORD", "db-pass")
	t.Setenv("DB_NAME", "db-name")
	t.Setenv("JWT_SECRET", "jwt-secret")
	t.Setenv("JWT_TOKEN_TTL_HOURS", "72")
	t.Setenv("USE_DB_PROCEDURES", "true")
	t.Setenv("PORT", "9090")
	t.Setenv("APP_ENV", "test")

	cfg := Load()

	if cfg.DBHost != "db-host" {
		t.Fatalf("expected DBHost override")
	}
	if cfg.DBPort != "4406" {
		t.Fatalf("expected DBPort override")
	}
	if cfg.DBUser != "db-user" {
		t.Fatalf("expected DBUser override")
	}
	if cfg.DBPassword != "db-pass" {
		t.Fatalf("expected DBPassword override")
	}
	if cfg.DBName != "db-name" {
		t.Fatalf("expected DBName override")
	}
	if cfg.JWTSecret != "jwt-secret" {
		t.Fatalf("expected JWTSecret override")
	}
	if cfg.JWTTokenTTLHours != 72 {
		t.Fatalf("expected JWTTokenTTLHours=72")
	}
	if !cfg.UseDBProcedures {
		t.Fatalf("expected UseDBProcedures=true")
	}
	if cfg.Port != "9090" {
		t.Fatalf("expected Port override")
	}
	if cfg.Env != "test" {
		t.Fatalf("expected Env override")
	}
}

func TestGetEnvAsBoolFallback(t *testing.T) {
	t.Setenv("BOOL_KEY", "invalid")
	if got := getEnvAsBool("BOOL_KEY", true); !got {
		t.Fatalf("expected fallback true for invalid bool")
	}
}
