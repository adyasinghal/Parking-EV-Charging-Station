export type UserRole = "Driver" | "Admin" | "Operator";

export interface ApiError {
  error: string;
  code?: string;
}

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Wallet {
  wallet_id: number;
  user_id: number;
  balance: number;
  currency: string;
  last_updated: string;
}

export interface BillingRecord {
  billing_id: number;
  user_id: number;
  session_id?: number;
  reservation_id?: number;
  billing_type: string;
  amount: number;
  description?: string;
  billed_at: string;
}

export interface Vehicle {
  vehicle_id: number;
  user_id: number;
  license_plate: string;
  make?: string;
  model?: string;
  year?: number;
  is_ev: boolean;
  battery_kw?: number;
}

export interface Zone {
  zone_id: number;
  zone_name: string;
  city: string;
  address?: string;
  total_spots: number;
  is_active: boolean;
}

export interface Spot {
  spot_id: number;
  zone_id: number;
  spot_code: string;
  floor_level?: number;
  type: string;
  status: string;
  charger?: {
    charger_id: number;
    charger_code: string;
    charger_type: string;
    power_kw: number;
    connector_type?: string;
    status: string;
    installed_at?: string;
  };
}

export interface Reservation {
  reservation_id: number;
  spot_id: number;
  user_id: number;
  vehicle_id?: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface ChargingSession {
  session_id: number;
  charger_id: number;
  vehicle_id: number;
  reservation_id?: number;
  plug_in_time: string;
  plug_out_time?: string;
  kwh_start: number;
  kwh_end?: number;
  kwh_consumed?: number;
  status: string;
  total_cost?: number;
}

export interface MaintenanceAlert {
  alert_id: number;
  charger_id: number;
  charger_code?: string;
  reason: string;
  raised_at: string;
  resolved_at?: string;
  is_resolved: boolean;
}

export interface MaintenanceRiskAlert {
  charger_id: number;
  charger_code: string;
  errors_last_24h: number;
}

export interface HighTrafficZone {
  zone_id: number;
  zone_name: string;
  city: string;
  total_sessions: number;
  avg_session_hrs: number;
  total_kwh_delivered: number;
  total_revenue: number;
}

export interface ChargerEfficiency {
  charger_id: number;
  charger_code: string;
  charger_type: string;
  power_kw: number;
  status: string;
  total_sessions: number;
  avg_kwh_per_session: number;
  total_errors: number;
  maintenance_count: number;
  error_rate_pct: number;
}

export interface TopSpender {
  user_id: number;
  full_name: string;
  email: string;
  total_spend: number;
}

export interface ZoneNoShowRate {
  zone_id: number;
  zone_name: string;
  no_show_count: number;
  total_count: number;
  no_show_rate_pct: number;
}

export interface HeatmapPoint {
  hour_of_day: string;
  time_window: string;
  sessions_started: number;
}

export interface ChargerUtilization {
  charger_id: number;
  charger_code: string;
  total_sessions: number;
  usage_hours: number;
  utilization_pct: number;
}

export interface ParkingOnlyUser {
  user_id: number;
  full_name: string;
  email: string;
}

export interface OvertimeSession {
  session_id: number;
  user_id: number;
  full_name: string;
  charger_code: string;
  duration_hours: number;
}

export interface SessionFrequency {
  user_id: number;
  full_name: string;
  session_count: number;
}

export interface SpotStatusEvent {
  spot_id: number;
  status: string;
}

export interface ChargerStatusEvent {
  charger_id: number;
  charger_code: string;
  status: string;
}

export interface EVCharger {
  charger_id: number;
  spot_id: number;
  zone_id?: number;
  spot_code?: string;
  spot_type?: string;
  charger_code: string;
  charger_type: string;
  power_kw: number;
  connector_type?: string;
  status: string;
  installed_at?: string;
}

export interface TopupRequest {
  request_id: number;
  user_id: number;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  note?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: number;
  full_name?: string;
  email?: string;
}

export interface PricingRule {
  rule_id: number;
  zone_id: number;
  rule_name?: string;
  is_peak: boolean;
  peak_start_time?: string;
  peak_end_time?: string;
  base_rate_per_hr: number;
  peak_multiplier?: number;
  energy_rate_kwh?: number;
  effective_from: string;
  effective_until?: string;
}
