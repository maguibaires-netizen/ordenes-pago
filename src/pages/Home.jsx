import Topbar from "../components/Topbar";
import PendientesPanel from "../components/PendientesPanel";
import SupermercadosGrid from "../components/SupermercadosGrid";

export default function Home() {
  return (
    <div className="app-shell">
      <Topbar />
      <PendientesPanel />
      <SupermercadosGrid />
    </div>
  );
}
