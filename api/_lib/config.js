// Un registro por supermercado ya conectado. Los que todavía no tienen
// sheetId simplemente no están soportados aún por la API.
export const SHEETS = {
  carrefour: {
    sheetId: "1htBw2WgQlxDT_PrbKBcKrWUkgzAQzvF_WOLnh1xbvvk",
    pestaña: "Cargadas web",
  },
};

// Columnas en el orden exacto en que están en la fila 1 de "Cargadas web"
export const COLUMNAS = ["Nº aviso", "Comprobante", "Categoría", "Estado", "Fecha doc", "Importe neto", "Notas"];
