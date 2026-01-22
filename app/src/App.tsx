import { useEffect, useState } from "react";

type Bloque = "A" | "B" | "C" | "D" | "E" | "F";

type Pregunta = {
  id: string;
  enunciado: string;
  bloque_oficial: {
    codigo: Bloque;
    nombre: string;
  };
};

const NUM_PREGUNTAS_SIMULACRO = 6;

function mezclar<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function App() {
  const [todasPreguntas, setTodasPreguntas] = useState<Pregunta[]>([]);
  const [simulacro, setSimulacro] = useState<Pregunta[]>([]);
  const [indice, setIndice] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/andalucia_2016.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo cargar el JSON");
        }
        return res.json();
      })
      .then((data) => {
        const array = Array.isArray(data)
          ? data
          : Object.values(data);

        setTodasPreguntas(array as Pregunta[]);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const iniciarSimulacro = () => {
    const seleccion = mezclar(todasPreguntas).slice(
      0,
      NUM_PREGUNTAS_SIMULACRO
    );

    setSimulacro(seleccion);
    setIndice(0);
    setFinalizado(false);
  };

  const siguiente = () => {
    if (indice + 1 < simulacro.length) {
      setIndice(indice + 1);
    } else {
      setFinalizado(true);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Simulacro PAU Biología – Andalucía 2025</h1>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {todasPreguntas.length === 0 && !error && (
        <p>Cargando preguntas…</p>
      )}

      {todasPreguntas.length > 0 && simulacro.length === 0 && (
        <>
          <p>Total de preguntas disponibles: {todasPreguntas.length}</p>

          <button onClick={iniciarSimulacro}>
            Iniciar simulacro PAU Andalucía 2025
          </button>
        </>
      )}

      {simulacro.length > 0 && !finalizado && (
        <>
          <p>
            Pregunta {indice + 1} de {simulacro.length}
          </p>

          <p>
            <strong>
              Bloque {simulacro[indice].bloque_oficial.codigo} –{" "}
              {simulacro[indice].bloque_oficial.nombre}
            </strong>
          </p>

          <p>{simulacro[indice].enunciado}</p>

          <button onClick={siguiente}>Siguiente</button>
        </>
      )}

      {finalizado && (
        <>
          <h2>Simulacro finalizado</h2>
          <button onClick={() => setSimulacro([])}>
            Volver a empezar
          </button>
        </>
      )}
    </div>
  );
}

export default App;