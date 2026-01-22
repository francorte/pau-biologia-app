import fs from "fs";
import path from "path";

// Ruta del archivo de preguntas para la app
const INPUT_PATH = path.resolve(
  "app/src/data/preguntas_app.json"
);

// Leer preguntas
const preguntas = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

let marcadas = 0;

const preguntasActualizadas = preguntas.map((p) => {
  const enunciadoValido =
    typeof p.enunciado === "string" &&
    p.enunciado.trim().length > 30;

  if (enunciadoValido) {
    marcadas++;
    return {
      ...p,
      es_simulacro: true,
      modelo_referencia: "PAU Andalucía 2025"
    };
  }

  return {
    ...p,
    es_simulacro: false
  };
});

// Guardar archivo
fs.writeFileSync(
  INPUT_PATH,
  JSON.stringify(preguntasActualizadas, null, 2),
  "utf-8"
);

console.log("✅ Simulacro actualizado correctamente");
console.log(`📌 Preguntas marcadas para simulacro: ${marcadas}`);
console.log(`📄 Archivo: ${INPUT_PATH}`);