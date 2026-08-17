import SheetEmbed from "../components/SheetEmbed.jsx";

// Reemplazá PEGAR_ID_ACA por el ID real del Sheet (mismo procedimiento de siempre).
const SHEET_ID = "1J7gdCPIQqZq2VYHxRXTgPQfxneAxmwHpJ78Ny0uqpQU";

export default function PendientesConciliar() {
  return (
    <SheetEmbed
      titulo="Pendientes de conciliar"
      icono="Co"
      sheetId={SHEET_ID}
    />
  );
}
