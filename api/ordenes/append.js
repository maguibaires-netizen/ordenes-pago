import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { slug, filas } = req.body || {};
  const config = SHEETS[slug];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }
  if (!Array.isArray(filas) || filas.length === 0) {
    return res.status(400).json({ error: "No hay filas para guardar." });
  }

  try {
    const sheets = sheetsClient();
    const values = filas.map((f) => [
      f.nroAviso || "",
      f.comprobante || "",
      f.categoria || "",
      f.estado || "",
      f.fecha || "",
      f.importe ?? "",
      f.notas || "",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.sheetId,
      range: `${config.pestaña}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    return res.status(200).json({ ok: true, filasGuardadas: values.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo guardar en el Sheet: " + err.message });
  }
}
