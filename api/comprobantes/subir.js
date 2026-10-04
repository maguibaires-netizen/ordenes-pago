import { Readable } from "stream";
import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";
import { requiereAdmin } from "../_lib/auth.js";
import { driveClient, carpetaDeSupermercado, olvidarCarpetas } from "../_lib/drive.js";

// Vercel acepta cuerpos de hasta 4,5 MB; el PDF viaja en base64 (~33% más
// pesado), así que el límite práctico del archivo original es ~3 MB.
const MAX_BYTES = 3 * 1024 * 1024;

function limpiarNombre(nombre) {
  const base = String(nombre || "comprobante").replace(/[\\/:*?"<>|\r\n]+/g, "_").trim() || "comprobante";
  return /\.pdf$/i.test(base) ? base : base + ".pdf";
}

async function subirAlDrive(drive, slug, nombre, buffer) {
  const carpetaId = await carpetaDeSupermercado(drive, slug);
  const { data } = await drive.files.create({
    requestBody: { name: nombre, parents: [carpetaId] },
    media: { mimeType: "application/pdf", body: Readable.from(buffer) },
    fields: "id,name",
  });
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (!requiereAdmin(req)) {
    return res.status(403).json({ error: "No tenés permiso para adjuntar comprobantes." });
  }

  const { slug, rowIndex, nombre, contenidoBase64 } = req.body || {};
  const config = SHEETS[slug];

  if (!config) {
    return res.status(400).json({ error: `El supermercado "${slug}" todavía no está conectado a un Sheet.` });
  }
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return res.status(400).json({ error: "Falta indicar a qué fila se adjunta el comprobante." });
  }
  if (typeof contenidoBase64 !== "string" || !contenidoBase64) {
    return res.status(400).json({ error: "No llegó el archivo." });
  }

  const buffer = Buffer.from(contenidoBase64, "base64");
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: "El PDF pesa más de 3 MB, es demasiado grande para adjuntarlo desde la app." });
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return res.status(400).json({ error: "El archivo no es un PDF válido." });
  }

  try {
    const drive = driveClient();
    const sheets = sheetsClient();
    const celda = `${config.pestaña}!H${rowIndex}`;
    const nombreLimpio = limpiarNombre(nombre);

    let archivo;
    try {
      archivo = await subirAlDrive(drive, slug, nombreLimpio, buffer);
    } catch (err) {
      // si borraron o movieron la carpeta a mano, la caché puede estar vieja: reintenta una vez
      if (err?.code === 404 || err?.status === 404) {
        olvidarCarpetas();
        archivo = await subirAlDrive(drive, slug, nombreLimpio, buffer);
      } else {
        throw err;
      }
    }

    // si la fila ya tenía otro adjunto, se reemplaza (y se borra el anterior de Drive)
    let anterior = "";
    try {
      const previo = await sheets.spreadsheets.values.get({ spreadsheetId: config.sheetId, range: celda });
      anterior = previo.data.values?.[0]?.[0] || "";
    } catch {
      /* si no se puede leer, seguimos igual */
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.sheetId,
      range: celda,
      valueInputOption: "RAW",
      requestBody: { values: [[archivo.id]] },
    });

    if (anterior && anterior !== archivo.id) {
      try {
        await drive.files.delete({ fileId: anterior });
      } catch {
        /* si el anterior ya no existe o no es nuestro, no pasa nada */
      }
    }

    return res.status(200).json({ ok: true, fileId: archivo.id, nombre: archivo.name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo subir el comprobante: " + err.message });
  }
}
