import { useParams, Link } from "react-router-dom";
import Topbar from "../components/Topbar";
import { supermercados } from "../data/supermercados";

export default function Supermercado() {
  const { slug } = useParams();
  const s = supermercados.find((x) => x.slug === slug);

  return (
    <div className="app-shell">
      <Topbar />
      <div className="section-head">
        <h2>{s ? s.nombre : "Supermercado"}</h2>
        <Link to="/" className="hint">
          ← Volver
        </Link>
      </div>
      <div className="ledger" style={{ padding: "40px 16px", textAlign: "center", color: "var(--slate)" }}>
        Acá va la carga de órdenes de pago y la tabla de las ya cargadas para {s ? s.nombre : "este supermercado"}.
        <br />
        Todavía no la construimos — próximo paso.
      </div>
    </div>
  );
}
