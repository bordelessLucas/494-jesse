import { parseISO } from 'date-fns'

import { supabase } from '../supabase'

import type { PlantaoCartao, StatusPlantaoEscala, TomCartao } from './escalaTypes'

type ProfissionalJoin = { id: string; nome: string } | null

export type PlantaoRowDb = {
  id: string
  user_id: string
  local_id: string
  setor_id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: StatusPlantaoEscala
  disponivel_mural?: boolean
  observacoes: string | null
  valor_plantao?: number
  ajuste_financeiro?: number
  observacao_ajuste?: string | null
  profissionais?: ProfissionalJoin
}

export function formatarHoraDb(valor: string): string {
  if (!valor) return '00:00'
  const part = valor.slice(0, 5)
  if (/^\d{2}:\d{2}$/.test(part)) return part
  return '00:00'
}

export function tomParaData(d: Date): TomCartao {
  const dow = d.getDay()
  return dow === 0 || dow === 6 ? 'fds' : 'util'
}

/** Garante YYYY-MM-DD para comparação (API pode devolver ISO com hora). */
export function chaveDataPlantaoDb(valor: string | null | undefined): string {
  if (valor == null || valor === '') return ''
  const s = String(valor).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s.slice(0, 10)
}

/** Data local ao meio-dia a partir de YYYY-MM-DD (evita deslocar o dia com UTC). */
export function dataLocalAPartirDeIsoData(isoData: string): Date {
  const chave = chaveDataPlantaoDb(isoData)
  const partes = chave.split('-').map(Number)
  const [y, mo, d] = partes
  if (!y || !mo || !d) return parseISO(chave)
  return new Date(y, mo - 1, d, 12, 0, 0, 0)
}

export function plantaoRowParaCartao(row: PlantaoRowDb): PlantaoCartao {
  const d = dataLocalAPartirDeIsoData(row.data_plantao)
  const nome =
    row.status === 'vago'
      ? 'Vago'
      : row.profissionais?.nome?.trim() || 'Sem profissional'
  return {
    id: row.id,
    nome,
    horaInicio: formatarHoraDb(row.hora_inicio),
    horaFim: formatarHoraDb(row.hora_fim),
    tom: tomParaData(d),
    status: row.status,
    profissionalId: row.profissional_id,
  }
}

export async function buscarPlantoesIntervalo(
  userId: string,
  dataMinIso: string,
  dataMaxIso: string,
): Promise<PlantaoRowDb[]> {
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
      disponivel_mural,
      observacoes,
      valor_plantao,
      ajuste_financeiro,
      observacao_ajuste,
      profissionais ( id, nome )
    `,
    )
    .eq('user_id', userId)
    .gte('data_plantao', dataMinIso)
    .lte('data_plantao', dataMaxIso)
    .order('data_plantao', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlantaoRowDb[]
}

export type LocalEscalaOpcao = { id: string; nome: string }

export async function buscarLocaisEscala(userId: string): Promise<LocalEscalaOpcao[]> {
  const { data, error } = await supabase
    .from('locais')
    .select('id, nome_fantasia, ativo')
    .eq('user_id', userId)
    .eq('ativo', true)
    .order('nome_fantasia', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ id: r.id, nome: r.nome_fantasia }))
}

export type SetorEscalaDb = {
  id: string
  nome: string
  local_id: string
  ativo: boolean
}

export async function buscarSetoresEscala(userId: string): Promise<SetorEscalaDb[]> {
  const { data, error } = await supabase
    .from('setores')
    .select('id, nome, local_id, ativo')
    .eq('user_id', userId)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as SetorEscalaDb[]
}

export type ProfissionalEscalaRow = {
  id: string
  nome: string
  sigla_conselho: string
}

export async function buscarProfissionaisEscala(
  userId: string,
): Promise<ProfissionalEscalaRow[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome, sigla_conselho')
    .eq('user_id', userId)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ProfissionalEscalaRow[]
}

/** Dados extra para colunas Reg. Prof. e CPF em exportações (relatórios). */
export async function buscarProfissionaisRelatorioEscala(userId: string): Promise<
  Record<
    string,
    {
      nome: string
      registroProfissional: string
      cpf: string | null
    }
  >
> {
  const { data, error } = await supabase
    .from('profissionais')
    .select('id, nome, sigla_conselho, conselho_numero, registro_uf, cpf')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  const out: Record<
    string,
    { nome: string; registroProfissional: string; cpf: string | null }
  > = {}

  for (const p of data ?? []) {
    const partesReg = [p.sigla_conselho, p.conselho_numero].filter(
      (x): x is string => typeof x === 'string' && x.trim().length > 0,
    )
    let registro = partesReg.join(' ')
    if (p.registro_uf && String(p.registro_uf).trim().length > 0) {
      registro = registro ? `${registro}/${p.registro_uf}` : String(p.registro_uf)
    }
    if (!registro) registro = '/'

    out[p.id] = {
      nome: p.nome,
      registroProfissional: registro,
      cpf: p.cpf,
    }
  }

  return out
}
