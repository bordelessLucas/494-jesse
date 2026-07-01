import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  buscarPlantoesComCobertura,
  buscarCandidaturasRelatorio,
  buscarFaltasRelatorio,
  buscarLocaisSetoresRelatorio,
  buscarPagamentosDetalhadoRelatorio,
  buscarPlantoesListagemRelatorio,
  buscarTrocasPassagensRelatorio,
  type GrupoPagamentoProfissional,
  type LinhaCandidaturaRelatorio,
  type LinhaFaltaRelatorio,
  type LinhaLocalSetorRelatorio,
  type LinhaPlantaoListagem,
  type LinhaTrocaPassagem,
} from '../lib/relatorios/relatoriosPlantaoDb'
import {
  agregarRankingsMultiplosMeses,
  buscarPlantoesRelatorioEscala,
  buscarTelefonesProfissionais,
  mesesNoIntervalo,
  rpcPlantoesPorMes,
  rpcProfissionaisRanking,
  rpcProfissionaisSobrecarga,
  rpcResumoSetor,
  type PlantoesPorMesRow,
  type ProfissionalRankingRow,
  type ProfissionalSobrecargaRow,
  type ResumoSetorRow,
} from '../lib/dashboard/relatoriosGerenciaisRpc'
import {
  montarGradeEscalaPegaPlantao,
  type SemanaEscalaPega,
} from '../lib/relatorios/montarGradeEscalaPegaPlantao'
import {
  montarGradeEscalaMes,
  rankingParaLinhasPagamento,
  type CelulaCalendarioEscala,
  type FiltroRelatorioEscala,
  type LinhaPagamentoProfissional,
  type PlantaoEscalaRow,
} from '../pages/Dashboard/relatoriosGerenciaisTypes'
import { useTenantUserId } from './useTenantUserId'

const STALE_TIME_MS = 5 * 60 * 1000

type CacheEntry<T> = {
  data: T
  fetchedAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function cacheKey(prefix: string, params: Record<string, unknown>): string {
  return `${prefix}:${JSON.stringify(params)}`
}

function lerCache<T>(key: string): T | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.fetchedAt > STALE_TIME_MS) {
    cache.delete(key)
    return null
  }
  return hit.data as T
}

function gravarCache<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() })
}

export type QueryState<T> = {
  data: T
  isLoading: boolean
  isFetching: boolean
  error: string | null
  refetch: () => void
}

function useQueryRpc<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  initial: T,
): QueryState<T> {
  const [data, setData] = useState<T>(initial)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const executar = useCallback(
    async (modo: 'inicial' | 'refetch') => {
      if (!key) return
      const cached = lerCache<T>(key)
      if (cached !== null) {
        setData(cached)
        setError(null)
        setIsLoading(false)
        return
      }

      if (modo === 'inicial') setIsLoading(true)
      setIsFetching(true)
      setError(null)

      try {
        const result = await fetcherRef.current()
        gravarCache(key, result)
        setData(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar dados.')
      } finally {
        setIsLoading(false)
        setIsFetching(false)
      }
    },
    [key],
  )

  useEffect(() => {
    if (!key) {
      setData(initial)
      setIsLoading(false)
      setError(null)
      return
    }
    void executar('inicial')
  }, [key, executar, initial])

  const refetch = useCallback(() => {
    if (key) cache.delete(key)
    void executar('refetch')
  }, [key, executar])

  return { data, isLoading, isFetching, error, refetch }
}

export type RelatorioEscalaResult = {
  plantoes: PlantaoEscalaRow[]
  grade: CelulaCalendarioEscala[][]
  semanasPega: SemanaEscalaPega[]
}

const ESCALA_VAZIO: RelatorioEscalaResult = { plantoes: [], grade: [], semanasPega: [] }

/** Dados da grade de escala para o relatório gerencial. */
export function useRelatorioEscala(
  filtro: FiltroRelatorioEscala | null,
  enabled = true,
): QueryState<RelatorioEscalaResult> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && filtro && tenantUserId
      ? cacheKey('relatorio-escala', {
          tenantUserId,
          ...filtro,
        })
      : null

  const fetcher = useCallback(async (): Promise<RelatorioEscalaResult> => {
    if (!filtro || !tenantUserId) return ESCALA_VAZIO

    const plantoes = await buscarPlantoesRelatorioEscala({
      tenantUserId,
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
      localId: filtro.localId,
      setorIds: filtro.setorIds,
    })

    const cobertura = await buscarPlantoesComCobertura(tenantUserId)

    const grade = montarGradeEscalaMes(filtro.dataInicio, filtro.dataFim, plantoes, {
      identificarProfissional: filtro.identificarProfissional,
      tipoTurno: filtro.tipoTurno,
      setorIds: filtro.setorIds,
      incluirSetoresInativos: filtro.incluirSetoresInativos,
    })

    const semanasPega = montarGradeEscalaPegaPlantao(
      filtro.dataInicio,
      filtro.dataFim,
      plantoes,
      {
        identificarProfissional: filtro.identificarProfissional,
        tipoTurno: filtro.tipoTurno,
        setorIds: filtro.setorIds,
        incluirSetoresInativos: filtro.incluirSetoresInativos,
        plantoesCobertura: cobertura,
      },
    )

    return { plantoes, grade, semanasPega }
  }, [filtro, tenantUserId])

  return useQueryRpc(key, fetcher, ESCALA_VAZIO)
}

/** Série temporal mensal via RPC plantoes_por_mes. */
export function usePlantoesPorMes(
  localId?: string | null,
  meses = 12,
  enabled = true,
): QueryState<PlantoesPorMesRow[]> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && tenantUserId
      ? cacheKey('plantoes-por-mes', { tenantUserId, localId: localId ?? null, meses })
      : null

  const fetcher = useCallback(
    () => rpcPlantoesPorMes(localId, meses),
    [localId, meses],
  )

  return useQueryRpc(key, fetcher, [])
}

/** Ranking de profissionais por competência (suporta intervalo multi-mês). */
export function useRankingProfissionais(
  competencia: string | null,
  localId?: string | null,
  enabled = true,
): QueryState<ProfissionalRankingRow[]> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && competencia && tenantUserId
      ? cacheKey('ranking-prof', { tenantUserId, competencia, localId: localId ?? null })
      : null

  const fetcher = useCallback(
    () => rpcProfissionaisRanking(competencia!, localId),
    [competencia, localId],
  )

  return useQueryRpc(key, fetcher, [])
}

/** Resumo por setor na competência. */
export function useResumoPorSetor(
  competencia: string | null,
  enabled = true,
): QueryState<ResumoSetorRow[]> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && competencia && tenantUserId
      ? cacheKey('resumo-setor', { tenantUserId, competencia })
      : null

  const fetcher = useCallback(() => rpcResumoSetor(competencia!), [competencia])

  return useQueryRpc(key, fetcher, [])
}

/** Profissionais com sobrecarga (>60h) na semana. */
export function useProfissionaisSobrecarga(
  semanaInicio: string | null,
  enabled = true,
): QueryState<ProfissionalSobrecargaRow[]> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && semanaInicio && tenantUserId
      ? cacheKey('sobrecarga', { tenantUserId, semanaInicio })
      : null

  const fetcher = useCallback(
    () => rpcProfissionaisSobrecarga(semanaInicio!),
    [semanaInicio],
  )

  return useQueryRpc(key, fetcher, [])
}

export type FiltroRelatorioPagamentos = {
  dataInicio: string
  dataFim: string
  localId?: string
  listarTelefone: boolean
}

const PAGAMENTOS_VAZIO: LinhaPagamentoProfissional[] = []

/** Linhas do relatório de pagamentos (ranking agregado no intervalo). */
export function useRelatorioPagamentos(
  filtro: FiltroRelatorioPagamentos | null,
  enabled = true,
): QueryState<LinhaPagamentoProfissional[]> {
  const { tenantUserId } = useTenantUserId()
  const [data, setData] = useState<LinhaPagamentoProfissional[]>(PAGAMENTOS_VAZIO)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key =
    enabled && filtro && tenantUserId
      ? cacheKey('relatorio-pagamentos', { tenantUserId, ...filtro })
      : null

  const executar = useCallback(
    async (modo: 'inicial' | 'refetch') => {
      if (!key || !filtro || !tenantUserId) return

      const cached = lerCache<LinhaPagamentoProfissional[]>(key)
      if (cached !== null) {
        setData(cached)
        setError(null)
        setIsLoading(false)
        return
      }

      if (modo === 'inicial') setIsLoading(true)
      setIsFetching(true)
      setError(null)

      try {
        const meses = mesesNoIntervalo(filtro.dataInicio, filtro.dataFim)
        const rankings = await Promise.all(
          meses.map((m) => rpcProfissionaisRanking(m, filtro.localId ?? null)),
        )
        const agregado = agregarRankingsMultiplosMeses(rankings)
        const telefones = filtro.listarTelefone
          ? await buscarTelefonesProfissionais(
              tenantUserId,
              agregado.map((r) => r.profissional_id),
            )
          : new Map<string, string>()

        const linhas = rankingParaLinhasPagamento(
          agregado,
          telefones,
          filtro.listarTelefone,
        )
        gravarCache(key, linhas)
        setData(linhas)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar pagamentos.')
      } finally {
        setIsLoading(false)
        setIsFetching(false)
      }
    },
    [key, filtro, tenantUserId],
  )

  useEffect(() => {
    if (!key) {
      setData(PAGAMENTOS_VAZIO)
      setIsLoading(false)
      setError(null)
      return
    }
    void executar('inicial')
  }, [key, executar])

  const refetch = useCallback(() => {
    if (key) cache.delete(key)
    void executar('refetch')
  }, [key, executar])

  return useMemo(
    () => ({ data, isLoading, isFetching, error, refetch }),
    [data, isLoading, isFetching, error, refetch],
  )
}

export type FiltroRelatorioPeriodo = {
  dataInicio: string
  dataFim: string
  localId?: string
  setorIds?: string[]
  incluirSetoresInativos?: boolean
}

function useRelatorioGenerico<T>(
  prefixo: string,
  filtro: FiltroRelatorioPeriodo | null,
  enabled: boolean,
  fetcher: (tenantUserId: string, filtro: FiltroRelatorioPeriodo) => Promise<T>,
  vazio: T,
): QueryState<T> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && filtro && tenantUserId
      ? cacheKey(prefixo, { tenantUserId, ...filtro })
      : null

  const executarFetcher = useCallback(async (): Promise<T> => {
    if (!filtro || !tenantUserId) return vazio
    return fetcher(tenantUserId, filtro)
  }, [fetcher, filtro, tenantUserId, vazio])

  return useQueryRpc(key, executarFetcher, vazio)
}

export function useRelatorioTrocasPassagens(
  filtro: FiltroRelatorioPeriodo | null,
  enabled = true,
): QueryState<LinhaTrocaPassagem[]> {
  return useRelatorioGenerico(
    'relatorio-trocas',
    filtro,
    enabled,
    (tenantUserId, f) => buscarTrocasPassagensRelatorio({ tenantUserId, ...f }),
    [],
  )
}

export function useRelatorioFaltas(
  filtro: FiltroRelatorioPeriodo | null,
  enabled = true,
): QueryState<LinhaFaltaRelatorio[]> {
  return useRelatorioGenerico(
    'relatorio-faltas',
    filtro,
    enabled,
    (tenantUserId, f) => buscarFaltasRelatorio({ tenantUserId, ...f }),
    [],
  )
}

export function useRelatorioCandidaturas(
  filtro: FiltroRelatorioPeriodo | null,
  enabled = true,
): QueryState<LinhaCandidaturaRelatorio[]> {
  return useRelatorioGenerico(
    'relatorio-candidaturas',
    filtro,
    enabled,
    (tenantUserId, f) => buscarCandidaturasRelatorio({ tenantUserId, ...f }),
    [],
  )
}

export function useRelatorioPlantoesListagem(
  filtro: FiltroRelatorioPeriodo | null,
  enabled = true,
): QueryState<LinhaPlantaoListagem[]> {
  return useRelatorioGenerico(
    'relatorio-plantoes',
    filtro,
    enabled,
    (tenantUserId, f) => buscarPlantoesListagemRelatorio({ tenantUserId, ...f }),
    [],
  )
}

export function useRelatorioPagamentosDetalhado(
  filtro: FiltroRelatorioPeriodo | null,
  enabled = true,
): QueryState<GrupoPagamentoProfissional[]> {
  return useRelatorioGenerico(
    'relatorio-pagamentos-detalhe',
    filtro,
    enabled,
    (tenantUserId, f) => buscarPagamentosDetalhadoRelatorio({ tenantUserId, ...f }),
    [],
  )
}

export function useRelatorioLocaisSetores(
  incluirInativos: boolean,
  enabled = true,
): QueryState<LinhaLocalSetorRelatorio[]> {
  const { tenantUserId } = useTenantUserId()

  const key =
    enabled && tenantUserId
      ? cacheKey('relatorio-locais-setores', { tenantUserId, incluirInativos })
      : null

  const fetcher = useCallback(
    () => buscarLocaisSetoresRelatorio(tenantUserId!, incluirInativos),
    [incluirInativos, tenantUserId],
  )

  return useQueryRpc(key, fetcher, [])
}

/** Invalida cache de relatórios gerenciais (ex.: após gerar novo relatório). */
export function invalidarCacheRelatoriosGerenciais(): void {
  for (const k of cache.keys()) {
    if (
      k.startsWith('relatorio-') ||
      k.startsWith('plantoes-por-mes:') ||
      k.startsWith('ranking-prof:') ||
      k.startsWith('resumo-setor:') ||
      k.startsWith('sobrecarga:')
    ) {
      cache.delete(k)
    }
  }
}
