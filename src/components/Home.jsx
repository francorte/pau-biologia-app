import { useEffect } from 'react';
import './Home.css';

const BLOQUES = [
  { codigo: 'A', nombre: 'Las biomoléculas' },
  { codigo: 'B', nombre: 'Genética molecular' },
  { codigo: 'C', nombre: 'Biología celular' },
  { codigo: 'D', nombre: 'Metabolismo' },
  { codigo: 'E', nombre: 'Biotecnología' },
  { codigo: 'F', nombre: 'Inmunología' }
];

export default function Home({ onSelectBloque, onLoadPreguntas }) {
  useEffect(() => {
    // Cargar todas las preguntas automáticamente
    onLoadPreguntas('examenes/andalucia/todas.json');
  }, [onLoadPreguntas]);

  const handleSelectBloque = (bloque) => {
    onSelectBloque(bloque);
  };

  return (
    <div className="home">
      <div className="intro">
        <p>Elige un bloque temático para comenzar el entrenamiento con preguntas reales de PAU</p>
      </div>

      <div className="bloques-grid">
        {BLOQUES.map(bloque => (
          <button
            key={bloque.codigo}
            className="bloque-card"
            onClick={() => handleSelectBloque(bloque)}
          >
            <div className="bloque-codigo">Bloque {bloque.codigo}</div>
            <div className="bloque-nombre">{bloque.nombre}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
