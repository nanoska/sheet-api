# Sheet-API

Sistema completo de gestión de partituras musicales para bandas de viento, con transposición automática de instrumentos y gestión de eventos/repertorios.

**Stack**: Django 4.2 + DRF + React 19 + TypeScript + PostgreSQL

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Modelos de Datos](#-modelos-de-datos)
- [Sistema de Transposición](#-sistema-de-transposición)
- [API Endpoints](#-api-endpoints)
- [Desarrollo](#-desarrollo)
- [Docker](#-docker)
- [Aplicaciones Consumidoras](#-aplicaciones-consumidoras)
- [Documentación Completa](#-documentación-completa)

---

## ✨ Características

### Core

- 🎵 Gestión de temas musicales con metadatos (título, artista, tonalidad, audio, imagen)
- 📝 Múltiples versiones de arreglos (Standard, Ensamble, Dueto, Grupo Reducido)
- 🎺 Catálogo de instrumentos con transposiciones (Bb, Eb, F, C)
- 📄 Partituras con **cálculo automático de tonalidad relativa**
- 🎼 Soporte para diferentes claves (Sol, Fa) y tipos de parte (Melodía, Armonía, Bajo)

### Eventos y Repertorios

- 📅 Gestión de eventos musicales (conciertos, ensayos, grabaciones, talleres)
- 📍 Locaciones con capacidad y datos de contacto
- 🎭 Repertorios ordenados de versiones para eventos
- 🌐 Endpoints públicos para apps externas (jam-de-vientos)

### Archivos

- 🖼️ Imágenes de temas y versiones
- 🎧 Audio de referencia (tema original y versiones)
- 📁 Archivos MuseScore (.mscz, .mscx)
- 📄 PDFs de partituras organizados por tema

### Administración

- 🔐 Autenticación JWT
- 👥 Permisos granulares (IsAuthenticated, IsAdminUser)
- 📊 Django Admin personalizado con dark theme
- 📖 Documentación interactiva (Swagger/ReDoc)

---

## 🏗️ Arquitectura

### Full-Stack Structure

```
sheet-api/
├── backend/               # Django REST API
│   ├── music/            # App: temas, versiones, instrumentos, partituras
│   ├── events/           # App: eventos, locaciones, repertorios
│   ├── sheetmusic_api/   # Configuración Django
│   └── media/            # Archivos subidos (PDFs, audio, imágenes)
│
└── frontend/             # React Admin Dashboard
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── types/
    └── public/
```

### Aplicaciones Consumidoras

```
sheet-api (Backend Central)
    ↓ REST API
jam-de-vientos (Next.js) - Eventos públicos y descarga de partituras
```

**Nota**: `music-learning-app` y `empiv-web` son independientes (no consumen sheet-api actualmente).

---

## 📊 Modelos de Datos

### Jerarquía de Modelos

```
Theme (Tema musical)
│
├─1:N─> Version (Arreglo/Versión)
│       │ type: STANDARD | ENSAMBLE | DUETO | GRUPO_REDUCIDO
│       │
│       ├─1:N─> SheetMusic (Partitura individual)
│       │       │ type: MELODIA_PRINCIPAL | MELODIA_SECUNDARIA | ARMONIA | BAJO
│       │       │ clef: SOL | FA
│       │       │ tonalidad_relativa: AUTO-CALCULADO
│       │       │
│       │       └─N:1─> Instrument
│       │               afinacion: Bb | Eb | F | C | etc.
│       │
│       └─M:N─> Repertoire (through RepertoireVersion)
│               │
│               └─1:N─> Event
│                       │ is_public: true/false
│                       │
│                       └─N:1─> Location
```

### App: music/

#### **Theme** (Tema Musical)
```python
title            CharField(200)      # "One Step Beyond"
artist           CharField(200)      # "Madness"
tonalidad        CharField(10)       # "Cm" (concert pitch)
description      TextField
image            ImageField          # Carátula
audio            FileField           # Grabación de referencia
created_at       DateTimeField
updated_at       DateTimeField
```

**Tonalidades soportadas**: 24 opciones (C, C#, D, ..., B + variantes menores: Cm, C#m, ..., Bm)

#### **Instrument** (Instrumento)
```python
name             CharField(100)      # "Trompeta en Bb"
family           CharField(20)       # VIENTO_MADERA | VIENTO_METAL | PERCUSION
afinacion        CharField(10)       # Bb | Eb | F | C | G | D | A | E | NONE
created_at       DateTimeField
```

**Ejemplos de instrumentos**:
- Trompeta en Bb (afinacion='Bb')
- Saxo Alto en Eb (afinacion='Eb')
- Trompa en F (afinacion='F')
- Tuba (afinacion='C', concert pitch)

#### **Version** (Arreglo de un Tema)
```python
theme            ForeignKey(Theme)
title            CharField(300)      # Título específico (opcional)
type             CharField(20)       # STANDARD | ENSAMBLE | DUETO | GRUPO_REDUCIDO
image            ImageField
audio_file       FileField
mus_file         FileField          # MuseScore (.mscz, .mscx)
notes            TextField
created_at       DateTimeField
updated_at       DateTimeField
```

**Formato "Standard"**: `type='STANDARD'` representa un arreglo completo para banda de vientos con todas las secciones (melodía, armonía, bajo).

#### **SheetMusic** (Partitura Individual)
```python
version          ForeignKey(Version)
instrument       ForeignKey(Instrument)
type             CharField(20)       # MELODIA_PRINCIPAL | MELODIA_SECUNDARIA | ARMONIA | BAJO
clef             CharField(10)       # SOL | FA
tonalidad_relativa CharField(10)    # AUTO-CALCULADO (ej: "Dm")
file             FileField          # PDF de la partitura
created_at       DateTimeField
updated_at       DateTimeField

# Constraint: unique_together = ['version', 'instrument', 'type']
```

**⚠️ Campo Especial**: `tonalidad_relativa` se calcula automáticamente en `SheetMusicViewSet.perform_create()` usando `calculate_relative_tonality()`.

### App: events/

#### **Location** (Locación)
```python
name             CharField(200)      # "Centro Cultural Konex"
address          TextField
city             CharField(100)
postal_code      CharField(10)
country          CharField(100)      # default="Argentina"
capacity         PositiveIntegerField
contact_email    EmailField
contact_phone    CharField(20)
website          URLField
notes            TextField
is_active        BooleanField        # Soft delete
created_at       DateTimeField
updated_at       DateTimeField
```

#### **Repertoire** (Repertorio)
```python
name             CharField(200)      # "Repertorio Jam - Nov 2025"
description      TextField
versions         ManyToManyField(Version, through='RepertoireVersion')
is_active        BooleanField        # Soft delete
created_at       DateTimeField
updated_at       DateTimeField
```

#### **RepertoireVersion** (Tabla Intermedia M:N)
```python
repertoire       ForeignKey(Repertoire)
version          ForeignKey(Version)
order            PositiveIntegerField  # Orden en el repertoire
notes            TextField
created_at       DateTimeField

# Constraint: unique_together = ('repertoire', 'version')
```

#### **Event** (Evento)
```python
title            CharField(200)
event_type       CharField(20)       # CONCERT | REHEARSAL | RECORDING | WORKSHOP | OTHER
status           CharField(20)       # DRAFT | CONFIRMED | CANCELLED | COMPLETED
description      TextField
start_datetime   DateTimeField
end_datetime     DateTimeField
location         ForeignKey(Location, SET_NULL)
repertoire       ForeignKey(Repertoire, SET_NULL)
is_public        BooleanField        # Visible en jam-de-vientos
max_attendees    PositiveIntegerField
price            DecimalField        # default=0 (gratis)
created_at       DateTimeField
updated_at       DateTimeField

# Properties: is_upcoming, is_ongoing
```

**Validaciones**:
- `start_datetime < end_datetime`
- No se puede crear evento en el pasado

---

## 🎼 Sistema de Transposición

### Lógica Matemática

La transposición automática se basa en aritmética modular 12 (12 semitonos en una octava).

**Archivo**: `music/utils.py`

```python
def calculate_relative_tonality(theme_tonality, instrument_tuning):
    """
    Calcula la tonalidad escrita para un instrumento transpositor.

    Ejemplo: Theme en Cm + Trompeta Bb
    1. Cm → 0 semitonos (menor)
    2. Bb → +2 semitonos de transposición
    3. (0 + 2) % 12 = 2 → D
    4. Preserva modo menor → Dm
    """
    TONALITY_MAP = {
        'C': 0, 'Cm': 0, 'C#': 1, 'C#m': 1,
        'D': 2, 'Dm': 2, ...  # Total: 24 tonalidades
    }

    TRANSPOSITION_MAP = {
        'C': 0,  'Bb': 2,  'Eb': 9,  'F': 7,
        'G': 5,  'D': 10,  'A': 3,   'E': 8,
        'NONE': 0
    }

    theme_semitones = TONALITY_MAP[theme_tonality]
    transposition_semitones = TRANSPOSITION_MAP[instrument_tuning]

    result_semitones = (theme_semitones + transposition_semitones) % 12

    # Preserva mayor/menor
    is_minor = theme_tonality.endswith('m')
    tonality_name = SEMITONES_TO_TONALITY[result_semitones]

    return tonality_name + 'm' if is_minor else tonality_name
```

### Ejemplos de Transposición

| Tema (Concert) | Instrumento | Transposición | Resultado Escrito |
|----------------|-------------|---------------|-------------------|
| C major | Trompeta Bb | +2 semitonos | **D major** |
| C major | Saxo Alto Eb | +9 semitonos | **A major** |
| C major | Trompa F | +7 semitonos | **G major** |
| Cm minor | Trompeta Bb | +2 semitonos | **Dm minor** |
| Cm minor | Saxo Alto Eb | +9 semitonos | **Am minor** |

### Ejemplo Real: "One Step Beyond"

```
Theme: One Step Beyond (Madness)
├── tonalidad: Cm (concert pitch)
│
└── Version: type='STANDARD'
    ├── Trompeta Bb + MELODIA_PRINCIPAL
    │   └── tonalidad_relativa: Dm (auto-calculado: Cm + 2 = Dm)
    │
    ├── Saxo Alto Eb + MELODIA_PRINCIPAL
    │   └── tonalidad_relativa: Am (auto-calculado: Cm + 9 = Am)
    │
    └── Tuba C + BAJO (clave FA)
        └── tonalidad_relativa: Cm (sin transposición)
```

### Auto-Sugerencia de Clave

```python
def get_clef_for_instrument(instrument_name, instrument_family):
    """Sugiere clave según instrumento"""
    bass_clef_instruments = [
        'tuba', 'fagot', 'trombón', 'bombardino',
        'contrabajo', 'trombone', 'bassoon', 'euphonium'
    ]

    if any(name in instrument_name.lower() for name in bass_clef_instruments):
        return 'FA'
    return 'SOL'
```

---

## 🔌 API Endpoints

**Base URL**: `/api/v1/`

**Autenticación**: JWT Bearer Token (excepto endpoints `jamdevientos/`)

### Autenticación

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

# Response:
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Uso**:
```http
GET /api/v1/themes/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Music App

#### Themes
```http
GET    /api/v1/themes/                  # Listar temas (paginado, 20/página)
POST   /api/v1/themes/                  # Crear tema
GET    /api/v1/themes/{id}/             # Detalle de tema
PUT    /api/v1/themes/{id}/             # Actualizar tema completo
PATCH  /api/v1/themes/{id}/             # Actualizar tema parcial
DELETE /api/v1/themes/{id}/             # Eliminar tema
GET    /api/v1/themes/{id}/versions/    # Versiones de un tema
```

**Query Params**:
- `?tonalidad=Cm` - Filtrar por tonalidad
- `?artist=Madness` - Filtrar por artista
- `?search=ska` - Buscar en title, artist, description
- `?ordering=-created_at` - Ordenar (ej: más recientes primero)

#### Instruments
```http
GET    /api/v1/instruments/
POST   /api/v1/instruments/
GET    /api/v1/instruments/{id}/
PUT    /api/v1/instruments/{id}/
DELETE /api/v1/instruments/{id}/
GET    /api/v1/instruments/{id}/sheet_music/
```

**Query Params**:
- `?family=VIENTO_METAL`
- `?afinacion=Bb`
- `?search=trompeta`

#### Versions
```http
GET    /api/v1/versions/                # List (serializer: VersionSerializer)
GET    /api/v1/versions/{id}/           # Detail (serializer: VersionDetailSerializer con sheet_music anidado)
POST   /api/v1/versions/
PUT    /api/v1/versions/{id}/
DELETE /api/v1/versions/{id}/
GET    /api/v1/versions/{id}/sheet_music/
```

**Query Params**:
- `?theme=1`
- `?type=STANDARD`
- `?search=madness`

#### SheetMusic
```http
GET    /api/v1/sheet-music/
POST   /api/v1/sheet-music/             # ⚡ Auto-calcula tonalidad_relativa
GET    /api/v1/sheet-music/{id}/
PUT    /api/v1/sheet-music/{id}/        # ⚡ Recalcula tonalidad_relativa
DELETE /api/v1/sheet-music/{id}/
```

**Query Params**:
- `?version=1`
- `?instrument=1`
- `?type=MELODIA_PRINCIPAL`
- `?clef=FA`
- `?tonalidad_relativa=Dm`

**POST Example**:
```http
POST /api/v1/sheet-music/
Content-Type: multipart/form-data

version: 1
instrument: 1
type: "MELODIA_PRINCIPAL"
clef: "SOL"  (opcional, se auto-sugiere)
file: [PDF binary]

# Response incluye tonalidad_relativa auto-calculado:
{
  "id": 1,
  "version": 1,
  "instrument": 1,
  "tonalidad_relativa": "Dm",  ← AUTO-CALCULADO
  "file": "http://localhost:8000/media/one_step_beyond_standard_trompeta_bb_melodia.pdf",
  ...
}
```

### Events App

#### Events
```http
GET    /api/v1/events/events/
POST   /api/v1/events/events/
GET    /api/v1/events/events/{id}/
PUT    /api/v1/events/events/{id}/
DELETE /api/v1/events/events/{id}/
POST   /api/v1/events/events/{id}/duplicate/   # Clonar evento
POST   /api/v1/events/events/{id}/cancel/      # Cancelar evento
POST   /api/v1/events/events/{id}/complete/    # Marcar completado
```

**Query Params**:
- `?start_date=2025-11-01`
- `?end_date=2025-12-31`
- `?upcoming=true`
- `?ongoing=true`

#### Locations
```http
GET    /api/v1/events/locations/
POST   /api/v1/events/locations/        # IsAdminUser solamente
GET    /api/v1/events/locations/{id}/
PUT    /api/v1/events/locations/{id}/   # IsAdminUser solamente
DELETE /api/v1/events/locations/{id}/   # IsAdminUser solamente
```

#### Repertoires
```http
GET    /api/v1/events/repertoires/
POST   /api/v1/events/repertoires/
GET    /api/v1/events/repertoires/{id}/
PUT    /api/v1/events/repertoires/{id}/
DELETE /api/v1/events/repertoires/{id}/  # Soft delete (is_active=False)
```

### JamDeVientos Public Endpoints (Sin Autenticación)

```http
GET /api/v1/events/jamdevientos/carousel/
# Próximos 10 eventos públicos para carousel

GET /api/v1/events/jamdevientos/upcoming/
# Todos los eventos públicos próximos con repertorios completos

GET /api/v1/events/jamdevientos/{id}/
# Detalle de evento público

GET /api/v1/events/jamdevientos/{id}/repertoire/
# Repertorio de un evento
```

**Ejemplo Response** (`/jamdevientos/upcoming/`):
```json
[
  {
    "id": 1,
    "title": "Jam de Vientos - Noche de Ska",
    "event_type": "CONCERT",
    "start_datetime": "2025-11-15T20:00:00Z",
    "location": {
      "name": "Centro Cultural Konex",
      "city": "Buenos Aires"
    },
    "repertoire": {
      "name": "Repertorio Nov 2025",
      "versions": [
        {
          "id": 1,
          "theme_title": "One Step Beyond",
          "artist": "Madness",
          "tonalidad": "Cm",
          "order": 1,
          "sheet_music_count": 5,
          "audio": "http://.../audio.mp3",
          "image": "http://.../image.jpg"
        }
      ]
    }
  }
]
```

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

---

## 🛠️ Desarrollo

### Requisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (o SQLite para desarrollo)
- Docker + Docker Compose (opcional)

### Setup Local (Sin Docker)

#### Backend

```bash
cd backend/

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Cargar instrumentos iniciales (opcional)
python manage.py loaddata instruments.json

# Correr servidor
python manage.py runserver
# Backend disponible en: http://localhost:8000
```

#### Frontend

```bash
cd frontend/

# Instalar dependencias
npm install

# Configurar .env.local
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env.local

# Correr servidor de desarrollo
npm start
# Frontend disponible en: http://localhost:3000
```

### Comandos Útiles

**Backend**:
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Django shell
python manage.py shell

# Tests
python manage.py test

# Colectar archivos estáticos (producción)
python manage.py collectstatic
```

**Frontend**:
```bash
# Desarrollo
npm start

# Build producción
npm run build

# Tests
npm test

# Linting
npm run lint
```

---

## 🐳 Docker

### Quick Start

```bash
# Levantar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| backend | 8000 | Django API |
| frontend | 3000 | React Admin Dashboard |
| db | 5432 | PostgreSQL |

### Comandos Docker

```bash
# Rebuild completo limpio
docker compose down -v  # -v elimina volúmenes
docker compose build --no-cache
docker compose up -d

# Ejecutar comandos en backend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell

# Ver logs específicos
docker compose logs -f backend

# Backup base de datos
docker compose exec db pg_dump -U sheetapi -d sheetapi_db > backup.sql

# Restore base de datos
docker compose exec -T db psql -U sheetapi -d sheetapi_db < backup.sql
```

### Variables de Entorno

**Backend (.env)**:
```bash
DEBUG=True
SECRET_KEY=tu-secret-key
DATABASE_URL=postgresql://sheetapi:sheetapi@db:5432/sheetapi_db
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
ALLOWED_HOSTS=localhost,127.0.0.1,backend
```

**Frontend (.env.local)**:
```bash
# Desarrollo local
REACT_APP_API_URL=http://localhost:8000/api/v1

# Desarrollo Docker
REACT_APP_API_URL=http://backend:8000/api/v1
```

---

## 🌐 Aplicaciones Consumidoras

### jam-de-vientos (Next.js)

**Repositorio**: `jam-de-vientos/`

**Dependencia**: Sheet-API backend

**Uso**:
- Consume endpoints `/api/v1/events/jamdevientos/` (sin autenticación)
- Muestra carousel de próximos eventos públicos
- Permite descarga de partituras por instrumento (en desarrollo)

**Levantar con Docker**:
```bash
# Terminal 1: Sheet-API backend
cd sheet-api && docker compose up -d backend db

# Terminal 2: Jam de Vientos frontend
cd ../jam-de-vientos && docker compose up -d frontend

# Acceso:
# - Jam de Vientos: http://localhost:3001
# - Sheet-API Backend: http://localhost:8000
```

Ver `docker/README.md` para más escenarios de orquestación.

---

## 📚 Documentación Completa

### Documentos Técnicos Detallados

- **`sessions/2025-10-24/architecture-analysis.md`**: Análisis completo de arquitectura y solidez del backend
- **`sessions/2025-10-24/models-final.md`**: Especificación exhaustiva de todos los modelos Django con ejemplos
- **`sessions/2025-10-24/api-contracts.md`**: Contratos API completos con schemas request/response
- **`docker/README.md`**: Guías de orquestación Docker para todos los escenarios de trabajo

### Recursos Adicionales

- **Django Admin**: http://localhost:8000/admin
- **Swagger API Docs**: http://localhost:8000/swagger/
- **ReDoc API Docs**: http://localhost:8000/redoc/
- **Repositorio GitHub**: [pendiente de push]

---

## 🧪 Testing

### Backend Tests

```bash
cd backend/

# Todos los tests
python manage.py test

# App específica
python manage.py test music
python manage.py test events

# Test específico
python manage.py test music.tests.TestThemeModel

# Con cobertura (si pytest instalado)
pytest --cov=music --cov=events
```

### Frontend Tests

```bash
cd frontend/

# Todos los tests
npm test

# Con cobertura
npm test -- --coverage --passWithNoTests

# Tests específicos
npm test -- --testPathPattern=Login
```

---

## 🚀 Deployment

### Backend (Django)

```bash
# Colectar archivos estáticos
python manage.py collectstatic --noinput

# Usar gunicorn en producción (ya incluido en Docker)
gunicorn sheetmusic_api.wsgi:application --bind 0.0.0.0:8000

# Variables de entorno producción
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=key-super-segura-generada
```

### Frontend (React)

```bash
# Build optimizado
npm run build

# Servir con nginx (ya incluido en Docker)
# Los archivos van a /app/build/
```

---

## 🤝 Contribuir

### Flujo de Trabajo

1. Fork el repositorio
2. Crear branch: `git checkout -b feat/nueva-funcionalidad`
3. Commit cambios: `git commit -m "feat: agregar nueva funcionalidad"`
4. Push: `git push origin feat/nueva-funcionalidad`
5. Abrir Pull Request

### Convenciones de Código

- **Backend**: PEP 8 (Python), usar Black formatter
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branches**: `feat/`, `fix/`, `docs/`, `chore/`

---

## 📝 Changelog

### [Unreleased]

#### Documentación
- Documentación completa de arquitectura y modelos
- Guías Docker multi-aplicación
- Contratos API con ejemplos

#### Pendiente (Próxima Versión)
- Endpoints de descarga de PDFs para jam-de-vientos
- Campo `default_clef` en modelo Instrument
- Validadores de archivos subidos
- Campo `is_visible` en modelo SheetMusic

---

## 📄 Licencia

[Especificar licencia]

---

## 👥 Autores

- **Nahue** - Desarrollo principal

---

## 🙏 Agradecimientos

- Músicos y directores de la Jam de Vientos por feedback
- Comunidad Django y React por excelentes herramientas

---

*Última actualización: 2025-10-24*
