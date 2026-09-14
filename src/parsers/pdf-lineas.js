import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Devuelve un array de líneas de texto de una página del PDF, reconstruidas
// a partir de la posición de cada fragmento (porque pdf.js no da líneas
// "prontas", da pedacitos de texto con coordenadas x/y).
export async function extraerLineasPDF(arrayBuffer, numeroPagina = 1) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pagina = await pdf.getPage(numeroPagina);
  const contenido = await pagina.getTextContent();

  const items = contenido.items.map((it) => ({
    texto: it.str,
    x: it.transform[4],
    y: it.transform[5],
  }));

  items.sort((a, b) => b.y - a.y || a.x - b.x);

  const TOLERANCIA_Y = 2;
  const lineas = [];
  let actual = [];
  let yActual = null;

  for (const it of items) {
    if (yActual === null || Math.abs(it.y - yActual) > TOLERANCIA_Y) {
      if (actual.length) lineas.push(actual);
      actual = [it];
      yActual = it.y;
    } else {
      actual.push(it);
    }
  }
  if (actual.length) lineas.push(actual);

  return lineas.map((linea) =>
    linea
      .sort((a, b) => a.x - b.x)
      .map((i) => i.texto)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  );
}
