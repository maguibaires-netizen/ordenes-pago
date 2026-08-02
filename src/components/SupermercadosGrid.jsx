import { Link } from "react-router-dom";
import { supermercados, iniciales } from "../data/supermercados";

export default function SupermercadosGrid() {
  return (
    <section>
      <div className="section-head">
        <h2>Supermercados</h2>
        <span className="hint">{supermercados.length} cuentas</span>
      </div>
      <div className="super-grid">
        {supermercados.map((s) => (
          <div className="super-card" key={s.slug}>
            <div className="super-badge">{iniciales(s.nombre)}</div>
            <div className="super-name">{s.nombre}</div>
            <div className="super-actions">
              <Link to={`/super/${s.slug}/subir`}>
                <button>Subir OP</button>
              </Link>
              <Link to={`/super/${s.slug}`}>
                <button>Ver OP</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
