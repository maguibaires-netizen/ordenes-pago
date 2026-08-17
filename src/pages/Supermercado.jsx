import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Upload, Eye, Search, X, Check, FileSpreadsheet, ChevronDown } from "lucide-react";
import Topbar from "../components/Topbar";
import Dropzone from "../components/Dropzone";
import { supermercados } from "../data/supermercados";
import { logoDe } from "../data/logos";
import { PARSERS, ESTADOS } from "../parsers/registro";
import { guardarOrdenes, listarOrdenes, actualizarCelda } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  const { esAdmin } = useAuth();

  const [tab, setTab] = useState(esAdmin && !location.pathname.endsWith("/ver") ? "subir" : "ver");

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
        {esAdmin && (
          <button className={tab === "subir" ? "active" : ""} onClick={() => setTab("subir")}>
            <Upload size={14} strokeWidth={1.8} />
            Subir OP
          </button>
        )}
        <button className={tab === "ver" ? "active" : ""} onClick={() => setTab("ver")}>
          <Eye size={14} strokeWidth={1.8} />
          Ver OP cargadas
        </button>
      </div>

      {tab === "subir" && esAdmin ? (
        <PanelSubir slug={slug} parser={parser} />
      ) : (
        <PanelVer slug={slug} editable={esAdmin} />
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
      const { filas: filasParseadas, sinIdentificar: raro, nroAvisoDetectado } = await parser(archivos);
      setFilas(filasParseadas);
      setArchivosCargados(files.map((f) => f.name));
      setSinIdentificar(raro);
      setGuardado(false);
      if (nroAvisoDetectado) setNroAviso(nroAvisoDetectado);
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

  const sumaTotal = (filas || []).reduce((acc, f) => acc + (Number(f.importe) || 0), 0);

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
              <tfoot>
                <tr className="fila-total">
                  <td colSpan={4} style={{ textAlign: "right" }}>Suma total (debería dar $0)</td>
                  <td className="mono num">{money(sumaTotal)}</td>
                  <td>
                    {Math.abs(sumaTotal) < 0.01 ? (
                      <span className="check-ok"><Check size={13} /> Cierra</span>
                    ) : (
                      <span className="check-mal"><X size={13} /> No cierra</span>
                    )}
                  </td>
                </tr>
              </tfoot>
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

function parseFecha(str) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(str || "").trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

function agruparEnBloques(filas) {
  const bloques = [];
  let actual = null;
  filas.forEach((f) => {
    if (f.categoria === "Orden de pago" || !actual) {
      actual = [];
      bloques.push(actual);
    }
    actual.push(f);
  });
  return bloques;
}

function ordenarBloques(bloques) {
  const conAncla = bloques.map((bloque) => {
    const ancla = bloque.find((f) => f.categoria === "Orden de pago") || bloque[0];
    return { bloque, ancla, fecha: parseFecha(ancla.fecha) };
  });
  conAncla.sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return a.fecha - b.fecha;
  });
  return conAncla;
}

function ordenarPorBloques(filas) {
  return ordenarBloques(agruparEnBloques(filas)).flatMap((c) => c.bloque);
}

function PanelVer({ slug, editable }) {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [editando, setEditando] = useState(null); // `${rowIndex}-${campo}`
  const [abiertos, setAbiertos] = useState(() => new Set());

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

  async function guardarCampo(fila, campo, valor) {
    setFilas((prev) => prev.map((f) => (f.rowIndex === fila.rowIndex ? { ...f, [campo]: valor } : f)));
    setEditando(null);
    try {
      await actualizarCelda(slug, fila.rowIndex, campo, valor);
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleBloque(rowIndex) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      return next;
    });
  }

  const ordenadas = ordenarPorBloques(filas || []);
  const categoriasUnicas = [...new Set(ordenadas.map((f) => f.categoria).filter(Boolean))].sort();
  const hayFiltroActivo = Boolean(busqueda || filtroCategoria || filtroEstado);

  const filtradas = ordenadas.filter((f) => {
    const coincideBusqueda = `${f.comprobante} ${f.nroAviso}`.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = !filtroCategoria || f.categoria === filtroCategoria;
    const coincideEstado = !filtroEstado || f.estado === filtroEstado;
    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  const bloques = ordenarBloques(agruparEnBloques(filas || []));

  if (error) return <div className="ledger empty-state">{error}</div>;
  if (!filas) return <p className="hint">Cargando...</p>;

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <Search size={14} />
          <input placeholder="Buscar por comprobante o nº aviso..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="filtro-select" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filtro-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
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
            {hayFiltroActivo
              ? filtradas.map((f, i) => {
                  const nuevoBloque = i > 0 && f.categoria === "Orden de pago";
                  return (
                    <>
                      {nuevoBloque && (
                        <tr className="separador-op" key={`sep-${f.rowIndex}`}>
                          <td colSpan={7}></td>
                        </tr>
                      )}
                      <CeldaFila key={f.rowIndex} fila={f} editando={editando} setEditando={setEditando} guardarCampo={guardarCampo} editable={editable} />
                    </>
                  );
                })
              : bloques.map(({ bloque, ancla }, i) => {
                  const abierto = abiertos.has(ancla.rowIndex);
                  const resto = bloque.filter((f) => f.rowIndex !== ancla.rowIndex);
                  return (
                    <>
                      {i > 0 && (
                        <tr className="separador-op" key={`sep-${ancla.rowIndex}`}>
                          <td colSpan={7}></td>
                        </tr>
                      )}
                      <CeldaFila
                        key={ancla.rowIndex}
                        fila={ancla}
                        editando={editando}
                        setEditando={setEditando}
                        guardarCampo={guardarCampo}
                        editable={editable}
                        toggle={
                          resto.length > 0 && (
                            <button className="chev-btn" onClick={() => toggleBloque(ancla.rowIndex)}>
                              <ChevronDown size={14} className={abierto ? "chev-open" : ""} />
                            </button>
                          )
                        }
                      />
                      {abierto && resto.length > 0 && (
                        <tr className="ledger-detail-row" key={`det-${ancla.rowIndex}`}>
                          <td colSpan={7}>
                            <table className="sub-ledger-completo">
                              <tbody>
                                {resto.map((f) => (
                                  <CeldaFila key={f.rowIndex} fila={f} editando={editando} setEditando={setEditando} guardarCampo={guardarCampo} editable={editable} />
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
    </div>
  );
}

function CeldaFila({ fila, editando, setEditando, guardarCampo, toggle, editable = true }) {
  const f = fila;
  const key = (campo) => `${f.rowIndex}-${campo}`;

  function CeldaTexto({ campo, mono, alinearDerecha }) {
    const activo = editable && editando === key(campo);
    const [valor, setValor] = useState(f[campo]);
    if (activo) {
      return (
        <input
          autoFocus
          className={`cell-input ${mono ? "mono" : ""}`}
          style={alinearDerecha ? { textAlign: "right" } : undefined}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => guardarCampo(f, campo, valor)}
          onKeyDown={(e) => e.key === "Enter" && guardarCampo(f, campo, valor)}
        />
      );
    }
    return (
      <div
        className={`${editable ? "celda-editable" : ""} ${mono ? "mono" : ""}`}
        style={alinearDerecha ? { textAlign: "right" } : undefined}
        onClick={editable ? () => setEditando(key(campo)) : undefined}
      >
        {campo === "importe" ? money(f[campo]) : (f[campo] || (editable && <span className="vacio">completar</span>))}
      </div>
    );
  }

  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {toggle}
          <div style={{ flex: 1 }}><CeldaTexto campo="nroAviso" mono /></div>
        </div>
      </td>
      <td><CeldaTexto campo="comprobante" mono /></td>
      <td><CeldaTexto campo="categoria" /></td>
      <td className="estado-cell">
        {editable && editando === key("estado") ? (
          <select
            autoFocus
            className="cell-input"
            defaultValue={f.estado}
            onChange={(e) => guardarCampo(f, "estado", e.target.value)}
            onBlur={() => setEditando(null)}
          >
            <option value=""></option>
            {ESTADOS.map((op) => <option key={op} value={op}>{op}</option>)}
          </select>
        ) : editable ? (
          <button className="chip-btn" onClick={() => setEditando(key("estado"))}>
            <span className={`chip ${claseEstado(f.estado)}`}>{f.estado || "—"}</span>
            <ChevronDown size={12} />
          </button>
        ) : (
          <span className={`chip ${claseEstado(f.estado)}`}>{f.estado || "—"}</span>
        )}
      </td>
      <td><CeldaTexto campo="fecha" /></td>
      <td className="num"><CeldaTexto campo="importe" mono alinearDerecha /></td>
      <td><CeldaTexto campo="notas" /></td>
    </tr>
  );
}
