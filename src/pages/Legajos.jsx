import { Link } from "react-router-dom";

export default function Legajos() {
  return (
    <>
      <Link className="back-link" to="/">← Volver al portal</Link>

      <div className="page-header">
        <div>
          <div className="page-title">Legajos de clientes con crédito</div>
          <div className="page-sub">A desarrollar — pedido del jefe, todavía no existe.</div>
        </div>
        <div className="status-tag" style={{ background: "#EFEAEC", color: "var(--muted)" }}>A desarrollar</div>
      </div>

      <div className="placeholder-box">
        <div className="placeholder-title">Todavía no armamos esto 👀</div>
        <div className="placeholder-sub">
          Cuando estés lista para encararlo, avisá y lo planeamos juntas: qué datos necesita cada legajo,
          de dónde salen, y cómo se va a ver.
        </div>
      </div>
    </>
  );
}
