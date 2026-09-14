import { extraerLineasPDF } from "./pdf-lineas.js";
import { numeroDesdeCelda } from "./numero.js";

function normalizarFechaCorta(txt) {
  // "20.08.26" -> "20/08/2026"
  const m = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(String(txt || "").trim());
  if (!m) return String(txt || "").trim();
  const [, d, mes, a] = m;
  return `${d}/${mes}/20${a}`;
}

// fila de "EN CANCELACION DE LOS SIGUIENTES CONCEPTOS":
// "RH A 0026-00000276 05.06.26 ARS 6.828.015,19 28.08.26 1,00000 6.828.015,19"
const RE_CANCELACION = /^(.+?)\s+(\d{2}\.\d{2}\.\d{2})\s+ARS\s+(-?[\d.,]+)\s+\d{2}\.\d{2}\.\d{2}\s+[\d.,]+\s+(-?[\d.,]+)$/;

// fila de "ENTREGAMOS LOS SIGUIENTES VALORES":
// "RET_GAN_BIENES_RI 20260016250 20.08.26 1,00000 306.799,94"
const RE_ENTREGAMOS = /^(.+?)\s+\S+\s+\d{2}\.\d{2}\.\d{2}\s+[\d.,]+\s+(?:ARS\s+)?(-?[\d.,]+)$/;

function categoriaCancelacion(comprobante) {
  const c = comprobante.trim().toUpperCase();
  if (c.startsWith("RH A")) return "Factura";
  if (c.startsWith("4N I")) return "NC";
  return "Revisar";
}

export async function parsearOrdenDePagoDorinka(archivos) {
  const sinIdentificar = [];
  let lineas = null;

  for (const archivo of archivos) {
    const nombre = archivo.nombre.toLowerCase();
    if (!nombre.endsWith(".pdf")) {
      sinIdentificar.push(archivo.nombre);
      continue;
    }
    const lineasArchivo = await extraerLineasPDF(archivo.arrayBuffer, 1);
    const esOrdenDePago = lineasArchivo.some((l) => l.includes("*ORDEN DE PAGO*"));
    if (esOrdenDePago) {
      lineas = lineasArchivo;
    } else {
      sinIdentificar.push(archivo.nombre);
    }
  }

  if (!lineas) {
    return { filas: [], sinIdentificar: archivos.map((a) => a.nombre) };
  }

  const lineaNumero = lineas.find((l) => l.includes("NUMERO:"));
  const nroAviso = lineaNumero ? lineaNumero.split("NUMERO:")[1].trim().split(" ")[0] : "";

  const lineaFecha = lineas.find((l) => l.includes("FECHA:"));
  const fechaTxt = lineaFecha ? lineaFecha.split("FECHA:")[1].trim().split(" ")[0] : "";
  const fecha = normalizarFechaCorta(fechaTxt);

  const lineaTotalAPagar = lineas.find((l) => l.startsWith("TOTAL A PAGAR:"));
  const totalAPagar = lineaTotalAPagar ? numeroDesdeCelda(lineaTotalAPagar.replace(/^TOTAL A PAGAR:\s*\$?/, "")) : 0;

  const idxCancelacion = lineas.findIndex((l) => l.startsWith("EN CANCELACION"));
  const idxTotalCancelado = lineas.findIndex((l) => l.startsWith("TOTAL CANCELADO"));
  const idxEntregamos = lineas.findIndex((l) => l.startsWith("ENTREGAMOS"));

  const comprobantes = [];
  if (idxCancelacion !== -1 && idxTotalCancelado !== -1) {
    for (let i = idxCancelacion + 1; i < idxTotalCancelado; i++) {
      const m = RE_CANCELACION.exec(lineas[i]);
      if (!m) continue; // salta el encabezado de la tabla u otras líneas sueltas
      const [, comprobante, fechaDoc, , importeCancelado] = m;
      const categoria = categoriaCancelacion(comprobante);
      comprobantes.push({
        comprobante: comprobante.trim(),
        categoria,
        fecha: normalizarFechaCorta(fechaDoc),
        importe: numeroDesdeCelda(importeCancelado),
        estado: "",
        notas: categoria === "Revisar" ? `Código sin mapear: ${comprobante.trim()}` : "",
        nroAviso,
      });
    }
  }

  const deducciones = [];
  if (idxEntregamos !== -1) {
    const idxFin = lineas.findIndex((l, i) => i > idxEntregamos && l.startsWith("TOTAL"));
    const limite = idxFin === -1 ? lineas.length : idxFin;
    for (let i = idxEntregamos + 1; i < limite; i++) {
      const m = RE_ENTREGAMOS.exec(lineas[i]);
      if (!m) continue;
      const [, etiqueta, importe] = m;
      const label = etiqueta.trim();
      let categoria = null;
      if (label.toUpperCase().startsWith("RET_")) categoria = label.replace(/_/g, " ").trim();
      else if (label.toLowerCase().startsWith("descuento")) categoria = "NC";
      if (!categoria) continue; // es la línea del medio de pago (el cheque) — ya la tomamos de TOTAL A PAGAR
      deducciones.push({
        comprobante: "",
        categoria,
        fecha,
        importe: -Math.abs(numeroDesdeCelda(importe)),
        estado: "",
        notas: "",
        nroAviso,
      });
    }
  }

  const filaOrdenPago = {
    comprobante: "",
    categoria: "Orden de pago",
    fecha,
    importe: -Math.abs(totalAPagar),
    estado: "",
    notas: "",
    nroAviso,
  };

  return {
    filas: [filaOrdenPago, ...deducciones, ...comprobantes],
    sinIdentificar,
    nroAvisoDetectado: nroAviso,
  };
}
