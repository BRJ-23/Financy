/**
 * Capa de acceso a datos — independiente de Electron.
 * Se importa desde main.js y desde los tests.
 */

function crearTabla(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concepto TEXT NOT NULL,
      importe REAL NOT NULL,
      fecha TEXT NOT NULL
    )
  `);
}

function guardarMovimiento(db, datos) {
  const stmt = db.prepare(
    'INSERT INTO movimientos (concepto, importe, fecha) VALUES (?, ?, ?)'
  );
  stmt.run(datos.concepto, datos.importe, datos.fecha);
}

function obtenerMovimientos(db) {
  const stmt = db.prepare('SELECT * FROM movimientos ORDER BY id DESC');
  return stmt.all();
}

function borrarMovimiento(db, id) {
  const stmt = db.prepare('DELETE FROM movimientos WHERE id = ?');
  stmt.run(id);
}

module.exports = { crearTabla, guardarMovimiento, obtenerMovimientos, borrarMovimiento };
