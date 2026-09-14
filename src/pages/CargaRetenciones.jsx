import { Link } from "react-router-dom";

export default function CargaRetenciones() {
  return (
    <>
      <Link className="back-link" to="/">← Volver al portal</Link>

      <div className="page-header">
        <div>
          <div className="page-title">Carga de retenciones</div>
          <div className="page-sub">App para procesar PDF de retenciones — todavía en desarrollo en otro proyecto.</div>
        </div>
        <div className="status-tag" style={{ background: "#EFEAEC", color: "var(--muted)" }}>A desarrollar</div>
      </div>

      <div className="placeholder-box">
        <div className="placeholder-title">Todavía no armamos esto 👀</div>
        <div className="placeholder-sub">
          Se está desarrollando en otra conversación aparte. Cuando esté lista, la conectamos acá
          (con un link o embebida, según cómo termine quedando armada).
        </div>
      </div>
    </>
  );
}
