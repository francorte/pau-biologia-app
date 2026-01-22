/**
 * Tipos para la clasificación de preguntas PAU Biología
 * Estos tipos corresponden a los nuevos campos de la migración SQL
 */

// Tipos de examen disponibles
export type ExamType = 
  | 'Ordinaria' 
  | 'Extraordinaria' 
  | 'Reserva' 
  | 'Suplente' 
  | 'Modelo Oficial';

// Niveles de dificultad
export type DifficultyLevel = 'Baja' | 'Media' | 'Alta';

// Estados de revisión
export type ReviewStatus = 'Pendiente' | 'Revisado' | 'Verificado';

// Códigos de Comunidades Autónomas
export type ComunidadAutonomaCode = 
  | 'AND' | 'ARA' | 'AST' | 'BAL' | 'CAN' 
  | 'CANT' | 'CYL' | 'CLM' | 'CAT' | 'VAL' 
  | 'EXT' | 'GAL' | 'MAD' | 'MUR' | 'NAV' 
  | 'PV' | 'RIO' | 'CEU' | 'MEL';

// Códigos de bloques temáticos
export type BlockCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Interfaz para Comunidad Autónoma
export interface ComunidadAutonoma {
    codigo: ComunidadAutonomaCode;
    nombre: string;
    created_at?: string;
}

// Interfaz extendida para Question con campos de clasificación
export interface QuestionClassification {
    tipo_examen: ExamType;
    comunidad_autonoma: string;
    codigo_ccaa: ComunidadAutonomaCode;
    fecha_examen?: string;
    num_pregunta_original?: number;
    image_description?: string;
    dificultad: DifficultyLevel;
    conceptos_clave?: string[];
    estado_revision: ReviewStatus;
    puntuacion_total: number;
    active: boolean;
}

// Interfaz completa de Question con clasificación
export interface QuestionWithClassification {
    id: string;
    block_id: string;
    statement: string;
    has_image: boolean;
    image_url?: string;
    year?: number;
    convocatoria?: string;
    created_at: string;
    updated_at: string;
    // Campos de clasificación
  tipo_examen: ExamType;
    comunidad_autonoma: string;
    codigo_ccaa: ComunidadAutonomaCode;
    fecha_examen?: string;
    num_pregunta_original?: number;
    image_description?: string;
    dificultad: DifficultyLevel;
    conceptos_clave?: string[];
    estado_revision: ReviewStatus;
    puntuacion_total: number;
    active: boolean;
}

// Interfaz para Subquestion con campos adicionales
export interface SubquestionWithScore {
    id: string;
    question_id: string;
    label: string;
    statement: string;
    order_index: number;
    created_at: string;
    // Nuevos campos
  puntuacion: number;
    has_image: boolean;
    image_url?: string;
}

// Filtros para búsqueda de preguntas
export interface QuestionFilters {
    block_id?: string;
    year?: number;
    tipo_examen?: ExamType;
    codigo_ccaa?: ComunidadAutonomaCode;
    dificultad?: DifficultyLevel;
    estado_revision?: ReviewStatus;
    has_image?: boolean;
    active?: boolean;
    conceptos_clave?: string[];
}

// Estadísticas de preguntas
export interface QuestionStats {
    total: number;
    by_block: Record<BlockCode, number>;
    by_exam_type: Record<ExamType, number>;
    by_difficulty: Record<DifficultyLevel, number>;
    by_year: Record<number, number>;
    with_image: number;
    pending_review: number;
}

// Constantes útiles
export const EXAM_TYPES: ExamType[] = [
    'Ordinaria',
    'Extraordinaria', 
    'Reserva',
    'Suplente',
    'Modelo Oficial'
  ];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['Baja', 'Media', 'Alta'];

export const REVIEW_STATUSES: ReviewStatus[] = ['Pendiente', 'Revisado', 'Verificado'];

export const BLOCK_NAMES: Record<BlockCode, string> = {
    A: 'Las biomoléculas',
    B: 'Genética molecular',
    C: 'Biología celular',
    D: 'Metabolismo',
    E: 'Biotecnología',
    F: 'Inmunología'
};

export const CCAA_NAMES: Record<ComunidadAutonomaCode, string> = {
    AND: 'Andalucía',
    ARA: 'Aragón',
    AST: 'Asturias',
    BAL: 'Islas Baleares',
    CAN: 'Canarias',
    CANT: 'Cantabria',
    CYL: 'Castilla y León',
    CLM: 'Castilla-La Mancha',
    CAT: 'Cataluña',
    VAL: 'Comunidad Valenciana',
    EXT: 'Extremadura',
    GAL: 'Galicia',
    MAD: 'Madrid',
    MUR: 'Murcia',
    NAV: 'Navarra',
    PV: 'País Vasco',
    RIO: 'La Rioja',
    CEU: 'Ceuta',
    MEL: 'Melilla'
};
