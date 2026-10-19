// Checking what the app sends, before any calculation.
import { isValidTimeZone, zonedTimeToUtc } from './kundli/index.ts';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" that is a real calendar date between 1900 and 2100. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2100 && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export type PlaceRequest = { date: string; latitude: number; longitude: number; timezone: string };

/** Panchang request: { date, latitude, longitude, timezone }. Returns an error message or the clean values. */
export function parsePlaceRequest(body: unknown): PlaceRequest | string {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!isCalendarDate(b.date)) return 'date must be YYYY-MM-DD';
  const { latitude, longitude, timezone } = b;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 66) return 'latitude must be between -66 and 66';
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return 'longitude must be between -180 and 180';
  if (typeof timezone !== 'string' || !isValidTimeZone(timezone)) return 'timezone must be an IANA time zone';
  return { date: b.date, latitude, longitude, timezone };
}

/** Today's date (YYYY-MM-DD) in a time zone. */
export function todayIn(timeZone: string, now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}

/** The date `days` after a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Start of a local date as a UTC moment. */
export function startOfDay(date: string, timeZone: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }, timeZone);
}
