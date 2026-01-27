import { useState, useEffect } from 'react';
import './App.css';
import Home from './components/Home';
import BloqueView from './components/BloqueView';
import PreguntaView from './components/PreguntaView';

export default function App() {
  const [view, setView] = useState('home');
  const [selectedBloque, setSelectedBloque] = useState(null);
  const [selectedPregunta, setSelectedPregunta] = useState(null);
  const [examenes, setExamenes] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExamenes = async () => {
      try {
        const response = await fetch('/data/metadata.json');
        const data = await response.json();
        setExamenes(data.examenes || []);
      } catch (error) {
        console.error('Error cargando metadata:', error);
      }
    };
    loadExamenes();
  }, []);

  const loadPreguntas = async (archivoExamen) => {
    setLoading(true);
    try {
      const response = await fetch(`/data/examenes/${archivoExamen}`);
      const data = await response.json();
      setPreguntas(data);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBloque = (bloque) => {
    setSelectedBloque(bloque);
    setView('bloque');
  };

  const handleSelectPregunta = (pregunta) => {
    setSelectedPregunta(pregunta);
    setView('pregunta');
  };

  const handleBack = () => {
    if (view === 'pregunta') {
      setView('bloque');
    } else if (view === 'bloque') {
      setView('home');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Entrenamiento PAU Biología – Andalucía</h1>
        {view !== 'home' && (
          <button className="btn-back" onClick={handleBack}>
            ← Atrás
          </button>
        )}
      </header>

      <main className="app-main">
        {view === 'home' && (
          <Home 
            examenes={examenes}
            onSelectBloque={handleSelectBloque}
            onLoadPreguntas={loadPreguntas}
          />
        )}

        {view === 'bloque' && (
          <BloqueView 
            bloque={selectedBloque}
            preguntas={preguntas}
            loading={loading}
            onSelectPregunta={handleSelectPregunta}
          />
        )}

        {view === 'pregunta' && (
          <PreguntaView 
            pregunta={selectedPregunta}
          />
        )}
      </main>
    </div>
  );
}
