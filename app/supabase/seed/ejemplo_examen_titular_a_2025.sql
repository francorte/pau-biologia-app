-- ============================================================
-- EJEMPLO: Datos del Examen PAU Biología - Titular A 2024-2025
-- Andalucía, Ceuta, Melilla y Centros en Marruecos
-- ============================================================
-- Este archivo muestra cómo insertar preguntas reales de PAU
-- con sus imágenes asociadas, apartados y soluciones.
-- ============================================================

-- Primero obtenemos el UUID del bloque F (Inmunología)
-- En producción, usar el UUID real de la tabla blocks

-- ============================================================
-- PREGUNTA 4.1: Reacción alérgica (mastocito con IgE)
-- ID: 2025_AND_ORD_F_41
-- Imagen: 2025_AND_ORD_F_41.png (mastocito con IgE y alérgeno)
-- ============================================================

INSERT INTO questions (
    id,
    block_id,
    statement,
    has_image,
    image_url,
    year,
    convocatoria,
    tipo_examen,
    comunidad_autonoma,
    codigo_ccaa,
    fecha_examen,
    num_pregunta_original,
    image_description,
    dificultad,
    conceptos_clave,
    estado_revision,
    puntuacion_total,
    active
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM blocks WHERE name ILIKE '%inmunolog%' LIMIT 1),
    'Ulani se mudó a España desde una isla remota sin saber que era alérgica a las abejas. No pasó mucho tiempo antes de que le picase una abeja, lo que le produjo una reacción inflamatoria local que desconcertó bastante a la isleña. Sus amigos intentaron explicarle en qué consistía la respuesta alérgica utilizando la siguiente imagen.',
    true,
    'https://[SUPABASE_URL]/storage/v1/object/public/question-images/2025/2025_AND_ORD_F_41.png',
    2025,
    'Ordinaria',
    'Ordinaria',
    'Andalucía',
    'AND',
    '2025-06-01',
    4,
    'Diagrama de una célula cebada (mastocito) con inmunoglobulinas IgE unidas a su superficie y partículas de alérgeno (marcadas como 1 y 2) que desencadenan la liberación de gránulos de histamina',
    'Media',
    ARRAY['alergia', 'IgE', 'mastocito', 'histamina', 'hipersensibilidad', 'inmunoglobulinas'],
    'Verificado',
    2.0,
    true
  );

-- Apartados de la Pregunta 4.1
INSERT INTO subquestions (question_id, label, statement, order_index, puntuacion) VALUES
((SELECT id FROM questions WHERE statement ILIKE '%Ulani%' LIMIT 1), 'a', '¿Qué tipo de inmunoglobulinas, señaladas con el número 1, son específicas de la respuesta alérgica? ¿Cuál es la naturaleza química de las inmunoglobulinas? Describa su estructura molecular.', 1, 0.60),
((SELECT id FROM questions WHERE statement ILIKE '%Ulani%' LIMIT 1), 'b', '¿Cómo se denominan las diferentes sustancias, como la señalada con el número 2, que desencadenan una respuesta alérgica?', 2, 0.20),
((SELECT id FROM questions WHERE statement ILIKE '%Ulani%' LIMIT 1), 'c', 'Indique el nombre de la célula de la imagen y el nombre de una sustancia liberada por dicha célula como consecuencia de la respuesta alérgica.', 3, 0.40),
((SELECT id FROM questions WHERE statement ILIKE '%Ulani%' LIMIT 1), 'd', '¿Qué tipo de células producen las inmunoglobulinas? Nombre dos orgánulos o estructuras de dichas células implicados en la síntesis y secreción de inmunoglobulinas, e indique cómo se denomina, en general, el proceso por el que la célula libera dichas sustancias al exterior.', 4, 0.80);

-- Soluciones de la Pregunta 4.1
INSERT INTO solutions (subquestion_id, content) VALUES
((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement ILIKE '%Ulani%' AND sq.label = 'a' LIMIT 1), 
'IgE (inmunoglobulina E). Naturaleza química: proteínas (glucoproteínas). Estructura: formada por cuatro cadenas polipeptídicas (dos cadenas pesadas y dos ligeras) unidas por puentes disulfuro, con forma de Y. Presenta una región constante (Fc) y dos regiones variables (Fab) donde se une el antígeno.'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement ILIKE '%Ulani%' AND sq.label = 'b' LIMIT 1), 
'Alérgenos (o antígenos).'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement ILIKE '%Ulani%' AND sq.label = 'c' LIMIT 1), 
'Célula cebada o mastocito. Sustancia liberada: histamina.'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement ILIKE '%Ulani%' AND sq.label = 'd' LIMIT 1), 
'Las células plasmáticas (linfocitos B diferenciados). Orgánulos: retículo endoplasmático rugoso (síntesis de proteínas) y aparato de Golgi (maduración y empaquetamiento). Proceso: exocitosis.');

-- ============================================================
-- PREGUNTA 4.2: Inmunidad innata vs adaptativa (timeline)
-- ID: 2025_AND_ORD_F_42
-- Imagen: 2025_AND_ORD_F_42.png (diagrama con inmunidad A/B y respuestas C/D)
-- ============================================================

INSERT INTO questions (
    id,
    block_id,
    statement,
    has_image,
    image_url,
    year,
    convocatoria,
    tipo_examen,
    comunidad_autonoma,
    codigo_ccaa,
    fecha_examen,
    num_pregunta_original,
    image_description,
    dificultad,
    conceptos_clave,
    estado_revision,
    puntuacion_total,
    active
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM blocks WHERE name ILIKE '%inmunolog%' LIMIT 1),
    'En relación con la imagen adjunta:',
    true,
    'https://[SUPABASE_URL]/storage/v1/object/public/question-images/2025/2025_AND_ORD_F_42.png',
    2025,
    'Ordinaria',
    'Ordinaria',
    'Andalucía',
    'AND',
    '2025-06-01',
    4,
    'Diagrama que muestra la respuesta inmunitaria en el tiempo. Lado A: inmunidad innata (barreras epiteliales, macrófagos, complemento, células NK) en las primeras 12 horas. Lado B: inmunidad adaptativa que se desarrolla en días, mostrando linfocito B (2) produciendo anticuerpos (3) en respuesta C (humoral), y linfocitos T (4,5) en respuesta D (celular).',
    'Media',
    ARRAY['inmunidad innata', 'inmunidad adaptativa', 'linfocitos B', 'linfocitos T', 'anticuerpos', 'respuesta humoral', 'respuesta celular'],
    'Verificado',
    2.0,
    true
  );

-- Apartados de la Pregunta 4.2
INSERT INTO subquestions (question_id, label, statement, order_index, puntuacion) VALUES
((SELECT id FROM questions WHERE statement = 'En relación con la imagen adjunta:' AND year = 2025 LIMIT 1), 'a', '¿Qué tipos de inmunidad se representan con las letras A y B?', 1, 0.30),
((SELECT id FROM questions WHERE statement = 'En relación con la imagen adjunta:' AND year = 2025 LIMIT 1), 'b', '¿Qué tipos de respuestas inmunitarias se representan con las letras C y D?', 2, 0.20),
((SELECT id FROM questions WHERE statement = 'En relación con la imagen adjunta:' AND year = 2025 LIMIT 1), 'c', 'Nombre las moléculas o células señaladas con los números del 1 al 5.', 3, 0.50),
((SELECT id FROM questions WHERE statement = 'En relación con la imagen adjunta:' AND year = 2025 LIMIT 1), 'd', 'Cite dos orgánulos o estructuras celulares que estén implicados en la producción de la molécula señalada con el número 3. Indique una función de cada uno de estos orgánulos en relación con la síntesis de esta molécula.', 4, 0.50),
((SELECT id FROM questions WHERE statement = 'En relación con la imagen adjunta:' AND year = 2025 LIMIT 1), 'e', 'Explique razonadamente cómo se relacionan los procesos de transcripción y traducción en la generación de una respuesta inmunitaria.', 5, 0.50);

-- Soluciones de la Pregunta 4.2
INSERT INTO solutions (subquestion_id, content) VALUES
((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement = 'En relación con la imagen adjunta:' AND q.year = 2025 AND sq.label = 'a' LIMIT 1), 
'A: Inmunidad innata (inespecífica, congénita). B: Inmunidad adaptativa (específica, adquirida).'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement = 'En relación con la imagen adjunta:' AND q.year = 2025 AND sq.label = 'b' LIMIT 1), 
'C: Respuesta humoral. D: Respuesta celular.'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement = 'En relación con la imagen adjunta:' AND q.year = 2025 AND sq.label = 'c' LIMIT 1), 
'1: Macrófago (o fagocito/neutrófilo). 2: Linfocito B. 3: Inmunoglobulina (anticuerpo). 4: Célula presentadora de antígeno (CPA). 5: Linfocito T (colaborador/helper).'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement = 'En relación con la imagen adjunta:' AND q.year = 2025 AND sq.label = 'd' LIMIT 1), 
'Retículo endoplasmático rugoso: síntesis de las cadenas polipeptídicas de los anticuerpos. Aparato de Golgi: maduración, glucosilación y empaquetamiento de los anticuerpos para su secreción.'),

((SELECT sq.id FROM subquestions sq JOIN questions q ON sq.question_id = q.id WHERE q.statement = 'En relación con la imagen adjunta:' AND q.year = 2025 AND sq.label = 'e' LIMIT 1), 
'Cuando un linfocito B reconoce un antígeno, se activa y prolifera. Para producir anticuerpos, primero debe transcribirse el gen de las inmunoglobulinas (ADN → ARNm) en el núcleo. El ARNm maduro pasa al citoplasma donde se traduce en los ribosomas del RER (ARNm → proteína), sintetizando las cadenas pesadas y ligeras que formarán el anticuerpo funcional.');
