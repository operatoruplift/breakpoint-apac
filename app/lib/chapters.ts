export type Chapter = {
  id: string;
  name: string;
  flag: string;
  region: 'APAC' | 'Europe' | 'Americas' | 'Africa' | 'Middle East';
  city: string;
  airport: string;
  accent: string;
  nativeName: string;
  handle: string;
  departures: { code: string; city: string }[];
};

/** Chapter membership, not an assertion of an official event partnership. */
export const CHAPTERS: Chapter[] = [
  { id: 'vn', name: 'Vietnam', flag: '🇻🇳', region: 'APAC', city: 'Ho Chi Minh City', airport: 'SGN', accent: '#dcff65', nativeName: 'Việt Nam', handle: 'superteamvn', departures: [{ code: 'SGN', city: 'Ho Chi Minh City' }, { code: 'HAN', city: 'Hanoi' }, { code: 'DAD', city: 'Da Nang' }] },
  { id: 'kr', name: 'Korea', flag: '🇰🇷', region: 'APAC', city: 'Seoul', airport: 'ICN', accent: '#a0c9ff', nativeName: '대한민국', handle: 'SuperteamKorea', departures: [{ code: 'ICN', city: 'Seoul' }, { code: 'PUS', city: 'Busan' }] },
  { id: 'jp', name: 'Japan', flag: '🇯🇵', region: 'APAC', city: 'Tokyo', airport: 'HND', accent: '#ff95ad', nativeName: '日本', handle: 'SuperteamJapan', departures: [{ code: 'HND', city: 'Tokyo Haneda' }, { code: 'NRT', city: 'Tokyo Narita' }, { code: 'KIX', city: 'Osaka' }, { code: 'FUK', city: 'Fukuoka' }] },
  { id: 'th', name: 'Thailand', flag: '🇹🇭', region: 'APAC', city: 'Bangkok', airport: 'BKK', accent: '#b9a2ff', nativeName: 'ประเทศไทย', handle: 'SuperteamTH', departures: [{ code: 'BKK', city: 'Bangkok' }, { code: 'CNX', city: 'Chiang Mai' }, { code: 'HKT', city: 'Phuket' }] },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', region: 'APAC', city: 'Singapore', airport: 'SIN', accent: '#ff957a', nativeName: 'Singapore', handle: 'SuperteamSG', departures: [{ code: 'SIN', city: 'Singapore' }] },
  { id: 'my', name: 'Malaysia', flag: '🇲🇾', region: 'APAC', city: 'Kuala Lumpur', airport: 'KUL', accent: '#ffe37c', nativeName: 'Malaysia', handle: 'SuperteamMY', departures: [{ code: 'KUL', city: 'Kuala Lumpur' }, { code: 'PEN', city: 'Penang' }, { code: 'BKI', city: 'Kota Kinabalu' }] },
  { id: 'in', name: 'India', flag: '🇮🇳', region: 'APAC', city: 'Bengaluru', airport: 'BLR', accent: '#ffbe78', nativeName: 'भारत', handle: 'SuperteamIN', departures: [{ code: 'BLR', city: 'Bengaluru' }, { code: 'DEL', city: 'New Delhi' }, { code: 'BOM', city: 'Mumbai' }, { code: 'HYD', city: 'Hyderabad' }] },
  { id: 'au', name: 'Australia', flag: '🇦🇺', region: 'APAC', city: 'Sydney', airport: 'SYD', accent: '#7ee1c8', nativeName: 'Australia', handle: 'SuperteamAU', departures: [{ code: 'SYD', city: 'Sydney' }, { code: 'MEL', city: 'Melbourne' }, { code: 'BNE', city: 'Brisbane' }, { code: 'PER', city: 'Perth' }] },
  { id: 'kz', name: 'Kazakhstan', flag: '🇰🇿', region: 'APAC', city: 'Almaty', airport: 'ALA', accent: '#77dded', nativeName: 'Қазақстан', handle: 'SuperteamKZ', departures: [{ code: 'ALA', city: 'Almaty' }, { code: 'NQZ', city: 'Astana' }] },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', city: 'Manchester', airport: 'MAN', accent: '#b8a5ff', nativeName: 'United Kingdom', handle: 'SuperteamUK', departures: [{ code: 'MAN', city: 'Manchester' }, { code: 'EDI', city: 'Edinburgh' }, { code: 'LON', city: 'London' }] },
  { id: 'de', name: 'Germany', flag: '🇩🇪', region: 'Europe', city: 'Berlin', airport: 'BER', accent: '#ffcf6d', nativeName: 'Deutschland', handle: 'SuperteamDE', departures: [{ code: 'BER', city: 'Berlin' }, { code: 'FRA', city: 'Frankfurt' }, { code: 'MUC', city: 'Munich' }] },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱', region: 'Europe', city: 'Amsterdam', airport: 'AMS', accent: '#ffad79', nativeName: 'Nederland', handle: 'SuperteamNL', departures: [{ code: 'AMS', city: 'Amsterdam' }, { code: 'RTM', city: 'Rotterdam' }] },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪', region: 'Europe', city: 'Dublin', airport: 'DUB', accent: '#a1eabb', nativeName: 'Éire', handle: 'SuperteamIE', departures: [{ code: 'DUB', city: 'Dublin' }, { code: 'ORK', city: 'Cork' }] },
  { id: 'pl', name: 'Poland', flag: '🇵🇱', region: 'Europe', city: 'Warsaw', airport: 'WAW', accent: '#ff9ead', nativeName: 'Polska', handle: 'SuperteamPL', departures: [{ code: 'WAW', city: 'Warsaw' }, { code: 'KRK', city: 'Kraków' }] },
  { id: 'it', name: 'Italy', flag: '🇮🇹', region: 'Europe', city: 'Milan', airport: 'MXP', accent: '#b6edb1', nativeName: 'Italia', handle: 'SuperteamIT', departures: [{ code: 'MXP', city: 'Milan' }, { code: 'FCO', city: 'Rome' }] },
  { id: 'fr', name: 'France', flag: '🇫🇷', region: 'Europe', city: 'Paris', airport: 'CDG', accent: '#a9c6ff', nativeName: 'Ferno', handle: 'Ferno_fr', departures: [{ code: 'CDG', city: 'Paris' }, { code: 'LYS', city: 'Lyon' }, { code: 'MRS', city: 'Marseille' }] },
  { id: 'es', name: 'Spain', flag: '🇪🇸', region: 'Europe', city: 'Barcelona', airport: 'BCN', accent: '#ffb6a0', nativeName: 'La Familia', handle: 'SuperteamES', departures: [{ code: 'BCN', city: 'Barcelona' }, { code: 'MAD', city: 'Madrid' }, { code: 'VLC', city: 'Valencia' }] },
  { id: 'balkan', name: 'Balkans', flag: '🌍', region: 'Europe', city: 'Belgrade', airport: 'BEG', accent: '#c9a8ff', nativeName: 'Balkan', handle: 'SuperteamBalkan', departures: [{ code: 'BEG', city: 'Belgrade' }, { code: 'ZAG', city: 'Zagreb' }, { code: 'SOF', city: 'Sofia' }, { code: 'LJU', city: 'Ljubljana' }] },
  { id: 'tr', name: 'Turkey', flag: '🇹🇷', region: 'Europe', city: 'Istanbul', airport: 'IST', accent: '#ffa3a3', nativeName: 'Türkiye', handle: 'SuperteamTR', departures: [{ code: 'IST', city: 'Istanbul' }, { code: 'ESB', city: 'Ankara' }] },
  { id: 'ua', name: 'Ukraine', flag: '🇺🇦', region: 'Europe', city: 'Kyiv', airport: 'IEV', accent: '#a2d4ff', nativeName: 'Україна', handle: 'SuperteamUA', departures: [{ code: 'IEV', city: 'Kyiv · chapter origin' }] },
  { id: 'ge', name: 'Georgia', flag: '🇬🇪', region: 'Europe', city: 'Tbilisi', airport: 'TBS', accent: '#ffc1bc', nativeName: 'საქართველო', handle: 'SuperteamGE', departures: [{ code: 'TBS', city: 'Tbilisi' }, { code: 'KUT', city: 'Kutaisi' }] },
  { id: 'us', name: 'United States', flag: '🇺🇸', region: 'Americas', city: 'New York', airport: 'JFK', accent: '#aac3ff', nativeName: 'USA', handle: 'SuperteamUSA', departures: [{ code: 'JFK', city: 'New York' }, { code: 'SFO', city: 'San Francisco' }, { code: 'LAX', city: 'Los Angeles' }, { code: 'MIA', city: 'Miami' }] },
  { id: 'br', name: 'Brazil', flag: '🇧🇷', region: 'Americas', city: 'São Paulo', airport: 'GRU', accent: '#c5ec75', nativeName: 'Brasil', handle: 'SuperteamBR', departures: [{ code: 'GRU', city: 'São Paulo' }, { code: 'GIG', city: 'Rio de Janeiro' }] },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', region: 'Americas', city: 'Toronto', airport: 'YYZ', accent: '#ffb2b2', nativeName: 'Canada', handle: 'SuperteamCA', departures: [{ code: 'YYZ', city: 'Toronto' }, { code: 'YVR', city: 'Vancouver' }, { code: 'YUL', city: 'Montréal' }] },
  { id: 'ar', name: 'Argentina', flag: '🇦🇷', region: 'Americas', city: 'Buenos Aires', airport: 'EZE', accent: '#a8dfff', nativeName: 'Argentina', handle: 'SuperteamAR', departures: [{ code: 'EZE', city: 'Buenos Aires' }, { code: 'COR', city: 'Córdoba' }] },
  { id: 'ae', name: 'UAE', flag: '🇦🇪', region: 'Middle East', city: 'Dubai', airport: 'DXB', accent: '#c7edb7', nativeName: 'الإمارات', handle: 'SuperteamUAE', departures: [{ code: 'DXB', city: 'Dubai' }, { code: 'AUH', city: 'Abu Dhabi' }] },
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬', region: 'Africa', city: 'Lagos', airport: 'LOS', accent: '#b2efc3', nativeName: 'Nigeria', handle: 'SuperteamNG', departures: [{ code: 'LOS', city: 'Lagos' }, { code: 'ABV', city: 'Abuja' }] },
];

export function getChapter(id: string): Chapter {
  return CHAPTERS.find((chapter) => chapter.id === id) ?? CHAPTERS[0];
}
