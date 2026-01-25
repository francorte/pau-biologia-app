# 🧬 PAU Biología Trainer - Andalucía

Aplicación móvil para entrenamiento de exámenes PAU de Biología (Selectividad) según las **Directrices y Orientaciones oficiales de Andalucía 2025-26**.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Características

### Funcionalidades principales
- ✅ **Banco de preguntas PAU** - Clasificadas por los 6 bloques oficiales
- ✅ **Carga de exámenes** - Importar nuevos exámenes desde texto
- ✅ **Detección automática de imágenes** - Identifica preguntas que requieren figuras
- ✅ **Clasificación inteligente** - Asigna bloque temático automáticamente
- ✅ **Respuestas modelo** - Con criterios de corrección oficiales
- ✅ **Seguimiento de progreso** - Marca apartados como "dominados"
- ✅ **Persistencia local** - Los datos se guardan en el navegador

### Bloques temáticos cubiertos
| Bloque | Contenido |
|--------|-----------|
| **A** | Biomoléculas |
| **B** | Genética molecular |
| **C** | Biología celular |
| **D** | Metabolismo |
| **E** | Biotecnología |
| **F** | Inmunología |

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/francorte/pau-biologia-app.git
cd pau-biologia-app

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📱 Uso

### Cargar un nuevo examen

1. Pulsa **"➕ Cargar"** en la navegación inferior
2. Introduce el **año del examen**
3. **Pega el texto** del examen PAU con este formato:

```
PREGUNTA 1 (obligatoria) [2 puntos]
La beta-oxidación de ácidos grasos se intensifica en situaciones de ayuno...
a) Explique por qué ocurre esto [0,5].
b) Una investigadora ha detectado que... [0,5].

PREGUNTA 2 Opción A [2 puntos]
En relación con la figura adjunta:
a) ¿Qué estructura representa la imagen? [0,2].
```

4. El sistema **detectará automáticamente**:
   - Número de preguntas
   - Bloque temático (A-F)
   - Si requiere imagen
   - Puntuación de cada apartado

5. Si hay preguntas con imagen, podrás **subirlas una a una**

### Entrenar

1. Selecciona un **bloque temático** o "Todas"
2. Lee el enunciado y los apartados
3. Pulsa en cada apartado para expandirlo
4. **"Ver respuesta modelo"** para autocorregirte
5. **"Marcar como dominado"** cuando lo controles

## 📂 Estructura del proyecto

```
pau-biologia-app/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── docs/
│   └── orientaciones.md # Directrices PAU oficiales
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Tecnologías

- **React 18** - Interfaz de usuario
- **Vite** - Bundler y servidor de desarrollo
- **localStorage** - Persistencia de datos
- **CSS-in-JS** - Estilos inline para portabilidad

## 📋 Formato de datos

```javascript
{
  id: "PAU_2024_P1",
  año: 2024,
  bloque: "D",
  bloque_nombre: "Metabolismo",
  tipo: "competencial",
  obligatoria: true,
  enunciado: "La beta-oxidación de ácidos grasos...",
  puntuacion_total: 2,
  tiene_imagen: true,
  imagen_base64: "data:image/png;base64,...",
  apartados: [
    {
      letra: "a",
      texto: "Explique por qué ocurre esto",
      puntos: 0.5,
      respuesta_modelo: "En ayuno disminuye la glucosa...",
      criterios: [
        { concepto: "Mencionar glucosa", valor: 0.2 },
        { concepto: "Relacionar con insulina", valor: 0.3 }
      ],
      errores_frecuentes: [
        "Confundir catabolismo con anabolismo"
      ]
    }
  ]
}
```

## 📖 Basado en documentación oficial

Este proyecto sigue las **Directrices y Orientaciones Generales para las Pruebas de Acceso a la Universidad** de Biología (curso 2025-26) publicadas por las Universidades Públicas de Andalucía.

### Criterios de corrección implementados
- Ajuste estricto al enunciado
- Puntuación por precisión
- Valoración de argumentación
- Lenguaje científico-biológico
- Esquemas pertinentes

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Francisco de la Corte**
- GitHub: [@francorte](https://github.com/francorte)

---

*Desarrollado para estudiantes de 2º Bachillerato preparando la PAU de Biología en Andalucía* 🎓
