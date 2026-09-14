import Papa from "papaparse";
import { numeroDesdeCelda } from "./numero.js";

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// tipo de documento (normalizado) -> categoría a usar.
// Los que empiezan con "retencion" se resuelven aparte (ver más abajo),
// porque son varios y todos siguen la misma regla.
const MAPA_CATEGORIA = {
  "venta por punt. y publicidad": "SNC Servicios",
  "factura a": "Factura",
  "factura a de credito e": "Factura",
  "nota de debito no fiscal": "SNC",
};

function clasificar(tipoDocumento, importeOriginal) {
  const norm = normalizar(tipoDocumento);

  if (norm.startsWith("retencion")) {
    // en el archivo vienen en positivo, pero en nuestro sistema van negativas
    return { categoria: tipoDocumento.trim(), importe: -Math.abs(importeOriginal), notas: "" };
  }

  if (MAPA_CATEGORIA[norm]) {
    // estos ya vienen con el signo correcto en el archivo, no se tocan
    return { categoria: MAPA_CATEGORIA[norm], importe: importeOriginal, notas: "" };
  }

  return { categoria: "Revisar", importe: importeOriginal, notas: `Tipo original: ${tipoDocumento}` };
}

export async function parsearOrdenDePagoCoto(archivos) {
  const sinIdentificar = [];
  let filasCsv = null;
  let nroAviso = "";

  for (const archivo of archivos) {
    const texto = new TextDecoder("utf-8").decode(archivo.arrayBuffer);
    const { data } = Papa.parse(texto, { header: true, skipEmptyLines: true });
    const filasValidas = data.filter((fila) => String(fila["NRO DOCUMENTO"] || "").trim() !== "");
    const esCoto = filasValidas.length > 0 && "TIPO DOCUMENTO" in filasValidas[0] && "ORDEN DE PAGO" in filasValidas[0];
    if (esCoto) {
      filasCsv = filasValidas;
      nroAviso = String(filasValidas[0]["ORDEN DE PAGO"] || "").trim();
    } else {
      sinIdentificar.push(archivo.nombre);
    }
  }

  if (!filasCsv) {
    return { filas: [], sinIdentificar: archivos.map((a) => a.nombre) };
  }

  const lineas = filasCsv.map((fila) => {
    const importeOriginal = numeroDesdeCelda(fila["IMPORTE"]);
    const { categoria, importe, notas } = clasificar(fila["TIPO DOCUMENTO"], importeOriginal);
    return {
      comprobante: String(fila["NRO DOCUMENTO"] || "").trim(),
      categoria,
      fecha: "", // el archivo de Coto no trae fecha — se completa a mano
      importe,
      estado: "",
      notas,
      nroAviso,
    };
  });

  // Coto no incluye el importe del cheque — se calcula por diferencia:
  // el total pagado es lo opuesto a la suma de todas las líneas.
  const totalCheque = Math.round(-lineas.reduce((acc, f) => acc + f.importe, 0) * 100) / 100;

  const filaOrdenPago = {
    comprobante: "",
    categoria: "Orden de pago",
    fecha: "",
    importe: totalCheque,
    estado: "",
    notas: "Importe calculado por diferencia (Coto no lo incluye en el archivo)",
    nroAviso,
  };

  return { filas: [filaOrdenPago, ...lineas], sinIdentificar, nroAvisoDetectado: nroAviso };
}
