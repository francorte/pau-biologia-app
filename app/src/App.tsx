import { useEffect, useState } from "react"
import preguntas from "./data/preguntas_app.json"

type Pregunta = {
  id: string
  bloque?: string
  enunciado: string
  puntuacion?: number
  imagen?: string
}

export default function App() {
  const [indice, setIndice] = useState(0)
  const [lista, setLista] = useState<Pregunta[]>([])

  useEffect(() => {
    if (Array.isArray(preguntas)) {
      setLista(preguntas)
    }
  }, [])

  if (lista.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-lg">Cargando preguntas…</p>
      </div>
    )
  }

  const actual = lista[indice]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* CABECERA */}
      <header className="bg-green-900 text-white px-6 py-4">
        <h1 className="text-xl font-semibold">
          Simulacro PAU Biología · Andalucía 2025
        </h1>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-3xl mx-auto p-6">
        <div className="mb-4 flex justify-between items-center text-sm text-slate-600">
          <span>
            Pregunta {indice + 1} de {lista.length}
          </span>
          <span>
            {actual.puntuacion !== undefined
              ? `${actual.puntuacion.toFixed(1)} puntos`
              : ""}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <p className="text-sm text-green-700 font-medium">
            {actual.bloque ?? "Bloque no especificado"}
          </p>

          <p className="text-base leading-relaxed whitespace-pre-line">
            {actual.enunciado}
          </p>

          {/* IMAGEN (si existe) */}
          {actual.imagen && (
            <div className="mt-4">
              <img
                src={actual.imagen}
                alt="Figura de la pregunta"
                className="max-w-full rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex justify-between mt-6">
          <button
            disabled={indice === 0}
            onClick={() => setIndice(i => i - 1)}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-40"
          >
            ← Anterior
          </button>

          <button
            disabled={indice === lista.length - 1}
            onClick={() => setIndice(i => i + 1)}
            className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </main>
    </div>
  )
}