const API_URL = "https://script.google.com/macros/s/AKfycbzj714BoZQ5x8N8_C0HT97gyQFwUQdVSfB_ZfqkKweGuYIggB_yxJuMlI0_ZULOu0uz/exec";

document.addEventListener('DOMContentLoaded', () => {
  let speechesData = []; // Aquí guardaremos los datos en caché local
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

  // 1. Cargar datos una sola vez al iniciar la página
  function fetchSpeeches() {
    statusMessage.style.display = 'block';
    statusMessage.textContent = "Cargando speeches desde la nube...";

    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        speechesData = data; // Guardamos en memoria local
        statusMessage.style.display = 'none';
        renderSpeeches(); // Dibujamos
      })
      .catch(error => {
        console.error("Error al cargar:", error);
        statusMessage.textContent = "⚠️ Error al conectar con Google Sheets.";
      });
  }

  // 2. Renderizar Tarjetas (Búsqueda instantánea en memoria)
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

  // 3. Cambiar favorito (Actualiza localmente al instante y sincroniza en segundo plano)
  window.toggleFavorite = function(id, newFavStatus) {
    // Actualizamos la memoria local inmediatamente para cero demora visual
    speechesData = speechesData.map(s => s.id == id ? {...s, isFavorite: newFavStatus} : s);
    renderSpeeches();

    // Sincronización silenciosa con Google Sheets
    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'favorite', id: id, isFavorite: newFavStatus })
    });
  };

  // 4. Eliminar speech
  window.deleteSpeech = function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este speech?')) {
      // Borrado local inmediato
      speechesData = speechesData.filter(s => s.id != id);
      renderSpeeches();

      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: id })
      });
    }
  };

  // Copiar al portapapeles
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
      renderSpeeches(); // Filtra al instante sin recargar de la nube
    });
  });

  // Búsqueda en vivo (Ultra rápida porque busca en la memoria del navegador)
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

  // Guardar o Crear Speech
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
      renderSpeeches(); // Se actualiza visualmente al instante

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

// --- Lógica del Portal Informativo ---
  const infoModal = document.getElementById('info-modal');
  const openInfoBtn = document.getElementById('open-info-btn');
  const closeInfoBtn = document.getElementById('close-info-btn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  if (openInfoBtn && infoModal) {
    // Abrir / Cerrar Modal Informativo
    openInfoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    closeInfoBtn.addEventListener('click', () => infoModal.classList.add('hidden'));

    // Cerrar al hacer clic fuera del contenido
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) infoModal.classList.add('hidden');
    });

    // Cambiar entre pestañas
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        btn.classList.add('active');
        const selectedContent = document.getElementById(`tab-${targetTab}`);
        if (selectedContent) {
          selectedContent.classList.remove('hidden');
        }
      });
    });
  }