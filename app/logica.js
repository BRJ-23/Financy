/**
 * Función que prepara los datos para mostrar en una gráfica
 * Agrupa los gastos (importes negativos) por concepto y suma sus valores absolutos
 * Ignora los ingresos (importes positivos)
 * 
 * @param {Array} movimientos - Array de objetos con {concepto, importe}
 * @returns {Object} - Objeto con conceptos como claves y sumas como valores
 */
function prepararDatosGrafica(movimientos) {
  const resultado = {};

  movimientos.forEach(mov => {
    if (mov.importe < 0) {
      const concepto = mov.concepto;
      const valorAbsoluto = Math.abs(mov.importe);
      
      if (resultado[concepto]) {
        resultado[concepto] += valorAbsoluto;
      } else {
        resultado[concepto] = valorAbsoluto;
      }
    }
  });

  return resultado;
}

/**
 * Calcula la distribución del presupuesto mensual
 * 40% gastos mensuales, 20% gastos personales, 20% inversiones, 20% ahorro base
 * 
 * @param {number} income - Ingresos mensuales
 * @returns {Object} - Objeto con las cantidades distribuidas
 */
function calcularPresupuesto(income) {
  if (income <= 0 || isNaN(income)) {
    throw new Error('Los ingresos deben ser un número mayor que 0');
  }
  
  return {
    ingresos: income,
    gastosMensuales: income * 0.40,
    gastosPersonales: income * 0.20,
    inversiones: income * 0.20,
    ahorroBase: income * 0.20
  };
}

/**
 * Calcula el ahorro total incluyendo los sobrantes de otras categorías
 * 
 * @param {Object} presupuesto - Presupuesto calculado
 * @param {Object} gastosReales - Gastos reales por categoría
 * @returns {number} - Ahorro total
 */
function calcularAhorroTotal(presupuesto, gastosReales) {
  const sobranteGastosMensuales = Math.max(0, presupuesto.gastosMensuales - (gastosReales.gastosMensuales || 0));
  const sobranteGastosPersonales = Math.max(0, presupuesto.gastosPersonales - (gastosReales.gastosPersonales || 0));
  const sobranteInversiones = Math.max(0, presupuesto.inversiones - (gastosReales.inversiones || 0));
  
  return presupuesto.ahorroBase + sobranteGastosMensuales + sobranteGastosPersonales + sobranteInversiones;
}

module.exports = { 
  prepararDatosGrafica, 
  calcularPresupuesto, 
  calcularAhorroTotal 
};
