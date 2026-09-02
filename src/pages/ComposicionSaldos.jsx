import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Download, ChevronRight } from "lucide-react";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { cuentas as cuentasBase, fechaCorte as fechaCorteDefault } from "../data/composicion-fichas";
import { logoDe } from "../data/logos";
import { obtenerComposicion, guardarComposicion, obtenerResumenPendientes } from "../lib/api";
import { leerXlsxComposicion } from "../lib/xlsx-composicion";
import {
  money,
  corto,
  fechaFmt,
  dias,
  normalizar,
  cuentaPorTexto,
  COLUMNAS_DETALLE,
  CONCEPTOS_ACUERDO,
} from "../lib/composicion-helpers";

const CLAVE_LOCAL = "composicion-saldos:ediciones";

export default function ComposicionSaldos() {
  const { esAdmin } = useAuth();
  const fileRef = useRef(null);

  const [comprobantesPorCuenta, setComprobantesPorCuenta] = useState({});
  const [acuerdosSheet, setAcuerdosSheet] = useState({});
  const [pendientesOP, setPendientesOP] = useState({});
  const [corte] = useState(fechaCorteDefault);
  const [estadoImport, setEstadoImport] = useState("Cargando...");
  const [error, setError] = useState("");

  const [ediciones, setEdiciones] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || "{}");
    } catch {
      return {};
    }
  });

  const [q, setQ] = useState("");
  const [solo, setSolo] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [orden, setOrden] = useState("lista");
  const [sortPorCuenta, setSortPorCuenta] = useState({});
  const [flipPorCuenta, setFlipPorCuenta] = useState({});
  const [detallePorCuenta, setDetallePorCuenta] = useState({});

  useEffect(() => {
    Promise.all([obtenerComposicion(), obtenerResumenPendientes().catch(() => [])])
      .then(([comp, resumen]) => {
        setComprobantesPorCuenta(comp.comprobantes || {});
        const acu = {};
        (comp.acuerdos || []).forEach((a) => {
          const n = normalizar(a.nombre);
          const cta = cuentasBase.find((c) => normalizar(c.nombre).startsWith(n) || n.startsWith(normalizar(c.id)));
          if (cta) acu[cta.id] = a;
        });
        setAcuerdosSheet(acu);
        setEstadoImport(comp.actualizado ? "Datos del Sheet · " + new Date(comp.actualizado).toLocaleString("es-AR") : "");
        const pend = {};
        (resumen || []).forEach((g) => {
          pend[g.slug] = { cantidad: g.cantidad, monto: g.monto };
        });
        setPendientesOP(pend);
      })
      .catch((err) => setError(err.message));
  }, []);

  function guardarEdicionesLocal(nuevas) {
    setEdiciones(nuevas);
    try {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(nuevas));
    } catch {
      /* si no hay espacio, se pierde solo la nota local */
    }
  }

  function filaKey(cuentaId, r, i) {
    return `${cuentaId}|${r.numFactura || ""}|${r.fecha || ""}|${i}`;
  }

  async function importarArchivos(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setEstadoImport(`Leyendo ${files.length} archivo${files.length === 1 ? "" : "s"}...`);
    const nuevo = { ...comprobantesPorCuenta };
    const cargadas = [];
    const sinReconocer = [];

    for (const file of files) {
      const base = file.name.replace(/\.xlsx$/i, "");
      let algo = false;
      let hojas = [];
      try {
        hojas = await leerXlsxComposicion(file);
      } catch {
        sinReconocer.push(base);
        continue;
      }
      for (const h of hojas) {
        const cta = cuentaPorTexto(cuentasBase, h.nombre) || (hojas.length === 1 ? cuentaPorTexto(cuentasBase, base) : null);
        if (!cta) continue;
        nuevo[cta.id] = h.comprobantes;
        cargadas.push(`${cta.nombre} (${h.comprobantes.length})`);
        algo = true;
      }
      if (!algo) sinReconocer.push(base);
    }

    if (cargadas.length) {
      setComprobantesPorCuenta(nuevo);
      let msg = "Importado " + new Date().toLocaleString("es-AR") + " · " + cargadas.join(", ");
      if (sinReconocer.length) msg += " · sin reconocer: " + sinReconocer.join(", ");
      setEstadoImport(msg);
      try {
        await guardarComposicion(nuevo);
      } catch (err) {
        setEstadoImport(err.message);
      }
    } else {
      setEstadoImport("No se reconoció ninguna cuenta en " + (sinReconocer.join(", ") || "los archivos") + ".");
    }
    e.target.value = "";
  }

  function exportarCsv(cuentasVisibles) {
    const head = ["Cuenta", "Fecha", "Dias emision", "N factura", "Vencimiento", "Dias vencido", "Importe", "Importe origen", "Cond. pago", "Observacion", "Comentario"];
    const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const lineas = [head.map(esc).join(";")];
    cuentasVisibles.forEach((c) =>
      c.filasCrudas.forEach((r) =>
        lineas.push(
          [c.nombre, fechaFmt(r.fecha), r.diasEmision, r.numFactura, fechaFmt(r.vencimiento), r.diasVencido, r.importe, r.importeOrigen, r.condPago, r.observacion, r.comentario]
            .map(esc)
            .join(";")
        )
      )
    );
    const blob = new Blob(["\ufeff" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "composicion-de-saldos.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const vista = useMemo(() => {
    const qNorm = q.trim().toLowerCase();

    const enrich = (r, cid, i) => {
      const k = filaKey(cid, r, i);
      const ed = ediciones[k];
      const importe = r.importe || 0;
      const esDebe = importe > 0; // Facturas y ND cargan en Debe (quedan positivas); NC/recibos/retenciones en Haber (negativas)
      return {
        ...r,
        _k: k,
        observacion: ed?.observacion != null ? ed.observacion : r.observacion,
        comentario: ed?.comentario != null ? ed.comentario : r.comentario,
        diasEmision: r.fecha ? dias(r.fecha, corte) : null,
        diasVencido: r.vencimiento ? dias(r.vencimiento, corte) : null,
        _esDebe: esDebe,
        _impagoVencido:
          Math.abs((r.importeOrigen || 0) - importe) <= 1 &&
          importe !== 0 &&
          (r.vencimiento ? dias(r.vencimiento, corte) > 0 : false),
        // sólo tiene sentido para comprobantes del Debe: si el importe quedó
        // distinto del importe de origen, es que ya se aplicó algo (pago,
        // retención, NC) y falta terminar de conciliar.
        _conDiferencia: esDebe && Math.abs((r.importeOrigen || 0) - importe) > 1,
      };
    };

    const saldoDe = (c) => (comprobantesPorCuenta[c.id] || []).reduce((s, r) => s + (r.importe || 0), 0);

    let visibles = cuentasBase.slice();
    if (solo) visibles = visibles.filter((c) => c.id === solo);
    if (orden === "saldo") visibles.sort((a, b) => saldoDe(b) - saldoDe(a));
    if (orden === "vencido") {
      const vencidoDe = (c) =>
        (comprobantesPorCuenta[c.id] || [])
          .map((r, i) => enrich(r, c.id, i))
          .filter((r) => r.diasVencido > 0)
          .reduce((s, r) => s + (r.importe || 0), 0);
      visibles.sort((a, b) => vencidoDe(b) - vencidoDe(a));
    }

    const cuentas = visibles.map((c) => {
      const all = (comprobantesPorCuenta[c.id] || []).map((r, i) => enrich(r, c.id, i));
      const saldo = all.reduce((s, r) => s + (r.importe || 0), 0);
      const venc = all.filter((r) => r.diasVencido > 0);
      const corr = all.filter((r) => !(r.diasVencido > 0));
      const impagos = all.filter((r) => r._esDebe && r._impagoVencido);
      const pendienteNC = all.filter((r) => r._conDiferencia);
      const sum = (rs) => rs.reduce((s, r) => s + (r.importe || 0), 0);
      const prox = corr.map((r) => r.vencimiento).filter(Boolean).sort()[0];
      const f = c.ficha || {};

      let filas = all.slice();
      if (filtro === "vencidos") filas = filas.filter((r) => r.diasVencido > 0);
      if (filtro === "corrientes") filas = filas.filter((r) => !(r.diasVencido > 0));
      if (filtro === "impagos") filas = filas.filter((r) => r._esDebe && r._impagoVencido);
      if (qNorm) filas = filas.filter((r) => ["numFactura", "observacion", "comentario", "condPago"].some((k) => String(r[k] ?? "").toLowerCase().includes(qNorm)));

      const sort = sortPorCuenta[c.id] || { key: "fecha", dir: 1 };
      const scol = COLUMNAS_DETALLE.find((k) => k.key === sort.key) || COLUMNAS_DETALLE[0];
      filas.sort((a, b) => {
        const numerico = scol.tipo === "money" || scol.tipo === "int";
        const r = numerico ? (a[sort.key] || 0) - (b[sort.key] || 0) : String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), "es");
        return r * sort.dir;
      });

      const desdeSheet = acuerdosSheet[c.id];
      const vals = desdeSheet ? desdeSheet.valores : f.acuerdos || {};
      const acuerdos = CONCEPTOS_ACUERDO.filter(([k]) => (vals[k] || "").trim()).map(([k, label]) => ({ key: k, label, v: vals[k] }));
      if (desdeSheet?.aporteMonto) acuerdos.push({ key: "aporte$", label: "Aporte adic. $", v: desdeSheet.aporteMonto });
      if (desdeSheet?.aportePorcentaje) acuerdos.push({ key: "aporte%", label: "Aporte adic. %", v: desdeSheet.aportePorcentaje });

      const op = pendientesOP[c.id] || { cantidad: 0, monto: 0 };

      return {
        ...c,
        saldo,
        filasCrudas: all,
        filas,
        all,
        prox,
        impagos,
        pendienteNC,
        venc,
        corr,
        sum,
        condPagos: [...new Set(all.map((r) => r.condPago).filter(Boolean))],
        acuerdos,
        codigoAcuerdo: desdeSheet?.codigo || f.codigoAcuerdo || "—",
        detalleAcuerdo: desdeSheet?.detalle || "",
        firmados: desdeSheet?.firmados || "sin acuerdo",
        op,
      };
    });

    const conDatos = cuentasBase.filter((c) => (comprobantesPorCuenta[c.id] || []).length).length;
    return {
      cuentas,
      resumen: `${cuentasBase.length} cuentas · ${conDatos} con saldo cargado`,
      totalCartera: money(cuentasBase.reduce((s, c) => s + saldoDe(c), 0)),
    };
  }, [comprobantesPorCuenta, acuerdosSheet, pendientesOP, ediciones, q, solo, filtro, orden, sortPorCuenta, corte]);

  function ordenarPor(cuentaId, key) {
    setSortPorCuenta((prev) => {
      const actual = prev[cuentaId];
      const dir = actual && actual.key === key ? -actual.dir : 1;
      return { ...prev, [cuentaId]: { key, dir } };
    });
  }

  function toggleFlip(cuentaId) {
    setFlipPorCuenta((prev) => ({ ...prev, [cuentaId]: !prev[cuentaId] }));
  }

  function toggleDetalle(cuentaId) {
    setDetallePorCuenta((prev) => ({ ...prev, [cuentaId]: !prev[cuentaId] }));
  }

  function editarCelda(filaK, campo, texto) {
    guardarEdicionesLocal({ ...ediciones, [filaK]: { ...ediciones[filaK], [campo]: texto === "—" ? "" : texto } });
  }

  if (error) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="ledger empty-state" style={{ marginTop: 24 }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="app-shell comp-shell">
      <Topbar />

      <div className="comp-layout">
        <aside className="comp-sidebar">
          <div className="comp-sidebar-titulo">Cuentas</div>
          {vista.cuentas.map((c) => {
            const logo = logoDe(c.id);
            return (
              <button
                key={c.id}
                className={`comp-sidebar-item ${solo === c.id ? "activo" : ""}`}
                onClick={() => document.getElementById(`cuenta-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {logo && <img src={logo} alt="" />}
                <span className={(comprobantesPorCuenta[c.id] || []).length ? "" : "comp-sin-datos"}>{c.nombre}</span>
                <span className="mono comp-saldo-corto">{corto(c.saldo)}</span>
              </button>
            );
          })}
          <div className="comp-sidebar-total">
            <div className="comp-sidebar-titulo">Saldo total</div>
            <div className="mono comp-total-monto">{vista.totalCartera}</div>
          </div>
        </aside>

        <main className="comp-main">
          <div className="section-head" style={{ margin: "0 0 4px" }}>
            <h2 style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              Composición de saldos <span className="hint" style={{ fontWeight: 400 }}>{vista.resumen}</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="hint">{estadoImport}</span>
              {esAdmin ? (
                <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                  <Upload size={14} strokeWidth={1.8} />
                  Importar Excel
                </button>
              ) : (
                <button className="btn" onClick={() => exportarCsv(vista.cuentas)}>
                  <Download size={14} strokeWidth={1.8} />
                  Exportar Excel
                </button>
              )}
              <input ref={fileRef} type="file" accept=".xlsx" multiple style={{ display: "none" }} onChange={importarArchivos} />
            </div>
          </div>

          <div className="comp-toolbar">
            <div className="search" style={{ maxWidth: 280 }}>
              <input placeholder="Buscar factura, observación..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="filtro-select" value={solo} onChange={(e) => setSolo(e.target.value)}>
              <option value="">Todas las cuentas</option>
              {cuentasBase.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select className="filtro-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="todos">Todos los comprobantes</option>
              <option value="vencidos">Sólo vencidos</option>
              <option value="corrientes">Sólo corrientes</option>
              <option value="impagos">Vencidos impagos</option>
            </select>
            <select className="filtro-select" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="lista">Orden de la app</option>
              <option value="saldo">Mayor saldo primero</option>
              <option value="vencido">Más vencido primero</option>
            </select>
            <span className="hint" style={{ marginLeft: "auto" }}>Corte {fechaFmt(corte)}</span>
          </div>

          {vista.cuentas.map((c) => (
            <CuentaCard
              key={c.id}
              c={c}
              esAdmin={esAdmin}
              corte={corte}
              flipped={!!flipPorCuenta[c.id]}
              abierto={!!detallePorCuenta[c.id]}
              onFlip={() => toggleFlip(c.id)}
              onToggleDetalle={() => toggleDetalle(c.id)}
              onOrdenar={(key) => ordenarPor(c.id, key)}
              sort={sortPorCuenta[c.id] || { key: "fecha", dir: 1 }}
              onEditar={editarCelda}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

function CuentaCard({ c, esAdmin, corte, flipped, abierto, onFlip, onToggleDetalle, onOrdenar, sort, onEditar }) {
  const logo = logoDe(c.id);
  const f = c.ficha || {};
  const tags = [];
  if (f.plazo) tags.push({ v: "Plazo " + f.plazo, clase: "" });
  if (c.venc.length) tags.push({ v: c.venc.length + " vencidos", clase: "tag-rojo" });
  if (!tags.length) tags.push({ v: "Ficha sin completar", clase: "tag-amarillo" });

  const tieneDatos = c.all.length > 0 && c.filas.length > 0;
  const vacia = c.all.length === 0;
  const sinResultados = c.all.length > 0 && c.filas.length === 0;

  return (
    <section id={`cuenta-${c.id}`} className="comp-card-wrap">
      <div className={`comp-card-flip ${flipped ? "flip" : ""}`}>
        <div className="comp-card comp-card-frente">
          <div className="comp-card-head">
            <div className="page-badge" style={{ width: 48, height: 48 }}>{logo && <img src={logo} alt={c.nombre} />}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{c.nombre}</h1>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tags.map((t, i) => <span key={i} className={`comp-tag ${t.clase}`}>{t.v}</span>)}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div className="comp-label">Saldo</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, whiteSpace: "nowrap" }}>{money(c.saldo)}</div>
              </div>
              <button className="btn" onClick={onFlip}>Ver ficha</button>
            </div>
          </div>

          <div className="comp-kpis">
            <div className="comp-kpi">
              <div className="comp-label">Comprobantes</div>
              <div className="mono comp-kpi-v">{c.filas.length === c.all.length ? c.all.length : `${c.filas.length} / ${c.all.length}`}</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Vencido s/ pagar</div>
              <div className="mono comp-kpi-v" style={{ color: "#b0433f" }}>{money(c.sum(c.impagos))}</div>
              <div className="comp-kpi-det">{c.impagos.length} comprobantes</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Vencido pend. de NC</div>
              <div className="mono comp-kpi-v" style={{ color: "#a06816" }}>{money(c.sum(c.venc.filter((r) => r._esDebe && !r._impagoVencido)))}</div>
              <div className="comp-kpi-det">{c.venc.filter((r) => r._esDebe && !r._impagoVencido).length} comprobantes</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Corriente</div>
              <div className="mono comp-kpi-v">{money(c.sum(c.corr))}</div>
              <div className="comp-kpi-det">{c.corr.length} comprobantes</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Próximo vto.</div>
              <div className="mono comp-kpi-v">{c.prox ? fechaFmt(c.prox) : "—"}</div>
              <div className="comp-kpi-det">{c.prox ? `en ${dias(corte, c.prox)} días` : ""}</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Pend. de NC</div>
              <div className="mono comp-kpi-v" style={{ color: "#a06816" }}>{money(c.sum(c.pendienteNC))}</div>
              <div className="comp-kpi-det">{c.pendienteNC.length} comprobantes</div>
            </div>
          </div>

          {tieneDatos && (
            <button className="comp-detalle-toggle" onClick={onToggleDetalle}>
              <ChevronRight size={14} className={abierto ? "chev-open" : ""} style={{ transform: abierto ? "rotate(90deg)" : "rotate(0deg)" }} />
              <span style={{ fontWeight: 600 }}>Detalle por comprobante</span>
              <span className="mono hint">{c.filas.length === c.all.length ? `${c.all.length} comprobantes` : `${c.filas.length} de ${c.all.length}`}</span>
              <span className="hint" style={{ marginLeft: "auto" }}>{abierto ? "Ocultar" : "Ver detalle"}</span>
            </button>
          )}

          {abierto && tieneDatos && (
            <DetalleTabla c={c} esAdmin={esAdmin} onOrdenar={onOrdenar} sort={sort} onEditar={onEditar} />
          )}

          {vacia && (
            <div className="comp-vacio">{esAdmin ? "Sin comprobantes cargados — usá Importar Excel para subir la pestaña de esta cuenta." : "Sin comprobantes cargados todavía."}</div>
          )}
          {sinResultados && <div className="comp-vacio">Ningún comprobante coincide con el filtro.</div>}
        </div>

        <div className="comp-card comp-card-dorso">
          <div className="comp-card-head" style={{ borderBottom: "1px solid var(--line-soft)", paddingBottom: 12 }}>
            <div className="page-badge" style={{ width: 48, height: 48 }}>{logo && <img src={logo} alt={c.nombre} />}</div>
            <div>
              <div className="comp-label">Ficha de cuenta</div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>{c.nombre}</h1>
            </div>
            <button className="btn" style={{ marginLeft: "auto" }} onClick={onFlip}>Volver a la tabla</button>
          </div>

          <div className="comp-ficha-grid">
            <div>
              <div className="comp-label" style={{ marginBottom: 8 }}>Acceso al portal</div>
              <table className="comp-ficha-tabla">
                <tbody>
                  {[
                    ["Portal", f.portalNombre || "—"],
                    ["Link", f.portalUrl || "—"],
                    ["OP Baires", f.opBaires || "—"],
                    ["Código proveedor", f.codigoProveedor || "—"],
                    ["CUIT", f.cuit || "—"],
                    ["Usuario", f.usuario || "—"],
                    ["Contraseña", f.contra || "—"],
                    ["Plazo de pago", f.plazo || "—"],
                  ].map(([label, v]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td className="mono">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {f.portalUrl && (
                <a href={f.portalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 8, display: "inline-flex" }}>
                  Abrir {f.portalNombre || "el portal"}
                </a>
              )}
            </div>

            <div>
              <div className="comp-label" style={{ marginBottom: 8 }}>Pendientes en Órdenes de pago</div>
              <div className="comp-op-box">
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--accent-ink)" }}>
                  {c.op.monto ? money(c.op.monto) : "Sin pendientes"}
                </div>
                <div className="hint">{c.op.cantidad ? `${c.op.cantidad} comprobantes pendientes` : "Nada pendiente en Órdenes de pago"}</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <div className="comp-label">Acuerdos · código {c.codigoAcuerdo}</div>
              <span className="hint">Se editan en la hoja Acuerdos web</span>
            </div>
            {c.acuerdos.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {c.acuerdos.map((a) => (
                  <div key={a.key} className="comp-acuerdo-chip">
                    <span className="comp-label" style={{ marginBottom: 0 }}>{a.label}</span>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{a.v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hint">Sin porcentajes cargados en la hoja Acuerdos web.</div>
            )}
            {c.detalleAcuerdo && <div className="hint" style={{ marginTop: 6 }}>{c.detalleAcuerdo} · {c.firmados}</div>}
          </div>

          <div className="hint" style={{ marginTop: "auto" }}>Datos de acceso — uso interno del equipo de Créditos y Cobranzas.</div>
        </div>
      </div>
    </section>
  );
}

function DetalleTabla({ c, esAdmin, onOrdenar, sort, onEditar }) {
  return (
    <div className="comp-detalle-tabla-wrap">
      <table className="comp-detalle-tabla">
        <thead>
          <tr>
            {COLUMNAS_DETALLE.map((col) => (
              <th key={col.key} onClick={() => onOrdenar(col.key)} style={{ textAlign: col.align }} className={sort.key === col.key ? "activo" : ""}>
                {col.label}{sort.key === col.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.filas.map((r) => (
            <tr key={r._k} className={r._conDiferencia ? "fila-dif" : ""}>
              {COLUMNAS_DETALLE.map((col) => {
                const raw = r[col.key];
                let v;
                if (col.tipo === "date") v = fechaFmt(raw);
                else if (col.tipo === "money") v = raw ? money(raw) : "—";
                else if (col.tipo === "int") v = raw == null ? "—" : String(raw);
                else v = raw === "" || raw == null ? "—" : String(raw);

                const editable = esAdmin && (col.key === "observacion" || col.key === "comentario");
                const vencidaCol = col.key === "diasVencido" && r.diasVencido > 0;
                const esDif = r._conDiferencia && (col.key === "importe" || col.key === "importeOrigen");

                return (
                  <td
                    key={col.key}
                    className={col.mono ? "mono" : ""}
                    style={{
                      textAlign: col.align,
                      whiteSpace: col.key === "comentario" ? "normal" : "nowrap",
                      background: vencidaCol ? "#fbecec" : esDif ? "rgba(224, 161, 58, 0.09)" : "transparent",
                      borderLeft: col.key === "importe" && r._conDiferencia ? "2px solid rgba(224, 161, 58, 0.55)" : "none",
                      color: vencidaCol ? "#b0433f" : col.key === "comentario" || col.key === "observacion" ? "var(--slate)" : "inherit",
                      fontWeight: vencidaCol ? 700 : col.key === "importe" ? 500 : 400,
                    }}
                  >
                    {editable ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onEditar(r._k, col.key, e.target.innerText.trim())}
                        className="comp-celda-editable"
                      >
                        {v}
                      </div>
                    ) : (
                      v
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            {COLUMNAS_DETALLE.map((col) => (
              <td key={col.key} className={col.key === "importe" || col.key === "importeOrigen" ? "mono" : ""} style={{ textAlign: col.align }}>
                {col.key === "importe" ? money(c.filas.reduce((s, r) => s + (r.importe || 0), 0))
                  : col.key === "importeOrigen" ? money(c.filas.reduce((s, r) => s + (r.importeOrigen || 0), 0))
                  : col.key === "fecha" ? "Totales" : ""}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      <div className="comp-leyenda">
        <span><span className="comp-swatch" style={{ background: "#fbecec", borderColor: "#edc9c7" }} /> Días vencido en positivo = comprobante vencido</span>
        <span><span className="comp-swatch" style={{ background: "#fdf1de", borderColor: "#e8cfa2" }} /> Importe igual al de origen y vencido — todavía sin pagar</span>
        <span style={{ marginLeft: "auto" }}>Condición de pago: {c.condPagos.length ? c.condPagos.join(" · ") : "—"}</span>
      </div>
    </div>
  );
}
