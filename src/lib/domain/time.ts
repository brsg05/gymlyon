import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export const TZ = "America/Recife";

/** Current wall-clock time in the app timezone. */
export function now(): TZDate {
  return TZDate.tz(TZ);
}

/** yyyy-MM-dd for a given instant interpreted in the app timezone. */
export function dayRef(instant: Date | string | number = new Date()): string {
  const ms = typeof instant === "object" ? instant.getTime() : new Date(instant).getTime();
  return format(new TZDate(ms, TZ), "yyyy-MM-dd");
}

/** UTC ISO bounds for the local day [D 00:00, D+1 00:00). */
export function dayRangeUtc(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new TZDate(y, m - 1, d, 0, 0, 0, 0, TZ);
  const end = new TZDate(y, m - 1, d + 1, 0, 0, 0, 0, TZ);
  return { start: new Date(start.getTime()).toISOString(), end: new Date(end.getTime()).toISOString() };
}

/** UTC ISO bounds for a local month [first day 00:00, next month 00:00). */
export function monthRangeUtc(year: number, month1to12: number): { start: string; end: string } {
  const start = new TZDate(year, month1to12 - 1, 1, 0, 0, 0, 0, TZ);
  const end = new TZDate(year, month1to12, 1, 0, 0, 0, 0, TZ);
  return { start: new Date(start.getTime()).toISOString(), end: new Date(end.getTime()).toISOString() };
}

export function ageFromBirth(birth: string, ref: Date = new Date()): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const r = new TZDate(ref.getTime(), TZ);
  let age = r.getFullYear() - by;
  const md = r.getMonth() + 1 - bm;
  if (md < 0 || (md === 0 && r.getDate() < bd)) age--;
  return age;
}

/** Current weekday in app tz (0=domingo .. 6=sábado). */
export function todayWeekday(): number {
  return now().getDay();
}

export function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
}

export function formatDateBR(instant: Date | string): string {
  return format(new TZDate(new Date(instant).getTime(), TZ), "dd/MM/yyyy");
}

/** Format a date-only string (yyyy-MM-dd) as dd/MM/yyyy without tz shifting. */
export function formatDateRef(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTimeBR(instant: Date | string): string {
  return format(new TZDate(new Date(instant).getTime(), TZ), "HH:mm");
}

export function formatDateTimeBR(instant: Date | string): string {
  return `${formatDateBR(instant)} ${formatTimeBR(instant)}`;
}

/** Seconds -> "1h 23min" or "23min" or "45s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}min`;
  if (m > 0) return `${m}min`;
  return `${sec}s`;
}

/** Seconds -> "HH:MM:SS" for the stopwatch display. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Value to fill a datetime-local input from an instant, in app tz. */
export function toLocalInputValue(instant: Date | string = new Date()): string {
  return format(new TZDate(new Date(instant).getTime(), TZ), "yyyy-MM-dd'T'HH:mm");
}

/** datetime-local value for N hours before now, in app tz. */
export function localInputValueHoursAgo(hours: number): string {
  return toLocalInputValue(new Date(Date.now() - hours * 3_600_000));
}

/** Convert a datetime-local string (assumed app tz) to a UTC ISO instant. */
export function localInputToUtc(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const local = new TZDate(y, m - 1, d, hh, mm, 0, 0, TZ);
  return new Date(local.getTime()).toISOString();
}
