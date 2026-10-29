// ==========================================
// PEGA AQUÍ TU URL DE LA APLICACIÓN WEB DE GOOGLE APPS SCRIPT
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbzWnPrRYnCMse26TN_uoHjajqA1q72pIhIPIv1Tb8k7rKkB1H4-Him_gAOgWczSSUVI/exec";

document.addEventListener('DOMContentLoaded', () => {
  let speechesData = [];
  let portalData = []; // Guardará los procesos del portal
  let currentCategory = 'all';

  const speechesGrid = document.getElementById('speeches-grid');
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-btn');
  const catButtons = document.querySelectorAll('.cat-btn');
  const statusMessage = document.getElementById('status-message');

  const speechModal = document.getElementById('speech-modal');
  const modalTitle = document.getElementById('modal-title');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const speechForm = document.getElementById('speech-form');
  const speechIdInput = document.getElementById('speech-id');

  // Cargar datos de la nube
  function fetchSpeeches() {
    statusMessage.style.display = 'block';
    statusMessage.textContent = "Cargando datos desde Google Sheets...";

    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        speechesData = data.speeches || [];
        portalData = data.portal || [];
        
        statusMessage.style.display = 'none';
        renderSpeeches();
        renderPortal();
      })
      .catch(error => {
        console.error("Error al cargar:", error);
        statusMessage.textContent = "⚠️ Error al conectar con Google Sheets.";
      });
  }

  // Renderizar Speeches principales
  function renderSpeeches() {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = speechesData.filter(speech => {
      let matchesCategory = false;
      if (currentCategory === 'all') {
        matchesCategory = true;
      } else if (currentCategory === 'favorites') {
        matchesCategory = speech.isFavorite === true;
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
      const card = document.createElement('div');
      card.className = 'speech-card';
      card.innerHTML = `
        <div>
          <div class="card-header">
            <div class="card-title-group">
              <button 
                class="fav-btn ${speech.isFavorite ? 'is-fav' : ''}" 
                onclick="toggleFavorite('${speech.id}', ${!speech.isFavorite})"
                title="${speech.isFavorite ? 'Quitar de Favoritos' : 'Marcar como Favorito'}"
              >
                ⭐
              </button>
              <h3 class="card-title">${speech.title}</h3>
            </div>
            <span class="card-tag">${speech.category}</span>
          </div>
          <p class="card-body">${escapeHTML(String(speech.text))}</p>
        </div>
        <div class="card-actions">
          <button class="copy-btn" onclick="copySpeech(this, \`${escapeQuotes(String(speech.text))}\`)">
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

  // --- Renderizar y filtrar el Portal de Procesos ---
  function renderPortal(filterQuery = '') {
    const listProcesos = document.getElementById('list-procesos');
    if (!listProcesos) return;

    listProcesos.innerHTML = '';

    const query = filterQuery.toLowerCase().trim();
    
    // Filtrar solo los que correspondan a procesos (o todos si están en la hoja única)
    const filteredPortal = portalData.filter(item => {
      const title = String(item.title || '').toLowerCase();
      const detail = String(item.detail || '').toLowerCase();
      return title.includes(query) || detail.includes(query);
    });

    if (filteredPortal.length === 0) {
      listProcesos.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">No se encontraron procesos.</p>`;
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

  // --- Lógica de la Ventana Flotante del Portal ---
  const infoModal = document.getElementById('info-modal');
  const openInfoBtn = document.getElementById('open-info-btn');
  const closeInfoBtn = document.getElementById('close-info-btn');
  const portalSearchInput = document.getElementById('portal-search-input');

  if (openInfoBtn && infoModal) {
    openInfoBtn.addEventListener('click', () => {
      infoModal.classList.remove('hidden');
      if (portalSearchInput) {
        portalSearchInput.value = '';
        renderPortal();
        portalSearchInput.focus();
      }
    });

    closeInfoBtn.addEventListener('click', () => infoModal.classList.add('hidden'));

    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.add('hidden');
    });

    // Buscador interno en tiempo real dentro del portal
    if (portalSearchInput) {
      portalSearchInput.addEventListener('input', (e) => {
        renderPortal(e.target.value);
      });
    }
  }

  // --- Funciones auxiliares de Speeches ---
  window.toggleFavorite = function(id, newFavStatus) {
    speechesData = speechesData.map(s => s.id == id ? {...s, isFavorite: newFavStatus} : s);
    renderSpeeches();

    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'favorite', id: id, isFavorite: newFavStatus })
    });
  };

  window.deleteSpeech = function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este speech?')) {
      speechesData = speechesData.filter(s => s.id != id);
      renderSpeeches();

      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: id })
      });
    }
  };

  window.copySpeech = function(button, text) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = '✅ ¡Copiado!';
      button.classList.add('copied');

      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 1500);
    });
  };

  window.openEditModal = function(id) {
    const speech = speechesData.find(s => s.id == id);
    if (!speech) return;

    speechIdInput.value = speech.id;
    document.getElementById('speech-title').value = speech.title;
    document.getElementById('speech-category').value = speech.category;
    document.getElementById('speech-text').value = speech.text;

    modalTitle.textContent = "Editar Speech";
    speechModal.classList.remove('hidden');
  };

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderSpeeches();
    });
  });

  searchInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', searchInput.value.length === 0);
    renderSpeeches();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    renderSpeeches();
    searchInput.focus();
  });

  openModalBtn.addEventListener('click', () => {
    speechForm.reset();
    speechIdInput.value = '';
    modalTitle.textContent = "Crear Nuevo Speech";
    speechModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => speechModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => speechModal.classList.add('hidden'));

  speechForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = speechIdInput.value;
    const title = document.getElementById('speech-title').value.trim();
    const category = document.getElementById('speech-category').value;
    const text = document.getElementById('speech-text').value.trim();

    if (title && text) {
      speechModal.classList.add('hidden');
      
      const action = id ? 'update' : 'create';
      const speechId = id ? id : Date.now().toString();

      if (id) {
        speechesData = speechesData.map(s => s.id == id ? {...s, title, category, text} : s);
      } else {
        speechesData.unshift({ id: speechId, title, category, isFavorite: false, text });
      }
      renderSpeeches();

      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, id: speechId, title, category, isFavorite: false, text })
      });
    }
  });

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeQuotes(str) {
    return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  }

  // Carga inicial
  fetchSpeeches();
});