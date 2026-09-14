// Convierte celdas de Excel a números de JS sin asumir un formato fijo
// (puede venir "-3.583.988,27" o "28943158.52" según el archivo).
export function numeroDesdeCelda(valor) {
  if (typeof valor === "number") return valor;
  if (valor === null || valor === undefined || valor === "") return 0;

  let texto = String(valor).trim().replace(/[^0-9.,-]/g, "");
  if (!texto) return 0;

  const ultimaComa = texto.lastIndexOf(",");
  const ultimoPunto = texto.lastIndexOf(".");

  let limpio;
  if (ultimaComa > ultimoPunto) {
    limpio = texto.replace(/\./g, "").replace(",", ".");
  } else if (ultimoPunto > ultimaComa) {
    limpio = texto.replace(/,/g, "");
  } else {
    limpio = texto;
  }

  const numero = Number(limpio);
  return Number.isNaN(numero) ? 0 : numero;
}
