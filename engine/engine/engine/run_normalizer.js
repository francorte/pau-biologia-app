import fs from "fs";

const rawData = JSON.parse(
  fs.readFileSync("data/raw/andalucia_2016_ordinaria.json", "utf-8")
);

const preguntasNormalizadas = rawData.preguntas.map((p: any) => ({
  id: `PAU_${rawData.comunidad}_${rawData.anio}_P${p.numero}`,
  comunidad: rawData.comunidad,
  anio: rawData.anio,
  convocatoria: rawData.convocatoria,
  pregunta: p.numero,
  bloques: [p.bloque],
  tipo: p.obligatoria ? "obligatoria" : "optativa",
  competencial: true,
  enunciado: p.enunciado,
  apartados: p.apartados.map((a: any) => ({
    letra: a.letra,
    texto: a.texto,
    puntuacion: a.puntos,
    criterios: ""
  }))
}));

fs.writeFileSync(
  "data/normalized/andalucia_2016.json",
  JSON.stringify(preguntasNormalizadas, null, 2),
  "utf-8"
);

console.log("✔ Examen normalizado correctamente");