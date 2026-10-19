// The AI personas shown in the app (names, look and price). Their instructions live on the server
// (supabase/functions/_shared/personas.ts); a test checks both lists agree.

/** How the illustrated portrait is drawn (see PersonaAvatar). */
export type PortraitLook = {
  skin: string;
  hair: 'short' | 'long' | 'bun' | 'bald' | 'turban' | 'wavy';
  hairColor: string;
  beard?: 'stubble' | 'short' | 'full';
  mark?: 'bindi' | 'tilak' | 'tripundra';
  glasses?: boolean;
  /** kurta: plain top · saree: drape over one shoulder · shawl: cloth over both shoulders */
  clothes: 'kurta' | 'saree' | 'shawl';
  clothesColor: string;
  /** Second colour: saree drape, shawl or turban */
  accent: string;
  mala?: boolean;
};

export type PersonaInfo = {
  id: string;
  name: string;
  color: string;
  look: PortraitLook;
  billing: 'message' | 'minute';
  /** Credits per message, or per minute */
  price: number;
};

const SKIN = { light: '#E9B98F', wheat: '#D9A273', tan: '#C68A5C', brown: '#A86E47', deep: '#8A5636' } as const;
const HAIR = { black: '#1E1A1A', dark: '#2F2420', grey: '#9C9A9E', white: '#D9D6DA' } as const;

export const PERSONAS: PersonaInfo[] = [
  {
    id: 'vidya',
    name: 'Acharya Vidya',
    color: '#D4AF5F',
    look: { skin: SKIN.wheat, hair: 'bun', hairColor: HAIR.black, mark: 'bindi', glasses: true, clothes: 'saree', clothesColor: '#7A2E3A', accent: '#D4AF5F' },
    billing: 'message',
    price: 1,
  },
  {
    id: 'anand',
    name: 'Guru Anand',
    color: '#3FBF8F',
    look: { skin: SKIN.tan, hair: 'short', hairColor: HAIR.dark, beard: 'short', clothes: 'kurta', clothesColor: '#F2EBDD', accent: '#3FBF8F' },
    billing: 'message',
    price: 1,
  },
  {
    id: 'meera',
    name: 'Meera',
    color: '#E08AA8',
    look: { skin: SKIN.light, hair: 'long', hairColor: HAIR.black, mark: 'bindi', clothes: 'saree', clothesColor: '#B03A6B', accent: '#F2C46D' },
    billing: 'minute',
    price: 1,
  },
  {
    id: 'shastri',
    name: 'Pandit Shastri',
    color: '#E3A35B',
    look: { skin: SKIN.brown, hair: 'bald', hairColor: HAIR.grey, beard: 'full', mark: 'tripundra', clothes: 'shawl', clothesColor: '#F4EFE4', accent: '#E07B24', mala: true },
    billing: 'message',
    price: 1,
  },
  {
    id: 'tara',
    name: 'Tara',
    color: '#7FA8E8',
    look: { skin: SKIN.tan, hair: 'wavy', hairColor: HAIR.dark, clothes: 'kurta', clothesColor: '#2D4E8C', accent: '#7FA8E8' },
    billing: 'minute',
    price: 1,
  },
  {
    id: 'devraj',
    name: 'Pandit Devraj',
    color: '#C75B4A',
    look: { skin: SKIN.wheat, hair: 'turban', hairColor: HAIR.dark, beard: 'full', mark: 'tilak', clothes: 'kurta', clothesColor: '#EDE3D1', accent: '#C0392B' },
    billing: 'message',
    price: 2,
  },
  {
    id: 'kavya',
    name: 'Kavya',
    color: '#9B7FE0',
    look: { skin: SKIN.brown, hair: 'bun', hairColor: HAIR.black, glasses: true, clothes: 'kurta', clothesColor: '#4B3A86', accent: '#C8B6F5' },
    billing: 'minute',
    price: 2,
  },
  {
    id: 'gopal',
    name: 'Acharya Gopal',
    color: '#8DB86B',
    look: { skin: SKIN.tan, hair: 'short', hairColor: HAIR.grey, glasses: true, mark: 'tilak', clothes: 'shawl', clothesColor: '#F1E9D8', accent: '#5E8C3A' },
    billing: 'message',
    price: 1,
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi',
    color: '#E6C35C',
    look: { skin: SKIN.deep, hair: 'bun', hairColor: HAIR.black, mark: 'bindi', clothes: 'saree', clothesColor: '#1F6B4F', accent: '#E6C35C', mala: true },
    billing: 'minute',
    price: 1,
  },
  {
    id: 'arjun',
    name: 'Arjun',
    color: '#5BB8C9',
    look: { skin: SKIN.light, hair: 'short', hairColor: HAIR.black, beard: 'stubble', clothes: 'kurta', clothesColor: '#1F4E5A', accent: '#5BB8C9' },
    billing: 'message',
    price: 1,
  },
  {
    id: 'savitri',
    name: 'Amma Savitri',
    color: '#E39A7A',
    look: { skin: SKIN.brown, hair: 'bun', hairColor: HAIR.white, mark: 'bindi', glasses: true, clothes: 'saree', clothesColor: '#8C4A2F', accent: '#F0C9A0' },
    billing: 'minute',
    price: 1,
  },
  {
    id: 'rudra',
    name: 'Rudra',
    color: '#7B8BB5',
    look: { skin: SKIN.deep, hair: 'long', hairColor: HAIR.black, beard: 'full', mark: 'tripundra', clothes: 'shawl', clothesColor: '#2C2F45', accent: '#7B8BB5', mala: true },
    billing: 'message',
    price: 2,
  },
];

export const SESSION_MINUTES = [5, 10, 15];

export const personaInfo = (id: string) => PERSONAS.find((p) => p.id === id);
