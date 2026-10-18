// Converting a local birth date and time (at a place's time zone) to Universal Time.

/** Milliseconds since 1970 (UTC) for a wall-clock time in an IANA time zone, e.g. "Asia/Kolkata". */
export function zonedTimeToUtc(
  local: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): number {
  const asIfUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  // The zone's offset can depend on the date (summer time, India's war time in 1942–45),
  // so look it up at the guessed moment, then once more at the corrected moment.
  let utc = asIfUtc - offsetMs(asIfUtc, timeZone);
  const second = asIfUtc - offsetMs(utc, timeZone);
  if (second !== utc) utc = second;
  return utc;
}

/** The time zone's offset from UTC at a moment, in milliseconds (India: +5:30 = 19 800 000). */
export function offsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wall - Math.floor(utcMs / 1000) * 1000;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Julian Day (UT) — the day count astronomers use — for a UTC moment. */
export const julianDay = (utcMs: number) => utcMs / 86_400_000 + 2_440_587.5;

export const fromJulianDay = (jd: number) => (jd - 2_440_587.5) * 86_400_000;
