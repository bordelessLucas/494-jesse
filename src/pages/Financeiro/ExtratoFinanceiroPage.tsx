import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  Lock,
  Save,
} from 'lucide-react'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import {
  calcularTotaisExtrato,
  valorFinalLinha,
  type LinhaExtratoFinanceiro,
} from '../../lib/financeiro/extratoCalculos'
import {
  buscarLinhasExtratoCompetencia,
} from '../../lib/financeiro/financeiroData'
import { supabase } from '../../lib/supabase'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'

const VISAO_TODOS = '__todos__'

type ProfissionalOpcao = { id: string; nome: string }

type ExtratoPeriodoRow = {
  id: string
  fechado_em: string | null
  status_financeiro: string
  extrato_fechado?: boolean
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type BadgeFinanceiro = 'pendente' | 'processado' | 'pago'

const BADGE_MAP: Record<
  BadgeFinanceiro,
  { rotulo: string; className: string }
> = {
  pendente: {
    rotulo: 'Pendente',
    className: 'bg-amber-100 text-amber-950 ring-amber-400/50',
  },
  processado: {
    rotulo: 'Processado',
    className: 'bg-sky-100 text-sky-950 ring-sky-400/50',
  },
  pago: {
    rotulo: 'Pago',
    className: 'bg-emerald-100 text-emerald-950 ring-emerald-500/40',
  },
}

function normalizarStatusFinanceiro(s: string | undefined): BadgeFinanceiro {
  if (s === 'processado' || s === 'pago' || s === 'pendente') return s
  return 'pendente'
}

function exportarExtratoPdf(params: {
  titulo: string
  competenciaRotulo: string
  profissionalRotulo: string
  linhas: LinhaExtratoFinanceiro[]
  totais: ReturnType<typeof calcularTotaisExtrato>
  statusExibicao: string
}) {
  const { titulo, competenciaRotulo, profissionalRotulo, linhas, totais, statusExibicao } =
    params
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margem = 14
  let y = 18

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, margem, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Competência: ${competenciaRotulo}`, margem, y)
  y += 5
  doc.text(`Profissional / visão: ${profissionalRotulo}`, margem, y)
  y += 5
  doc.text(`Status financeiro: ${statusExibicao}`, margem, y)
  y += 10

  doc.setFontSize(9)
  const cols = [margem, margem + 22, margem + 78, margem + 120, margem + 148, margem + 168]
  doc.setFont('helvetica', 'bold')
  doc.text('Data', cols[0], y)
  doc.text('Local / Setor', cols[1], y)
  doc.text('Profissional', cols[2], y)
  doc.text('Bruto', cols[3], y)
  doc.text('Ajuste', cols[4], y)
  doc.text('Final', cols[5], y)
  y += 5
  doc.setDrawColor(200)
  doc.line(margem, y, margem + 182, y)
  y += 4
  doc.setFont('helvetica', 'normal')

  for (const L of linhas) {
    if (y > 270) {
      doc.addPage()
      y = 18
    }
    const locSetor = `${L.localNome} / ${L.setorNome}`
    const fin = valorFinalLinha(L.valorBruto, L.ajusteFinanceiro)
    doc.text(L.dataPlantao.split('-').reverse().join('/'), cols[0], y)
    const lsTrunc = doc.splitTextToSize(locSetor, 48)
    doc.text(lsTrunc[0] ?? '', cols[1], y)
    const profTrunc = doc.splitTextToSize(L.profissionalNome, 32)
    doc.text(profTrunc[0] ?? '', cols[2], y)
    doc.text(fmtBRL(L.valorBruto).replace(/\s/g, ' '), cols[3], y)
    doc.text(fmtBRL(L.ajusteFinanceiro).replace(/\s/g, ' '), cols[4], y)
    doc.text(fmtBRL(fin).replace(/\s/g, ' '), cols[5], y)
    y += 6
  }

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Total bruto: ${fmtBRL(totais.totalBruto).replace(/\s/g, ' ')}`, margem, y)
  y += 5
  doc.text(
    `Descontos / glosas: ${fmtBRL(totais.totalDescontosGlosas).replace(/\s/g, ' ')}`,
    margem,
    y,
  )
  y += 5
  doc.text(
    `Líquido a receber: ${fmtBRL(totais.totalLiquido).replace(/\s/g, ' ')}`,
    margem,
    y,
  )

  const slug = competenciaRotulo.replace(/\s+/g, '_')
  doc.save(`extrato-financeiro-${slug}.pdf`)
}

export function ExtratoFinanceiroPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const now = useMemo(() => new Date(), [])
  const [competencia, setCompetencia] = useState(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  )
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>(VISAO_TODOS)
  const [profissionais, setProfissionais] = useState<ProfissionalOpcao[]>([])
  const [linhas, setLinhas] = useState<LinhaExtratoFinanceiro[]>([])
  const [extratoPeriodo, setExtratoPeriodo] = useState<ExtratoPeriodoRow | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvandoAjusteId, setSalvandoAjusteId] = useState<string | null>(null)
  const [fechando, setFechando] = useState(false)
  const linhasRef = useRef<LinhaExtratoFinanceiro[]>([])
  const extratoBloqueadoRef = useRef(false)

  const competenciaInicio = useMemo(() => {
    const [y, m] = competencia.split('-').map(Number)
    return format(startOfMonth(new Date(y, m! - 1, 1)), 'yyyy-MM-dd')
  }, [competencia])

  const competenciaFim = useMemo(() => {
    const [y, m] = competencia.split('-').map(Number)
    return format(endOfMonth(new Date(y, m! - 1, 1)), 'yyyy-MM-dd')
  }, [competencia])

  const competenciaRotulo = useMemo(() => {
    const [y, m] = competencia.split('-').map(Number)
    return capitalizar(format(new Date(y!, m! - 1, 1), 'MMMM yyyy', { locale: ptBR }))
  }, [competencia])

  const extratoBloqueado = Boolean(
    extratoPeriodo?.extrato_fechado === true || extratoPeriodo?.fechado_em,
  )

  useEffect(() => {
    linhasRef.current = linhas
  }, [linhas])

  useEffect(() => {
    extratoBloqueadoRef.current = extratoBloqueado
  }, [extratoBloqueado])

  const statusFinanceiro = normalizarStatusFinanceiro(extratoPeriodo?.status_financeiro)

  const profissionalNomeSelecionado = useMemo(() => {
    if (profissionalFiltro === VISAO_TODOS) return 'Todos os profissionais (visão coordenação)'
    const p = profissionais.find((x) => x.id === profissionalFiltro)
    return p?.nome ?? '—'
  }, [profissionalFiltro, profissionais])

  const carregarProfissionais = useCallback(async () => {
    if (!user) {
      setProfissionais([])
      return
    }
    const { data, error: e } = await supabase
      .from('profissionais')
      .select('id, nome')
      .eq('user_id', user.id)
      .order('nome')
    if (e) {
      setProfissionais([])
      return
    }
    setProfissionais((data ?? []) as ProfissionalOpcao[])
  }, [user])

  const carregarExtratoPeriodo = useCallback(async () => {
    if (!user || profissionalFiltro === VISAO_TODOS) {
      setExtratoPeriodo(null)
      return
    }
    const { data, error: e } = await supabase
      .from('financeiro_extrato_periodo')
      .select('id, fechado_em, status_financeiro, extrato_fechado')
      .eq('user_id', user.id)
      .eq('profissional_id', profissionalFiltro)
      .eq('competencia', competencia)
      .maybeSingle()

    if (e) {
      if (e.message.includes('financeiro_extrato_periodo')) {
        setExtratoPeriodo(null)
        return
      }
      setExtratoPeriodo(null)
      return
    }
    setExtratoPeriodo(data as ExtratoPeriodoRow | null)
  }, [user, profissionalFiltro, competencia])

  const carregarPlantoes = useCallback(async () => {
    if (!user) {
      setLinhas([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    setErro(null)

    try {
      const linhasCarregadas = await buscarLinhasExtratoCompetencia(
        user.id,
        competenciaInicio,
        competenciaFim,
        profissionalFiltro !== VISAO_TODOS
          ? { profissionalId: profissionalFiltro }
          : undefined,
      )
      setLinhas(linhasCarregadas)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar plantões.'
      setLinhas([])
      setErro(
        msg.includes('valor_plantao') ||
          msg.includes('ajuste_financeiro') ||
          msg.includes('observacao_ajuste') ||
          msg.includes('realizado') ||
          msg.includes('schema')
          ? 'A migração financeira ainda não foi aplicada. Execute as migrações em supabase/migrations (ex.: 20260519150000 e 20260520100000).'
          : msg,
      )
    } finally {
      setCarregando(false)
    }
  }, [user, competenciaInicio, competenciaFim, profissionalFiltro])

  useEffect(() => {
    void carregarProfissionais()
  }, [carregarProfissionais])

  useEffect(() => {
    if (authLoading) return
    void carregarPlantoes()
  }, [authLoading, carregarPlantoes])

  useEffect(() => {
    if (authLoading) return
    void carregarExtratoPeriodo()
  }, [authLoading, carregarExtratoPeriodo])

  async function persistirLinhaPlantao(plantaoId: string) {
    if (!user || extratoBloqueadoRef.current) return
    const L = linhasRef.current.find((x) => x.plantaoId === plantaoId)
    if (!L) return
    setSalvandoAjusteId(plantaoId)
    setErro(null)
    const { error: e } = await supabase
      .from('plantoes')
      .update({
        ajuste_financeiro: L.ajusteFinanceiro,
        observacao_ajuste: L.observacaoAjuste.trim() ? L.observacaoAjuste.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plantaoId)
      .eq('user_id', user.id)
    setSalvandoAjusteId(null)
    if (e) setErro(e.message)
  }

  function aoAlterarAjusteDigitando(plantaoId: string, ajuste: number) {
    setLinhas((prev) =>
      prev.map((x) =>
        x.plantaoId === plantaoId ? { ...x, ajusteFinanceiro: ajuste } : x,
      ),
    )
  }

  function aoAlterarObservacaoDigitando(plantaoId: string, texto: string) {
    setLinhas((prev) =>
      prev.map((x) =>
        x.plantaoId === plantaoId ? { ...x, observacaoAjuste: texto } : x,
      ),
    )
  }

  async function salvarTodasAsLinhasNaBase() {
    if (!user || extratoBloqueado) return
    const ids = linhasRef.current.map((L) => L.plantaoId)
    for (const id of ids) {
      await persistirLinhaPlantao(id)
    }
  }

  async function confirmarFechamento() {
    if (!user || profissionalFiltro === VISAO_TODOS || extratoBloqueado) return
    if (!window.confirm('Confirmar fechamento deste extrato? Ajustes e glosas não poderão ser alterados após fechar.')) return
    setFechando(true)
    setErro(null)
    const agora = new Date().toISOString()
    const { error: e } = await supabase.from('financeiro_extrato_periodo').upsert(
      {
        user_id: user.id,
        profissional_id: profissionalFiltro,
        competencia,
        fechado_em: agora,
        extrato_fechado: true,
        status_financeiro: 'processado',
        updated_at: agora,
      },
      { onConflict: 'user_id,profissional_id,competencia' },
    )
    setFechando(false)
    if (e) {
      setErro(e.message)
      return
    }
    await carregarExtratoPeriodo()
  }

  async function marcarComoPago() {
    if (!user || !extratoPeriodo?.id || !extratoBloqueado) return
    if (statusFinanceiro !== 'processado') return
    setFechando(true)
    setErro(null)
    const { error: e } = await supabase
      .from('financeiro_extrato_periodo')
      .update({
        status_financeiro: 'pago',
        updated_at: new Date().toISOString(),
      })
      .eq('id', extratoPeriodo.id)
      .eq('user_id', user.id)
    setFechando(false)
    if (e) {
      setErro(e.message)
      return
    }
    await carregarExtratoPeriodo()
  }

  const totais = useMemo(() => calcularTotaisExtrato(linhas), [linhas])

  const badge = BADGE_MAP[statusFinanceiro]

  return (
    <div className="mx-auto w-full max-w-7xl pb-16">
      <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Financeiro
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Extrato Financeiro
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                badge.className,
              )}
            >
              {statusFinanceiro === 'pendente' ? (
                <Clock className="h-3.5 w-3.5" aria-hidden />
              ) : statusFinanceiro === 'processado' ? (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              )}
              {badge.rotulo}
            </span>
            {extratoBloqueado ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Lock className="h-3.5 w-3.5" aria-hidden /> Fechado para edição
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Plantões com situação <strong>realizado</strong> na competência selecionada. Valor bruto
            vem do cadastro do plantão na escala.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Competência (mês / ano)
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Profissional (visão coordenação: todos)
            <select
              value={profissionalFiltro}
              onChange={(e) => setProfissionalFiltro(e.target.value)}
              className="min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={VISAO_TODOS}>Todos os profissionais</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {erro ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {erro}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total bruto
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {fmtBRL(totais.totalBruto)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total descontos / glosas
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900">
            {fmtBRL(totais.totalDescontosGlosas)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-900">
            Total líquido a receber
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">
            {fmtBRL(totais.totalLiquido)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={linhas.length === 0}
          onClick={() =>
            exportarExtratoPdf({
              titulo: 'Extrato Financeiro — Recibo',
              competenciaRotulo: competenciaRotulo,
              profissionalRotulo: profissionalNomeSelecionado,
              linhas,
              totais,
              statusExibicao: badge.rotulo,
            })
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" aria-hidden />
          Exportar recibo (PDF)
        </button>
        <button
          type="button"
          disabled={extratoBloqueado || linhas.length === 0 || !user}
          onClick={() => void salvarTodasAsLinhasNaBase()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden />
          Salvar alterações
        </button>
        <button
          type="button"
          disabled={
            profissionalFiltro === VISAO_TODOS ||
            linhas.length === 0 ||
            extratoBloqueado ||
            fechando ||
            !user
          }
          onClick={() => void confirmarFechamento()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {fechando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Lock className="h-4 w-4" aria-hidden />
          )}
          Confirmar fechamento
        </button>
        {extratoBloqueado && statusFinanceiro === 'processado' ? (
          <button
            type="button"
            disabled={fechando}
            onClick={() => void marcarComoPago()}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            Marcar como pago
          </button>
        ) : null}
        {profissionalFiltro === VISAO_TODOS ? (
          <p className="text-xs text-slate-500">
            Fechamento e status por profissional disponíveis ao filtrar um profissional específico.
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin" /> A carregar plantões…
          </div>
        ) : linhas.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-600">
            Nenhum plantão <strong>realizado</strong> nesta competência
            {profissionalFiltro !== VISAO_TODOS ? ' para o filtro atual' : ''}. Marque plantões como
            realizados na escala ou ajuste o mês.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Data
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Local / Setor
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Profissional
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Valor bruto
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Ajustes / glosas
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Observação do ajuste
                  </th>
                  <th className="w-12 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Guardar
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Valor final
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((L) => {
                  const finalV = valorFinalLinha(L.valorBruto, L.ajusteFinanceiro)
                  return (
                    <tr key={L.plantaoId} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-3 text-slate-800">
                        {format(parseISO(L.dataPlantao), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <span className="font-medium text-slate-900">{L.localNome}</span>
                        <span className="text-slate-400"> / </span>
                        <span>{L.setorNome}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{L.profissionalNome}</td>
                      <td className="px-3 py-3 text-right align-top">
                        <div className="tabular-nums text-slate-900">{fmtBRL(L.valorBruto)}</div>
                        {L.valorBase !== L.valorBruto ? (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Base {fmtBRL(L.valorBase)}
                          </p>
                        ) : null}
                        {L.etiquetasRemuneracao.length > 0 ? (
                          <ul className="mt-1.5 space-y-0.5">
                            {L.etiquetasRemuneracao.map((etq) => (
                              <li key={etq}>
                                <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-emerald-900 ring-1 ring-emerald-200/80">
                                  {etq}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            disabled={extratoBloqueado}
                            value={L.ajusteFinanceiro}
                            onChange={(e) => {
                              const raw = e.target.value
                              const v = raw === '' ? 0 : Number(raw)
                              const val = Number.isFinite(v) ? v : 0
                              aoAlterarAjusteDigitando(L.plantaoId, val)
                            }}
                            onBlur={() => void persistirLinhaPlantao(L.plantaoId)}
                            className={cn(
                              'w-28 rounded-md border px-2 py-1.5 text-right tabular-nums outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20',
                              extratoBloqueado
                                ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-500'
                                : 'border-slate-200 bg-white',
                            )}
                            title="Use valores negativos para descontos (ex.: -150)"
                          />
                          {salvandoAjusteId === L.plantaoId ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          disabled={extratoBloqueado}
                          value={L.observacaoAjuste}
                          onChange={(e) =>
                            aoAlterarObservacaoDigitando(L.plantaoId, e.target.value)
                          }
                          onBlur={() => void persistirLinhaPlantao(L.plantaoId)}
                          placeholder="Motivo da glosa, nota…"
                          className={cn(
                            'w-full min-w-[12rem] max-w-md rounded-md border px-2 py-1.5 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20',
                            extratoBloqueado
                              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-500'
                              : 'border-slate-200 bg-white',
                          )}
                        />
                      </td>
                      <td className="px-2 py-3 text-center align-top">
                        <button
                          type="button"
                          disabled={extratoBloqueado}
                          onClick={() => void persistirLinhaPlantao(L.plantaoId)}
                          title="Guardar esta linha no Supabase"
                          className="inline-flex rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Save className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right text-base font-semibold tabular-nums text-emerald-900">
                        {fmtBRL(finalV)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function capitalizar(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}
