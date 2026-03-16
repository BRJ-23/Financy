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

let savingsChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeMonthlyTabs();
  initializeSavingsChart();
});

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
            <div style="height: 150px; width: 100%; position: relative; margin-bottom: 15px;">
              <canvas id="${month}-income-chart"></canvas>
            </div>
            <div class="input-section" style="padding: 10px 0; margin: 0;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="number" id="${month}-income-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <input type="text" id="${month}-income-description" placeholder="Descripción (ej: Salario)" style="min-width: auto;">
                <button onclick="addIncome('${month}')" style="margin: 0;">Añadir Ingreso</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-income-list"></div>
          </div>
          
          <div class="category-card expense">
            <h3>Gastos Mensuales (40%)</h3>
            <div class="amount" id="${month}-monthly-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-monthly-chart"></canvas>
            </div>
            <small id="${month}-monthly-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="number" id="${month}-monthly-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <input type="text" id="${month}-monthly-description" placeholder="Descripción" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'monthly')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-monthly-list"></div>
          </div>
          
          <div class="category-card personal">
            <h3>Gastos Personales (20%)</h3>
            <div class="amount" id="${month}-personal-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-personal-chart"></canvas>
            </div>
            <small id="${month}-personal-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="number" id="${month}-personal-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <input type="text" id="${month}-personal-description" placeholder="Descripción" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'personal')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-personal-list"></div>
          </div>
          
          <div class="category-card investment">
            <h3>Inversiones (20%)</h3>
            <div class="amount" id="${month}-investment-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-investment-chart"></canvas>
            </div>
            <small id="${month}-investment-info" style="color: #6b7280;">Usado: €0 / €0</small>
            <div class="input-section" style="padding: 10px 0; margin-top: 15px;">
              <div class="input-group" style="flex-direction: column; gap: 8px;">
                <input type="number" id="${month}-investment-amount" placeholder="Cantidad (€)" step="0.01" min="0" style="min-width: auto;">
                <input type="text" id="${month}-investment-description" placeholder="Descripción" style="min-width: auto;">
                <button onclick="addExpense('${month}', 'investment')" style="margin: 0;">Añadir Gasto</button>
              </div>
            </div>
            <div class="expenses-list" id="${month}-investment-list"></div>
          </div>
          
          <div class="category-card savings">
            <h3>Ahorro Total</h3>
            <div class="amount" id="${month}-savings-display">€0</div>
            <div style="height: 150px; width: 100%; position: relative;">
              <canvas id="${month}-savings-chart"></canvas>
            </div>
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
    alert('Por favor, ingrese una cantidad válida');
    return;
  }
  
  if (!description) {
    alert('Por favor, ingrese una descripción');
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
  const description = descriptionInput.value.trim();
  
  if (amount <= 0) {
    alert('Por favor, ingrese una cantidad válida');
    return;
  }
  
  if (!description) {
    alert('Por favor, ingrese una descripción');
    return;
  }
  
  const budget = monthlyBudgets[month];
  let budgetLimit = 0;
  
  if (type === 'monthly') budgetLimit = budget.monthlyExpenses;
  else if (type === 'personal') budgetLimit = budget.personalExpenses;
  else if (type === 'investment') budgetLimit = budget.investments;
  
  const currentExpenses = budget.expenses.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0);
  
  if (currentExpenses + amount > budgetLimit) {
    alert(`Este gasto excede el presupuesto disponible. Disponible: €${(budgetLimit - currentExpenses).toFixed(2)}`);
    return;
  }
  
  budget.expenses.push({ type, amount, description });
  
  updateExpenseDisplay(month);

  amountInput.value = '';
  descriptionInput.value = '';
 
  updateSavingsChart();
}

function updateIncomeDisplay(month) {
  const budget = monthlyBudgets[month];

  document.getElementById(`${month}-income-total`).textContent = `€${budget.totalIncome.toFixed(2)}`;

  const incomeChart = document.getElementById(`${month}-income-chart`).chart;
  if (incomeChart) {
    incomeChart.data.datasets[0].data = [budget.totalIncome, 0];
    incomeChart.update();
  }

  const incomeList = document.getElementById(`${month}-income-list`);
  incomeList.innerHTML = '';
  
  budget.incomes.forEach((income) => {
    incomeList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${income.description}</div>
        </div>
        <div class="value" style="color: #10b981;">+€${income.amount.toFixed(2)}</div>
      </div>
    `;
  });
}

function updateBudgetAllocations(month) {
  const budget = monthlyBudgets[month];
  const income = budget.totalIncome;
  const monthlyExpenses = income * 0.40;
  const personalExpenses = income * 0.20;
  const investments = income * 0.20;
  const baseSavings = income * 0.20;
  
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
    `${month}-income-chart`,
    `${month}-monthly-chart`,
    `${month}-personal-chart`,
    `${month}-investment-chart`,
    `${month}-savings-chart`
  ];
  
  chartIds.forEach(chartId => {
    const canvasElement = document.getElementById(chartId);
    if (canvasElement && canvasElement.chart) {
      canvasElement.chart.destroy();
    }
  });
  
  const incomeCtx = document.getElementById(`${month}-income-chart`).getContext('2d');
  document.getElementById(`${month}-income-chart`).chart = new Chart(incomeCtx, {
    type: 'doughnut',
    data: {
      labels: ['Ingresos', 'Meta'],
      datasets: [{
        data: [budget.totalIncome, Math.max(1000, budget.totalIncome)],
        backgroundColor: ['#10b981', '#d1fae5'],
        borderColor: ['#059669', '#a7f3d0'],
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
  
  const monthlyCtx = document.getElementById(`${month}-monthly-chart`).getContext('2d');
  document.getElementById(`${month}-monthly-chart`).chart = new Chart(monthlyCtx, {
    type: 'doughnut',
    data: {
      labels: ['Usado', 'Disponible'],
      datasets: [{
        data: [0, budget.monthlyExpenses],
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
      labels: ['Usado', 'Disponible'],
      datasets: [{
        data: [0, budget.personalExpenses],
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
      labels: ['Usado', 'Disponible'],
      datasets: [{
        data: [0, budget.investments],
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
  
  const savingsCtx = document.getElementById(`${month}-savings-chart`).getContext('2d');
  document.getElementById(`${month}-savings-chart`).chart = new Chart(savingsCtx, {
    type: 'doughnut',
    data: {
      labels: ['Ahorros', 'Presupuesto Base'],
      datasets: [{
        data: [0, budget.savings],
        backgroundColor: ['#10b981', '#d1fae5'],
        borderColor: ['#059669', '#a7f3d0'],
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
  const savingsChart = document.getElementById(`${month}-savings-chart`).chart;
  
  if (monthlyChart) {
    monthlyChart.data.datasets[0].data = [monthlyUsed, monthlyLeftover];
    monthlyChart.update();
  }
  
  if (personalChart) {
    personalChart.data.datasets[0].data = [personalUsed, personalLeftover];
    personalChart.update();
  }
  
  if (investmentChart) {
    investmentChart.data.datasets[0].data = [investmentUsed, investmentLeftover];
    investmentChart.update();
  }
  
  if (savingsChart) {
    savingsChart.data.datasets[0].data = [monthlyLeftover + personalLeftover + investmentLeftover, budget.savings];
    savingsChart.update();
  }
  
  const monthlyExpensesList = document.getElementById(`${month}-monthly-list`);
  monthlyExpensesList.innerHTML = '';
  
  budget.expenses.filter(e => e.type === 'monthly').forEach((expense) => {
    monthlyExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
      </div>
    `;
  });
  
  const personalExpensesList = document.getElementById(`${month}-personal-list`);
  personalExpensesList.innerHTML = '';
  
  budget.expenses.filter(e => e.type === 'personal').forEach((expense) => {
    personalExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
      </div>
    `;
  });
  
  const investmentExpensesList = document.getElementById(`${month}-investment-list`);
  investmentExpensesList.innerHTML = '';
  
  budget.expenses.filter(e => e.type === 'investment').forEach((expense) => {
    investmentExpensesList.innerHTML += `
      <div class="expense-item">
        <div>
          <div class="label">${expense.description}</div>
        </div>
        <div class="value">-€${expense.amount.toFixed(2)}</div>
      </div>
    `;
  });
}

function initializeSavingsChart() {
  const ctx = document.getElementById('savingsChart').getContext('2d');
  
  savingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      datasets: [{
        label: 'Ahorro Mensual (€)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toFixed(0);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': €' + context.parsed.y.toFixed(2);
            }
          }
        }
      }
    }
  });
}

function updateSavingsChart() {
  if (!savingsChart) return;
  
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const savingsData = months.map(month => {
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

window.addIncome = addIncome;
window.addExpense = addExpense;
