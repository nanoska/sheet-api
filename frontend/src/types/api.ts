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
  image_url?: string;  // URL de la imagen (propia o heredada del tema)
  has_own_image?: boolean;  // true si tiene imagen propia, false si hereda del tema
  audio_file?: string;
  audio_url?: string;  // URL del audio (propio o heredado del tema)
  has_own_audio?: boolean;  // true si tiene audio propio, false si hereda del tema
  mus_file?: string;
  notes: string;
  sheet_music_count?: number;
  version_files_count?: number;
  created_at: string;
  updated_at: string;
  sheet_music?: SheetMusic[];
  version_files?: VersionFile[];
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

export interface VersionFile {
  id: number;
  version: number;
  version_title?: string;
  theme_title?: string;
  version_type?: 'STANDARD' | 'ENSAMBLE' | 'DUETO' | 'GRUPO_REDUCIDO';
  file_type: 'STANDARD_INSTRUMENT' | 'DUETO_TRANSPOSITION' | 'ENSAMBLE_INSTRUMENT' | 'STANDARD_SCORE';
  file_type_display?: string;
  tuning?: 'Bb' | 'Eb' | 'F' | 'C' | 'C_BASS';
  tuning_display?: string;
  instrument?: number;
  instrument_name?: string;
  // New fields for STANDARD_INSTRUMENT support
  sheet_type?: 'MELODIA_PRINCIPAL' | 'MELODIA_SECUNDARIA' | 'ARMONIA' | 'BAJO';
  sheet_type_display?: string;
  clef?: 'SOL' | 'FA';
  clef_display?: string;
  tonalidad_relativa?: string;
  // Files
  file: string | File;
  audio?: string | File;
  // Inheritance fields
  image_url?: string;  // Heredado de Version → Theme
  audio_url?: string;  // Propio o heredado de Version → Theme
  has_own_audio?: boolean;  // true si tiene audio propio
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface VersionFileCreate {
  version: number;
  file_type: 'STANDARD_INSTRUMENT' | 'DUETO_TRANSPOSITION' | 'ENSAMBLE_INSTRUMENT' | 'STANDARD_SCORE';
  tuning?: 'Bb' | 'Eb' | 'F' | 'C' | 'C_BASS';
  instrument?: number;
  // New fields for STANDARD_INSTRUMENT
  sheet_type?: 'MELODIA_PRINCIPAL' | 'MELODIA_SECUNDARIA' | 'ARMONIA' | 'BAJO';
  clef?: 'SOL' | 'FA';
  file: File;
  audio?: File;
  description?: string;
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
  google_url?: string;
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