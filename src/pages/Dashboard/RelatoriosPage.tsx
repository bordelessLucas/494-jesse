import { format } from 'date-fns'
import { Loader2, Printer, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'

import { useCatalogoLocaisSetores } from '../../hooks/useCatalogoLocaisSetores'
import { useContaMembro } from '../../hooks/useContaMembro'
import {
  invalidarCacheRelatoriosGerenciais,
  useRelatorioEscala,
  useRelatorioPagamentos,
} from '../../hooks/useRelatoriosGerenciais'
import { cn } from '../../lib/cn'
import { capturarPreviewComoPdf } from '../../lib/relatorios/capturarPreviewComoPdf'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'
import { RelatorioEscalaFolha } from './components/RelatorioEscalaFolha'
import { RelatorioPagamentosFolha } from './components/RelatorioPagamentosFolha'
import {
  competenciaDeData,
  GRUPOS_OPCOES,
  intervaloPorPreset,
  periodoPadraoMesAtual,
  type FiltroRelatorioEscala,
  type PeriodoRelatorioPreset,
  type TipoRelatorioGerador,
} from './relatoriosGerenciaisTypes'

type FiltrosGerador = {
  tipoRelatorio: TipoRelatorioGerador
  listarTelefone: boolean
  localId: string
  setorIds: string[]
  grupo: string
  presetPeriodo: PeriodoRelatorioPreset
  dataInicio: string
  dataFim: string
  tipo: string
  setoresDesabilitados: 'nao' | 'sim'
  identificarProfissional: string
  tipoEscala: string
}

const LABEL =
  'mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-500'
const INPUT =
  'w-full min-w-0 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'
const SELECT = INPUT

const TODOS_LOCAIS = ''
const TODOS_SETORES = '__todos__'

function filtrosIniciais(): FiltrosGerador {
  const { inicio, fim } = periodoPadraoMesAtual()
  return {
    tipoRelatorio: 'pagamentos',
    listarTelefone: false,
    localId: TODOS_LOCAIS,
    setorIds: [],
    grupo: 'Todos',
    presetPeriodo: 'mes',
    dataInicio: inicio,
    dataFim: fim,
    tipo: 'Todos',
    setoresDesabilitados: 'nao',
    identificarProfissional: 'Nome completo',
    tipoEscala: 'Mensal',
  }
}

function CampoFiltro({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-[88px]', className)}>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
      {children}
    </div>
  )
}

function mapFiltroEscala(f: FiltrosGerador): FiltroRelatorioEscala {
  return {
    localId: f.localId || undefined,
    setorIds: f.setorIds.length > 0 ? f.setorIds : undefined,
    dataInicio: f.dataInicio,
    dataFim: f.dataFim,
    competencia: competenciaDeData(f.dataInicio),
    tipo: f.tipoEscala as FiltroRelatorioEscala['tipo'],
    tipoTurno: f.tipo as FiltroRelatorioEscala['tipoTurno'],
    identificarProfissional:
      f.identificarProfissional as FiltroRelatorioEscala['identificarProfissional'],
    incluirSetoresInativos: f.setoresDesabilitados === 'sim',
  }
}

export function RelatoriosPage() {
  const { empresa } = useContaMembro()
  const { logoUrl } = useThemeBranding()
  const { locais, setoresPorLocalId } = useCatalogoLocaisSetores()
  const nomeEmpresa = empresa?.nome?.trim() || 'PlantaoCheck'
  const previewRef = useRef<HTMLElement>(null)

  const [filtros, setFiltros] = useState<FiltrosGerador>(filtrosIniciais)
  const [filtrosGerados, setFiltrosGerados] = useState<FiltrosGerador | null>(null)
  const [dataGeracao, setDataGeracao] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [exportandoXls, setExportandoXls] = useState(false)
  const [exportandoPdf, setExportandoPdf] = useState(false)

  const setoresDisponiveis = useMemo(() => {
    if (!filtros.localId) {
      return locais.flatMap((l) => setoresPorLocalId[l.id] ?? [])
    }
    return setoresPorLocalId[filtros.localId] ?? []
  }, [filtros.localId, locais, setoresPorLocalId])

  const filtroEscala = useMemo(
    () => (filtrosGerados ? mapFiltroEscala(filtrosGerados) : null),
    [filtrosGerados],
  )

  const filtroPagamentos = useMemo(
    () =>
      filtrosGerados
        ? {
            dataInicio: filtrosGerados.dataInicio,
            dataFim: filtrosGerados.dataFim,
            localId: filtrosGerados.localId || undefined,
            listarTelefone: filtrosGerados.listarTelefone,
          }
        : null,
    [filtrosGerados],
  )

  const relatorioAtivo = filtrosGerados !== null
  const isEscala = filtrosGerados?.tipoRelatorio === 'escala'

  const escalaQuery = useRelatorioEscala(
    filtroEscala,
    relatorioAtivo && isEscala,
  )
  const pagamentosQuery = useRelatorioPagamentos(
    filtroPagamentos,
    relatorioAtivo && !isEscala,
  )

  const queryAtiva = isEscala ? escalaQuery : pagamentosQuery
  const isLoading = queryAtiva.isLoading
  const error = queryAtiva.error

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const alternarSelecao = useCallback((id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function patchFiltros<K extends keyof FiltrosGerador>(
    campo: K,
    valor: FiltrosGerador[K],
  ) {
    setFiltros((p) => ({ ...p, [campo]: valor }))
  }

  function aplicarPresetPeriodo(preset: PeriodoRelatorioPreset) {
    if (preset === 'personalizado') {
      patchFiltros('presetPeriodo', preset)
      return
    }
    const { inicio, fim } = intervaloPorPreset(preset)
    setFiltros((p) => ({
      ...p,
      presetPeriodo: preset,
      dataInicio: inicio,
      dataFim: fim,
    }))
  }

  function alternarSetor(setorId: string) {
    setFiltros((p) => {
      const tem = p.setorIds.includes(setorId)
      return {
        ...p,
        setorIds: tem
          ? p.setorIds.filter((s) => s !== setorId)
          : [...p.setorIds, setorId],
      }
    })
  }

  function gerarRelatorio() {
    if (filtros.dataInicio > filtros.dataFim) {
      toast.error('A data de início deve ser anterior à data final.')
      return
    }
    invalidarCacheRelatoriosGerenciais()
    setFiltrosGerados({ ...filtros })
    setDataGeracao(format(new Date(), 'dd/MM/yyyy HH:mm'))
    setSelecionados(new Set())
  }

  function tentarNovamente() {
    invalidarCacheRelatoriosGerenciais()
    queryAtiva.refetch()
  }

  async function exportarXls() {
    if (!filtrosGerados) {
      toast.error('Gere o relatório antes de exportar.')
      return
    }

    setExportandoXls(true)
    try {
      const { exportarRelatorioGerencialParaXlsx } = await import(
        '../../lib/relatorios/exportarRelatorioGerencialXlsx'
      )
      await exportarRelatorioGerencialParaXlsx({
        tipoRelatorio: filtrosGerados.tipoRelatorio,
        nomePlataforma: 'PlantaoCheck',
        nomeEmpresa,
        logoUrl,
        dataInicio: filtrosGerados.dataInicio,
        dataFim: filtrosGerados.dataFim,
        dataGeracao,
        listarTelefone: filtrosGerados.listarTelefone,
        linhasPagamentos:
          filtrosGerados.tipoRelatorio === 'pagamentos'
            ? pagamentosQuery.data
            : undefined,
      })
      toast.success('Planilha exportada com sucesso.')
    } catch {
      toast.error('Não foi possível exportar a planilha.')
    } finally {
      setExportandoXls(false)
    }
  }

  async function imprimirOuGerarPdf() {
    if (!filtrosGerados || !previewRef.current) {
      toast.error('Gere o relatório antes de imprimir.')
      return
    }

    setExportandoPdf(true)
    try {
      const bytes = await capturarPreviewComoPdf(previewRef.current, {
        orientacao: 'landscape',
        seletorPagina: '.relatorio-gerencial-folha',
      })
      const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const slug =
        filtrosGerados.tipoRelatorio === 'pagamentos'
          ? 'pagamentos-plantoes'
          : 'escala-plantoes'
      const nomeArquivo = `relatorio-gerencial-${slug}.pdf`

      const linkDownload = document.createElement('a')
      linkDownload.href = url
      linkDownload.download = nomeArquivo
      linkDownload.rel = 'noopener'
      document.body.appendChild(linkDownload)
      linkDownload.click()
      document.body.removeChild(linkDownload)

      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      toast.success('PDF gerado. Use o visualizador para imprimir em paisagem.')
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setExportandoPdf(false)
    }
  }

  const relatorioVisivel = filtrosGerados !== null && !isLoading && !error
  const nomeSetor = (id: string) =>
    setoresDisponiveis.find((s) => s.id === id)?.nome ?? id

  return (
    <div className="relative -mx-4 -mt-4 min-h-[calc(100dvh-4rem)] bg-slate-100 md:-mx-8 md:-mt-8">
      <div className="no-print border-b border-gray-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
          <CampoFiltro label="Relatório" htmlFor="filtro-relatorio" className="min-w-[140px]">
            <select
              id="filtro-relatorio"
              className={SELECT}
              value={filtros.tipoRelatorio}
              onChange={(e) =>
                patchFiltros('tipoRelatorio', e.target.value as TipoRelatorioGerador)
              }
            >
              <option value="escala">Escala de Plantões</option>
              <option value="pagamentos">Pagamentos para Plantões</option>
            </select>
          </CampoFiltro>

          <CampoFiltro label="Local" htmlFor="filtro-local" className="min-w-[120px]">
            <select
              id="filtro-local"
              className={SELECT}
              value={filtros.localId}
              onChange={(e) => {
                patchFiltros('localId', e.target.value)
                patchFiltros('setorIds', [])
              }}
            >
              <option value={TODOS_LOCAIS}>Todos os locais</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Período" htmlFor="filtro-periodo" className="min-w-[100px]">
            <select
              id="filtro-periodo"
              className={SELECT}
              value={filtros.presetPeriodo}
              onChange={(e) =>
                aplicarPresetPeriodo(e.target.value as PeriodoRelatorioPreset)
              }
            >
              <option value="semana">Semana</option>
              <option value="mes">Mês</option>
              <option value="trimestre">Trimestre</option>
              <option value="ano">Ano</option>
              <option value="ytd">YTD</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </CampoFiltro>

          <div className="flex min-w-[180px] items-end pb-0.5">
            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-gray-700">
              <input
                type="checkbox"
                checked={filtros.listarTelefone}
                onChange={(e) => patchFiltros('listarTelefone', e.target.checked)}
                className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              <span className="font-medium leading-tight">
                Listar telefone dos profissionais de plantão
              </span>
            </label>
          </div>

          <CampoFiltro label="Setor(es)" className="min-w-[120px]">
            <div className="flex items-center gap-1">
              <select
                className={cn(SELECT, 'flex-1')}
                value=""
                onChange={(e) => {
                  if (e.target.value && e.target.value !== TODOS_SETORES) {
                    alternarSetor(e.target.value)
                  }
                  e.target.value = ''
                }}
              >
                <option value="">Selecionar…</option>
                {setoresDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {filtros.setorIds.includes(s.id) ? '✓ ' : ''}
                    {s.nome}
                  </option>
                ))}
              </select>
              {filtros.setorIds.length > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {filtros.setorIds.length}
                </span>
              ) : null}
            </div>
          </CampoFiltro>

          <CampoFiltro label="Grupo(s)" htmlFor="filtro-grupo" className="min-w-[100px]">
            <select
              id="filtro-grupo"
              className={SELECT}
              value={filtros.grupo}
              onChange={(e) => patchFiltros('grupo', e.target.value)}
            >
              {GRUPOS_OPCOES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </CampoFiltro>

          <CampoFiltro label="Data de Início" htmlFor="filtro-inicio" className="min-w-[108px]">
            <input
              id="filtro-inicio"
              type="date"
              className={INPUT}
              value={filtros.dataInicio}
              onChange={(e) => {
                patchFiltros('dataInicio', e.target.value)
                patchFiltros('presetPeriodo', 'personalizado')
              }}
            />
          </CampoFiltro>

          <CampoFiltro label="Data Final" htmlFor="filtro-fim" className="min-w-[108px]">
            <input
              id="filtro-fim"
              type="date"
              className={INPUT}
              value={filtros.dataFim}
              onChange={(e) => {
                patchFiltros('dataFim', e.target.value)
                patchFiltros('presetPeriodo', 'personalizado')
              }}
            />
          </CampoFiltro>

          <CampoFiltro label="Tipo" htmlFor="filtro-tipo" className="min-w-[80px]">
            <select
              id="filtro-tipo"
              className={SELECT}
              value={filtros.tipo}
              onChange={(e) => patchFiltros('tipo', e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Diurno">Diurno</option>
              <option value="Noturno">Noturno</option>
              <option value="24h">24h</option>
            </select>
          </CampoFiltro>

          <CampoFiltro
            label="Setores Desabilitados"
            htmlFor="filtro-set-desab"
            className="min-w-[100px]"
          >
            <select
              id="filtro-set-desab"
              className={SELECT}
              value={filtros.setoresDesabilitados}
              onChange={(e) =>
                patchFiltros('setoresDesabilitados', e.target.value as 'nao' | 'sim')
              }
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </select>
          </CampoFiltro>

          <CampoFiltro
            label="Identificar Profissional"
            htmlFor="filtro-ident"
            className="min-w-[120px]"
          >
            <select
              id="filtro-ident"
              className={SELECT}
              value={filtros.identificarProfissional}
              onChange={(e) => patchFiltros('identificarProfissional', e.target.value)}
            >
              <option value="Nome completo">Nome completo</option>
              <option value="Nome abreviado">Nome abreviado</option>
              <option value="CRM">CRM</option>
            </select>
          </CampoFiltro>

          <CampoFiltro
            label="Tipo de Escala"
            htmlFor="filtro-tipo-escala"
            className="min-w-[100px]"
          >
            <select
              id="filtro-tipo-escala"
              className={SELECT}
              value={filtros.tipoEscala}
              onChange={(e) => patchFiltros('tipoEscala', e.target.value)}
            >
              <option value="Mensal">Mensal</option>
              <option value="Semanal">Semanal</option>
              <option value="Quinzenal">Quinzenal</option>
            </select>
          </CampoFiltro>

          <div className="flex items-end gap-1.5 pb-0.5">
            <button
              type="button"
              disabled={isLoading && relatorioAtivo}
              onClick={gerarRelatorio}
              className="rounded border border-primary bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading && relatorioAtivo ? 'A carregar…' : 'Gerar'}
            </button>
            <button
              type="button"
              disabled={isLoading || exportandoXls || !relatorioVisivel}
              onClick={() => void exportarXls()}
              className="rounded border border-primary bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-50 disabled:opacity-50"
            >
              {exportandoXls ? 'Exportando…' : 'XLS'}
            </button>
            <button
              type="button"
              disabled={isLoading || exportandoPdf || !relatorioVisivel}
              onClick={() => void imprimirOuGerarPdf()}
              className="inline-flex items-center gap-1 rounded border border-primary bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-50 disabled:opacity-50"
            >
              {exportandoPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Printer className="h-3.5 w-3.5" aria-hidden />
              )}
              {exportandoPdf ? 'Gerando…' : 'Imprimir / PDF'}
            </button>
          </div>
        </div>

        {filtros.setorIds.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {filtros.setorIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => alternarSetor(id)}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-slate-200"
              >
                {nomeSetor(id)} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-4 pb-12 pt-6 md:px-8">
        {relatorioAtivo && isLoading ? (
          <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              A carregar dados do Supabase…
            </div>
            <div className="mt-6 animate-pulse space-y-3">
              <div className="h-6 w-1/3 rounded bg-gray-200" />
              <div className="h-40 rounded bg-gray-100" />
            </div>
          </div>
        ) : relatorioAtivo && error ? (
          <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-6 text-center shadow-md">
            <p className="text-sm font-medium text-red-800">Erro ao carregar relatório</p>
            <p className="mt-1 text-xs text-red-600">{error}</p>
            <button
              type="button"
              onClick={tentarNovamente}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Tentar novamente
            </button>
          </div>
        ) : (
          <article
            ref={previewRef}
            className={cn(
              'pagina-a4 relatorio-gerencial-folha mx-auto max-w-6xl bg-white text-sm text-black shadow-md',
              'min-h-[297mm] px-8 py-6',
              'print:m-0 print:max-w-none print:min-h-0 print:p-0 print:shadow-none',
            )}
          >
            {!filtrosGerados ? (
              <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-400">
                Configure os filtros e clique em Gerar para visualizar o relatório.
              </div>
            ) : filtrosGerados.tipoRelatorio === 'pagamentos' ? (
              <RelatorioPagamentosFolha
                linhas={pagamentosQuery.data}
                dataInicio={filtrosGerados.dataInicio}
                dataFim={filtrosGerados.dataFim}
                dataGeracao={dataGeracao}
                nomeEmpresa={nomeEmpresa}
                selecionados={selecionados}
                onAlternarSelecao={alternarSelecao}
                listarTelefone={filtrosGerados.listarTelefone}
                isLoading={pagamentosQuery.isFetching}
              />
            ) : (
              <RelatorioEscalaFolha
                dataInicio={filtrosGerados.dataInicio}
                dataFim={filtrosGerados.dataFim}
                dataGeracao={dataGeracao}
                nomeEmpresa={nomeEmpresa}
                semanas={escalaQuery.data.grade}
                isLoading={escalaQuery.isFetching}
              />
            )}
          </article>
        )}
      </div>
    </div>
  )
}
