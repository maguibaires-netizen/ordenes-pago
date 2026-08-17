import * as XLSX from "xlsx";
import { numeroDesdeCelda } from "./numero.js";

// Mapeo de código de comprobante -> categoría, acordado para este formato.
const CATEGORIA_POR_CODIGO = {
  FR: "Factura por servicios",
  OK: "Factura por servicios",
  OM: "Factura",
  RC: "Factura",
  WJ: "SNC",
  WK: "SNC",
  WN: "SNC",
};

// Signo esperado por código, solo como chequeo de sanidad (no bloquea la carga).
const SIGNO_ESPERADO = {
  FR: "negativo",
  OK: "negativo",
  OM: "positivo",
  RC: "positivo",
  WJ: "negativo",
  WK: "negativo",
  WN: "negativo",
};

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
  return String(valor).trim();
}

// Busca una celda que matchee exactamente `etiqueta` y devuelve el primer
// valor no vacío a la derecha en la misma fila (sin asumir una columna fija,
// porque el corrimiento varía un poco entre distintas órdenes).
function buscarValorPorEtiqueta(filas, etiqueta) {
  for (const fila of filas) {
    for (let c = 0; c < fila.length; c++) {
      if (String(fila[c] ?? "").trim() === etiqueta) {
        for (let d = c + 1; d < fila.length; d++) {
          if (fila[d] !== null && fila[d] !== undefined && String(fila[d]).trim() !== "") {
            return fila[d];
          }
        }
      }
    }
  }
  return null;
}

function indiceFilaConEtiquetaEnCol0(filas, etiqueta) {
  return filas.findIndex((fila) => String(fila[0] ?? "").trim() === etiqueta);
}

function parsearComprobantes(filas) {
  const inicio = indiceFilaConEtiquetaEnCol0(filas, "COMPROBANTE");
  if (inicio === -1) return [];

  const resultado = [];
  for (let i = inicio + 1; i < filas.length; i++) {
    const fila = filas[i];
    const celda = String(fila[0] ?? "").trim();
    if (!celda) break;

    const codigo = celda.split(" ")[0].toUpperCase();
    const categoria = CATEGORIA_POR_CODIGO[codigo] || "Revisar";
    const importe = numeroDesdeCelda(fila[10]);
    const signoReal = importe < 0 ? "negativo" : "positivo";
    const signoOk = !SIGNO_ESPERADO[codigo] || SIGNO_ESPERADO[codigo] === signoReal;

    resultado.push({
      comprobante: celda,
      categoria,
      fecha: normalizarFecha(fila[2]),
      importe,
      estado: "",
      notas: categoria === "Revisar"
        ? `Código sin mapear: ${codigo}`
        : signoOk
        ? ""
        : `Revisar signo (esperado ${SIGNO_ESPERADO[codigo]})`,
    });
  }
  return resultado;
}

function parsearMediosDePago(filas) {
  const inicio = indiceFilaConEtiquetaEnCol0(filas, "MEDIOS DE PAGO");
  if (inicio === -1) return [];

  const resultado = [];
  for (let i = inicio + 1; i < filas.length; i++) {
    const fila = filas[i];
    const nombre = String(fila[0] ?? "").trim();
    if (!nombre) break;

    resultado.push({
      comprobante: String(fila[6] ?? "").trim(),
      categoria: nombre.slice(0, 30),
      fecha: "",
      importe: -Math.abs(numeroDesdeCelda(fila[10])),
      estado: "",
      notas: "",
    });
  }
  return resultado;
}

export async function parsearOrdenDePagoRemadv(archivos) {
  const sinIdentificar = [];
  let filasHoja = null;

  for (const archivo of archivos) {
    const filas = leerHojaComoFilas(archivo.arrayBuffer);
    const esRemadv = indiceFilaConEtiquetaEnCol0(filas, "COMPROBANTE") !== -1;
    if (esRemadv) {
      filasHoja = filas;
    } else {
      sinIdentificar.push(archivo.nombre);
    }
  }

  if (!filasHoja) {
    return { filas: [], sinIdentificar: archivos.map((a) => a.nombre) };
  }

  const nroAviso = String(buscarValorPorEtiqueta(filasHoja, "Número") ?? "").trim();
  const fechaPago = normalizarFecha(buscarValorPorEtiqueta(filasHoja, "Fecha"));
  const vencimiento = normalizarFecha(buscarValorPorEtiqueta(filasHoja, "Vencimiento de Pago"));
  const totalIdx = indiceFilaConEtiquetaEnCol0(filasHoja, "TOTAL A PAGAR:");
  const totalAPagar = totalIdx !== -1 ? numeroDesdeCelda(filasHoja[totalIdx].find((v, i) => i > 0 && v)) : 0;

  const filaOrdenPago = {
    comprobante: "",
    categoria: "Orden de pago",
    fecha: fechaPago,
    importe: -Math.abs(totalAPagar),
    estado: "",
    notas: `Vto. ${vencimiento}`,
  };

  const filas = [filaOrdenPago, ...parsearMediosDePago(filasHoja), ...parsearComprobantes(filasHoja)];
  // el nº de aviso ya viene en el archivo (no hay que tipearlo a mano)
  filas.forEach((f) => (f.nroAviso = nroAviso));

  return { filas, sinIdentificar, nroAvisoDetectado: nroAviso };
}
