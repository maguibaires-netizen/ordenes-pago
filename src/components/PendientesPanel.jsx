import { useEffect, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { supermercados } from "../data/supermercados";
import { obtenerResumenPendientes } from "../lib/api";

const etiquetas = {
  Pendiente: "Pendiente",
  Generada: "Generada",
  Conciliada: "Conciliada",
  "CC incompleta": "CC incompleta",
  "Enviado a compras/cpag": "Enviado a compras/cpag",
};

function money(n) {
  return Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function claseEstado(estado) {
  const mapa = {
    Pendiente: "pendiente",
    Generada: "generada",
    Conciliada: "conciliada",
    "CC incompleta": "incompleta",
    "Enviado a compras/cpag": "compras",
  };
  return mapa[estado] || "";
}

function nombreDe(slug) {
  return supermercados.find((s) => s.slug === slug)?.nombre || slug;
}

function exportarCsv(grupos) {
  const rows = [["Supermercado", "Comprobante", "Estado", "Fecha", "Monto"]];
  grupos.forEach((g) => g.items.forEach((i) => rows.push([nombreDe(g.slug), i.comprobante, i.estado, i.fecha, i.importe])));
  const csv = rows.map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pendientes_ordenes_de_pago.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function PendientesPanel() {
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState("");
  const [abiertos, setAbiertos] = useState(() => new Set());

  useEffect(() => {
    obtenerResumenPendientes()
      .then(setGrupos)
      .catch((err) => setError(err.message));
  }, []);

  function toggle(slug) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <section>
      <div className="section-head">
        <h2>Pendientes por resolver</h2>
        <button className="btn" onClick={() => grupos && exportarCsv(grupos)} disabled={!grupos?.length}>
          <Download size={14} strokeWidth={1.8} />
          Exportar a Excel
        </button>
      </div>

      {error && <div className="ledger empty-state">{error}</div>}
      {!error && !grupos && <p className="hint">Cargando...</p>}
      {!error && grupos && grupos.length === 0 && (
        <div className="ledger empty-state">No hay nada pendiente por ahora 🎉</div>
      )}

      {!error && grupos && grupos.length > 0 && (
        <div className="ledger">
          <table>
            <thead>
              <tr>
                <th>Supermercado</th>
                <th>Cant. pendiente</th>
                <th style={{ textAlign: "right" }}>Monto pendiente</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const abierto = abiertos.has(g.slug);
                return (
                  <>
                    <tr key={g.slug} className="ledger-row-clickable" onClick={() => toggle(g.slug)}>
                      <td>{nombreDe(g.slug)}</td>
                      <td className="num">{g.cantidad}</td>
                      <td className="num">{money(g.monto)}</td>
                      <td>
                        <ChevronDown size={16} strokeWidth={2} className={`chev ${abierto ? "chev-open" : ""}`} />
                      </td>
                    </tr>
                    {abierto && (
                      <tr key={g.slug + "-detalle"} className="ledger-detail-row">
                        <td colSpan={4}>
                          <table className="sub-ledger">
                            <thead>
                              <tr>
                                <th>Comprobante</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th style={{ textAlign: "right" }}>Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.items.map((i, idx) => (
                                <tr key={idx}>
                                  <td>{i.comprobante}</td>
                                  <td>
                                    <span className={`chip ${claseEstado(i.estado)}`}>{etiquetas[i.estado] || i.estado || "—"}</span>
                                  </td>
                                  <td>{i.fecha}</td>
                                  <td className="num">{money(i.importe)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
