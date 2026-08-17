import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import CarteraClientes from "./pages/CarteraClientes.jsx";
import PedidosPendientes from "./pages/PedidosPendientes.jsx";
import ChequesRechazados from "./pages/ChequesRechazados.jsx";
import PendientesConciliar from "./pages/PendientesConciliar.jsx";
import Legajos from "./pages/Legajos.jsx";
import CargaRetenciones from "./pages/CargaRetenciones.jsx";

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cartera-clientes" element={<CarteraClientes />} />
          <Route path="/pedidos-pendientes" element={<PedidosPendientes />} />
          <Route path="/cheques-rechazados" element={<ChequesRechazados />} />
          <Route path="/pendientes-conciliar" element={<PendientesConciliar />} />
          <Route path="/legajos" element={<Legajos />} />
          <Route path="/carga-retenciones" element={<CargaRetenciones />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
