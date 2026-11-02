const API_URL = "https://script.google.com/macros/s/AKfycbwDsgBNBvQdo2p-wubvBkTi6ToWx4SFka5isCqrGExd3ecGgVW4k_FuUcR-bdZ37_dD/exec";

document.addEventListener('DOMContentLoaded', () => {
  let speechesData = [];
  let portalData = [];
  let currentCategory = 'all';

  // Elementos DOM de Speeches
  const speechesGrid = document.getElementById('speeches-grid');
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-btn');
  const catButtons = document.querySelectorAll('.cat-btn');
  const statusMessage = document.getElementById('status-message');

  // Elementos DOM del Modal de Speeches
  const speechModal = document.getElementById('speech-modal');
  const modalTitle = document.getElementById('modal-title');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const speechForm = document.getElementById('speech-form');
  const speechIdInput = document.getElementById('speech-id');

  // Elementos DOM del Portal Informativo
  const infoModal = document.getElementById('info-modal');
  const openInfoBtn = document.getElementById('open-info-btn');
  const closeInfoBtn = document.getElementById('close-info-btn');
  const portalSearchInput = document.getElementById('portal-search-input');

  // --- FUNCIÓN DE ADAPTACIÓN DINÁMICA DEL SALUDO ---
  function adaptarSaludoPorHora(texto) {
    if (!texto) return '';
    
    const horaActual = new Date().getHours(); // Hora actual en formato 24h (0 - 23)
    let saludoObjetivo = "Buenos días";

    // Evaluar turno (Mañana: 5-11, Tarde: 12-17, Noche: 18-4)
    if (horaActual >= 12 && horaActual < 18) {
      saludoObjetivo = "Buenas tardes";
    } else if (horaActual >= 18 || horaActual < 5) {
      saludoObjetivo = "Buenas noches";
    }

    // Reemplazo insensible a mayúsculas/minúsculas y con/sin acento
    return texto
      .replace(/buenos\s+d[íi]as/gi, saludoObjetivo)
      .replace(/buen\s+d[íi]a/gi, saludoObjetivo)
      .replace(/buenas\s+tardes/gi, saludoObjetivo)
      .replace(/buenas\s+noches/gi, saludoObjetivo);
  }

  // --- 1. Cargar datos desde la nube (Speeches + Portal) ---
  function fetchSpeeches() {
    if (statusMessage) {
      statusMessage.style.display = 'block';
      statusMessage.textContent = "Cargando datos desde SwiftDesk...";
    }

    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        speechesData = data.speeches || [];
        portalData = data.portal || [];
        
        if (statusMessage) statusMessage.style.display = 'none';
        renderSpeeches();
        renderPortal();
      })
      .catch(error => {
        console.error("Error al cargar datos:", error);
        if (statusMessage) {
          statusMessage.textContent = "⚠️ Error al conectar con SwiftDesk.";
        }
      });
  }

  // --- 2. Renderizar Speeches ---
  function renderSpeeches() {
    if (!speechesGrid) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = speechesData.filter(speech => {
      let matchesCategory = false;
      if (currentCategory === 'all') {
        matchesCategory = true;
      } else if (currentCategory === 'favorites') {
        matchesCategory = speech.isFavorite === true || speech.isFavorite === "true";
      } else {
        matchesCategory = speech.category === currentCategory;
      }

      const matchesQuery = (speech.title && String(speech.title).toLowerCase().includes(query)) || 
                           (speech.text && String(speech.text).toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });

    speechesGrid.innerHTML = '';

    if (filtered.length === 0) {
      speechesGrid.innerHTML = `<p class="status-message">No se encontraron speeches en esta sección.</p>`;
      return;
    }

    filtered.forEach(speech => {
      const isFav = speech.isFavorite === true || speech.isFavorite === "true";
      
      // Adaptar el texto original dinámicamente según la hora
      const textoAdaptado = adaptarSaludoPorHora(String(speech.text || ''));

      const card = document.createElement('div');
      card.className = 'speech-card';
      card.innerHTML = `
        <div>
          <div class="card-header">
            <div class="card-title-group">
              <button 
                class="fav-btn ${isFav ? 'is-fav' : ''}" 
                onclick="toggleFavorite('${speech.id}', ${!isFav})"
                title="${isFav ? 'Quitar de Favoritos' : 'Marcar como Favorito'}"
              >
                ⭐
              </button>
              <h3 class="card-title">${escapeHTML(String(speech.title || ''))}</h3>
            </div>
            <span class="card-tag">${escapeHTML(String(speech.category || ''))}</span>
          </div>
          <p class="card-body">${escapeHTML(textoAdaptado)}</p>
        </div>
        <div class="card-actions">
          <button class="copy-btn" onclick="copySpeech(this, \`${escapeQuotes(textoAdaptado)}\`)">
            📋 Copiar
          </button>
          <button class="edit-btn" onclick="openEditModal('${speech.id}')" title="Editar Speech">
            ✏️
          </button>
          <button class="delete-btn" onclick="deleteSpeech('${speech.id}')" title="Eliminar Speech">
            🗑️
          </button>
        </div>
      `;
      speechesGrid.appendChild(card);
    });
  }

  // --- 3. Renderizar Portal Informativo (Procesos) ---
  function renderPortal(filterQuery = '') {
    const listProcesos = document.getElementById('list-procesos');
    if (!listProcesos) return;

    listProcesos.innerHTML = '';

    const query = filterQuery.toLowerCase().trim();

    const filteredPortal = portalData.filter(item => {
      const title = String(item.title || '').toLowerCase();
      const detail = String(item.detail || '').toLowerCase();
      return title.includes(query) || detail.includes(query);
    });

    if (filteredPortal.length === 0) {
      listProcesos.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1.5rem;">No se encontraron procesos registrados.</p>`;
      return;
    }

    filteredPortal.forEach(item => {
      const title = escapeHTML(String(item.title || ''));
      const detail = escapeHTML(String(item.detail || ''));

      const li = document.createElement('li');
      li.innerHTML = `<strong>${title}:</strong> ${detail}`;
      listProcesos.appendChild(li);
    });
  }

  // --- 4. Guardar / Editar Speech (Acción POST) ---
  if (speechForm) {
    speechForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = speechIdInput.value;
      const title = document.getElementById('speech-title').value.trim();
      const category = document.getElementById('speech-category').value;
      const text = document.getElementById('speech-text').value.trim();

      if (title && text) {
        if (speechModal) speechModal.classList.add('hidden');
        
        const action = id ? 'update' : 'create';
        const speechId = id ? String(id) : Date.now().toString();

        if (id) {
          speechesData = speechesData.map(s => String(s.id) === String(id) ? {...s, title, category, text} : s);
        } else {
          speechesData.unshift({ id: speechId, title, category, isFavorite: false, text });
        }
        renderSpeeches();

        fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: action,
            id: String(speechId),
            title: title,
            category: category,
            isFavorite: false,
            text: text
          })
        })
        .then(res => res.json())
        .then(data => console.log("Guardado en SwiftDesk:", data))
        .catch(err => console.error("Error al guardar en SwiftDesk:", err));
      }
    });
  }

  // --- 5. Eliminar Speech (Acción POST) ---
  window.deleteSpeech = function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este speech?')) {
      speechesData = speechesData.filter(s => String(s.id) !== String(id));
      renderSpeeches();

      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'delete', id: String(id) })
      })
      .then(res => res.json())
      .then(data => console.log("Eliminado de SwiftDesk:", data))
      .catch(err => console.error("Error al eliminar de SwiftDesk:", err));
    }
  };

  // --- 6. Cambiar Favorito ---
  window.toggleFavorite = function(id, newFavStatus) {
    speechesData = speechesData.map(s => String(s.id) === String(id) ? {...s, isFavorite: newFavStatus} : s);
    renderSpeeches();

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'favorite', id: String(id), isFavorite: newFavStatus })
    })
    .catch(err => console.error("Error al actualizar favorito:", err));
  };

  // --- 7. Modal de Edición ---
  window.openEditModal = function(id) {
    const speech = speechesData.find(s => String(s.id) === String(id));
    if (!speech) return;

    speechIdInput.value = speech.id;
    document.getElementById('speech-title').value = speech.title || '';
    document.getElementById('speech-category').value = speech.category || 'bienvenida';
    document.getElementById('speech-text').value = speech.text || '';

    if (modalTitle) modalTitle.textContent = "Editar Speech";
    if (speechModal) speechModal.classList.remove('hidden');
  };

  // --- 8. Copiar al Portapapeles (Garantiza saludo adaptado) ---
  window.copySpeech = function(button, text) {
    const textoFinal = adaptarSaludoPorHora(text);

    navigator.clipboard.writeText(textoFinal).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = '✅ ¡Copiado en portapapeles!';
      button.classList.add('copied');

      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 1500);
    });
  };

  // --- 9. Event Listeners de Filtros y Búsqueda de Speeches ---
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderSpeeches();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearBtn) clearBtn.classList.toggle('hidden', searchInput.value.length === 0);
      renderSpeeches();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.classList.add('hidden');
      renderSpeeches();
    });
  }

  // Modales Abrir / Cerrar (Speeches)
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      if (speechForm) speechForm.reset();
      speechIdInput.value = '';
      if (modalTitle) modalTitle.textContent = "Crear Nuevo Speech";
      if (speechModal) speechModal.classList.remove('hidden');
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => speechModal.classList.add('hidden'));
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => speechModal.classList.add('hidden'));

  // --- 10. Event Listeners del Portal Informativo ---
  if (openInfoBtn && infoModal) {
    openInfoBtn.addEventListener('click', () => {
      infoModal.classList.remove('hidden');
      if (portalSearchInput) {
        portalSearchInput.value = '';
        renderPortal();
        portalSearchInput.focus();
      }
    });

    if (closeInfoBtn) {
      closeInfoBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
    }

    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.add('hidden');
    });

    if (portalSearchInput) {
      portalSearchInput.addEventListener('input', (e) => {
        renderPortal(e.target.value);
      });
    }
  }

  // Escapar caracteres para prevenir errores
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeQuotes(str) {
    return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  }

  // --- Carga Inicial ---
  fetchSpeeches();
});
