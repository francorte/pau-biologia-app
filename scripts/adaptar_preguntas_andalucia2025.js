const fs = require("fs");
const path = require("path");

/**
 * Bloques oficiales Andalucía 2025
 */
const BLOQUES = {
  A: "Biomoléculas",
  B: "Genética molecular",
  C: "Biología celular",
  D: "Metabolismo",
  E: "Biotecnología",
  F: "Inmunología"
};

/**
 * Etiquetas iniciales por bloque (v1.0)
 */
const ETIQUETAS_POR_BLOQUE = {
  A: ["biomoléculas"],
  B: ["expresión génica"],
  C: ["biología celular"],
  D: ["metabolismo"],
  E: ["biotecnología"],
  F: ["inmunología"]
};

const INPUT_DIR = "data/normalized";
const OUTPUT_DIR = "data/preguntas";

// Crear carpeta de salida
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Leer archivos normalizados
const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith(".json"));

files.forEach(file => {
  const inputPath = path.join(INPUT_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);

  const questions = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const adapted = questions.map((q, index) => {
    const bloque = q.bloques[0];

    return {
      id: `PAU_BIO_${file.replace(".json", "").toUpperCase()}_${index + 1}`,

      bloque_oficial: {
        codigo: bloque,
        nombre: BLOQUES[bloque]
      },

      enunciado: q.enunciado,

      apartados: q.apartados.map(a => ({
        letra: a.letra,
        enunciado: a.texto,
        puntuacion_maxima: a.puntuacion
      })),

      puntuacion_total: 2,

      etiquetas: ETIQUETAS_POR_BLOQUE[bloque] || [],

      origen_historico: [
        {
          comunidad: q.comunidad,
          anio: q.anio,
          convocatoria: q.convocatoria
        }
      ],

      metadata: {
        nivel_exigencia: "razonada",
        tipo_respuesta: "abierta",
        observaciones: ""
      }
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(adapted, null, 2), "utf-8");
  console.log(`✔ Adaptado: ${file}`);
});

console.log("🎉 Preguntas adaptadas al modelo Andalucía 2025");