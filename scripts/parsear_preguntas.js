/**
 * PARSER ESTABLE DE PREGUNTAS PAU BIOLOGÍA
 * - Limpia texto de PDF
 * - Elimina instrucciones y ruido
 * - Extrae preguntas reales
 * - Separa enunciado y apartados
 * - Genera preguntas_raw.json
 *
 * Compatible con Node >= 18 (ESM)
 */

import fs from "fs";
import path from "path";

// =======================
// CONFIGURACIÓN
// =======================

const INPUT_TXT = path.resolve("data/texto_andalucia_2025.txt");
const OUTPUT_JSON = path.resolve("data/preguntas_raw.json");

// =======================
// UTILIDADES
// =======================

function leerTexto() {
  if (!fs.existsSync(INPUT_TXT)) {
    throw new Error(`❌ No existe el archivo: ${INPUT_TXT}`);
  }
  return fs.readFileSync(INPUT_TXT, "utf8");
}

function limpiarTexto(texto) {
  if (!texto || typeof texto !== "string") return "";

  return texto
    // normalización básica
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    // eliminar cabeceras e instrucciones típicas PAU
    .replace(/PRUEBA DE ACCESO A LA UNIVERSIDAD[\s\S]*?Instrucciones:/gi, "")
    .replace(/Instrucciones:[\s\S]*?(?=Pregunta\s+\d)/gi, "")
    .replace(/Duración:[\s\S]*?\n/gi, "")
    .replace(/De acuerdo con el RD[\s\S]*?\n/gi, "")
    .replace(/Este examen consta de[\s\S]*?\n/gi, "")
    .replace(/Los ejercicios del[\s\S]*?\n/gi, "")
    .replace(/En total se deben responder[\s\S]*?\n/gi, "")
    .replace(/EJERCICIO\s+\d+[\s\S]*?(?=Pregunta\s+\d)/gi, "")
    // limpieza final
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// =======================
// PARSER PRINCIPAL
// =======================

function parsearPreguntas(textoLimpio) {
  const preguntas = [];

  // dividir por "Pregunta X" manteniendo el número
  const bloques = textoLimpio.split(/Pregunta\s+(\d+(?:\.\d+)?)/i);

  for (let i = 1; i < bloques.length; i += 2) {
    const numero = bloques[i];
    const contenido = bloques[i + 1];

    if (!contenido || contenido.length < 30) continue;

    const texto = contenido.trim();

    // separar enunciado general y apartados
    const indicePrimerApartado = texto.search(/\b[a-e]\)\s+/i);

    let enunciado = "";
    let textoApartados = "";

    if (indicePrimerApartado !== -1) {
      enunciado = texto.slice(0, indicePrimerApartado).trim();
      textoApartados = texto.slice(indicePrimerApartado);
    } else {
      // pregunta sin apartados (rara pero posible)
      enunciado = texto;
      textoApartados = "";
    }

    // extraer apartados
    const apartados = [];
    const regexApartados = /([a-e])\)\s*([^a-e]*?)(?=(?:\b[a-e]\)\s)|$)/gis;

    let match;
    while ((match = regexApartados.exec(textoApartados)) !== null) {
      const letra = match[1].toLowerCase();
      const textoApartado = match[2].trim();

      if (textoApartado.length > 5) {
        apartados.push({
          letra,
          texto: textoApartado
        });
      }
    }

    // validación mínima
    if (!enunciado && apartados.length === 0) continue;

    preguntas.push({
      numero,
      enunciado: enunciado || null,
      apartados
    });
  }

  return preguntas;
}

// =======================
// EJECUCIÓN
// =======================

try {
  const textoOriginal = leerTexto();
  const textoLimpio = limpiarTexto(textoOriginal);
  const preguntas = parsearPreguntas(textoLimpio);

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(preguntas, null, 2),
    "utf8"
  );

  console.log("🧹 Texto limpio aplicado");
  console.log(`🔍 Preguntas detectadas: ${preguntas.length}`);
  console.log(`💾 Archivo generado: ${OUTPUT_JSON}`);

} catch (error) {
  console.error("❌ Error en el parser:");
  console.error(error.message);
  process.exit(1);
}