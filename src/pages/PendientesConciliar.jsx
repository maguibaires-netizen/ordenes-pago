import SheetEmbed from "../components/SheetEmbed.jsx";

const SHEET_ID = "1J7gdCPIQqZq2VYHxRXTgPQfxneAxmwHpJ78Ny0uqpQU";
const REPORTE_URL = "https://script.google.com/macros/s/AKfycbyv4Xl6-LGfwM_8tpzaMKaCoSPq1cYVVfPEusBn_R4fWaaMZnLoUujIzBgYEOhZJndr/exec";
const CLAVE_ACTUALIZAR = "cobras-2026-conciliar";

export default function PendientesConciliar() {
  return (
    <SheetEmbed
      titulo="Pendientes de conciliar"
      icono="Co"
      sheetId={SHEET_ID}
      actualizar={{
        url: REPORTE_URL,
        clave: CLAVE_ACTUALIZAR,
        confirmMsg: "¿Segura que querés actualizar? Esto vuelve a traer los datos desde \"mayor\" y reemplaza las columnas de Haber y Debe.",
      }}
    />
  );
}
