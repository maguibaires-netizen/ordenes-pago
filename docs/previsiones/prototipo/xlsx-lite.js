// xlsx-lite.js — lector mínimo de .xlsx en el navegador (sin librerías).
// Devuelve { nombre, filas: [[celda, ...], ...] } por hoja. Las fechas vienen como Date.

const U = new TextDecoder();

async function inflate(bytes, method) {
  if (method === 0) return bytes;
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

function leerZip(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = o => dv.getUint16(o, true), u32 = o => dv.getUint32(o, true);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (u32(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("No parece un archivo .xlsx");
  let p = u32(eocd + 16);
  const n = u16(eocd + 10), out = {};
  for (let i = 0; i < n; i++) {
    const nl = u16(p + 28), el = u16(p + 30), cl = u16(p + 32);
    out[U.decode(buf.subarray(p + 46, p + 46 + nl))] = { method: u16(p + 10), csize: u32(p + 20), lho: u32(p + 42) };
    p += 46 + nl + el + cl;
  }
  return { u16, out };
}

const esc = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const colNum = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
const serialADate = v => new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);

export async function leerXlsx(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const { u16, out } = leerZip(buf);
  const texto = async name => {
    const f = out[name];
    if (!f) return "";
    const nl = u16(f.lho + 26), el = u16(f.lho + 28), start = f.lho + 30 + nl + el;
    return U.decode(await inflate(buf.subarray(start, start + f.csize), f.method));
  };

  const shared = [...(await texto("xl/sharedStrings.xml")).matchAll(/<si>(.*?)<\/si>/gs)]
    .map(m => esc([...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(x => x[1]).join("").replace(/[\r\n]+/g, " ").trim()));

  const stylesXml = await texto("xl/styles.xml");
  const cellXfs = (stylesXml.match(/<cellXfs[^>]*>(.*?)<\/cellXfs>/s) || ["", ""])[1];
  const fmtDeXf = [...cellXfs.matchAll(/<xf\b([^>]*)\/?>/g)].map(m => { const f = m[1].match(/numFmtId="(\d+)"/); return f ? +f[1] : 0; });
  const fechaFmt = new Set([14, 15, 16, 17, 22, 45, 46, 47]);
  // Formatos propios (id >= 164): son fecha si su código tiene d/m/y fuera de comillas.
  for (const m of stylesXml.matchAll(/<numFmt[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)) {
    const code = m[2].replace(/"[^"]*"|\[[^\]]*\]/g, "").toLowerCase();
    if (/[dy]/.test(code) || /m{1,4}[^0#]*[dy]|[dy][^0#]*m/.test(code)) fechaFmt.add(+m[1]);
  }

  const wb = await texto("xl/workbook.xml");
  const rels = await texto("xl/_rels/workbook.xml.rels");
  const mapaRel = {};
  for (const m of rels.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) mapaRel[m[1]] = m[2].replace(/^\/?xl\//, "");

  const hojas = [];
  for (const m of wb.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g)) {
    const path = "xl/" + (mapaRel[m[2]] || "");
    const xml = await texto(path);
    if (!xml) continue;
    const filas = [];
    for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs)) {
      const fila = [];
      for (const cm of rm[2].matchAll(/<c r="([A-Z]+\d+)"([^>]*)>(.*?)<\/c>/gs)) {
        const attrs = cm[2], cuerpo = cm[3];
        const vm = cuerpo.match(/<v>(.*?)<\/v>/s), tm = cuerpo.match(/<t[^>]*>(.*?)<\/t>/s);
        let val = null;
        if (/t="s"/.test(attrs) && vm) val = shared[+vm[1]] ?? "";
        else if (/t="inlineStr"/.test(attrs) && tm) val = esc(tm[1]);
        else if (vm) {
          const num = parseFloat(vm[1]);
          const sm = attrs.match(/s="(\d+)"/);
          const fmt = sm ? fmtDeXf[+sm[1]] : 0;
          val = (!isNaN(num) && fechaFmt.has(fmt)) ? serialADate(num) : (isNaN(num) ? vm[1] : num);
        }
        fila[colNum(cm[1])] = val;
      }
      filas.push(fila);
    }
    hojas.push({ nombre: esc(m[1]), filas });
  }
  return hojas;
}

const norm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const iso = v => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return serialADate(v).toISOString().slice(0, 10);
  const m = String(v ?? "").match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return "";
  const y = m[3].length === 2 ? "20" + m[3] : m[3];
  return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
};
const num = v => {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

// Busca el bloque COMPOSICIÓN DE SALDO en una hoja y devuelve los comprobantes.
export function comprobantesDeHoja(filas) {
  const claves = {
    fecha: ["fecha", "fecha contable", "fecha emision"],
    debe: ["debe", "debe moneda expresion", "debe moneda de expresion"],
    haber: ["haber", "haber moneda expresion", "haber moneda de expresion"],
    numFactura: ["n factura", "no factura", "n° factura", "nro factura", "numero comprobante", "n comprobante"],
    vencimiento: ["vencimiento", "fecha vencimiento", "vencim"],
    importe: ["importe"],
    importeOrigen: ["importe origen", "imp origen"],
    condPago: ["cond pago", "cond. pago", "condicion de pago", "condicion pago"],
    observacion: ["observacion", "observaciones"],
    comentario: ["comentario", "comentarios"]
  };
  let head = -1, mapa = null;
  for (let i = 0; i < filas.length; i++) {
    const f = (filas[i] || []).map(norm);
    if (!f.some(c => c.startsWith("importe") || c.startsWith("debe") || c.startsWith("haber"))) continue;
    if (!f.some(c => c.includes("vencim"))) continue;
    mapa = {};
    Object.keys(claves).forEach(k => {
      const idx = f.findIndex(c => c && claves[k].some(a => c === a || c.replace(/[°º.]/g, "") === a || c.startsWith(a)));
      if (idx >= 0) mapa[k] = idx;
    });
    if (mapa.importeOrigen != null && mapa.importe === mapa.importeOrigen) delete mapa.importe;
    // Los reportes CCO2200 no traen "Importe": el saldo sale de Debe - Haber.
    if (mapa.importe == null && mapa.debe == null && mapa.haber == null) continue;
    head = i;
    break;
  }
  if (head < 0) return [];
  const filasOk = [];
  const importeDe = f => mapa.importe != null
    ? num(f[mapa.importe])
    : num(f[mapa.debe]) - num(f[mapa.haber]);

  for (let i = head + 1; i < filas.length; i++) {
    const f = filas[i] || [];
    const fecha = iso(f[mapa.fecha]);
    const importe = importeDe(f);
    if (!fecha && !importe) continue;
    if (!fecha) break;
    filasOk.push({
      fecha,
      numFactura: String(f[mapa.numFactura] ?? "").trim(),
      vencimiento: iso(f[mapa.vencimiento]),
      importe,
      importeOrigen: num(f[mapa.importeOrigen]),
      condPago: String(f[mapa.condPago] ?? "").trim(),
      observacion: String(f[mapa.observacion] ?? "").trim(),
      comentario: String(f[mapa.comentario] ?? "").trim()
    });
  }
  return filasOk;
}
