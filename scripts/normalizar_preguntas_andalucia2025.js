/**
 * normalizar_preguntas_andalucia2025.js
 * ------------------------------------
 * Convierte preguntas_raw.json en preguntas listas para la app
 */

import fs from "fs";
import path from "path";

// ==============================
// RUTAS
// ==============================
const INPUT = path.resolve("data/preguntas_raw.json");
const OUTPUT = path.resolve("app/src/data/preguntas_app.json");

// ==============================
// UTIL
// ==============================
function limpiarEnunciado(texto) {
  return texto
    .replace(/\s+/g, " ")
    .replace(/^\W+/, "")
    .trim();
}

// ==============================
// MAIN
// ==============================
if (!fs.existsSync(INPUT)) {
  console.error("❌ No existe:", INPUT);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const preguntas = raw.map((p, index) => ({
  id: p.id || `AND_2025_${index + 1}`,
  numero: index + 1,

  comunidad: "Andalucía",
  anio: 2025,

  bloque: p.bloque || "-",
  bloque_nombre: p.bloque_nombre || "No especificado",

  enunciado: limpiarEnunciado(p.enunciado),

  tipo: "desarrollo",
  valida_simulacro: true,

  origen: p.origen || {
    comunidad: "Andalucía",
    anio: 2025
  }
}));

// ==============================
// GUARDAR
// ==============================
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(preguntas, null, 2),
  "utf-8"
);

console.log("✅ Preguntas normalizadas correctamente");
console.log("📄 Archivo:", OUTPUT);
console.log("📊 Total preguntas:", preguntas.length);