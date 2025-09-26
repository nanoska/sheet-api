# frontend

Dashboard administrativo para gestión de partituras desarrollado en React + TypeScript.

## Características

- **Autenticación**: Sistema de login con tokens JWT
- **Dashboard Administrativo**: Interfaz intuitiva para gestión de contenido
- **Gestión de Temas**: Visualización y administración de temas musicales
- **Subida de Archivos**: Contenedor drag-and-drop para múltiples archivos
- **Responsive**: Interfaz adaptada para móviles y escritorio

## Tecnologías

- React 19.1.1
- TypeScript
- React Router
- Axios
- React Dropzone

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar la aplicación:
```bash
npm start
```

## Variables de Entorno

- `REACT_APP_API_URL`: URL base de la API (por defecto: http://localhost:8000/api/v1)

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── Login.tsx        # Componente de login
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── FileUpload.tsx   # Subida de archivos drag-and-drop
│   ├── ThemeList.tsx    # Lista de temas musicales
│   └── ProtectedRoute.tsx # Rutas protegidas
├── context/             # Contextos React
│   └── AuthContext.tsx  # Contexto de autenticación
├── services/            # Servicios API
│   └── api.ts          # Cliente API con Axios
├── types/               # Tipos TypeScript
│   └── api.ts          # Tipos de la API
└── App.tsx             # Componente principal
```

## API Integration

La aplicación está diseñada para integrarse con la API de Django Rest Framework del proyecto backend. Incluye:

- Autenticación con tokens JWT
- Gestión automática de refresh tokens
- Endpoints para temas, instrumentos, versiones y partituras
- Subida de archivos multimedia

## Comandos Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm test`: Ejecuta los tests
- `npm run eject`: Expone la configuración de Webpack

## Funcionalidades Implementadas

### ✅ Autenticación
- Login con credenciales
- Manejo de tokens JWT
- Rutas protegidas
- Logout

### ✅ Dashboard
- Navegación por pestañas
- Lista de temas musicales
- Interfaz responsive

### ✅ Subida de Archivos
- Drag and drop para múltiples archivos
- Preview de imágenes
- Progreso de subida
- Soporte para audio, imágenes, PDF y archivos MuseScore

## Próximas Funcionalidades

- Gestión completa de temas (CRUD)
- Administración de instrumentos
- Gestión de versiones
- Visualización de partituras
- Búsqueda y filtros avanzados

---

*Este proyecto fue creado con [Create React App](https://github.com/facebook/create-react-app).*
