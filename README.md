# Administracion

Aplicación de escritorio para gestionar movimientos financieros personales, construida con **Electron** y **better-sqlite3**.

---

## Requisitos

- **Node.js** >= 24.0.0
- **npm** >= 10

---

## Instalación

```bash
npm install
```

`postinstall` ejecuta `electron-rebuild` automáticamente para compilar `better-sqlite3` con el ABI de Electron.

---

## Uso

```bash
# Lanzar la aplicación
npm start

# Ejecutar los tests
npm test
```

---

## Estructura del proyecto

```
app/
  database.js   # Capa de acceso a datos (independiente de Electron)
  main.js       # Proceso principal de Electron
  preload.js    # Puente seguro entre main y renderer
  renderer.js   # Lógica del proceso de renderizado
  logica.js     # Lógica de negocio
  index.html    # Interfaz de usuario
tests/
  database.test.js     # Tests de escritura, lectura y borrado en BD
  environment.test.js  # Tests de verificación del entorno de ejecución
```

---

## Arquitectura

### Capa de datos (`app/database.js`)

La lógica de acceso a la base de datos está **desacoplada de Electron**, lo que permite testearla directamente con Jest sin necesidad de levantar una ventana.

| Función | Descripción |
|---|---|
| `crearTabla(db)` | Crea la tabla `movimientos` si no existe |
| `guardarMovimiento(db, datos)` | Inserta un nuevo movimiento `{concepto, importe, fecha}` |
| `obtenerMovimientos(db)` | Devuelve todos los movimientos ordenados por `id DESC` |
| `borrarMovimiento(db, id)` | Elimina el movimiento con el `id` indicado |

### Base de datos

SQLite mediante `better-sqlite3`. La tabla principal:

```sql
CREATE TABLE movimientos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  concepto TEXT    NOT NULL,
  importe  REAL    NOT NULL,
  fecha    TEXT    NOT NULL
)
```

---

## Tests

Los tests se ejecutan **dentro del proceso de Electron** (`ELECTRON_RUN_AS_NODE=1`) para garantizar que el ABI de Node.js es idéntico al de producción y evitar conflictos con módulos nativos.

### `tests/database.test.js` (6 tests)

Cada test usa una base de datos SQLite **en memoria** creada limpia en `beforeEach` y cerrada en `afterEach`.

| Bloque | Test |
|---|---|
| Escritura | Inserta 1 registro correctamente |
| Escritura | Inserta N registros correctamente |
| Lectura | Devuelve registros ordenados por `id DESC` |
| Lectura | Devuelve array vacío si no hay datos |
| Borrado | Borra únicamente el registro indicado |
| Borrado | Deja la tabla vacía al borrar el único registro |

### `tests/environment.test.js` (3 tests)

Verifica que el entorno de tests es siempre compatible con Electron.

| Test | Qué comprueba |
|---|---|
| ABI correcto | `process.versions.modules === 143` (Electron 40) |
| Versión de Node.js | Major version == 24 |
| Proceso Electron | `process.versions.electron` está definido |

> Si estos tests fallan significa que Jest se está ejecutando con el Node.js del sistema en lugar del de Electron.

---

## Dependencias

| Paquete | Tipo | Uso |
|---|---|---|
| `better-sqlite3` | producción | Base de datos SQLite síncrona |
| `electron` | dev | Framework de escritorio |
| `electron-rebuild` | dev | Recompila módulos nativos para el ABI de Electron |
| `jest` | dev | Framework de tests |
| `cross-env` | dev | Variables de entorno multiplataforma en scripts npm |
