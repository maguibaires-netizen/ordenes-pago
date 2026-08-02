import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Upload, Eye, Search, X, Check, FileSpreadsheet, ChevronDown } from "lucide-react";
import Topbar from "../components/Topbar";
import Dropzone from "../components/Dropzone";
import { supermercados } from "../data/supermercados";
import { logoDe } from "../data/logos";
import { PARSERS, ESTADOS } from "../parsers/registro";
import { guardarOrdenes, listarOrdenes, actualizarEstado } from "../lib/api";

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

function money(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return n ?? "";
  return num.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}

export default function Supermercado() {
  const { slug } = useParams();
  const s = supermercados.find((x) => x.slug === slug);
  const logo = logoDe(slug);
  const parser = PARSERS[slug];
  const location = useLocation();

  const [tab, setTab] = useState(location.pathname.endsWith("/ver") ? "ver" : "subir");

  return (
    <div className="app-shell">
      <Topbar />
      <div className="crumb">
        <Link to="/">← Supermercados</Link>
      </div>
      <div className="page-head">
        <div className="page-badge">{logo && <img src={logo} alt={s?.nombre} />}</div>
        <h1>{s ? s.nombre : slug}</h1>
      </div>

      <div className="tabs">
        <button className={tab === "subir" ? "active" : ""} onClick={() => setTab("subir")}>
          <Upload size={14} strokeWidth={1.8} />
          Subir OP
        </button>
        <button className={tab === "ver" ? "active" : ""} onClick={() => setTab("ver")}>
          <Eye size={14} strokeWidth={1.8} />
          Ver OP cargadas
        </button>
      </div>

      {tab === "subir" ? (
        <PanelSubir slug={slug} parser={parser} />
      ) : (
        <PanelVer slug={slug} />
      )}
    </div>
  );
}

// ---------------- Subir OP ----------------

function PanelSubir({ slug, parser }) {
  const [filas, setFilas] = useState(null);
  const [nroAviso, setNroAviso] = useState("");
  const [archivosCargados, setArchivosCargados] = useState([]);
  const [sinIdentificar, setSinIdentificar] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  async function manejarArchivos(files) {
    if (!parser) return;
    setProcesando(true);
    setError("");
    try {
      const archivos = await Promise.all(
        files.map(async (f) => ({ nombre: f.name, arrayBuffer: await f.arrayBuffer() }))
      );
      const { filas: filasParseadas, sinIdentificar: raro } = await parser(archivos);
      setFilas(filasParseadas);
      setArchivosCargados(files.map((f) => f.name));
      setSinIdentificar(raro);
      setGuardado(false);
    } catch (err) {
      console.error(err);
      setError("No se pudieron leer los archivos. Revisá que sean los correctos.");
    } finally {
      setProcesando(false);
    }
  }

  function actualizarFila(i, campo, valor) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  }

  function cancelar() {
    setFilas(null);
    setArchivosCargados([]);
    setSinIdentificar([]);
    setError("");
    setGuardado(false);
  }

  async function confirmar() {
    setGuardando(true);
    setError("");
    try {
      await guardarOrdenes(slug, filas.map((f) => ({ ...f, nroAviso })));
      setGuardado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!parser) {
    return (
      <div className="ledger empty-state">
        Todavía no configuramos la lectura automática para este supermercado.
      </div>
    );
  }

  return (
    <div>
      {!filas && <Dropzone formatos={["XLSX"]} onFiles={manejarArchivos} />}
      {procesando && <p className="hint" style={{ marginTop: 12 }}>Leyendo archivos...</p>}
      {error && <p className="error-text">{error}</p>}

      {filas && (
        <div className="review-card">
          <div className="review-head">
            <div className="file-ic">
              <FileSpreadsheet size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="file-name">{archivosCargados.length} archivo(s) leídos</div>
              <div className="file-sub">{archivosCargados.join(" · ")}</div>
            </div>
            {guardado ? (
              <div className="status status-ok">
                <Check size={14} /> Guardado en el Sheet
              </div>
            ) : (
              <div className="status">Revisá los datos antes de confirmar</div>
            )}
          </div>

          {sinIdentificar.length > 0 && (
            <p className="warn-text">
              No pude identificar: {sinIdentificar.join(", ")} — revisá que sean los 3 Excel del portal.
            </p>
          )}

          <div className="field" style={{ maxWidth: 220, marginBottom: 18 }}>
            <label>Nº aviso (orden de pago)</label>
            <input className="mono" value={nroAviso} onChange={(e) => setNroAviso(e.target.value)} placeholder="Ej: 0084073974" />
          </div>

          <div className="ledger" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Importe</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i}>
                    <td><input className="mono cell-input" value={f.comprobante} onChange={(e) => actualizarFila(i, "comprobante", e.target.value)} /></td>
                    <td><input className="cell-input" value={f.categoria} onChange={(e) => actualizarFila(i, "categoria", e.target.value)} /></td>
                    <td>
                      <select className="cell-input" value={f.estado} onChange={(e) => actualizarFila(i, "estado", e.target.value)}>
                        <option value=""></option>
                        {ESTADOS.map((op) => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </td>
                    <td><input className="cell-input" value={f.fecha} onChange={(e) => actualizarFila(i, "fecha", e.target.value)} /></td>
                    <td><input className="mono cell-input num-input" value={f.importe} onChange={(e) => actualizarFila(i, "importe", e.target.value)} /></td>
                    <td><input className="cell-input" value={f.notas} onChange={(e) => actualizarFila(i, "notas", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="review-actions">
            <button className="btn" onClick={cancelar}><X size={14} />Cancelar</button>
            <button className="btn btn-primary" onClick={confirmar} disabled={guardando || guardado}>
              <Check size={14} />
              {guardando ? "Guardando..." : guardado ? "Guardado" : "Confirmar carga"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Ver OP ----------------

function PanelVer({ slug }) {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    setError("");
    try {
      const data = await listarOrdenes(slug);
      setFilas(data);
    } catch (err) {
      setError(err.message);
    }
  }, [slug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(fila, nuevoEstado) {
    setFilas((prev) => prev.map((f) => (f.rowIndex === fila.rowIndex ? { ...f, estado: nuevoEstado } : f)));
    setEditando(null);
    try {
      await actualizarEstado(slug, fila.rowIndex, nuevoEstado);
    } catch (err) {
      setError(err.message);
    }
  }

  const filtradas = (filas || []).filter((f) =>
    `${f.comprobante} ${f.nroAviso}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (error) return <div className="ledger empty-state">{error}</div>;
  if (!filas) return <p className="hint">Cargando...</p>;

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <Search size={14} />
          <input placeholder="Buscar por comprobante o nº aviso..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>
      <div className="ledger">
        <table>
          <thead>
            <tr>
              <th>Nº aviso</th>
              <th>Comprobante</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right" }}>Importe</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => (
              <tr key={f.rowIndex}>
                <td>{f.nroAviso}</td>
                <td className="mono">{f.comprobante}</td>
                <td>{f.categoria}</td>
                <td className="estado-cell">
                  {editando === f.rowIndex ? (
                    <select
                      autoFocus
                      className="cell-input"
                      value={f.estado}
                      onChange={(e) => cambiarEstado(f, e.target.value)}
                      onBlur={() => setEditando(null)}
                    >
                      {ESTADOS.map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                  ) : (
                    <button className="chip-btn" onClick={() => setEditando(f.rowIndex)}>
                      <span className={`chip ${claseEstado(f.estado)}`}>{f.estado || "—"}</span>
                      <ChevronDown size={12} />
                    </button>
                  )}
                </td>
                <td>{f.fecha}</td>
                <td className="num">{money(f.importe)}</td>
                <td>{f.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
