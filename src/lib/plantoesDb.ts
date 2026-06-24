import { endOfMonth, format, startOfMonth } from 'date-fns'

import { supabase } from './supabase'
import type { PlantaoRowDb } from './escalas/plantoesDb'

export async function buscarPlantoesMensais(
  mes: number,
  ano: number,
  localId: string,
  setorId: string,
  userId?: string,
): Promise<PlantaoRowDb[]> {
  const inicio = startOfMonth(new Date(ano, mes - 1, 1))
  const fim = endOfMonth(inicio)

  const dataMinIso = format(inicio, 'yyyy-MM-dd')
  const dataMaxIso = format(fim, 'yyyy-MM-dd')

  const resolvedUserId =
    userId ??
    (await supabase.auth.getUser()).data.user?.id ??
    null

  if (!resolvedUserId) return []

  let q = supabase
    .from('plantoes')
    .select(
      `
      id,
      user_id,
      local_id,
      setor_id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      observacoes,
      valor_plantao,
      ajuste_financeiro,
      observacao_ajuste,
      confirmado_profissional,
      data_confirmacao_profissional,
      motivo_recusa,
      escala_confirmacoes ( status, motivo_recusa, confirmado_em ),
      profissionais ( id, nome )
    `,
    )
    .eq('user_id', resolvedUserId)
    .gte('data_plantao', dataMinIso)
    .lte('data_plantao', dataMaxIso)

  if (localId) q = q.eq('local_id', localId)
  if (setorId) q = q.eq('setor_id', setorId)

  const { data, error } = await q.order('data_plantao', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PlantaoRowDb[]
}

