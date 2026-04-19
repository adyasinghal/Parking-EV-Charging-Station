-- Make session pricing rules fully enforceable at session end.

DROP PROCEDURE IF EXISTS sp_end_charging_session;
DROP FUNCTION IF EXISTS calculate_session_cost;

DELIMITER $$

CREATE FUNCTION calculate_session_cost(
    p_session_id BIGINT UNSIGNED,
    p_pricing_time DATETIME
)
RETURNS DECIMAL(12, 2)
READS SQL DATA
BEGIN
    DECLARE v_zone_id BIGINT UNSIGNED;
    DECLARE v_kwh DECIMAL(10, 4) DEFAULT 0.0000;
    DECLARE v_duration_hours DECIMAL(10, 4) DEFAULT 0.0000;
    DECLARE v_event_time TIME;
    DECLARE v_event_date DATE;

    DECLARE v_base_rate DECIMAL(8, 4) DEFAULT 0.0000;
    DECLARE v_peak_multiplier DECIMAL(4, 2) DEFAULT 1.00;
    DECLARE v_energy_rate DECIMAL(8, 4) DEFAULT 0.0000;

    DECLARE v_cost DECIMAL(12, 2) DEFAULT 0.00;

    SET v_event_time = TIME(p_pricing_time);
    SET v_event_date = DATE(p_pricing_time);

    SELECT
        ps.zone_id,
        COALESCE(cs.kwh_consumed, 0),
        COALESCE(TIMESTAMPDIFF(SECOND, cs.plug_in_time, COALESCE(cs.plug_out_time, p_pricing_time)), 0) / 3600
      INTO v_zone_id, v_kwh, v_duration_hours
      FROM Charging_Sessions cs
      JOIN EV_Chargers ec ON ec.charger_id = cs.charger_id
      JOIN Parking_Spots ps ON ps.spot_id = ec.spot_id
     WHERE cs.session_id = p_session_id
     LIMIT 1;

    SELECT
        COALESCE(pr.base_rate_per_hr, 0),
        COALESCE(pr.peak_multiplier, 1.00),
        COALESCE(pr.energy_rate_kwh, 0)
      INTO v_base_rate, v_peak_multiplier, v_energy_rate
      FROM Pricing_Rules pr
     WHERE pr.zone_id = v_zone_id
       AND pr.effective_from <= v_event_date
       AND (pr.effective_until IS NULL OR pr.effective_until >= v_event_date)
       AND (
            (
                pr.is_peak = TRUE
                AND pr.peak_start_time IS NOT NULL
                AND pr.peak_end_time IS NOT NULL
                AND (
                    (pr.peak_start_time <= pr.peak_end_time AND v_event_time >= pr.peak_start_time AND v_event_time < pr.peak_end_time)
                    OR
                    (pr.peak_start_time > pr.peak_end_time AND (v_event_time >= pr.peak_start_time OR v_event_time < pr.peak_end_time))
                )
            )
            OR pr.is_peak = FALSE
       )
     ORDER BY
        CASE WHEN pr.is_peak = TRUE THEN 0 ELSE 1 END,
        pr.effective_from DESC,
        pr.rule_id DESC
     LIMIT 1;

    SET v_cost = ROUND((v_kwh * v_energy_rate) + (v_duration_hours * v_base_rate * v_peak_multiplier), 2);
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

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_plug_out_time IS NULL THEN
        SET p_plug_out_time = NOW();
    END IF;

    START TRANSACTION;

    SELECT cs.vehicle_id, cs.reservation_id, cs.charger_id, cs.kwh_start
      INTO v_vehicle_id, v_reservation_id, v_charger_id, v_kwh_start
      FROM Charging_Sessions cs
     WHERE cs.session_id = p_session_id
       AND cs.status = 'Active'
     FOR UPDATE;

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

    SET v_cost = calculate_session_cost(p_session_id, p_plug_out_time);

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

    COMMIT;

    SELECT 'OK' AS result, v_cost AS total_cost;
END$$

DELIMITER ;

