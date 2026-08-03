import * as XLSX from "xlsx";

// ---------- utilidades ----------

function leerHojaComoFilas(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null });
}

function normalizarFecha(valor) {
  if (!valor) return "";
  if (valor instanceof Date) {
    const d = String(valor.getDate()).padStart(2, "0");
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${valor.getFullYear()}`;
  }
  return String(valor);
}

function esComprobanteBaires(numero) {
  return typeof numero === "string" && numero.trim().toUpperCase().startsWith("00026A");
}

function esFacturaServicio(numero) {
  return typeof numero === "string" && numero.trim().toUpperCase().startsWith("4444A");
}

// ---------- detección de qué tabla es cada archivo ----------

// Devuelve "ordenPago" | "retenciones" | "comprobantes" | null
export function detectarTipoDeArchivo(filas) {
  const header = (filas[0] || []).map((h) => String(h || "").toLowerCase());
  const tiene = (txt) => header.some((h) => h.includes(txt));

  if (tiene("nro. cheque") || tiene("importe en pesos")) return "ordenPago";
  if (tiene("importe total") && tiene("archivo")) return "retenciones";
  if (tiene("punto") && tiene("descripción")) return "comprobantes";
  return null;
}

// ---------- parseo de cada tabla ----------

function parsearOrdenPago(filas) {
  const [nroCheque, fechaVenc, fechaPago, moneda, importe, importeEnPesos] = filas[1] || [];
  return {
    nroCheque: nroCheque || "",
    fechaVencimiento: normalizarFecha(fechaVenc),
    fechaPago: normalizarFecha(fechaPago),
    moneda: moneda || "PESOS",
    importe: importeEnPesos ?? importe ?? 0,
  };
}

function parsearRetenciones(filas) {
  return filas.slice(1).filter(Boolean).map((fila) => {
    const [numero, tipo, fechaVencimiento, importeTotal] = fila;
    return {
      comprobante: String(numero ?? ""),
      categoria: String(tipo ?? "").slice(0, 16),
      fecha: normalizarFecha(fechaVencimiento),
      importe: -Math.abs(Number(importeTotal ?? 0)),
      estado: "",
      notas: "",
    };
  });
}

// Tipo -> regla de categorización (ver definición acordada para Carrefour)
function clasificarComprobante({ tipo, numero, total }) {
  const numeroBaires = esComprobanteBaires(numero);
  const totalPositivo = Number(total) >= 0;

  if (tipo === "8F" && numeroBaires && totalPositivo) return "Factura";
  if (tipo === "8C" && numeroBaires && !totalPositivo) return "ND";
  if (tipo === "K0" && !numeroBaires && !totalPositivo) return "SNC";
  if (tipo === "K8" && !numeroBaires && totalPositivo) return "SNC";
  if (tipo === "FS" && esFacturaServicio(numero) && !totalPositivo) return "FC por servicios";

  // No matchea ningún patrón esperado -> se marca para revisión manual en vez de adivinar
  return "Revisar";
}

function parsearComprobantes(filas) {
  return filas.slice(1).filter(Boolean).map((fila) => {
    const [, tipo, , numero, fecha, , total] = fila;
    const categoria = clasificarComprobante({ tipo, numero, total });
    return {
      comprobante: String(numero ?? ""),
      categoria,
      fecha: normalizarFecha(fecha),
      importe: Number(total ?? 0),
      estado: "",
      notas: categoria === "Revisar" ? `Tipo original: ${tipo}` : "",
    };
  });
}

// ---------- función principal ----------

// archivos: array de { nombre, arrayBuffer } — no importa el orden ni cuál es cuál
export async function parsearOrdenDePagoCarrefour(archivos) {
  const resultado = { ordenPago: null, retenciones: [], comprobantes: [] };
  const sinIdentificar = [];

  for (const archivo of archivos) {
    const filas = leerHojaComoFilas(archivo.arrayBuffer);
    const tipo = detectarTipoDeArchivo(filas);

    if (tipo === "ordenPago") resultado.ordenPago = parsearOrdenPago(filas);
    else if (tipo === "retenciones") resultado.retenciones = parsearRetenciones(filas);
    else if (tipo === "comprobantes") resultado.comprobantes = parsearComprobantes(filas);
    else sinIdentificar.push(archivo.nombre);
  }

  // fila única que representa la orden de pago / cheque (el nº de aviso lo completa la persona a mano)
  const filaOrdenPago = resultado.ordenPago
    ? [{
        comprobante: "",
        categoria: "Orden de pago",
        fecha: resultado.ordenPago.fechaPago,
        importe: -Math.abs(Number(resultado.ordenPago.importe ?? 0)),
        estado: "",
        notas: `Vto. ${resultado.ordenPago.fechaVencimiento}`,
      }]
    : [];

  const filas = [...filaOrdenPago, ...resultado.retenciones, ...resultado.comprobantes];

  return { filas, sinIdentificar };
}
