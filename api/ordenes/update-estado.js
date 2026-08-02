import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { slug, rowIndex, estado } = req.body || {};
  const config = SHEETS[slug];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }
  if (!rowIndex || !estado) {
    return res.status(400).json({ error: "Faltan datos (rowIndex / estado)." });
  }

  try {
    const sheets = sheetsClient();
    // columna D = Estado
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range: `${config.pestaña}!D${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[estado]] },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo actualizar el estado: " + err.message });
  }
}
