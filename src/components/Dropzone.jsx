import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function Dropzone({ onFiles, formatos = ["XLSX"] }) {
  const inputRef = useRef(null);
  const [sobre, setSobre] = useState(false);

  function manejarArchivos(fileList) {
    const archivos = Array.from(fileList);
    if (archivos.length) onFiles(archivos);
  }

  return (
    <div
      className={`dropzone ${sobre ? "dropzone-sobre" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        manejarArchivos(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.pdf"
        style={{ display: "none" }}
        onChange={(e) => manejarArchivos(e.target.files)}
      />
      <div className="dropzone-ic">
        <UploadCloud size={22} strokeWidth={1.8} />
      </div>
      <h3>Arrastrá los archivos aquí</h3>
      <p>o hacé click para buscarlos en tu compu</p>
      <div className="dropzone-formatos">
        {formatos.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
    </div>
  );
}
