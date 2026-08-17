// Google Sheets devuelve los importes ya formateados como texto según el
// formato de la celda (puede venir como "-$12,503,231.60" o como
// "-11.732.431,42" según el caso) — nunca como número plano. Esto los
// convierte a un número de JS de forma confiable sin asumir un formato fijo.
export function numeroDesdeCelda(valor) {
  if (typeof valor === "number") return valor;
  if (valor === null || valor === undefined || valor === "") return 0;

  // saca símbolo de moneda, espacios, etc. — deja solo dígitos, . , y -
  let texto = String(valor).trim().replace(/[^0-9.,-]/g, "");
  if (!texto) return 0;

  const ultimaComa = texto.lastIndexOf(",");
  const ultimoPunto = texto.lastIndexOf(".");

  let limpio;
  if (ultimaComa > ultimoPunto) {
    // la coma es el separador decimal (formato es-AR: 11.732.431,42)
    limpio = texto.replace(/\./g, "").replace(",", ".");
  } else if (ultimoPunto > ultimaComa) {
    // el punto es el separador decimal (formato en-US: 12,503,231.60)
    limpio = texto.replace(/,/g, "");
  } else {
    limpio = texto;
  }

  const numero = Number(limpio);
  return Number.isNaN(numero) ? 0 : numero;
}
