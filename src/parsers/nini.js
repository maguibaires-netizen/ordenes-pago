import { extraerLineasPDF } from "./pdf-lineas.js";
import { numeroDesdeCelda } from "./numero.js";

function numeroConSignoFinal(txt) {
  // "15946.36-" -> -15946.36 (la OP de Nini pone el signo negativo al final)
  const s = String(txt || "").trim();
  const negativo = s.endsWith("-");
  const limpio = negativo ? s.slice(0, -1) : s;
  const n = numeroDesdeCelda(limpio);
  return negativo ? -Math.abs(n) : n;
}

// "Nota de Crédito A 00028A00001769 19/08/2026 TOTAL 15946.36-"
const RE_COMPROBANTE = /^(.+?)\s+(\S+)\s+(\d{2}\/\d{2}\/\d{4})\s+(TOTAL|PARCIAL)\s+(-?[\d.,]+-?)$/;

function categoriaComprobante(tipo) {
  const t = tipo.trim().toLowerCase();
  if (t.startsWith("nota de credito") || t.startsWith("nota de crédito")) return "NC";
  // cualquier factura (incluida "FCE A MiPyme") va a la misma categoría
  if (t.includes("factura") || t.startsWith("fce")) return "Factura";
  return "Revisar";
}

export async function parsearOrdenDePagoNini(archivos) {
  const sinIdentificar = [];
  let lineas = null;

  for (const archivo of archivos) {
    const nombre = archivo.nombre.toLowerCase();
    if (!nombre.endsWith(".pdf")) {
      sinIdentificar.push(archivo.nombre);
      continue;
    }
    const lineasArchivo = await extraerLineasPDF(archivo.arrayBuffer, 1);
    const esOrdenDePago = lineasArchivo.some((l) => l.toUpperCase().includes("OP N"));
    if (esOrdenDePago) {
      lineas = lineasArchivo;
    } else {
      sinIdentificar.push(archivo.nombre);
    }
  }

  if (!lineas) {
    return { filas: [], sinIdentificar: archivos.map((a) => a.nombre) };
  }

  const lineaOp = lineas.find((l) => /OP N/i.test(l));
  const nroAviso = lineaOp ? (lineaOp.match(/OP\s*N[°º]?:?\s*(\S+)/i)?.[1] || "") : "";

  const lineaFecha = lineas.find((l) => /^Fecha:/i.test(l) || l.includes("Fecha:"));
  const fecha = lineaFecha ? (lineaFecha.match(/Fecha:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || "") : "";

  const idxComp = lineas.findIndex((l) => l.startsWith("Comprobante"));
  const idxDetalle = lineas.findIndex((l) => l.startsWith("Detalle de Valores"));
  const idxTotal = lineas.findIndex((l, i) => i > idxDetalle && /^Total\b/i.test(l));

  const comprobantes = [];
  const vistos = new Set();
  if (idxComp !== -1 && idxDetalle !== -1) {
    for (let i = idxComp + 1; i < idxDetalle; i++) {
      const linea = lineas[i];
      if (vistos.has(linea)) continue; // descarta líneas duplicadas exactas
      const m = RE_COMPROBANTE.exec(linea);
      if (!m) continue;
      vistos.add(linea);
      const [, tipo, numero, fechaDoc, , importeTxt] = m;
      const categoria = categoriaComprobante(tipo);
      comprobantes.push({
        comprobante: numero.trim(),
        categoria,
        fecha: fechaDoc,
        importe: numeroConSignoFinal(importeTxt),
        estado: "",
        notas: categoria === "Revisar" ? `Tipo original: ${tipo.trim()}` : "",
        nroAviso,
      });
    }
  }

  let chequeImporte = 0;
  const retenciones = [];
  if (idxDetalle !== -1 && idxTotal !== -1) {
    for (let i = idxDetalle + 1; i < idxTotal; i++) {
      const linea = lineas[i];
      if (linea.startsWith("Forma de Pago")) continue; // encabezado de la tabla
      const numeros = linea.match(/-?[\d.,]+-?$/);
      if (!numeros) continue; // línea de continuación (ej: nombre de banco cortado)

      if (/^Cheque/i.test(linea)) {
        chequeImporte += numeroDesdeCelda(numeros[0]);
      } else {
        const etiqueta = linea.slice(0, linea.length - numeros[0].length).trim();
        if (!etiqueta) continue;
        retenciones.push({
          comprobante: "",
          categoria: etiqueta,
          fecha,
          importe: -Math.abs(numeroDesdeCelda(numeros[0])),
          estado: "",
          notas: "",
          nroAviso,
        });
      }
    }
  }

  const filaOrdenPago = {
    comprobante: "",
    categoria: "Orden de pago",
    fecha,
    importe: -Math.abs(chequeImporte),
    estado: "",
    notas: "",
    nroAviso,
  };

  return { filas: [filaOrdenPago, ...retenciones, ...comprobantes], sinIdentificar, nroAvisoDetectado: nroAviso };
}
