import fs from "fs";

/**
 * Normaliza un examen PAU desde data/raw a data/normalized
 */
export function normalizarExamen(inputPath, outputPath) {
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const preguntasNormalizadas = rawData.preguntas.map(p => ({
    id: `PAU_${rawData.comunidad}_${rawData.anio}_P${p.numero}`,
    comunidad: rawData.comunidad,
    anio: rawData.anio,
    convocatoria: rawData.convocatoria,
    pregunta: p.numero,
    bloques: [p.bloque],
    tipo: p.obligatoria ? "obligatoria" : "optativa",
    competencial: true,
    enunciado: p.enunciado,
    apartados: p.apartados.map(a => ({
      letra: a.letra,
      texto: a.texto,
      puntuacion: a.puntos,
      criterios: ""
    }))
  }));

  fs.writeFileSync(
    outputPath,
    JSON.stringify(preguntasNormalizadas, null, 2),
    "utf-8"
  );
}