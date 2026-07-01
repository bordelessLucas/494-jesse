import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'

import { supabase } from '../supabase'
import { buscarCandidaturasPendentes } from './muralTrocasDb'

export type IndicadoresHubEscalas = {
  plantoesMes: number
  plantoesSemana: number
  candidaturasPendentes: number
  totalModelos: number
}

export async function buscarIndicadoresHubEscalas(
  tenantUserId: string,
): Promise<IndicadoresHubEscalas> {
  const hoje = new Date()
  const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd')
  const inicioSemana = format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const fimSemana = format(endOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [mesRes, semanaRes, modelosRes, candidaturas] = await Promise.all([
    supabase
      .from('plantoes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', tenantUserId)
      .gte('data_plantao', inicioMes)
      .lte('data_plantao', fimMes),
    supabase
      .from('plantoes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', tenantUserId)
      .gte('data_plantao', inicioSemana)
      .lte('data_plantao', fimSemana),
    supabase
      .from('escala_modelos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', tenantUserId),
    buscarCandidaturasPendentes(tenantUserId).catch(() => []),
  ])

  if (mesRes.error) throw new Error(mesRes.error.message)
  if (semanaRes.error) throw new Error(semanaRes.error.message)
  if (modelosRes.error) throw new Error(modelosRes.error.message)

  return {
    plantoesMes: mesRes.count ?? 0,
    plantoesSemana: semanaRes.count ?? 0,
    candidaturasPendentes: candidaturas.length,
    totalModelos: modelosRes.count ?? 0,
  }
}
