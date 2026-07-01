import { supabase } from '../supabase'
import { formatarHoraDb } from '../escalas/plantoesDb'
import {
  buscarRegrasRemuneracao,
} from '../financeiro/remuneracaoDb'
import type { RegrasRemuneracao } from '../financeiro/remuneracaoTypes'
import {
  calcularValorBrutoComRegras,
  REGRAS_REMUNERACAO_VAZIAS,
} from '../financeiro/extratoCalculos'
import {
  classificarTipoPlantaoRotulo,
  fmtDuracaoHHMM,
  fmtRegistroConselho,
  rotuloLocalSetor,
} from './formatoPegaPlantao'

export type LinhaTrocaPassagem = {
  id: string
  tipo: 'troca' | 'passagem'
  realizadoEm: string
  plantaoRequerenteData: string
  plantaoRequerenteHora: string
  localSetorRequerente: string
  requerenteNome: string
  requeridoNome: string
  plantaoRequeridoData?: string
  plantaoRequeridoHora?: string
  localSetorRequerido?: string
  justificativa: string
}

export type LinhaFaltaRelatorio = {
  id: string
  dataPlantao: string
  horaInicio: string
  horaFim: string
  setorLabel: string
  fixoNome: string
  situacao: string
  responsavelNome: string
  tipo: string
  obsInterna: string
}

export type LinhaCandidaturaRelatorio = {
  id: string
  dataHoraCandidatura: string
  profissionalNome: string
  status: string
  dataPlantao: string
  horaInicio: string
  horaFim: string
  setorLabel: string
}

export type LinhaPlantaoListagem = {
  id: string
  dataPlantao: string
  horaInicio: string
  horaFim: string
  setorLabel: string
  responsavelNome: string
  tipo: string
  valor: number
}

export type LinhaPagamentoPlantao = {
  dataPlantao: string
  horaInicio: string
  horaFim: string
  setorLabel: string
  tipo: string
  duracao: string
  valor: number
}

export type GrupoPagamentoProfissional = {
  profissionalId: string
  profissionalNome: string
  registroConselho: string
  linhas: LinhaPagamentoPlantao[]
  totalPlantoes: number
  totalDuracao: string
  totalValor: number
}

export type LinhaLocalSetorRelatorio = {
  codigoLocal: string
  codigoSetor: string
  localNome: string
  setorNome: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cep: string
  cidade: string
  uf: string
  situacao: string
}

type TrocaQueryRow = {
  id: string
  anunciante_profissional_id: string
  candidato_profissional_id: string
  status: string
  created_at: string
  updated_at: string
  plantoes: {
    id: string
    data_plantao: string
    hora_inicio: string
    hora_fim: string
    observacoes: string | null
    locais: { nome_fantasia: string } | null
    setores: { nome: string } | null
  } | null
  anunciante: { nome: string } | null
  candidato: { nome: string } | null
}

type PlantaoHistoricoJoin = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  observacoes: string | null
  local_id: string
  setor_id: string
  locais: { nome_fantasia: string } | null
  setores: { nome: string } | null
}

type HistoricoEventoQueryRow = {
  id: string
  tipo_evento: string
  situacao_rotulo: string
  realizado_em: string
  plantao_destino_id: string | null
  evento_par_id: string | null
  justificativa: string | null
  observacao_interna: string | null
  plantoes: PlantaoHistoricoJoin | null
  plantao_destino: PlantaoHistoricoJoin | null
  profissional_fixo: { nome: string } | null
  profissional_responsavel: { nome: string } | null
}

const SELECT_HISTORICO_EVENTO = `
  id,
  tipo_evento,
  situacao_rotulo,
  realizado_em,
  plantao_destino_id,
  evento_par_id,
  justificativa,
  observacao_interna,
  plantoes (
    id,
    data_plantao,
    hora_inicio,
    hora_fim,
    observacoes,
    local_id,
    setor_id,
    locais ( nome_fantasia ),
    setores ( nome )
  ),
  plantao_destino:plantoes!plantoes_historico_eventos_plantao_destino_id_fkey (
    id,
    data_plantao,
    hora_inicio,
    hora_fim,
    observacoes,
    local_id,
    setor_id,
    locais ( nome_fantasia ),
    setores ( nome )
  ),
  profissional_fixo:profissionais!plantoes_historico_eventos_profissional_fixo_id_fkey ( nome ),
  profissional_responsavel:profissionais!plantoes_historico_eventos_profissional_responsavel_id_fkey ( nome )
`

const TIPOS_COBERTURA_HISTORICO = [
  'passagem',
  'troca',
  'substituicao_coordenacao',
  'cobertura',
] as const

const TIPOS_FALTA_HISTORICO = [
  ...TIPOS_COBERTURA_HISTORICO,
  'falta_justificada',
  'falta_nao_justificada',
] as const

function situacaoFaltaFromEvento(tipoEvento: string, rotulo: string): string {
  if (tipoEvento === 'falta_justificada') return 'FJ'
  if (tipoEvento === 'falta_nao_justificada') return 'FN'
  return rotulo?.trim() || 'Trocado'
}

function filtrarHistoricoPorLocalSetor(
  rows: HistoricoEventoQueryRow[],
  localId?: string,
  setorIds?: string[],
): HistoricoEventoQueryRow[] {
  let filtradas = rows.filter((r) => r.plantoes)
  if (localId) {
    filtradas = filtradas.filter((r) => r.plantoes?.local_id === localId)
  }
  if (setorIds && setorIds.length > 0) {
    filtradas = filtradas.filter(
      (r) => r.plantoes?.setor_id && setorIds.includes(r.plantoes.setor_id),
    )
  }
  return filtradas
}

function historicoParaTrocasPassagens(rows: HistoricoEventoQueryRow[]): LinhaTrocaPassagem[] {
  const usadas = new Set<string>()
  const saida: LinhaTrocaPassagem[] = []

  for (const row of rows) {
    if (!row.plantoes || usadas.has(row.id)) continue

    const setorReq = rotuloLocalSetor(
      row.plantoes.locais?.nome_fantasia,
      row.plantoes.setores?.nome,
    )
    const requerenteNome = row.profissional_fixo?.nome?.trim() || '—'
    const requeridoNome = row.profissional_responsavel?.nome?.trim() || '—'
    const justificativa =
      row.justificativa?.trim() || row.plantoes.observacoes?.trim() || ''

    if (row.tipo_evento === 'troca' && row.plantao_destino) {
      if (row.evento_par_id) usadas.add(row.evento_par_id)
      usadas.add(row.id)
      const setorPar = rotuloLocalSetor(
        row.plantao_destino.locais?.nome_fantasia,
        row.plantao_destino.setores?.nome,
      )
      saida.push({
        id: row.id,
        tipo: 'troca',
        realizadoEm: row.realizado_em,
        plantaoRequerenteData: row.plantoes.data_plantao,
        plantaoRequerenteHora: row.plantoes.hora_inicio,
        localSetorRequerente: setorReq,
        requerenteNome,
        requeridoNome,
        plantaoRequeridoData: row.plantao_destino.data_plantao,
        plantaoRequeridoHora: row.plantao_destino.hora_inicio,
        localSetorRequerido: setorPar,
        justificativa,
      })
      continue
    }

    if (row.tipo_evento === 'passagem') {
      usadas.add(row.id)
      saida.push({
        id: row.id,
        tipo: 'passagem',
        realizadoEm: row.realizado_em,
        plantaoRequerenteData: row.plantoes.data_plantao,
        plantaoRequerenteHora: row.plantoes.hora_inicio,
        localSetorRequerente: setorReq,
        requerenteNome,
        requeridoNome,
        justificativa,
      })
    }
  }

  return saida.sort(
    (a, b) => new Date(b.realizadoEm).getTime() - new Date(a.realizadoEm).getTime(),
  )
}

type PlantaoDetalheRow = {
  id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  valor_plantao: number | null
  ajuste_financeiro: number | null
  remuneracao_tipo_id: string | null
  local_id: string
  setor_id: string
  status: string
  locais: { nome_fantasia: string } | null
  setores: { nome: string } | null
  profissionais: { nome: string; detalhes?: unknown } | null
}

function mapStatusCandidatura(status: string): string {
  switch (status) {
    case 'aprovada':
      return 'Aceito'
    case 'aguardando_aprovacao_coordenador':
      return 'Pendente'
    case 'reprovada':
      return 'Recusado'
    case 'cancelada':
      return 'Cancelado'
    default:
      return status
  }
}

function especialidadeDoProfissional(detalhes: unknown): string | null {
  if (!detalhes || typeof detalhes !== 'object') return null
  const e = (detalhes as { especialidade?: string }).especialidade
  return typeof e === 'string' && e.trim() ? e.trim() : null
}

function valorPlantaoCalculado(
  row: PlantaoDetalheRow,
  regras: RegrasRemuneracao,
): number {
  const calculo = calcularValorBrutoComRegras(
    {
      dataPlantao: row.data_plantao,
      horaInicio: row.hora_inicio,
      horaFim: row.hora_fim,
      valorPlantaoBase: Number(row.valor_plantao ?? 0),
      remuneracaoTipoId: row.remuneracao_tipo_id ?? null,
      especialidadeProfissional: especialidadeDoProfissional(row.profissionais?.detalhes),
    },
    regras,
  )
  return calculo.valorBruto + Number(row.ajuste_financeiro ?? 0)
}

function emparelharTrocasPassagensLegado(rows: TrocaQueryRow[]): LinhaTrocaPassagem[] {
  const aprovadas = rows.filter((r) => r.status === 'aprovada' && r.plantoes)
  const usadas = new Set<string>()
  const saida: LinhaTrocaPassagem[] = []

  for (const row of aprovadas) {
    if (usadas.has(row.id) || !row.plantoes) continue

    const par = aprovadas.find(
      (outra) =>
        !usadas.has(outra.id) &&
        outra.id !== row.id &&
        outra.anunciante_profissional_id === row.candidato_profissional_id &&
        outra.candidato_profissional_id === row.anunciante_profissional_id &&
        outra.plantoes,
    )

    const setorReq = rotuloLocalSetor(
      row.plantoes.locais?.nome_fantasia,
      row.plantoes.setores?.nome,
    )

    if (par?.plantoes) {
      usadas.add(row.id)
      usadas.add(par.id)
      const setorPar = rotuloLocalSetor(
        par.plantoes.locais?.nome_fantasia,
        par.plantoes.setores?.nome,
      )
      saida.push({
        id: row.id,
        tipo: 'troca',
        realizadoEm: row.updated_at,
        plantaoRequerenteData: row.plantoes.data_plantao,
        plantaoRequerenteHora: row.plantoes.hora_inicio,
        localSetorRequerente: setorReq,
        requerenteNome: row.anunciante?.nome?.trim() || '—',
        requeridoNome: row.candidato?.nome?.trim() || '—',
        plantaoRequeridoData: par.plantoes.data_plantao,
        plantaoRequeridoHora: par.plantoes.hora_inicio,
        localSetorRequerido: setorPar,
        justificativa: row.plantoes.observacoes?.trim() || '',
      })
    } else {
      usadas.add(row.id)
      saida.push({
        id: row.id,
        tipo: 'passagem',
        realizadoEm: row.updated_at,
        plantaoRequerenteData: row.plantoes.data_plantao,
        plantaoRequerenteHora: row.plantoes.hora_inicio,
        localSetorRequerente: setorReq,
        requerenteNome: row.anunciante?.nome?.trim() || '—',
        requeridoNome: row.candidato?.nome?.trim() || '—',
        justificativa: row.plantoes.observacoes?.trim() || '',
      })
    }
  }

  return saida.sort(
    (a, b) => new Date(b.realizadoEm).getTime() - new Date(a.realizadoEm).getTime(),
  )
}

export async function buscarTrocasPassagensRelatorio(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
}): Promise<LinhaTrocaPassagem[]> {
  const { data, error } = await supabase
    .from('plantoes_historico_eventos')
    .select(SELECT_HISTORICO_EVENTO)
    .eq('tenant_user_id', params.tenantUserId)
    .in('tipo_evento', ['passagem', 'troca'])
    .gte('realizado_em', `${params.dataInicio}T00:00:00`)
    .lte('realizado_em', `${params.dataFim}T23:59:59`)

  if (error) throw new Error(error.message)

  let rows = (data ?? []) as unknown as HistoricoEventoQueryRow[]
  rows = filtrarHistoricoPorLocalSetor(rows, params.localId, params.setorIds)

  const linhas = historicoParaTrocasPassagens(rows)
  if (linhas.length > 0) return linhas

  let query = supabase
    .from('plantoes_trocas_solicitacoes')
    .select(
      `
      id,
      anunciante_profissional_id,
      candidato_profissional_id,
      status,
      created_at,
      updated_at,
      plantoes (
        id,
        data_plantao,
        hora_inicio,
        hora_fim,
        observacoes,
        local_id,
        setor_id,
        locais ( nome_fantasia ),
        setores ( nome )
      ),
      anunciante:profissionais!plantoes_trocas_solicitacoes_anunciante_profissional_id_fkey ( nome ),
      candidato:profissionais!plantoes_trocas_solicitacoes_candidato_profissional_id_fkey ( nome )
    `,
    )
    .eq('tenant_user_id', params.tenantUserId)
    .eq('status', 'aprovada')
    .gte('updated_at', `${params.dataInicio}T00:00:00`)
    .lte('updated_at', `${params.dataFim}T23:59:59`)

  const { data: legado, error: erroLegado } = await query
  if (erroLegado) throw new Error(erroLegado.message)

  let rowsLegado = (legado ?? []) as unknown as TrocaQueryRow[]
  if (params.localId) {
    rowsLegado = rowsLegado.filter((r) => {
      const p = r.plantoes as { local_id?: string } | null
      return p?.local_id === params.localId
    })
  }
  if (params.setorIds && params.setorIds.length > 0) {
    rowsLegado = rowsLegado.filter((r) => {
      const p = r.plantoes as { setor_id?: string } | null
      return p?.setor_id && params.setorIds!.includes(p.setor_id)
    })
  }

  return emparelharTrocasPassagensLegado(rowsLegado)
}

export async function buscarFaltasRelatorio(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
}): Promise<LinhaFaltaRelatorio[]> {
  const { data, error } = await supabase
    .from('plantoes_historico_eventos')
    .select(SELECT_HISTORICO_EVENTO)
    .eq('tenant_user_id', params.tenantUserId)
    .in('tipo_evento', [...TIPOS_FALTA_HISTORICO])

  if (error) throw new Error(error.message)

  let rows = (data ?? []) as unknown as HistoricoEventoQueryRow[]

  rows = rows.filter((r) => {
    if (!r.plantoes) return false
    const dataP = r.plantoes.data_plantao.slice(0, 10)
    return dataP >= params.dataInicio && dataP <= params.dataFim
  })

  rows = filtrarHistoricoPorLocalSetor(rows, params.localId, params.setorIds)

  if (rows.length > 0) {
    return rows
      .map((r): LinhaFaltaRelatorio | null => {
        if (!r.plantoes) return null
        return {
          id: r.id,
          dataPlantao: r.plantoes.data_plantao,
          horaInicio: r.plantoes.hora_inicio,
          horaFim: r.plantoes.hora_fim,
          setorLabel: rotuloLocalSetor(
            r.plantoes.locais?.nome_fantasia,
            r.plantoes.setores?.nome,
          ),
          fixoNome: r.profissional_fixo?.nome?.trim() || '—',
          situacao: situacaoFaltaFromEvento(r.tipo_evento, r.situacao_rotulo),
          responsavelNome: r.profissional_responsavel?.nome?.trim() || '—',
          tipo: classificarTipoPlantaoRotulo(r.plantoes.data_plantao, r.plantoes.hora_inicio),
          obsInterna:
            r.observacao_interna?.trim() ||
            r.plantoes.observacoes?.trim() ||
            '',
        }
      })
      .filter((r): r is LinhaFaltaRelatorio => r !== null)
      .sort((a, b) => {
        const cmp = a.dataPlantao.localeCompare(b.dataPlantao)
        if (cmp !== 0) return cmp
        return formatarHoraDb(a.horaInicio).localeCompare(formatarHoraDb(b.horaInicio))
      })
  }

  const { data: legado, error: erroLegado } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .select(
      `
      id,
      status,
      updated_at,
      plantoes (
        id,
        data_plantao,
        hora_inicio,
        hora_fim,
        observacoes,
        local_id,
        setor_id,
        locais ( nome_fantasia ),
        setores ( nome )
      ),
      anunciante:profissionais!plantoes_trocas_solicitacoes_anunciante_profissional_id_fkey ( nome ),
      candidato:profissionais!plantoes_trocas_solicitacoes_candidato_profissional_id_fkey ( nome )
    `,
    )
    .eq('tenant_user_id', params.tenantUserId)
    .eq('status', 'aprovada')

  if (erroLegado) throw new Error(erroLegado.message)

  let rowsLegado = (legado ?? []) as unknown as TrocaQueryRow[]

  rowsLegado = rowsLegado.filter((r) => {
    if (!r.plantoes) return false
    const dataP = r.plantoes.data_plantao.slice(0, 10)
    return dataP >= params.dataInicio && dataP <= params.dataFim
  })

  if (params.localId) {
    rowsLegado = rowsLegado.filter((r) => {
      const p = r.plantoes as { local_id?: string } | null
      return p?.local_id === params.localId
    })
  }
  if (params.setorIds && params.setorIds.length > 0) {
    rowsLegado = rowsLegado.filter((r) => {
      const p = r.plantoes as { setor_id?: string } | null
      return p?.setor_id && params.setorIds!.includes(p.setor_id)
    })
  }

  return rowsLegado
    .map((r): LinhaFaltaRelatorio | null => {
      if (!r.plantoes) return null
      return {
        id: r.id,
        dataPlantao: r.plantoes.data_plantao,
        horaInicio: r.plantoes.hora_inicio,
        horaFim: r.plantoes.hora_fim,
        setorLabel: rotuloLocalSetor(
          r.plantoes.locais?.nome_fantasia,
          r.plantoes.setores?.nome,
        ),
        fixoNome: r.anunciante?.nome?.trim() || '—',
        situacao: 'Trocado',
        responsavelNome: r.candidato?.nome?.trim() || '—',
        tipo: classificarTipoPlantaoRotulo(r.plantoes.data_plantao, r.plantoes.hora_inicio),
        obsInterna: r.plantoes.observacoes?.trim() || '',
      }
    })
    .filter((r): r is LinhaFaltaRelatorio => r !== null)
    .sort((a, b) => {
      const cmp = a.dataPlantao.localeCompare(b.dataPlantao)
      if (cmp !== 0) return cmp
      return formatarHoraDb(a.horaInicio).localeCompare(formatarHoraDb(b.horaInicio))
    })
}

export async function buscarCandidaturasRelatorio(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
}): Promise<LinhaCandidaturaRelatorio[]> {
  const { data, error } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .select(
      `
      id,
      status,
      created_at,
      plantoes (
        data_plantao,
        hora_inicio,
        hora_fim,
        local_id,
        setor_id,
        locais ( nome_fantasia ),
        setores ( nome )
      ),
      candidato:profissionais!plantoes_trocas_solicitacoes_candidato_profissional_id_fkey ( nome )
    `,
    )
    .eq('tenant_user_id', params.tenantUserId)
    .gte('created_at', `${params.dataInicio}T00:00:00`)
    .lte('created_at', `${params.dataFim}T23:59:59`)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  let rows = (data ?? []) as unknown as TrocaQueryRow[]

  if (params.localId) {
    rows = rows.filter((r) => {
      const p = r.plantoes as { local_id?: string } | null
      return p?.local_id === params.localId
    })
  }
  if (params.setorIds && params.setorIds.length > 0) {
    rows = rows.filter((r) => {
      const p = r.plantoes as { setor_id?: string } | null
      return p?.setor_id && params.setorIds!.includes(p.setor_id)
    })
  }

  return rows
    .map((r): LinhaCandidaturaRelatorio | null => {
      if (!r.plantoes) return null
      return {
        id: r.id,
        dataHoraCandidatura: r.created_at,
        profissionalNome: r.candidato?.nome?.trim() || '—',
        status: mapStatusCandidatura(r.status),
        dataPlantao: r.plantoes.data_plantao,
        horaInicio: r.plantoes.hora_inicio,
        horaFim: r.plantoes.hora_fim,
        setorLabel: rotuloLocalSetor(
          r.plantoes.locais?.nome_fantasia,
          r.plantoes.setores?.nome,
        ),
      }
    })
    .filter((r): r is LinhaCandidaturaRelatorio => r !== null)
}

async function buscarPlantoesDetalhados(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
  incluirSetoresInativos?: boolean
}): Promise<PlantaoDetalheRow[]> {
  let query = supabase
    .from('plantoes')
    .select(
      `
      id,
      profissional_id,
      data_plantao,
      hora_inicio,
      hora_fim,
      valor_plantao,
      ajuste_financeiro,
      remuneracao_tipo_id,
      local_id,
      setor_id,
      status,
      locais ( nome_fantasia ),
      setores ( nome, ativo ),
      profissionais ( nome, detalhes )
    `,
    )
    .eq('user_id', params.tenantUserId)
    .gte('data_plantao', params.dataInicio)
    .lte('data_plantao', params.dataFim)
    .not('status', 'eq', 'vago')
    .order('data_plantao')
    .order('hora_inicio')

  if (params.localId) query = query.eq('local_id', params.localId)
  if (params.setorIds && params.setorIds.length > 0) {
    query = query.in('setor_id', params.setorIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let rows = (data ?? []) as PlantaoDetalheRow[]
  if (!params.incluirSetoresInativos) {
    rows = rows.filter((r) => {
      const setor = r.setores as { ativo?: boolean } | null
      return setor?.ativo !== false
    })
  }
  return rows
}

export async function buscarPlantoesListagemRelatorio(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
  incluirSetoresInativos?: boolean
}): Promise<LinhaPlantaoListagem[]> {
  let regras = REGRAS_REMUNERACAO_VAZIAS
  try {
    regras = await buscarRegrasRemuneracao(params.tenantUserId)
  } catch {
    regras = REGRAS_REMUNERACAO_VAZIAS
  }

  const rows = await buscarPlantoesDetalhados(params)

  return rows.map((r) => ({
    id: r.id,
    dataPlantao: r.data_plantao,
    horaInicio: r.hora_inicio,
    horaFim: r.hora_fim,
    setorLabel: rotuloLocalSetor(r.locais?.nome_fantasia, r.setores?.nome),
    responsavelNome: r.profissionais?.nome?.trim() || '—',
    tipo: classificarTipoPlantaoRotulo(r.data_plantao, r.hora_inicio),
    valor: valorPlantaoCalculado(r, regras),
  }))
}

export async function buscarPagamentosDetalhadoRelatorio(params: {
  tenantUserId: string
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
  incluirSetoresInativos?: boolean
}): Promise<GrupoPagamentoProfissional[]> {
  let regras = REGRAS_REMUNERACAO_VAZIAS
  try {
    regras = await buscarRegrasRemuneracao(params.tenantUserId)
  } catch {
    regras = REGRAS_REMUNERACAO_VAZIAS
  }

  const rows = await buscarPlantoesDetalhados(params)

  const { data: profs, error: erroProfs } = await supabase
    .from('profissionais')
    .select('id, nome, conselho_numero, registro_uf')
    .eq('user_id', params.tenantUserId)

  if (erroProfs) throw new Error(erroProfs.message)

  const registroPorId = new Map<string, string>()
  for (const p of profs ?? []) {
    registroPorId.set(
      p.id,
      fmtRegistroConselho(p.conselho_numero, p.registro_uf),
    )
  }

  const grupos = new Map<string, GrupoPagamentoProfissional>()

  for (const r of rows) {
    if (!r.profissional_id) continue
    const valor = valorPlantaoCalculado(r, regras)
    const duracao = fmtDuracaoHHMM(r.data_plantao, r.hora_inicio, r.hora_fim)
    const linha: LinhaPagamentoPlantao = {
      dataPlantao: r.data_plantao,
      horaInicio: r.hora_inicio,
      horaFim: r.hora_fim,
      setorLabel: rotuloLocalSetor(r.locais?.nome_fantasia, r.setores?.nome),
      tipo: classificarTipoPlantaoRotulo(r.data_plantao, r.hora_inicio),
      duracao,
      valor,
    }

    const existente = grupos.get(r.profissional_id)
    if (!existente) {
      grupos.set(r.profissional_id, {
        profissionalId: r.profissional_id,
        profissionalNome: r.profissionais?.nome?.trim() || '—',
        registroConselho: registroPorId.get(r.profissional_id) || '',
        linhas: [linha],
        totalPlantoes: 1,
        totalDuracao: duracao,
        totalValor: valor,
      })
    } else {
      existente.linhas.push(linha)
      existente.totalPlantoes += 1
      existente.totalValor += valor
      const partes = [...existente.linhas.map((l) => l.duracao)]
      existente.totalDuracao = somarDuracoes(partes)
    }
  }

  return [...grupos.values()].sort((a, b) =>
    a.profissionalNome.localeCompare(b.profissionalNome, 'pt-BR'),
  )
}

function somarDuracoes(duracoes: string[]): string {
  let totalMin = 0
  for (const d of duracoes) {
    const [h, m] = d.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) totalMin += h * 60 + m
  }
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function buscarLocaisSetoresRelatorio(
  tenantUserId: string,
  incluirInativos: boolean,
): Promise<LinhaLocalSetorRelatorio[]> {
  let locaisQuery = supabase
    .from('locais')
    .select('id, codigo, nome_fantasia, rua, numero, complemento, bairro, cep, cidade, uf, ativo')
    .eq('user_id', tenantUserId)
    .order('codigo')

  if (!incluirInativos) locaisQuery = locaisQuery.eq('ativo', true)

  const { data: locais, error: erroLocais } = await locaisQuery
  if (erroLocais) throw new Error(erroLocais.message)

  let setoresQuery = supabase
    .from('setores')
    .select('id, local_id, codigo, nome, ativo')
    .eq('user_id', tenantUserId)
    .order('codigo')

  if (!incluirInativos) setoresQuery = setoresQuery.eq('ativo', true)

  const { data: setores, error: erroSetores } = await setoresQuery
  if (erroSetores) throw new Error(erroSetores.message)

  const locaisPorId = new Map((locais ?? []).map((l) => [l.id, l]))
  const saida: LinhaLocalSetorRelatorio[] = []

  for (const setor of setores ?? []) {
    const local = locaisPorId.get(setor.local_id)
    if (!local) continue
    saida.push({
      codigoLocal: local.codigo?.trim() || '—',
      codigoSetor: setor.codigo?.trim() || '—',
      localNome: local.nome_fantasia?.trim() || '—',
      setorNome: setor.nome?.trim() || '—',
      rua: local.rua?.trim() || '',
      numero: local.numero?.trim() || '',
      complemento: local.complemento?.trim() || '',
      bairro: local.bairro?.trim() || '',
      cep: local.cep?.trim() || '',
      cidade: local.cidade?.trim() || '',
      uf: local.uf?.trim() || '',
      situacao: setor.ativo && local.ativo ? 'Habilitado' : 'Desabilitado',
    })
  }

  return saida.sort((a, b) => {
    const cmpLocal = a.localNome.localeCompare(b.localNome, 'pt-BR')
    if (cmpLocal !== 0) return cmpLocal
    return a.setorNome.localeCompare(b.setorNome, 'pt-BR')
  })
}

/** IDs de plantões com cobertura registrada no histórico. */
export async function buscarPlantoesComCobertura(
  tenantUserId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('plantoes_historico_eventos')
    .select('plantao_id')
    .eq('tenant_user_id', tenantUserId)
    .in('tipo_evento', [...TIPOS_COBERTURA_HISTORICO])

  if (error) throw new Error(error.message)

  const ids = new Set<string>()
  for (const row of data ?? []) {
    if (row.plantao_id) ids.add(row.plantao_id)
  }

  if (ids.size > 0) return ids

  const { data: legado, error: erroLegado } = await supabase
    .from('plantoes_trocas_solicitacoes')
    .select('plantao_id')
    .eq('tenant_user_id', tenantUserId)
    .eq('status', 'aprovada')

  if (erroLegado) throw new Error(erroLegado.message)

  for (const row of legado ?? []) {
    if (row.plantao_id) ids.add(row.plantao_id)
  }
  return ids
}
