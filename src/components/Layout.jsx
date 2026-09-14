import { useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const FULL_HEIGHT_PATHS = ["/pedidos-pendientes", "/cheques-rechazados", "/pendientes-conciliar"];

export default function Layout({ children }) {
  const location = useLocation();
  const fullHeight = FULL_HEIGHT_PATHS.includes(location.pathname);

  return (
    <div className={`shell${fullHeight ? " shell-fixed" : ""}`}>
      <div className={`screen${fullHeight ? " screen-fixed" : ""}`}>
        <Navbar />
        {children}
      </div>
    </div>
  );
}
