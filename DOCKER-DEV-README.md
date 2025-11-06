# Docker Development Setup

## Configuración Docker para Desarrollo

Este proyecto incluye configuración Docker optimizada para desarrollo con hot-reload en backend y frontend.

### Archivos de Configuración

- `docker-compose.yml` - Configuración para producción (gunicorn + nginx)
- `docker-compose.dev.yml` - Configuración para desarrollo (runserver + npm start)
- `backend/Dockerfile` - Imagen para producción
- `frontend/Dockerfile` - Imagen para producción (multi-stage build)
- `frontend/Dockerfile.dev` - Imagen para desarrollo con hot-reload

### Comandos para Desarrollo

#### 1. Iniciar los servicios en modo desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build
```

Este comando:
- Levanta PostgreSQL en puerto 5432
- Levanta Django en puerto 8000 con `runserver` (hot-reload automático)
- Levanta React en puerto 3000 con `npm start` (hot-reload automático)

#### 2. Ver logs en tiempo real

```bash
docker compose -f docker-compose.dev.yml logs -f
```

O logs de un servicio específico:
```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

#### 3. Ejecutar comandos en el backend

**Crear migraciones:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
```

**Aplicar migraciones:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

**Crear superusuario:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

**Django shell:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py shell
```

**Ejecutar tests:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py test
```

#### 4. Ejecutar comandos en el frontend

**Instalar nuevas dependencias:**
```bash
docker compose -f docker-compose.dev.yml exec frontend npm install <paquete>
```

**Ejecutar tests:**
```bash
docker compose -f docker-compose.dev.yml exec frontend npm test
```

#### 5. Detener los servicios

```bash
docker compose -f docker-compose.dev.yml down
```

Detener y eliminar volúmenes (borra la base de datos):
```bash
docker compose -f docker-compose.dev.yml down -v
```

### Características del Modo Desarrollo

#### Backend (Django)
- ✅ Hot-reload automático al editar archivos Python
- ✅ Volumen montado: `./backend` → `/app`
- ✅ Variables de entorno desde `.env`
- ✅ Puerto 8000 expuesto
- ✅ Migraciones automáticas al inicio

#### Frontend (React)
- ✅ Hot-reload automático al editar archivos JS/TS/CSS
- ✅ Volumen montado: `./frontend` → `/app`
- ✅ `node_modules` persistente dentro del contenedor
- ✅ Puerto 3000 expuesto
- ✅ Variables de entorno de React

#### Base de Datos (PostgreSQL)
- ✅ Volumen persistente para datos
- ✅ Puerto 5432 expuesto para debugging con herramientas externas
- ✅ Credenciales: user=sheetmusic, password=sheetmusic, db=sheetmusic

### Acceso a los Servicios

Una vez iniciados los contenedores:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/
- **API Documentation (Swagger)**: http://localhost:8000/swagger/
- **API Documentation (ReDoc)**: http://localhost:8000/redoc/
- **PostgreSQL**: localhost:5432

### Troubleshooting

#### El frontend no se actualiza automáticamente
- Verifica que `CHOKIDAR_USEPOLLING=true` esté en el docker-compose.dev.yml
- Reinicia el contenedor frontend

#### Error de conexión a la base de datos
- Verifica que el servicio `db` esté corriendo
- Espera unos segundos para que PostgreSQL termine de iniciar

#### Puerto ocupado
- Verifica que no tengas servicios corriendo en puertos 3000, 8000 o 5432
- Cambia los puertos en docker-compose.dev.yml si es necesario

#### Cambios en package.json no se reflejan
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

#### Resetear la base de datos
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Comandos Útiles

**Rebuild completo (limpiar cache):**
```bash
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

**Ver contenedores activos:**
```bash
docker compose -f docker-compose.dev.yml ps
```

**Entrar a un contenedor:**
```bash
docker compose -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.dev.yml exec frontend sh
docker compose -f docker-compose.dev.yml exec db psql -U sheetmusic
```

### Modo Producción

Para probar la configuración de producción:
```bash
docker compose -f docker-compose.yml up --build
```

Esto usará gunicorn para el backend y nginx para servir el frontend construido.
