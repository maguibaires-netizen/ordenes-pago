import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";
import { numeroDesdeCelda } from "../_lib/numero.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { slug } = req.query;
  const config = SHEETS[slug];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }

  try {
    const sheets = sheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId,
      range: `${config.pestaña}!A2:G`, // salta la fila de encabezados
    });

    const filas = (data.values || []).map((fila, i) => ({
      // fila 1 es el encabezado, los datos arrancan en la fila 2 del Sheet
      rowIndex: i + 2,
      nroAviso: fila[0] || "",
      comprobante: fila[1] || "",
      categoria: fila[2] || "",
      estado: fila[3] || "",
      fecha: fila[4] || "",
      importe: numeroDesdeCelda(fila[5]),
      notas: fila[6] || "",
    }));

    return res.status(200).json({ filas });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo leer el Sheet: " + err.message });
  }
}
