import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { logoBaires } from "../data/logos";

export default function Login() {
  const { ingresar } = useAuth();
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await ingresar(clave);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={enviar}>
        {logoBaires ? (
          <img src={logoBaires} alt="Baires" className="login-logo" />
        ) : (
          <div className="wordmark-text">BAIRES</div>
        )}
        <div className="login-ic">
          <Lock size={18} strokeWidth={1.8} />
        </div>
        <h1>Órdenes de pago</h1>
        <p>Ingresá tu clave de acceso</p>
        <input
          type="password"
          autoFocus
          placeholder="Clave"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={cargando || !clave}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
