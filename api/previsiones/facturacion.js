import { sheetsClient } from "../_lib/sheets.js";
import { requiereAdmin, requiereSesion } from "../_lib/auth.js";
import { SHEET_ID, TABS } from "../_lib/previsiones-config.js";
import { parsearFacturacion } from "../../src/lib/previsiones-parse.js";

async function leerFacturacionCruda(sheets) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TABS.facturacion}!A1:CZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  return data.values || [];
}

// Agrega/actualiza, para cada supermercado con datos este mes, una fila en
// Evolucion con el total facturado, las unidades (suma de Factura) y la NC del mes.
async function actualizarEvolucion(sheets, periodo, filas) {
  const porSuper = {};
  for (const f of filas) {
    if (!f.superId) continue;
    const acc = (porSuper[f.superId] ||= { facturacion: 0, unidades: 0, nc: 0 });
    acc.facturacion += f.importe;
    if (f.tipo === "Factura") acc.unidades += f.cantidad;
    if (f.tipo === "NC") acc.nc += f.importe;
  }

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TABS.evolucion}!A1:E`,
  });
  const filasHoja = data.values || [];
  const encabezado = ["Periodo", "Supermercado", "Facturacion", "Unidades", "NC"];
  if (!filasHoja.length) filasHoja.push(encabezado);

  const indicePorClave = new Map();
  for (let i = 1; i < filasHoja.length; i++) {
    indicePorClave.set(`${filasHoja[i][0]}|${filasHoja[i][1]}`, i);
  }

  for (const [superId, acc] of Object.entries(porSuper)) {
    const clave = `${periodo}|${superId}`;
    const fila = [periodo, superId, acc.facturacion, acc.unidades, acc.nc];
    if (indicePorClave.has(clave)) {
      filasHoja[indicePorClave.get(clave)] = fila;
    } else {
      filasHoja.push(fila);
      indicePorClave.set(clave, filasHoja.length - 1);
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TABS.evolucion}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: filasHoja },
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!requiereSesion(req)) {
      return res.status(401).json({ error: "Tenés que iniciar sesión." });
    }
    try {
      const sheets = sheetsClient();
      const aoa = await leerFacturacionCruda(sheets);
      if (!aoa.length) {
        return res.status(200).json({ periodo: "", filas: [], sinIdentificar: [], vacio: true });
      }
      const resultado = parsearFacturacion(aoa);
      if (resultado.error) return res.status(200).json({ ...resultado, filas: [] });
      return res.status(200).json(resultado);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo leer Facturación: " + err.message });
    }
  }

  if (req.method === "POST") {
    if (!requiereAdmin(req)) {
      return res.status(403).json({ error: "No tenés permiso para cargar Facturación." });
    }
    const { aoa, fuente } = req.body || {};

    try {
      const sheets = sheetsClient();
      let filasAoa = aoa;

      if (fuente === "hoja") {
        filasAoa = await leerFacturacionCruda(sheets);
        if (!filasAoa.length) {
          return res.status(400).json({ error: "La hoja Facturación está vacía." });
        }
      } else {
        if (!Array.isArray(aoa) || !aoa.length) {
          return res.status(400).json({ error: "No llegó el contenido del Excel." });
        }
        // limpia toda la hoja antes de pegar el archivo nuevo (como pegarlo a mano)
        await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: TABS.facturacion });
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${TABS.facturacion}!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: aoa },
        });
      }

      const resultado = parsearFacturacion(filasAoa);
      if (resultado.error) {
        return res.status(400).json({ error: resultado.error });
      }

      await actualizarEvolucion(sheets, resultado.periodo, resultado.filas);

      return res.status(200).json(resultado);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo guardar Facturación: " + err.message });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
