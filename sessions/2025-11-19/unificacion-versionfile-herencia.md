# Unificación de VersionFile + Sistema de Herencia de Archivos

**Fecha**: 19 de Noviembre de 2025
**Rama**: `feature/unify-versionfile-inheritance`
**Estado**: Backend completo ✅ | Frontend parcial ⚠️

---

## 📋 Resumen

Se implementó un sistema unificado de gestión de archivos musicales que consolida todos los tipos de partituras en el modelo `VersionFile`, reemplazando el modelo `SheetMusic`. Adicionalmente, se agregó un sistema de herencia de archivos multimedia (imágenes y audio) en tres niveles: Theme → Version → VersionFile.

---

## 🎯 Objetivos Alcanzados

### ✅ Backend Completado

1. **Modelo VersionFile Expandido**
   - Agregado `file_type='STANDARD_INSTRUMENT'` para versiones STANDARD
   - Nuevos campos: `sheet_type`, `clef`, `tonalidad_relativa` (migrados desde SheetMusic)
   - Constraints únicos actualizados para soportar STANDARD_INSTRUMENT
   - Validaciones en `clean()` para cada file_type

2. **Sistema de Herencia**
   - **Version model** (`music/models.py:111-129`):
     - `@property get_image()`: retorna self.image o self.theme.image
     - `@property get_audio()`: retorna self.audio_file o self.theme.audio
     - `@property has_own_image`: bool(self.image)
     - `@property has_own_audio`: bool(self.audio_file)

   - **VersionFile model** (`music/models.py:335-350`):
     - `@property get_image()`: retorna self.version.get_image
     - `@property get_audio()`: retorna self.audio o self.version.get_audio
     - `@property has_own_audio`: bool(self.audio)

3. **Serializers Actualizados**
   - `VersionSerializer`: agregado audio_url, has_own_audio, version_files_count, version_files nested
   - `VersionFileSerializer`: agregado sheet_type, clef, tonalidad_relativa, image_url, audio_url, has_own_audio
   - `VersionDetailSerializer`: nested version_files con herencia completa
   - Validaciones extendidas para STANDARD_INSTRUMENT

4. **Migraciones Django**
   - **0010_add_standard_instrument_to_versionfile.py**: Agrega campos nuevos y constraint único
   - **0011_migrate_sheetmusic_to_versionfile.py**: Data migration con reversibilidad

5. **SheetMusic Deprecado**
   - Marcado como DEPRECATED en docstring
   - Mantenido para compatibilidad con DB existente
   - Todas las nuevas partituras STANDARD usan VersionFile

### ✅ Frontend - TypeScript Types

Tipos actualizados en `frontend/src/types/api.ts`:
- `Version`: agregado audio_url, has_own_audio, version_files, version_files_count
- `VersionFile`: agregado STANDARD_INSTRUMENT, sheet_type, clef, tonalidad_relativa, image_url, audio_url, has_own_audio
- `VersionFileCreate`: agregado sheet_type, clef para STANDARD_INSTRUMENT

### ⚠️ Frontend - VersionManager (Pendiente)

**Estado**: No implementado
**Tareas Restantes**:
1. Unificar `StandardSheetForm` para usar VersionFile en lugar de SheetMusic
2. Actualizar lógica de carga de datos para consolidar SheetMusic + VersionFile
3. Agregar visualización de badges de herencia en cards e imágenes
4. Actualizar formularios de upload con indicadores de archivos heredados
5. Testing manual de todas las funcionalidades

---

## 🗂️ Archivos Modificados

### Backend
```
backend/music/models.py                                  (400 líneas modificadas)
backend/music/serializers.py                             (150 líneas modificadas)
backend/music/migrations/0010_*.py                       (nuevo archivo)
backend/music/migrations/0011_*.py                       (nuevo archivo)
backend/CLAUDE.md                                        (documentación actualizada)
```

### Frontend
```
frontend/src/types/api.ts                                (25 líneas modificadas)
```

---

## 📊 Commits Realizados

1. **bd04ff9**: `feat(backend): unify VersionFile model and add inheritance system`
   - Expansión del modelo VersionFile
   - Properties de herencia
   - Migraciones y data migration
   - SheetMusic deprecado

2. **2689ead**: `feat(frontend): update TypeScript types for unified VersionFile`
   - Actualización de interfaces TypeScript
   - Nuevos campos para STANDARD_INSTRUMENT y herencia

---

## 🔄 Estructura de Datos

### Herencia de Archivos (3 niveles)

```
Theme
  ├─ image: "police_woman.jpg"
  └─ audio: "police_woman.mp3"
     ↓ (hereda si Version no tiene propios)
Version
  ├─ image: null → hereda "police_woman.jpg"
  └─ audio_file: "version_dueto.mp3"
     ↓ (hereda imagen de Theme, audio propio)
VersionFile
  ├─ image_url → "police_woman.jpg" (via Version → Theme)
  └─ audio → "versionfile_audio.mp3" (propio) o "version_dueto.mp3" (heredado)
```

### File Types de VersionFile

| file_type | Version Type | Campos Requeridos | Unique Constraint |
|-----------|--------------|-------------------|-------------------|
| STANDARD_INSTRUMENT | STANDARD | instrument, sheet_type, clef | version + instrument + sheet_type |
| DUETO_TRANSPOSITION | DUETO | tuning | version + tuning |
| ENSAMBLE_INSTRUMENT | ENSAMBLE | instrument | version + instrument |
| STANDARD_SCORE | GRUPO_REDUCIDO | - | - |

---

## 🚀 Próximos Pasos

### Prioridad Alta
1. **Correr migraciones en desarrollo**:
   ```bash
   python3 manage.py migrate
   ```
   Esto aplicará las migraciones 0010 y 0011, migrando SheetMusic → VersionFile.

2. **Verificar migración exitosa**:
   ```bash
   python3 manage.py shell
   >>> from music.models import SheetMusic, VersionFile
   >>> SheetMusic.objects.count()  # Debería mostrar el conteo original
   >>> VersionFile.objects.filter(file_type='STANDARD_INSTRUMENT').count()  # Debería ser igual
   ```

3. **Instalar dependencias faltantes** (si httpx u otras están ausentes):
   ```bash
   cd backend
   source venv/bin/activate  # o activar el virtualenv correspondiente
   pip install -r requirements.txt
   ```

### Prioridad Media
4. **Frontend - Unificar VersionManager**
   - Modificar `frontend/src/components/managers/VersionManager.tsx`
   - Reemplazar lógica de SheetMusic por VersionFile en StandardSheetForm
   - Consolidar la lista de archivos para mostrar todos los VersionFiles
   - Agregar indicadores visuales de herencia (badges "Heredada del tema")

5. **Testing E2E**:
   - Crear tema con imagen/audio
   - Crear version STANDARD sin imagen → verificar herencia
   - Subir VersionFile con file_type='STANDARD_INSTRUMENT' → verificar campos
   - Verificar que todos los tipos de version funcionen correctamente

### Prioridad Baja
6. **Optimizaciones**:
   - Agregar índices de BD si hay queries lentas
   - Lazy loading de imágenes heredadas en frontend
   - Caching de properties si es necesario

7. **Limpieza**:
   - Una vez validado todo, considerar eliminar modelo SheetMusic en una migración futura
   - Actualizar tests unitarios del backend
   - Agregar tests de frontend para VersionFile unificado

---

## 📝 Notas Técnicas

### Transposición Automática
La funcionalidad de transposición automática en `music/utils.py:calculate_relative_tonality()` sigue funcionando igual para VersionFile con file_type='STANDARD_INSTRUMENT'.

### Compatibilidad con Jam de Vientos
El sistema de herencia permite que jam-de-vientos.com consuma las imágenes/audio heredados vía `image_url` y `audio_url` en los serializers, sin cambios en el frontend de Jam.

### Reversibilidad de Migración
La migración 0011 incluye `reverse_code` que elimina todos los VersionFile con `file_type='STANDARD_INSTRUMENT'` creados durante la migración, permitiendo rollback seguro.

---

## ⚠️ Consideraciones Importantes

1. **Backup de Base de Datos**: Hacer backup antes de correr migraciones en producción
2. **Testing Exhaustivo**: Verificar TODOS los flujos antes de mergear a main
3. **Frontend Incompleto**: El VersionManager aún usa SheetMusic en algunos lugares, requiere actualización
4. **Performance**: Las properties de herencia son computadas, no hay caching actualmente (considerar si hay problemas)

---

## 📚 Documentación Relacionada

- Backend CLAUDE.md: `backend/CLAUDE.md` (actualizado con nueva arquitectura)
- Root CLAUDE.md: `/CLAUDE.md` (requiere actualización)
- Migration files: `backend/music/migrations/0010_*.py`, `0011_*.py`
- TypeScript types: `frontend/src/types/api.ts`

---

**Estado Final**: Backend production-ready. Frontend requiere completar VersionManager para finalizar unificación.
