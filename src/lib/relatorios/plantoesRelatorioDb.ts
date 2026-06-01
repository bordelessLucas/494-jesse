import { endOfMonth, format, startOfMonth } from 'date-fns'

import { supabase } from '../supabase'
import { formatarHoraDb } from '../escalas/plantoesDb'

export type PlantaoRelatorioRow = {
  id: string
  local_id: string
  setor_id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  profissionais: {
    id: string
    nome: string
    sigla_conselho: string
    conselho_numero: string
    registro_uf: string
  } | null
  locais: { nome_fantasia: string } | null
  setores: { nome: string } | null
}

export type LocalRelatorioOpcao = {
  id: string
  nome: string
  cidade: string
  uf: string
  cnpj: string | null
}

/** Plantões com status `realizado` no mês/competência e local indicados. */
export async function buscarPlantoesRealizadosRelatorio(
  tenantUserId: string,
  competenciaYYYYMM: string,
  localId: string,
): Promise<PlantaoRelatorioRow[]> {
  if (!/^\d{4}-\d{2}$/.test(competenciaYYYYMM) || !localId) return []

  const [anoStr, mesStr] = competenciaYYYYMM.split('-')
  const base = new Date(Number(anoStr), Number(mesStr) - 1, 1)
  const dataMin = format(startOfMonth(base), 'yyyy-MM-dd')
  const dataMax = format(endOfMonth(base), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      local_id,
      setor_id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      profissionais (
        id,
        nome,
        sigla_conselho,
        conselho_numero,
        registro_uf
      ),
      locais ( nome_fantasia ),
      setores ( nome )
    `,
    )
    .eq('user_id', tenantUserId)
    .eq('local_id', localId)
    .eq('status', 'realizado')
    .gte('data_plantao', dataMin)
    .lte('data_plantao', dataMax)
    .order('data_plantao', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoRelatorioRow[]
}

export async function buscarLocaisRelatorio(
  tenantUserId: string,
): Promise<LocalRelatorioOpcao[]> {
  const { data, error } = await supabase
    .from('locais')
    .select('id, nome_fantasia, cidade, uf, cnpj')
    .eq('user_id', tenantUserId)
    .eq('ativo', true)
    .order('nome_fantasia', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome_fantasia,
    cidade: row.cidade,
    uf: row.uf,
    cnpj: row.cnpj,
  }))
}

export function formatarRegistroConselho(
  prof: PlantaoRelatorioRow['profissionais'],
): string {
  if (!prof) return '—'
  const sigla = prof.sigla_conselho?.trim() || 'CRM'
  const numero = prof.conselho_numero?.trim()
  const uf = prof.registro_uf?.trim()
  if (!numero) return sigla
  if (uf) return `${sigla}/${uf} ${numero}`
  return `${sigla} ${numero}`
}

export function formatarHorarioPlantao(inicio: string, fim: string): string {
  return `${formatarHoraDb(inicio)} — ${formatarHoraDb(fim)}`
}
