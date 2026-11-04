const btnFloatingCalendar = document.getElementById('btnFloatingCalendar');
const calendarModal = document.getElementById('calendarModal');
const btnCloseCalendar = document.getElementById('btnCloseCalendar');

// Abrir modal
if (btnFloatingCalendar) {
  btnFloatingCalendar.addEventListener('click', () => {
    calendarModal.classList.remove('hidden');
  });
}

// Cerrar con la X
if (btnCloseCalendar) {
  btnCloseCalendar.addEventListener('click', () => {
    calendarModal.classList.add('hidden');
  });
}

// Cerrar haciendo clic fuera de la caja blanca
window.addEventListener('click', (e) => {
  if (e.target === calendarModal) {
    calendarModal.classList.add('hidden');
  }
});