import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Supermercado from "./pages/Supermercado";
import ComposicionSaldos from "./pages/ComposicionSaldos";

export default function App() {
  const { rol } = useAuth();

  if (!rol) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/super/:slug" element={<Supermercado />} />
      <Route path="/super/:slug/subir" element={<Supermercado />} />
      <Route path="/super/:slug/ver" element={<Supermercado />} />
      <Route path="/composicion-saldos" element={<ComposicionSaldos />} />
    </Routes>
  );
}
