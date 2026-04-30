/**
 * Capa de acceso a datos — independiente de Electron.
 * Todas las funciones reciben `db` (instancia de better-sqlite3) como primer parámetro.
 * Se importa desde main.js y desde los tests.
 */

// =======================
// INICIALIZACIÓN
// =======================

function inicializarTablas(db) {
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
      destLabel TEXT,
      date TEXT
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      year INTEGER,
      month TEXT,
      type TEXT,
      amount REAL,
      description TEXT,
      category TEXT,
      goalId TEXT,
      date TEXT
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
    CREATE TABLE IF NOT EXISTS fund_transactions (
      id TEXT PRIMARY KEY,
      fundId TEXT,
      amount REAL,
      description TEXT,
      date TEXT
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
  // Migraciones (añadir columna date si no existe)
  try { db.exec('ALTER TABLE incomes ADD COLUMN date TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE expenses ADD COLUMN date TEXT'); } catch (e) {}

  // Índices para consultas frecuentes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_incomes_year ON incomes(year);
    CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses(year);
    CREATE INDEX IF NOT EXISTS idx_goal_tx_goalId ON goal_transactions(goalId);
    CREATE INDEX IF NOT EXISTS idx_fund_tx_fundId ON fund_transactions(fundId);
    CREATE INDEX IF NOT EXISTS idx_global_withdrawals_year ON global_withdrawals(year);
  `);
}

// =======================
// YEARS
// =======================

function getYears(db) {
  return db.prepare('SELECT year FROM years ORDER BY year DESC').all().map(r => r.year);
}

function addYear(db, year) {
  db.prepare('INSERT OR IGNORE INTO years (year) VALUES (?)').run(year);
}

function updateYear(db, oldYear, newYear) {
  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO years (year) VALUES (?)').run(newYear);
    db.prepare('UPDATE incomes SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE expenses SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE investment_goals SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('UPDATE global_withdrawals SET year = ? WHERE year = ?').run(newYear, oldYear);
    db.prepare('DELETE FROM years WHERE year = ?').run(oldYear);
  })();
}

function deleteYear(db, year) {
  db.transaction(() => {
    db.prepare('DELETE FROM incomes WHERE year = ?').run(year);
    db.prepare('DELETE FROM expenses WHERE year = ?').run(year);
    const goals = db.prepare('SELECT id FROM investment_goals WHERE year = ?').all(year);
    for (const g of goals) {
      db.prepare('DELETE FROM goal_transactions WHERE goalId = ?').run(g.id);
    }
    db.prepare('DELETE FROM investment_goals WHERE year = ?').run(year);
    db.prepare('DELETE FROM global_withdrawals WHERE year = ?').run(year);
    db.prepare('DELETE FROM years WHERE year = ?').run(year);
  })();
}

// =======================
// INCOMES & EXPENSES
// =======================

function getYearData(db, year) {
  const incomes = db.prepare('SELECT * FROM incomes WHERE year = ?').all(year);
  const expenses = db.prepare('SELECT * FROM expenses WHERE year = ?').all(year);
  const investmentGoals = db.prepare('SELECT * FROM investment_goals WHERE year = ?').all(year);
  for (const g of investmentGoals) {
    g.transactions = db.prepare(
      'SELECT * FROM goal_transactions WHERE goalId = ? ORDER BY date ASC'
    ).all(g.id);
    g.transactions.forEach(t => (t.isLinkedExpense = t.isLinkedExpense === 1));
  }
  const globalWithdrawals = db.prepare('SELECT * FROM global_withdrawals WHERE year = ?').all(year);
  return { incomes, expenses, investmentGoals, globalWithdrawals };
}

function addIncome(db, inc) {
  db.prepare(
    'INSERT INTO incomes (id, year, month, amount, description, dest, destLabel, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(inc.id, inc.year, inc.month, inc.amount, inc.description, inc.dest, inc.destLabel, inc.date);
}

function deleteIncome(db, id) {
  db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
}

function addExpense(db, exp) {
  db.prepare(
    'INSERT INTO expenses (id, year, month, type, amount, description, category, goalId, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(exp.id, exp.year, exp.month, exp.type, exp.amount, exp.description, exp.category, exp.goalId, exp.date);
}

function deleteExpense(db, id) {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
}

// =======================
// INVESTMENT GOALS
// =======================

function addGoal(db, goal) {
  db.prepare(
    'INSERT INTO investment_goals (id, year, name, targetAmount, currentAmount) VALUES (?, ?, ?, ?, ?)'
  ).run(goal.id, goal.year, goal.name, goal.targetAmount, goal.currentAmount);
}

function updateGoal(db, goal) {
  db.prepare(
    'UPDATE investment_goals SET name = ?, targetAmount = ?, currentAmount = ? WHERE id = ?'
  ).run(goal.name, goal.targetAmount, goal.currentAmount, goal.id);
}

function deleteGoal(db, id) {
  db.transaction(() => {
    db.prepare('DELETE FROM goal_transactions WHERE goalId = ?').run(id);
    db.prepare('DELETE FROM investment_goals WHERE id = ?').run(id);
  })();
}

function addGoalTransaction(db, t) {
  db.prepare(
    'INSERT INTO goal_transactions (id, goalId, amount, description, date, isLinkedExpense) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(t.id, t.goalId, t.amount, t.description, t.date, t.isLinkedExpense ? 1 : 0);
}

function deleteGoalTransaction(db, id) {
  db.prepare('DELETE FROM goal_transactions WHERE id = ?').run(id);
}

// =======================
// GLOBAL WITHDRAWALS
// =======================

function addGlobalWithdrawal(db, w) {
  db.prepare(
    'INSERT INTO global_withdrawals (id, year, month, amount, date) VALUES (?, ?, ?, ?, ?)'
  ).run(w.id, w.year, w.month, w.amount, w.date);
}

// =======================
// CUSTOM FUNDS
// =======================

function getCustomFunds(db) {
  const funds = db.prepare('SELECT * FROM custom_funds').all();
  funds.forEach(f => {
    f.isDefault = f.isDefault === 1;
    f.transactions = db.prepare(
      'SELECT * FROM fund_transactions WHERE fundId = ? ORDER BY date DESC'
    ).all(f.id);
  });
  return funds;
}

function addFundTransaction(db, t) {
  db.prepare(
    'INSERT INTO fund_transactions (id, fundId, amount, description, date) VALUES (?, ?, ?, ?, ?)'
  ).run(t.id, t.fundId, t.amount, t.description, t.date);
}

function deleteFundTransaction(db, id) {
  db.prepare('DELETE FROM fund_transactions WHERE id = ?').run(id);
}

function addCustomFund(db, fund) {
  db.prepare(
    'INSERT INTO custom_funds (id, name, amount, isDefault) VALUES (?, ?, ?, ?)'
  ).run(fund.id, fund.name, fund.amount, fund.isDefault ? 1 : 0);
}

function updateCustomFund(db, fund) {
  db.transaction(() => {
    if (fund.isDefault) {
      db.prepare('UPDATE custom_funds SET isDefault = 0').run();
    }
    db.prepare(
      'UPDATE custom_funds SET name = ?, amount = ?, isDefault = ? WHERE id = ?'
    ).run(fund.name, fund.amount, fund.isDefault ? 1 : 0, fund.id);
  })();
}

function deleteCustomFund(db, id) {
  db.transaction(() => {
    db.prepare('DELETE FROM fund_transactions WHERE fundId = ?').run(id);
    db.prepare('DELETE FROM custom_funds WHERE id = ?').run(id);
  })();
}

// =======================
// SETTINGS
// =======================

function getSettings(db) {
  const settings = {};
  db.prepare('SELECT key, value FROM settings').all().forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });
  return settings;
}

function saveSetting(db, key, value) {
  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, strValue);
}

module.exports = {
  inicializarTablas,
  // years
  getYears,
  addYear,
  updateYear,
  deleteYear,
  // incomes & expenses
  getYearData,
  addIncome,
  deleteIncome,
  addExpense,
  deleteExpense,
  // investment goals
  addGoal,
  updateGoal,
  deleteGoal,
  addGoalTransaction,
  deleteGoalTransaction,
  // global withdrawals
  addGlobalWithdrawal,
  // custom funds
  getCustomFunds,
  addCustomFund,
  updateCustomFund,
  deleteCustomFund,
  addFundTransaction,
  deleteFundTransaction,
  // settings
  getSettings,
  saveSetting,
};
