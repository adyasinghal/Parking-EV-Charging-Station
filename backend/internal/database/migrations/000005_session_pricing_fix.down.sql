-- Revert session pricing behavior to the original implementation.

DROP PROCEDURE IF EXISTS sp_end_charging_session;
DROP FUNCTION IF EXISTS calculate_session_cost;

DELIMITER $$

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

DELIMITER ;

