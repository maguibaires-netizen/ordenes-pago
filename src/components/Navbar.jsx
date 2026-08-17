import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="navbar">
      <Link className="logo" to="/">
        cobranzas<span style={{ color: "var(--pink)" }}>.</span>
      </Link>
      <div className="navtags">
        <div className="tag tag-green">Créditos y Cobranzas</div>
        <div className="tag tag-yellow">Equipo</div>
      </div>
    </div>
  );
}
