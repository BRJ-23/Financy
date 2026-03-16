const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// Modo test
const isTestMode = process.env.NODE_ENV === 'test';

const dbPath = isTestMode ? ':memory:' : path.join(app.getPath('userData'), 'finanzas.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concepto TEXT NOT NULL,
    importe REAL NOT NULL,
    fecha TEXT NOT NULL
  )
`);

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'app','preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('app/index.html');
  // win.webContents.openDevTools(); // Ver la consola de errores
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('guardar-movimiento', (event, datos) => {
  const stmt = db.prepare('INSERT INTO movimientos (concepto, importe, fecha) VALUES (?, ?, ?)');
  stmt.run(datos.concepto, datos.importe, datos.fecha);
});

ipcMain.handle('obtener-movimientos', () => {
  const stmt = db.prepare('SELECT * FROM movimientos ORDER BY id DESC');
  return stmt.all();
});