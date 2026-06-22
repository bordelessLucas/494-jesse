import { format } from 'date-fns'
import { Loader2, Printer } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'

import { useContaMembro } from '../../hooks/useContaMembro'
import { cn } from '../../lib/cn'
import { capturarPreviewComoPdf } from '../../lib/relatorios/capturarPreviewComoPdf'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'
import { RelatorioEscalaFolha } from './components/RelatorioEscalaFolha'
import { RelatorioPagamentosFolha } from './components/RelatorioPagamentosFolha'
import {
  buscarLinhasPagamentos,
  GRUPOS_OPCOES,
  PERIODO_PADRAO,
  SETORES_OPCOES,
  type TipoRelatorioGerador,
} from './relatoriosMockData'

type FiltrosGerador = {
  tipoRelatorio: TipoRelatorioGerador
  listarTelefone: boolean
  setores: string[]
  grupo: string
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

function filtrosIniciais(): FiltrosGerador {
  return {
    tipoRelatorio: 'pagamentos',
    listarTelefone: false,
    setores: [],
    grupo: 'Todos',
    dataInicio: PERIODO_PADRAO.inicio,
    dataFim: PERIODO_PADRAO.fim,
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

export function RelatoriosPage() {
  const { empresa } = useContaMembro()
  const { logoUrl } = useThemeBranding()
  const nomeEmpresa = empresa?.nome?.trim() || 'PlantaoCheck'
  const previewRef = useRef<HTMLElement>(null)

  const [filtros, setFiltros] = useState<FiltrosGerador>(filtrosIniciais)
  const [filtrosGerados, setFiltrosGerados] = useState<FiltrosGerador | null>(null)
  const [gerando, setGerando] = useState(false)
  const [exportandoXls, setExportandoXls] = useState(false)
  const [exportandoPdf, setExportandoPdf] = useState(false)
  const [dataGeracao, setDataGeracao] = useState('')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const linhasPagamentos = useMemo(() => {
    if (!filtrosGerados || filtrosGerados.tipoRelatorio !== 'pagamentos') return []
    return buscarLinhasPagamentos(filtrosGerados.listarTelefone)
  }, [filtrosGerados])

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

  function alternarSetor(setor: string) {
    setFiltros((p) => {
      const tem = p.setores.includes(setor)
      return {
        ...p,
        setores: tem
          ? p.setores.filter((s) => s !== setor)
          : [...p.setores, setor],
      }
    })
  }

  function gerarRelatorio() {
    setGerando(true)
    window.setTimeout(() => {
      setFiltrosGerados({ ...filtros })
      setDataGeracao(format(new Date(), 'dd/MM/yyyy HH:mm'))
      setSelecionados(new Set())
      setGerando(false)
    }, 900)
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
          filtrosGerados.tipoRelatorio === 'pagamentos' ? linhasPagamentos : undefined,
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

  const relatorioVisivel = filtrosGerados !== null && !gerando

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
                  if (e.target.value) alternarSetor(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">Selecionar…</option>
                {SETORES_OPCOES.map((s) => (
                  <option key={s} value={s}>
                    {filtros.setores.includes(s) ? '✓ ' : ''}
                    {s}
                  </option>
                ))}
              </select>
              {filtros.setores.length > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {filtros.setores.length}
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
              onChange={(e) => patchFiltros('dataInicio', e.target.value)}
            />
          </CampoFiltro>

          <CampoFiltro label="Data Final" htmlFor="filtro-fim" className="min-w-[108px]">
            <input
              id="filtro-fim"
              type="date"
              className={INPUT}
              value={filtros.dataFim}
              onChange={(e) => patchFiltros('dataFim', e.target.value)}
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
              disabled={gerando}
              onClick={gerarRelatorio}
              className="rounded border border-[#2563eb] bg-[#2563eb] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70"
            >
              {gerando ? 'Aguarde...' : 'Gerar'}
            </button>
            <button
              type="button"
              disabled={gerando || exportandoXls || !relatorioVisivel}
              onClick={() => void exportarXls()}
              className="rounded border border-[#2563eb] bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50 disabled:opacity-50"
            >
              {exportandoXls ? 'Exportando…' : 'XLS'}
            </button>
            <button
              type="button"
              disabled={gerando || exportandoPdf || !relatorioVisivel}
              onClick={() => void imprimirOuGerarPdf()}
              className="inline-flex items-center gap-1 rounded border border-[#2563eb] bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50 disabled:opacity-50"
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

        {filtros.setores.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {filtros.setores.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => alternarSetor(s)}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-slate-200"
              >
                {s} ×
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-4 pb-12 pt-6 md:px-8">
        <article
          ref={previewRef}
          className={cn(
            'pagina-a4 relatorio-gerencial-folha mx-auto max-w-6xl bg-white text-sm text-black shadow-md',
            'min-h-[297mm] px-8 py-6',
            'print:m-0 print:max-w-none print:min-h-0 print:p-0 print:shadow-none',
          )}
        >
          {gerando ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
              Aguarde...
            </div>
          ) : !relatorioVisivel ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-400">
              Configure os filtros e clique em Gerar para visualizar o relatório.
            </div>
          ) : filtrosGerados.tipoRelatorio === 'pagamentos' ? (
            <RelatorioPagamentosFolha
              linhas={linhasPagamentos}
              dataInicio={filtrosGerados.dataInicio}
              dataFim={filtrosGerados.dataFim}
              dataGeracao={dataGeracao}
              nomeEmpresa={nomeEmpresa}
              selecionados={selecionados}
              onAlternarSelecao={alternarSelecao}
              listarTelefone={filtrosGerados.listarTelefone}
            />
          ) : (
            <RelatorioEscalaFolha
              dataInicio={filtrosGerados.dataInicio}
              dataFim={filtrosGerados.dataFim}
              dataGeracao={dataGeracao}
              nomeEmpresa={nomeEmpresa}
            />
          )}
        </article>
      </div>
    </div>
  )
}
