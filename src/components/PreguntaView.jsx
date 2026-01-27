import { useState } from 'react';
import './PreguntaView.css';

export default function PreguntaView({ pregunta }) {
  const [showRespuesta, setShowRespuesta] = useState(false);
  const [respuestaAlumno, setRespuestaAlumno] = useState('');
  const [modoRespuesta, setModoRespuesta] = useState(false);

  if (!pregunta) {
    return <div className="pregunta-view"><p>No hay pregunta seleccionada</p></div>;
  }

  const handleResponder = () => {
    setModoRespuesta(true);
    setShowRespuesta(false);
  };

  const handleVerRespuesta = () => {
    setShowRespuesta(true);
    setModoRespuesta(false);
  };

  const handleGuardar = () => {
    localStorage.setItem(`respuesta_${pregunta.id}`, respuestaAlumno);
    alert('Respuesta guardada');
  };

  return (
    <div className="pregunta-view">
      <div className="pregunta-header">
        <h2>{pregunta.id}</h2>
        <div className="pregunta-meta">
          <span className="bloque">
            Bloque {pregunta.bloque_oficial?.codigo} – {pregunta.bloque_oficial?.nombre}
          </span>
          <span className="puntuacion">
            {pregunta.puntuacion_total} punto{pregunta.puntuacion_total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="pregunta-contenido">
        <div className="enunciado">
          <h3>Enunciado</h3>
          <p>{pregunta.enunciado}</p>
        </div>

        {pregunta.imagen_id && (
          <div className="imagen-container">
            <img 
              src={`/data/imagenes/${pregunta.imagen_id}.png`} 
              alt="Pregunta imagen"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {pregunta.apartados && pregunta.apartados.length > 0 && (
          <div className="apartados">
            <h4>Apartados:</h4>
            <ul>
              {pregunta.apartados.map((apt, idx) => (
                <li key={idx}>
                  <strong>{apt.numero}.</strong> {apt.enunciado}
                  {apt.puntuacion && <span className="puntos"> [{apt.puntuacion} puntos]</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="acciones">
        <button 
          className={`btn btn-responder ${modoRespuesta ? 'active' : ''}`}
          onClick={handleResponder}
        >
          Responder
        </button>
        <button 
          className={`btn btn-modelo ${showRespuesta ? 'active' : ''}`}
          onClick={handleVerRespuesta}
        >
          Ver respuesta del modelo
        </button>
      </div>

      {modoRespuesta && (
        <div className="modo-responder">
          <h3>Tu respuesta</h3>
          <textarea
            className="textarea-respuesta"
            placeholder="Escribe tu respuesta aquí. Intenta responder como en el examen real, sin consultar la respuesta del modelo."
            value={respuestaAlumno}
            onChange={(e) => setRespuestaAlumno(e.target.value)}
          />
          <button className="btn btn-guardar" onClick={handleGuardar}>
            Guardar respuesta
          </button>
          <p className="hint">
            No se evalúa automáticamente. Cuando termines, puedes ver la respuesta del modelo para comparar.
          </p>
        </div>
      )}

      {showRespuesta && pregunta.respuesta_modelo && (
        <div className="modo-respuesta-modelo">
          <h3>Respuesta del modelo</h3>
          <div className="respuesta-contenido">
            {pregunta.respuesta_modelo}
          </div>
          <div className="criterios" style={{display: pregunta.criterios ? 'block' : 'none'}}>
            <h4>Criterios de evaluación:</h4>
            <p>{pregunta.criterios}</p>
          </div>
        </div>
      )}

      {showRespuesta && !pregunta.respuesta_modelo && (
        <div className="modo-respuesta-modelo">
          <p className="sin-respuesta">
            La respuesta modelo para esta pregunta aún no está disponible.
          </p>
        </div>
      )}
    </div>
  );
}
