import { useState, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  UploadCloud, CalendarClock, ChevronDown, ChevronRight, Search, RotateCcw, Wallet, AlertTriangle, Printer,
} from "lucide-react";

const COLORS = {
  ink: "#14213D",
  muted: "#64748B",
  surface: "#F4F6F8",
  border: "#E2E6EB",
  porVencer: "#3E6FD9",
  b0_30: "#3B8C6E",
  b30_60: "#D9A63E",
  b60_90: "#D9772E",
  b90plus: "#C1392B",
};

const BUCKET_LABELS = {
  porVencer: "A vencer",
  b0_30: "0–30 días",
  b30_60: "30–60 días",
  b60_90: "60–90 días",
  b90plus: "+90 días",
};

const BUCKET_ORDER = ["porVencer", "b0_30", "b30_60", "b60_90", "b90plus"];

const PERIODS = ["0–7 días", "8–15 días", "16–30 días", "+30 días"];

function periodFor(daysUntil) {
  if (daysUntil <= 7) return "0–7 días";
  if (daysUntil <= 15) return "8–15 días";
  if (daysUntil <= 30) return "16–30 días";
  return "+30 días";
}

function bucketFor(dias) {
  if (dias <= 0) return "porVencer";
  if (dias <= 30) return "b0_30";
  if (dias <= 60) return "b30_60";
  if (dias <= 90) return "b60_90";
  return "b90plus";
}

function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(n)).toLocaleString("es-AR");
}

function fmtDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR");
}

const selectStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.ink,
  background: "#fff",
};

const inputStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.ink,
  background: "#fff",
  width: 200,
};

function Kpi({ icon, label, value, sub, tint }) {
  return (
    <div className="print-card" style={{ flex: "1 1 200px", padding: 16, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
        {icon}
        <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: tint || COLORS.ink }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function CarteraClientes() {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [vendedor, setVendedor] = useState("Todos");
  const [unidad, setUnidad] = useState("Todas");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [asOf] = useState(new Date());

  const handleFile = useCallback((file) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        const clean = json
          .filter((r) => r.NroComp != null && r.Empresa && r.Empresa !== "Totales")
          .map((r) => {
            const vto = r.FechaVto ? new Date(r.FechaVto) : null;
            const dias = vto ? Math.round((asOf - vto) / 86400000) : 0;
            return {
              cliente: (r.Cliente || "Sin nombre").toString().trim(),
              vendedor: (r.Vendedor || "Sin asignar").toString().trim(),
              empresa: (r.Empresa || "-").toString().trim(),
              nroComp: r.NroComp,
              fechaEmi: r.FechaEmi,
              fechaVto: r.FechaVto,
              dias,
              bucket: bucketFor(dias),
              saldo: Number(r.Saldo) || 0,
            };
          });
        if (clean.length === 0) {
          setError("No se encontraron filas de detalle. Verificá que el Excel tenga las columnas Cliente, Vendedor, Empresa, NroComp, FechaEmi, FechaVto, Saldo.");
          return;
        }
        setRows(clean);
        setFileName(file.name);
      } catch (err) {
        setError("No pude leer el archivo. Confirmá que sea un .xlsx exportado con el mismo formato.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [asOf]);

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const vendedores = useMemo(() => (rows ? Array.from(new Set(rows.map((r) => r.vendedor))).sort() : []), [rows]);
  const unidades = useMemo(() => (rows ? Array.from(new Set(rows.map((r) => r.empresa))).sort() : []), [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter(
      (r) =>
        (vendedor === "Todos" || r.vendedor === vendedor) &&
        (unidad === "Todas" || r.empresa === unidad) &&
        (search.trim() === "" || r.cliente.toLowerCase().includes(search.trim().toLowerCase()))
    );
  }, [rows, vendedor, unidad, search]);

  const byCliente = useMemo(() => {
    const map = new Map();
    for (const r of filtered) {
      if (!map.has(r.cliente)) {
        map.set(r.cliente, {
          cliente: r.cliente, vendedor: r.vendedor, total: 0,
          porVencer: 0, b0_30: 0, b30_60: 0, b60_90: 0, b90plus: 0,
          invoices: [],
        });
      }
      const c = map.get(r.cliente);
      c.total += r.saldo;
      c[r.bucket] += r.saldo;
      c.invoices.push(r);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.saldo, 0);
    // Saldos < 1 (cero o a favor) no se consideran deuda vencida: son crédito pendiente de conciliar.
    const vencido = filtered.filter((r) => r.dias > 0 && r.saldo >= 1).reduce((s, r) => s + r.saldo, 0);
    const saldoAFavor = filtered.filter((r) => r.saldo < 1).reduce((s, r) => s + r.saldo, 0);
    const criticos = filtered.filter((r) => r.bucket === "b90plus" && r.saldo >= 1).reduce((s, r) => s + r.saldo, 0);
    const pctVencido = total !== 0 ? (vencido / total) * 100 : 0;
    return { total, vencido, saldoAFavor, criticos, pctVencido, clientes: byCliente.length };
  }, [filtered, byCliente]);

  const projection = useMemo(() => {
    const byPeriod = {};
    PERIODS.forEach((p) => (byPeriod[p] = { total: 0, clientes: new Map() }));
    for (const r of filtered) {
      if (r.dias > 0) continue;
      const daysUntil = -r.dias;
      const p = periodFor(daysUntil);
      byPeriod[p].total += r.saldo;
      byPeriod[p].clientes.set(r.cliente, (byPeriod[p].clientes.get(r.cliente) || 0) + r.saldo);
    }
    const result = {};
    PERIODS.forEach((p) => {
      result[p] = {
        total: byPeriod[p].total,
        clientes: Array.from(byPeriod[p].clientes.entries())
          .map(([cliente, monto]) => ({ cliente, monto }))
          .sort((a, b) => b.monto - a.monto),
      };
    });
    return result;
  }, [filtered]);

  // Antigüedad de deuda solo para clientes con saldo real pendiente (excluye saldos a favor/en cero).
  const chartData = byCliente
    .filter((c) => c.total > 1)
    .map((c) => ({
      name: c.cliente.length > 16 ? c.cliente.slice(0, 15) + "…" : c.cliente,
      ...c,
    }));

  const toggleExpand = (cliente) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cliente)) next.delete(cliente); else next.add(cliente);
      return next;
    });
  };

  const reset = () => {
    setRows(null); setFileName(""); setError("");
    setVendedor("Todos"); setUnidad("Todas"); setSearch("");
  };

  const handlePrint = () => {
    setExpanded(new Set(byCliente.map((c) => c.cliente)));
    setTimeout(() => window.print(), 150);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.ink, background: "#fff", minHeight: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        table.cartera-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${COLORS.muted}; padding: 8px 10px; border-bottom: 1px solid ${COLORS.border}; }
        table.cartera-table td { padding: 10px; border-bottom: 1px solid ${COLORS.border}; font-size: 13px; vertical-align: middle; }
        table.cartera-table tr:hover { background: ${COLORS.surface}; }

        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body, div { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-scroll { max-height: none !important; overflow: visible !important; }
          table.cartera-table tr { page-break-inside: avoid; }
          .print-card { break-inside: avoid; }
          .recharts-wrapper { break-inside: avoid; }
        }
      `}</style>

      <div className="display" style={{ padding: "24px 28px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: COLORS.muted, textTransform: "uppercase", marginBottom: 4 }}>
              Reporte semanal · Cartera de clientes
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>Vencimientos y antigüedad de deuda</div>
          </div>
          {rows && (
            <div className="mono" style={{ fontSize: 12, color: COLORS.muted, textAlign: "right" }}>
              {fileName}<br />Al {asOf.toLocaleDateString("es-AR")}
            </div>
          )}
        </div>
      </div>

      {!rows ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ margin: 40, padding: 48, border: `2px dashed ${COLORS.border}`, borderRadius: 12, textAlign: "center", background: COLORS.surface }}
        >
          <UploadCloud size={36} color={COLORS.muted} style={{ margin: "0 auto 12px" }} />
          <div className="display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Subí el Excel de cartera</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            Arrastrá el archivo acá, o elegilo manualmente. Columnas esperadas: Cliente, Vendedor, Empresa, NroComp, FechaEmi, FechaVto, Saldo.
          </div>
          <label style={{ display: "inline-block", padding: "10px 18px", background: COLORS.ink, color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            Elegir archivo
            <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
          </label>
          {error && <div style={{ marginTop: 16, color: COLORS.b90plus, fontSize: 13 }}>{error}</div>}
        </div>
      ) : (
        <div style={{ padding: 28 }}>
          {/* Filtros */}
          <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
            <select value={vendedor} onChange={(e) => setVendedor(e.target.value)} style={selectStyle}>
              <option>Todos</option>
              {vendedores.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={selectStyle}>
              <option>Todas</option>
              {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: COLORS.muted }} />
              <input placeholder="Buscar cliente…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 30 }} />
            </div>
            <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.ink}`, background: COLORS.ink, color: "#fff", fontSize: 13, cursor: "pointer" }}>
              <Printer size={13} /> Imprimir reporte
            </button>
            <button onClick={reset} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 13, cursor: "pointer", color: COLORS.muted }}>
              <RotateCcw size={13} /> Cargar otro archivo
            </button>
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <Kpi icon={<Wallet size={14} />} label="Total cartera" value={fmtMoney(kpis.total)} sub={`${kpis.clientes} clientes`} />
            <Kpi icon={<AlertTriangle size={14} />} label="Total vencido" value={fmtMoney(kpis.vencido)} sub={`${kpis.pctVencido.toFixed(1)}% de la cartera`} tint={COLORS.b60_90} />
            <Kpi icon={<AlertTriangle size={14} />} label="Crítico (+90 días)" value={fmtMoney(kpis.criticos)} sub="Requiere gestión prioritaria" tint={COLORS.b90plus} />
            <Kpi icon={<Wallet size={14} />} label="Saldo a favor / a cuenta" value={fmtMoney(Math.abs(kpis.saldoAFavor))} sub="Pendiente de conciliar" tint={COLORS.muted} />
            <Kpi icon={<CalendarClock size={14} />} label="A vencer 0–7 días" value={fmtMoney(projection["0–7 días"].total)} sub="Próxima semana" tint={COLORS.porVencer} />
          </div>

          {byCliente.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.muted, background: COLORS.surface, borderRadius: 12 }}>
              No hay clientes que coincidan con los filtros actuales.
            </div>
          ) : (
            <>
              {/* Gráfico */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div className="display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Saldo por cliente y antigüedad</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>{chartData.length} clientes con saldo pendiente real (excluye saldos a favor o en cero), en pesos</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11, fill: COLORS.muted }} />
                    <YAxis tickFormatter={(v) => fmtMoney(v)} tick={{ fontSize: 11, fill: COLORS.muted }} width={90} />
                    <Tooltip formatter={(v, name) => [fmtMoney(v), BUCKET_LABELS[name] || name]} labelStyle={{ fontWeight: 600 }} />
                    <Legend formatter={(v) => BUCKET_LABELS[v] || v} wrapperStyle={{ fontSize: 12 }} />
                    {BUCKET_ORDER.map((b) => (
                      <Bar key={b} dataKey={b} stackId="a" fill={COLORS[b]} name={b} radius={b === "b90plus" ? [3, 3, 0, 0] : 0} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Proyección de vencimientos */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div className="display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Proyección de próximos vencimientos</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {PERIODS.map((label) => {
                    const data = projection[label];
                    return (
                      <div key={label} className="print-card" style={{ flex: "1 1 200px", padding: 14, borderRadius: 10, background: COLORS.surface }}>
                        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
                        <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: COLORS.porVencer, marginBottom: 10 }}>{fmtMoney(data.total)}</div>
                        {data.clientes.length === 0 ? (
                          <div style={{ fontSize: 12, color: COLORS.muted }}>Sin vencimientos</div>
                        ) : (
                          <div className="print-scroll" style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                            {data.clientes.map((cl) => (
                              <div key={cl.cliente} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cl.cliente}</span>
                                <span className="mono" style={{ color: COLORS.muted, flexShrink: 0 }}>{fmtMoney(cl.monto)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabla detalle por cliente */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px 8px" }}>
                  <div className="display" style={{ fontSize: 14, fontWeight: 600 }}>Detalle por cliente</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                    Hacé clic en un cliente para ver sus comprobantes. Los colores de "Estado" indican el período de antigüedad de cada comprobante.
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10 }}>
                    {BUCKET_ORDER.map((b) => (
                      <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.muted }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[b], display: "inline-block" }} />
                        {BUCKET_LABELS[b]}
                      </div>
                    ))}
                  </div>
                </div>
                <table className="cartera-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Cliente</th>
                      <th>Vendedor</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCliente.map((c) => (
                      <>
                        <tr key={c.cliente} onClick={() => toggleExpand(c.cliente)} style={{ cursor: "pointer" }}>
                          <td style={{ width: 20, color: COLORS.muted }}>
                            {expanded.has(c.cliente) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td style={{ fontWeight: 500 }}>{c.cliente}</td>
                          <td style={{ color: COLORS.muted }}>{c.vendedor}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{fmtMoney(c.total)}</td>
                        </tr>
                        {expanded.has(c.cliente) && (
                          <tr key={c.cliente + "-detail"}>
                            <td></td>
                            <td colSpan={3} style={{ background: COLORS.surface, padding: 0 }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "left" }}>Unidad</th>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "left" }}>Comprobante</th>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "left" }}>Emisión</th>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "left" }}>Vencimiento</th>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "left" }}>Estado</th>
                                    <th style={{ padding: "6px 10px", fontSize: 10, color: COLORS.muted, textAlign: "right" }}>Saldo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.invoices.map((inv, i) => (
                                    <tr key={i}>
                                      <td className="mono" style={{ padding: "6px 10px", fontSize: 12 }}>{inv.empresa}</td>
                                      <td className="mono" style={{ padding: "6px 10px", fontSize: 12 }}>{inv.nroComp}</td>
                                      <td className="mono" style={{ padding: "6px 10px", fontSize: 12 }}>{fmtDate(inv.fechaEmi)}</td>
                                      <td className="mono" style={{ padding: "6px 10px", fontSize: 12 }}>{fmtDate(inv.fechaVto)}</td>
                                      <td style={{ padding: "6px 10px", fontSize: 12 }}>
                                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, background: COLORS[inv.bucket] + "22", color: COLORS[inv.bucket], fontWeight: 600 }}>
                                          {BUCKET_LABELS[inv.bucket]}
                                        </span>
                                      </td>
                                      <td className="mono" style={{ padding: "6px 10px", fontSize: 12, textAlign: "right" }}>{fmtMoney(inv.saldo)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
