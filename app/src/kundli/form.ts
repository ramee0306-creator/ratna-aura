// Checking the "new kundli" form.
import { ageOn, parseIndianDate, toIsoDate } from '@ratna/numerology';

import type { Place } from '@/places/search';
import { todayDate } from '@/numerology/details';

import type { BirthProfileInput, Gender, Relation } from './api';

export type KundliFormInput = {
  fullName: string;
  gender: Gender | null;
  relation: Relation;
  dateText: string;
  timeText: string;
  meridiem: 'am' | 'pm';
  timeUnknown: boolean;
  place: Place | null;
  isPrimary: boolean;
};

export type KundliFormError = 'name' | 'gender' | 'date' | 'time' | 'place';

/** Formats digits typed into the time box as HH:MM: "645" -> "06:45" only when complete; "0645" -> "06:45". */
export function formatTimeInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** "06:45" + pm -> "18:45"; 12:xx am -> "00:xx". Null if not a valid 12-hour time. */
export function to24Hour(text: string, meridiem: 'am' | 'pm'): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const h24 = (hour % 12) + (meridiem === 'pm' ? 12 : 0);
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function validateKundliForm(
  input: KundliFormInput,
  today = todayDate(),
): { ok: true; value: BirthProfileInput } | { ok: false; errors: KundliFormError[] } {
  const errors: KundliFormError[] = [];
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (fullName.length < 1 || fullName.length > 100) errors.push('name');
  if (!input.gender) errors.push('gender');

  const date = parseIndianDate(input.dateText);
  if (!date || ageOn(date, today) < 0 || date.year < 1800) errors.push('date');

  const time = input.timeUnknown ? null : to24Hour(input.timeText, input.meridiem);
  if (!input.timeUnknown && !time) errors.push('time');
  if (!input.place) errors.push('place');

  if (errors.length || !date || !input.gender || !input.place) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName,
      gender: input.gender,
      relation: input.relation,
      isPrimary: input.isPrimary,
      birthDate: toIsoDate(date),
      birthTime: time,
      birthPlace: {
        name: input.place.label,
        latitude: input.place.latitude,
        longitude: input.place.longitude,
        timezone: input.place.timezone,
      },
    },
  };
}
