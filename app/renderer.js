const monthlyBudgets = {
  enero: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  febrero: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  marzo: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  abril: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  mayo: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  junio: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  julio: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  agosto: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  septiembre: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  octubre: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  noviembre: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 },
  diciembre: { incomes: [], expenses: [], monthlyExpenses: 0, personalExpenses: 0, investments: 0, savings: 0, totalIncome: 0 }
};

const investmentGoals = [];
let savingsChart = null;
let validationMessageTimeout = null;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  let validationBar = document.getElementById('validation-bar');
  if (!validationBar) {
    validationBar = document.createElement('div');
    validationBar.id = 'validation-bar';
    validationBar.style.position = 'fixed';
    validationBar.style.bottom = '16px';
    validationBar.style.left = '50%';
    validationBar.style.transform = 'translateX(-50%)';
    validationBar.style.backgroundColor = '#b91c1c';
    validationBar.style.color = '#fff';
    validationBar.style.padding = '10px 16px';
    validationBar.style.borderRadius = '6px';
    validationBar.style.fontSize = '13px';
    validationBar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
    validationBar.style.zIndex = '2000';
    validationBar.style.display = 'none';
    document.body.appendChild(validationBar);
  }

  initializeTabs();
  initializeMonthlyTabs();
  initializeSavingsChart();
  renderInvestmentGoals();
  ensureDefaultSavingsModes();
  initializeSettingsUI();
  renderIncomeModeSelectors();
});

function showValidationMessage(message) {
  const bar = document.getElementById('validation-bar');
  if (!bar) return;

  bar.textContent = message;
  bar.style.display = 'block';

  if (validationMessageTimeout) {
    clearTimeout(validationMessageTimeout);
  }

  validationMessageTimeout = setTimeout(() => {
    bar.style.display = 'none';
  }, 3000);
}

function getSavingsModes() {
  try {
    const raw = localStorage.getItem('savingsModes');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavingsModes(modes) {
  localStorage.setItem('savingsModes', JSON.stringify(modes));
}

function ensureDefaultSavingsModes() {
  const existing = getSavingsModes();
  if (existing.length > 0) return;

  setSavingsModes([
    { id: 'mode-default-ahorrador', name: 'Ahorrador', isDefault: true, allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 } },
    { id: 'mode-default-inversion', name: 'Inversion', isDefault: false, allocations: { monthly: 40, personal: 20, investment: 35, savings: 5 } }
  ]);
}

function getMonthModeSelection(month) {
  try {
    const raw = localStorage.getItem('monthSavingsModeSelection');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed[month] || '') : '';
  } catch {
    return '';
  }
}

function setMonthModeSelection(month, modeId) {
  let parsed = {};
  try {
    const raw = localStorage.getItem('monthSavingsModeSelection');
    parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') parsed = {};
  } catch {
    parsed = {};
  }
  parsed[month] = modeId || '';
  localStorage.setItem('monthSavingsModeSelection', JSON.stringify(parsed));
}

function getModeById(modeId) {
  const modes = getSavingsModes();
  return modes.find(m => m.id === modeId) || null;
}

function getModeForMonth(month) {
  const selected = getMonthModeSelection(month);
  const mode = selected ? getModeById(selected) : null;
  if (mode) return mode;
  const modes = getSavingsModes();
  const fallback = modes.find(m => m.isDefault) || modes[0];
  if (fallback) return fallback;
  return { id: '', name: 'Por defecto', allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 } };
}

function modeSumPercent(alloc) {
  return (Number(alloc.monthly) || 0) + (Number(alloc.personal) || 0) + (Number(alloc.investment) || 0) + (Number(alloc.savings) || 0);
}

function renderIncomeModeSelectors() {
  const modes = getSavingsModes();
  MONTHS.forEach((month) => {
    const select = document.getElementById(`${month}-income-mode`);
    if (!select) return;
    let current = getMonthModeSelection(month);
    if (!current) {
      current = modes[0]?.id || '';
      if (current) setMonthModeSelection(month, current);
    }
    select.innerHTML = `
      ${modes.map(m => `<option value="${m.id}">${m.name || 'Perfil sin nombre'}</option>`).join('')}
    `;
    select.value = current;

    if (!select.__bound) {
      select.addEventListener('change', () => {
        setMonthModeSelection(month, select.value);
        updateBudgetAllocations(month);
        updateSavingsChart();
      });
      select.__bound = true;
    }

    updateBudgetAllocations(month);
  });
  updateSavingsChart();
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

function initializeMonthlyTabs() {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  months.forEach(month => {
    const tabContent = document.getElementById(month);
    tabContent.innerHTML = `
      <h2>${month.charAt(0).toUpperCase() + month.slice(1)}</h2>
      
      <div id="${month}-categories">
        <div class="categories-grid">
          <!-- Income Column -->
          <div class="category-card income">
            <h3>Ingresos</h3>
            <div class="amount" id="${month}-income-total">€0</div>
            <div class="input-section" style="padding: 10px 0; margin: 0;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <label for="${month}-income-mode" style="font-size: 12px; color: #6b7280;">Modo</label>
                <select id="${month}-income-mode" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                </select>
                <input type="text" id="${month}-income-description" placeholder="Descripción (ej: Salario)" style="min-width: auto;">
                <input type="number" id="${month}-income-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addIncome('${month}')" style="margin: 0;">Añadir Ingreso</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-income-list"></div>
          </div>
          
          <div class="category-card expense">
            <h3>Gastos Mensuales (<span id="${month}-monthly-pct">40</span>%)</h3>
            <div class="amount" id="${month}-monthly-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-monthly-chart"></canvas>
              <div id="${month}-monthly-center-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: bold; color: #374151; pointer-events: none;">€0.00</div>
            </div>
            <small id="${month}-monthly-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="text" id="${month}-monthly-description" placeholder="Descripción" style="min-width: auto;">
                <input type="number" id="${month}-monthly-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'monthly')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-monthly-list"></div>
          </div>
          
          <div class="category-card personal">
            <h3>Gastos Personales (<span id="${month}-personal-pct">20</span>%)</h3>
            <div class="amount" id="${month}-personal-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-personal-chart"></canvas>
              <div id="${month}-personal-center-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: bold; color: #374151; pointer-events: none;">€0.00</div>
            </div>
            <small id="${month}-personal-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="text" id="${month}-personal-description" placeholder="Descripción" style="min-width: auto;">
                <input type="number" id="${month}-personal-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'personal')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-personal-list"></div>
          </div>
          
          <div class="category-card investment">
            <h3>Inversiones (<span id="${month}-investment-pct">20</span>%)</h3>
            <div class="amount" id="${month}-investment-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-investment-chart"></canvas>
              <div id="${month}-investment-center-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: bold; color: #374151; pointer-events: none;">€0.00</div>
            </div>
            <small id="${month}-investment-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <select id="${month}-investment-description" style="min-width: auto; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                  <option value="">Selecciona un fondo...</option>
                </select>
                <input type="number" id="${month}-investment-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'investment')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-investment-list"></div>
          </div>
          
          <div class="category-card savings">
            <h3>Ahorro Total (<span id="${month}-savings-pct">20</span>%)</h3>
            <div class="amount" id="${month}-savings-display">€0</div>
            <small id="${month}-savings-info" style="color: #6b7280;">Base: €0 + Sobrantes</small>
          </div>
        </div>
      </div>
    `;
  });
}

function addIncome(month) {
  const amountInput = document.getElementById(`${month}-income-amount`);
  const descriptionInput = document.getElementById(`${month}-income-description`);

  const amount = parseFloat(amountInput.value) || 0;
  const description = descriptionInput.value.trim();

  if (amount <= 0) {
    showValidationMessage('Por favor, ingrese una cantidad válida');
    return;
  }

  if (!description) {
    showValidationMessage('Por favor, ingrese una descripción');
    return;
  }

  const budget = monthlyBudgets[month];
  budget.incomes.push({ amount, description });
  budget.totalIncome = budget.incomes.reduce((sum, inc) => sum + inc.amount, 0);

  updateIncomeDisplay(month);
  updateBudgetAllocations(month);

  amountInput.value = '';
  descriptionInput.value = '';

  updateSavingsChart();
}

function addExpense(month, type) {
  const amountInput = document.getElementById(`${month}-${type}-amount`);
  const descriptionInput = document.getElementById(`${month}-${type}-description`);

  const amount = parseFloat(amountInput.value) || 0;
  
  let description = '';
  let goalId = null;

  if (type === 'investment' && descriptionInput.tagName === 'SELECT') {
    goalId = descriptionInput.value;
    description = goalId ? descriptionInput.options[descriptionInput.selectedIndex].text : '';
  } else {
    description = descriptionInput.value.trim();
  }

  if (amount <= 0) {
    showValidationMessage('Por favor, ingrese una cantidad válida');
    return;
  }

  if (!description || (type === 'investment' && !goalId)) {
    showValidationMessage(type === 'investment' ? 'Por favor, selecciona un fondo' : 'Por favor, ingrese una descripción');
    return;
  }

  const budget = monthlyBudgets[month];
  let budgetLimit = 0;

  if (type === 'monthly') budgetLimit = budget.monthlyExpenses;
  else if (type === 'personal') budgetLimit = budget.personalExpenses;
  else if (type === 'investment') budgetLimit = budget.investments;

  const currentExpenses = budget.expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0);

  if (currentExpenses + amount > budgetLimit) {
    showValidationMessage(`Este gasto excede el presupuesto disponible. Disponible: €${(budgetLimit - currentExpenses).toFixed(2)}`);
    return;
  }

  const expenseObj = { 
    type, 
    amount, 
    description,
    id: Date.now() // Unique ID for tracking
  };
  if (type === 'investment') {
    expenseObj.goalId = goalId;
  }

  budget.expenses.push(expenseObj);

  if (type === 'investment' && goalId) {
    const goal = investmentGoals.find(g => g.id === goalId);
    if (goal) {
      if (!goal.transactions) goal.transactions = [];
      goal.transactions.push({
        id: expenseObj.id, // linked ID
        amount: amount,
        description: `Aportación desde ${month}`,
        date: new Date().toISOString(),
        isLinkedExpense: true // To identify it
      });
      goal.currentAmount += amount;
      renderInvestmentGoals();
    }
  }

  updateExpenseDisplay(month);

  amountInput.value = '';
  if (type !== 'investment') {
    descriptionInput.value = '';
  } else {
    descriptionInput.value = ''; // resets select to empty
  }

  updateSavingsChart();
}

function updateIncomeDisplay(month) {
  const budget = monthlyBudgets[month];

  document.getElementById(`${month}-income-total`).textContent = `€${budget.totalIncome.toFixed(2)}`;
  const incomeList = document.getElementById(`${month}-income-list`);
  incomeList.innerHTML = '';

  budget.incomes.forEach((income, index) => {
    incomeList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${income.description}</div>
        </div>
        <div class="value" style="color: #10b981;">+€${income.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteIncome('${month}', ${index})">✕</button>
      </div>
    `;
  });
}

function updateBudgetAllocations(month) {
  const budget = monthlyBudgets[month];
  const income = budget.totalIncome;
  const mode = getModeForMonth(month);
  const sum = modeSumPercent(mode.allocations || {});
  if (Math.abs(sum - 100) > 0.0001) {
    showValidationMessage(`El perfil "${mode.name || 'sin nombre'}" no suma 100%`);
  }

  const monthlyPct = (Number(mode.allocations?.monthly) || 0) / 100;
  const personalPct = (Number(mode.allocations?.personal) || 0) / 100;
  const investPct = (Number(mode.allocations?.investment) || 0) / 100;
  const savingsPct = (Number(mode.allocations?.savings) || 0) / 100;

  const monthlyPctEl = document.getElementById(`${month}-monthly-pct`);
  const personalPctEl = document.getElementById(`${month}-personal-pct`);
  const investmentPctEl = document.getElementById(`${month}-investment-pct`);
  const savingsPctEl = document.getElementById(`${month}-savings-pct`);
  if (monthlyPctEl) monthlyPctEl.textContent = String(Number(mode.allocations?.monthly) || 0);
  if (personalPctEl) personalPctEl.textContent = String(Number(mode.allocations?.personal) || 0);
  if (investmentPctEl) investmentPctEl.textContent = String(Number(mode.allocations?.investment) || 0);
  if (savingsPctEl) savingsPctEl.textContent = String(Number(mode.allocations?.savings) || 0);

  const monthlyExpenses = income * monthlyPct;
  const personalExpenses = income * personalPct;
  const investments = income * investPct;
  const baseSavings = income * savingsPct;

  budget.monthlyExpenses = monthlyExpenses;
  budget.personalExpenses = personalExpenses;
  budget.investments = investments;
  budget.savings = baseSavings;

  document.getElementById(`${month}-monthly-display`).textContent = `€${monthlyExpenses.toFixed(2)}`;
  document.getElementById(`${month}-personal-display`).textContent = `€${personalExpenses.toFixed(2)}`;
  document.getElementById(`${month}-investment-display`).textContent = `€${investments.toFixed(2)}`;
  document.getElementById(`${month}-savings-display`).textContent = `€${baseSavings.toFixed(2)}`;

  createCategoryCharts(month);
  updateExpenseDisplay(month);
}

function createCategoryCharts(month) {
  const budget = monthlyBudgets[month];

  const chartIds = [
    `${month}-monthly-chart`,
    `${month}-personal-chart`,
    `${month}-investment-chart`
  ];

  chartIds.forEach(chartId => {
    const canvasElement = document.getElementById(chartId);
    if (canvasElement && canvasElement.chart) {
      canvasElement.chart.destroy();
    }
  });

  const monthlyCtx = document.getElementById(`${month}-monthly-chart`).getContext('2d');
  document.getElementById(`${month}-monthly-chart`).chart = new Chart(monthlyCtx, {
    type: 'doughnut',
    data: {
      labels: ['Disponible', 'Usado'],
      datasets: [{
        data: [budget.monthlyExpenses, 0],
        backgroundColor: ['#ef4444', '#fee2e2'],
        borderColor: ['#dc2626', '#fecaca'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const personalCtx = document.getElementById(`${month}-personal-chart`).getContext('2d');
  document.getElementById(`${month}-personal-chart`).chart = new Chart(personalCtx, {
    type: 'doughnut',
    data: {
      labels: ['Disponible', 'Usado'],
      datasets: [{
        data: [budget.personalExpenses, 0],
        backgroundColor: ['#f59e0b', '#fef3c7'],
        borderColor: ['#d97706', '#fde68a'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const investmentCtx = document.getElementById(`${month}-investment-chart`).getContext('2d');
  document.getElementById(`${month}-investment-chart`).chart = new Chart(investmentCtx, {
    type: 'doughnut',
    data: {
      labels: ['Disponible', 'Usado'],
      datasets: [{
        data: [budget.investments, 0],
        backgroundColor: ['#8b5cf6', '#ede9fe'],
        borderColor: ['#7c3aed', '#ddd6fe'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function updateExpenseDisplay(month) {
  const budget = monthlyBudgets[month];

  const monthlyUsed = budget.expenses.filter(e => e.type === 'monthly').reduce((sum, e) => sum + e.amount, 0);
  const personalUsed = budget.expenses.filter(e => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);
  const investmentUsed = budget.expenses.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);

  const monthlyLeftover = budget.monthlyExpenses - monthlyUsed;
  const personalLeftover = budget.personalExpenses - personalUsed;
  const investmentLeftover = budget.investments - investmentUsed;

  const totalSavings = budget.savings + monthlyLeftover + personalLeftover + investmentLeftover;

  document.getElementById(`${month}-monthly-info`).textContent = `Usado: €${monthlyUsed.toFixed(2)} / €${budget.monthlyExpenses.toFixed(2)}`;
  document.getElementById(`${month}-personal-info`).textContent = `Usado: €${personalUsed.toFixed(2)} / €${budget.personalExpenses.toFixed(2)}`;
  document.getElementById(`${month}-investment-info`).textContent = `Usado: €${investmentUsed.toFixed(2)} / €${budget.investments.toFixed(2)}`;
  document.getElementById(`${month}-savings-info`).textContent = `Base: €${budget.savings.toFixed(2)} + Sobrantes: €${(monthlyLeftover + personalLeftover + investmentLeftover).toFixed(2)}`;

  document.getElementById(`${month}-savings-display`).textContent = `€${totalSavings.toFixed(2)}`;

  const monthlyChart = document.getElementById(`${month}-monthly-chart`).chart;
  const personalChart = document.getElementById(`${month}-personal-chart`).chart;
  const investmentChart = document.getElementById(`${month}-investment-chart`).chart;

  if (monthlyChart) {
    monthlyChart.data.datasets[0].data = [monthlyLeftover, monthlyUsed];
    monthlyChart.update();
    const monthlyCenterText = document.getElementById(`${month}-monthly-center-text`);
    if (monthlyCenterText) monthlyCenterText.textContent = `€${monthlyLeftover.toFixed(2)}`;
  }

  if (personalChart) {
    personalChart.data.datasets[0].data = [personalLeftover, personalUsed];
    personalChart.update();
    const personalCenterText = document.getElementById(`${month}-personal-center-text`);
    if (personalCenterText) personalCenterText.textContent = `€${personalLeftover.toFixed(2)}`;
  }

  if (investmentChart) {
    investmentChart.data.datasets[0].data = [investmentLeftover, investmentUsed];
    investmentChart.update();
    const investmentCenterText = document.getElementById(`${month}-investment-center-text`);
    if (investmentCenterText) investmentCenterText.textContent = `€${investmentLeftover.toFixed(2)}`;
  }

  const monthlyExpensesList = document.getElementById(`${month}-monthly-list`);
  monthlyExpensesList.innerHTML = '';

  const monthlyExpenses = budget.expenses.map((e, i) => ({ ...e, globalIndex: i })).filter(e => e.type === 'monthly');
  monthlyExpenses.forEach((expense) => {
    monthlyExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteExpense('${month}', ${expense.globalIndex})">✕</button>
      </div>
    `;
  });

  const personalExpensesList = document.getElementById(`${month}-personal-list`);
  personalExpensesList.innerHTML = '';

  const personalExpenses = budget.expenses.map((e, i) => ({ ...e, globalIndex: i })).filter(e => e.type === 'personal');
  personalExpenses.forEach((expense) => {
    personalExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteExpense('${month}', ${expense.globalIndex})">✕</button>
      </div>
    `;
  });

  const investmentExpensesList = document.getElementById(`${month}-investment-list`);
  investmentExpensesList.innerHTML = '';

  const investmentExpenses = budget.expenses.map((e, i) => ({ ...e, globalIndex: i })).filter(e => e.type === 'investment');
  investmentExpenses.forEach((expense) => {
    investmentExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteExpense('${month}', ${expense.globalIndex})">✕</button>
      </div>
    `;
  });
}

function deleteIncome(month, index) {
  const budget = monthlyBudgets[month];
  budget.incomes.splice(index, 1);
  budget.totalIncome = budget.incomes.reduce((sum, inc) => sum + inc.amount, 0);
  updateIncomeDisplay(month);
  updateBudgetAllocations(month);
  updateSavingsChart();
}

function deleteExpense(month, index) {
  const budget = monthlyBudgets[month];
  const expense = budget.expenses[index];

  // If it's linked to an investment goal, remove the transaction and subtract the amount
  if (expense.type === 'investment' && expense.goalId) {
    const goal = investmentGoals.find(g => g.id === expense.goalId);
    if (goal) {
      if (goal.transactions) {
        const tIndex = goal.transactions.findIndex(t => t.id === expense.id && t.isLinkedExpense);
        if (tIndex > -1) {
          goal.transactions.splice(tIndex, 1);
        }
      }
      goal.currentAmount -= expense.amount;
      renderInvestmentGoals();
    }
  }

  budget.expenses.splice(index, 1);
  updateExpenseDisplay(month);
  updateSavingsChart();
}

function initializeSavingsChart() {
  const ctx = document.getElementById('savingsChart').getContext('2d');

  savingsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      datasets: [{
        label: 'Ahorro Mensual',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#6b7280',
            font: {
              size: 13,
              weight: '500'
            },
            padding: 15,
            boxWidth: 0,
            boxHeight: 0
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 13,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            label: function (context) {
              return 'Ahorro: €' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#9ca3af',
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af',
            font: {
              size: 12
            },
            callback: function (value) {
              return '€' + value.toFixed(0);
            }
          }
        }
      }
    }
  });

  window.addEventListener('resize', handleChartResize);
}

function handleChartResize() {
  if (savingsChart) {
    savingsChart.resize();
  }
}

function updateSavingsChart() {
  if (!savingsChart) return;

  const savingsData = MONTHS.map(month => {
    const budget = monthlyBudgets[month];

    if (budget.totalIncome === 0) return 0;

    const monthlyUsed = budget.expenses.filter(e => e.type === 'monthly').reduce((sum, e) => sum + e.amount, 0);
    const personalUsed = budget.expenses.filter(e => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);
    const investmentUsed = budget.expenses.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);

    const monthlyLeftover = budget.monthlyExpenses - monthlyUsed;
    const personalLeftover = budget.personalExpenses - personalUsed;
    const investmentLeftover = budget.investments - investmentUsed;

    return budget.savings + monthlyLeftover + personalLeftover + investmentLeftover;
  });

  savingsChart.data.datasets[0].data = savingsData;
  savingsChart.update();
}

function openNewGoalModal() {
  document.getElementById('new-goal-name').value = '';
  document.getElementById('new-goal-amount').value = '';
  document.getElementById('new-goal-modal').classList.add('open');
}

function closeNewGoalModal() {
  document.getElementById('new-goal-modal').classList.remove('open');
}

function createInvestmentGoal() {
  const nameInput = document.getElementById('new-goal-name');
  const amountInput = document.getElementById('new-goal-amount');

  const name = nameInput.value.trim();
  const targetAmount = parseFloat(amountInput.value) || 0;

  if (!name) {
    showValidationMessage('Por favor, ingrese un nombre para el objetivo');
    return;
  }

  if (targetAmount <= 0) {
    showValidationMessage('Por favor, ingrese una cantidad válida');
    return;
  }

  // Create new investment goal
  const goalId = 'goal-' + Date.now();
  investmentGoals.push({
    id: goalId,
    name: name,
    targetAmount: targetAmount,
    currentAmount: 0,
    transactions: []
  });

  nameInput.value = '';
  amountInput.value = '';

  closeNewGoalModal();
  renderInvestmentGoals();
}

function addFundsToGoal(goalId) {
  const amountInput = document.getElementById(`funds-${goalId}`);
  const descInput = document.getElementById(`funds-desc-${goalId}`);
  const amount = parseFloat(amountInput.value) || 0;
  const desc = descInput ? descInput.value.trim() : '';

  if (amount === 0) {
    showValidationMessage('Por favor, ingrese una cantidad distinta de 0');
    return;
  }

  if (!desc) {
    showValidationMessage('Por favor, ingrese una descripción');
    return;
  }

  const goal = investmentGoals.find(g => g.id === goalId);
  if (goal) {
    if (!goal.transactions) goal.transactions = []; // handle old data
    goal.transactions.push({
      id: Date.now(),
      amount: amount,
      description: desc,
      date: new Date().toISOString()
    });
    goal.currentAmount += amount;
    amountInput.value = '';
    if (descInput) descInput.value = '';
    renderInvestmentGoals();
  }
}

function deleteInvestmentGoal(goalId) {
  const index = investmentGoals.findIndex(g => g.id === goalId);
  if (index > -1) {
    investmentGoals.splice(index, 1);
    renderInvestmentGoals();
  }
}

function toggleGoalOptions(goalId) {
  const menu = document.getElementById(`goal-menu-${goalId}`);
  if (menu) {
    const isShowing = menu.classList.contains('show');
    // Close any other open menus
    document.querySelectorAll('.goal-options-menu.show').forEach(el => el.classList.remove('show'));
    if (!isShowing) {
      menu.classList.add('show');
    }
  }
}

function editInvestmentGoal(goalId) {
  const goal = investmentGoals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('edit-goal-id').value = goal.id;
  document.getElementById('edit-goal-name').value = goal.name;
  document.getElementById('edit-goal-amount').value = goal.targetAmount;
  document.getElementById('edit-goal-modal').classList.add('open');
}

function closeEditGoalModal() {
  document.getElementById('edit-goal-modal').classList.remove('open');
}

function saveEditedGoal() {
  const id = document.getElementById('edit-goal-id').value;
  const newName = document.getElementById('edit-goal-name').value.trim();
  const newAmount = parseFloat(document.getElementById('edit-goal-amount').value) || 0;

  if (!newName) {
    showValidationMessage('Por favor, ingrese un nombre para el fondo');
    return;
  }

  if (newAmount <= 0) {
    showValidationMessage('Por favor, ingrese una cantidad válida');
    return;
  }

  const goal = investmentGoals.find(g => g.id === id);
  if (goal) {
    goal.name = newName;
    goal.targetAmount = newAmount;
    closeEditGoalModal();
    renderInvestmentGoals();
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.goal-options-wrapper')) {
    document.querySelectorAll('.goal-options-menu.show').forEach(el => el.classList.remove('show'));
  }
});

function renderInvestmentGoals() {
  const container = document.getElementById('investment-goals-container');

  if (investmentGoals.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 40px;">No hay objetivos de ahorro. ¡Crea uno arriba!</p>';
    updateInvestmentSelects();
    return;
  }

  container.innerHTML = investmentGoals.map(goal => {
    const percentage = Math.max(0, Math.min((goal.currentAmount / goal.targetAmount) * 100, 100));
    const remaining = goal.targetAmount - goal.currentAmount;
    const isComplete = goal.currentAmount >= goal.targetAmount;

    let transationsHtml = '';
    if (goal.transactions && goal.transactions.length > 0) {
      // Show most recent first
      const sortedT = [...goal.transactions].reverse();
      transationsHtml = sortedT.map(t => {
        const isPos = t.amount >= 0;
        return `
          <div class="goal-transaction-item">
            <div class="desc" title="${t.description}">${t.description}</div>
            <div class="amt ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}</div>
          </div>
        `;
      }).join('');
    }

    return `
      <div class="investment-goal-card">
        <h4>
          <span class="goal-name">${goal.name}</span>
          <div class="goal-options-wrapper">
            <button class="goal-options-btn" onclick="toggleGoalOptions('${goal.id}')">☰</button>
            <div id="goal-menu-${goal.id}" class="goal-options-menu">
              <button onclick="editInvestmentGoal('${goal.id}')">Editar</button>
              <button class="delete" onclick="deleteInvestmentGoal('${goal.id}')">Borrar</button>
            </div>
          </div>
        </h4>
        
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
        
        <div class="goal-amount">
          <strong>Ahorrado:</strong> €${goal.currentAmount.toFixed(2)} / €${goal.targetAmount.toFixed(2)}
        </div>
        
        <div class="goal-amount" ${isComplete ? 'style="color: #10b981; font-weight: bold;"' : ''}>
          ${isComplete ? '✓ ¡Objetivo alcanzado!' : (remaining > 0 ? `Falta: €${remaining.toFixed(2)}` : '')}
        </div>
        
        <div class="goal-add-funds">
          <input type="text" id="funds-desc-${goal.id}" placeholder="Descripción" style="flex: 2;">
          <input type="number" id="funds-${goal.id}" placeholder="€" step="0.01" style="flex: 1;">
          <button onclick="addFundsToGoal('${goal.id}')" title="Añadir Movimiento">+</button>
        </div>
        
        ${transationsHtml ? `<div class="goal-transactions">${transationsHtml}</div>` : ''}
      </div>
    `;
  }).join('');
  
  updateInvestmentSelects();
}

function updateInvestmentSelects() {
  MONTHS.forEach(month => {
    const select = document.getElementById(`${month}-investment-description`);
    if (select && select.tagName === 'SELECT') {
      const currentVal = select.value;
      select.innerHTML = '<option value="">Selecciona un fondo...</option>' + 
        investmentGoals.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
      // Restore previous value if it still exists
      if (investmentGoals.some(g => g.id === currentVal)) {
        select.value = currentVal;
      }
    }
  });
}

function initializeSettingsUI() {
  const overlay = document.getElementById('settings-overlay');
  const openButton = document.getElementById('open-settings-button');
  const closeButton = document.getElementById('close-settings-button');
  const navButtons = document.querySelectorAll('.settings-nav-button');
  const sections = {
    general: document.getElementById('settings-section-general'),
    'modos-ahorro': document.getElementById('settings-section-modos-ahorro')
  };
  const title = document.getElementById('settings-title');

  if (!overlay || !openButton || !closeButton || !title) return;

  function openSettings() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  openButton.addEventListener('click', openSettings);
  closeButton.addEventListener('click', closeSettings);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSettings();
  });

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionKey = btn.getAttribute('data-settings-section');
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(sections).forEach(key => {
        if (sections[key]) sections[key].style.display = key === sectionKey ? 'block' : 'none';
      });

      if (sectionKey === 'general') title.textContent = 'General';
      else if (sectionKey === 'modos-ahorro') title.textContent = 'Modos ahorro';
    });
  });

  initializeModesUI();
}

function initializeModesUI() {
  const listEl = document.getElementById('modes-items');
  const createBtn = document.getElementById('modes-create');
  const saveBtn = document.getElementById('modes-save');
  const nameInput = document.getElementById('mode-name');
  const inMonthly = document.getElementById('mode-monthly');
  const inPersonal = document.getElementById('mode-personal');
  const inInvestment = document.getElementById('mode-investment');
  const inSavings = document.getElementById('mode-savings');
  const sumBadge = document.getElementById('mode-sum');
  const defaultCheckbox = document.getElementById('mode-default');

  if (!listEl || !createBtn || !saveBtn || !nameInput || !inMonthly || !inPersonal || !inInvestment || !inSavings || !sumBadge || !defaultCheckbox) return;

  let selectedId = '';

  function readAlloc() {
    return {
      monthly: Math.max(0, parseFloat(inMonthly.value) || 0),
      personal: Math.max(0, parseFloat(inPersonal.value) || 0),
      investment: Math.max(0, parseFloat(inInvestment.value) || 0),
      savings: Math.max(0, parseFloat(inSavings.value) || 0)
    };
  }

  function updateSum() {
    const sum = modeSumPercent(readAlloc());
    const rounded = Math.round(sum * 10) / 10;
    sumBadge.textContent = `Total: ${rounded}%`;
    sumBadge.classList.remove('ok', 'bad');
    if (Math.abs(sum - 100) < 0.0001) sumBadge.classList.add('ok');
    else sumBadge.classList.add('bad');
  }

  [inMonthly, inPersonal, inInvestment, inSavings].forEach(inp => inp.addEventListener('input', updateSum));

  function loadMode(mode) {
    selectedId = mode.id;
    nameInput.value = mode.name || '';
    inMonthly.value = mode.allocations?.monthly ?? 0;
    inPersonal.value = mode.allocations?.personal ?? 0;
    inInvestment.value = mode.allocations?.investment ?? 0;
    inSavings.value = mode.allocations?.savings ?? 0;
    defaultCheckbox.checked = !!mode.isDefault;
    updateSum();
  }

  function renderList() {
    const modes = getSavingsModes();
    listEl.innerHTML = modes.map((m) => {
      const sum = modeSumPercent(m.allocations || {});
      const ok = Math.abs(sum - 100) < 0.0001;
      return `
        <div class="mode-item ${m.id === selectedId ? 'active' : ''}" data-mode-id="${m.id}">
          <div style="min-width:0;">
            <div class="name">${m.name || 'Perfil sin nombre'}</div>
            <div class="meta">${ok ? '100%' : (Math.round(sum * 10) / 10) + '%'} · 4 columnas</div>
          </div>
          <button class="mode-delete" data-delete-id="${m.id}" title="Eliminar">✕</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.mode-item').forEach((row) => {
      row.addEventListener('click', (e) => {
        const del = e.target && e.target.getAttribute && e.target.getAttribute('data-delete-id');
        if (del) return;
        const id = row.getAttribute('data-mode-id') || '';
        const mode = getModeById(id);
        if (mode) {
          loadMode(mode);
          renderList();
        }
      });
    });

    listEl.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        const all = getSavingsModes();
        const target = all.find(m => m.id === id);
        if (target && target.isDefault && all.length > 1) {
          showValidationMessage('No se puede eliminar el perfil por defecto. Marca otro como defecto primero.');
          return;
        }
        const modes = all.filter(m => m.id !== id);
        setSavingsModes(modes);
        if (selectedId === id) {
          selectedId = modes[0]?.id || '';
          if (selectedId) {
            const m = getModeById(selectedId);
            if (m) loadMode(m);
          } else {
            nameInput.value = '';
            inMonthly.value = 0;
            inPersonal.value = 0;
            inInvestment.value = 0;
            inSavings.value = 0;
            updateSum();
          }
        }
        renderList();
        renderIncomeModeSelectors();
      });
    });
  }

  function createNew() {
    const id = 'mode-' + Date.now();
    const mode = {
      id,
      name: 'Nuevo perfil',
      allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 }
    };
    const modes = getSavingsModes();
    modes.unshift(mode);
    setSavingsModes(modes);
    loadMode(mode);
    renderList();
    renderIncomeModeSelectors();
  }

  createBtn.addEventListener('click', createNew);

  saveBtn.addEventListener('click', () => {
    if (!selectedId) {
      showValidationMessage('Crea o selecciona un perfil primero');
      return;
    }
    const name = (nameInput.value || '').trim();
    if (!name) {
      showValidationMessage('El perfil necesita un nombre');
      return;
    }
    const alloc = readAlloc();
    const sum = modeSumPercent(alloc);
    if (Math.abs(sum - 100) > 0.0001) {
      showValidationMessage('La suma de porcentajes debe ser 100%');
      return;
    }

    const modes = getSavingsModes();
    const idx = modes.findIndex(m => m.id === selectedId);
    if (idx === -1) {
      showValidationMessage('El perfil seleccionado no existe');
      return;
    }
    const isDefault = !!defaultCheckbox.checked;
    modes[idx] = { ...modes[idx], name, allocations: alloc, isDefault };
    if (isDefault) {
      modes.forEach((m, i) => {
        if (i !== idx) m.isDefault = false;
      });
    } else if (!modes.some(m => m.isDefault)) {
      // Si ninguno ha quedado como defecto, marcamos este para garantizar siempre uno
      modes[idx].isDefault = true;
    }
    setSavingsModes(modes);
    renderList();
    renderIncomeModeSelectors();
    showValidationMessage('Perfil guardado');
  });

  const modes = getSavingsModes();
  if (modes.length === 0) createNew();
  else loadMode(modes[0]);
  renderList();
}

window.addIncome = addIncome;
window.addExpense = addExpense;
window.openNewGoalModal = openNewGoalModal;
window.closeNewGoalModal = closeNewGoalModal;
window.createInvestmentGoal = createInvestmentGoal;
window.addFundsToGoal = addFundsToGoal;
window.deleteInvestmentGoal = deleteInvestmentGoal;
window.toggleGoalOptions = toggleGoalOptions;
window.editInvestmentGoal = editInvestmentGoal;
window.closeEditGoalModal = closeEditGoalModal;
window.saveEditedGoal = saveEditedGoal;
