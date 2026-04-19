DROP VIEW IF EXISTS vw_charger_efficiency;
DROP VIEW IF EXISTS vw_high_traffic_zones;

DROP TRIGGER IF EXISTS trg_create_wallet;
DROP TRIGGER IF EXISTS trg_charger_alert;
DROP TRIGGER IF EXISTS trg_session_start;
DROP TRIGGER IF EXISTS trg_wallet_overdraft;

DROP FUNCTION IF EXISTS is_spot_available;
DROP FUNCTION IF EXISTS get_user_total_spend;
DROP FUNCTION IF EXISTS calculate_session_cost;

DROP PROCEDURE IF EXISTS sp_hourly_demand_heatmap;
DROP PROCEDURE IF EXISTS sp_maintenance_risk_alerts;
DROP PROCEDURE IF EXISTS sp_charger_utilization;
DROP PROCEDURE IF EXISTS sp_cancel_reservation;
DROP PROCEDURE IF EXISTS sp_top_up_wallet;
DROP PROCEDURE IF EXISTS sp_end_charging_session;
DROP PROCEDURE IF EXISTS sp_make_reservation;

