import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const BLOQUES = [
  { codigo: "A", nombre: "Biomoléculas", color: "#10b981" },
  { codigo: "B", nombre: "Genética molecular", color: "#8b5cf6" },
  { codigo: "C", nombre: "Biología celular", color: "#3b82f6" },
  { codigo: "D", nombre: "Metabolismo", color: "#f59e0b" },
  { codigo: "E", nombre: "Biotecnología", color: "#ec4899" },
  { codigo: "F", nombre: "Inmunología", color: "#ef4444" }
];

const BLOQUES_KEYWORDS = {
  "A": ["biomoléculas", "glúcidos", "lípidos", "proteínas", "aminoácidos", "enzimas", "ácidos nucleicos", "nucleótidos", "vitaminas", "sales minerales", "monosacáridos", "polisacáridos", "glucosa", "almidón", "celulosa", "ácidos grasos", "fosfolípidos", "colesterol", "enlace peptídico", "desnaturalización", "ATP", "coenzima", "estructura primaria", "estructura secundaria", "estructura terciaria", "alfa-hélice", "beta-plegada", "hexosa", "pentosa", "ribosa", "desoxirribosa"],
  "B": ["ADN", "ARN", "replicación", "transcripción", "traducción", "código genético", "gen", "genoma", "mutación", "cromosoma", "ARNm", "ARNt", "ARNr", "codón", "anticodón", "ribosoma", "cadena molde", "cadena codificante", "polimerasa", "helicasa", "ligasa", "fragmentos de Okazaki", "semiconservativa", "promotor", "exón", "intrón", "splicing", "operón", "expresión génica", "mutación puntual"],
  "C": ["célula", "membrana plasmática", "citoplasma", "núcleo", "orgánulo", "mitocondria", "cloroplasto", "retículo endoplasmático", "Golgi", "lisosoma", "vacuola", "citoesqueleto", "pared celular", "procariota", "eucariota", "bicapa lipídica", "transporte", "ósmosis", "difusión", "endocitosis", "exocitosis", "mitosis", "meiosis", "ciclo celular", "profase", "metafase", "anafase", "telofase", "cromátida", "haploide", "diploide"],
  "D": ["metabolismo", "catabolismo", "anabolismo", "glucólisis", "ciclo de Krebs", "cadena respiratoria", "fosforilación", "respiración celular", "fermentación", "fotosíntesis", "quimiosíntesis", "beta-oxidación", "acetil-CoA", "NADH", "FADH2", "NADPH", "tilacoide", "estroma", "fotosistema", "ciclo de Calvin", "fotofosforilación", "oxidación", "reducción", "piruvato"],
  "E": ["biotecnología", "ingeniería genética", "PCR", "clonación", "ADN recombinante", "enzimas de restricción", "vector", "plásmido", "transgénico", "OMG", "CRISPR", "Cas9", "terapia génica", "secuenciación", "electroforesis", "Taq polimerasa", "amplificación", "diagnóstico molecular", "células madre"],
  "F": ["inmunidad", "sistema inmunitario", "antígeno", "anticuerpo", "inmunoglobulina", "linfocito", "linfocito B", "linfocito T", "macrófago", "fagocito", "célula plasmática", "memoria inmunológica", "respuesta humoral", "respuesta celular", "inflamación", "complemento", "MHC", "HLA", "vacuna", "suero", "alergia", "autoinmunidad", "inmunodeficiencia", "trasplante", "rechazo", "IgA", "IgG", "IgM", "IgE", "histamina", "médula ósea", "timo"]
};

const IMAGEN_KEYWORDS = ["figura", "imagen", "gráfico", "esquema", "dibujo", "observe", "representada", "adjunta", "señalado con", "indicado con"];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE EXTRACCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const clasificarBloque = (texto) => {
  const textoLower = texto.toLowerCase();
  const puntuaciones = {};
  
  Object.entries(BLOQUES_KEYWORDS).forEach(([codigo, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      if (textoLower.includes(keyword.toLowerCase())) {
        score += 1 + keyword.length / 10;
      }
    });
    puntuaciones[codigo] = score;
  });
  
  const mejorBloque = Object.entries(puntuaciones).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const bloqueInfo = BLOQUES.find(b => b.codigo === mejorBloque);
  
  return { codigo: mejorBloque, nombre: bloqueInfo?.nombre || "Sin clasificar" };
};

const detectarImagen = (texto) => {
  const textoLower = texto.toLowerCase();
  return IMAGEN_KEYWORDS.some(kw => textoLower.includes(kw.toLowerCase()));
};

const extraerApartados = (textoPregunta) => {
  const apartados = [];
  const patron = /(?:^|\n)\s*([a-h])\)\s*([^]*?)(?=(?:\n\s*[a-h]\))|$)/gi;
  
  let match;
  const letrasVistas = new Set();
  
  while ((match = patron.exec(textoPregunta)) !== null) {
    const letra = match[1].toLowerCase();
    if (letrasVistas.has(letra)) continue;
    letrasVistas.add(letra);
    
    let texto = match[2].trim();
    const puntosMatch = texto.match(/\[([0-9]+(?:[,\.][0-9]+)?)\s*(?:puntos?)?\]/);
    const puntos = puntosMatch ? parseFloat(puntosMatch[1].replace(',', '.')) : 0.5;
    texto = texto.replace(/\[[0-9]+(?:[,\.][0-9]+)?\s*(?:puntos?)?\]/g, '').replace(/\n+/g, ' ').trim();
    
    apartados.push({ letra, texto, puntos, respuesta_modelo: "", criterios: [], errores_frecuentes: [] });
  }
  
  return apartados.sort((a, b) => a.letra.localeCompare(b.letra));
};

const extraerPreguntas = (texto, año) => {
  const preguntas = [];
  const patron = /(?:PREGUNTA|Pregunta|EJERCICIO|Ejercicio)\s*(\d+)[^\n]*\n([^]*?)(?=(?:PREGUNTA|Pregunta|EJERCICIO|Ejercicio)\s*\d+|$)/gi;
  
  let match;
  while ((match = patron.exec(texto)) !== null) {
    const numPregunta = match[1];
    const contenido = match[2];
    
    const contenidoLower = contenido.toLowerCase();
    const obligatoria = contenidoLower.includes('obligatori');
    
    let opcion = null;
    if (contenidoLower.includes('opción a') || contenidoLower.includes('opcion a')) opcion = "A";
    else if (contenidoLower.includes('opción b') || contenidoLower.includes('opcion b')) opcion = "B";
    
    const bloque = clasificarBloque(contenido);
    const tieneImagen = detectarImagen(contenido);
    
    const enunciadoMatch = contenido.match(/^([^]*?)(?=[a-h]\))/i);
    let enunciado = enunciadoMatch ? enunciadoMatch[1].trim() : contenido.substring(0, 200);
    enunciado = enunciado.replace(/\[.*?puntos?\]/gi, '').replace(/(?:obligatori[oa]|Opción [AB]|Total:?\s*\d+\s*puntos?)/gi, '').trim();
    
    const apartados = extraerApartados(contenido);
    const puntuacionTotal = apartados.reduce((sum, a) => sum + a.puntos, 0) || 2.0;
    
    const id = `PAU_${año}_P${numPregunta}${opcion ? '_' + opcion : ''}_${Date.now()}`;
    
    preguntas.push({
      id, año,
      bloque: bloque.codigo,
      bloque_nombre: bloque.nombre,
      tipo: obligatoria ? "competencial" : "opcion",
      obligatoria, opcion, enunciado,
      puntuacion_total: Math.round(puntuacionTotal * 10) / 10,
      tiene_imagen: tieneImagen,
      imagen_base64: null,
      imagen_descripcion: tieneImagen ? "Imagen del examen" : "",
      apartados
    });
  }
  
  return preguntas;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function PAUBiologiaTrainer() {
  const [vista, setVista] = useState('inicio');
  const [filtroBloque, setFiltroBloque] = useState(null);
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [apartadosVisibles, setApartadosVisibles] = useState({});
  const [mostrarRespuesta, setMostrarRespuesta] = useState({});
  const [respuestasCompletadas, setRespuestasCompletadas] = useState({});
  
  const [preguntasData, setPreguntasData] = useState([]);
  const [preguntasExtraidas, setPreguntasExtraidas] = useState([]);
  const [preguntasPendientesImagen, setPreguntasPendientesImagen] = useState([]);
  const [imagenActualIndex, setImagenActualIndex] = useState(0);
  const [añoExamen, setAñoExamen] = useState(2024);
  const [textoExamen, setTextoExamen] = useState('');
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Cargar de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pau_preguntas_v2');
      const savedProgress = localStorage.getItem('pau_progreso_v2');
      if (saved) setPreguntasData(JSON.parse(saved));
      if (savedProgress) setRespuestasCompletadas(JSON.parse(savedProgress));
    } catch (e) { console.log('Error cargando datos'); }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (preguntasData.length > 0) {
      localStorage.setItem('pau_preguntas_v2', JSON.stringify(preguntasData));
    }
  }, [preguntasData]);

  useEffect(() => {
    localStorage.setItem('pau_progreso_v2', JSON.stringify(respuestasCompletadas));
  }, [respuestasCompletadas]);

  const preguntasFiltradas = filtroBloque 
    ? preguntasData.filter(p => p.bloque === filtroBloque)
    : preguntasData;

  const getBloqueInfo = (codigo) => BLOQUES.find(b => b.codigo === codigo) || BLOQUES[0];

  const calcularProgreso = () => {
    const total = preguntasData.reduce((acc, p) => acc + (p.apartados?.length || 0), 0);
    const completados = Object.values(respuestasCompletadas).filter(Boolean).length;
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  };

  const procesarTexto = () => {
    if (!textoExamen.trim()) return;
    const preguntas = extraerPreguntas(textoExamen, añoExamen);
    setPreguntasExtraidas(preguntas);
    const conImagen = preguntas.filter(p => p.tiene_imagen);
    setPreguntasPendientesImagen(conImagen);
    setImagenActualIndex(0);
    setVista(conImagen.length > 0 ? 'cargar_imagenes' : 'confirmar');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preguntaId = preguntasPendientesImagen[imagenActualIndex]?.id;
      setPreguntasExtraidas(prev => prev.map(p => 
        p.id === preguntaId ? { ...p, imagen_base64: ev.target?.result } : p
      ));
      if (imagenActualIndex < preguntasPendientesImagen.length - 1) {
        setImagenActualIndex(prev => prev + 1);
      } else {
        setVista('confirmar');
      }
    };
    reader.readAsDataURL(file);
  };

  const saltarImagen = () => {
    if (imagenActualIndex < preguntasPendientesImagen.length - 1) {
      setImagenActualIndex(prev => prev + 1);
    } else {
      setVista('confirmar');
    }
  };

  const confirmarCarga = () => {
    setPreguntasData(prev => [...prev, ...preguntasExtraidas]);
    setPreguntasExtraidas([]);
    setPreguntasPendientesImagen([]);
    setTextoExamen('');
    setVista('preguntas');
  };

  const eliminarPregunta = (id) => {
    setPreguntasData(prev => prev.filter(p => p.id !== id));
    setVista('preguntas');
  };

  // Estilos
  const s = {
    app: { maxWidth: '430px', margin: '0 auto', minHeight: '100vh', background: 'linear-gradient(160deg, #0c1222 0%, #1a2744 50%, #0f172a 100%)', fontFamily: 'system-ui, sans-serif' },
    header: { position: 'sticky', top: 0, zIndex: 20, background: 'rgba(12, 18, 34, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px' },
    card: { background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' },
    btn: { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 20px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' },
    btnSec: { background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', cursor: 'pointer', width: '100%' },
    nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(12, 18, 34, 0.98)', borderTop: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px', display: 'flex', justifyContent: 'space-around', maxWidth: '430px', margin: '0 auto' },
    navBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', gap: '4px' },
    upload: { border: '2px dashed rgba(99, 102, 241, 0.4)', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(99, 102, 241, 0.05)' }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VISTAS
  // ═══════════════════════════════════════════════════════════════════════════

  // INICIO
  if (vista === 'inicio') {
    return (
      <div style={s.app}>
        <div style={{ padding: '40px 20px 20px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '36px' }}>🧬</div>
          <h1 style={{ color: 'white', fontSize: '24px', marginBottom: '4px' }}>PAU Biología</h1>
          <p style={{ color: '#a5b4fc', fontSize: '14px' }}>Andalucía · {preguntasData.length} preguntas</p>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>Progreso</span>
              <span style={{ color: '#6366f1', fontWeight: '700' }}>{calcularProgreso()}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px' }}>
              <div style={{ height: '100%', width: `${calcularProgreso()}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
            </div>
          </div>
          
          <button style={s.btn} onClick={() => setVista('preguntas')}>
            🎯 Comenzar entrenamiento
          </button>
        </div>

        <div style={{ padding: '0 20px 100px' }}>
          <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px' }}>BLOQUES TEMÁTICOS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {BLOQUES.map(b => (
              <button key={b.codigo} onClick={() => { setFiltroBloque(b.codigo); setVista('preguntas'); }} style={{ ...s.card, textAlign: 'left', cursor: 'pointer', padding: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${b.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', color: b.color, fontWeight: '700' }}>{b.codigo}</div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{b.nombre}</p>
                <p style={{ color: '#64748b', fontSize: '11px' }}>{preguntasData.filter(p => p.bloque === b.codigo).length} preg.</p>
              </button>
            ))}
          </div>
        </div>

        <div style={s.nav}>
          <button style={{ ...s.navBtn, color: '#6366f1' }}>🏠<span>Inicio</span></button>
          <button style={s.navBtn} onClick={() => setVista('preguntas')}>📚<span>Preguntas</span></button>
          <button style={s.navBtn} onClick={() => setVista('cargar')}>➕<span>Cargar</span></button>
        </div>
      </div>
    );
  }

  // CARGAR PREGUNTAS
  if (vista === 'cargar') {
    return (
      <div style={s.app}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setVista('inicio')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: '18px' }}>←</button>
            <div>
              <h1 style={{ color: 'white', fontSize: '17px' }}>Cargar examen</h1>
              <p style={{ color: '#64748b', fontSize: '12px' }}>Añadir nuevas preguntas</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <div style={s.card}>
            <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Año del examen</label>
            <input type="number" value={añoExamen} onChange={e => setAñoExamen(parseInt(e.target.value) || 2024)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(15, 23, 42, 0.8)', color: 'white', fontSize: '16px' }} />
          </div>

          <div style={s.card}>
            <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Texto del examen</label>
            <textarea
              placeholder="Pega aquí el texto del examen PAU...&#10;&#10;PREGUNTA 1 (obligatoria)&#10;Enunciado...&#10;a) Apartado 1 [0,5]&#10;b) Apartado 2 [0,5]"
              value={textoExamen}
              onChange={e => setTextoExamen(e.target.value)}
              style={{ width: '100%', minHeight: '200px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(15, 23, 42, 0.8)', color: 'white', fontSize: '14px', resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          {textoExamen && (
            <button style={s.btn} onClick={procesarTexto}>
              📄 Procesar texto ({textoExamen.length} caracteres)
            </button>
          )}
          
          <p style={{ color: '#64748b', fontSize: '11px', marginTop: '16px', textAlign: 'center' }}>
            Copia el texto del PDF del examen y pégalo arriba.<br/>
            El sistema detectará las preguntas y las clasificará automáticamente.
          </p>
        </div>

        <div style={s.nav}>
          <button style={s.navBtn} onClick={() => setVista('inicio')}>🏠<span>Inicio</span></button>
          <button style={s.navBtn} onClick={() => setVista('preguntas')}>📚<span>Preguntas</span></button>
          <button style={{ ...s.navBtn, color: '#6366f1' }}>➕<span>Cargar</span></button>
        </div>
      </div>
    );
  }

  // CARGAR IMÁGENES
  if (vista === 'cargar_imagenes' && preguntasPendientesImagen.length > 0) {
    const pregActual = preguntasPendientesImagen[imagenActualIndex];
    const pregConImg = preguntasExtraidas.find(p => p.id === pregActual?.id);
    
    return (
      <div style={s.app}>
        <div style={s.header}>
          <h1 style={{ color: 'white', fontSize: '17px', textAlign: 'center' }}>
            Cargar imágenes ({imagenActualIndex + 1}/{preguntasPendientesImagen.length})
          </h1>
        </div>

        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <div style={{ ...s.card, borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <p style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              📷 {pregActual?.id}
            </p>
            <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.5' }}>
              {pregActual?.enunciado?.substring(0, 150)}...
            </p>
          </div>

          <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />

          {pregConImg?.imagen_base64 ? (
            <div style={s.card}>
              <img src={pregConImg.imagen_base64} alt="Cargada" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
              <p style={{ color: '#10b981', textAlign: 'center', fontSize: '13px' }}>✓ Imagen cargada</p>
            </div>
          ) : (
            <div style={s.upload} onClick={() => imageInputRef.current?.click()}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</p>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>Subir imagen</p>
              <p style={{ color: '#64748b', fontSize: '12px' }}>PNG, JPG o WEBP</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={s.btnSec} onClick={saltarImagen}>
              Saltar (sin imagen)
            </button>
            {pregConImg?.imagen_base64 && (
              <button style={s.btn} onClick={saltarImagen}>
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CONFIRMAR CARGA
  if (vista === 'confirmar') {
    const bloqueCount = {};
    preguntasExtraidas.forEach(p => { bloqueCount[p.bloque] = (bloqueCount[p.bloque] || 0) + 1; });
    
    return (
      <div style={s.app}>
        <div style={s.header}>
          <h1 style={{ color: 'white', fontSize: '17px', textAlign: 'center' }}>Confirmar carga</h1>
        </div>

        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <p style={{ color: '#10b981', fontSize: '20px', fontWeight: '700' }}>✓ {preguntasExtraidas.length} preguntas</p>
            <p style={{ color: '#6ee7b7', fontSize: '13px' }}>Listas para añadir</p>
          </div>

          <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '1px', margin: '16px 0 12px' }}>CLASIFICACIÓN</p>
          
          {Object.entries(bloqueCount).map(([codigo, count]) => {
            const bloque = getBloqueInfo(codigo);
            return (
              <div key={codigo} style={{ ...s.card, display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Bloque {codigo}: {bloque.nombre}</span>
                <span style={{ color: bloque.color, fontWeight: '700' }}>{count}</span>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button style={s.btnSec} onClick={() => { setPreguntasExtraidas([]); setVista('cargar'); }}>
              Cancelar
            </button>
            <button style={s.btn} onClick={confirmarCarga}>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LISTA DE PREGUNTAS
  if (vista === 'preguntas') {
    return (
      <div style={s.app}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => { setVista('inicio'); setFiltroBloque(null); }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: '18px' }}>←</button>
            <div>
              <h1 style={{ color: 'white', fontSize: '17px' }}>{filtroBloque ? getBloqueInfo(filtroBloque).nombre : 'Todas'}</h1>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{preguntasFiltradas.length} preguntas</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto' }}>
            <button onClick={() => setFiltroBloque(null)} style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '11px', border: 'none', cursor: 'pointer', background: !filtroBloque ? '#6366f1' : 'rgba(99, 102, 241, 0.2)', color: !filtroBloque ? 'white' : '#a5b4fc', whiteSpace: 'nowrap' }}>Todas</button>
            {BLOQUES.map(b => (
              <button key={b.codigo} onClick={() => setFiltroBloque(filtroBloque === b.codigo ? null : b.codigo)} style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '11px', border: 'none', cursor: 'pointer', background: filtroBloque === b.codigo ? b.color : 'rgba(99, 102, 241, 0.2)', color: filtroBloque === b.codigo ? 'white' : '#a5b4fc', whiteSpace: 'nowrap' }}>{b.codigo}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px', paddingBottom: '100px' }}>
          {preguntasFiltradas.length === 0 ? (
            <div style={{ ...s.card, textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📭</p>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>No hay preguntas</p>
              <button style={s.btnSec} onClick={() => setVista('cargar')}>➕ Cargar preguntas</button>
            </div>
          ) : (
            preguntasFiltradas.map((p, i) => {
              const bloque = getBloqueInfo(p.bloque);
              const completados = p.apartados?.filter(a => respuestasCompletadas[`${p.id}_${a.letra}`]).length || 0;
              
              return (
                <button key={p.id} onClick={() => { setPreguntaActual(p); setApartadosVisibles({}); setMostrarRespuesta({}); setVista('detalle'); }} style={{ ...s.card, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg, ${bloque.color}, ${bloque.color}99)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: `${bloque.color}20`, color: bloque.color }}>Bloque {p.bloque}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', background: '#6366f1', color: 'white' }}>{p.año}</span>
                      {p.tiene_imagen && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', background: p.imagen_base64 ? '#10b98120' : '#f59e0b20', color: p.imagen_base64 ? '#10b981' : '#f59e0b' }}>📷</span>}
                    </div>
                    <p style={{ color: 'white', fontSize: '13px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.enunciado}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>{p.apartados?.length || 0} apartados</span>
                      {completados > 0 && <span style={{ color: '#10b981', fontSize: '11px' }}>✓ {completados}/{p.apartados?.length}</span>}
                    </div>
                  </div>
                  <span style={{ color: '#475569', alignSelf: 'center' }}>→</span>
                </button>
              );
            })
          )}
        </div>

        <div style={s.nav}>
          <button style={s.navBtn} onClick={() => setVista('inicio')}>🏠<span>Inicio</span></button>
          <button style={{ ...s.navBtn, color: '#6366f1' }}>📚<span>Preguntas</span></button>
          <button style={s.navBtn} onClick={() => setVista('cargar')}>➕<span>Cargar</span></button>
        </div>
      </div>
    );
  }

  // DETALLE DE PREGUNTA
  if (vista === 'detalle' && preguntaActual) {
    const bloque = getBloqueInfo(preguntaActual.bloque);
    const idx = preguntasFiltradas.findIndex(p => p.id === preguntaActual.id);

    return (
      <div style={s.app}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setVista('preguntas')} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: '18px' }}>←</button>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: 'white', fontSize: '16px' }}>Pregunta {idx + 1}</h1>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{bloque.nombre} · {preguntaActual.año}</p>
            </div>
            <button onClick={() => eliminarPregunta(preguntaActual.id)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: '14px' }}>🗑️</button>
          </div>
        </div>

        <div style={{ padding: '16px', paddingBottom: '140px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', background: `${bloque.color}30`, color: bloque.color }}>Bloque {preguntaActual.bloque}</span>
            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>{preguntaActual.puntuacion_total} pts</span>
          </div>

          <div style={s.card}>
            {preguntaActual.tiene_imagen && preguntaActual.imagen_base64 && (
              <img src={preguntaActual.imagen_base64} alt="Figura" style={{ width: '100%', borderRadius: '10px', marginBottom: '14px', background: 'white' }} />
            )}
            {preguntaActual.tiene_imagen && !preguntaActual.imagen_base64 && (
              <div style={{ padding: '20px', marginBottom: '14px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '2px dashed rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                <p style={{ color: '#fcd34d', fontSize: '13px' }}>📷 Imagen pendiente de cargar</p>
              </div>
            )}
            <p style={{ color: 'white', lineHeight: '1.6', fontSize: '14px' }}>{preguntaActual.enunciado}</p>
          </div>

          {preguntaActual.apartados?.map(apt => {
            const isVisible = apartadosVisibles[apt.letra];
            const showResp = mostrarRespuesta[apt.letra];
            const isDone = respuestasCompletadas[`${preguntaActual.id}_${apt.letra}`];
            
            return (
              <div key={apt.letra} style={{ ...s.card, borderColor: isDone ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.15)' }}>
                <button onClick={() => setApartadosVisibles(prev => ({ ...prev, [apt.letra]: !prev[apt.letra] }))} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', gap: '12px', textAlign: 'left', padding: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(99, 102, 241, 0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>{apt.letra}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: isVisible ? 'white' : '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{apt.texto}</p>
                    <span style={{ color: '#6366f1', fontSize: '11px' }}>[{apt.puntos} pts]</span>
                  </div>
                  <span style={{ color: '#64748b' }}>{isVisible ? '▼' : '▶'}</span>
                </button>

                {isVisible && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
                    <button onClick={() => setMostrarRespuesta(prev => ({ ...prev, [apt.letra]: !prev[apt.letra] }))} style={{ ...s.btnSec, marginBottom: '12px', background: showResp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      {showResp ? '🙈 Ocultar respuesta' : '👁️ Ver respuesta modelo'}
                    </button>

                    {showResp && (
                      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                        <p style={{ color: '#10b981', fontSize: '11px', fontWeight: '600', marginBottom: '8px' }}>RESPUESTA MODELO</p>
                        <p style={{ color: '#d1fae5', fontSize: '13px', lineHeight: '1.6' }}>{apt.respuesta_modelo || '[Pendiente de completar]'}</p>
                      </div>
                    )}

                    <button onClick={() => setRespuestasCompletadas(prev => ({ ...prev, [`${preguntaActual.id}_${apt.letra}`]: !isDone }))} style={{ ...s.btn, background: isDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(99, 102, 241, 0.2)' }}>
                      {isDone ? '✓ Dominado' : 'Marcar como dominado'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...s.nav, justifyContent: 'space-between', padding: '12px 16px' }}>
          <button onClick={() => { if (idx > 0) { setPreguntaActual(preguntasFiltradas[idx - 1]); setApartadosVisibles({}); setMostrarRespuesta({}); } }} disabled={idx === 0} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', background: idx === 0 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(99, 102, 241, 0.2)', color: idx === 0 ? '#475569' : '#a5b4fc' }}>← Anterior</button>
          <span style={{ color: '#64748b', fontSize: '13px' }}>{idx + 1}/{preguntasFiltradas.length}</span>
          <button onClick={() => { if (idx < preguntasFiltradas.length - 1) { setPreguntaActual(preguntasFiltradas[idx + 1]); setApartadosVisibles({}); setMostrarRespuesta({}); } }} disabled={idx === preguntasFiltradas.length - 1} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: idx === preguntasFiltradas.length - 1 ? 'default' : 'pointer', background: idx === preguntasFiltradas.length - 1 ? 'rgba(30, 41, 59, 0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', color: idx === preguntasFiltradas.length - 1 ? '#475569' : 'white' }}>Siguiente →</button>
        </div>
      </div>
    );
  }

  return null;
}
