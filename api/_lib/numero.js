// Google Sheets devuelve los importes como texto ya formateado según el
// idioma de la planilla (ej: "-11.732.431,42"), no como número plano.
// Esto los convierte a un número de JS de forma confiable.
export function numeroDesdeCelda(valor) {
  if (typeof valor === "number") return valor;
  if (valor === null || valor === undefined || valor === "") return 0;

  const texto = String(valor).trim();

  // Formato es-AR: puntos de miles + coma decimal (ej: 1.234.567,89 o -11.732.431,42)
  if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(texto)) {
    return Number(texto.replace(/\./g, "").replace(",", "."));
  }

  const directo = Number(texto);
  return Number.isNaN(directo) ? 0 : directo;
}
