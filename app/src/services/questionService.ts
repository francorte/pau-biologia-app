/**
 * Servicio de gestión de preguntas PAU Biología
 * Para usar con Supabase en aplicación Lovable/React
 */

import { supabase } from '@/integrations/supabase/client';
import type { QuestionFilters } from '@/types/questionClassification';

// Obtener preguntas con filtros y paginación
export async function getQuestions(filters: QuestionFilters = {}, page = 1, pageSize = 10) {
    let query = supabase
      .from('questions')
      .select(`
            *,
                  block:blocks(id, name, code),
                        subquestions(id, label, statement, order_index, puntuacion, has_image, image_url)
                            `, { count: 'exact' })
      .eq('active', true)
      .order('year', { ascending: false });

  if (filters.block_id) query = query.eq('block_id', filters.block_id);
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.tipo_examen) query = query.eq('tipo_examen', filters.tipo_examen);
    if (filters.codigo_ccaa) query = query.eq('codigo_ccaa', filters.codigo_ccaa);
    if (filters.dificultad) query = query.eq('dificultad', filters.dificultad);

  const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
    if (error) throw error;

  return { data: data || [], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) };
}

// Obtener una pregunta por ID
export async function getQuestionById(questionId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select(`
            *,
                  block:blocks(id, name, code),
                        subquestions(id, label, statement, order_index, puntuacion, has_image, image_url, solutions(id, content))
                            `)
      .eq('id', questionId)
      .single();

  if (error) throw error;
    return data;
}

// Obtener preguntas aleatorias
export async function getRandomQuestions(count: number, filters: QuestionFilters = {}) {
    let query = supabase.from('questions').select('id').eq('active', true);
    if (filters.block_id) query = query.eq('block_id', filters.block_id);

  const { data: ids } = await query;
    if (!ids?.length) return [];

  const shuffled = ids.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, count).map(q => q.id);

  const { data } = await supabase
      .from('questions')
      .select(`*, block:blocks(id, name, code), subquestions(*)`)
      .in('id', selectedIds);

  return data || [];
}

// Estadísticas
export async function getQuestionStats() {
    const { data } = await supabase
      .from('questions')
      .select(`id, block_id, year, dificultad, tipo_examen, has_image, block:blocks(code)`)
      .eq('active', true);

  const stats = { total: 0, byBlock: {}, byYear: {}, withImages: 0 };
    data?.forEach(q => {
          stats.total++;
          const code = (q.block as any)?.code || 'X';
          stats.byBlock[code] = (stats.byBlock[code] || 0) + 1;
          if (q.year) stats.byYear[q.year] = (stats.byYear[q.year] || 0) + 1;
          if (q.has_image) stats.withImages++;
    });
    return stats;
}

// Bloques y CCAA
export async function getBlocks() {
    const { data } = await supabase.from('blocks').select('*').order('code');
    return data || [];
}

export async function getComunidadesAutonomas() {
    const { data } = await supabase.from('comunidades_autonomas').select('*').order('nombre');
    return data || [];
}
