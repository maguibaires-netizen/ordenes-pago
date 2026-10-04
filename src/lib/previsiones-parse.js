import { CODIGO_A_SLUG, TIPOS_ND_EN_SALIDA, MARCAS_CONOCIDAS } from "../../api/_lib/previsiones-config.js";

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

function marcaDe(nombre) {
  const n = String(nombre ?? "");
  const nNorm = normalizar(n);
  for (const [prefijo, canonica] of MARCAS_CONOCIDAS) {
    if (nNorm.startsWith(normalizar(prefijo))) return canonica;
  }
  return n.trim().split(" ")[0] || "Sin marca";
}

function categoriaDe(signo, tipo) {
  const s = String(signo ?? "").trim().toUpperCase();
  if (s === "E") return "NC";
  if (s === "S") return TIPOS_ND_EN_SALIDA.has(String(tipo ?? "").trim()) ? "ND" : "Factura";
  return "Revisar";
}

const CLAVES = {
  fecha: ["fecha"],
  articulo: ["articulo"],
  nombre: ["nombre"],
  signo: ["signo"],
  cantidad: ["cantidad ingr"],
  tipo: ["tipo"],
  numero: ["numero"],
  clienteConsolidador: ["cliente consolidador"],
  nombreConsolidador: ["nombre consolidador"],
  comprobante: ["comprobante"],
  observacion: ["descripcion cabecera"],
  importe: ["subtotal neto moneda origen sin impuestos", "subtotal neto moneda origensin impuestos"],
};

// Encuentra la fila de encabezados (no asume que está siempre en la misma
// fila: en el Excel del ERP está en la fila 3, pero si alguien pega el
// contenido manualmente puede variar).
function detectarEncabezados(aoa) {
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const fila = (aoa[i] || []).map(normalizar);
    if (fila.some((c) => c.startsWith("fecha")) && fila.some((c) => c.startsWith("tipo")) && fila.some((c) => c.includes("subtotal neto"))) {
      return i;
    }
  }
  return -1;
}

function mapaDeColumnas(filaEncabezados) {
  const normalizados = filaEncabezados.map(normalizar);
  const mapa = {};
  for (const clave of Object.keys(CLAVES)) {
    const idx = normalizados.findIndex((c) => c && CLAVES[clave].some((a) => c === a || c.startsWith(a)));
    if (idx >= 0) mapa[clave] = idx;
  }
  return mapa;
}

// aoa: array de arrays tal cual sale de leer el .xlsx (o de values.get de Sheets).
// Devuelve { periodo, filas, sinIdentificar } — sinIdentificar son los códigos
// de "Cliente consolidador" que no matchean ningún supermercado conocido.
export function parsearFacturacion(aoa) {
  const idxEncabezados = detectarEncabezados(aoa);
  if (idxEncabezados === -1) {
    return { periodo: "", filas: [], sinIdentificar: [], error: "No encontré la fila de encabezados de Facturación (busco columnas Fecha, Tipo y Subtotal neto)." };
  }

  const mapa = mapaDeColumnas(aoa[idxEncabezados]);
  const faltantes = Object.keys(CLAVES).filter((k) => mapa[k] == null);
  if (faltantes.length) {
    return { periodo: "", filas: [], sinIdentificar: [], error: `Faltan columnas en Facturación: ${faltantes.join(", ")}` };
  }

  const filas = [];
  const codigosSinMatch = new Set();
  const conteoPeriodos = {};

  for (let i = idxEncabezados + 1; i < aoa.length; i++) {
    const f = aoa[i] || [];
    const fechaRaw = f[mapa.fecha];
    if (fechaRaw === undefined || fechaRaw === null || fechaRaw === "") continue;

    const fecha = aIso(fechaRaw);
    if (!fecha) continue;

    const codigo = Number(f[mapa.clienteConsolidador]);
    const superSlug = CODIGO_A_SLUG[codigo] || null;
    if (!superSlug) codigosSinMatch.add(`${codigo} ${f[mapa.nombreConsolidador] || ""}`.trim());

    const periodoFila = fecha.slice(0, 7);
    conteoPeriodos[periodoFila] = (conteoPeriodos[periodoFila] || 0) + 1;

    filas.push({
      fecha,
      articulo: String(f[mapa.articulo] ?? "").trim(),
      nombre: String(f[mapa.nombre] ?? "").trim(),
      marca: marcaDe(f[mapa.nombre]),
      tipo: categoriaDe(f[mapa.signo], f[mapa.tipo]),
      cantidad: aNumero(f[mapa.cantidad]),
      importe: aNumero(f[mapa.importe]),
      codigo: Number.isFinite(codigo) ? codigo : null,
      cliente: String(f[mapa.nombreConsolidador] ?? "").trim(),
      superId: superSlug,
      comprobante: String(f[mapa.comprobante] ?? "").trim(),
      observacion: String(f[mapa.observacion] ?? "").trim(),
    });
  }

  const periodo = Object.entries(conteoPeriodos).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  return { periodo, filas, sinIdentificar: [...codigosSinMatch] };
}
