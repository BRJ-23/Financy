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

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeMonthlyTabs();
  initializeSavingsChart();
  renderInvestmentGoals();
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
            label: function(context) {
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
            callback: function(value) {
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

function createInvestmentGoal() {
  const nameInput = document.getElementById('new-goal-name');
  const amountInput = document.getElementById('new-goal-amount');
  
  const name = nameInput.value.trim();
  const targetAmount = parseFloat(amountInput.value) || 0;
  
  if (!name) {
    alert('Por favor, ingrese un nombre para el objetivo');
    return;
  }
  
  if (targetAmount <= 0) {
    alert('Por favor, ingrese una cantidad válida');
    return;
  }
  
  const goalId = 'goal-' + Date.now();
  investmentGoals.push({
    id: goalId,
    name: name,
    targetAmount: targetAmount,
    currentAmount: 0
  });
  
  nameInput.value = '';
  amountInput.value = '';
  
  renderInvestmentGoals();
}

function addFundsToGoal(goalId) {
  const amountInput = document.getElementById(`funds-${goalId}`);
  const amount = parseFloat(amountInput.value) || 0;
  
  if (amount <= 0) {
    alert('Por favor, ingrese una cantidad válida');
    return;
  }
  
  const goal = investmentGoals.find(g => g.id === goalId);
  if (goal) {
    goal.currentAmount += amount;
    amountInput.value = '';
    renderInvestmentGoals();
  }
}

function deleteInvestmentGoal(goalId) {
  if (confirm('¿Estás seguro de que deseas eliminar este objetivo?')) {
    const index = investmentGoals.findIndex(g => g.id === goalId);
    if (index > -1) {
      investmentGoals.splice(index, 1);
      renderInvestmentGoals();
    }
  }
}

function renderInvestmentGoals() {
  const container = document.getElementById('investment-goals-container');
  
  if (investmentGoals.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 40px;">No hay objetivos de ahorro. ¡Crea uno arriba!</p>';
    return;
  }
  
  container.innerHTML = investmentGoals.map(goal => {
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = goal.targetAmount - goal.currentAmount;
    const isComplete = goal.currentAmount >= goal.targetAmount;
    
    return `
      <div class="investment-goal-card">
        <h4>
          <span class="goal-name">${goal.name}</span>
          <button class="delete-btn" onclick="deleteInvestmentGoal('${goal.id}')">Eliminar</button>
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
          ${isComplete ? '✓ ¡Objetivo alcanzado!' : `Falta: €${remaining.toFixed(2)}`}
        </div>
        
        <div class="goal-add-funds">
          <input type="number" id="funds-${goal.id}" placeholder="Cantidad (€)" step="0.01" min="0">
          <button onclick="addFundsToGoal('${goal.id}')">Añadir</button>
        </div>
      </div>
    `;
  }).join('');
}

window.addIncome = addIncome;
window.addExpense = addExpense;
window.createInvestmentGoal = createInvestmentGoal;
window.addFundsToGoal = addFundsToGoal;
window.deleteInvestmentGoal = deleteInvestmentGoal;
