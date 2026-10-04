import { useState } from "react";
import { X, Paperclip, Check, AlertCircle } from "lucide-react";
import Dropzone from "./Dropzone";
import { armarItems } from "../lib/adjuntos";
import { subirComprobante } from "../lib/api";

function etiquetaFila(f) {
  const principal = f.comprobante || f.categoria;
  return `${principal} · ${f.categoria} · ${f.fecha || "s/fecha"} · OP ${f.nroAviso || "s/n"}${f.adjunto ? " · 📎" : ""}`;
}

export default function AdjuntarComprobantes({ slug, filas, onClose, onListo }) {
  const [items, setItems] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [terminado, setTerminado] = useState(false);

  // las más recientes primero, para encontrar rápido la que se busca
  const opciones = [...filas].sort((a, b) => b.rowIndex - a.rowIndex);

  function alElegirArchivos(archivos) {
    const pdfs = archivos.filter((f) => /\.pdf$/i.test(f.name));
    if (!pdfs.length) return;
    setItems(armarItems(pdfs, filas));
    setTerminado(false);
  }

  function cambiar(id, cambios) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
  }

  function elegirFila(id, valor) {
    const rowIndex = valor === "" ? "" : Number(valor);
    cambiar(id, { rowIndex, incluir: rowIndex !== "", aviso: "" });
  }

  const aSubir = (items || []).filter((it) => it.incluir && it.rowIndex !== "" && it.estado !== "ok");

  async function subirTodo() {
    setSubiendo(true);
    // de a uno: así el servidor no crea carpetas duplicadas ni se pasa del límite de tamaño
    for (const it of aSubir) {
      cambiar(it.id, { estado: "subiendo", error: "" });
      try {
        await subirComprobante(slug, it.rowIndex, it.file);
        cambiar(it.id, { estado: "ok" });
      } catch (err) {
        cambiar(it.id, { estado: "error", error: err.message });
      }
    }
    setSubiendo(false);
    setTerminado(true);
    onListo();
  }

  const subidos = (items || []).filter((it) => it.estado === "ok").length;
  const conError = (items || []).filter((it) => it.estado === "error").length;

  return (
    <div className="modal-fondo" onClick={subiendo ? undefined : onClose}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Paperclip size={16} strokeWidth={1.8} />
            <h3>Adjuntar comprobantes</h3>
          </div>
          <button className="chev-btn" onClick={onClose} disabled={subiendo} title="Cerrar">
            <X size={16} />
          </button>
        </div>

        {!items && (
          <>
            <p className="hint" style={{ margin: "0 0 12px" }}>
              Soltá los PDF que bajaste del portal del cliente. Los emparejo con las filas ya cargadas según el número que trae el nombre del archivo.
            </p>
            <Dropzone formatos={["PDF"]} onFiles={alElegirArchivos} />
          </>
        )}

        {items && (
          <>
            <div className="adj-lista">
              <table className="adj-tabla">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}></th>
                    <th>Archivo</th>
                    <th>Se adjunta a</th>
                    <th style={{ width: 96 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={it.incluir && it.rowIndex !== ""}
                          disabled={it.rowIndex === "" || subiendo || it.estado === "ok"}
                          onChange={(e) => cambiar(it.id, { incluir: e.target.checked })}
                        />
                      </td>
                      <td>
                        <div className="adj-nombre">{it.file.name}</div>
                        {it.aviso && <div className="adj-aviso">{it.aviso}</div>}
                        {it.error && <div className="adj-error">{it.error}</div>}
                      </td>
                      <td>
                        <select
                          className="cell-input adj-select"
                          value={it.rowIndex}
                          disabled={subiendo || it.estado === "ok"}
                          onChange={(e) => elegirFila(it.id, e.target.value)}
                        >
                          <option value="">— elegir fila —</option>
                          {opciones.map((f) => (
                            <option key={f.rowIndex} value={f.rowIndex}>{etiquetaFila(f)}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {it.estado === "subiendo" && <span className="hint">Subiendo…</span>}
                        {it.estado === "ok" && <span className="check-ok"><Check size={13} /> Listo</span>}
                        {it.estado === "error" && <span className="check-mal"><AlertCircle size={13} /> Error</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-pie">
              <span className="hint">
                {terminado
                  ? `${subidos} adjuntado${subidos === 1 ? "" : "s"}${conError ? ` · ${conError} con error` : ""}`
                  : `${aSubir.length} para subir · ${items.length - aSubir.length} sin asignar u omitidos`}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => setItems(null)} disabled={subiendo}>Elegir otros archivos</button>
                {terminado && !conError ? (
                  <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
                ) : (
                  <button className="btn btn-primary" onClick={subirTodo} disabled={subiendo || aSubir.length === 0}>
                    {subiendo ? "Subiendo…" : `Subir ${aSubir.length}`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
