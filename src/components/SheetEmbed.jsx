import { Link } from "react-router-dom";

export default function SheetEmbed({ titulo, icono, sheetId, minimal = true }) {
  const params = minimal ? "edit?usp=sharing&rm=minimal&widget=true" : "edit?usp=sharing";
  const src = `https://docs.google.com/spreadsheets/d/${sheetId}/${params}`;
  const openUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

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
          </div>
          <a className="frame-open-link" href={openUrl} target="_blank" rel="noreferrer">Abrir en Google Sheets ↗</a>
        </div>
        <div className="embed-frame-wrapper">
          <iframe className="embed-frame" src={src} title={titulo}></iframe>
        </div>
      </div>
    </>
  );
}
