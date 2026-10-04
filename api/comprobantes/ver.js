import { requiereSesion } from "../_lib/auth.js";
import { driveClient } from "../_lib/drive.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  // los archivos son privados: solo se entregan a quien inició sesión en la app
  if (!requiereSesion(req)) {
    return res.status(401).json({ error: "Tenés que iniciar sesión para ver el comprobante." });
  }

  const { id } = req.query;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return res.status(400).json({ error: "Comprobante inválido." });
  }

  try {
    const drive = driveClient();
    const meta = await drive.files.get({ fileId: id, fields: "name,mimeType" });
    const contenido = await drive.files.get({ fileId: id, alt: "media" }, { responseType: "arraybuffer" });

    const nombre = encodeURIComponent(meta.data.name || "comprobante.pdf");
    res.setHeader("Content-Type", meta.data.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${nombre}`);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.status(200).send(Buffer.from(contenido.data));
  } catch (err) {
    console.error(err);
    const noExiste = err?.code === 404 || err?.status === 404;
    return res
      .status(noExiste ? 404 : 500)
      .json({ error: noExiste ? "El comprobante ya no está en Drive." : "No se pudo abrir el comprobante: " + err.message });
  }
}
