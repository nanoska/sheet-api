export interface Theme {
  id: number;
  title: string;
  artist: string;
  image?: string;
  tonalidad: string;
  description: string;
  audio?: string;
  created_at: string;
  updated_at: string;
  versions: Version[];
}

export interface Instrument {
  id: number;
  name: string;
  family: 'VIENTO_MADERA' | 'VIENTO_METAL' | 'PERCUSION';
  afinacion: 'Bb' | 'Eb' | 'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'NONE';
  created_at: string;
}

export interface Version {
  id: number;
  theme: number;
  theme_title?: string;
  title: string;
  type: 'STANDARD' | 'ENSAMBLE' | 'DUETO' | 'GRUPO_REDUCIDO';
  type_display?: string;
  image?: string;
  audio_file?: string;
  mus_file?: string;
  notes: string;
  sheet_music_count?: number;
  created_at: string;
  updated_at: string;
  sheet_music?: SheetMusic[];
}

export interface SheetMusic {
  id: number;
  version: number;
  instrument: number;
  type: 'MELODIA_PRINCIPAL' | 'MELODIA_SECUNDARIA' | 'ARMONIA' | 'BAJO';
  clef: 'SOL' | 'FA';
  tonalidad_relativa: string;
  file: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  capacity: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepertoireVersion {
  id: number;
  version: Version;
  version_id?: number;
  order: number;
  notes: string;
  created_at: string;
}

export interface Repertoire {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  versions: RepertoireVersion[];
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  event_type: 'CONCERT' | 'REHEARSAL' | 'RECORDING' | 'WORKSHOP' | 'OTHER';
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: Location;
  location_id?: number;
  repertoire?: Repertoire;
  repertoire_id?: number;
  is_public: boolean;
  max_attendees?: number;
  price: number;
  is_upcoming: boolean;
  is_ongoing: boolean;
  created_at: string;
  updated_at: string;
}