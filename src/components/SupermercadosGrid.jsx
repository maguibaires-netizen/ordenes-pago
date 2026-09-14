import { Link } from "react-router-dom";
import { Upload, Eye } from "lucide-react";
import { supermercados, iniciales } from "../data/supermercados";
import { logoDe } from "../data/logos";
import { useAuth } from "../context/AuthContext";

export default function SupermercadosGrid() {
  const { esAdmin } = useAuth();

  return (
    <section>
      <div className="section-head">
        <h2>Supermercados</h2>
        <span className="hint">{supermercados.length} cuentas</span>
      </div>
      <div className="super-grid">
        {supermercados.map((s) => {
          const logo = logoDe(s.slug);
          return (
            <div className="super-card" key={s.slug}>
              <div className="super-badge">
                {logo ? (
                  <img src={logo} alt={s.nombre} />
                ) : (
                  <span>{iniciales(s.nombre)}</span>
                )}
              </div>
              <div className="super-name">{s.nombre}</div>
              <div className="super-actions">
                {esAdmin && (
                  <Link to={`/super/${s.slug}/subir`}>
                    <button>
                      <Upload size={14} strokeWidth={1.8} />
                      Subir OP
                    </button>
                  </Link>
                )}
                <Link to={`/super/${s.slug}/ver`}>
                  <button>
                    <Eye size={14} strokeWidth={1.8} />
                    Ver OP
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
