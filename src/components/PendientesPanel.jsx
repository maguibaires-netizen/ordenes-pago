import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

const etiquetas = {
  pendiente: "Pendiente",
  generada: "Generada",
  incompleta: "CC incompleta",
  compras: "Enviado a compras/cpag",
};

// Ejemplo — cada supermercado con sus órdenes pendientes individuales.
const ejemplo = [
  {
    super: "Cencosud S.A.",
    items: [
      { comprobante: "255068556", estado: "generada", fecha: "28/5/2026", monto: 1045812.63 },
      { comprobante: "WJ X999800174729", estado: "generada", fecha: "7/6/2026", monto: 924552.14 },
      { comprobante: "WJ X999800175285", estado: "generada", fecha: "14/6/2026", monto: 1811082.37 },
    ],
  },
  {
    super: "Carrefour",
    items: [
      { comprobante: "00001U02968300", estado: "pendiente", fecha: "17/6/2026", monto: 21121.84 },
      { comprobante: "00001U02965970", estado: "pendiente", fecha: "22/6/2026", monto: 33851.58 },
    ],
  },
  {
    super: "Coto Centro Integral de Comerc",
    items: [
      { comprobante: "00026A00000177", estado: "incompleta", fecha: "8/4/2026", monto: 17461960.03 },
      { comprobante: "00026A00000178", estado: "incompleta", fecha: "8/4/2026", monto: 17461960.03 },
      { comprobante: "4444A00731295", estado: "compras", fecha: "3/7/2026", monto: 4328895.93 },
    ],
  },
  {
    super: "La Anonima",
    items: [
      { comprobante: "A002700000269", estado: "compras", fecha: "d/m/yyyy", monto: 112749.62 },
      { comprobante: "A043200282426", estado: "compras", fecha: "d/m/yyyy", monto: 418325.06 },
    ],
  },
];

function money(n) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function totalDe(items) {
  return items.reduce((acc, i) => acc + i.monto, 0);
}

function exportarCsv() {
  const rows = [["Supermercado", "Comprobante", "Estado", "Fecha", "Monto"]];
  ejemplo.forEach((g) =>
    g.items.forEach((i) => rows.push([g.super, i.comprobante, etiquetas[i.estado], i.fecha, i.monto]))
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
  const [abiertos, setAbiertos] = useState(() => new Set());

  function toggle(super_) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      next.has(super_) ? next.delete(super_) : next.add(super_);
      return next;
    });
  }

  return (
    <section>
      <div className="section-head">
        <h2>Pendientes por resolver</h2>
        <button className="btn" onClick={exportarCsv}>
          <Download size={14} strokeWidth={1.8} />
          Exportar a Excel
        </button>
      </div>
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
            {ejemplo.map((g) => {
              const abierto = abiertos.has(g.super);
              return (
                <>
                  <tr
                    key={g.super}
                    className="ledger-row-clickable"
                    onClick={() => toggle(g.super)}
                  >
                    <td>{g.super}</td>
                    <td className="num">{g.items.length}</td>
                    <td className="num">{money(totalDe(g.items))}</td>
                    <td>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`chev ${abierto ? "chev-open" : ""}`}
                      />
                    </td>
                  </tr>
                  {abierto && (
                    <tr key={g.super + "-detalle"} className="ledger-detail-row">
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
                            {g.items.map((i) => (
                              <tr key={i.comprobante}>
                                <td>{i.comprobante}</td>
                                <td>
                                  <span className={`chip ${i.estado}`}>{etiquetas[i.estado]}</span>
                                </td>
                                <td>{i.fecha}</td>
                                <td className="num">{money(i.monto)}</td>
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
    </section>
  );
}
