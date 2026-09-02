// api/composicion/guardar.js — POST /api/composicion/guardar   (sólo admin)
//
// Body:
//   { comprobantes: { "<cuenta>": [ {fecha, numFactura, vencimiento, importe,
//                                    importeOrigen, condPago, observacion, comentario}, … ] } }
//
// Reemplaza TODA la pestaña "Composicion web" (es lo que pasa al importar un
// Excel nuevo). La pestaña "Acuerdos web" NO se toca nunca desde acá: se
// mantiene a mano en el Sheet y la app sólo la lee.
import { sheetsClient } from "../_lib/sheets.js";
import { requiereAdmin } from "../_lib/auth.js";
import { COMPOSICION, COLUMNAS, chequearConfig } from "./_config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (!requiereAdmin(req)) {
    return res.status(403).json({ error: "No tenés permiso para guardar cambios." });
  }

  const { comprobantes } = req.body || {};
  if (!comprobantes) {
    return res.status(400).json({ error: "No hay nada para guardar." });
  }

  try {
    chequearConfig();
    const sheets = sheetsClient();
    const ahora = new Date().toISOString();

    const filas = [];
    for (const cuenta of Object.keys(comprobantes)) {
      for (const r of comprobantes[cuenta] || []) {
        filas.push([
          cuenta, r.fecha || "", r.numFactura || "", r.vencimiento || "",
          r.importe ?? "", r.importeOrigen ?? "", r.condPago || "",
          r.observacion || "", r.comentario || "", ahora,
        ]);
      }
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: COMPOSICION.sheetId,
      range: `${COMPOSICION.pestaña}!A2:J`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: COMPOSICION.sheetId,
      range: `${COMPOSICION.pestaña}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [COLUMNAS, ...filas] },
    });

    return res.status(200).json({ ok: true, actualizado: ahora, filasGuardadas: filas.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo guardar en el Sheet: " + err.message });
  }
}
