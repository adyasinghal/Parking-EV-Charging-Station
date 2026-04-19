CREATE DATABASE IF NOT EXISTS voltpark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voltpark;

CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Driver',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('Driver', 'Admin', 'Operator'))
);

CREATE TABLE IF NOT EXISTS Wallets (
    wallet_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS Vehicles (
    vehicle_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(60),
    model VARCHAR(60),
    year SMALLINT,
    is_ev BOOLEAN NOT NULL DEFAULT FALSE,
    battery_kw DECIMAL(6, 2),
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CHECK (year BETWEEN 1990 AND 2100)
);

CREATE TABLE IF NOT EXISTS Parking_Zones (
    zone_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    address TEXT,
    total_spots SMALLINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (total_spots > 0)
);

CREATE TABLE IF NOT EXISTS Parking_Spots (
    spot_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_id BIGINT UNSIGNED NOT NULL,
    spot_code VARCHAR(20) NOT NULL,
    floor_level SMALLINT DEFAULT 0,
    type VARCHAR(20) NOT NULL DEFAULT 'Standard',
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT fk_spot_zone FOREIGN KEY (zone_id) REFERENCES Parking_Zones(zone_id) ON DELETE RESTRICT,
    CONSTRAINT uq_zone_spot UNIQUE (zone_id, spot_code),
    CHECK (type IN ('Standard', 'EV_Enabled', 'Handicapped', 'Compact', 'Oversized')),
    CHECK (status IN ('Available', 'Occupied', 'Reserved', 'Under_Maintenance'))
);

CREATE TABLE IF NOT EXISTS EV_Chargers (
    charger_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    spot_id BIGINT UNSIGNED NOT NULL UNIQUE,
    charger_code VARCHAR(30) NOT NULL UNIQUE,
    charger_type VARCHAR(20) NOT NULL,
    power_kw DECIMAL(6, 2) NOT NULL,
    connector_type VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    installed_at DATE,
    CONSTRAINT fk_charger_spot FOREIGN KEY (spot_id) REFERENCES Parking_Spots(spot_id) ON DELETE RESTRICT,
    CHECK (power_kw > 0),
    CHECK (charger_type IN ('Level1_AC', 'Level2_AC', 'DC_Fast', 'Ultra_Fast')),
    CHECK (status IN ('Available', 'In_Use', 'Faulted', 'Under_Maintenance', 'Offline'))
);

CREATE TABLE IF NOT EXISTS Pricing_Rules (
    rule_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    zone_id BIGINT UNSIGNED NOT NULL,
    rule_name VARCHAR(80),
    is_peak BOOLEAN NOT NULL DEFAULT FALSE,
    peak_start_time TIME,
    peak_end_time TIME,
    base_rate_per_hr DECIMAL(8, 4) NOT NULL,
    peak_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    energy_rate_kwh DECIMAL(8, 4) DEFAULT 0.00,
    effective_from DATE NOT NULL DEFAULT (CURRENT_DATE),
    effective_until DATE,
    CONSTRAINT fk_pricing_zone FOREIGN KEY (zone_id) REFERENCES Parking_Zones(zone_id) ON DELETE CASCADE,
    CHECK (base_rate_per_hr >= 0),
    CHECK (peak_multiplier >= 1.00)
);

CREATE TABLE IF NOT EXISTS Reservations (
    reservation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    spot_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_spot FOREIGN KEY (spot_id) REFERENCES Parking_Spots(spot_id) ON DELETE RESTRICT,
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_res_vehicle FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE SET NULL,
    CHECK (status IN ('Confirmed', 'Cancelled', 'Completed', 'No_Show')),
    CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS Charging_Sessions (
    session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    charger_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    reservation_id BIGINT UNSIGNED,
    plug_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    plug_out_time TIMESTAMP,
    kwh_start DECIMAL(10, 4) NOT NULL DEFAULT 0,
    kwh_end DECIMAL(10, 4),
    kwh_consumed DECIMAL(10, 4) GENERATED ALWAYS AS (kwh_end - kwh_start) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    total_cost DECIMAL(12, 2),
    notes TEXT,
    CONSTRAINT fk_session_charger FOREIGN KEY (charger_id) REFERENCES EV_Chargers(charger_id) ON DELETE RESTRICT,
    CONSTRAINT fk_session_vehicle FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE RESTRICT,
    CONSTRAINT fk_session_reservation FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id) ON DELETE SET NULL,
    CHECK (status IN ('Active', 'Complete', 'Interrupted'))
);

CREATE TABLE IF NOT EXISTS Billing_Records (
    billing_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    session_id BIGINT UNSIGNED,
    reservation_id BIGINT UNSIGNED,
    billing_type VARCHAR(30) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    billed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_bill_session FOREIGN KEY (session_id) REFERENCES Charging_Sessions(session_id) ON DELETE SET NULL,
    CONSTRAINT fk_bill_reservation FOREIGN KEY (reservation_id) REFERENCES Reservations(reservation_id) ON DELETE SET NULL,
    CHECK (billing_type IN ('Parking_Fee', 'Energy_Fee', 'Combined', 'Refund', 'Top_Up'))
);

CREATE TABLE IF NOT EXISTS Charger_Error_Log (
    error_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    charger_id BIGINT UNSIGNED NOT NULL,
    error_code VARCHAR(50) NOT NULL,
    error_message TEXT,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_error_charger FOREIGN KEY (charger_id) REFERENCES EV_Chargers(charger_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Maintenance_Alerts (
    alert_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    charger_id BIGINT UNSIGNED NOT NULL,
    reason TEXT NOT NULL,
    raised_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_alert_charger FOREIGN KEY (charger_id) REFERENCES EV_Chargers(charger_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reservations_spot_time ON Reservations(spot_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON Reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_charger ON Charging_Sessions(charger_id);
CREATE INDEX IF NOT EXISTS idx_sessions_vehicle ON Charging_Sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_billing_user ON Billing_Records(user_id);
CREATE INDEX IF NOT EXISTS idx_error_log_charger_time ON Charger_Error_Log(charger_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_spots_zone ON Parking_Spots(zone_id);

