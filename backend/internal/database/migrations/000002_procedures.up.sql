-- Phase 3.1 DB programmable objects for VoltPark.
-- This migration creates all required procedures, functions, triggers, and views.

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

DELIMITER $$

CREATE FUNCTION is_spot_available(
    p_spot_id BIGINT UNSIGNED,
    p_start_time DATETIME,
    p_end_time DATETIME
)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_conflicts INT DEFAULT 0;

    SELECT COUNT(1)
      INTO v_conflicts
      FROM Reservations r
     WHERE r.spot_id = p_spot_id
       AND r.status = 'Confirmed'
       AND NOT (p_start_time >= r.end_time OR p_end_time <= r.start_time);

    RETURN v_conflicts = 0;
END$$

CREATE FUNCTION get_user_total_spend(
    p_user_id BIGINT UNSIGNED
)
RETURNS DECIMAL(14, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(14, 2) DEFAULT 0.00;

    SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0.00)
      INTO v_total
      FROM Billing_Records
     WHERE user_id = p_user_id
       AND billing_type IN ('Parking_Fee', 'Energy_Fee', 'Combined');

    RETURN v_total;
END$$

CREATE FUNCTION calculate_session_cost(
    p_session_id BIGINT UNSIGNED
)
RETURNS DECIMAL(12, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_zone_id BIGINT UNSIGNED;
    DECLARE v_kwh DECIMAL(10, 4) DEFAULT 0.0000;
    DECLARE v_energy_rate DECIMAL(8, 4) DEFAULT 0.0000;
    DECLARE v_cost DECIMAL(12, 2) DEFAULT 0.00;

    SELECT ps.zone_id, COALESCE(cs.kwh_consumed, 0)
      INTO v_zone_id, v_kwh
      FROM Charging_Sessions cs
      JOIN EV_Chargers ec ON ec.charger_id = cs.charger_id
      JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
     WHERE cs.session_id = p_session_id
     LIMIT 1;

    SELECT COALESCE(pr.energy_rate_kwh, 0)
      INTO v_energy_rate
      FROM Pricing_Rules pr
     WHERE pr.zone_id = v_zone_id
       AND pr.effective_from <= CURRENT_DATE
       AND (pr.effective_until IS NULL OR pr.effective_until >= CURRENT_DATE)
     ORDER BY pr.effective_from DESC, pr.rule_id DESC
     LIMIT 1;

    SET v_cost = ROUND(v_kwh * v_energy_rate, 2);
    RETURN v_cost;
END$$

CREATE PROCEDURE sp_make_reservation(
    IN p_spot_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_vehicle_id BIGINT UNSIGNED,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME
)
BEGIN
    DECLARE v_wallet_balance DECIMAL(12, 2) DEFAULT 0.00;
    DECLARE v_reservation_id BIGINT UNSIGNED;

    IF p_end_time <= p_start_time THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid time range';
    END IF;

    IF is_spot_available(p_spot_id, p_start_time, p_end_time) = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Spot unavailable for requested time window';
    END IF;

    SELECT COALESCE(w.balance, 0)
      INTO v_wallet_balance
      FROM Wallets w
     WHERE w.user_id = p_user_id
     LIMIT 1;

    IF v_wallet_balance < 50.00 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance';
    END IF;

    INSERT INTO Reservations (
        spot_id, user_id, vehicle_id, start_time, end_time, status
    ) VALUES (
        p_spot_id, p_user_id, p_vehicle_id, p_start_time, p_end_time, 'Confirmed'
    );

    SET v_reservation_id = LAST_INSERT_ID();

    UPDATE Parking_Spots
       SET status = 'Reserved'
     WHERE spot_id = p_spot_id;

    SELECT 'OK' AS result, v_reservation_id AS reservation_id;
END$$

CREATE PROCEDURE sp_cancel_reservation(
    IN p_reservation_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE v_spot_id BIGINT UNSIGNED;
    DECLARE v_owner_id BIGINT UNSIGNED;
    DECLARE v_status VARCHAR(20);

    SELECT r.spot_id, r.user_id, r.status
      INTO v_spot_id, v_owner_id, v_status
      FROM Reservations r
     WHERE r.reservation_id = p_reservation_id
     LIMIT 1;

    IF v_owner_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reservation not found';
    END IF;

    IF v_owner_id <> p_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forbidden reservation access';
    END IF;

    IF v_status <> 'Confirmed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only confirmed reservations can be cancelled';
    END IF;

    UPDATE Reservations
       SET status = 'Cancelled'
     WHERE reservation_id = p_reservation_id;

    UPDATE Parking_Spots
       SET status = 'Available'
     WHERE spot_id = v_spot_id;

    SELECT 'OK' AS result, p_reservation_id AS reservation_id;
END$$

CREATE PROCEDURE sp_top_up_wallet(
    IN p_user_id BIGINT UNSIGNED,
    IN p_amount DECIMAL(12, 2)
)
BEGIN
    DECLARE v_balance DECIMAL(12, 2);

    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Top-up amount must be greater than zero';
    END IF;

    INSERT IGNORE INTO Wallets (user_id, balance, currency)
    VALUES (p_user_id, 0.00, 'INR');

    UPDATE Wallets
       SET balance = balance + p_amount
     WHERE user_id = p_user_id;

    INSERT INTO Billing_Records (user_id, billing_type, amount, description)
    VALUES (p_user_id, 'Top_Up', p_amount, 'Wallet top-up');

    SELECT balance
      INTO v_balance
      FROM Wallets
     WHERE user_id = p_user_id
     LIMIT 1;

    SELECT 'OK' AS result, v_balance AS balance;
END$$

CREATE PROCEDURE sp_end_charging_session(
    IN p_session_id BIGINT UNSIGNED,
    IN p_kwh_end DECIMAL(10, 4),
    IN p_plug_out_time DATETIME
)
BEGIN
    DECLARE v_vehicle_id BIGINT UNSIGNED;
    DECLARE v_reservation_id BIGINT UNSIGNED;
    DECLARE v_charger_id BIGINT UNSIGNED;
    DECLARE v_kwh_start DECIMAL(10, 4);
    DECLARE v_user_id BIGINT UNSIGNED;
    DECLARE v_cost DECIMAL(12, 2);

    SELECT cs.vehicle_id, cs.reservation_id, cs.charger_id, cs.kwh_start
      INTO v_vehicle_id, v_reservation_id, v_charger_id, v_kwh_start
      FROM Charging_Sessions cs
     WHERE cs.session_id = p_session_id
       AND cs.status = 'Active'
     LIMIT 1;

    IF v_vehicle_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active session not found';
    END IF;

    IF p_kwh_end <= v_kwh_start THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'kWh end must be greater than kWh start';
    END IF;

    UPDATE Charging_Sessions
       SET kwh_end = p_kwh_end,
           plug_out_time = p_plug_out_time,
           status = 'Complete'
     WHERE session_id = p_session_id;

    SET v_cost = calculate_session_cost(p_session_id);

    UPDATE Charging_Sessions
       SET total_cost = v_cost
     WHERE session_id = p_session_id;

    SELECT v.user_id
      INTO v_user_id
      FROM Vehicles v
     WHERE v.vehicle_id = v_vehicle_id
     LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        INSERT IGNORE INTO Wallets (user_id, balance, currency)
        VALUES (v_user_id, 0.00, 'INR');

        UPDATE Wallets
           SET balance = balance - v_cost
         WHERE user_id = v_user_id;

        INSERT INTO Billing_Records (
            user_id, session_id, reservation_id, billing_type, amount, description
        ) VALUES (
            v_user_id, p_session_id, v_reservation_id, 'Energy_Fee', v_cost, 'Charging session fee'
        );
    END IF;

    UPDATE EV_Chargers
       SET status = 'Available'
     WHERE charger_id = v_charger_id;

    SELECT 'OK' AS result, v_cost AS total_cost;
END$$

CREATE PROCEDURE sp_charger_utilization(
    IN p_from DATETIME,
    IN p_to DATETIME
)
BEGIN
    SELECT
        ec.charger_id,
        ec.charger_code,
        COUNT(cs.session_id) AS total_sessions,
        ROUND(SUM(TIMESTAMPDIFF(MINUTE, cs.plug_in_time, COALESCE(cs.plug_out_time, NOW()))) / 60, 2) AS usage_hours,
        ROUND(
            SUM(TIMESTAMPDIFF(SECOND, cs.plug_in_time, COALESCE(cs.plug_out_time, NOW()))) /
            NULLIF(TIMESTAMPDIFF(SECOND, p_from, p_to), 0) * 100,
            2
        ) AS utilization_pct
    FROM EV_Chargers ec
    LEFT JOIN Charging_Sessions cs
           ON cs.charger_id = ec.charger_id
          AND cs.plug_in_time >= p_from
          AND cs.plug_in_time < p_to
    GROUP BY ec.charger_id, ec.charger_code
    ORDER BY utilization_pct DESC;
END$$

CREATE PROCEDURE sp_maintenance_risk_alerts()
BEGIN
    SELECT
        ec.charger_id,
        ec.charger_code,
        COUNT(cel.error_id) AS errors_last_24h
    FROM EV_Chargers ec
    JOIN Charger_Error_Log cel ON cel.charger_id = ec.charger_id
    WHERE cel.logged_at >= NOW() - INTERVAL 24 HOUR
    GROUP BY ec.charger_id, ec.charger_code
    HAVING COUNT(cel.error_id) >= 3
    ORDER BY errors_last_24h DESC;
END$$

CREATE PROCEDURE sp_hourly_demand_heatmap(
    IN p_from DATETIME,
    IN p_to DATETIME
)
BEGIN
    SELECT
        LPAD(HOUR(cs.plug_in_time), 2, '0') AS hour_of_day,
        CONCAT(LPAD(HOUR(cs.plug_in_time), 2, '0'), ':00-', LPAD(HOUR(cs.plug_in_time), 2, '0'), ':59') AS time_window,
        COUNT(cs.session_id) AS sessions_started
    FROM Charging_Sessions cs
    WHERE cs.plug_in_time >= p_from
      AND cs.plug_in_time < p_to
    GROUP BY HOUR(cs.plug_in_time)
    ORDER BY HOUR(cs.plug_in_time);
END$$

CREATE TRIGGER trg_wallet_overdraft
BEFORE UPDATE ON Wallets
FOR EACH ROW
BEGIN
    IF NEW.balance < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wallet overdraft not allowed';
    END IF;
END$$

CREATE TRIGGER trg_session_start
AFTER INSERT ON Charging_Sessions
FOR EACH ROW
BEGIN
    DECLARE v_spot_id BIGINT UNSIGNED;

    UPDATE EV_Chargers
       SET status = 'In_Use'
     WHERE charger_id = NEW.charger_id;

    SELECT ec.spot_id
      INTO v_spot_id
      FROM EV_Chargers ec
     WHERE ec.charger_id = NEW.charger_id
     LIMIT 1;

    IF v_spot_id IS NOT NULL THEN
        UPDATE Parking_Spots
           SET status = 'Occupied'
         WHERE spot_id = v_spot_id;
    END IF;
END$$

CREATE TRIGGER trg_charger_alert
AFTER INSERT ON Charger_Error_Log
FOR EACH ROW
BEGIN
    DECLARE v_err_count INT DEFAULT 0;

    SELECT COUNT(1)
      INTO v_err_count
      FROM Charger_Error_Log
     WHERE charger_id = NEW.charger_id
       AND logged_at >= NOW() - INTERVAL 24 HOUR;

    IF v_err_count >= 3 THEN
        INSERT INTO Maintenance_Alerts (charger_id, reason)
        VALUES (NEW.charger_id, 'Auto-alert: 3 or more charger errors within 24 hours');

        UPDATE EV_Chargers
           SET status = 'Under_Maintenance'
         WHERE charger_id = NEW.charger_id;
    END IF;
END$$

CREATE TRIGGER trg_create_wallet
AFTER INSERT ON Users
FOR EACH ROW
BEGIN
    INSERT IGNORE INTO Wallets (user_id, balance, currency)
    VALUES (NEW.user_id, 0.00, 'INR');
END$$

CREATE VIEW vw_high_traffic_zones AS
SELECT
    pz.zone_id,
    pz.zone_name,
    pz.city,
    COUNT(cs.session_id) AS total_sessions,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, cs.plug_in_time, COALESCE(cs.plug_out_time, NOW()))) / 60, 2) AS avg_session_hrs,
    ROUND(COALESCE(SUM(cs.kwh_consumed), 0), 4) AS total_kwh_delivered,
    ROUND(COALESCE(SUM(cs.total_cost), 0), 2) AS total_revenue
FROM Parking_Zones pz
LEFT JOIN Parking_Spots ps ON ps.zone_id = pz.zone_id
LEFT JOIN EV_Chargers ec ON ec.spot_id = ps.spot_id
LEFT JOIN Charging_Sessions cs ON cs.charger_id = ec.charger_id
GROUP BY pz.zone_id, pz.zone_name, pz.city$$

CREATE VIEW vw_charger_efficiency AS
SELECT
    ec.charger_id,
    ec.charger_code,
    ec.charger_type,
    ec.power_kw,
    ec.status,
    COUNT(cs.session_id) AS total_sessions,
    ROUND(AVG(cs.kwh_consumed), 4) AS avg_kwh_per_session,
    COUNT(cel.error_id) AS total_errors,
    COUNT(ma.alert_id) AS maintenance_count,
    ROUND(COUNT(cel.error_id) / NULLIF(COUNT(cs.session_id), 0) * 100, 2) AS error_rate_pct
FROM EV_Chargers ec
LEFT JOIN Charging_Sessions cs ON cs.charger_id = ec.charger_id
LEFT JOIN Charger_Error_Log cel ON cel.charger_id = ec.charger_id
LEFT JOIN Maintenance_Alerts ma ON ma.charger_id = ec.charger_id
GROUP BY ec.charger_id, ec.charger_code, ec.charger_type, ec.power_kw, ec.status$$

DELIMITER ;
