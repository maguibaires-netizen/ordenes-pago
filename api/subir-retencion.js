import { google } from "googleapis";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const CLAVE_RETENCIONES = "cobras-2026-retenciones";
const FOLDER_ID = "1T1u5pgDtAT0mzx5fxfAaZ9eQj_ryck2e";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbymeXAi6k5RbDV8SS398UQTBMZ-ziG5PVa2PGtrz5aNinmIPGWMrvSzOt9gcGmBVPkp/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { filename, mimeType, data, clave } = req.body || {};

    if (clave !== CLAVE_RETENCIONES) {
      return res.status(401).json({ ok: false, error: "Clave inválida" });
    }
    if (!filename || !mimeType || !data) {
      return res.status(400).json({ ok: false, error: "Faltan datos del archivo" });
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_RETENCIONES);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const drive = google.drive({ version: "v3", auth });

    const buffer = Buffer.from(data, "base64");
    const stream = Readable.from(buffer);

    const file = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: "id",
    });

    const fileId = file.data.id;

    // Avisar a Apps Script para que extraiga el texto de este archivo puntual.
    const avisoUrl =
      `${APPS_SCRIPT_URL}?accion=procesarArchivo&fileId=${encodeURIComponent(fileId)}` +
      `&clave=${encodeURIComponent(CLAVE_RETENCIONES)}`;

    let avisoOk = true;
    try {
      await fetch(avisoUrl);
    } catch (avisoErr) {
      avisoOk = false;
      console.error("No se pudo avisar a Apps Script: " + avisoErr.message);
    }

    return res.status(200).json({ ok: true, fileId, avisoOk });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
