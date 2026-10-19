// The AI personas shown in the app (names, look and price). Their instructions live on the server
// (supabase/functions/_shared/personas.ts); a test checks both lists agree.
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type PersonaInfo = {
  id: 'vidya' | 'anand' | 'meera' | 'shastri' | 'tara';
  name: string;
  icon: IconName;
  color: string;
  billing: 'message' | 'minute';
  /** Credits per message, or per minute */
  price: number;
};

export const PERSONAS: PersonaInfo[] = [
  { id: 'vidya', name: 'Acharya Vidya', icon: 'star-four-points-outline', color: '#D4AF5F', billing: 'message', price: 1 },
  { id: 'anand', name: 'Guru Anand', icon: 'numeric', color: '#3FBF8F', billing: 'message', price: 1 },
  { id: 'meera', name: 'Meera', icon: 'heart-outline', color: '#E08AA8', billing: 'minute', price: 1 },
  { id: 'shastri', name: 'Pandit Shastri', icon: 'om', color: '#E3A35B', billing: 'message', price: 1 },
  { id: 'tara', name: 'Tara', icon: 'compass-outline', color: '#7FA8E8', billing: 'minute', price: 1 },
];

export const SESSION_MINUTES = [5, 10, 15];

export const personaInfo = (id: string) => PERSONAS.find((p) => p.id === id);
