// scripts/parsear_preguntas.js
import fs from "fs";
import path from "path";

const INPUT_TXT = "data/texto_andalucia_2025.txt";
const OUTPUT_JSON = "data/preguntas_raw.json";

// ---------- UTILIDADES ----------
const limpiar = (t) => {
  if (!t || typeof t !== "string") return "";
  return t
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
};

// ---------- VALIDACIÓN ----------
if (!fs.existsSync(INPUT_TXT)) {
  console.error("❌ No existe el archivo:", INPUT_TXT);
  process.exit(1);
}

const texto = fs.readFileSync(INPUT_TXT, "utf-8");

// ---------- DIVISIÓN POR PREGUNTAS ----------
// ⚠️ IMPORTANTE: sin grupos capturadores
const bloques = texto
  .split(/Pregunta\s+\d+(?:\.\d+)?/i)
  .slice(1)
  .map(b => limpiar(b))
  .filter(b => b.length > 80);

let preguntas = [];
let contador = 1;

// ---------- PARSEO ----------
for (const bloque of bloques) {
  if (!bloque) continue;

  // Detectar apartados a), b), c)...
  const partes = bloque.split(/\s([a-e])\)\s+/i);

  let enunciado = "";
  let apartados = [];

  if (partes.length > 1) {
    enunciado = limpiar(partes[0]);

    for (let i = 1; i < partes.length; i += 2) {
      apartados.push({
        letra: partes[i]?.toLowerCase() || "",
        texto: limpiar(partes[i + 1])
      });
    }
  } else {
    // Pregunta de desarrollo completa
    enunciado = limpiar(bloque);
  }

  if (enunciado.length < 40) continue;

  preguntas.push({
    id: `PAU_AND_2025_Q${contador}`,
    bloque: "No especificado",
    enunciado,
    apartados
  });

  contador++;
}

// ---------- GUARDAR ----------
fs.writeFileSync(
  OUTPUT_JSON,
  JSON.stringify(preguntas, null, 2),
  "utf-8"
);

// ---------- LOG ----------
console.log("✅ Preguntas reales extraídas correctamente");
console.log("📄 Archivo generado:", path.resolve(OUTPUT_JSON));
console.log("📊 Total preguntas válidas:", preguntas.length);