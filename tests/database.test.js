const Database = require('better-sqlite3');
const {
  crearTabla,
  guardarMovimiento,
  obtenerMovimientos,
  borrarMovimiento,
} = require('../app/database');

// Cada test trabaja con una base de datos en memoria limpia
let db;

beforeEach(() => {
  db = new Database(':memory:');
  crearTabla(db);
});

afterEach(() => {
  db.close();
});

// ─── ESCRITURA ────────────────────────────────────────────────────────────────

test('guardarMovimiento inserta un registro en la tabla', () => {
  guardarMovimiento(db, { concepto: 'Salario', importe: 1500.0, fecha: '2026-02-01' });

  const filas = db.prepare('SELECT * FROM movimientos').all();
  expect(filas).toHaveLength(1);
  expect(filas[0]).toMatchObject({
    concepto: 'Salario',
    importe: 1500.0,
    fecha: '2026-02-01',
  });
});

test('guardarMovimiento inserta varios registros correctamente', () => {
  guardarMovimiento(db, { concepto: 'Salario',  importe: 1500, fecha: '2026-02-01' });
  guardarMovimiento(db, { concepto: 'Alquiler', importe: -800, fecha: '2026-02-05' });
  guardarMovimiento(db, { concepto: 'Supermercado', importe: -120.5, fecha: '2026-02-10' });

  const filas = db.prepare('SELECT * FROM movimientos').all();
  expect(filas).toHaveLength(3);
});

// ─── LECTURA ──────────────────────────────────────────────────────────────────

test('obtenerMovimientos devuelve todos los registros ordenados por id DESC', () => {
  guardarMovimiento(db, { concepto: 'Primero', importe: 100, fecha: '2026-01-01' });
  guardarMovimiento(db, { concepto: 'Segundo', importe: 200, fecha: '2026-01-02' });

  const movimientos = obtenerMovimientos(db);

  expect(movimientos).toHaveLength(2);
  // El más reciente (id mayor) debe aparecer primero
  expect(movimientos[0].concepto).toBe('Segundo');
  expect(movimientos[1].concepto).toBe('Primero');
});

test('obtenerMovimientos devuelve array vacío si no hay datos', () => {
  const movimientos = obtenerMovimientos(db);
  expect(movimientos).toEqual([]);
});

// ─── BORRADO ──────────────────────────────────────────────────────────────────

test('borrarMovimiento elimina únicamente el registro indicado', () => {
  guardarMovimiento(db, { concepto: 'Salario',  importe: 1500, fecha: '2026-02-01' });
  guardarMovimiento(db, { concepto: 'Alquiler', importe: -800, fecha: '2026-02-05' });

  const todos = obtenerMovimientos(db);
  const idAlquiler = todos.find((m) => m.concepto === 'Alquiler').id;

  borrarMovimiento(db, idAlquiler);

  const restantes = obtenerMovimientos(db);
  expect(restantes).toHaveLength(1);
  expect(restantes[0].concepto).toBe('Salario');
});

test('borrarMovimiento deja la tabla vacía si solo había un registro', () => {
  guardarMovimiento(db, { concepto: 'Único', importe: 50, fecha: '2026-02-27' });

  const [{ id }] = obtenerMovimientos(db);
  borrarMovimiento(db, id);

  expect(obtenerMovimientos(db)).toEqual([]);
});
