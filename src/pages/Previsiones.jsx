import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, RefreshCw, ChevronDown, ChevronRight, X, Search } from "lucide-react";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { logoDe } from "../data/logos";
import { supermercados } from "../data/supermercados";
import { obtenerFacturacion, guardarFacturacion } from "../lib/api";
import { money, normalizar } from "../lib/composicion-helpers";

const SUBPESTAÑAS = [
  { id: "facturacion", label: "Facturación" },
  { id: "evolucion", label: "Evolución" },
  { id: "acuerdos", label: "Acuerdos" },
  { id: "previsiones", label: "Previsiones" },
  { id: "controlNC", label: "Control NC" },
];

function nombreMes(periodo) {
  if (!periodo) return "";
  const [y, m] = periodo.split("-");
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${meses[Number(m) - 1]} ${y}`;
}

function nombreDe(slug) {
  return supermercados.find((s) => s.slug === slug)?.nombre || slug || "Sin identificar";
}

export default function Previsiones() {
  const [sub, setSub] = useState("facturacion");

  return (
    <div className="app-shell prev-shell">
      <Topbar />
      <div className="section-head" style={{ margin: "8px 0 4px" }}>
        <h2>Previsiones y acuerdos</h2>
      </div>
      <div className="tabs">
        {SUBPESTAÑAS.map((s) => (
          <button key={s.id} className={sub === s.id ? "active" : ""} onClick={() => setSub(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {sub === "facturacion" && <Facturacion />}
      {sub !== "facturacion" && (
        <div className="ledger empty-state">Esta subpestaña todavía no está configurada — próximamente.</div>
      )}
    </div>
  );
}

function Facturacion() {
  const { esAdmin } = useAuth();
  const fileRef = useRef(null);

  const [datos, setDatos] = useState(null); // { periodo, filas, sinIdentificar }
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [vista, setVista] = useState("A");
  const [abiertos, setAbiertos] = useState(() => new Set());
  const [sortPorSuper, setSortPorSuper] = useState({});
  const [modal, setModal] = useState(null); // "NC" | "ND" | null

  const [q, setQ] = useState("");
  const [fSuper, setFSuper] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  function cargar() {
    setError("");
    obtenerFacturacion()
      .then(setDatos)
      .catch((err) => setError(err.message));
  }

  useEffect(cargar, []);

  function limpiarFiltros() {
    setQ(""); setFSuper(""); setFMarca(""); setFTipo(""); setFDesde(""); setFHasta("");
  }

  async function subirExcel(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (datos?.filas?.length && !window.confirm(`Ya hay facturación cargada (${nombreMes(datos.periodo)}). ¿Reemplazarla con este archivo?`)) return;

    setCargando(true);
    setMensaje("Leyendo el Excel...");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: null });
      setMensaje("Guardando...");
      const resultado = await guardarFacturacion({ aoa });
      setDatos(resultado);
      setMensaje(`Cargado ${nombreMes(resultado.periodo)} · ${resultado.filas.length} líneas`);
    } catch (err) {
      setError(err.message);
      setMensaje("");
    } finally {
      setCargando(false);
    }
  }

  async function leerDeHoja() {
    if (datos?.filas?.length && !window.confirm(`Ya hay facturación cargada (${nombreMes(datos.periodo)}). ¿Reemplazarla con lo que esté ahora en la hoja Facturación?`)) return;
    setCargando(true);
    setMensaje("Leyendo la hoja...");
    try {
      const resultado = await guardarFacturacion({ fuente: "hoja" });
      setDatos(resultado);
      setMensaje(`Cargado ${nombreMes(resultado.periodo)} · ${resultado.filas.length} líneas`);
    } catch (err) {
      setError(err.message);
      setMensaje("");
    } finally {
      setCargando(false);
    }
  }

  const filas = datos?.filas || [];

  const marcasUnicas = useMemo(() => [...new Set(filas.map((f) => f.marca))].sort(), [filas]);

  const filtradas = useMemo(() => {
    const qNorm = normalizar(q);
    return filas.filter((f) => {
      if (fSuper && f.superId !== fSuper) return false;
      if (fMarca && f.marca !== fMarca) return false;
      if (fTipo && f.tipo !== fTipo) return false;
      if (fDesde && f.fecha < fDesde) return false;
      if (fHasta && f.fecha > fHasta) return false;
      if (qNorm && !normalizar(f.articulo + " " + f.nombre + " " + f.comprobante).includes(qNorm)) return false;
      return true;
    });
  }, [filas, q, fSuper, fMarca, fTipo, fDesde, fHasta]);

  const kpis = useMemo(() => {
    const sum = (arr) => arr.reduce((s, f) => s + f.importe, 0);
    const facturas = filtradas.filter((f) => f.tipo === "Factura");
    const nc = filtradas.filter((f) => f.tipo === "NC");
    const nd = filtradas.filter((f) => f.tipo === "ND");
    return { neto: sum(filtradas), facturas: sum(facturas), nc, nd, sumNc: sum(nc), sumNd: sum(nd) };
  }, [filtradas]);

  const porSuperA = useMemo(() => {
    const grupos = {};
    for (const f of filtradas) {
      const key = f.superId || "sin-identificar";
      (grupos[key] ||= []).push(f);
    }
    return Object.entries(grupos)
      .map(([superId, lineas]) => ({
        superId,
        lineas,
        unidades: lineas.filter((l) => l.tipo === "Factura").reduce((s, l) => s + l.cantidad, 0),
        importe: lineas.reduce((s, l) => s + l.importe, 0),
      }))
      .sort((a, b) => b.importe - a.importe);
  }, [filtradas]);

  const porSuperB = useMemo(() => {
    return porSuperA.map((g) => {
      const totalSuper = g.lineas.reduce((s, l) => s + l.importe, 0);
      const marcas = {};
      for (const l of g.lineas) {
        const m = (marcas[l.marca] ||= { marca: l.marca, cantidad: 0, importe: 0 });
        if (l.tipo === "Factura") m.cantidad += l.cantidad;
        m.importe += l.importe;
      }
      const lista = Object.values(marcas)
        .map((m) => ({ ...m, pct: totalSuper ? m.importe / totalSuper : 0 }))
        .sort((a, b) => b.importe - a.importe);
      return { superId: g.superId, importe: g.importe, marcas: lista };
    });
  }, [porSuperA]);

  function toggle(id) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function ordenarPor(superId, key) {
    setSortPorSuper((prev) => {
      const actual = prev[superId];
      const dir = actual && actual.key === key ? -actual.dir : 1;
      return { ...prev, [superId]: { key, dir } };
    });
  }

  if (error) return (
    <div className="app-shell"><div className="ledger empty-state" style={{ marginTop: 16 }}>{error}</div></div>
  );

  return (
    <div>
      <div className="prev-mes-bloque">
        <div>
          <div className="comp-label">Facturación</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{datos?.periodo ? `Facturación de ${nombreMes(datos.periodo)}` : "Sin datos cargados"}</div>
          {mensaje && <div className="hint">{mensaje}</div>}
          {datos?.sinIdentificar?.length > 0 && (
            <div className="warn-text" style={{ marginTop: 6 }}>
              No reconocí estos clientes consolidadores: {datos.sinIdentificar.join(" · ")}
            </div>
          )}
        </div>
        {esAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <input ref={fileRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={subirExcel} />
            <button className="btn" onClick={leerDeHoja} disabled={cargando}>
              <RefreshCw size={14} strokeWidth={1.8} />
              Leer hoja Facturación
            </button>
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={cargando}>
              <Upload size={14} strokeWidth={1.8} />
              Subir Excel
            </button>
          </div>
        )}
      </div>

      {!datos ? (
        <p className="hint">Cargando...</p>
      ) : filas.length === 0 ? (
        <div className="ledger empty-state">
          {esAdmin ? "Todavía no se cargó la facturación de este mes." : "Todavía no se cargó la facturación de este mes — esperá a que el admin la suba."}
        </div>
      ) : (
        <>
          <div className="tabs" style={{ marginTop: 18 }}>
            <button className={vista === "A" ? "active" : ""} onClick={() => setVista("A")}>A · Artículos por super</button>
            <button className={vista === "B" ? "active" : ""} onClick={() => setVista("B")}>B · Marcas por super</button>
          </div>

          <div className="comp-kpis" style={{ marginBottom: 18 }}>
            <div className="comp-kpi">
              <div className="comp-label">Facturado neto</div>
              <div className="mono comp-kpi-v">{money(kpis.neto)}</div>
            </div>
            <div className="comp-kpi">
              <div className="comp-label">Facturas</div>
              <div className="mono comp-kpi-v">{money(kpis.facturas)}</div>
            </div>
            <button className="comp-kpi kpi-clickeable" onClick={() => kpis.nc.length && setModal("NC")}>
              <div className="comp-label">Notas de crédito</div>
              <div className="mono comp-kpi-v" style={{ color: "#b0433f" }}>{money(kpis.sumNc)}</div>
              <div className="comp-kpi-det">{kpis.nc.length} · ver detalle</div>
            </button>
            <button className="comp-kpi kpi-clickeable" onClick={() => kpis.nd.length && setModal("ND")}>
              <div className="comp-label">Notas de débito</div>
              <div className="mono comp-kpi-v" style={{ color: "#a06816" }}>{money(kpis.sumNd)}</div>
              <div className="comp-kpi-det">{kpis.nd.length} · ver detalle</div>
            </button>
          </div>

          <div className="comp-toolbar">
            <div className="search" style={{ maxWidth: 260 }}>
              <Search size={14} />
              <input placeholder="Buscar artículo o comprobante..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="filtro-select" value={fSuper} onChange={(e) => setFSuper(e.target.value)}>
              <option value="">Todos los supermercados</option>
              {porSuperA.map((g) => <option key={g.superId} value={g.superId}>{nombreDe(g.superId)}</option>)}
            </select>
            <select className="filtro-select" value={fMarca} onChange={(e) => setFMarca(e.target.value)}>
              <option value="">Todas las marcas</option>
              {marcasUnicas.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="filtro-select" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="Factura">Factura</option>
              <option value="NC">NC</option>
              <option value="ND">ND</option>
            </select>
            <input type="date" className="filtro-select" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
            <span className="hint">a</span>
            <input type="date" className="filtro-select" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
            <button className="btn" onClick={limpiarFiltros}>Limpiar</button>
          </div>

          {vista === "A"
            ? porSuperA.map((g) => (
                <BloqueSuperA
                  key={g.superId}
                  grupo={g}
                  abierto={abiertos.has(g.superId)}
                  onToggle={() => toggle(g.superId)}
                  sort={sortPorSuper[g.superId] || { key: "fecha", dir: 1 }}
                  onOrdenar={(key) => ordenarPor(g.superId, key)}
                />
              ))
            : porSuperB.map((g) => (
                <BloqueSuperB key={g.superId} grupo={g} abierto={abiertos.has(g.superId)} onToggle={() => toggle(g.superId)} />
              ))}
        </>
      )}

      {modal && (
        <ModalDetalle
          titulo={modal === "NC" ? "Notas de crédito" : "Notas de débito"}
          filas={modal === "NC" ? kpis.nc : kpis.nd}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const COLS_A = [
  { key: "fecha", label: "Fecha" },
  { key: "articulo", label: "Artículo" },
  { key: "nombre", label: "Nombre" },
  { key: "marca", label: "Marca" },
  { key: "tipo", label: "Tipo" },
  { key: "comprobante", label: "Comprobante" },
  { key: "cantidad", label: "Cant." },
  { key: "importe", label: "Importe" },
  { key: "observacion", label: "Observación" },
];

function BloqueSuperA({ grupo, abierto, onToggle, sort, onOrdenar }) {
  const logo = logoDe(grupo.superId === "sin-identificar" ? "" : grupo.superId);
  const lineasOrdenadas = useMemo(() => {
    const arr = [...grupo.lineas];
    arr.sort((a, b) => {
      const numerico = sort.key === "importe" || sort.key === "cantidad";
      const r = numerico ? (a[sort.key] || 0) - (b[sort.key] || 0) : String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), "es");
      return r * sort.dir;
    });
    return arr;
  }, [grupo.lineas, sort]);

  return (
    <div className="prev-bloque-super">
      <button className="prev-bloque-cabecera" onClick={onToggle}>
        <ChevronRight size={14} style={{ transform: abierto ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
        <div className="page-badge" style={{ width: 34, height: 34 }}>{logo && <img src={logo} alt="" />}</div>
        <span style={{ fontWeight: 600 }}>{nombreDe(grupo.superId)}</span>
        <span className="hint">{grupo.lineas.length} líneas</span>
        <span className="hint">{grupo.unidades.toLocaleString("es-AR")} unid.</span>
        <span className="mono" style={{ marginLeft: "auto", fontWeight: 500 }}>{money(grupo.importe)}</span>
      </button>
      {abierto && (
        <div className="comp-detalle-tabla-wrap" style={{ marginTop: 8 }}>
          <table className="comp-detalle-tabla">
            <thead>
              <tr>
                {COLS_A.map((c) => (
                  <th key={c.key} onClick={() => onOrdenar(c.key)} className={sort.key === c.key ? "activo" : ""} style={{ textAlign: c.key === "importe" || c.key === "cantidad" ? "right" : "left" }}>
                    {c.label}{sort.key === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineasOrdenadas.map((l, i) => (
                <tr key={i}>
                  <td>{l.fecha.split("-").reverse().join("/")}</td>
                  <td className="mono">{l.articulo}</td>
                  <td>{l.nombre}</td>
                  <td>{l.marca}</td>
                  <td><span className={`chip ${l.tipo === "Factura" ? "generada" : l.tipo === "NC" ? "pendiente" : "incompleta"}`}>{l.tipo}</span></td>
                  <td className="mono">{l.comprobante}</td>
                  <td className="num">{l.cantidad.toLocaleString("es-AR")}</td>
                  <td className="num mono">{money(l.importe)}</td>
                  <td>{l.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BloqueSuperB({ grupo, abierto, onToggle }) {
  const logo = logoDe(grupo.superId === "sin-identificar" ? "" : grupo.superId);
  return (
    <div className="prev-bloque-super">
      <button className="prev-bloque-cabecera" onClick={onToggle}>
        <ChevronRight size={14} style={{ transform: abierto ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
        <div className="page-badge" style={{ width: 34, height: 34 }}>{logo && <img src={logo} alt="" />}</div>
        <span style={{ fontWeight: 600 }}>{nombreDe(grupo.superId)}</span>
        <span className="hint">{grupo.marcas.length} marcas</span>
        <span className="mono" style={{ marginLeft: "auto", fontWeight: 500 }}>{money(grupo.importe)}</span>
      </button>
      {abierto && (
        <div className="prev-marcas-lista">
          {grupo.marcas.map((m) => (
            <div key={m.marca} className="prev-marca-fila">
              <span className="prev-marca-nombre">{m.marca}</span>
              <span className="hint">{m.cantidad.toLocaleString("es-AR")} unid.</span>
              <span className="mono" style={{ width: 150, textAlign: "right" }}>{money(m.importe)}</span>
              <div className="prev-marca-barra-wrap">
                <div className="prev-marca-barra" style={{ width: `${Math.min(100, Math.abs(m.pct) * 100)}%` }} />
              </div>
              <span className="hint mono" style={{ width: 48, textAlign: "right" }}>{(m.pct * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalDetalle({ titulo, filas, onClose }) {
  const total = filas.reduce((s, f) => s + f.importe, 0);
  return (
    <div className="modal-fondo" onClick={onClose}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h3>{titulo}</h3>
          <button className="chev-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="adj-lista">
          <table className="adj-tabla">
            <thead>
              <tr>
                <th>Fecha</th><th>Super</th><th>Comprobante</th><th>Artículo</th><th style={{ textAlign: "right" }}>Importe</th><th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td>{f.fecha.split("-").reverse().join("/")}</td>
                  <td>{nombreDe(f.superId)}</td>
                  <td className="mono">{f.comprobante}</td>
                  <td>{f.nombre}</td>
                  <td className="num mono">{money(f.importe)}</td>
                  <td>{f.observacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-pie">
          <span className="hint">{filas.length} comprobantes</span>
          <span className="mono" style={{ fontWeight: 700 }}>{money(total)}</span>
        </div>
      </div>
    </div>
  );
}
