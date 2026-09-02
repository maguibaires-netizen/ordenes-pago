// api/composicion/list.js — GET /api/composicion/list
// Devuelve la composición de saldos guardada (pestaña que escribe la app) y
// los acuerdos (pestaña que se mantiene a mano, sólo lectura), para que todos
// los que entran vean lo mismo.
import { sheetsClient } from "../_lib/sheets.js";
import { COMPOSICION, CONCEPTOS, chequearConfig } from "./_config.js";
import { numeroDesdeCelda } from "../_lib/numero.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    chequearConfig();
    const sheets = sheetsClient();

    const { data } = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: COMPOSICION.sheetId,
      ranges: [`${COMPOSICION.pestaña}!A2:J`, `${COMPOSICION.pestañaAcuerdos}!A2:N`],
    });

    const [hojaComp, hojaAcu] = data.valueRanges || [];

    const porCuenta = {};
    let actualizado = "";
    for (const fila of hojaComp?.values || []) {
      const cuenta = (fila[0] || "").trim();
      if (!cuenta) continue;
      (porCuenta[cuenta] ||= []).push({
        fecha: fila[1] || "",
        numFactura: fila[2] || "",
        vencimiento: fila[3] || "",
        importe: numeroDesdeCelda(fila[4]),
        importeOrigen: numeroDesdeCelda(fila[5]),
        condPago: fila[6] || "",
        observacion: fila[7] || "",
        comentario: fila[8] || "",
      });
      if (fila[9] && fila[9] > actualizado) actualizado = fila[9];
    }

    // "Acuerdos web": A código, B cuenta, C..J conceptos, K aporte $,
    // L aporte %, M detalle, N acuerdos firmados.
    const acuerdos = [];
    for (const fila of hojaAcu?.values || []) {
      const nombre = (fila[1] || "").trim();
      if (!nombre) continue;
      const valores = {};
      CONCEPTOS.forEach((k, i) => { valores[k] = (fila[i + 2] || "").trim(); });
      acuerdos.push({
        codigo: (fila[0] || "").trim(),
        nombre,
        valores,
        aporteMonto: (fila[10] || "").trim(),
        aportePorcentaje: (fila[11] || "").trim(),
        detalle: (fila[12] || "").trim(),
        firmados: (fila[13] || "").trim(),
      });
    }

    return res.status(200).json({ comprobantes: porCuenta, acuerdos, actualizado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo leer el Sheet: " + err.message });
  }
}
