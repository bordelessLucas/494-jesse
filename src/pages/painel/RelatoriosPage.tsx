import { useId, useMemo, useState } from 'react'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  Database,
  FileSpreadsheet,
  Loader2,
  Printer,
  Search,
  Table2,
} from 'lucide-react'

import { RelatorioImpressaoModal } from '../../features/relatorios/RelatorioImpressaoModal'
import {
  isRelatorioImpressao,
  labelTipoRelatorio,
  RELATORIOS_GERAIS,
  RELATORIOS_IMPRESSAO,
  type RelatorioImpressaoTipo,
  type TipoRelatorio,
} from '../../features/relatorios/relatorioTipos'
import {
  popularCenarioRelatorio,
  type CenarioPopularBanco,
} from '../../lib/relatorioDemoSeed'
import { cn } from '../../lib/cn'

const SELECT_CLASS =
  'w-full min-w-0 rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const INPUT_CLASS =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20'

const colunasMock = [
  'Profissional',
  'Período',
  'Local',
  'Situação',
  'Observações',
] as const

const linhasMock = [
  {
    id: '1',
    profissional: 'Dra. Ana Paula Ferreira',
    periodo: '12/05/2026 – 18/05/2026',
    local: 'HOSPITAL AMAZÔNIA',
    situacao: 'Licença médica',
    obs: 'Documentação anexada',
  },
  {
    id: '2',
    profissional: 'Dr. Carlos Mendes Silva',
    periodo: '01/06/2026 – 10/06/2026',
    local: 'PRONTO SOCORRO CENTRAL',
    situacao: 'Férias',
    obs: '—',
  },
] as const

function tituloDocumentoImpressao(
  tipo: RelatorioImpressaoTipo,
  dataInicioIso: string,
) {
  const meta = RELATORIOS_IMPRESSAO.find((r) => r.value === tipo)!
  const ref = parseISO(dataInicioIso)
  const mesRef = format(ref, "MMMM 'de' yyyy", { locale: ptBR })
  return `${meta.label} — ${mesRef}`
}

function unidadeRelatorio(grupos: string) {
  const g = grupos.trim()
  return g.length > 0 ? g : 'HOSPITAL AMAZÔNIA — Rede de saúde'
}

export function RelatoriosPage() {
  const idRelatorio = useId()
  const idGrupos = useId()
  const idInicio = useId()
  const idFim = useId()
  const idPopularCenario = useId()

  const hoje = useMemo(() => new Date(), [])
  const defaults = useMemo(
    () => ({
      inicio: format(startOfMonth(hoje), 'yyyy-MM-dd'),
      fim: format(endOfMonth(hoje), 'yyyy-MM-dd'),
    }),
    [hoje],
  )

  const [tipoRelatorio, setTipoRelatorio] =
    useState<TipoRelatorio>('freq_uti_ped')
  const [grupos, setGrupos] = useState('')
  const [dataInicio, setDataInicio] = useState(defaults.inicio)
  const [dataFim, setDataFim] = useState(defaults.fim)
  const [gerando, setGerando] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [mensagemExport, setMensagemExport] = useState<string | null>(null)
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false)

  const [cenarioPopular, setCenarioPopular] = useState<CenarioPopularBanco>('')
  const [popularCarregando, setPopularCarregando] = useState(false)
  const [popularFeedback, setPopularFeedback] = useState<{
    tipo: 'ok' | 'erro'
    texto: string
  } | null>(null)

  const competenciaPrimeiroDia = useMemo(() => {
    try {
      const d = parseISO(dataInicio)
      if (Number.isNaN(d.getTime())) throw new Error('inválido')
      return format(startOfMonth(d), 'yyyy-MM-dd')
    } catch {
      return format(startOfMonth(new Date()), 'yyyy-MM-dd')
    }
  }, [dataInicio])

  const impressaoAtual = isRelatorioImpressao(tipoRelatorio)
    ? tipoRelatorio
    : null

  function handleGerar() {
    setGerando(true)
    setMostrarResultado(false)
    setModalImpressaoAberto(false)
    window.setTimeout(() => {
      setGerando(false)
      setMostrarResultado(true)
    }, 650)
  }

  function handleExportarXls() {
    if (!mostrarResultado) return
    setMensagemExport(
      'Exportação XLS será conectada à API em breve. Por enquanto use os dados da tabela acima.',
    )
    window.setTimeout(() => setMensagemExport(null), 5000)
  }

  async function handlePopularBanco() {
    setPopularFeedback(null)
    if (!cenarioPopular) {
      setPopularFeedback({
        tipo: 'erro',
        texto: 'Selecione um cenário na lista antes de aplicar.',
      })
      return
    }
    setPopularCarregando(true)
    const { error } = await popularCenarioRelatorio(
      cenarioPopular,
      competenciaPrimeiroDia,
    )
    setPopularCarregando(false)
    if (error) {
      setPopularFeedback({ tipo: 'erro', texto: error })
      return
    }
    setPopularFeedback({
      tipo: 'ok',
      texto:
        cenarioPopular === 'limpar'
          ? 'Dados de demonstração removidos do Supabase para o seu usuário.'
          : 'Dados de demonstração gravados no Supabase. Use a competência da “Data de início” (primeiro dia do mês) como referência nas consultas.',
    })
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-6 pb-8">
      {impressaoAtual ? (
        <RelatorioImpressaoModal
          aberto={modalImpressaoAberto}
          aoFechar={() => setModalImpressaoAberto(false)}
          tipo={impressaoAtual}
          tituloDocumento={tituloDocumentoImpressao(
            impressaoAtual,
            dataInicio,
          )}
          unidade={unidadeRelatorio(grupos)}
          dataInicioIso={dataInicio}
          dataFimIso={dataFim}
          grupos={grupos}
        />
      ) : null}

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
          Painel de controle
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Relatórios
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Gere relatórios por período e grupo. Os três primeiros modelos abrem
          visualização para <strong>impressão ou PDF</strong> com a{' '}
          <strong>marca</strong> (logo e cores) configurada na plataforma.
        </p>
      </header>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <Database className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-800">
              Popular banco (demonstração)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Insere linhas nas tabelas{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                relatorio_demo_*
              </code>{' '}
              do Supabase para o seu usuário — útil para testar exportações e
              consultas. Execute a migration{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                20260512000000_relatorio_demo_dados.sql
              </code>{' '}
              no projeto antes.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Competência usada nos inserts:{' '}
              <strong className="text-slate-700">{competenciaPrimeiroDia}</strong>{' '}
              (mês da <span className="font-medium">Data de início</span> nos
              filtros abaixo).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={idPopularCenario}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Cenário
            </label>
            <select
              id={idPopularCenario}
              className={SELECT_CLASS}
              value={cenarioPopular}
              onChange={(e) =>
                setCenarioPopular(e.target.value as CenarioPopularBanco)
              }
            >
              <option value="">Selecione um cenário…</option>
              <option value="uti_ped">
                Frequência UTI PED — grade completa (mês da data início)
              </option>
              <option value="scih_freq">
                Frequência SCIH — grade completa (mês da data início)
              </option>
              <option value="scih_rel">
                Relatório SCIH — indicadores + ocorrências
              </option>
              <option value="tudo">Pacote completo (todos os inserts acima)</option>
              <option value="limpar">
                Limpar todas as linhas de demonstração do meu usuário
              </option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void handlePopularBanco()}
            disabled={popularCarregando}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-primary-400 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800 shadow-sm transition-colors',
              'hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {popularCarregando ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            ) : null}
            Aplicar ao banco
          </button>
        </div>

        {popularFeedback ? (
          <p
            className={cn(
              'mt-4 rounded-lg border px-4 py-3 text-sm',
              popularFeedback.tipo === 'ok'
                ? 'border-success-200 bg-success-50 text-success-900'
                : 'border-danger-200 bg-danger-50 text-danger-900',
            )}
            role="status"
          >
            {popularFeedback.texto}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Preencha os campos e clique em <span className="font-medium">Gerar</span>{' '}
          para montar a visualização.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-3">
            <label
              htmlFor={idRelatorio}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Relatório
            </label>
            <select
              id={idRelatorio}
              className={SELECT_CLASS}
              value={tipoRelatorio}
              onChange={(e) =>
                setTipoRelatorio(e.target.value as TipoRelatorio)
              }
            >
              <optgroup label="Impressão / PDF (marca da plataforma)">
                {RELATORIOS_IMPRESSAO.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Demais relatórios">
                {RELATORIOS_GERAIS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label
              htmlFor={idGrupos}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Grupo(s) / unidade
            </label>
            <input
              id={idGrupos}
              type="text"
              value={grupos}
              onChange={(e) => setGrupos(e.target.value)}
              placeholder="Ex.: SCIH, UTI PED…"
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor={idInicio}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Data de início
            </label>
            <input
              id={idInicio}
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor={idFim}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Data final
            </label>
            <input
              id={idFim}
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-2 lg:justify-end">
            <button
              type="button"
              onClick={handleGerar}
              disabled={gerando}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors',
                'bg-primary-600 hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
              ) : (
                <Search className="h-4 w-4 shrink-0" aria-hidden />
              )}
              Gerar
            </button>
            <button
              type="button"
              onClick={handleExportarXls}
              disabled={!mostrarResultado || impressaoAtual !== null}
              className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-colors',
                'border-primary-400 bg-white text-primary-700 hover:bg-primary-50',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                'disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white',
              )}
              title={
                impressaoAtual
                  ? 'Use a visualização de impressão para estes relatórios'
                  : undefined
              }
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden />
              XLS
            </button>
          </div>
        </div>

        {mensagemExport ? (
          <p
            className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900"
            role="status"
          >
            {mensagemExport}
          </p>
        ) : null}
      </section>

      <section className="flex min-h-96 flex-col rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Table2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <h2 className="truncate text-sm font-semibold text-slate-800">
              Resultado
            </h2>
          </div>
          {mostrarResultado ? (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {labelTipoRelatorio(tipoRelatorio)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          {!mostrarResultado ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
              <Search
                className="h-10 w-10 text-slate-300"
                strokeWidth={1.25}
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-600">
                Nenhum relatório gerado
              </p>
              <p className="max-w-sm text-xs text-slate-500">
                Ajuste os filtros acima e clique em <strong>Gerar</strong> para
                carregar os dados nesta área.
              </p>
            </div>
          ) : impressaoAtual ? (
            <div className="flex flex-1 flex-col gap-4 rounded-lg border border-primary-100 bg-primary-50/30 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Relatório pronto para impressão
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {
                    RELATORIOS_IMPRESSAO.find((r) => r.value === impressaoAtual)
                      ?.descricao
                  }{' '}
                  O cabeçalho usa a <strong>cor primária</strong> e o{' '}
                  <strong>logotipo</strong> da sua marca.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModalImpressaoAberto(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                >
                  <Printer className="h-4 w-4 shrink-0" aria-hidden />
                  Visualizar e imprimir
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-160 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {colunasMock.map((col) => (
                      <th key={col} className="px-4 py-3 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {linhasMock.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-white transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.profissional}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {row.periodo}
                      </td>
                      <td className="max-w-48 truncate px-4 py-3 text-slate-600">
                        {row.local}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
                          {row.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-xs text-slate-500">
                Exibindo {linhasMock.length} registro(s) de exemplo para o
                período {dataInicio} — {dataFim}.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
