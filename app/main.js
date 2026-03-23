const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// Modo test
const isTestMode = process.env.NODE_ENV === 'test';

const dbPath = isTestMode ? ':memory:' : path.join(app.getPath('userData'), 'finanzas.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS years (
    year INTEGER PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS incomes (
    id TEXT PRIMARY KEY,
    year INTEGER,
    month TEXT,
    amount REAL,
    description TEXT,
    dest TEXT,
    destLabel TEXT
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    year INTEGER,
    month TEXT,
    type TEXT,
    amount REAL,
    description TEXT,
    category TEXT,
    goalId TEXT
  );
  CREATE TABLE IF NOT EXISTS investment_goals (
    id TEXT PRIMARY KEY,
    year INTEGER,
    name TEXT,
    targetAmount REAL,
    currentAmount REAL
  );
  CREATE TABLE IF NOT EXISTS goal_transactions (
    id TEXT PRIMARY KEY,
    goalId TEXT,
    amount REAL,
    description TEXT,
    date TEXT,
    isLinkedExpense INTEGER
  );
  CREATE TABLE IF NOT EXISTS custom_funds (
    id TEXT PRIMARY KEY,
    name TEXT,
    amount REAL,
    isDefault INTEGER
  );
  CREATE TABLE IF NOT EXISTS global_withdrawals (
    id TEXT PRIMARY KEY,
    year INTEGER,
    month TEXT,
    amount REAL,
    date TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('app/index.html');
  win.maximize(); // For better usage Experience
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// =======================
// DB API IPC HANDLERS
// =======================

// --- YEARS ---
ipcMain.handle('get-years', () => {
  return db.prepare('SELECT year FROM years ORDER BY year DESC').all().map(r => r.year);
});
ipcMain.handle('add-year', (e, year) => {
  db.prepare('INSERT OR IGNORE INTO years (year) VALUES (?)').run(year);
});
ipcMain.handle('update-year', (e, oldYear, newYear) => {
  const transaction = db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO years (year) VALUES (?)').run(newYear);
    db.prepare('UPDATE incomes SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE expenses SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE investment_goals SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE global_withdrawals SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('DELETE FROM years WHERE year = ?').run(oldYear);
  });
  transaction();
});
ipcMain.handle('delete-year', (e, year) => {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM incomes WHERE year = ?').run(year);
    db.prepare('DELETE FROM expenses WHERE year = ?').run(year);
    const goals = db.prepare('SELECT id FROM investment_goals WHERE year = ?').all();
    for (const g of goals) {
      db.prepare('DELETE FROM goal_transactions WHERE goalId = ?').run(g.id);
    }
    db.prepare('DELETE FROM investment_goals WHERE year = ?').run(year);
    db.prepare('DELETE FROM global_withdrawals WHERE year = ?').run(year);
    db.prepare('DELETE FROM years WHERE year = ?').run(year);
  });
  transaction();
});

// --- INCOMES & EXPENSES ---
ipcMain.handle('get-year-data', (e, year) => {
  const incomes = db.prepare('SELECT * FROM incomes WHERE year = ?').all(year);
  const expenses = db.prepare('SELECT * FROM expenses WHERE year = ?').all(year);
  const investmentGoals = db.prepare('SELECT * FROM investment_goals WHERE year = ?').all(year);
  for (let g of investmentGoals) {
    g.transactions = db.prepare('SELECT * FROM goal_transactions WHERE goalId = ? ORDER BY date ASC').all(g.id);
    g.transactions.forEach(t => t.isLinkedExpense = t.isLinkedExpense === 1);
  }
  const globalWithdrawals = db.prepare('SELECT * FROM global_withdrawals WHERE year = ?').all(year);

  return { incomes, expenses, investmentGoals, globalWithdrawals };
});

ipcMain.handle('add-income', (e, inc) => {
  db.prepare('INSERT INTO incomes (id, year, month, amount, description, dest, destLabel) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(inc.id, inc.year, inc.month, inc.amount, inc.description, inc.dest, inc.destLabel);
});
ipcMain.handle('delete-income', (e, id) => {
  db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
});

ipcMain.handle('add-expense', (e, exp) => {
  db.prepare('INSERT INTO expenses (id, year, month, type, amount, description, category, goalId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(exp.id, exp.year, exp.month, exp.type, exp.amount, exp.description, exp.category, exp.goalId);
});
ipcMain.handle('delete-expense', (e, id) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
});

// --- INVESTMENT GOALS ---
ipcMain.handle('add-goal', (e, goal) => {
  db.prepare('INSERT INTO investment_goals (id, year, name, targetAmount, currentAmount) VALUES (?, ?, ?, ?, ?)')
    .run(goal.id, goal.year, goal.name, goal.targetAmount, goal.currentAmount);
});
ipcMain.handle('update-goal', (e, goal) => {
  db.prepare('UPDATE investment_goals SET name = ?, targetAmount = ?, currentAmount = ? WHERE id = ?')
    .run(goal.name, goal.targetAmount, goal.currentAmount, goal.id);
});
ipcMain.handle('delete-goal', (e, id) => {
  db.transaction(() => {
    db.prepare('DELETE FROM goal_transactions WHERE goalId = ?').run(id);
    db.prepare('DELETE FROM investment_goals WHERE id = ?').run(id);
  })();
});

ipcMain.handle('add-goal-transaction', (e, t) => {
  db.prepare('INSERT INTO goal_transactions (id, goalId, amount, description, date, isLinkedExpense) VALUES (?, ?, ?, ?, ?, ?)')
    .run(t.id, t.goalId, t.amount, t.description, t.date, t.isLinkedExpense ? 1 : 0);
});
ipcMain.handle('delete-goal-transaction', (e, id) => {
  db.prepare('DELETE FROM goal_transactions WHERE id = ?').run(id);
});

// --- GLOBAL WITHDRAWALS ---
ipcMain.handle('add-global-withdrawal', (e, w) => {
  db.prepare('INSERT INTO global_withdrawals (id, year, month, amount, date) VALUES (?, ?, ?, ?, ?)')
    .run(w.id, w.year, w.month, w.amount, w.date);
});

// --- CUSTOM FUNDS ---
ipcMain.handle('get-custom-funds', () => {
  const funds = db.prepare('SELECT * FROM custom_funds').all();
  funds.forEach(f => f.isDefault = f.isDefault === 1);
  return funds;
});
ipcMain.handle('add-custom-fund', (e, fund) => {
  db.prepare('INSERT INTO custom_funds (id, name, amount, isDefault) VALUES (?, ?, ?, ?)')
    .run(fund.id, fund.name, fund.amount, fund.isDefault ? 1 : 0);
});
ipcMain.handle('update-custom-fund', (e, fund) => {
  if (fund.isDefault) {
    db.prepare('UPDATE custom_funds SET isDefault = 0').run();
  }
  db.prepare('UPDATE custom_funds SET name = ?, amount = ?, isDefault = ? WHERE id = ?')
    .run(fund.name, fund.amount, fund.isDefault ? 1 : 0, fund.id);
});
ipcMain.handle('delete-custom-fund', (e, id) => {
  db.prepare('DELETE FROM custom_funds WHERE id = ?').run(id);
});

// --- SETTINGS ---
ipcMain.handle('get-settings', () => {
  const settings = {};
  db.prepare('SELECT key, value FROM settings').all().forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });
  return settings;
});
ipcMain.handle('save-setting', (e, key, value) => {
  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, strValue);
});