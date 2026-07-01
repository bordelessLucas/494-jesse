import { format, parseISO } from 'date-fns'

import { duracaoHorasPlantao } from '../dashboard/plantaoHoras'
import { formatarHoraDb } from '../escalas/plantoesDb'
import { formatarRegistroConselho } from '../relatorios/plantoesRelatorioDb'
import { supabase } from '../supabase'

export type LinhaDadosFrequencia = {
  plantaoId: string
  data: string
  dataIso: string
  setor: string
  horaPrevistaEntrada: string
  horaPrevistaSaida: string
  horaRealEntrada: string | null
  horaRealSaida: string | null
  assinaturaEntrada: string
  assinaturaSaida: string
  falta: boolean
  justificativa: string | null
  horasValidadas: number
  statusPlantao: string
}

export type DadosFrequenciaConsolidados = {
  profissionalId: string
  profissionalNome: string
  profissionalConselho: string
  linhas: LinhaDadosFrequencia[]
  totalHorasValidadas: number
  totalFaltas: number
}

type PlantaoFrequenciaRow = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  observacoes: string | null
  motivo_recusa: string | null
  observacao_ajuste: string | null
  setores: { nome: string } | null
}

type RegistroPontoRow = {
  plantao_id: string
  entrada_em: string
  saida_em: string | null
  status: string
}

function formatarDataBr(dataIso: string): string {
  const chave = dataIso.slice(0, 10)
  const [y, m, d] = chave.split('-')
  if (!y || !m || !d) return chave
  return `${d}/${m}/${y}`
}

function formatarHoraIso(iso: string | null): string | null {
  if (!iso) return null
  try {
    return format(parseISO(iso), 'HH:mm')
  } catch {
    return null
  }
}

function calcularHorasValidadas(
  plantao: PlantaoFrequenciaRow,
  registro: RegistroPontoRow | undefined,
): number {
  if (registro?.entrada_em && registro.saida_em) {
    const inicio = parseISO(registro.entrada_em).getTime()
    const fim = parseISO(registro.saida_em).getTime()
    if (fim > inicio) return Math.round(((fim - inicio) / 3_600_000) * 100) / 100
  }

  if (plantao.status === 'realizado') {
    return duracaoHorasPlantao(plantao.data_plantao, plantao.hora_inicio, plantao.hora_fim)
  }

  return 0
}

function detectarFalta(
  plantao: PlantaoFrequenciaRow,
  registro: RegistroPontoRow | undefined,
): boolean {
  if (['cancelado', 'recusado', 'falta', 'ausente'].includes(plantao.status)) {
    return true
  }
  if (plantao.motivo_recusa?.trim()) return true
  if (plantao.status === 'realizado') return false
  if (registro?.entrada_em) return false
  return plantao.status !== 'confirmado' && plantao.status !== 'pendente'
}

function montarJustificativa(plantao: PlantaoFrequenciaRow): string | null {
  const partes = [
    plantao.motivo_recusa?.trim(),
    plantao.observacoes?.trim(),
    plantao.observacao_ajuste?.trim(),
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(' · ') : null
}

function montarLinha(
  plantao: PlantaoFrequenciaRow,
  registro: RegistroPontoRow | undefined,
): LinhaDadosFrequencia {
  const horaRealEntrada = formatarHoraIso(registro?.entrada_em ?? null)
  const horaRealSaida = formatarHoraIso(registro?.saida_em ?? null)
  const falta = detectarFalta(plantao, registro)
  const horasValidadas = falta ? 0 : calcularHorasValidadas(plantao, registro)

  return {
    plantaoId: plantao.id,
    dataIso: plantao.data_plantao.slice(0, 10),
    data: formatarDataBr(plantao.data_plantao),
    setor: plantao.setores?.nome?.trim() || '—',
    horaPrevistaEntrada: formatarHoraDb(plantao.hora_inicio),
    horaPrevistaSaida: formatarHoraDb(plantao.hora_fim),
    horaRealEntrada,
    horaRealSaida,
    assinaturaEntrada: horaRealEntrada ?? (falta ? 'FALTA' : '—'),
    assinaturaSaida: horaRealSaida ?? (falta ? 'FALTA' : '—'),
    falta,
    justificativa: montarJustificativa(plantao),
    horasValidadas,
    statusPlantao: plantao.status,
  }
}

/**
 * Consolida plantões e registros de ponto de um profissional no intervalo indicado.
 */
export async function buscarDadosFrequencia(
  tenantUserId: string,
  profissionalId: string,
  dataInicio: string,
  dataFim: string,
): Promise<DadosFrequenciaConsolidados> {
  if (!tenantUserId || !profissionalId) {
    return {
      profissionalId,
      profissionalNome: '—',
      profissionalConselho: '—',
      linhas: [],
      totalHorasValidadas: 0,
      totalFaltas: 0,
    }
  }

  const { data: profissional, error: erroProf } = await supabase
    .from('profissionais')
    .select('id, nome, sigla_conselho, conselho_numero, registro_uf')
    .eq('user_id', tenantUserId)
    .eq('id', profissionalId)
    .maybeSingle()

  if (erroProf) throw new Error(erroProf.message)

  const { data: plantoes, error: erroPlantoes } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      observacoes,
      motivo_recusa,
      observacao_ajuste,
      setores ( nome )
    `,
    )
    .eq('user_id', tenantUserId)
    .eq('profissional_id', profissionalId)
    .gte('data_plantao', dataInicio)
    .lte('data_plantao', dataFim)
    .order('data_plantao', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (erroPlantoes) throw new Error(erroPlantoes.message)

  const listaPlantoes = (plantoes ?? []) as PlantaoFrequenciaRow[]
  const plantaoIds = listaPlantoes.map((p) => p.id)

  let registros: RegistroPontoRow[] = []
  if (plantaoIds.length > 0) {
    const { data: pontos, error: erroPontos } = await supabase
      .from('registro_ponto')
      .select('plantao_id, entrada_em, saida_em, status')
      .eq('user_id', tenantUserId)
      .eq('profissional_id', profissionalId)
      .in('plantao_id', plantaoIds)

    if (erroPontos) throw new Error(erroPontos.message)
    registros = (pontos ?? []) as RegistroPontoRow[]
  }

  const registroPorPlantao = new Map(registros.map((r) => [r.plantao_id, r]))

  const linhas = listaPlantoes.map((plantao) =>
    montarLinha(plantao, registroPorPlantao.get(plantao.id)),
  )

  const totalHorasValidadas = linhas.reduce((acc, l) => acc + l.horasValidadas, 0)
  const totalFaltas = linhas.filter((l) => l.falta).length

  return {
    profissionalId,
    profissionalNome: profissional?.nome?.trim() || '—',
    profissionalConselho: formatarRegistroConselho(
      profissional
        ? {
            id: profissional.id,
            nome: profissional.nome,
            sigla_conselho: profissional.sigla_conselho,
            conselho_numero: profissional.conselho_numero,
            registro_uf: profissional.registro_uf,
          }
        : null,
    ),
    linhas,
    totalHorasValidadas: Math.round(totalHorasValidadas * 100) / 100,
    totalFaltas,
  }
}

export type ProducaoFrequenciaLinha = {
  profissionalId: string
  profissionalNome: string
  profissionalConselho: string
  totalHorasValidadas: number
  totalFaltas: number
  totalRegistros: number
}

/** Consolida todos os profissionais do tenant numa competência mensal. */
export async function buscarProducaoFrequenciaMes(
  tenantUserId: string,
  competenciaYYYYMM: string,
): Promise<ProducaoFrequenciaLinha[]> {
  if (!tenantUserId || !/^\d{4}-\d{2}$/.test(competenciaYYYYMM)) return []

  const [anoStr, mesStr] = competenciaYYYYMM.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const dataInicio = `${competenciaYYYYMM}-01`
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const dataFim = `${competenciaYYYYMM}-${String(ultimoDia).padStart(2, '0')}`

  const { data: profissionais, error } = await supabase
    .from('profissionais')
    .select('id, nome')
    .eq('user_id', tenantUserId)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)

  const resultados = await Promise.all(
    (profissionais ?? []).map(async (prof) => {
      const dados = await buscarDadosFrequencia(
        tenantUserId,
        prof.id,
        dataInicio,
        dataFim,
      )
      return {
        profissionalId: prof.id,
        profissionalNome: dados.profissionalNome,
        profissionalConselho: dados.profissionalConselho,
        totalHorasValidadas: dados.totalHorasValidadas,
        totalFaltas: dados.totalFaltas,
        totalRegistros: dados.linhas.length,
      }
    }),
  )

  return resultados.filter((r) => r.totalRegistros > 0)
}
