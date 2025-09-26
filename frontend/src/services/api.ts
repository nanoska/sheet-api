import axios, { AxiosInstance } from 'axios';
import { Theme, Instrument, Version, SheetMusic, AuthResponse, LoginCredentials, Event, Location, Repertoire } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: refreshToken,
              });
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Event methods
  async getEvents(params?: any): Promise<{ count: number; results: Event[] }> {
    const response = await this.api.get('/events/events/', { params });
    return response.data;
  }

  async getEvent(id: number): Promise<Event> {
    const response = await this.api.get(`/events/events/${id}/`);
    return response.data;
  }

  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Event> {
    const response = await this.api.post('/events/events/', eventData);
    return response.data;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    const response = await this.api.patch(`/events/events/${id}/`, eventData);
    return response.data;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.api.delete(`/events/events/${id}/`);
  }

  // Location methods
  async getLocations(activeOnly: boolean = true): Promise<Location[]> {
    const response = await this.api.get('/events/locations/', { 
      params: { is_active: activeOnly } 
    });
    return response.data;
  }

  async createLocation(locationData: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const response = await this.api.post('/events/locations/', locationData);
    return response.data;
  }

  // Repertoire methods
  async getRepertoires(): Promise<Repertoire[]> {
    const response = await this.api.get('/events/repertoires/');
    return response.data.results || response.data;
  }

  async getRepertoire(id: number): Promise<Repertoire> {
    const response = await this.api.get(`/events/repertoires/${id}/`);
    return response.data;
  }

  async createRepertoire(repertoireData: Omit<Repertoire, 'id' | 'created_at' | 'updated_at'>): Promise<Repertoire> {
    const response = await this.api.post('/events/repertoires/', repertoireData);
    return response.data;
  }

  async updateRepertoire(id: number, repertoireData: Partial<Repertoire>): Promise<Repertoire> {
    const response = await this.api.patch(`/events/repertoires/${id}/`, repertoireData);
    return response.data;
  }

  async deleteRepertoire(id: number): Promise<void> {
    await this.api.delete(`/events/repertoires/${id}/`);
  }

  // Note: Para agregar/quitar versiones, necesitamos manejar esto
  // a través del serializer de Repertoire enviando la lista completa de versions
  // en el método updateRepertoire

  // Auth methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login/', credentials);
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    // Create a basic user object from credentials
    const user = {
      id: 1,
      username: credentials.username,
      email: '',
      first_name: '',
      last_name: ''
    };
    localStorage.setItem('user', JSON.stringify(user));

    return { access, refresh, user };
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  async getThemes(): Promise<Theme[]> {
    const response = await this.api.get('/api/themes/');
    return response.data.results || response.data;
  }

  async getTheme(id: number): Promise<Theme> {
    const response = await this.api.get(`/api/themes/${id}/`);
    return response.data;
  }

  async createTheme(theme: Partial<Theme>): Promise<Theme> {
    const response = await this.api.post('/api/themes/', theme);
    return response.data;
  }

  async updateTheme(id: number, theme: Partial<Theme>): Promise<Theme> {
    const response = await this.api.put(`/api/themes/${id}/`, theme);
    return response.data;
  }

  async deleteTheme(id: number): Promise<void> {
    await this.api.delete(`/api/themes/${id}/`);
  }

  async getInstruments(): Promise<Instrument[]> {
    const response = await this.api.get('/api/instruments/');
    return response.data.results || response.data;
  }

  async getVersions(): Promise<Version[]> {
    const response = await this.api.get('/api/versions/');
    return response.data.results || response.data;
  }

  async getVersion(id: number): Promise<Version> {
    const response = await this.api.get(`/api/versions/${id}/`);
    return response.data;
  }

  async createVersion(versionData: FormData): Promise<Version> {
    const response = await this.api.post('/api/versions/', versionData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateVersion(id: number, versionData: FormData): Promise<Version> {
    const response = await this.api.put(`/api/versions/${id}/`, versionData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteVersion(id: number): Promise<void> {
    await this.api.delete(`/api/versions/${id}/`);
  }

  async getSheetMusic(): Promise<SheetMusic[]> {
    const response = await this.api.get('/api/sheet-music/');
    return response.data.results || response.data;
  }

  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadMultipleFiles(files: File[], endpoint: string): Promise<any[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;