import { chargersApi } from "../api/chargers";
import { reservationsApi } from "../api/reservations";
import { sessionsApi } from "../api/sessions";
import { walletApi } from "../api/wallet";
import { zonesApi } from "../api/zones";
import type { BillingRecord, ChargingSession, EVCharger, Reservation, Zone } from "../types";

export type KpiItem = {
  label: string;
  value: string;
  trend: string;
};

export type ActivityItem = {
  time: string;
  text: string;
};

export type ZoneLoadItem = {
  zone: string;
  load: number;
};

export type LandingStatItem = {
  label: string;
  value: string;
};

export type LiveDashboardData = {
  kpis: KpiItem[];
  activity: ActivityItem[];
  chargerLoad: ZoneLoadItem[];
  landingStats: LandingStatItem[];
};

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US");
const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

function toDate(input: string | undefined): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(input: string | undefined, now: Date): boolean {
  const value = toDate(input);
  return Boolean(
    value &&
      value.getUTCFullYear() === now.getUTCFullYear() &&
      value.getUTCMonth() === now.getUTCMonth() &&
      value.getUTCDate() === now.getUTCDate(),
  );
}

function formatTime(input: string | undefined): string {
  const value = toDate(input);
  return value ? time.format(value) : "--:--";
}

function buildActivity(reservations: Reservation[], sessions: ChargingSession[], tx: BillingRecord[]): ActivityItem[] {
  const reservationEvents = reservations.map((reservation) => ({
    at: reservation.created_at || reservation.start_time,
    text: `Reservation #${reservation.reservation_id} is ${reservation.status.toLowerCase()} for spot ${reservation.spot_id}`,
  }));

  const sessionEvents = sessions.map((session) => ({
    at: session.plug_in_time,
    text: `Session #${session.session_id} on charger ${session.charger_id} is ${session.status.toLowerCase()}`,
  }));

  const txEvents = tx.map((record) => ({
    at: record.billed_at,
    text: `${record.billing_type} charge recorded: ${currency.format(record.amount)}`,
  }));

  return [...reservationEvents, ...sessionEvents, ...txEvents]
    .map((event) => ({ ...event, date: toDate(event.at) }))
    .filter((event): event is { at: string; text: string; date: Date } => event.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)
    .map((event) => ({ time: formatTime(event.at), text: event.text }));
}

async function buildChargerLoad(zones: Zone[], chargers: EVCharger[]): Promise<ZoneLoadItem[]> {
  const spotByZoneEntries = await Promise.all(
    zones.map(async (zone) => ({
      zone,
      spots: await zonesApi.spots(zone.zone_id).catch(() => []),
    })),
  );

  const spotToZone = new Map<number, number>();
  for (const entry of spotByZoneEntries) {
    for (const spot of entry.spots) {
      spotToZone.set(spot.spot_id, entry.zone.zone_id);
    }
  }

  const perZone = new Map<number, { zone: string; total: number; inUse: number }>();
  for (const charger of chargers) {
    const zoneId = spotToZone.get(charger.spot_id);
    if (!zoneId) {
      continue;
    }

    if (!perZone.has(zoneId)) {
      const zoneName = zones.find((zone) => zone.zone_id === zoneId)?.zone_name ?? `Zone ${zoneId}`;
      perZone.set(zoneId, { zone: zoneName, total: 0, inUse: 0 });
    }

    const current = perZone.get(zoneId);
    if (!current) {
      continue;
    }

    current.total += 1;
    if (charger.status === "In_Use") {
      current.inUse += 1;
    }
  }

  return [...perZone.values()]
    .filter((item) => item.total > 0)
    .map((item) => ({
      zone: item.zone,
      load: Math.round((item.inUse / item.total) * 100),
    }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 6);
}

export async function loadLiveDashboardData(): Promise<LiveDashboardData> {
  const now = new Date();

  const [reservations, sessions, activeSession, zones, chargers, transactions] = await Promise.all([
    reservationsApi.list(),
    sessionsApi.list(),
    sessionsApi.active().catch(() => null),
    zonesApi.list(),
    chargersApi.list(),
    walletApi.transactions(),
  ]);

  const currentReservations = reservations.filter((reservation) => {
    const start = toDate(reservation.start_time);
    const end = toDate(reservation.end_time);
    if (!start || !end) return false;
    const status = reservation.status.toLowerCase();
    return start <= now && end >= now && status !== "cancelled";
  });

  const reservationsToday = reservations.filter((reservation) => isSameDay(reservation.start_time, now));
  const sessionsToday = sessions.filter((session) => isSameDay(session.plug_in_time, now));
  const revenueToday = transactions
    .filter((record) => isSameDay(record.billed_at, now))
    .reduce((total, record) => total + record.amount, 0);

  const totalSpots = zones.reduce((sum, zone) => sum + zone.total_spots, 0);
  const openSpots = Math.max(totalSpots - currentReservations.length, 0);
  const occupancyRate = totalSpots > 0 ? Math.round(((totalSpots - openSpots) / totalSpots) * 100) : 0;

  const activeSessions = activeSession
    ? 1
    : sessions.filter((session) => session.status.toLowerCase() === "active" || !session.plug_out_time).length;

  const chargerLoad = await buildChargerLoad(zones, chargers);

  return {
    kpis: [
      {
        label: "Reservations today",
        value: number.format(reservationsToday.length),
        trend: `${number.format(reservations.length)} total reservations`,
      },
      {
        label: "Active charging sessions",
        value: number.format(activeSessions),
        trend: `${number.format(sessionsToday.length)} sessions started today`,
      },
      {
        label: "Open parking spots",
        value: number.format(openSpots),
        trend: `${occupancyRate}% occupancy`,
      },
      {
        label: "Revenue today",
        value: currency.format(revenueToday),
        trend: `${number.format(transactions.length)} wallet transactions`,
      },
    ],
    activity: buildActivity(reservations, sessions, transactions),
    chargerLoad,
    landingStats: [
      {
        label: "Active parking zones",
        value: number.format(zones.filter((zone) => zone.is_active).length),
      },
      {
        label: "Total parking spots",
        value: number.format(totalSpots),
      },
      {
        label: "Available EV chargers",
        value: number.format(chargers.filter((charger) => charger.status === "Available").length),
      },
      {
        label: "Charging sessions today",
        value: number.format(sessionsToday.length),
      },
    ],
  };
}

