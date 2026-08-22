import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";
import { requiereAdmin } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (!requiereAdmin(req)) {
    return res.status(403).json({ error: "No tenés permiso para borrar." });
  }

  const { slug, filas } = req.body || {};
  const config = SHEETS[slug];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }
  if (!Array.isArray(filas) || filas.length === 0) {
    return res.status(400).json({ error: "No se especificaron filas para borrar." });
  }

  try {
    const sheets = sheetsClient();

    // hace falta el id numérico interno de la pestaña (gid), no alcanza con el nombre
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: config.sheetId,
      fields: "sheets.properties",
    });
    const hoja = meta.data.sheets.find((s) => s.properties.title === config.pestaña);
    if (!hoja) {
      return res.status(500).json({ error: `No se encontró la pestaña "${config.pestaña}" en el Sheet.` });
    }
    const sheetId = hoja.properties.sheetId;

    // borrar de abajo hacia arriba para que no se corran los índices entre un borrado y otro
    const requests = [...filas]
      .sort((a, b) => b - a)
      .map((rowIndex) => ({
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex },
        },
      }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: config.sheetId,
      requestBody: { requests },
    });

    return res.status(200).json({ ok: true, filasBorradas: filas.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo borrar: " + err.message });
  }
}
