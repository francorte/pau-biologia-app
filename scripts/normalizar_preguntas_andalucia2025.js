/**
 * NORMALIZADOR DE PREGUNTAS PAU BIOLOGÍA
 * Convierte preguntas_raw.json → preguntas_app.json
 *
 * - Añade id estable
 * - Asigna bloque (si se puede inferir)
 * - Marca tipo de pregunta
 * - Calcula puntuación estimada
 * - Deja estructura lista para React
 */

import fs from "fs";
import path from "path";

// =======================
// RUTAS
// =======================

const INPUT_JSON = path.resolve("data/preguntas_raw.json");
const OUTPUT_JSON = path.resolve("app/src/data/preguntas_app.json");

// =======================
// UTILIDADES
// =======================

function cargarPreguntas() {
  if (!fs.existsSync(INPUT_JSON)) {
    throw new Error(`❌ No existe ${INPUT_JSON}`);
  }
  return JSON.parse(fs.readFileSync(INPUT_JSON, "utf8"));
}

function guardarResultado(preguntas) {
  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(preguntas, null, 2),
    "utf8"
  );
}

// =======================
// HEURÍSTICAS DE BLOQUE
// (simples pero efectivas)
// =======================

function inferirBloque(texto) {
  if (!texto) return "No especificado";

  const t = texto.toLowerCase();

  if (t.includes("adn") || t.includes("arn") || t.includes("gen")) {
    return "Genética molecular";
  }
  if (t.includes("proteína") || t.includes("aminoácido")) {
    return "Biomoléculas";
  }
  if (t.includes("mitocondria") || t.includes("ribosoma")) {
    return "Biología celular";
  }
  if (t.includes("fotosíntesis") || t.includes("respiración")) {
    return "Metabolismo";
  }

  return "No especificado";
}

// =======================
// PUNTUACIÓN
// =======================

function calcularPuntuacion(apartados) {
  if (!Array.isArray(apartados)) return 2;
  return Math.min(2, apartados.length * 0.4);
}

// =======================
// NORMALIZADOR
// =======================

function normalizar(preguntasRaw) {
  return preguntasRaw.map((p, index) => {
    const textoBase =
      (p.enunciado || "") +
      " " +
      (p.apartados || []).map(a => a.texto).join(" ");

    return {
      id: `PAU_AND_2025_${index + 1}`,
      origen: "PAU Andalucía 2025",
      tipo: "desarrollo",
      bloque: inferirBloque(textoBase),
      numero_original: p.numero ?? null,
      enunciado: p.enunciado ?? "",
      apartados: (p.apartados || []).map(a => ({
        letra: a.letra,
        texto: a.texto
      })),
      puntuacion: calcularPuntuacion(p.apartados),
      simulacro: false
    };
  });
}

// =======================
// EJECUCIÓN
// =======================

try {
  const preguntasRaw = cargarPreguntas();
  const preguntasApp = normalizar(preguntasRaw);

  guardarResultado(preguntasApp);

  console.log("✅ Normalización completada");
  console.log(`📊 Preguntas normalizadas: ${preguntasApp.length}`);
  console.log(`📄 Archivo generado: ${OUTPUT_JSON}`);

} catch (error) {
  console.error("❌ Error en el normalizador:");
  console.error(error.message);
  process.exit(1);
}