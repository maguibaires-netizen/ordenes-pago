import { useState } from "react";
import { Link } from "react-router-dom";

const SHEET_ID = "1Q9OrTEFssifLk2OzsAvT7fbjfASAAqbB-5JapXCc3Fc";
const REPORTE_URL = "https://script.google.com/macros/s/AKfycbwJPJvDOEFwMyZgFc7SP7R9vrT2UggHAUnF_QFOQ0YQc45NqYZFcW9w58lyvYtaHqpr5A/exec";

export default function PedidosPendientes() {
  const [tab, setTab] = useState("planilla");

  const sheetSrc = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing&rm=minimal&widget=true`;
  const openUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

  return (
    <>
      <Link className="back-link" to="/">← Volver al portal</Link>

      <div className="page-header">
        <div className="page-title">Pedidos pendientes</div>
        <div className="status-tag"><span className="status-dot"></span> Google Sheets · edición en vivo</div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === "planilla" ? "active" : ""}`} onClick={() => setTab("planilla")}>
          Planilla
        </button>
        <button className={`tab-btn ${tab === "reporte" ? "active" : ""}`} onClick={() => setTab("reporte")}>
          Reporte
        </button>
      </div>

      <div className="frame-card">
        <div className="frame-card-header">
          <div className="frame-card-header-left">
            <div className="frame-icon">P</div>
            <div className="frame-card-header-title">
              {tab === "planilla" ? "Planilla compartida del equipo" : "Reporte diario de pedidos sin aprobar"}
            </div>
          </div>
          {tab === "planilla" && (
            <a className="frame-open-link" href={openUrl} target="_blank" rel="noreferrer">Abrir en Google Sheets ↗</a>
          )}
        </div>

        <div className="embed-frame-wrapper">
          {tab === "planilla" ? (
            <iframe className="embed-frame" src={sheetSrc} title="Pedidos pendientes"></iframe>
          ) : (
            <iframe className="embed-frame" src={REPORTE_URL} title="Reporte de pedidos pendientes"></iframe>
          )}
        </div>
      </div>
    </>
  );
}
