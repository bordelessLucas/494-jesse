import { supabase } from '../supabase'
import type { PlantaoRowDb } from '../escalas/plantoesDb'

type ProfissionalDashboardJoin = {
  id: string
  nome: string
  detalhes?: unknown
} | null

export type PlantaoDashboardRow = PlantaoRowDb & {
  remuneracao_tipo_id?: string | null
  locais?: { nome_fantasia: string } | null
  setores?: { nome: string } | null
  profissionais?: ProfissionalDashboardJoin
}

export async function buscarPlantoesIntervaloComLocaisSetores(
  userId: string,
  dataMinIso: string,
  dataMaxIso: string,
): Promise<PlantaoDashboardRow[]> {
  const { data, error } = await supabase
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
      remuneracao_tipo_id,
      ajuste_financeiro,
      observacao_ajuste,
      profissionais ( id, nome, detalhes ),
      locais ( nome_fantasia ),
      setores ( nome )
    `,
    )
    .eq('user_id', userId)
    .gte('data_plantao', dataMinIso)
    .lte('data_plantao', dataMaxIso)
    .order('data_plantao', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoDashboardRow[]
}

export type ProfissionalCargaRow = {
  id: string
  nome: string
  profissao: string
  email: string | null
  detalhes: unknown
  locais: { nome_fantasia: string } | null
}

export async function buscarProfissionaisComLocal(
  userId: string,
): Promise<ProfissionalCargaRow[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select(
      `
      id,
      nome,
      profissao,
      email,
      detalhes,
      locais ( nome_fantasia )
    `,
    )
    .eq('user_id', userId)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProfissionalCargaRow[]
}

/** Correspondência do profissional «eu» pelo e-mail da sessão (coluna ou detalhes). */
export function profissionalIdPorEmailPreferido(
  rows: ProfissionalCargaRow[],
  emailSessao: string | null | undefined,
): string | null {
  if (!emailSessao?.trim()) return null
  const alvo = emailSessao.trim().toLowerCase()
  for (const r of rows) {
    if (r.email?.trim().toLowerCase() === alvo) return r.id
    const d = r.detalhes as { email?: string } | null
    if (d?.email?.trim().toLowerCase() === alvo) return r.id
  }
  return null
}

export const STORAGE_MINHA_AGENDA_PROFISSIONAL = 'minha-agenda-profissional-id'

export async function buscarPlantoesDoProfissional(
  userId: string,
  profissionalId: string,
  dataMinIso: string,
  dataMaxIso: string,
): Promise<PlantaoDashboardRow[]> {
  const { data, error } = await supabase
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
      remuneracao_tipo_id,
      ajuste_financeiro,
      observacao_ajuste,
      profissionais ( id, nome, detalhes ),
      locais ( nome_fantasia ),
      setores ( nome )
    `,
    )
    .eq('user_id', userId)
    .eq('profissional_id', profissionalId)
    .gte('data_plantao', dataMinIso)
    .lte('data_plantao', dataMaxIso)
    .order('data_plantao', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoDashboardRow[]
}
