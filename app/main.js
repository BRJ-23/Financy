const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const dbManager = require('./database');

// Modo test
const isTestMode = process.env.NODE_ENV === 'test';

const dbPath = isTestMode ? ':memory:' : path.join(app.getPath('userData'), 'finanzas.db');
const db = new Database(dbPath);

dbManager.inicializarTablas(db);

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
  win.maximize();
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// =======================
// DB API IPC HANDLERS
// =======================

// --- YEARS ---
ipcMain.handle('get-years',    ()                   => dbManager.getYears(db));
ipcMain.handle('add-year',     (e, year)            => dbManager.addYear(db, year));
ipcMain.handle('update-year',  (e, oldYear, newYear) => dbManager.updateYear(db, oldYear, newYear));
ipcMain.handle('delete-year',  (e, year)            => dbManager.deleteYear(db, year));

// --- INCOMES & EXPENSES ---
ipcMain.handle('get-year-data',  (e, year) => dbManager.getYearData(db, year));
ipcMain.handle('add-income',     (e, inc)  => dbManager.addIncome(db, inc));
ipcMain.handle('delete-income',  (e, id)   => dbManager.deleteIncome(db, id));
ipcMain.handle('add-expense',    (e, exp)  => dbManager.addExpense(db, exp));
ipcMain.handle('delete-expense', (e, id)   => dbManager.deleteExpense(db, id));

// --- INVESTMENT GOALS ---
ipcMain.handle('add-goal',              (e, goal) => dbManager.addGoal(db, goal));
ipcMain.handle('update-goal',           (e, goal) => dbManager.updateGoal(db, goal));
ipcMain.handle('delete-goal',           (e, id)   => dbManager.deleteGoal(db, id));
ipcMain.handle('add-goal-transaction',  (e, t)    => dbManager.addGoalTransaction(db, t));
ipcMain.handle('delete-goal-transaction', (e, id) => dbManager.deleteGoalTransaction(db, id));

// --- GLOBAL WITHDRAWALS ---
ipcMain.handle('add-global-withdrawal', (e, w) => dbManager.addGlobalWithdrawal(db, w));

// --- CUSTOM FUNDS ---
ipcMain.handle('get-custom-funds',   ()          => dbManager.getCustomFunds(db));
ipcMain.handle('add-custom-fund',    (e, fund)   => dbManager.addCustomFund(db, fund));
ipcMain.handle('update-custom-fund', (e, fund)   => dbManager.updateCustomFund(db, fund));
ipcMain.handle('delete-custom-fund', (e, id)     => dbManager.deleteCustomFund(db, id));
ipcMain.handle('add-fund-transaction',    (e, t)  => dbManager.addFundTransaction(db, t));
ipcMain.handle('delete-fund-transaction', (e, id) => dbManager.deleteFundTransaction(db, id));

// --- SETTINGS ---
ipcMain.handle('get-settings',  ()             => dbManager.getSettings(db));
ipcMain.handle('save-setting',  (e, key, value) => dbManager.saveSetting(db, key, value));