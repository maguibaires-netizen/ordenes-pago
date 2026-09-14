import { useState } from "react";
import { Link } from "react-router-dom";
import { RotateCw } from "lucide-react";

export default function SheetEmbed({ titulo, icono, sheetId, minimal = true, actualizar, sinAchicar = false }) {
  const params = minimal ? "edit?usp=sharing&rm=minimal&widget=true" : "edit?usp=sharing";
  const src = `https://docs.google.com/spreadsheets/d/${sheetId}/${params}`;
  const openUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  const [actualizando, setActualizando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [updateSrc, setUpdateSrc] = useState(null);

  const handleActualizar = () => {
    const confirmado = window.confirm(actualizar.confirmMsg || "¿Segura que querés actualizar?");
    if (!confirmado) return;

    setActualizando(true);
    setMensaje("Actualizando…");

    const url = `${actualizar.url}?accion=actualizar&clave=${encodeURIComponent(actualizar.clave)}&_=${Date.now()}`;
    setUpdateSrc(url);

    setTimeout(() => {
      setUpdateSrc(null);
      setReloadKey((k) => k + 1);
      setMensaje("✅ Actualizado");
      setActualizando(false);
      setTimeout(() => setMensaje(""), 5000);
    }, 4000);
  };

  return (
    <>
      <Link className="back-link" to="/">← Volver al portal</Link>

      <div className="page-header">
        <div className="page-title">{titulo}</div>
        <div className="status-tag"><span className="status-dot"></span> Google Sheets · edición en vivo</div>
      </div>

      <div className="frame-card">
        <div className="frame-card-header">
          <div className="frame-card-header-left">
            <div className="frame-icon">{icono}</div>
            <div className="frame-card-header-title">Planilla compartida del equipo</div>
            {mensaje && <span style={{ fontSize: 12, color: "var(--muted)" }}>{mensaje}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {actualizar && (
              <button
                onClick={handleActualizar}
                disabled={actualizando}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, color: "#fff",
                  background: "var(--pink)", border: "none", borderRadius: 8,
                  padding: "6px 12px", cursor: actualizando ? "default" : "pointer",
                  opacity: actualizando ? 0.7 : 1,
                }}
              >
                <RotateCw size={13} className={actualizando ? "spin" : ""} />
                {actualizando ? "Actualizando…" : "Actualizar"}
              </button>
            )}
            <a className="frame-open-link" href={openUrl} target="_blank" rel="noreferrer">Abrir en Google Sheets ↗</a>
          </div>
        </div>
        <div className="embed-frame-wrapper">
          <iframe key={reloadKey} className={sinAchicar ? "embed-frame-full" : "embed-frame"} src={src} title={titulo}></iframe>
        </div>
      </div>

      {updateSrc && (
        <iframe src={updateSrc} title="actualizar" style={{ display: "none" }}></iframe>
      )}
    </>
  );
}
