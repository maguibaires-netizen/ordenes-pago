import { Link } from "react-router-dom";
import { Wallet, ClipboardList, FolderOpen, Ban, Scale, Receipt } from "lucide-react";

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="hero-headline">Las <em>superpoderosas</em><br />de Baires.</div>
        <div className="hero-sub">Elegí con qué querés trabajar hoy — reportes, planillas y legajos, todo desde un solo lugar.</div>
        <div className="stamp">
          <div className="stamp-text">
            <div className="stamp-word">APROBADO</div>
            <div className="stamp-caption">COBRAS</div>
          </div>
        </div>
      </div>

      <div className="tools-title">Herramientas</div>
      <div className="tools-sub">Tocá una tarjeta para abrir esa herramienta</div>

      <div className="tools-grid">
        <Link className="tool-card" to="/pedidos-pendientes">
          <ClipboardList className="tool-icon-lg" color="var(--pink)" strokeWidth={1.75} />
          <div className="tool-name">Pedidos pendientes</div>
          <div className="tool-desc">Planilla de seguimiento + reporte diario por facturación, motivo, vendedor y cliente.</div>
          <div className="tool-status sheets">Google Sheets</div>
        </Link>

        <Link className="tool-card" to="/cartera-clientes">
          <Wallet className="tool-icon-lg" color="var(--pink)" strokeWidth={1.75} />
          <div className="tool-name">Reporte semanal · Cartera de clientes</div>
          <div className="tool-desc">Vencimientos y antigüedad de deuda, por vendedor.</div>
          <div className="tool-status live">Activo</div>
        </Link>

        <Link className="tool-card" to="/legajos">
          <FolderOpen className="tool-icon-lg" color="var(--muted)" strokeWidth={1.75} style={{ opacity: 0.6 }} />
          <div className="tool-name">Legajos de clientes con crédito</div>
          <div className="tool-desc">A desarrollar — pedido del jefe, todavía no existe.</div>
          <div className="tool-status soon">A desarrollar</div>
        </Link>

        <Link className="tool-card" to="/cheques-rechazados">
          <Ban className="tool-icon-lg" color="var(--lav-ink)" strokeWidth={1.75} />
          <div className="tool-name">Cheques rechazados</div>
          <div className="tool-desc">Registro de cheques rechazados por cliente.</div>
          <div className="tool-status sheets">Google Sheets</div>
        </Link>

        <Link className="tool-card" to="/pendientes-conciliar">
          <Scale className="tool-icon-lg" color="var(--lav-ink)" strokeWidth={1.75} />
          <div className="tool-name">Pendientes de conciliar</div>
          <div className="tool-desc">Cuentas con pagos o notas de crédito sin aplicar.</div>
          <div className="tool-status sheets">Google Sheets</div>
        </Link>

        <Link className="tool-card" to="/carga-retenciones">
          <Receipt className="tool-icon-lg" color="var(--muted)" strokeWidth={1.75} style={{ opacity: 0.6 }} />
          <div className="tool-name">Carga de retenciones</div>
          <div className="tool-desc">App para procesar PDF de retenciones — en desarrollo aparte.</div>
          <div className="tool-status soon">A desarrollar</div>
        </Link>
      </div>

      <div className="legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: "var(--green)" }}></span> Activo — app propia</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: "var(--lav-bg)", border: "1px solid var(--lav-ink)" }}></span> Enlace a Google Sheets</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: "#E7E1E5" }}></span> A desarrollar</div>
      </div>
    </>
  );
}

