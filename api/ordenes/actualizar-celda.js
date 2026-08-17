import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";
import { requiereAdmin } from "../_lib/auth.js";

const COLUMNA = {
  nroAviso: "A",
  comprobante: "B",
  categoria: "C",
  estado: "D",
  fecha: "E",
  importe: "F",
  notas: "G",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (!requiereAdmin(req)) {
    return res.status(403).json({ error: "No tenés permiso para editar." });
  }

  const { slug, rowIndex, campo, valor } = req.body || {};
  const config = SHEETS[slug];
  const columna = COLUMNA[campo];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }
  if (!rowIndex || !columna) {
    return res.status(400).json({ error: "Faltan datos (rowIndex / campo válido)." });
  }

  try {
    const sheets = sheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range: `${config.pestaña}!${columna}${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[valor]] },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo actualizar: " + err.message });
  }
}
