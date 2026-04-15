# Financy 💎
### Gestión Financiera Inteligente para el Mundo Real

**Financy** es una aplicación de escritorio diseñada para gestionas tu dinero. Construida con **Electron** y **SQLite**, buscando ofrecer una experiencia fluida, visual y analítica.

---

## ✨ Características Principales

### 📊 Dashboard Analítico
- **Visualización en Tiempo Real**: Gráficos dinámicos (Doughnut y Bar) que muestran la distribución de tus gastos y la evolución de tus ahorros.
- **Navegación Intuitiva**: Sistema de navegación por meses con "cinematic scrolling" y sidebar lateral para un acceso rápido.

### 💰 Reparto Inteligente de Ingresos
- **Perfiles de Ahorro**: Define cómo se reparte cada euro que entra (ej. 40% Gastos, 20% Inversión, 20% Personal, 20% Ahorro).
- **Asignación Automática**: Los ingresos se distribuyen al instante según tu perfil seleccionado, facilitando el cumplimiento de tus metas.

### 🎯 Objetivos de Inversión (Fondos)
- **Tracking de Metas**: Crea objetivos específicos (ej. "Entrada Piso", "Coche Nuevo") y realiza aportaciones directas.
- **Histórico de Transacciones**: Consulta cada movimiento vinculado a tus metas de inversión.

### 🏦 Fondos Personalizados
- **Gestión de Cuentas**: Configura múltiples fondos o cuentas (Cuenta Principal, Fondo de Emergencia, etc.) y gestiona sus saldos de forma independiente.

### 📅 Multianual & Relacional
- **Histórico Completo**: Cambia entre diferentes años fiscales sin perder el ritmo.
- **Integridad de Datos**: Estructura relacional robusta para asegurar que cada gasto e ingreso esté donde debe estar.

---

## 🛠️ Stack Tecnológico

- **Core**: [Electron](https://www.electronjs.org/) (Desktop App Framework)
- **Base de Datos**: [better-sqlite3](https://github.com/WiseLibs/node-better-sqlite3) (SQLite síncrono y de alto rendimiento)
- **Visualización**: [Chart.js](https://www.chartjs.org/) (Gráficos interactivos)
- **Frontend**: HTML5, CSS3 (Vanilla con estética Premium) y JavaScript ES6+

---

## 🏗️ Arquitectura del Proyecto

```text
Financy/
├── app/
│   ├── database.js   # Capa de datos relacional (8 tablas)
│   ├── main.js       # Proceso principal de Electron
│   ├── preload.js    # Puente seguro de comunicación
│   ├── renderer.js   # Lógica central del Dashboard (Visualización y UX)
│   ├── index.html    # Estructura UI moderna
│   └── styles.css    # Sistema de diseño Premium (Dark mode y animaciones)
├── tests/            # Suite de pruebas unitarias y de entorno
└── README.md         # Documentación oficial
```

---

## 💾 Estructura de Datos (Esquema Relacional)

La aplicación utiliza una base de datos SQLite con una arquitectura de 8 tablas para una gestión granular:

| Tabla | Propósito |
| :--- | :--- |
| `years` | Gestión de diferentes ejercicios fiscales. |
| `incomes` | Registro de entradas con destino directo o reparto automático. |
| `expenses` | Gastos categorizados (Mensuales, Personales, Inversiones). |
| `investment_goals` | Metas de ahorro a largo plazo con objetivos de importe. |
| `goal_transactions` | Registro detallado de aportaciones a inversiones. |
| `custom_funds` | Gestión de cuentas y fondos de depósito personalizados. |
| `global_withdrawals` | Seguimiento de retiros de capital de los ahorros globales. |
| `settings` | Almacenamiento persistente de configuraciones y perfiles de reparto. |

---

## 🚀 Instalación y Uso

1. **Clonar el repositorio**:
   ```bash
   git clone [url-del-repo]
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```
   *(Nota: Se ejecutará `electron-rebuild` automáticamente para compilar el módulo nativo de SQLite).*

3. **Ejecutar la aplicación**:
   ```bash
   npm start
   ```

4. **Ejecutar tests**:
   ```bash
   npm test
   ```


---

## 📄 Licencia

Este proyecto es propiedad privada. Uso bajo licencia **ISC**.
