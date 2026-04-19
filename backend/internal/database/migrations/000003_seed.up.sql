-- Synthetic seed data for VoltPark.
-- This dataset is deterministic and covers all tables for local functional testing.

-- 1) Users (trigger trg_create_wallet auto-creates wallets).
INSERT INTO Users (user_id, full_name, email, phone, password_hash, role, created_at) VALUES
  (1,  'Aarav Shah',        'aarav.admin@voltpark.local',   '+919900000001', '$2a$12$seed.hash.admin',    'Admin',    '2026-01-10 09:00:00'),
  (2,  'Isha Rao',          'isha.operator@voltpark.local', '+919900000002', '$2a$12$seed.hash.operator1','Operator', '2026-01-11 10:00:00'),
  (3,  'Rohan Gupta',       'rohan.operator@voltpark.local','+919900000003', '$2a$12$seed.hash.operator2','Operator', '2026-01-12 11:00:00'),
  (4,  'Neha Verma',        'neha.driver@voltpark.local',   '+919900000004', '$2a$12$seed.hash.driver1',  'Driver',   '2026-01-13 08:30:00'),
  (5,  'Kabir Mehta',       'kabir.driver@voltpark.local',  '+919900000005', '$2a$12$seed.hash.driver2',  'Driver',   '2026-01-14 09:15:00'),
  (6,  'Anaya Singh',       'anaya.driver@voltpark.local',  '+919900000006', '$2a$12$seed.hash.driver3',  'Driver',   '2026-01-15 12:05:00'),
  (7,  'Vihaan Nair',       'vihaan.driver@voltpark.local', '+919900000007', '$2a$12$seed.hash.driver4',  'Driver',   '2026-01-16 14:20:00'),
  (8,  'Mira Iyer',         'mira.driver@voltpark.local',   '+919900000008', '$2a$12$seed.hash.driver5',  'Driver',   '2026-01-17 16:40:00'),
  (9,  'Arjun Kapoor',      'arjun.driver@voltpark.local',  '+919900000009', '$2a$12$seed.hash.driver6',  'Driver',   '2026-01-18 18:10:00'),
  (10, 'Diya Menon',        'diya.driver@voltpark.local',   '+919900000010', '$2a$12$seed.hash.driver7',  'Driver',   '2026-01-19 07:45:00'),
  (11, 'Saanvi Chawla',     'saanvi.driver@voltpark.local', '+919900000011', '$2a$12$seed.hash.driver8',  'Driver',   '2026-01-20 13:25:00'),
  (12, 'Aditya Kulkarni',   'aditya.driver@voltpark.local', '+919900000012', '$2a$12$seed.hash.driver9',  'Driver',   '2026-01-21 19:00:00');

-- 2) Vehicles.
INSERT INTO Vehicles (vehicle_id, user_id, license_plate, make, model, year, is_ev, battery_kw, registered_at) VALUES
  (1, 4,  'MH01AA1001', 'Tata',      'Nexon EV',  2024, TRUE,  40.50, '2026-02-01 08:00:00'),
  (2, 4,  'MH01AA1002', 'Honda',     'City',      2021, FALSE, NULL,  '2026-02-01 08:10:00'),
  (3, 5,  'MH01AA1003', 'MG',        'ZS EV',     2023, TRUE,  50.30, '2026-02-02 09:00:00'),
  (4, 6,  'MH01AA1004', 'Hyundai',   'Kona EV',   2022, TRUE,  39.20, '2026-02-03 10:00:00'),
  (5, 6,  'MH01AA1005', 'Toyota',    'Innova',    2020, FALSE, NULL,  '2026-02-03 10:20:00'),
  (6, 7,  'MH01AA1006', 'Mahindra',  'XUV400',    2024, TRUE,  39.40, '2026-02-04 11:00:00'),
  (7, 8,  'MH01AA1007', 'Kia',       'EV6',       2025, TRUE,  77.40, '2026-02-05 12:00:00'),
  (8, 8,  'MH01AA1008', 'Suzuki',    'Baleno',    2021, FALSE, NULL,  '2026-02-05 12:20:00'),
  (9, 9,  'MH01AA1009', 'Tesla',     'Model 3',   2025, TRUE,  57.50, '2026-02-06 13:00:00'),
  (10, 10,'MH01AA1010', 'BYD',       'Atto 3',    2024, TRUE,  60.50, '2026-02-07 14:00:00'),
  (11, 10,'MH01AA1011', 'Hyundai',   'i20',       2019, FALSE, NULL,  '2026-02-07 14:10:00'),
  (12, 11,'MH01AA1012', 'Tata',      'Tiago EV',  2024, TRUE,  24.00, '2026-02-08 15:00:00'),
  (13, 11,'MH01AA1013', 'Skoda',     'Slavia',    2022, FALSE, NULL,  '2026-02-08 15:20:00'),
  (14, 12,'MH01AA1014', 'BMW',       'iX1',       2025, TRUE,  64.70, '2026-02-09 16:00:00'),
  (15, 12,'MH01AA1015', 'Volkswagen','Taigun',    2023, FALSE, NULL,  '2026-02-09 16:30:00');

-- 3) Parking zones.
INSERT INTO Parking_Zones (zone_id, zone_name, city, address, total_spots, is_active) VALUES
  (1, 'Connaught Place Central', 'Delhi',     'Inner Circle, Connaught Place, New Delhi', 6, TRUE),
  (2, 'BKC Corporate Hub',       'Mumbai',    'Bandra Kurla Complex, Mumbai',             6, TRUE),
  (3, 'MG Road Smart Parking',   'Bengaluru', 'MG Road, Bengaluru',                        6, TRUE),
  (4, 'HITEC City Podium',       'Hyderabad', 'Madhapur, Hyderabad',                       6, TRUE);

-- 4) Parking spots.
INSERT INTO Parking_Spots (spot_id, zone_id, spot_code, floor_level, type, status) VALUES
  (1, 1, 'CP-A01', 0, 'Standard',      'Available'),
  (2, 1, 'CP-A02', 0, 'EV_Enabled',    'Available'),
  (3, 1, 'CP-A03', 0, 'EV_Enabled',    'Available'),
  (4, 1, 'CP-B01', 1, 'Compact',       'Available'),
  (5, 1, 'CP-B02', 1, 'Handicapped',   'Available'),
  (6, 1, 'CP-B03', 1, 'EV_Enabled',    'Available'),
  (7, 2, 'BK-A01', 0, 'Standard',      'Available'),
  (8, 2, 'BK-A02', 0, 'EV_Enabled',    'Available'),
  (9, 2, 'BK-A03', 0, 'Compact',       'Available'),
  (10, 2, 'BK-B01', 1, 'Oversized',    'Available'),
  (11, 2, 'BK-B02', 1, 'EV_Enabled',   'Available'),
  (12, 2, 'BK-B03', 1, 'Standard',     'Available'),
  (13, 3, 'MG-A01', 0, 'Standard',     'Available'),
  (14, 3, 'MG-A02', 0, 'EV_Enabled',   'Available'),
  (15, 3, 'MG-A03', 0, 'Compact',      'Available'),
  (16, 3, 'MG-B01', 1, 'Handicapped',  'Available'),
  (17, 3, 'MG-B02', 1, 'EV_Enabled',   'Available'),
  (18, 3, 'MG-B03', 1, 'Standard',     'Available'),
  (19, 4, 'HC-A01', 0, 'EV_Enabled',   'Available'),
  (20, 4, 'HC-A02', 0, 'Compact',      'Available'),
  (21, 4, 'HC-A03', 0, 'Standard',     'Available'),
  (22, 4, 'HC-B01', 1, 'EV_Enabled',   'Available'),
  (23, 4, 'HC-B02', 1, 'Oversized',    'Available'),
  (24, 4, 'HC-B03', 1, 'EV_Enabled',   'Available');

-- 5) EV chargers.
INSERT INTO EV_Chargers (charger_id, spot_id, charger_code, charger_type, power_kw, connector_type, status, installed_at) VALUES
  (1,  2,  'CH-CP-001', 'Level2_AC', 22.00, 'Type2',  'Available',         '2025-06-01'),
  (2,  3,  'CH-CP-002', 'DC_Fast',   60.00, 'CCS2',   'Available',         '2025-06-02'),
  (3,  6,  'CH-CP-003', 'Level1_AC',  7.20, 'Type2',  'Available',         '2025-06-03'),
  (4,  8,  'CH-BK-001', 'Level2_AC', 22.00, 'Type2',  'Available',         '2025-07-01'),
  (5,  11, 'CH-BK-002', 'DC_Fast',   90.00, 'CCS2',   'Available',         '2025-07-02'),
  (6,  14, 'CH-MG-001', 'Ultra_Fast',150.0, 'CCS2',   'Available',         '2025-08-01'),
  (7,  17, 'CH-MG-002', 'Level2_AC', 30.00, 'Type2',  'Available',         '2025-08-02'),
  (8,  19, 'CH-HC-001', 'DC_Fast',   60.00, 'CCS2',   'Available',         '2025-09-01'),
  (9,  22, 'CH-HC-002', 'Level2_AC', 22.00, 'Type2',  'Available',         '2025-09-02'),
  (10, 24, 'CH-HC-003', 'Level1_AC',  7.20, 'Type2',  'Offline',           '2025-09-03');

-- 6) Pricing rules (off-peak + peak per zone).
INSERT INTO Pricing_Rules (rule_id, zone_id, rule_name, is_peak, peak_start_time, peak_end_time, base_rate_per_hr, peak_multiplier, energy_rate_kwh, effective_from, effective_until) VALUES
  (1, 1, 'CP Off-Peak', FALSE, NULL,      NULL,      45.0000, 1.00, 13.5000, '2026-01-01', NULL),
  (2, 1, 'CP Peak',     TRUE,  '09:00:00','21:00:00',55.0000, 1.30, 15.0000, '2026-01-01', NULL),
  (3, 2, 'BKC Off-Peak',FALSE, NULL,      NULL,      50.0000, 1.00, 14.0000, '2026-01-01', NULL),
  (4, 2, 'BKC Peak',    TRUE,  '08:00:00','20:00:00',62.0000, 1.25, 16.5000, '2026-01-01', NULL),
  (5, 3, 'MG Off-Peak', FALSE, NULL,      NULL,      40.0000, 1.00, 12.5000, '2026-01-01', NULL),
  (6, 3, 'MG Peak',     TRUE,  '10:00:00','22:00:00',52.0000, 1.20, 14.0000, '2026-01-01', NULL),
  (7, 4, 'HC Off-Peak', FALSE, NULL,      NULL,      38.0000, 1.00, 12.0000, '2026-01-01', NULL),
  (8, 4, 'HC Peak',     TRUE,  '09:00:00','19:00:00',48.0000, 1.20, 13.5000, '2026-01-01', NULL);

-- 7) Wallet balances (rows were auto-created by trigger on user insert).
UPDATE Wallets
SET balance = CASE user_id
  WHEN 1 THEN 5000.00
  WHEN 2 THEN 1800.00
  WHEN 3 THEN 1600.00
  WHEN 4 THEN 1250.00
  WHEN 5 THEN 980.00
  WHEN 6 THEN 740.00
  WHEN 7 THEN 2150.00
  WHEN 8 THEN 1330.00
  WHEN 9 THEN 860.00
  WHEN 10 THEN 1190.00
  WHEN 11 THEN 540.00
  WHEN 12 THEN 2225.00
  ELSE balance
END,
currency = 'INR';

-- 8) Reservations.
INSERT INTO Reservations (reservation_id, spot_id, user_id, vehicle_id, start_time, end_time, status, created_at) VALUES
  (1,  2,  4,  1,  '2026-04-01 09:00:00', '2026-04-01 11:00:00', 'Completed', '2026-03-30 17:00:00'),
  (2,  3,  5,  3,  '2026-04-01 12:00:00', '2026-04-01 14:00:00', 'Completed', '2026-03-30 18:00:00'),
  (3,  8,  6,  4,  '2026-04-02 10:00:00', '2026-04-02 12:00:00', 'Cancelled', '2026-03-31 09:30:00'),
  (4,  11, 7,  6,  '2026-04-02 13:00:00', '2026-04-02 16:00:00', 'Completed', '2026-03-31 10:00:00'),
  (5,  14, 8,  7,  '2026-04-03 09:30:00', '2026-04-03 11:00:00', 'No_Show',   '2026-04-01 08:00:00'),
  (6,  17, 9,  9,  '2026-04-03 11:00:00', '2026-04-03 13:30:00', 'Completed', '2026-04-01 09:00:00'),
  (7,  19, 10, 10, '2026-04-04 15:00:00', '2026-04-04 17:00:00', 'Completed', '2026-04-02 10:00:00'),
  (8,  22, 11, 12, '2026-04-04 18:00:00', '2026-04-04 20:00:00', 'Cancelled', '2026-04-02 11:00:00'),
  (9,  24, 12, 14, '2026-04-05 08:00:00', '2026-04-05 10:00:00', 'Completed', '2026-04-03 12:00:00'),
  (10, 5,  4,  2,  '2026-05-01 09:00:00', '2026-05-01 12:00:00', 'Confirmed', '2026-04-15 14:00:00'),
  (11, 9,  6,  5,  '2026-05-01 13:00:00', '2026-05-01 15:00:00', 'Confirmed', '2026-04-15 14:30:00'),
  (12, 18, 10, 11, '2026-05-02 10:30:00', '2026-05-02 12:30:00', 'Confirmed', '2026-04-16 09:00:00');

-- 9) Charging sessions.
INSERT INTO Charging_Sessions (session_id, charger_id, vehicle_id, reservation_id, plug_in_time, plug_out_time, kwh_start, kwh_end, status, total_cost, notes) VALUES
  (1,  1,  1,  1, '2026-04-01 09:10:00', '2026-04-01 10:20:00', 1200.0000, 1215.3000, 'Complete',    229.50, 'Morning commute charge'),
  (2,  2,  3,  2, '2026-04-01 12:10:00', '2026-04-01 13:00:00', 2400.5000, 2419.1000, 'Complete',    279.00, 'Quick DC fast top-up'),
  (3,  4,  4,  NULL, '2026-04-02 08:30:00', '2026-04-02 09:20:00', 300.0000, 311.2000, 'Complete',   184.80, 'Walk-in charging'),
  (4,  5,  6,  4, '2026-04-02 13:05:00', '2026-04-02 14:40:00', 510.0000, 535.4000, 'Complete',      419.10, 'Afternoon session'),
  (5,  7,  9,  6, '2026-04-03 11:10:00', '2026-04-03 12:50:00', 900.3000, 923.9000, 'Complete',      330.40, 'Workday charging'),
  (6,  8, 10,  7, '2026-04-04 15:05:00', '2026-04-04 16:10:00', 600.0000, 614.0000, 'Complete',      189.00, 'Mall visit charge'),
  (7,  9, 12,  NULL, '2026-04-05 09:00:00', '2026-04-05 09:35:00', 150.0000, 156.0000, 'Interrupted',  72.00, 'Interrupted due to connector issue'),
  (8,  3, 14,  9, '2026-04-05 08:15:00', '2026-04-05 09:45:00', 780.0000, 795.5000, 'Complete',      209.25, 'Scheduled low-speed charge'),
  (9,  2,  7,  NULL, '2026-04-17 18:20:00', NULL, 2200.0000, NULL, 'Active', NULL, 'Currently charging'),
  (10, 7, 10,  NULL, '2026-04-17 19:00:00', NULL, 700.0000, NULL, 'Active', NULL, 'Late evening charging');

-- 10) Billing records.
INSERT INTO Billing_Records (billing_id, user_id, session_id, reservation_id, billing_type, amount, description, billed_at) VALUES
  (1,  4,  NULL, NULL, 'Top_Up',      1000.00, 'Wallet top-up via UPI',          '2026-03-28 09:00:00'),
  (2,  5,  NULL, NULL, 'Top_Up',      1200.00, 'Wallet top-up via card',         '2026-03-28 09:30:00'),
  (3,  6,  NULL, NULL, 'Top_Up',       900.00, 'Wallet top-up via netbanking',   '2026-03-28 10:00:00'),
  (4,  7,  NULL, NULL, 'Top_Up',      1500.00, 'Wallet top-up via UPI',          '2026-03-28 10:20:00'),
  (5,  8,  NULL, NULL, 'Top_Up',      1000.00, 'Wallet top-up via card',         '2026-03-28 10:30:00'),
  (6,  9,  NULL, NULL, 'Top_Up',       800.00, 'Wallet top-up via UPI',          '2026-03-28 11:00:00'),
  (7,  10, NULL, NULL, 'Top_Up',      1100.00, 'Wallet top-up via card',         '2026-03-28 11:20:00'),
  (8,  11, NULL, NULL, 'Top_Up',       700.00, 'Wallet top-up via UPI',          '2026-03-28 11:40:00'),
  (9,  12, NULL, NULL, 'Top_Up',      2000.00, 'Wallet top-up via netbanking',   '2026-03-28 12:00:00'),

  (10, 4,  NULL, 1, 'Parking_Fee',    110.00, 'Parking charge - CP-A02',         '2026-04-01 11:05:00'),
  (11, 4,  1,    1, 'Energy_Fee',     229.50, 'Charging charge - CH-CP-001',     '2026-04-01 10:25:00'),
  (12, 5,  NULL, 2, 'Parking_Fee',    120.00, 'Parking charge - CP-A03',         '2026-04-01 14:05:00'),
  (13, 5,  2,    2, 'Energy_Fee',     279.00, 'Charging charge - CH-CP-002',     '2026-04-01 13:05:00'),
  (14, 7,  NULL, 4, 'Parking_Fee',    180.00, 'Parking charge - BK-B02',         '2026-04-02 16:05:00'),
  (15, 7,  4,    4, 'Energy_Fee',     419.10, 'Charging charge - CH-BK-002',     '2026-04-02 14:45:00'),
  (16, 9,  NULL, 6, 'Parking_Fee',    150.00, 'Parking charge - MG-B02',         '2026-04-03 13:35:00'),
  (17, 9,  5,    6, 'Energy_Fee',     330.40, 'Charging charge - CH-MG-002',     '2026-04-03 12:55:00'),
  (18, 10, NULL, 7, 'Parking_Fee',    125.00, 'Parking charge - HC-A01',         '2026-04-04 17:05:00'),
  (19, 10, 6,    7, 'Energy_Fee',     189.00, 'Charging charge - CH-HC-001',     '2026-04-04 16:15:00'),
  (20, 11, NULL, 8, 'Refund',         -80.00, 'Cancelled reservation refund',    '2026-04-04 20:05:00'),
  (21, 12, NULL, 9, 'Parking_Fee',    115.00, 'Parking charge - HC-B03',         '2026-04-05 10:05:00'),
  (22, 12, 8,    9, 'Energy_Fee',     209.25, 'Charging charge - CH-CP-003',     '2026-04-05 09:50:00'),
  (23, 11, 7,    NULL, 'Combined',    72.00, 'Interrupted session partial charge','2026-04-05 09:40:00');

-- 11) Charger error logs.
INSERT INTO Charger_Error_Log (error_id, charger_id, error_code, error_message, logged_at) VALUES
  (1, 6, 'E-OVHT', 'Temperature above safe threshold', '2026-04-17 08:00:00'),
  (2, 6, 'E-OVHT', 'Repeated thermal warning',         '2026-04-17 13:00:00'),
  (3, 6, 'E-CNTC', 'Connector communication fault',    '2026-04-17 18:00:00'),
  (4, 9, 'E-PLUG', 'Plug lock not engaged',            '2026-04-16 12:10:00'),
  (5, 9, 'E-PLUG', 'Plug lock intermittent',           '2026-04-17 06:10:00'),
  (6, 2, 'E-AUTH', 'RFID authentication timeout',      '2026-04-15 17:30:00');

-- 12) Manual maintenance records (in addition to auto-alerts from trigger).
INSERT INTO Maintenance_Alerts (alert_id, charger_id, reason, raised_at, resolved_at, is_resolved) VALUES
  (100, 9, 'Manual QA alert: connector inspection scheduled', '2026-04-17 07:00:00', NULL, FALSE),
  (101, 10, 'Legacy downtime incident resolved',              '2026-04-10 09:00:00', '2026-04-11 10:30:00', TRUE);

-- 13) Final state normalization for active sessions, reservations, and maintenance views.
UPDATE EV_Chargers SET status = 'Available';
UPDATE EV_Chargers SET status = 'In_Use' WHERE charger_id IN (2, 7);
UPDATE EV_Chargers SET status = 'Under_Maintenance' WHERE charger_id = 6;
UPDATE EV_Chargers SET status = 'Faulted' WHERE charger_id = 9;
UPDATE EV_Chargers SET status = 'Offline' WHERE charger_id = 10;

UPDATE Parking_Spots SET status = 'Available';
UPDATE Parking_Spots SET status = 'Occupied' WHERE spot_id IN (3, 17);
UPDATE Parking_Spots SET status = 'Reserved' WHERE spot_id IN (5, 9, 18);
UPDATE Parking_Spots SET status = 'Under_Maintenance' WHERE spot_id = 14;
