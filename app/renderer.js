let currentYear = new Date().getFullYear();
let availableYears = [];
let APP_SETTINGS = {};

function getEmptyBudgets() {
  return {
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
}

let monthlyBudgets = getEmptyBudgets();
let investmentGoals = [];
let globalSavingsWithdrawals = [];
let savingsChart = null;
let cumulativeChart = null;
let activeChartIndex = 0; // 0 = monthly savings, 1 = cumulative
let validationMessageTimeout = null;
let customFunds = [];

function getCustomFunds() {
  try {
    const raw = localStorage.getItem('customFunds');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) { }
  return [
    { id: 'fund-default', name: 'Cuenta Principal', amount: 0, isDefault: true }
  ];
}

function saveCustomFunds(funds) {
  localStorage.setItem('customFunds', JSON.stringify(funds));
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
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

  let autocompleteList = document.getElementById('category-autocomplete-list');
  if (!autocompleteList) {
    autocompleteList = document.createElement('datalist');
    autocompleteList.id = 'category-autocomplete-list';
    document.body.appendChild(autocompleteList);
  }



  await loadAvailableYears();
  await loadYearData(currentYear);

  customFunds = await window.api.getCustomFunds();
  if (!customFunds || customFunds.length === 0) {
    const defaultFund = { id: 'fund-default', name: 'Cuenta Principal', amount: 0, isDefault: true };
    await window.api.addCustomFund(defaultFund);
    customFunds = [defaultFund];
  }

  renderYearSidebar();
  initializeTabs();
  initializeMonthlyTabs();
  initializeSavingsChart();
  renderInvestmentGoals();
  await ensureDefaultSavingsModes();
  initializeSettingsUI();
  await renderIncomeModeSelectors();
  updateCategoryAutocomplete();
});

async function loadAvailableYears() {
  if (!window.api) return;

  APP_SETTINGS = await window.api.getSettings();

  availableYears = await window.api.getYears();
  if (availableYears.length === 0) {
    availableYears = [new Date().getFullYear()];
    await window.api.addYear(availableYears[0]);
  }

  const storageYear = parseInt(APP_SETTINGS['currentYearSelected'], 10);
  currentYear = availableYears.includes(storageYear) ? storageYear : (availableYears.includes(new Date().getFullYear()) ? new Date().getFullYear() : availableYears[0]);
}

async function loadYearData(year) {
  currentYear = year;
  if (!window.api) {
    monthlyBudgets = getEmptyBudgets();
    return;
  }

  await window.api.saveSetting('currentYearSelected', year);
  const raw = await window.api.getYearData(year);
  monthlyBudgets = getEmptyBudgets();

  // Reassemble monthlyBudgets naturally from relational format
  for (const inc of raw.incomes) {
    monthlyBudgets[inc.month].incomes.push({ id: inc.id, amount: inc.amount, description: inc.description, dest: inc.dest, destLabel: inc.destLabel });
    monthlyBudgets[inc.month].totalIncome += inc.amount;
  }

  for (const exp of raw.expenses) {
    monthlyBudgets[exp.month].expenses.push({ id: exp.id, type: exp.type, amount: exp.amount, description: exp.description, category: exp.category, goalId: exp.goalId });
  }

  investmentGoals = raw.investmentGoals || [];
  globalSavingsWithdrawals = raw.globalWithdrawals || [];
}

function renderYearSidebar() {
  const list = document.getElementById('year-list');
  if (!list) return;

  const years = availableYears.sort((a, b) => b - a);
  list.innerHTML = years.map((y, index) => {
    const isSelected = y === currentYear;
    const borderStyle = index < years.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : 'border-bottom: none;';
    const bg = isSelected ? '#f3f4f6' : 'transparent';
    const color = isSelected ? '#111827' : '#6b7280';
    const shadow = isSelected ? 'box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);' : '';

    return `
      <div style="position: relative; width: 100%; border: none; ${borderStyle}">
        <button onclick="selectYear(${y})" oncontextmenu="showYearMenu(event, ${y})" style="width: 100%; padding: 12px 10px; font-size: 15px; font-weight: ${isSelected ? '800' : '600'}; background: ${bg}; color: ${color}; border: none; cursor: pointer; transition: all 0.2s; text-align: left; ${shadow}" onmouseover="if(${y} !== ${currentYear}) { this.style.background='#f9fafb'; this.style.color='#374151'; }" onmouseout="if(${y} !== ${currentYear}) { this.style.background='transparent'; this.style.color='#6b7280'; }">
          ${y}
        </button>
      </div>
    `;
  }).join('');
}

let activeYearContext = null;

function showYearMenu(event, year) {
  event.preventDefault();
  activeYearContext = year;
  const menu = document.getElementById('year-context-menu');
  if (menu) {
    document.querySelectorAll('.goal-options-menu.show').forEach(el => el.classList.remove('show'));
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.classList.add('show');
  }
}

function handleCtxEditYear() {
  if (activeYearContext) {
    openEditYearModal(activeYearContext);
  }
}

function handleCtxDeleteYear() {
  if (activeYearContext) {
    deleteYear(activeYearContext);
  }
}

function selectYear(year) {
  if (currentYear === year) return;
  loadYearData(year);
  renderYearSidebar();

  initializeMonthlyTabs();
  renderIncomeModeSelectors();
  updateSavingsChart();
  renderInvestmentGoals();
  updateCategoryAutocomplete();
}

function openNewYearModal() {
  document.getElementById('new-year-input').value = new Date().getFullYear() + 1;
  document.getElementById('new-year-modal').classList.add('open');
}

function closeNewYearModal() {
  document.getElementById('new-year-modal').classList.remove('open');
}

function createNewYear() {
  const val = parseInt(document.getElementById('new-year-input').value, 10);
  if (!val || val < 2000 || val > 2100) {
    showValidationMessage('Introduce un año válido');
    return;
  }
  if (!availableYears.includes(val)) {
    availableYears.push(val);
    if (window.api) window.api.addYear(val);
  }
  closeNewYearModal();
  selectYear(val);
}

function openEditYearModal(oldYear) {
  document.getElementById('edit-year-old').value = oldYear;
  const input = document.getElementById('edit-year-input');
  input.value = oldYear;
  document.getElementById('edit-year-modal').classList.add('open');

  setTimeout(() => {
    input.focus();
    input.select();
  }, 50);
}

function closeEditYearModal() {
  document.getElementById('edit-year-modal').classList.remove('open');
}

function saveEditedYear() {
  const oldYear = parseInt(document.getElementById('edit-year-old').value, 10);
  const newYear = parseInt(document.getElementById('edit-year-input').value, 10);

  if (!newYear || newYear < 2000 || newYear > 2100) {
    showValidationMessage('Introduce un año válido');
    return;
  }

  if (oldYear === newYear) {
    closeEditYearModal();
    return;
  }

  if (availableYears.includes(newYear)) {
    showValidationMessage('Ese año ya existe. No puedes duplicarlo.');
    return;
  }

  const index = availableYears.indexOf(oldYear);
  if (index > -1) {
    availableYears[index] = newYear;
    if (window.api) window.api.updateYear(oldYear, newYear);

    closeEditYearModal();

    if (currentYear === oldYear) {
      currentYear = null;
      selectYear(newYear);
    } else {
      renderYearSidebar();
      updateSavingsChart();
    }
  }
}

function deleteYear(y) {
  if (availableYears.length <= 1) {
    showValidationMessage('Debes mantener al menos un año.');
    return;
  }

  document.getElementById('delete-year-target').value = y;
  document.getElementById('delete-year-message').textContent = `¿Estás seguro de que deseas eliminar el año ${y} y todos sus datos asociados?`;
  document.getElementById('delete-year-modal').classList.add('open');
}

function closeDeleteYearModal() {
  document.getElementById('delete-year-modal').classList.remove('open');
}

function confirmDeleteYear() {
  const y = parseInt(document.getElementById('delete-year-target').value, 10);
  if (!y) return;

  availableYears = availableYears.filter(year => year !== y);
  if (window.api) window.api.deleteYear(y);

  closeDeleteYearModal();

  if (currentYear === y) {
    // If we're viewing the deleted year, switch to the first available one
    currentYear = null;
    selectYear(availableYears[0]);
  } else {
    renderYearSidebar();
    updateSavingsChart(); // updates charts and global savings based on remaining years
  }
}

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
  return APP_SETTINGS['savingsModes'] || [];
}

function setSavingsModes(modes) {
  APP_SETTINGS['savingsModes'] = modes;
  if (window.api) window.api.saveSetting('savingsModes', modes);
}

async function ensureDefaultSavingsModes() {
  const existing = getSavingsModes();
  if (existing.length > 0) return;

  setSavingsModes([
    { id: 'mode-default-ahorrador', name: 'Ahorrador', isDefault: true, allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 } },
    { id: 'mode-default-inversion', name: 'Inversion', isDefault: false, allocations: { monthly: 40, personal: 20, investment: 35, savings: 5 } }
  ]);
}

function getMonthModeSelection(month) {
  const parsed = APP_SETTINGS['monthSavingsModeSelection'] || {};
  return parsed[month] || '';
}

function setMonthModeSelection(month, modeId) {
  let parsed = APP_SETTINGS['monthSavingsModeSelection'] || {};
  parsed[month] = modeId || '';
  APP_SETTINGS['monthSavingsModeSelection'] = parsed;
  if (window.api) window.api.saveSetting('monthSavingsModeSelection', parsed);
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
    updateIncomeDisplay(month);
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
                <label for="${month}-income-mode" style="font-size: 12px; color: #6b7280;">Modo de Reparto</label>
                <select id="${month}-income-mode" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
                </select>
                <select id="${month}-income-dest" style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-bottom: 4px;">
                  <option value="reparto">Repartir (según Modo)</option>
                  <option value="monthly">Directo a Gastos Mensuales</option>
                  <option value="personal">Directo a Gastos Personales</option>
                  <option value="investment">Directo a Inversiones</option>
                  <option value="savings">Directo a Ahorro</option>
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
                <input type="text" id="${month}-monthly-category" list="category-autocomplete-list" placeholder="Categoría (ej. Combustible)" style="min-width: auto;">
                <input type="number" id="${month}-monthly-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'monthly')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-monthly-list"></div>
            <div id="${month}-monthly-category-summary" style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;"></div>
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
                <input type="text" id="${month}-personal-category" list="category-autocomplete-list" placeholder="Categoría (ej. Ropa, Ocio)" style="min-width: auto;">
                <input type="number" id="${month}-personal-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'personal')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-personal-list"></div>
            <div id="${month}-personal-category-summary" style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;"></div>
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
  const destSelect = document.getElementById(`${month}-income-dest`);

  const amount = parseFloat(amountInput.value) || 0;
  const description = descriptionInput.value.trim();
  const dest = destSelect ? destSelect.value : 'reparto';
  let destLabel = 'Reparto';
  if (destSelect && destSelect.selectedIndex >= 0) {
    destLabel = destSelect.options[destSelect.selectedIndex].text;
  }

  if (amount <= 0) {
    showValidationMessage('Por favor, ingrese una cantidad válida');
    return;
  }

  if (!description) {
    showValidationMessage('Por favor, ingrese una descripción');
    return;
  }

  const budget = monthlyBudgets[month];
  const id = 'inc-' + Math.random().toString(36).substr(2, 9);
  const incObj = { id, amount, description, dest, destLabel };
  budget.incomes.push(incObj);
  if (window.api) window.api.addIncome({ ...incObj, year: currentYear, month });

  budget.totalIncome = budget.incomes.reduce((sum, inc) => sum + inc.amount, 0);

  updateIncomeDisplay(month);
  updateBudgetAllocations(month);

  amountInput.value = '';
  descriptionInput.value = '';
  if (destSelect) destSelect.value = 'reparto';

  updateSavingsChart();
}

function addExpense(month, type) {
  const amountInput = document.getElementById(`${month}-${type}-amount`);
  const descriptionInput = document.getElementById(`${month}-${type}-description`);
  const categoryInput = document.getElementById(`${month}-${type}-category`);

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
    id: 'exp-' + Math.random().toString(36).substr(2, 9)
  };

  if (type === 'monthly' || type === 'personal') {
    expenseObj.category = categoryInput && categoryInput.value.trim() ? categoryInput.value.trim() : 'Sin Categoría';
  }
  if (type === 'investment') {
    expenseObj.goalId = goalId;
  }

  budget.expenses.push(expenseObj);
  if (window.api) window.api.addExpense({ ...expenseObj, year: currentYear, month });

  if (type === 'investment' && goalId) {
    const goal = investmentGoals.find(g => g.id === goalId);
    if (goal) {
      if (!goal.transactions) goal.transactions = [];
      const tx = {
        id: expenseObj.id,
        amount: amount,
        description: `Aportación desde ${month}`,
        date: new Date().toISOString(),
        isLinkedExpense: true
      };
      goal.transactions.push(tx);
      goal.currentAmount += amount;
      if (window.api) {
        window.api.addGoalTransaction({ ...tx, goalId: goal.id });
        window.api.updateGoal({ ...goal, year: currentYear });
      }
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
  if (categoryInput) {
    categoryInput.value = '';
  }

  updateSavingsChart();
  updateCategoryAutocomplete();
}

function updateIncomeDisplay(month) {
  const budget = monthlyBudgets[month];

  document.getElementById(`${month}-income-total`).textContent = `€${budget.totalIncome.toFixed(2)}`;
  const incomeList = document.getElementById(`${month}-income-list`);
  incomeList.innerHTML = '';

  budget.incomes.forEach((income, index) => {
    let tagHtml = '';
    if (income.dest && income.dest !== 'reparto') {
      const colors = {
        'monthly': '#ef4444',
        'personal': '#f59e0b',
        'investment': '#8b5cf6',
        'savings': '#10b981'
      };
      const shortLabel = {
        'monthly': 'Mensuales',
        'personal': 'Personales',
        'investment': 'Inversiones',
        'savings': 'Ahorro'
      }[income.dest];
      tagHtml = `<span style="font-size: 10px; background: ${colors[income.dest]}20; color: ${colors[income.dest]}; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">➔ ${shortLabel}</span>`;
    } else {
      tagHtml = `<span style="font-size: 10px; background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Repartido</span>`;
    }

    incomeList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${income.description}${tagHtml}</div>
        </div>
        <div class="value" style="color: #10b981;">+€${income.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteIncome('${month}', ${index})">✕</button>
      </div>
    `;
  });
}

function updateBudgetAllocations(month) {
  const budget = monthlyBudgets[month];

  const distributableIncome = budget.incomes
    .filter(i => !i.dest || i.dest === 'reparto')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const directMonthly = budget.incomes.filter(i => i.dest === 'monthly').reduce((sum, inc) => sum + inc.amount, 0);
  const directPersonal = budget.incomes.filter(i => i.dest === 'personal').reduce((sum, inc) => sum + inc.amount, 0);
  const directInvestment = budget.incomes.filter(i => i.dest === 'investment').reduce((sum, inc) => sum + inc.amount, 0);
  const directSavings = budget.incomes.filter(i => i.dest === 'savings').reduce((sum, inc) => sum + inc.amount, 0);

  // Update total internal property to ensure chart uses it correctly
  budget.totalIncome = distributableIncome + directMonthly + directPersonal + directInvestment + directSavings;

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

  const monthlyExpenses = (distributableIncome * monthlyPct) + directMonthly;
  const personalExpenses = (distributableIncome * personalPct) + directPersonal;
  const investments = (distributableIncome * investPct) + directInvestment;
  const baseSavings = (distributableIncome * savingsPct) + directSavings;

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
    let categoryTag = '';
    if (expense.category) {
      categoryTag = `<span style="font-size: 10px; background: #e5e7eb; color: #4b5563; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${expense.category}</span>`;
    }
    monthlyExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}${categoryTag}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteExpense('${month}', ${expense.globalIndex})">✕</button>
      </div>
    `;
  });

  // Calculate and render category summary for monthly expenses
  const categorySummaryContainer = document.getElementById(`${month}-monthly-category-summary`);
  if (categorySummaryContainer) {
    const categoryTotals = {};
    monthlyExpenses.forEach(exp => {
      const cat = exp.category || 'Sin Categoría';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    const categoriesHtml = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]).map(cat => {
      const amt = categoryTotals[cat];
      const pct = monthlyUsed > 0 ? ((amt / monthlyUsed) * 100).toFixed(0) : 0;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #6b7280; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-size: 13px;">
          <strong style="color: #374151;">${cat}</strong>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #6b7280; font-size: 11px;">${pct}%</span>
            <span style="color: #ef4444; font-weight: 600;">€${amt.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

    if (Object.keys(categoryTotals).length > 0) {
      categorySummaryContainer.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; border-top: 1px solid #e5e7eb; padding-top: 15px;">Resumen por Categorías</div>
        ${categoriesHtml}
      `;
    } else {
      categorySummaryContainer.innerHTML = '';
    }
  }

  const personalExpensesList = document.getElementById(`${month}-personal-list`);
  personalExpensesList.innerHTML = '';

  const personalExpenses = budget.expenses.map((e, i) => ({ ...e, globalIndex: i })).filter(e => e.type === 'personal');
  personalExpenses.forEach((expense) => {
    let categoryTag = '';
    if (expense.category) {
      categoryTag = `<span style="font-size: 10px; background: #e5e7eb; color: #4b5563; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${expense.category}</span>`;
    }
    personalExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}${categoryTag}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
        <button class="delete-item-btn" onclick="deleteExpense('${month}', ${expense.globalIndex})">✕</button>
      </div>
    `;
  });

  // Calculate and render category summary for personal expenses
  const personalCategorySummaryContainer = document.getElementById(`${month}-personal-category-summary`);
  if (personalCategorySummaryContainer) {
    const categoryTotals = {};
    personalExpenses.forEach(exp => {
      const cat = exp.category || 'Sin Categoría';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    const categoriesHtml = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]).map(cat => {
      const amt = categoryTotals[cat];
      const pct = personalUsed > 0 ? ((amt / personalUsed) * 100).toFixed(0) : 0;
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #6b7280; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-size: 13px;">
          <strong style="color: #374151;">${cat}</strong>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #6b7280; font-size: 11px;">${pct}%</span>
            <span style="color: #ef4444; font-weight: 600;">€${amt.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

    if (Object.keys(categoryTotals).length > 0) {
      personalCategorySummaryContainer.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; border-top: 1px solid #e5e7eb; padding-top: 15px;">Resumen por Categorías</div>
        ${categoriesHtml}
      `;
    } else {
      personalCategorySummaryContainer.innerHTML = '';
    }
  }

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
  const inc = budget.incomes[index];
  if (window.api && inc.id) window.api.deleteIncome(inc.id);

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
    if (goal && goal.transactions) {
      const txIndex = goal.transactions.findIndex(t => t.id === expense.id);
      if (txIndex !== -1) {
        goal.currentAmount -= goal.transactions[txIndex].amount;
        goal.transactions.splice(txIndex, 1);
        if (window.api) {
          window.api.deleteGoalTransaction(expense.id);
          window.api.updateGoal({ ...goal, year: currentYear });
        }
        renderInvestmentGoals();
      }
    }
  }

  if (window.api && expense.id) window.api.deleteExpense(expense.id);
  budget.expenses.splice(index, 1);

  updateExpenseDisplay(month);
  updateSavingsChart();
  updateCategoryAutocomplete();
}

function updateCategoryAutocomplete() {
  const autocompleteList = document.getElementById('category-autocomplete-list');
  if (!autocompleteList) return;

  const uniqueCategories = new Set();
  MONTHS.forEach(m => {
    const b = monthlyBudgets[m];
    if (b && b.expenses) {
      b.expenses.forEach(e => {
        if ((e.type === 'monthly' || e.type === 'personal') && e.category && e.category !== 'Sin Categoría') {
          uniqueCategories.add(e.category);
        }
      });
    }
  });

  autocompleteList.innerHTML = Array.from(uniqueCategories)
    .sort()
    .map(cat => `<option value="${cat}">`)
    .join('');
}

function initializeSavingsChart() {
  const CHART_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const sharedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6b7280',
          font: { size: 13, weight: '500' },
          padding: 15,
          boxWidth: 0,
          boxHeight: 0
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: {
          color: '#9ca3af',
          font: { size: 12 },
          callback: v => '€' + v.toFixed(0)
        }
      }
    }
  };

  // ── Chart 1: Monthly savings ──────────────────────────────────────────
  const ctx1 = document.getElementById('savingsChart').getContext('2d');
  savingsChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: CHART_LABELS,
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
      ...sharedOptions,
      plugins: {
        ...sharedOptions.plugins,
        tooltip: {
          ...sharedOptions.plugins.tooltip,
          callbacks: { label: ctx => 'Ahorro: €' + ctx.parsed.y.toFixed(2) }
        }
      }
    }
  });

  // ── Chart 2: Cumulative savings ───────────────────────────────────────
  const ctx2 = document.getElementById('cumulativeChart').getContext('2d');
  cumulativeChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: CHART_LABELS,
      datasets: [{
        label: 'Ahorro Acumulado',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.07)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }]
    },
    options: {
      ...sharedOptions,
      plugins: {
        ...sharedOptions.plugins,
        tooltip: {
          ...sharedOptions.plugins.tooltip,
          callbacks: { label: ctx => 'Acumulado: €' + ctx.parsed.y.toFixed(2) }
        }
      },
      scales: {
        ...sharedOptions.scales,
        y: { ...sharedOptions.scales.y, beginAtZero: false }
      }
    }
  });

  window.addEventListener('resize', handleChartResize);
}

// Switches between chart 0 (monthly) and chart 1 (cumulative)
function switchChart(direction) {
  activeChartIndex = (activeChartIndex + direction + 2) % 2;

  const savingsCanvas = document.getElementById('savingsChart');
  const cumulativeCanvas = document.getElementById('cumulativeChart');
  const indicator = document.getElementById('chart-indicator');

  if (activeChartIndex === 0) {
    savingsCanvas.style.display = '';
    cumulativeCanvas.style.display = 'none';
    if (indicator) indicator.textContent = '1 / 2';
  } else {
    savingsCanvas.style.display = 'none';
    cumulativeCanvas.style.display = '';
    if (indicator) indicator.textContent = '2 / 2';
    updateCumulativeChart();
  }
}

// Calculates cumulative savings per month, starting from prior-year balances
function updateCumulativeChart() {
  if (!cumulativeChart) return;

  // ── Baseline: savings from all previous years ─────────────────────────
  let baseline = 0;
  const prevYears = availableYears.filter(y => y < currentYear);

  prevYears.forEach(year => {
    // Try to read from SQLite cache via localStorage fallback (same as updateGlobalSavings)
    const raw = localStorage.getItem('finanzasData_' + year);
    let yearBudgets = {};
    let yearWithdrawals = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      yearBudgets = parsed.monthlyBudgets || getEmptyBudgets();
      yearWithdrawals = parsed.globalSavingsWithdrawals || [];
    } else {
      yearBudgets = getEmptyBudgets();
    }
    MONTHS.forEach(m => {
      const b = yearBudgets[m];
      if (!b || b.totalIncome === 0) return;
      const mUsed = b.expenses.filter(e => e.type === 'monthly').reduce((s, e) => s + e.amount, 0);
      const pUsed = b.expenses.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0);
      const iUsed = b.expenses.filter(e => e.type === 'investment').reduce((s, e) => s + e.amount, 0);
      baseline += b.savings + (b.monthlyExpenses - mUsed) + (b.personalExpenses - pUsed) + (b.investments - iUsed);
    });
    baseline -= yearWithdrawals.reduce((s, w) => s + w.amount, 0);
  });

  // Add non-default fund amounts (manual balances independent of the app calculation)
  customFunds.forEach(f => { if (!f.isDefault) baseline += f.amount; });

  // ── Build cumulative array for current year ───────────────────────────
  let running = baseline;
  const data = MONTHS.map(month => {
    const budget = monthlyBudgets[month];
    if (budget.totalIncome === 0) return running;

    const mUsed = budget.expenses.filter(e => e.type === 'monthly').reduce((s, e) => s + e.amount, 0);
    const pUsed = budget.expenses.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0);
    const iUsed = budget.expenses.filter(e => e.type === 'investment').reduce((s, e) => s + e.amount, 0);
    const monthlySavings = budget.savings
      + (budget.monthlyExpenses - mUsed)
      + (budget.personalExpenses - pUsed)
      + (budget.investments - iUsed);

    running += monthlySavings;
    return running;
  });

  // Subtract global withdrawals from current year
  const totalWithdrawals = globalSavingsWithdrawals.reduce((s, w) => s + w.amount, 0);
  const adjustedData = data.map(v => v - totalWithdrawals);

  cumulativeChart.data.datasets[0].data = adjustedData;
  cumulativeChart.update();
}

function handleChartResize() {
  if (savingsChart) savingsChart.resize();
  if (cumulativeChart) cumulativeChart.resize();
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

  // Keep cumulative chart in sync if it is currently visible
  if (activeChartIndex === 1) {
    updateCumulativeChart();
  }

  saveYearData();

  if (typeof updateGlobalSavings === 'function') {
    updateGlobalSavings();
  }
}

function updateGlobalSavings() {
  let totalAppSavings = 0;

  availableYears.forEach(year => {
    const raw = localStorage.getItem('finanzasData_' + year);
    let yearBudgets = {};
    let yearWithdrawals = [];
    if (year === currentYear) {
      yearBudgets = monthlyBudgets;
      yearWithdrawals = globalSavingsWithdrawals;
    } else if (raw) {
      const parsed = JSON.parse(raw);
      yearBudgets = parsed.monthlyBudgets || getEmptyBudgets();
      yearWithdrawals = parsed.globalSavingsWithdrawals || [];
    } else {
      yearBudgets = getEmptyBudgets();
    }

    MONTHS.forEach(month => {
      const budget = yearBudgets[month];
      if (!budget || budget.totalIncome === 0) return;

      const monthlyUsed = budget.expenses.filter(e => e.type === 'monthly').reduce((sum, e) => sum + e.amount, 0);
      const personalUsed = budget.expenses.filter(e => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);
      const investmentUsed = budget.expenses.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);

      const monthlyLeftover = budget.monthlyExpenses - monthlyUsed;
      const personalLeftover = budget.personalExpenses - personalUsed;
      const investmentLeftover = budget.investments - investmentUsed;

      totalAppSavings += (budget.savings + monthlyLeftover + personalLeftover + investmentLeftover);
    });

    const totalDeductions = yearWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    totalAppSavings -= totalDeductions;
  });

  let globalTotal = 0;
  customFunds.forEach(fund => {
    let fundTotal = fund.amount;
    if (fund.isDefault) {
      fundTotal += totalAppSavings;
    }
    globalTotal += fundTotal;
  });

  const display = document.getElementById('global-savings-display');
  if (display) {
    display.textContent = `€${globalTotal.toFixed(2)}`;
  }

  renderCustomFunds(totalAppSavings);
}

function renderCustomFunds(appSavings = 0) {
  const container = document.getElementById('custom-funds-list');
  if (!container) return;

  container.innerHTML = customFunds.map(fund => {
    let displayAmount = fund.amount;
    if (fund.isDefault) {
      displayAmount += appSavings;
    }

    return `
      <div class="custom-fund-card ${fund.isDefault ? 'is-default' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
          <div>
            <strong style="color: #374151; font-size: 14px;">${fund.name}</strong>
            ${fund.isDefault ? '<div style="margin-top: 4px;"><span style="font-size: 10px; background: #d1fae5; color: #047857; padding: 2px 6px; border-radius: 4px;">Por Defecto</span></div>' : ''}
          </div>
          <div class="goal-options-wrapper" style="margin-top: -4px; margin-right: -4px;">
            <button class="goal-options-btn" onclick="toggleCfOptions('${fund.id}')">☰</button>
            <div id="cf-menu-${fund.id}" class="goal-options-menu">
              <button onclick="editCustomFund('${fund.id}')">Editar</button>
              <button class="delete" onclick="deleteCustomFund('${fund.id}')">Borrar</button>
            </div>
          </div>
        </div>
        <div style="font-size: 20px; font-weight: bold; color: ${fund.isDefault ? '#10b981' : '#111827'}; margin-top: 5px;">
          €${displayAmount.toFixed(2)}
        </div>
      </div>
    `;
  }).join('');
}

function openNewCustomFundModal() {
  document.getElementById('custom-fund-id').value = '';
  document.getElementById('custom-fund-name').value = '';
  document.getElementById('custom-fund-amount').value = '';
  document.getElementById('custom-fund-default').checked = false;
  document.getElementById('custom-fund-modal-title').textContent = 'Nuevo Fondo de Ahorro';
  document.getElementById('custom-fund-modal').classList.add('open');
}

function editCustomFund(id) {
  const fund = customFunds.find(f => f.id === id);
  if (!fund) return;
  document.getElementById('custom-fund-id').value = fund.id;
  document.getElementById('custom-fund-name').value = fund.name;
  document.getElementById('custom-fund-amount').value = fund.amount;
  document.getElementById('custom-fund-default').checked = fund.isDefault;
  document.getElementById('custom-fund-modal-title').textContent = 'Editar Fondo';
  document.getElementById('custom-fund-modal').classList.add('open');
}

function closeCustomFundModal() {
  document.getElementById('custom-fund-modal').classList.remove('open');
}

function toggleCfOptions(fundId) {
  const menu = document.getElementById(`cf-menu-${fundId}`);
  if (menu) {
    const isShowing = menu.classList.contains('show');
    document.querySelectorAll('.goal-options-menu.show').forEach(el => el.classList.remove('show'));
    if (!isShowing) {
      menu.classList.add('show');
    }
  }
}

function saveCustomFund() {
  const id = document.getElementById('custom-fund-id').value;
  const name = document.getElementById('custom-fund-name').value.trim();
  const amount = parseFloat(document.getElementById('custom-fund-amount').value) || 0;
  const isDefault = document.getElementById('custom-fund-default').checked;

  if (!name) {
    showValidationMessage('Por favor, ingrese un nombre para el fondo');
    return;
  }

  if (isDefault) {
    customFunds.forEach(f => f.isDefault = false);
  } else {
    const otherDefault = customFunds.some(f => f.id !== id && f.isDefault);
    if (!otherDefault) {
      showValidationMessage('Debe haber al menos un fondo por defecto que reciba el ahorro de la app.');
      return;
    }
  }

  if (id) {
    const fund = customFunds.find(f => f.id === id);
    if (fund) {
      fund.name = name;
      fund.amount = amount;
      fund.isDefault = isDefault;
      if (window.api) window.api.updateCustomFund(fund);
    }
  } else {
    const newFund = { id: 'cf-' + Date.now(), name, amount, isDefault };
    customFunds.push(newFund);
    if (window.api) window.api.addCustomFund(newFund);
  }

  closeCustomFundModal();
  updateSavingsChart();
}

function deleteCustomFund(id) {
  const fund = customFunds.find(f => f.id === id);
  if (fund && fund.isDefault) {
    showValidationMessage('No puedes borrar el fondo por defecto. Marca otro como defecto primero.');
    return;
  }

  customFunds = customFunds.filter(f => f.id !== id);
  if (window.api) window.api.deleteCustomFund(id);
  updateSavingsChart();
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
  const newGoal = {
    id: goalId,
    name: name,
    targetAmount: targetAmount,
    currentAmount: 0,
    transactions: []
  };
  investmentGoals.push(newGoal);
  if (window.api) window.api.addGoal({ ...newGoal, year: currentYear });

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
    if (!goal.transactions) goal.transactions = [];
    const tx = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      amount: amount,
      description: desc,
      date: new Date().toISOString()
    };
    goal.transactions.push(tx);
    goal.currentAmount += amount;
    if (window.api) {
      window.api.addGoalTransaction({ ...tx, goalId: goal.id });
      window.api.updateGoal({ ...goal, year: currentYear });
    }
    amountInput.value = '';
    if (descInput) descInput.value = '';
    renderInvestmentGoals();
  }
}

function deleteInvestmentGoal(goalId) {
  const index = investmentGoals.findIndex(g => g.id === goalId);
  if (index > -1) {
    investmentGoals.splice(index, 1);
    if (window.api) window.api.deleteGoal(goalId);
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
    if (window.api) window.api.updateGoal({ ...goal, year: currentYear });
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
        const canDelete = !t.isLinkedExpense;
        return `
          <div class="goal-transaction-item">
            <div class="desc" title="${t.description}">${t.description}</div>
            <div class="amt ${isPos ? 'positive' : 'negative'}">${isPos ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}</div>
            ${canDelete ? `<button class="delete-item-btn" onclick="deleteTransaction('${goal.id}', ${t.id})" title="Eliminar movimiento">✕</button>` : ''}
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

  saveYearData();
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
    'modos-ahorro': document.getElementById('settings-section-modos-ahorro'),
    'modos-especiales': document.getElementById('settings-section-modos-especiales')
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
      else if (sectionKey === 'modos-ahorro') title.textContent = 'Modos de Ahorro';
      else if (sectionKey === 'modos-especiales') title.textContent = 'Modos Especiales';
    });
  });

  const btnBeca = document.getElementById('beca-register');
  if (btnBeca) btnBeca.addEventListener('click', registerBeca);

  const btnSavings = document.getElementById('savings-withdrawal-register');
  if (btnSavings) btnSavings.addEventListener('click', registerSavingsWithdrawal);

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
      // If none has remained as default, we mark this one to guarantee always one
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
window.deleteTransaction = deleteTransaction;
window.openNewCustomFundModal = openNewCustomFundModal;
window.closeCustomFundModal = closeCustomFundModal;
window.saveCustomFund = saveCustomFund;
window.editCustomFund = editCustomFund;
window.deleteCustomFund = deleteCustomFund;
window.toggleCfOptions = toggleCfOptions;

window.openNewYearModal = openNewYearModal;
window.closeNewYearModal = closeNewYearModal;
window.createNewYear = createNewYear;
window.openEditYearModal = openEditYearModal;
window.closeEditYearModal = closeEditYearModal;
window.saveEditedYear = saveEditedYear;
window.deleteYear = deleteYear;
window.closeDeleteYearModal = closeDeleteYearModal;
window.confirmDeleteYear = confirmDeleteYear;
window.selectYear = selectYear;
window.showYearMenu = showYearMenu;
window.handleCtxEditYear = handleCtxEditYear;
window.handleCtxDeleteYear = handleCtxDeleteYear;



function deleteTransaction(goalId, transactionId) {
  const goal = investmentGoals.find(g => g.id === goalId);
  if (goal) {
    if (goal.transactions) {
      const tIndex = goal.transactions.findIndex(t => t.id === transactionId);
      if (tIndex > -1) {
        goal.currentAmount -= goal.transactions[tIndex].amount;
        goal.transactions.splice(tIndex, 1);
        if (window.api) {
          window.api.deleteGoalTransaction(transactionId);
          window.api.updateGoal({ ...goal, year: currentYear });
        }
        renderInvestmentGoals();
      }
    }
  }
}

function registerBeca() {
  const nameInput = document.getElementById('special-mode-beca-name');
  const amountInput = document.getElementById('beca-amount');
  const startMonthInput = document.getElementById('beca-start-month');
  const durationInput = document.getElementById('beca-months');

  const name = nameInput.value.trim() || 'Modo Beca';
  const amount = parseFloat(amountInput.value) || 0;
  const startMonth = startMonthInput.value;
  const duration = parseInt(durationInput.value) || 0;

  if (amount <= 0 || duration <= 0) {
    showValidationMessage('Introduce una cantidad y duración válidas.');
    return;
  }

  const startIndex = MONTHS.indexOf(startMonth);
  if (startIndex === -1) return;

  const monthlyAmount = amount / duration;
  let monthsUpdated = 0;

  for (let i = 0; i < duration; i++) {
    const targetIndex = startIndex + i;
    if (targetIndex >= MONTHS.length) break; // Don't overflow the year

    const targetMonth = MONTHS[targetIndex];
    const budget = monthlyBudgets[targetMonth];

    const incObj = {
      id: 'inc-' + Math.random().toString(36).substr(2, 9),
      amount: monthlyAmount,
      description: `${name} (${i + 1}/${duration})`,
      dest: 'reparto',
      destLabel: 'Reparto'
    };
    budget.incomes.push(incObj);
    if (window.api) window.api.addIncome({ ...incObj, year: currentYear, month: targetMonth });

    budget.totalIncome = budget.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    updateIncomeDisplay(targetMonth);
    updateBudgetAllocations(targetMonth);
    monthsUpdated++;
  }

  amountInput.value = '';
  durationInput.value = '';
  updateSavingsChart();
  showValidationMessage(`Ingreso repartido entre ${monthsUpdated} meses exitosamente.`);
}

function registerSavingsWithdrawal() {
  const nameInput = document.getElementById('special-mode-savings-name');
  const amountInput = document.getElementById('savings-withdrawal-amount');
  const destMonthInput = document.getElementById('savings-withdrawal-month');

  const name = nameInput.value.trim() || 'Modo Vivir de ahorros';
  const amount = parseFloat(amountInput.value) || 0;
  const destMonth = destMonthInput.value;

  if (amount <= 0 || !destMonth) {
    showValidationMessage('Introduce una cantidad válida y un mes.');
    return;
  }

  const budget = monthlyBudgets[destMonth];

  // Track withdrawal internally instead of negative income
  const withdrawalObj = {
    id: 'with-' + Math.random().toString(36).substr(2, 9),
    amount: Math.abs(amount),
    month: destMonth,
    date: new Date().toISOString()
  };
  globalSavingsWithdrawals.push(withdrawalObj);
  if (window.api) window.api.addGlobalWithdrawal({ ...withdrawalObj, year: currentYear });

  // Create positive income corresponding to what is being injected into the month
  const incObj = {
    id: 'inc-' + Math.random().toString(36).substr(2, 9),
    amount: Math.abs(amount),
    description: `${name} (Inyección)`,
    dest: 'monthly',
    destLabel: 'Mensuales'
  };
  budget.incomes.push(incObj);
  if (window.api) window.api.addIncome({ ...incObj, year: currentYear, month: destMonth });

  budget.totalIncome = budget.incomes.reduce((sum, inc) => sum + inc.amount, 0);
  updateIncomeDisplay(destMonth);
  updateBudgetAllocations(destMonth);
  updateSavingsChart();

  amountInput.value = '';
  showValidationMessage(`Ahorro inyectado exitosamente en ${destMonth.charAt(0).toUpperCase() + destMonth.slice(1)}.`);
}
