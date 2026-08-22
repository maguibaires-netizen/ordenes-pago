import { useEffect, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { supermercados } from "../data/supermercados";
import { obtenerResumenPendientes, actualizarCelda } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const ESTADOS = ["Pendiente", "Generada", "Conciliada", "CC incompleta", "Enviado a compras/cpag"];

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
  const rows = [["Supermercado", "Nº aviso", "Comprobante", "Categoría", "Estado", "Fecha", "Monto", "Notas"]];
  grupos.forEach((g) =>
    g.items.forEach((i) => rows.push([nombreDe(g.slug), i.nroAviso, i.comprobante, i.categoria, i.estado, i.fecha, i.importe, i.notas]))
  );
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
  const { esAdmin } = useAuth();
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState("");
  const [abiertos, setAbiertos] = useState(() => new Set());
  const [editando, setEditando] = useState(null); // `${slug}-${rowIndex}`

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

  async function cambiarEstado(slug, item, nuevoEstado) {
    setEditando(null);
    // se resolvió (ya no es Pendiente ni Enviado a compras/cpag) -> desaparece de la lista
    const sigueSiendoPendiente = nuevoEstado === "Pendiente" || nuevoEstado === "Enviado a compras/cpag";
    setGrupos((prev) =>
      prev
        .map((g) => {
          if (g.slug !== slug) return g;
          const items = sigueSiendoPendiente
            ? g.items.map((i) => (i.rowIndex === item.rowIndex ? { ...i, estado: nuevoEstado } : i))
            : g.items.filter((i) => i.rowIndex !== item.rowIndex);
          return { ...g, items, cantidad: items.length, monto: items.reduce((acc, i) => acc + i.importe, 0) };
        })
        .filter((g) => g.cantidad > 0)
    );
    try {
      await actualizarCelda(slug, item.rowIndex, "estado", nuevoEstado);
    } catch (err) {
      setError(err.message);
    }
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
                                <th>Nº de OP</th>
                                <th>Comprobante</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th style={{ textAlign: "right" }}>Monto</th>
                                <th>Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.items.map((i) => {
                                const key = `${g.slug}-${i.rowIndex}`;
                                return (
                                  <tr key={i.rowIndex}>
                                    <td className="mono">{i.nroAviso}</td>
                                    <td>{i.comprobante}</td>
                                    <td>{i.categoria}</td>
                                    <td className="estado-cell">
                                      {editando === key ? (
                                        <select
                                          autoFocus
                                          className="cell-input"
                                          defaultValue={i.estado}
                                          onChange={(e) => cambiarEstado(g.slug, i, e.target.value)}
                                          onBlur={() => setEditando(null)}
                                        >
                                          {ESTADOS.map((op) => <option key={op} value={op}>{op}</option>)}
                                        </select>
                                      ) : esAdmin ? (
                                        <button className="chip-btn" onClick={() => setEditando(key)}>
                                          <span className={`chip ${claseEstado(i.estado)}`}>{etiquetas[i.estado] || i.estado || "—"}</span>
                                          <ChevronDown size={12} />
                                        </button>
                                      ) : (
                                        <span className={`chip ${claseEstado(i.estado)}`}>{etiquetas[i.estado] || i.estado || "—"}</span>
                                      )}
                                    </td>
                                    <td>{i.fecha}</td>
                                    <td className="num">{money(i.importe)}</td>
                                    <td>{i.notas}</td>
                                  </tr>
                                );
                              })}
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
