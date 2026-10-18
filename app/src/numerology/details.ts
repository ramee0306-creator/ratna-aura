// Checking the name and date of birth typed into the numerology forms.
import { ageOn, type CalendarDate, isLatinName, parseIndianDate, parseIsoDate, toIsoDate } from '@ratna/numerology';

export type Gender = 'male' | 'female';

/** What we save for a person (on this phone only, encrypted). */
export type PersonDetails = {
  fullName: string;
  /** YYYY-MM-DD */
  birthDate: string;
  gender: Gender | null;
};

export type DetailsError = 'invalidName' | 'invalidDate' | 'futureDate' | 'tooOld';

export function todayDate(now = new Date()): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Turns digits typed by the user into DD/MM/YYYY as they type: "14081990" -> "14/08/1990". */
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "1990-08-14" -> "14/08/1990" */
export function isoToDisplay(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return '';
  return `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`;
}

export function validateDetails(
  input: { fullName: string; dateText: string; gender: Gender | null },
  today: CalendarDate = todayDate(),
): { ok: true; value: PersonDetails } | { ok: false; errors: Partial<Record<'name' | 'date', DetailsError>> } {
  const errors: Partial<Record<'name' | 'date', DetailsError>> = {};
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (!isLatinName(fullName) || fullName.length > 80) errors.name = 'invalidName';

  const date = parseIndianDate(input.dateText);
  if (!date) errors.date = 'invalidDate';
  else if (ageOn(date, today) < 0) errors.date = 'futureDate';
  else if (date.year < 1900) errors.date = 'tooOld';

  if (errors.name || errors.date || !date) return { ok: false, errors };
  return { ok: true, value: { fullName, birthDate: toIsoDate(date), gender: input.gender } };
}
