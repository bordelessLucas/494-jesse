import { format, startOfMonth, endOfMonth } from 'date-fns'
import { FileDown, Loader2, RefreshCw, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { BadgeConfirmacaoPlantao } from '../../components/ConfirmacaoEscala/BadgeConfirmacaoPlantao'
import { useCatalogoLocaisSetores } from '../../hooks/useCatalogoLocaisSetores'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import { cn } from '../../lib/cn'
import {
  buscarPlantoesConfirmacaoMaster,
  cobrarConfirmacaoPlantao,
  type PlantaoConfirmacaoMasterRow,
} from '../../lib/escalas/confirmacaoEscalaDb'
import { resolverEstadoConfirmacao } from '../../lib/escalas/confirmacaoEscalaTypes'
import { formatarHoraDb } from '../../lib/escalas/plantoesDb'

type FiltroStatus = 'todos' | 'confirmados' | 'pendentes' | 'recusados'

function rotuloStatusConfirmacao(row: PlantaoConfirmacaoMasterRow): string {
  const estado = resolverEstadoConfirmacao({
    profissionalId: row.profissional_id,
    confirmadoProfissional: row.confirmado_profissional,
    confirmacaoStatus: row.confirmacao_status,
    motivoRecusa: row.confirmacao_motivo ?? row.motivo_recusa,
  })
  switch (estado) {
    case 'confirmado':
      return 'Confirmado'
    case 'recusado':
      return 'Recusado'
    case 'aguardando':
      return 'Aguardando'
    default:
      return '—'
  }
}

export function ConfirmacoesPainelPage() {
  const { tenantUserId, isLoading: authLoading } = useTenantUserId()
  const { locais } = useCatalogoLocaisSetores()

  const agora = useMemo(() => new Date(), [])
  const [localId, setLocalId] = useState('')
  const [dataInicio, setDataInicio] = useState(
    format(startOfMonth(agora), 'yyyy-MM-dd'),
  )
  const [dataFim, setDataFim] = useState(format(endOfMonth(agora), 'yyyy-MM-dd'))
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [linhas, setLinhas] = useState<PlantaoConfirmacaoMasterRow[]>([])
  const [carregando, setCarregando] = useState(false)
  const [cobrandoId, setCobrandoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!tenantUserId) {
      setLinhas([])
      return
    }
    setCarregando(true)
    try {
      const rows = await buscarPlantoesConfirmacaoMaster({
        tenantUserId,
        dataInicio,
        dataFim,
        localId: localId || undefined,
        filtroStatus,
      })
      setLinhas(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar confirmações.')
      setLinhas([])
    } finally {
      setCarregando(false)
    }
  }, [tenantUserId, dataInicio, dataFim, localId, filtroStatus])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  async function handleCobrar(row: PlantaoConfirmacaoMasterRow) {
    if (!tenantUserId || !row.profissional_id) return
    setCobrandoId(row.id)
    try {
      await cobrarConfirmacaoPlantao({
        tenantUserId,
        plantaoId: row.id,
        profissionalId: row.profissional_id,
        dataPlantao: row.data_plantao.slice(0, 10),
        localNome: row.local_nome,
        setorNome: row.setor_nome,
      })
      toast.success('Lembrete enviado ao profissional.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar lembrete.')
    } finally {
      setCobrandoId(null)
    }
  }

  async function exportarXlsx() {
    try {
      const ExcelJS = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Confirmações')
      ws.addRow([
        'Data',
        'Profissional',
        'Local',
        'Setor',
        'Horário',
        'Status confirmação',
        'Motivo recusa',
      ])
      for (const r of linhas) {
        ws.addRow([
          r.data_plantao.slice(0, 10),
          r.profissional_nome ?? '—',
          r.local_nome,
          r.setor_nome,
          `${formatarHoraDb(r.hora_inicio)} – ${formatarHoraDb(r.hora_fim)}`,
          rotuloStatusConfirmacao(r),
          r.confirmacao_motivo ?? r.motivo_recusa ?? '',
        ])
      }
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `confirmacoes-plantoes-${dataInicio}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Planilha exportada.')
    } catch {
      toast.error('Não foi possível exportar.')
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Confirmações de plantões</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe quais profissionais confirmaram ou recusaram os plantões atribuídos.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[12rem]">
          <label className="mb-1 block text-xs font-medium text-slate-600">Local</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
          >
            <option value="">Todos</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">De</label>
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Até</label>
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
          >
            <option value="todos">Todos</option>
            <option value="confirmados">Confirmados</option>
            <option value="pendentes">Pendentes</option>
            <option value="recusados">Recusados</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          disabled={carregando}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {carregando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </button>
        <button
          type="button"
          onClick={() => void exportarXlsx()}
          disabled={linhas.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          Exportar XLSX
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            A carregar…
          </div>
        ) : linhas.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            Nenhum plantão encontrado para os filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Local / Setor</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Confirmação</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((row) => {
                  const estado = resolverEstadoConfirmacao({
                    profissionalId: row.profissional_id,
                    confirmadoProfissional: row.confirmado_profissional,
                    confirmacaoStatus: row.confirmacao_status,
                    motivoRecusa: row.confirmacao_motivo ?? row.motivo_recusa,
                  })
                  return (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 tabular-nums">
                        {format(new Date(row.data_plantao + 'T12:00:00'), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {row.profissional_nome ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.local_nome} · {row.setor_nome}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatarHoraDb(row.hora_inicio)} – {formatarHoraDb(row.hora_fim)}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeConfirmacaoPlantao
                          profissionalId={row.profissional_id}
                          confirmadoProfissional={row.confirmado_profissional}
                          dataConfirmacao={row.data_confirmacao_profissional}
                          confirmacaoStatus={row.confirmacao_status}
                          motivoRecusa={row.confirmacao_motivo ?? row.motivo_recusa}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {estado === 'aguardando' && row.profissional_id ? (
                          <button
                            type="button"
                            disabled={cobrandoId === row.id}
                            onClick={() => void handleCobrar(row)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60',
                            )}
                          >
                            {cobrandoId === row.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Cobrar confirmação
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
