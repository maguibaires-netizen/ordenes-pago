import * as XLSX from "xlsx";

function normalizar(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function aIso(v) {
  if (v instanceof Date) {
    const d = String(v.getDate()).padStart(2, "0");
    const m = String(v.getMonth() + 1).padStart(2, "0");
    return `${v.getFullYear()}-${m}-${d}`;
  }
  const m = String(v ?? "").match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return "";
  const y = m[3].length === 2 ? "20" + m[3] : m[3];
  return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function aNumero(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

const CLAVES = {
  fecha: ["fecha", "fecha contable", "fecha emision"],
  numFactura: ["n factura", "no factura", "n° factura", "nro factura", "numero comprobante", "n comprobante"],
  vencimiento: ["vencimiento", "fecha vencimiento", "vencim"],
  debe: ["debe"],
  haber: ["haber"],
  importeOrigen: ["importe origen", "imp origen"],
  condPago: ["cond pago", "cond. pago", "condicion de pago", "condicion pago"],
  observacion: ["observacion", "observaciones"],
  comentario: ["comentario", "comentarios"],
};

// Busca el bloque "COMPOSICIÓN DE SALDO" dentro de una hoja (filas ya como
// array de arrays) y devuelve los comprobantes que encuentra.
// El importe de cada línea sale de Debe - Haber (débitos: facturas y ND;
// créditos: NC, recibos, retenciones — quedan en negativo), porque el
// export del ERP no trae una columna de importe neto lista para usar
// (la de "Saldo" es un acumulado corriendo, no el importe de la línea).
export function comprobantesDeHoja(filas) {
  let mapa = null;
  let inicio = -1;

  for (let i = 0; i < filas.length; i++) {
    const f = (filas[i] || []).map(normalizar);
    if (!f.some((c) => c.startsWith("debe"))) continue;
    if (!f.some((c) => c.startsWith("haber"))) continue;
    if (!f.some((c) => c.includes("vencim"))) continue;

    mapa = {};
    Object.keys(CLAVES).forEach((clave) => {
      const idx = f.findIndex(
        (c) => c && CLAVES[clave].some((a) => c === a || c.replace(/[°º.]/g, "") === a || c.startsWith(a))
      );
      if (idx >= 0) mapa[clave] = idx;
    });
    inicio = i;
    break;
  }

  if (inicio < 0) return [];

  const resultado = [];
  for (let i = inicio + 1; i < filas.length; i++) {
    const f = filas[i] || [];
    const fecha = aIso(f[mapa.fecha]);
    const debe = aNumero(f[mapa.debe]);
    const haber = aNumero(f[mapa.haber]);
    const importe = debe - haber;
    if (!fecha && !importe) continue;
    if (!fecha) break; // se terminó el bloque de datos

    resultado.push({
      fecha,
      numFactura: String(f[mapa.numFactura] ?? "").trim(),
      vencimiento: aIso(f[mapa.vencimiento]),
      importe,
      importeOrigen: aNumero(f[mapa.importeOrigen]),
      condPago: String(f[mapa.condPago] ?? "").trim(),
      observacion: String(f[mapa.observacion] ?? "").trim(),
      comentario: String(f[mapa.comentario] ?? "").trim(),
    });
  }
  return resultado;
}

// Lee un archivo .xlsx y devuelve [{ nombre, comprobantes }] por cada hoja
// donde se haya podido reconocer el bloque de composición de saldo.
export async function leerXlsxComposicion(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  const hojas = [];
  for (const nombre of wb.SheetNames) {
    const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, raw: true, defval: null });
    const comprobantes = comprobantesDeHoja(filas);
    if (comprobantes.length) hojas.push({ nombre, comprobantes });
  }
  return hojas;
}
