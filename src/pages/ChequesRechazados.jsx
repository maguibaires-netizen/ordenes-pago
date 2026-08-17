import SheetEmbed from "../components/SheetEmbed.jsx";

// Reemplazá PEGAR_ID_ACA por el ID real del Sheet (mismo procedimiento de siempre).
const SHEET_ID = "1dmffz8dL2R9RCKCwL6IrepVNO7zFWzVa2C4b70ur6No";

export default function ChequesRechazados() {
  return (
    <SheetEmbed
      titulo="Cheques rechazados"
      icono="Ch"
      sheetId={SHEET_ID}
    />
  );
}
