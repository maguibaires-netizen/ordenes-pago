import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logoBaires } from "../data/logos";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/acuerdos", label: "Acuerdos" },
  { to: "/previsiones", label: "Previsiones" },
  { to: "/composicion-saldos", label: "Composición de saldos" },
];

export default function Topbar() {
  const location = useLocation();
  const { rol, salir } = useAuth();

  return (
    <div className="topbar">
      <Link to="/" className="wordmark">
        {logoBaires ? (
          <img src={logoBaires} alt="Baires" className="brand-logo" />
        ) : (
          <span className="wordmark-text">
            BAI<em>RES</em>
          </span>
        )}
      </Link>
      <nav className="top-nav">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={location.pathname === l.to ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="sesion-info">
        <span className="rol-badge">{rol === "admin" ? "Admin" : "Vendedor"}</span>
        <button className="salir-btn" onClick={salir} title="Cerrar sesión">
          <LogOut size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
