import { sheetsClient } from "../_lib/sheets.js";
import { SHEETS } from "../_lib/config.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const sheets = sheetsClient();
    const slugs = Object.keys(SHEETS);

    const resultados = await Promise.all(
      slugs.map(async (slug) => {
        const config = SHEETS[slug];
        try {
          const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId: config.sheetId,
            range: `${config.pestaña}!A2:G`,
          });

          const items = (data.values || [])
            .map((fila) => ({
              nroAviso: fila[0] || "",
              comprobante: fila[1] || "",
              categoria: fila[2] || "",
              estado: fila[3] || "",
              fecha: fila[4] || "",
              importe: Number(fila[5] || 0),
              notas: fila[6] || "",
            }))
            // "pendiente" = todo lo que todavía no está Conciliada
            .filter((f) => f.estado !== "Conciliada");

          return {
            slug,
            cantidad: items.length,
            monto: items.reduce((acc, i) => acc + i.importe, 0),
            items,
          };
        } catch (err) {
          console.error(`Error leyendo ${slug}:`, err.message);
          return { slug, cantidad: 0, monto: 0, items: [], error: err.message };
        }
      })
    );

    return res.status(200).json({ supermercados: resultados.filter((r) => r.cantidad > 0 || r.error) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo armar el resumen: " + err.message });
  }
}
