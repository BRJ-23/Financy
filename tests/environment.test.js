/**
 * Verifica que el entorno de tests usa el mismo Node.js/ABI que Electron.
 * Si este test falla significa que better-sqlite3 u otros módulos nativos
 * pueden dar conflictos de versión al ejecutar npm start.
 */

const ELECTRON_ABI = 143; // ABI de Electron 40.x (Node.js 24.x embebido)
const ELECTRON_NODE_MAJOR = 24;

test('el ABI de Node.js coincide con el de Electron', () => {
  const currentABI = parseInt(process.versions.modules, 10);
  expect(currentABI).toBe(ELECTRON_ABI);
});

test('la versión mayor de Node.js es la misma que la de Electron', () => {
  const currentMajor = parseInt(process.versions.node.split('.')[0], 10);
  expect(currentMajor).toBe(ELECTRON_NODE_MAJOR);
});

test('los tests se ejecutan dentro del proceso de Electron', () => {
  // Cuando se lanza con ELECTRON_RUN_AS_NODE=1, Electron expone process.type
  // Si estuviéramos en Node.js del sistema, process.type sería undefined
  expect(process.versions.electron).toBeDefined();
});
