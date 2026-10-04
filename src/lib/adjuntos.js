const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// "3370726132-20260831-ND-1600053627.pdf" -> ["3370726132", "1600053627"]
// Se descartan los pedazos cortos (tipo "ND") y las fechas pegadas (aaaammdd).
export function tokensDeArchivo(nombre) {
  const base = String(nombre).replace(/\.[^.]+$/, "");
  return base
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 5)
    .filter((t) => !/^20\d{6}$/.test(t))
    .map(norm);
}

// Filas cuyo comprobante (o notas) coincide con algún número del nombre del archivo.
export function filasCandidatas(nombreArchivo, filas) {
  const tokens = tokensDeArchivo(nombreArchivo);
  if (!tokens.length) return [];

  return filas.filter((f) => {
    const comp = norm(f.comprobante);
    const notas = norm(f.notas);
    return tokens.some((t) => {
      if (comp.length >= 5 && comp === t) return true;
      if (comp.length >= 6 && (t.endsWith(comp) || comp.endsWith(t))) return true;
      return notas.length >= 5 && notas.includes(t);
    });
  });
}

// Arma la lista de trabajo para la pantalla de revisión.
// Cada ítem queda con su fila asignada si hubo UNA sola coincidencia clara.
export function armarItems(archivos, filas) {
  const filasPorIndice = new Map(filas.map((f) => [f.rowIndex, f]));
  const usadas = new Set();

  return archivos.map((file, i) => {
    const candidatas = filasCandidatas(file.name, filas);
    let rowIndex = "";
    let aviso = "";

    if (candidatas.length === 1) {
      rowIndex = candidatas[0].rowIndex;
    } else if (candidatas.length > 1) {
      aviso = "Coincide con varias filas — elegí cuál";
    } else {
      aviso = "No encontré el comprobante — elegí la fila";
    }

    let incluir = rowIndex !== "";
    if (incluir) {
      const fila = filasPorIndice.get(rowIndex);
      if (usadas.has(rowIndex)) {
        incluir = false;
        aviso = "Otro archivo de este lote ya va a esa fila";
      } else if (fila?.adjunto) {
        incluir = false;
        aviso = "Esa fila ya tiene un adjunto — tildá para reemplazarlo";
      }
      if (incluir) usadas.add(rowIndex);
    }

    return { id: `${i}-${file.name}-${file.size}`, file, rowIndex, incluir, aviso, estado: "pendiente", error: "" };
  });
}
