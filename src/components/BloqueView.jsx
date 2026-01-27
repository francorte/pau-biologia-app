import './BloqueView.css';

export default function BloqueView({ bloque, preguntas, loading, onSelectPregunta }) {
  if (loading) {
    return <div className="bloque-view"><p>Cargando preguntas...</p></div>;
  }

  if (!bloque) {
    return <div className="bloque-view"><p>Selecciona un bloque</p></div>;
  }

  const preguntasDelBloque = preguntas.filter(
    p => p.bloque_oficial?.codigo === bloque.codigo
  );

  if (preguntasDelBloque.length === 0) {
    return (
      <div className="bloque-view">
        <h2>Bloque {bloque.codigo} – {bloque.nombre}</h2>
        <p className="no-preguntas">No hay preguntas disponibles para este bloque</p>
      </div>
    );
  }

  return (
    <div className="bloque-view">
      <h2>Bloque {bloque.codigo} – {bloque.nombre}</h2>
      <p className="contador">
        {preguntasDelBloque.length} pregunta{preguntasDelBloque.length !== 1 ? 's' : ''}
      </p>

      <div className="preguntas-list">
        {preguntasDelBloque.map((pregunta) => (
          <button
            key={pregunta.id}
            className="pregunta-item"
            onClick={() => onSelectPregunta(pregunta)}
          >
            <div className="pregunta-id">{pregunta.id}</div>
            <div className="pregunta-info">
              <span className="anio">
                {pregunta.origen_historico?.[0]?.anio || 'N/A'}
              </span>
              {pregunta.has_imagen && (
                <span className="badge-imagen">📷 Con imagen</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
