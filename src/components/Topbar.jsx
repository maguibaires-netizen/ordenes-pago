import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/acuerdos", label: "Acuerdos" },
  { to: "/previsiones", label: "Previsiones" },
  { to: "/composicion-saldos", label: "Composición de saldos" },
];

export default function Topbar() {
  const location = useLocation();
  return (
    <div className="topbar">
      <Link to="/" className="wordmark">
        BAI<span>RES</span>
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
    </div>
  );
}
