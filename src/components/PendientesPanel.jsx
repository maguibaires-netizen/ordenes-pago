const ejemplo = [
  { super: "Cencosud S.A.", estado: "generada", cant: 6, monto: 19842301 },
  { super: "Carrefour", estado: "pendiente", cant: 2, monto: 54793421 },
  { super: "Coto Centro Integral de Comerc", estado: "incompleta", cant: 3, monto: 8210554 },
  { super: "La Anonima", estado: "compras", cant: 4, monto: 11930287 },
];

const etiquetas = {
  pendiente: "Pendiente",
  generada: "Generada",
  incompleta: "CC incompleta",
  compras: "Enviado a compras/cpag",
};

function money(n) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function exportarCsv() {
  const rows = [["Supermercado", "Estado", "Cantidad pendiente", "Monto pendiente"]];
  ejemplo.forEach((r) => rows.push([r.super, etiquetas[r.estado], r.cant, r.monto]));
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
  return (
    <section>
      <div className="section-head">
        <h2>Pendientes por resolver</h2>
        <button className="btn" onClick={exportarCsv}>
          Exportar a Excel
        </button>
      </div>
      <div className="ledger">
        <table>
          <thead>
            <tr>
              <th>Supermercado</th>
              <th>Estado</th>
              <th>Cant. pendiente</th>
              <th>Monto pendiente</th>
            </tr>
          </thead>
          <tbody>
            {ejemplo.map((r) => (
              <tr key={r.super}>
                <td>{r.super}</td>
                <td>
                  <span className={`chip ${r.estado}`}>{etiquetas[r.estado]}</span>
                </td>
                <td className="num">{r.cant}</td>
                <td className="num">{money(r.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
