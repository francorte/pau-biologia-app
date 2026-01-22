const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PDF_PATH = path.resolve("pdfs/andalucia_2025.pdf");
const OUTPUT_TXT = path.resolve("data/texto_andalucia_2025.txt");

try {
  if (!fs.existsSync(PDF_PATH)) {
    console.error("❌ No se encuentra el PDF:", PDF_PATH);
    process.exit(1);
  }

  fs.mkdirSync("data", { recursive: true });

  execSync(`pdftotext "${PDF_PATH}" "${OUTPUT_TXT}"`, {
    stdio: "inherit",
  });

  const stats = fs.statSync(OUTPUT_TXT);

  console.log("✅ Texto extraído correctamente");
  console.log("📄 Archivo generado:", OUTPUT_TXT);
  console.log("📊 Tamaño del archivo:", stats.size, "bytes");
} catch (error) {
  console.error("❌ Error al extraer texto del PDF");
  console.error(error.message);
}