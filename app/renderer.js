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
let activeChartIndex = 0; // Historically: 0 = monthly savings, 1 = cumulative (deprecated)
let validationMessageTimeout = null;
let customFunds = [];

// Las funciones getCustomFunds y saveCustomFunds han sido reemplazadas por la API de SQLite

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

  try {
    // 1. Data loading first
    await loadAvailableYears();
    await loadYearData(currentYear);

    if (window.api) {
      customFunds = await window.api.getCustomFunds();
      if (!customFunds || customFunds.length === 0) {
        const defaultFund = { id: 'fund-default', name: 'Cuenta Principal', amount: 0, isDefault: true };
        await window.api.addCustomFund(defaultFund);
        customFunds = [defaultFund];
      }
    }

    // 2. Ensure defaults are in place (uses loaded APP_SETTINGS)
    await ensureDefaultSavingsModes();

    // 3. UI Initialization (after settings are loaded)
    initializeTabs();
    initializeMonthlyTabs();
    await initializeSettingsUI();

    renderYearSidebar();
    initializeSavingsChart();
    renderInvestmentGoals();
    await renderIncomeModeSelectors();
    updateCategoryAutocomplete();
  } catch (error) {
    console.error('Error during initial data loading:', error);
    showValidationMessage('Error al cargar datos. Algunas funciones podrían no estar disponibles.');
  }
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

  const displayEl = document.getElementById('sidebar-year-display');
  if (displayEl) {
    displayEl.textContent = currentYear || 'Ninguno';
  }

  list.innerHTML = years.map(y => {
    const isSelected = y === currentYear;
    return `
      <div class="year-card ${isSelected ? 'active' : ''}" style="
        background: white; 
        border-radius: 12px; 
        padding: 24px; 
        box-shadow: ${isSelected ? '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}; 
        border: 2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}; 
        transition: all 0.2s ease-in-out;
        position: relative;
        cursor: pointer;
      " onclick="selectYear(${y})" oncontextmenu="showYearMenu(event, ${y})"
      onmouseover="this.style.borderColor='${isSelected ? '#3b82f6' : '#9ca3af'}'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';"
      onmouseout="this.style.borderColor='${isSelected ? '#3b82f6' : '#e5e7eb'}'; this.style.transform='translateY(0)'; this.style.boxShadow='${isSelected ? '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}';">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
           <span style="font-size: 24px; font-weight: 800; color: ${isSelected ? '#1d4ed8' : '#1f2937'};">📅 ${y}</span>
           ${isSelected ? '<span style="font-size: 10px; font-weight: 700; background: #3b82f6; color: white; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.05em; text-transform: uppercase;">Activo</span>' : ''}
        </div>
        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0 0 20px 0;">Gestión financiera y seguimiento de objetivos para el periodo ${y}.</p>
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f3f4f6; pt: 15px; margin-top: auto; padding-top: 15px;">
           <span style="font-size: 11px; color: #9ca3af; font-weight: 500;">Click derecho para más opciones</span>
           <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isSelected ? '#eff6ff' : '#f9fafb'}; display: flex; align-items: center; justify-content: center; color: ${isSelected ? '#3b82f6' : '#9ca3af'}; transition: all 0.2s;">
             ${isSelected ? '✓' : '→'}
           </div>
        </div>
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
  if (currentYear === year) {
    const mainTabBtn = document.querySelector('.tab-button[data-tab="main"]');
    if (mainTabBtn) mainTabBtn.click();
    return;
  }
  
  loadYearData(year);
  renderYearSidebar();

  initializeMonthlyTabs();
  renderIncomeModeSelectors();
  updateSavingsChart();
  renderInvestmentGoals();
  updateCategoryAutocomplete();

  const mainTabBtn = document.querySelector('.tab-button[data-tab="main"]');
  if (mainTabBtn) mainTabBtn.click();
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

async function setSavingsModes(modes) {
  APP_SETTINGS['savingsModes'] = modes;
  if (window.api) {
    try {
      await window.api.saveSetting('savingsModes', modes);
    } catch (err) {
      console.error('setSavingsModes: Error al guardar en DB:', err);
    }
  }
}

async function ensureDefaultSavingsModes() {
  const existing = getSavingsModes();
  if (existing.length > 0) return;

  await setSavingsModes([
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

      if (button.parentElement && button.parentElement.id === 'months-nav-container') {
        const container = button.parentElement;
        const buttonTop = button.offsetTop - container.offsetTop;
        container.scrollTo({
          top: buttonTop - 48, // Centrar: Alto elemento 48, Contenedor 144 -> 144/2 - 48/2 = 48
          behavior: 'smooth'
        });
      }
    });
  });
}

window.navigateMonth = function(direction) {
  const container = document.getElementById('months-nav-container');
  if (!container) return;
  const monthTabs = Array.from(container.querySelectorAll('.tab-button'));
  const activeIndex = monthTabs.findIndex(tab => tab.classList.contains('active'));
  
  if (activeIndex === -1) {
    if (monthTabs.length > 0) monthTabs[0].click();
    return;
  }
  
  const nextIndex = activeIndex + direction;
  if (nextIndex >= 0 && nextIndex < monthTabs.length) {
    monthTabs[nextIndex].click();
  }
};

function initializeMonthlyTabs() {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  months.forEach(month => {
    const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
    const tabContent = document.getElementById(month);
    tabContent.classList.add('month-tab');
    tabContent.innerHTML = `
      <div class="month-layout">
        <!-- ═══ TOP: Summary Panel ═══════════════════════════════════ -->
        <div class="month-summary-panel">

          <!-- Left: mode selector + progress bars -->
          <div class="month-summary-left">
            <div class="month-summary-header">
              <h2 class="month-title">${monthLabel}</h2>
              <div class="month-mode-row">
                <label for="${month}-income-mode" class="month-mode-label">Modo de reparto</label>
                <select id="${month}-income-mode" class="month-mode-select"></select>
              </div>
            </div>

            <div class="month-progress-section">
              <!-- Income stat -->
              <div class="month-stat-row">
                <span class="stat-icon">💰</span>
                <span class="stat-label">Ingresos totales</span>
                <span class="stat-value income-value" id="${month}-income-total">€0.00</span>
              </div>

              <!-- Monthly bar -->
              <div class="month-progress-item">
                <div class="month-progress-header">
                  <div class="progress-label-group">
                    <span class="progress-dot monthly-dot"></span>
                    <span class="progress-cat-label">Gastos Mensuales</span>
                    <span class="pct-badge monthly-badge" id="${month}-monthly-pct">40%</span>
                  </div>
                  <span class="progress-remaining monthly-remaining" id="${month}-monthly-remaining">€0.00 disp.</span>
                </div>
                <div class="month-progress-track">
                  <div class="month-progress-fill monthly-fill" id="${month}-monthly-fill" style="width:0%"></div>
                </div>
                <small class="month-progress-info" id="${month}-monthly-info">Usado: €0 / €0</small>
              </div>

              <!-- Personal bar -->
              <div class="month-progress-item">
                <div class="month-progress-header">
                  <div class="progress-label-group">
                    <span class="progress-dot personal-dot"></span>
                    <span class="progress-cat-label">Gastos Personales</span>
                    <span class="pct-badge personal-badge" id="${month}-personal-pct">20%</span>
                  </div>
                  <span class="progress-remaining personal-remaining" id="${month}-personal-remaining">€0.00 disp.</span>
                </div>
                <div class="month-progress-track">
                  <div class="month-progress-fill personal-fill" id="${month}-personal-fill" style="width:0%"></div>
                </div>
                <small class="month-progress-info" id="${month}-personal-info">Usado: €0 / €0</small>
              </div>

              <!-- Investment bar -->
              <div class="month-progress-item">
                <div class="month-progress-header">
                  <div class="progress-label-group">
                    <span class="progress-dot investment-dot"></span>
                    <span class="progress-cat-label">Inversiones</span>
                    <span class="pct-badge investment-badge" id="${month}-investment-pct">20%</span>
                  </div>
                  <span class="progress-remaining investment-remaining" id="${month}-investment-remaining">€0.00 disp.</span>
                </div>
                <div class="month-progress-track">
                  <div class="month-progress-fill investment-fill" id="${month}-investment-fill" style="width:0%"></div>
                </div>
                <small class="month-progress-info" id="${month}-investment-info">Usado: €0 / €0</small>
              </div>

              <!-- Savings total -->
              <div class="month-savings-row">
                <div class="savings-row-left">
                  <span class="progress-dot savings-dot"></span>
                  <span class="progress-cat-label">Ahorro del mes</span>
                  <span class="pct-badge savings-badge" id="${month}-savings-pct">20%</span>
                </div>
                <div class="savings-row-right">
                  <span class="savings-total-label">Total Ahorrado:</span>
                  <span class="savings-total-value" id="${month}-savings-display">€0.00</span>
                </div>
              </div>
              <small class="month-progress-info" id="${month}-savings-info">Base: €0 + Sobrantes</small>
            </div>
          </div>

          <!-- Right: Doughnut charts -->
          <div class="month-summary-right">
            <div class="month-doughnut-card">
              <div class="doughnut-card-title monthly-title">🏠 Mensuales</div>
              <div class="doughnut-wrap">
                <canvas id="${month}-monthly-chart"></canvas>
                <div id="${month}-monthly-center-text" class="doughnut-center">€0</div>
              </div>
              <div id="${month}-monthly-legend" class="doughnut-legend"></div>
            </div>
            <div class="month-doughnut-card">
              <div class="doughnut-card-title personal-title">🛍️ Personales</div>
              <div class="doughnut-wrap">
                <canvas id="${month}-personal-chart"></canvas>
                <div id="${month}-personal-center-text" class="doughnut-center">€0</div>
              </div>
              <div id="${month}-personal-legend" class="doughnut-legend"></div>
            </div>
            <div class="month-doughnut-card">
              <div class="doughnut-card-title investment-title">📈 Inversiones</div>
              <div class="doughnut-wrap">
                <canvas id="${month}-investment-chart"></canvas>
                <div id="${month}-investment-center-text" class="doughnut-center">€0</div>
              </div>
              <div id="${month}-investment-legend" class="doughnut-legend"></div>
            </div>
          </div>
        </div>

        <!-- ═══ BOTTOM: Transactions Table ══════════════════════════ -->
        <div class="month-table-panel">
          <div class="month-table-topbar">
            <h3 class="month-table-title">Transacciones</h3>
          </div>
          <div class="month-table-scroll">
            <table class="transactions-table">
              <thead>
                <tr>
                  <th class="col-desc">Descripción</th>
                  <th class="col-amount">Cantidad</th>
                  <th class="col-type">Tipo</th>
                  <th class="col-detail">Detalle</th>
                  <th class="col-action"></th>
                </tr>
              </thead>
              <tbody id="${month}-tx-body"></tbody>
              <tfoot>
                <tr class="add-tx-row">
                  <td class="col-desc">
                    <input type="text" id="${month}-add-desc" placeholder="Descripción..." class="tx-input">
                  </td>
                  <td class="col-amount">
                    <input type="number" id="${month}-add-amount" placeholder="€0.00" step="0.01" min="0" class="tx-input tx-amount">
                  </td>
                  <td class="col-type">
                    <select id="${month}-add-type" class="tx-select" onchange="onAddTypeChange('${month}')">
                      <option value="">Tipo...</option>
                      <option value="income">💰 Ingreso</option>
                      <option value="monthly">🏠 Gasto Mensual</option>
                      <option value="personal">🛍️ Gasto Personal</option>
                      <option value="investment">📈 Inversión</option>
                    </select>
                  </td>
                  <td class="col-detail" id="${month}-add-context-cell"></td>
                  <td class="col-action">
                    <button class="add-tx-btn" onclick="addTransaction('${month}')" title="Añadir transacción">+</button>
                  </td>
                </tr>
              </tfoot>
            </table>
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
  const incomeEl = document.getElementById(`${month}-income-total`);
  if (incomeEl) incomeEl.textContent = `€${budget.totalIncome.toFixed(2)}`;
  renderTransactionTable(month);
}




function updateBudgetAllocations(month) {
  const budget = monthlyBudgets[month];

  const distributableIncome = budget.incomes
    .filter(i => !i.dest || i.dest === 'reparto')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const directMonthly    = budget.incomes.filter(i => i.dest === 'monthly').reduce((s, inc) => s + inc.amount, 0);
  const directPersonal   = budget.incomes.filter(i => i.dest === 'personal').reduce((s, inc) => s + inc.amount, 0);
  const directInvestment = budget.incomes.filter(i => i.dest === 'investment').reduce((s, inc) => s + inc.amount, 0);
  const directSavings    = budget.incomes.filter(i => i.dest === 'savings').reduce((s, inc) => s + inc.amount, 0);

  // Update total internal property to ensure chart uses it correctly
  budget.totalIncome = distributableIncome + directMonthly + directPersonal + directInvestment + directSavings;

  const mode = getModeForMonth(month);
  const sum = modeSumPercent(mode.allocations || {});
  if (Math.abs(sum - 100) > 0.0001) {
    showValidationMessage(`El perfil "${mode.name || 'sin nombre'}" no suma 100%`);
  }

  const monthlyPct  = (Number(mode.allocations?.monthly)    || 0) / 100;
  const personalPct = (Number(mode.allocations?.personal)   || 0) / 100;
  const investPct   = (Number(mode.allocations?.investment) || 0) / 100;
  const savingsPct  = (Number(mode.allocations?.savings)    || 0) / 100;

  // Update pct badges (now display "XX%" in badge elements)
  const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setEl(`${month}-monthly-pct`,    (Number(mode.allocations?.monthly)    || 0) + '%');
  setEl(`${month}-personal-pct`,   (Number(mode.allocations?.personal)   || 0) + '%');
  setEl(`${month}-investment-pct`, (Number(mode.allocations?.investment) || 0) + '%');
  setEl(`${month}-savings-pct`,    (Number(mode.allocations?.savings)    || 0) + '%');

  const monthlyExpenses  = (distributableIncome * monthlyPct) + directMonthly;
  const personalExpenses = (distributableIncome * personalPct) + directPersonal;
  const investments      = (distributableIncome * investPct) + directInvestment;
  const baseSavings      = (distributableIncome * savingsPct) + directSavings;

  budget.monthlyExpenses  = monthlyExpenses;
  budget.personalExpenses = personalExpenses;
  budget.investments      = investments;
  budget.savings          = baseSavings;

  createCategoryCharts(month);
  updateExpenseDisplay(month);
}

// Category-distribution doughnuts (one per expense type)
function createCategoryCharts(month) {
  const budget = monthlyBudgets[month];
  const CAT_COLORS = [
    '#6366f1','#f59e0b','#10b981','#3b82f6','#ef4444',
    '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'
  ];

  function buildDoughnut(canvasId, expenses) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (canvas.chart) { canvas.chart.destroy(); canvas.chart = null; }

    const catMap = {};
    expenses.forEach(e => {
      const cat = e.category || e.description || 'Sin nombre';
      catMap[cat] = (catMap[cat] || 0) + e.amount;
    });
    const labels = Object.keys(catMap);
    const data   = labels.map(l => catMap[l]);
    const colors = labels.length > 0
      ? labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length])
      : ['#e5e7eb'];

    canvas.chart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sin datos'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors,
          borderColor: 'white',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => labels.length > 0 ? `${ctx.label}: €${ctx.parsed.toFixed(2)}` : 'Sin datos'
            }
          }
        }
      }
    });
  }

  buildDoughnut(`${month}-monthly-chart`,    budget.expenses.filter(e => e.type === 'monthly'));
  buildDoughnut(`${month}-personal-chart`,   budget.expenses.filter(e => e.type === 'personal'));
  buildDoughnut(`${month}-investment-chart`, budget.expenses.filter(e => e.type === 'investment'));
}

function updateExpenseDisplay(month) {
  const budget = monthlyBudgets[month];

  const monthlyUsed    = budget.expenses.filter(e => e.type === 'monthly').reduce((s, e) => s + e.amount, 0);
  const personalUsed   = budget.expenses.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0);
  const investmentUsed = budget.expenses.filter(e => e.type === 'investment').reduce((s, e) => s + e.amount, 0);

  const monthlyLeftover    = Math.max(0, budget.monthlyExpenses - monthlyUsed);
  const personalLeftover   = Math.max(0, budget.personalExpenses - personalUsed);
  const investmentLeftover = Math.max(0, budget.investments - investmentUsed);
  const totalSavings = budget.savings + monthlyLeftover + personalLeftover + investmentLeftover;

  const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  // Info texts
  setEl(`${month}-monthly-info`,    `Usado: €${monthlyUsed.toFixed(2)} / €${budget.monthlyExpenses.toFixed(2)}`);
  setEl(`${month}-personal-info`,   `Usado: €${personalUsed.toFixed(2)} / €${budget.personalExpenses.toFixed(2)}`);
  setEl(`${month}-investment-info`, `Usado: €${investmentUsed.toFixed(2)} / €${budget.investments.toFixed(2)}`);
  setEl(`${month}-savings-info`,    `Base: €${budget.savings.toFixed(2)} + Sobrantes: €${(monthlyLeftover + personalLeftover + investmentLeftover).toFixed(2)}`);
  setEl(`${month}-savings-display`, `€${totalSavings.toFixed(2)}`);

  // Progress bars
  function updateBar(fillId, remainingId, used, bgt) {
    const pct   = bgt > 0 ? Math.min(100, (used / bgt) * 100) : 0;
    const fillEl = document.getElementById(fillId);
    const remEl  = document.getElementById(remainingId);
    if (fillEl) fillEl.style.width = pct + '%';
    if (remEl)  remEl.textContent  = `€${Math.max(0, bgt - used).toFixed(2)} disp.`;
  }
  updateBar(`${month}-monthly-fill`,    `${month}-monthly-remaining`,    monthlyUsed,    budget.monthlyExpenses);
  updateBar(`${month}-personal-fill`,   `${month}-personal-remaining`,   personalUsed,   budget.personalExpenses);
  updateBar(`${month}-investment-fill`, `${month}-investment-remaining`, investmentUsed, budget.investments);

  // Doughnut center texts
  setEl(`${month}-monthly-center-text`,    `€${monthlyUsed.toFixed(2)}`);
  setEl(`${month}-personal-center-text`,   `€${personalUsed.toFixed(2)}`);
  setEl(`${month}-investment-center-text`, `€${investmentUsed.toFixed(2)}`);

  // Doughnut legends
  updateDoughnutLegends(month);

  // Unified transaction table
  renderTransactionTable(month);
}

// ─── Doughnut legends (category breakdown below each chart) ──────────────────
function updateDoughnutLegends(month) {
  const budget = monthlyBudgets[month];
  const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];

  function buildLegend(legendId, expenses) {
    const el = document.getElementById(legendId);
    if (!el) return;
    const catMap = {};
    expenses.forEach(e => {
      const cat = e.category || e.description || 'Sin nombre';
      catMap[cat] = (catMap[cat] || 0) + e.amount;
    });
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      el.innerHTML = '<span class="legend-empty">Sin gastos</span>';
      return;
    }
    el.innerHTML = entries.map(([cat, amt], i) =>
      `<div class="legend-item">
        <span class="legend-dot" style="background:${COLORS[i % COLORS.length]}"></span>
        <span class="legend-label" title="${cat}">${cat}</span>
        <span class="legend-value">€${amt.toFixed(2)}</span>
      </div>`
    ).join('');
  }

  buildLegend(`${month}-monthly-legend`,    budget.expenses.filter(e => e.type === 'monthly'));
  buildLegend(`${month}-personal-legend`,   budget.expenses.filter(e => e.type === 'personal'));
  buildLegend(`${month}-investment-legend`, budget.expenses.filter(e => e.type === 'investment'));
}

// ─── Unified transaction table ────────────────────────────────────────────────
function renderTransactionTable(month) {
  const budget = monthlyBudgets[month];
  const tbody  = document.getElementById(`${month}-tx-body`);
  if (!tbody) return;

  const TYPE_META = {
    income:     { label: '💰 Ingreso',   cls: 'badge-income' },
    monthly:    { label: '🏠 Mensual',   cls: 'badge-monthly' },
    personal:   { label: '🛍️ Personal',  cls: 'badge-personal' },
    investment: { label: '📈 Inversión', cls: 'badge-investment' }
  };

  const rows = [];
  budget.incomes.forEach((inc, idx) => {
    rows.push({ kind: 'income', idx, description: inc.description, amount: inc.amount, detail: inc.destLabel || 'Repartido', positive: true });
  });
  budget.expenses.forEach((exp, idx) => {
    let detail = '';
    if (exp.type === 'monthly' || exp.type === 'personal') detail = exp.category || 'Sin Categoría';
    else if (exp.type === 'investment') detail = exp.description;
    rows.push({ kind: exp.type, idx, description: exp.description, amount: exp.amount, detail, positive: false });
  });

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="tx-empty">Sin transacciones todavía. Añade una en la fila de abajo ↓</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => {
    const meta  = TYPE_META[row.kind] || { label: row.kind, cls: '' };
    const color = row.positive ? '#10b981' : '#ef4444';
    const sign  = row.positive ? '+' : '-';
    const delFn = row.kind === 'income'
      ? `deleteIncomeByIndex('${month}', ${row.idx})`
      : `deleteExpenseByIndex('${month}', ${row.idx})`;
    return `<tr class="tx-row">
      <td class="col-desc tx-desc">${row.description}</td>
      <td class="col-amount tx-amount" style="color:${color}">${sign}€${row.amount.toFixed(2)}</td>
      <td class="col-type"><span class="tx-type-badge ${meta.cls}">${meta.label}</span></td>
      <td class="col-detail tx-detail">${row.detail}</td>
      <td class="col-action"><button class="tx-delete-btn" onclick="${delFn}" title="Eliminar">✕</button></td>
    </tr>`;
  }).join('');
}

// ─── Context field for add-transaction row ────────────────────────────────────
window.onAddTypeChange = function(month) {
  const typeSelect  = document.getElementById(`${month}-add-type`);
  const contextCell = document.getElementById(`${month}-add-context-cell`);
  if (!typeSelect || !contextCell) return;
  const type = typeSelect.value;

  if (type === 'income') {
    contextCell.innerHTML = `
      <select id="${month}-add-context" class="tx-select">
        <option value="reparto">Repartir (según Modo)</option>
        <option value="monthly">→ Gastos Mensuales</option>
        <option value="personal">→ Gastos Personales</option>
        <option value="investment">→ Inversiones</option>
        <option value="savings">→ Ahorro</option>
      </select>`;
  } else if (type === 'monthly' || type === 'personal') {
    contextCell.innerHTML = `<input type="text" id="${month}-add-context" list="category-autocomplete-list" placeholder="Categoría (opcional)..." class="tx-input">`;
  } else if (type === 'investment') {
    const opts = investmentGoals.length > 0
      ? investmentGoals.map(g => `<option value="${g.id}">${g.name}</option>`).join('')
      : '<option value="">Sin fondos disponibles</option>';
    contextCell.innerHTML = `
      <select id="${month}-add-context" class="tx-select">
        <option value="">Selecciona fondo...</option>
        ${opts}
      </select>`;
  } else {
    contextCell.innerHTML = '';
  }
};

// ─── Unified add transaction ──────────────────────────────────────────────────
window.addTransaction = function(month) {
  const typeSelect  = document.getElementById(`${month}-add-type`);
  const descInput   = document.getElementById(`${month}-add-desc`);
  const amountInput = document.getElementById(`${month}-add-amount`);
  const contextEl   = document.getElementById(`${month}-add-context`);
  const type        = typeSelect  ? typeSelect.value        : '';
  const description = descInput   ? descInput.value.trim()  : '';
  const amount      = parseFloat(amountInput ? amountInput.value : '') || 0;
  const contextValue = contextEl  ? contextEl.value         : '';

  if (!type)        { showValidationMessage('Selecciona un tipo de transacción'); return; }
  if (!description) { showValidationMessage('Introduce una descripción');         return; }
  if (amount <= 0)  { showValidationMessage('Introduce una cantidad válida');     return; }

  if (type === 'income') {
    const dest = contextValue || 'reparto';
    let destLabel = 'Repartido';
    if (contextEl && contextEl.tagName === 'SELECT' && contextEl.selectedIndex >= 0) {
      destLabel = contextEl.options[contextEl.selectedIndex].text;
    }
    const budget = monthlyBudgets[month];
    const id = 'inc-' + Math.random().toString(36).substr(2, 9);
    const incObj = { id, amount, description, dest, destLabel };
    budget.incomes.push(incObj);
    if (window.api) window.api.addIncome({ ...incObj, year: currentYear, month });
    budget.totalIncome = budget.incomes.reduce((s, i) => s + i.amount, 0);
    updateIncomeDisplay(month);
    updateBudgetAllocations(month);
    updateSavingsChart();
  } else {
    const budget = monthlyBudgets[month];
    const budgetLimit = type === 'monthly'  ? budget.monthlyExpenses
                      : type === 'personal' ? budget.personalExpenses
                      : budget.investments;
    const currentUsed = budget.expenses.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0);
    if (currentUsed + amount > budgetLimit) {
      showValidationMessage(`Excede presupuesto. Disponible: €${Math.max(0, budgetLimit - currentUsed).toFixed(2)}`);
      return;
    }
    if (type === 'investment' && !contextValue) {
      showValidationMessage('Selecciona un fondo de inversión'); return;
    }
    const expenseObj = { type, amount, description, id: 'exp-' + Math.random().toString(36).substr(2, 9) };
    if (type === 'monthly' || type === 'personal') {
      expenseObj.category = contextValue || 'Sin Categoría';
    }
    if (type === 'investment') {
      expenseObj.goalId = contextValue;
      const goal = investmentGoals.find(g => g.id === contextValue);
      if (goal) {
        if (!goal.transactions) goal.transactions = [];
        const tx = { id: expenseObj.id, amount, description: `Aportación desde ${month}`, date: new Date().toISOString(), isLinkedExpense: true };
        goal.transactions.push(tx);
        goal.currentAmount += amount;
        if (window.api) {
          window.api.addGoalTransaction({ ...tx, goalId: goal.id });
          window.api.updateGoal({ ...goal, year: currentYear });
        }
        renderInvestmentGoals();
      }
    }
    budget.expenses.push(expenseObj);
    if (window.api) window.api.addExpense({ ...expenseObj, year: currentYear, month });
    updateExpenseDisplay(month);
    updateSavingsChart();
    updateCategoryAutocomplete();
  }

  // Reset form
  if (descInput)   descInput.value = '';
  if (amountInput) amountInput.value = '';
  if (typeSelect)  typeSelect.value = '';
  const ctx = document.getElementById(`${month}-add-context-cell`);
  if (ctx) ctx.innerHTML = '';
};

// ─── Delete helpers (by index, used from transaction table) ──────────────────
window.deleteIncomeByIndex = function(month, index) {
  deleteIncome(month, index);
};

window.deleteExpenseByIndex = function(month, index) {
  deleteExpense(month, index);
};



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
    type: 'bar',
    data: {
      labels: CHART_LABELS,
      datasets: [{
        label: 'Ahorro Mensual',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        hoverBackgroundColor: '#6366f1',
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8
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


// Calculates cumulative savings per month, starting from prior-year balances
async function updateCumulativeChart() {
  if (!cumulativeChart) return;

  // ── Baseline: savings from all previous years ─────────────────────────
  let baseline = 0;
  const prevYears = availableYears.filter(y => y < currentYear);

  for (const year of prevYears) {
    let yearBudgets = {};
    let yearWithdrawals = [];

    if (window.api) {
      const raw = await window.api.getYearData(year);
      yearBudgets = getEmptyBudgets();
      for (const inc of raw.incomes) {
        yearBudgets[inc.month].incomes.push(inc);
        yearBudgets[inc.month].totalIncome += inc.amount;
      }
      for (const exp of raw.expenses) {
        yearBudgets[exp.month].expenses.push(exp);
      }
      yearWithdrawals = raw.globalWithdrawals || [];
    } else {
      yearBudgets = getEmptyBudgets();
    }

    MONTHS.forEach(m => {
      const b = yearBudgets[m];
      if (!b || b.totalIncome === 0) return;

      // Usando allocations por defecto para años pasados (simplificación coherente con updateGlobalSavings)
      const mPct = 40 / 100, pPct = 20 / 100, iPct = 20 / 100, sPct = 20 / 100;

      const distInc = b.incomes.filter(i => !i.dest || i.dest === 'reparto').reduce((s, inc) => s + inc.amount, 0);
      const dM = b.incomes.filter(i => i.dest === 'monthly').reduce((s, inc) => s + inc.amount, 0);
      const dP = b.incomes.filter(i => i.dest === 'personal').reduce((s, inc) => s + inc.amount, 0);
      const dI = b.incomes.filter(i => i.dest === 'investment').reduce((s, inc) => s + inc.amount, 0);
      const dS = b.incomes.filter(i => i.dest === 'savings').reduce((s, inc) => s + inc.amount, 0);

      const mB = (distInc * mPct) + dM;
      const pB = (distInc * pPct) + dP;
      const iB = (distInc * iPct) + dI;
      const sB = (distInc * sPct) + dS;

      const mUsed = b.expenses.filter(e => e.type === 'monthly').reduce((s, e) => s + e.amount, 0);
      const pUsed = b.expenses.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0);
      const iUsed = b.expenses.filter(e => e.type === 'investment').reduce((s, e) => s + e.amount, 0);

      baseline += (sB + (mB - mUsed) + (pB - pUsed) + (iB - iUsed));
    });
    baseline -= yearWithdrawals.reduce((s, w) => s + w.amount, 0);
  }

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

    // Para el año actual sí tenemos las allocations correctas en budget.monthlyExpenses etc.
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

async function updateSavingsChart() {
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

  await updateCumulativeChart();

  saveYearData();

  if (typeof updateGlobalSavings === 'function') {
    await updateGlobalSavings();
  }
}

function saveYearData() {
  // En la versión SQLite, los datos se guardan individualmente tras cada cambio
  // mediante window.api.addIncome, addExpense, etc.
  // Esta función se mantiene para compatibilidad con llamadas existentes.
}

async function updateGlobalSavings() {
  let totalAppSavings = 0;

  for (const year of availableYears) {
    if (year > currentYear) continue;
    let yearBudgets = {};
    let yearWithdrawals = [];

    if (year === currentYear) {
      yearBudgets = monthlyBudgets;
      yearWithdrawals = globalSavingsWithdrawals;
    } else {
      if (window.api) {
        const raw = await window.api.getYearData(year);
        // Reconstruimos el objeto monthlyBudgets para el año histórico
        yearBudgets = getEmptyBudgets();
        for (const inc of raw.incomes) {
          yearBudgets[inc.month].incomes.push(inc);
          yearBudgets[inc.month].totalIncome += inc.amount;
        }
        for (const exp of raw.expenses) {
          yearBudgets[exp.month].expenses.push(exp);
        }
        yearWithdrawals = raw.globalWithdrawals || [];
      } else {
        yearBudgets = getEmptyBudgets();
      }
    }

    MONTHS.forEach(month => {
      const budget = yearBudgets[month];
      if (!budget || budget.totalIncome === 0) return;

      const mode = (year === currentYear) ? getModeForMonth(month) : { allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 } };
      // Nota: Para años pasados, si no guardamos el modo específico usado en aquel entonces en la DB,
      // aquí se usará el por defecto. Si se desea precisión histórica, habría que guardar el modeId en cada mes en la DB.
      // Sin embargo, para agilizar el cálculo del ahorro acumulado, usamos los valores calculados.

      // Recalculamos allocations si es necesario (para años históricos)
      // En una implementación ideal, estos valores estarían cacheados o guardados.
      const distributableIncome = budget.incomes
        .filter(i => !i.dest || i.dest === 'reparto')
        .reduce((sum, inc) => sum + inc.amount, 0);

      const directMonthly = budget.incomes.filter(i => i.dest === 'monthly').reduce((sum, inc) => sum + inc.amount, 0);
      const directPersonal = budget.incomes.filter(i => i.dest === 'personal').reduce((sum, inc) => sum + inc.amount, 0);
      const directInvestment = budget.incomes.filter(i => i.dest === 'investment').reduce((sum, inc) => sum + inc.amount, 0);
      const directSavings = budget.incomes.filter(i => i.dest === 'savings').reduce((sum, inc) => sum + inc.amount, 0);

      // Usamos 40/20/20/20 como fallback si no es el año actual (simplificación)
      const mPct = (mode.allocations?.monthly || 40) / 100;
      const pPct = (mode.allocations?.personal || 20) / 100;
      const iPct = (mode.allocations?.investment || 20) / 100;
      const sPct = (mode.allocations?.savings || 20) / 100;

      const mBudget = (distributableIncome * mPct) + directMonthly;
      const pBudget = (distributableIncome * pPct) + directPersonal;
      const iBudget = (distributableIncome * iPct) + directInvestment;
      const sBase = (distributableIncome * sPct) + directSavings;

      const mUsed = budget.expenses.filter(e => e.type === 'monthly').reduce((sum, e) => sum + e.amount, 0);
      const pUsed = budget.expenses.filter(e => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);
      const iUsed = budget.expenses.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);

      const mLeftover = mBudget - mUsed;
      const pLeftover = pBudget - pUsed;
      const iLeftover = iBudget - iUsed;

      totalAppSavings += (sBase + mLeftover + pLeftover + iLeftover);
    });

    const totalDeductions = yearWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    totalAppSavings -= totalDeductions;
  }

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
            ${canDelete ? `<button class="delete-item-btn" onclick="deleteTransaction('${goal.id}', '${t.id}')" title="Eliminar movimiento">✕</button>` : ''}
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

async function initializeSettingsUI() {
  const navButtons = document.querySelectorAll('.settings-nav-button');
  const sections = {
    general: document.getElementById('settings-section-general'),
    'modos-ahorro': document.getElementById('settings-section-modos-ahorro'),
    'modos-especiales': document.getElementById('settings-section-modos-especiales')
  };
  const title = document.getElementById('settings-title');

  if (!sections.general || !title) return;


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

  await initializeModesUI();
}

async function initializeModesUI() {
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        const all = getSavingsModes();
        const target = all.find(m => m.id === id);
        if (target && target.isDefault && all.length > 1) {
          showValidationMessage('No se puede eliminar el perfil por defecto. Marca otro como defecto primero.');
          return;
        }
        const modes = all.filter(m => m.id !== id);
        await setSavingsModes(modes);
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

  async function createNew() {
    const id = 'mode-' + Date.now();
    const mode = {
      id,
      name: 'Nuevo perfil',
      allocations: { monthly: 40, personal: 20, investment: 20, savings: 20 }
    };
    const modes = getSavingsModes();
    modes.unshift(mode);
    await setSavingsModes(modes);
    loadMode(mode);
    renderList();
    renderIncomeModeSelectors();
  }

  createBtn.addEventListener('click', async () => {
    await createNew();
  });

  saveBtn.addEventListener('click', async () => {
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
    await setSavingsModes(modes);
    renderList();
    renderIncomeModeSelectors();
    showValidationMessage('Perfil guardado correctamente');
  });

  const modes = getSavingsModes();

  if (modes.length === 0) {
    await createNew();
  } else {
    loadMode(modes[0]);
  }
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
