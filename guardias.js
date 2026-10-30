// Function para renderizar las guardias desde los datos recibidos de la API
function renderGuards(guardsData = []) {
  const container = document.getElementById('guards-container');
  const currentText = document.getElementById('current-guard-text');
  const currentDate = document.getElementById('current-guard-date');
  
  if (!container) return;

  container.innerHTML = '';

  if (!guardsData || guardsData.length === 0) {
    container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">No hay guardias registradas en la nube.</p>`;
    if (currentText) currentText.textContent = "Sin asignar";
    if (currentDate) currentDate.textContent = "--/--";
    return;
  }

  // Poner la guardia activa en el banner superior
  if (currentText && currentDate) {
    currentText.textContent = guardsData[0].employee || 'Sin asignar';
    currentDate.textContent = guardsData[0].date || '';
  }

  // Renderizar la grilla completa
  guardsData.forEach(guard => {
    const card = document.createElement('div');
    card.className = 'guard-card';
    card.innerHTML = `
      <div class="guard-date">📅 ${escapeHTML(String(guard.date || ''))}</div>
      <div class="guard-name">👤 ${escapeHTML(String(guard.employee || ''))}</div>
      <div class="guard-shift">${escapeHTML(String(guard.shift || ''))}</div>
    `;
    container.appendChild(card);
  });
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
