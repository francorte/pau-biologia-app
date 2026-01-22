import fs from "fs";
import path from "path";

// Rutas
const INPUT = path.resolve("data/preguntas_raw.json");
const OUTPUT = path.resolve("app/src/data/preguntas_pau_2025.json");

// Configuración fija
const COMUNIDAD = "Andalucía";
const ANIO = 2025;

// Cargar preguntas crudas
const raw = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const preguntasConvertidas = raw.map((p, index) => {
  const id = `PAU_BIO_AND_2025_${index + 1}`;

  return {
    id,
    comunidad: COMUNIDAD,
    anio: ANIO,
    convocatoria: "Ordinaria",
    numero: p.numero ?? index + 1,

    bloque: p.bloque ?? "No especificado",
    tipo: p.apartados && p.apartados.length > 1 ? "desarrollo" : "corta",

    enunciado: p.enunciado?.trim() || "",
    apartados: (p.apartados || []).map(a => ({
      letra: a.letra,
      texto: a.texto?.trim() || "",
      puntuacion: a.puntuacion ?? null
    })),

    puntuacion_total: (p.apartados || []).reduce(
      (acc, a) => acc + (a.puntuacion || 0),
      0
    ),

    criterios_andalucia_2025: true,
    es_simulacro: true,
    origen: {
      fuente: "PDF oficial",
      comunidad: COMUNIDAD,
      anio: ANIO
    }
  };
});

// Guardar resultado
fs.writeFileSync(
  OUTPUT,
  JSON.stringify(preguntasConvertidas, null, 2),
  "utf-8"
);

console.log("✅ Preguntas convertidas correctamente");
console.log(`📄 Archivo generado: ${OUTPUT}`);
console.log(`📊 Total preguntas: ${preguntasConvertidas.length}`);