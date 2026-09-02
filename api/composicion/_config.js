// api/composicion/_config.js
// Composición de saldos: todo vive en el libro "SUPERMERCADOS - CCob".
//
// Dos pestañas, con roles distintos:
//
//   "Composicion web"  → la escribe la app. Se sobrescribe COMPLETA en cada
//                        importación de Excel. Encabezados en la fila 1:
//     Cuenta | Fecha | Nº factura | Vencimiento | Importe | Importe origen |
//     Cond. pago | Observación | Comentario | Actualizado
//
//   "Acuerdos web"     → la mantenés vos a mano. La app SÓLO LEE, nunca escribe.
//                        Columnas tal cual las armaste:
//     A Código | B Cuenta | C ACC | D Escala crecim. | E No dev | F Log |
//     G Publ | H Voraz | I Criadores | J Kongo | K Aporte adicional $ |
//     L Aporte adicional % | M Detalle | N Acuerdos comerciales (firmados)

export const COMPOSICION = {
  // Libro "SUPERMERCADOS - CCob". Se puede sobreescribir con la variable de
  // entorno COMPOSICION_SHEET_ID en Vercel.
  sheetId: process.env.COMPOSICION_SHEET_ID || "1Ex3bPT3aRoU5UQrx1OIgAyOHDfFlpbqi4r2U_I13jnw",
  pestaña: "Composicion web",
  pestañaAcuerdos: "Acuerdos web",
};

export const COLUMNAS = [
  "Cuenta", "Fecha", "Nº factura", "Vencimiento", "Importe",
  "Importe origen", "Cond. pago", "Observación", "Comentario", "Actualizado",
];

// Orden real de las columnas C..J de "Acuerdos web".
export const CONCEPTOS = ["acc", "escala", "noDev", "log", "publ", "voraz", "criadores", "kongo"];

export function chequearConfig() {
  if (!COMPOSICION.sheetId) {
    throw new Error("Falta la variable de entorno COMPOSICION_SHEET_ID en Vercel.");
  }
}
