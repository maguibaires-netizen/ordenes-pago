import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, X, FileUp } from "lucide-react";

const SHEET_ID = "1ube6OatkqbmHRjhHbcC4Uz4QVNdOfR-i6sXLKUGaiTg";
const BUSCADOR_URL = "https://script.google.com/macros/s/AKfycby4VzmWdIc4lp_dXvNiHox0XApaL6Ifqt6BQmo9HMwH_IkD3v_OCWhCIOcIhyv9Mw-a/exec";
const CLAVE = "cobras-2026-retenciones";

export default function CargaRetenciones() {
  const [texto, setTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [updateSrc, setUpdateSrc] = useState(null);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [estadoSubida, setEstadoSubida] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const sheetSrc = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing&rm=minimal&widget=true`;
  const openUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  const disparar = (accion, extra) => {
    setBuscando(true);
    setMensaje(accion === "filtrar" ? "Filtrando…" : "Quitando filtro…");

    const url = `${BUSCADOR_URL}?accion=${accion}&clave=${encodeURIComponent(CLAVE)}${extra || ""}&_=${Date.now()}`;
    setUpdateSrc(url);

    setTimeout(() => {
      setUpdateSrc(null);
      setReloadKey((k) => k + 1);
      setMensaje(accion === "filtrar" ? "✅ Filtro aplicado" : "✅ Filtro quitado");
      setBuscando(false);
      setTimeout(() => setMensaje(""), 4000);
    }, 3000);
  };

  const handleFiltrar = () => {
    if (!texto.trim()) return;
    disparar("filtrar", `&texto=${encodeURIComponent(texto.trim())}`);
  };

  const handleQuitar = () => {
    setTexto("");
    disparar("quitarFiltro");
  };

  const subirArchivo = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setEstadoSubida("❌ Solo se aceptan PDF o imágenes");
      return;
    }

    setSubiendo(true);
    setEstadoSubida("Subiendo " + file.name + "…");

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/subir-retencion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          data: base64,
          clave: CLAVE,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setEstadoSubida("✅ Subido — procesando el texto en segundo plano");
      } else {
        setEstadoSubida("❌ " + (json.error || "No se pudo subir"));
      }
    } catch (err) {
      setEstadoSubida("❌ No se pudo conectar con el servidor");
    } finally {
      setSubiendo(false);
      setTimeout(() => setEstadoSubida(""), 6000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    subirArchivo(file);
  };

  return (
    <>
      {mostrarPanel ? (
        <button className="back-link" onClick={() => setMostrarPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          ← Volver a retenciones
        </button>
      ) : (
        <Link className="back-link" to="/">← Volver al portal</Link>
      )}

      <div className="page-header">
        <div className="page-title">Carga de retenciones</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="upload-btn" onClick={() => setMostrarPanel((v) => !v)}>
            <Upload size={13} />
            {mostrarPanel ? "Ocultar" : "Subir PDF"}
          </button>
          <div className="status-tag"><span className="status-dot"></span> Google Sheets · edición en vivo</div>
        </div>
      </div>

      {mostrarPanel && (
        <div className="upload-panel">
          <div className="upload-panel-header">
            <div className="upload-panel-title">Subir archivo de retención</div>
            <button className="upload-panel-close" onClick={() => setMostrarPanel(false)}>
              <X size={14} />
            </button>
          </div>

          <div
            className={`dropzone${dragOver ? " dragover" : ""}`}
            onClick={() => inputRef.current && inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileUp size={28} color="var(--muted)" style={{ margin: "0 auto 10px" }} />
            <div className="dropzone-title">Arrastrá el PDF acá, o hacé clic para elegirlo</div>
            <div className="dropzone-sub">Acepta PDF o imágenes (JPG, PNG)</div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              style={{ display: "none" }}
              onChange={(e) => subirArchivo(e.target.files && e.target.files[0])}
            />
          </div>

          {(subiendo || estadoSubida) && (
            <div className="dropzone-status">{estadoSubida || "Subiendo…"}</div>
          )}
        </div>
      )}

      <div className="embed-with-sidebar">
        <div className="frame-card">
          <div className="frame-card-header">
            <div className="frame-card-header-left">
              <div className="frame-icon">Rt</div>
              <div className="frame-card-header-title">Planilla compartida del equipo</div>
            </div>
            <a className="frame-open-link" href={openUrl} target="_blank" rel="noreferrer">Abrir en Google Sheets ↗</a>
          </div>
          <div className="embed-frame-wrapper">
            <iframe key={reloadKey} className="embed-frame-full" src={sheetSrc} title="Carga de retenciones"></iframe>
          </div>
        </div>

        <div className="search-sidebar">
          <div className="search-sidebar-title">Buscar cliente</div>
          <input
            className="search-input"
            type="text"
            placeholder="Nombre del cliente…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFiltrar()}
          />
          <button className="search-btn primary" onClick={handleFiltrar} disabled={buscando}>
            Filtrar
          </button>
          <button className="search-btn secondary" onClick={handleQuitar} disabled={buscando}>
            Quitar filtro
          </button>
          {mensaje && <div className="search-status">{mensaje}</div>}
        </div>
      </div>

      {updateSrc && (
        <iframe src={updateSrc} title="buscador-retenciones" style={{ display: "none" }}></iframe>
      )}
    </>
  );
}
