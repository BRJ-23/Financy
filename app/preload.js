const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getYears: () => ipcRenderer.invoke('get-years'),
  addYear: (year) => ipcRenderer.invoke('add-year', year),
  updateYear: (oldYear, newYear) => ipcRenderer.invoke('update-year', oldYear, newYear),
  deleteYear: (year) => ipcRenderer.invoke('delete-year', year),

  getYearData: (year) => ipcRenderer.invoke('get-year-data', year),
  
  addIncome: (inc) => ipcRenderer.invoke('add-income', inc),
  deleteIncome: (id) => ipcRenderer.invoke('delete-income', id),

  addExpense: (exp) => ipcRenderer.invoke('add-expense', exp),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),

  addGoal: (goal) => ipcRenderer.invoke('add-goal', goal),
  updateGoal: (goal) => ipcRenderer.invoke('update-goal', goal),
  deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),
  
  addGoalTransaction: (t) => ipcRenderer.invoke('add-goal-transaction', t),
  deleteGoalTransaction: (id) => ipcRenderer.invoke('delete-goal-transaction', id),

  addGlobalWithdrawal: (w) => ipcRenderer.invoke('add-global-withdrawal', w),

  getCustomFunds: () => ipcRenderer.invoke('get-custom-funds'),
  addCustomFund: (fund) => ipcRenderer.invoke('add-custom-fund', fund),
  updateCustomFund: (fund) => ipcRenderer.invoke('update-custom-fund', fund),
  deleteCustomFund: (id) => ipcRenderer.invoke('delete-custom-fund', id),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value)
});