// Checks and cleans the birth details a user submits, before they are encrypted.

export const RELATIONS = ['self', 'spouse', 'partner', 'child', 'parent', 'sibling', 'friend', 'other'] as const;
export const GENDERS = ['male', 'female', 'other'] as const;

export type Relation = (typeof RELATIONS)[number];
export type Gender = (typeof GENDERS)[number];

/** The personal part that gets encrypted. */
export type BirthDetails = {
  fullName: string;
  gender: Gender;
  /** YYYY-MM-DD (local date at the birth place) */
  birthDate: string;
  /** HH:MM 24-hour local time, or null if the user does not know it */
  birthTime: string | null;
  birthPlace: {
    name: string;
    latitude: number;
    longitude: number;
    /** IANA time-zone name, e.g. Asia/Kolkata */
    timezone: string;
  };
};

export type BirthProfileInput = BirthDetails & { relation: Relation; isPrimary: boolean };

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isRealDate(text: string, today: Date): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  // Allow up to one day ahead to cover time-zone differences around midnight.
  const tomorrow = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
  return real && y >= 1800 && date.getTime() <= tomorrow;
}

export function validateBirthProfile(input: unknown, today = new Date()): ValidationResult<BirthProfileInput> {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['Body must be a JSON object'] };

  const fullName = typeof input.fullName === 'string' ? input.fullName.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
  if (fullName.length < 1 || fullName.length > 100) errors.push('fullName must be 1–100 characters');

  const gender = input.gender as Gender;
  if (!GENDERS.includes(gender)) errors.push(`gender must be one of ${GENDERS.join(', ')}`);

  const relation = (input.relation ?? 'self') as Relation;
  if (!RELATIONS.includes(relation)) errors.push(`relation must be one of ${RELATIONS.join(', ')}`);

  const isPrimary = input.isPrimary === true;

  const birthDate = typeof input.birthDate === 'string' ? input.birthDate : '';
  if (!isRealDate(birthDate, today)) errors.push('birthDate must be a real past date in YYYY-MM-DD format');

  let birthTime: string | null = null;
  if (input.birthTime !== null && input.birthTime !== undefined) {
    if (typeof input.birthTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)) {
      birthTime = input.birthTime;
    } else {
      errors.push('birthTime must be HH:MM (24-hour) or null');
    }
  }

  const place = isObject(input.birthPlace) ? input.birthPlace : null;
  let birthPlace: BirthDetails['birthPlace'] | null = null;
  if (!place) {
    errors.push('birthPlace is required');
  } else {
    const name = typeof place.name === 'string' ? place.name.trim() : '';
    const { latitude, longitude, timezone } = place;
    if (name.length < 1 || name.length > 200) errors.push('birthPlace.name must be 1–200 characters');
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.push('birthPlace.latitude must be between -90 and 90');
    }
    if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.push('birthPlace.longitude must be between -180 and 180');
    }
    if (typeof timezone !== 'string' || !isValidTimeZone(timezone)) {
      errors.push('birthPlace.timezone must be a valid IANA time zone, e.g. Asia/Kolkata');
    }
    birthPlace = { name, latitude: latitude as number, longitude: longitude as number, timezone: timezone as string };
  }

  if (errors.length > 0 || !birthPlace) return { ok: false, errors };
  return { ok: true, value: { fullName, gender, relation, isPrimary, birthDate, birthTime, birthPlace } };
}

/** Splits validated input into the encrypted part and the plain database columns. */
export function splitForStorage(input: BirthProfileInput): {
  details: BirthDetails;
  columns: { relation: Relation; is_primary: boolean };
} {
  const { relation, isPrimary, ...details } = input;
  return { details, columns: { relation, is_primary: isPrimary } };
}
