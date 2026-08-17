// Un registro por supermercado ya conectado. Los que todavía no tienen
// sheetId simplemente no están soportados aún por la API.
export const SHEETS = {
  carrefour: {
    sheetId: "1htBw2WgQlxDT_PrbKBcKrWUkgzAQzvF_WOLnh1xbvvk",
    pestaña: "Cargadas web",
  },
  cencosud: {
    sheetId: "1vQaUIRo2gixkltlQNeUhWNu9HDH7axRNLwcPLurNHHU",
    pestaña: "Cargadas web",
  },
  makro: {
    sheetId: "1KQ3Kzxd8l6VNHv0TbOH5mPkcvlkP226rm1lRpa6F36k",
    pestaña: "Cargadas web",
  },
  coto: {
    sheetId: "122qV26ujU-eROzw_TRlsuxVFZMxjh02k4xYo_BRYE-0",
    pestaña: "Cargadas web",
  },
};

// Columnas en el orden exacto en que están en la fila 1 de "Cargadas web"
export const COLUMNAS = ["Nº aviso", "Comprobante", "Categoría", "Estado", "Fecha doc", "Importe neto", "Notas"];
