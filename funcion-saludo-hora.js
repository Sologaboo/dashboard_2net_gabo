// saludos.js
function adaptarSaludoPorHora(texto) {
  if (!texto) return '';
  
  const horaActual = new Date().getHours();
  let saludoObjetivo = "Buenos días";

  if (horaActual >= 12 && horaActual < 18) {
    saludoObjetivo = "Buenas tardes";
  } else if (horaActual >= 18 || horaActual < 5) {
    saludoObjetivo = "Buenas noches";
  }

  return texto
    .replace(/buenos\s+d[íi]as/gi, saludoObjetivo)
    .replace(/buen\s+d[íi]a/gi, saludoObjetivo)
    .replace(/buenas\s+tardes/gi, saludoObjetivo)
    .replace(/buenas\s+noches/gi, saludoObjetivo);
}
