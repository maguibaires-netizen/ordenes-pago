// facturacion-lite.js — lee el Excel de facturación que exporta el ERP.
// Busca la fila de encabezados por nombre (no por posición) y devuelve filas
// con la misma forma que usa la pantalla. Los índices definitivos se
// acuerdan con Claude Code (ver PROMPT-CLAUDE-CODE.md).
import { leerXlsx } from "./xlsx-lite.js";

const norm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const iso = v => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const m = String(v ?? "").match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return "";
  const y = m[3].length === 2 ? "20" + m[3] : m[3];
  return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
};
const num = v => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

// Encabezados de la hoja 'Facturación' (fila 1).
const CLAVES = {
  fecha: ["fecha"],
  articulo: ["articulo"],
  nombre: ["nombre"],
  tipo: ["tipo"],
  numero: ["numero"],
  cantidad: ["cantidad uni de stock", "cantidad uni", "cantidad ingr"],
  importe: ["subtotal neto moneda origen sin impuestos", "subtotal neto"],
  codigo: ["cliente consolidador"],
  cliente: ["nombre consolidador"],
  comprobante: ["comprobante"],
  observacion: ["descripcion cabecera", "observacion", "observaciones"]
};

// Tipo de comprobante del ERP → tipo de la pantalla. "1.3" está pendiente de confirmar.
export const TIPOS = { FCA: "Factura", FCB: "Factura", NCA: "NC", NCB: "NC", NDA: "ND", NDB: "ND", "1.3": "Factura" };

export const MARCAS = ["Kongo Gold", "Kongo", "Caudillos", "Carnix", "Cereales", "Maintenance", "Maint"];
const marcaDe = nombre => {
  const n = norm(nombre);
  const m = MARCAS.find(x => n.startsWith(norm(x)));
  return m === "Maint" ? "Maintenance" : (m || "Otras");
};

export async function leerFacturacion(file, supers) {
  const hojas = await leerXlsx(file);
  for (const h of hojas) {
    const idx = h.filas.findIndex(f => (f || []).some(c => norm(c).startsWith("subtotal neto")));
    if (idx < 0) continue;
    const head = h.filas[idx].map(norm);
    const col = {};
    for (const k of Object.keys(CLAVES)) {
      col[k] = head.findIndex(c => CLAVES[k].some(a => c === a || c.startsWith(a)));
    }
    const out = [];
    for (const f of h.filas.slice(idx + 1)) {
      if (!f || !f.length) continue;
      const fecha = iso(f[col.fecha]);
      if (!fecha) continue;
      const tipoErp = String(f[col.tipo] ?? "").trim();
      const tipo = TIPOS[tipoErp] || tipoErp;
      const codigo = num(f[col.codigo]);
      const sup = (supers || []).find(s => s.codigo === codigo);
      const imp = num(f[col.importe]);
      out.push({
        fecha,
        articulo: String(f[col.articulo] ?? ""),
        nombre: String(f[col.nombre] ?? ""),
        marca: marcaDe(f[col.nombre]),
        tipo,
        numero: f[col.numero],
        cantidad: num(f[col.cantidad]),
        importe: tipo === "NC" && imp > 0 ? -imp : imp,
        codigo,
        cliente: String(f[col.cliente] ?? ""),
        superId: sup ? sup.id : "",
        comprobante: String(f[col.comprobante] ?? ""),
        observacion: col.observacion >= 0 ? String(f[col.observacion] ?? "").trim() : ""
      });
    }
    if (out.length) return out;
  }
  throw new Error("No encontré la fila de encabezados (Fecha · Artículo · … · Subtotal neto).");
}
