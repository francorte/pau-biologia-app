# Base de Datos de Preguntas PAU Biologia

## Sistema de Clasificacion de Preguntas

### Formato de ID de Pregunta

Cada pregunta tiene un ID unico con el formato:

```
AAAA_CCC_TTT_B_NN
```

| Componente | Descripcion | Ejemplo |
|------------|-------------|---------|
| AAAA | Ano de convocatoria | 2024, 2025 |
| CCC | Codigo CCAA | AND, MAD, CAT |
| TTT | Tipo de examen | ORD, EXT, RES, SUP, MOD |
| B | Bloque tematico | A, B, C, D, E, F |
| NN | Numero secuencial | 01, 02, 03 |

**Ejemplo:** `2024_AND_ORD_B_01` = Pregunta 1, Bloque B, Ordinaria Andalucia 2024

## Campos de Clasificacion

### Tabla questions

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| tipo_examen | ENUM | Ordinaria, Extraordinaria, Reserva, Suplente, Modelo Oficial |
| comunidad_autonoma | TEXT | Nombre completo de la CCAA |
| codigo_ccaa | CHAR(3) | Codigo corto (AND, MAD, CAT) |
| year | INTEGER | Ano de convocatoria |
| fecha_examen | DATE | Fecha exacta del examen |
| dificultad | ENUM | Baja, Media, Alta |
| conceptos_clave | TEXT[] | Array de palabras clave |
| estado_revision | ENUM | Pendiente, Revisado, Verificado |
| has_image | BOOLEAN | Si tiene imagen asociada |
| image_url | TEXT | URL en Supabase Storage |
| image_description | TEXT | Descripcion de la imagen |
| active | BOOLEAN | Si esta activa para estudiantes |

## Codigos de Comunidades Autonomas

| Codigo | Comunidad |
|--------|-----------|
| AND | Andalucia |
| ARA | Aragon |
| AST | Asturias |
| CAT | Cataluna |
| MAD | Madrid |
| VAL | Comunidad Valenciana |
| GAL | Galicia |
| PV | Pais Vasco |

## Tipos de Examen

| Tipo | Descripcion |
|------|-------------|
| Ordinaria | Convocatoria principal de junio |
| Extraordinaria | Convocatoria de septiembre |
| Reserva | Examen de reserva |
| Suplente | Examen suplente |
| Modelo Oficial | Modelo publicado por la ponencia |

## Gestion de Imagenes

### Nomenclatura de Archivos

- Imagen de pregunta: `{ID_PREGUNTA}.png`
- - Imagen de apartado: `{ID_PREGUNTA}_{letra}.png`
 
  - ### Estructura en Supabase Storage
 
  - ```
    question-images/
      2024/
        2024_AND_ORD_A_01.png
        2024_AND_ORD_B_02.png
      2025/
        2025_AND_MOD_D_01.png
    ```

    ## Bloques Tematicos

    | Codigo | Nombre | Contenido |
    |--------|--------|-----------|
    | A | Biomoleculas | Agua, sales, glucidos, lipidos, proteinas, ac. nucleicos |
    | B | Genetica molecular | ADN, replicacion, transcripcion, traduccion, mutaciones |
    | C | Biologia celular | Membranas, organulos, ciclo celular, mitosis, meiosis |
    | D | Metabolismo | Catabolismo, anabolismo, respiracion, fotosintesis |
    | E | Biotecnologia | Ingenieria genetica, PCR, CRISPR, OMG |
    | F | Inmunologia | Sistema inmunitario, anticuerpos, alergias, trasplantes |

    ## Migracion SQL

    La migracion `20260120100000_add_question_classification_fields.sql` anade:
    - Nuevos campos de clasificacion a la tabla questions
    - - Tabla de comunidades autonomas
      - - Indices para busquedas optimizadas
