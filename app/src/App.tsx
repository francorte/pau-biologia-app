import { useState } from "react";
import preguntas from "./data/preguntas_app.json";

type Apartado = {
  letra: string;
  texto: string;
  puntuacion?: number;
};

type Pregunta = {
  id: string;
  bloque: string;
  bloque_nombre: string;
  enunciado: string;
  apartados?: Apartado[];
};

type Bloque = {
  codigo: string;
  nombre: string;
  preguntas: Pregunta[];
};

function App() {
  // 1️⃣ Agrupar preguntas por bloque
  const bloquesMap: Record<string, Bloque> = {};

  (preguntas as Pregunta[]).forEach((p) => {
    if (!bloquesMap[p.bloque]) {
      bloquesMap[p.bloque] = {
        codigo: p.bloque,
        nombre: p.bloque_nombre,
        preguntas: [],
      };
    }
    bloquesMap[p.bloque].preguntas.push(p);
  });

  const bloques = Object.values(bloquesMap);

  // 2️⃣ Estado del simulacro
  const [indiceBloque, setIndiceBloque] = useState(0);
  const [seleccionadas, setSeleccionadas] = useState<Record<string, string>>({});

  const bloqueActual = bloques[indiceBloque];

  if (!bloqueActual) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Simulacro PAU Biología – Andalucía 2025</h1>
        <p>Simulacro finalizado.</p>
      </div>
    );
  }

  const preguntasBloque = bloqueActual.preguntas.slice(0, 2);
  const seleccion = seleccionadas[bloqueActual.codigo];

  function seleccionarPregunta(id: string) {
    if (seleccion) return;
    setSeleccionadas({
      ...seleccionadas,
      [bloqueActual.codigo]: id,
    });
  }

  function siguienteBloque() {
    if (!seleccion) return;
    setIndiceBloque(indiceBloque + 1);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Simulacro PAU Biología – Andalucía 2025</h1>

      <h2>
        Bloque {bloqueActual.codigo} · {bloqueActual.nombre}
      </h2>

      <p>
        <strong>
          Elige UNA de las dos preguntas (obligatorio para continuar)
        </strong>
      </p>

      {preguntasBloque.map((p, idx) => {
        const deshabilitada = seleccion && seleccion !== p.id;
        const elegida = seleccion === p.id;

        return (
          <div
            key={p.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1.5rem",
              opacity: deshabilitada ? 0.5 : 1,
              backgroundColor: elegida ? "#e6f7ff" : "white",
            }}
          >
            <h3>Pregunta {idx + 1}</h3>
            <p>{p.enunciado}</p>

            {p.apartados && p.apartados.length > 0 && (
              <ul>
                {p.apartados.map((a) => (
                  <li key={a.letra}>
                    <strong>{a.letra})</strong> {a.texto}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => seleccionarPregunta(p.id)}
              disabled={!!seleccion}
            >
              Elegir esta pregunta
            </button>
          </div>
        );
      })}

      <button
        onClick={siguienteBloque}
        disabled={!seleccion}
        style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
      >
        Siguiente bloque
      </button>
    </div>
  );
}

export default App;