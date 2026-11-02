// --- Módulo de Calculadora de Prorrateo ---
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('prorrateo-toggle');
  const panel = document.getElementById('prorrateo-panel');
  const closeBtn = document.getElementById('prorrateo-close');
  const inputDias = document.getElementById('prorrateo-dias');
  const inputMonto = document.getElementById('prorrateo-monto');
  const outputResult = document.getElementById('prorrateo-output');

  if (!toggleBtn || !panel) return;

  // Abrir / Cerrar panel flotante
  toggleBtn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden') && inputDias) {
      inputDias.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }

  // Función de cálculo automático
  function calcularProrrateo() {
    const dias = parseFloat(inputDias.value) || 0;
    const monto = parseFloat(inputMonto.value) || 0;

    if (dias > 0 && monto > 0) {
      // Fórmula estándar de prorrateo basada en mes de 30 días
      const resultado = (monto / 30) * dias;
      outputResult.textContent = `$${resultado.toFixed(2)}`;
    } else {
      outputResult.textContent = `$0.00`;
    }
  }

  if (inputDias) inputDias.addEventListener('input', calcularProrrateo);
  if (inputMonto) inputMonto.addEventListener('input', calcularProrrateo);
});
