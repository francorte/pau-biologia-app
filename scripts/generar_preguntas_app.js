import fs from "fs";
import path from "path";

// Rutas
const DATA_PREGUNTAS = path.resolve("data/preguntas");
const OUTPUT = path.resolve("app/src/data/preguntas_app.json");

// Pregunta real PAU – Andalucía (Opción A, Ejercicio 2.1)
const preguntaProteinas = {
  id: "PAU_AND_2025_B_2_1",
  comunidad: "Andalucía",
  anio: 2025,
  convocatoria: "Titular",
  bloque: {
    codigo: "B",
    nombre: "Biomoléculas"
  },
  tipo: "desarrollo",
  es_simulacro: true,
  puntuacion_total: 2,
  enunciado: `EJERCICIO 2  
(2 preguntas, de las que debe responder, a su elección, SOLAMENTE UNA)

Pregunta 2.1 (2 puntos)

En relación con la imagen adjunta:

a) Indique qué biomolécula está representada. (0,1 puntos)

b) ¿Qué tipo de estructuras, de dicha biomolécula, representan los números del 1 al 5? (0,5 puntos)

c) Indique qué tipo de enlace representa el número 6 y entre qué grupos funcionales se establece. (0,3 puntos)

d) Indique tres tipos de enlaces que intervengan en la estabilización de la estructura representada con el número 4. (0,3 puntos)

e) Si esta biomolécula se somete a una temperatura superior a 100 ºC, ¿qué ocurrirá y qué consecuencia tendrá? (0,3 puntos)

f) Indique cinco localizaciones en una célula eucariota en las que se puedan encontrar las estructuras implicadas en la síntesis de esta biomolécula. (0,5 puntos)`,
  criterios_andalucia_2025: true,
  observaciones: "Pregunta clásica de estructura y propiedades de proteínas (PAU)."
};

// Leer preguntas previas si existen
let preguntas = [];
if (fs.existsSync(OUTPUT)) {
  preguntas = JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
}

// Evitar duplicados
const existe = preguntas.find(p => p.id === preguntaProteinas.id);
if (!existe) {
  preguntas.push(preguntaProteinas);
}

// Guardar archivo final
fs.writeFileSync(OUTPUT, JSON.stringify(preguntas, null, 2), "utf-8");

console.log("✔ Pregunta 2.1 añadida correctamente al simulacro");
console.log("📄 Archivo generado:", OUTPUT);
console.log("📊 Total preguntas simulacro:", preguntas.length);