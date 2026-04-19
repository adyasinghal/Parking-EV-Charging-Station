#!/usr/bin/env bash
set -euo pipefail

# Smoke-check required programmable DB objects for procedure mode.

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-voltpark}"
DB_PASSWORD="${DB_PASSWORD:-voltpark_secret}"
DB_NAME="${DB_NAME:-voltpark}"

if ! command -v mysql >/dev/null 2>&1; then
  echo "[FAIL] mysql client is not installed."
  exit 1
fi

MYSQL_CMD=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "-p$DB_PASSWORD" -D "$DB_NAME" -N -s)

query_count() {
  local query="$1"
  "${MYSQL_CMD[@]}" -e "$query"
}

assert_exists() {
  local object_type="$1"
  local object_name="$2"
  local count

  count="$(query_count "SELECT COUNT(1) FROM information_schema.routines WHERE routine_schema = '$DB_NAME' AND routine_type = '$object_type' AND routine_name = '$object_name';")"
  if [[ "$count" != "1" ]]; then
    echo "[FAIL] Missing $object_type: $object_name"
    exit 1
  fi
  echo "[OK]   $object_type: $object_name"
}

assert_trigger_exists() {
  local trigger_name="$1"
  local count

  count="$(query_count "SELECT COUNT(1) FROM information_schema.triggers WHERE trigger_schema = '$DB_NAME' AND trigger_name = '$trigger_name';")"
  if [[ "$count" != "1" ]]; then
    echo "[FAIL] Missing TRIGGER: $trigger_name"
    exit 1
  fi
  echo "[OK]   TRIGGER: $trigger_name"
}

assert_view_exists() {
  local view_name="$1"
  local count

  count="$(query_count "SELECT COUNT(1) FROM information_schema.views WHERE table_schema = '$DB_NAME' AND table_name = '$view_name';")"
  if [[ "$count" != "1" ]]; then
    echo "[FAIL] Missing VIEW: $view_name"
    exit 1
  fi
  echo "[OK]   VIEW: $view_name"
}

echo "Running migration smoke checks against $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Procedures
assert_exists PROCEDURE sp_make_reservation
assert_exists PROCEDURE sp_end_charging_session
assert_exists PROCEDURE sp_top_up_wallet
assert_exists PROCEDURE sp_cancel_reservation
assert_exists PROCEDURE sp_charger_utilization
assert_exists PROCEDURE sp_maintenance_risk_alerts
assert_exists PROCEDURE sp_hourly_demand_heatmap

# Functions
assert_exists FUNCTION calculate_session_cost
assert_exists FUNCTION get_user_total_spend
assert_exists FUNCTION is_spot_available

# Triggers
assert_trigger_exists trg_wallet_overdraft
assert_trigger_exists trg_session_start
assert_trigger_exists trg_charger_alert
assert_trigger_exists trg_create_wallet

# Views
assert_view_exists vw_high_traffic_zones
assert_view_exists vw_charger_efficiency

echo "[PASS] Migration smoke checks succeeded."

