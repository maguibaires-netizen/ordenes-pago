import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Supermercado from "./pages/Supermercado";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/super/:slug" element={<Supermercado />} />
      <Route path="/super/:slug/subir" element={<Supermercado />} />
    </Routes>
  );
}
