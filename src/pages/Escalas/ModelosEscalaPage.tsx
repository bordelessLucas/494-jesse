import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileSpreadsheet,
  LayoutGrid,
  Loader2,
  Minus,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SeletorLocalSetor } from '../../components/catalogo/SeletorLocalSetor'
import { useCatalogoLocaisSetores } from '../../hooks/useCatalogoLocaisSetores'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { cn } from '../../lib/cn'
import {
  buscarProfissionaisEscala,
  buscarProfissionaisRelatorioEscala,
  formatarHoraDb,
} from '../../lib/escalas/plantoesDb'
import {
  atualizarEscalaModelo,
  atualizarItemModelo,
  calcularDuracaoMinutos,
  criarEscalaModelo,
  duplicarEscalaModelo,
  excluirEscalaModelo,
  excluirItensSemanaIndexAcima,
  inserirItemModelo,
  limparTodosItensModelo,
  listarItensModelo,
  listarModelosLocalSetor,
  excluirItemModelo,
  formatarHoraModelo,
  type EscalaModeloItemRow,
  type EscalaModeloRow,
  type TomModelo,
} from '../../lib/escalas/modelosEscalaDb'

const DIAS_SEMANA = [
  { dia: 1, sigla: 'SEG' },
  { dia: 2, sigla: 'TER' },
  { dia: 3, sigla: 'QUA' },
  { dia: 4, sigla: 'QUI' },
  { dia: 5, sigla: 'SEX' },
  { dia: 6, sigla: 'SÁB' },
  { dia: 7, sigla: 'DOM' },
] as const

const INPUT =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

const BTN_ACAO =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50'
const BTN_ICONE = `${BTN_ACAO} px-2.5 py-2.5`

function fmtDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function labelTipo(t: TomModelo): string {
  return t === 'fds' ? 'Fim de semana' : 'Útil'
}

type ModalModeloProps = {
  aberto: boolean
  titulo: string
  semanaIndex: number
  diaClicado: number
  profissionais: { id: string; nome: string }[]
  horaInicio: string
  horaFim: string
  tipo: TomModelo
  profissionalId: string
  diasSemanaSel: Set<number>
  salvarLabel: string
  salvando: boolean
  onFechar: () => void
  onChangeHoraInicio: (v: string) => void
  onChangeHoraFim: (v: string) => void
  onChangeTipo: (v: TomModelo) => void
  onChangeProfissional: (v: string) => void
  onToggleDia: (dia: number) => void
  onSalvar: () => void
  modoEdicao: boolean
  onExcluirItem?: () => void
}

function ModalAdicionarModelo({
  aberto,
  titulo,
  semanaIndex,
  diaClicado,
  profissionais,
  horaInicio,
  horaFim,
  tipo,
  profissionalId,
  diasSemanaSel,
  salvarLabel,
  salvando,
  onFechar,
  onChangeHoraInicio,
  onChangeHoraFim,
  onChangeTipo,
  onChangeProfissional,
  onToggleDia,
  onSalvar,
  modoEdicao,
  onExcluirItem,
}: ModalModeloProps) {
  const duracao = useMemo(() => {
    try {
      return fmtDuracao(calcularDuracaoMinutos(horaInicio, horaFim))
    } catch {
      return '—'
    }
  }, [horaInicio, horaFim])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onFechar}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        role="dialog"
        aria-modal
        aria-labelledby="modal-modelo-titulo"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-modelo-titulo" className="text-lg font-semibold text-slate-900">
              {titulo}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Semana {semanaIndex} do ciclo · coluna inicial{' '}
              {DIAS_SEMANA.find((d) => d.dia === diaClicado)?.sigla}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Início</label>
              <input
                type="time"
                value={horaInicio.slice(0, 5)}
                onChange={(e) => onChangeHoraInicio(formatarHoraModelo(e.target.value))}
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fim</label>
              <input
                type="time"
                value={horaFim.slice(0, 5)}
                onChange={(e) => onChangeHoraFim(formatarHoraModelo(e.target.value))}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Duração</label>
            <input
              type="text"
              readOnly
              value={duracao}
              className={cn(INPUT, 'cursor-not-allowed bg-slate-50 text-slate-700')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => onChangeTipo(e.target.value as TomModelo)}
              className={INPUT}
            >
              <option value="util">{labelTipo('util')}</option>
              <option value="fds">{labelTipo('fds')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Profissional</label>
            <select
              value={profissionalId}
              onChange={(e) => onChangeProfissional(e.target.value)}
              className={INPUT}
            >
              <option value="">— Sem profissional —</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Várias datas</p>
            <p className="mb-2 text-xs text-slate-500">
              {modoEdicao
                ? 'Na edição, apenas o dia deste bloco pode ser ajustado (selecione um único dia).'
                : 'Selecione em quais dias da semana este plantão ocorre (cópias na mesma semana do ciclo).'}
            </p>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(({ dia, sigla }) => {
                const ativo = diasSemanaSel.has(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => onToggleDia(dia)}
                    className={cn(
                      'min-w-12 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                      ativo
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {sigla}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div>
            {modoEdicao && onExcluirItem ? (
              <button
                type="button"
                disabled={salvando}
                onClick={onExcluirItem}
                className="text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
              >
                Excluir este bloco
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando || diasSemanaSel.size === 0}
              onClick={onSalvar}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {salvarLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalConfirmarLimpar({
  aberto,
  onFechar,
  onConfirmar,
  carregando,
}: {
  aberto: boolean
  onFechar: () => void
  onConfirmar: () => void
  carregando: boolean
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/55" onClick={onFechar} aria-label="Fechar" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Limpar modelo?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Esta escala modelo terá todos os seus plantões apagados neste ciclo. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={carregando}
            onClick={onConfirmar}
            className="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalConfirmarApagarModelo({
  aberto,
  onFechar,
  onConfirmar,
  carregando,
}: {
  aberto: boolean
  onFechar: () => void
  onConfirmar: () => void
  carregando: boolean
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/55" onClick={onFechar} aria-label="Fechar" />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Apagar modelo?</h3>
        <p className="mt-2 text-sm text-slate-600">
          O modelo de escala será apagado permanentemente, incluindo todos os plantões de todas as semanas do
          ciclo. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={carregando}
            onClick={onConfirmar}
            className="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apagar modelo
          </button>
        </div>
      </div>
    </div>
  )
}

export function ModelosEscalaPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const {
    locais,
    getSetoresDoLocal,
    isLoading: carregandoCatalogoLocais,
  } = useCatalogoLocaisSetores()

  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>([])
  const [localId, setLocalId] = useState('')
  const [setorId, setSetorId] = useState('')
  const [modelos, setModelos] = useState<EscalaModeloRow[]>([])
  const [modeloId, setModeloId] = useState<string | null>(null)
  const [quantidadeSemanas, setQuantidadeSemanas] = useState(1)
  const [semanaAtiva, setSemanaAtiva] = useState(1)
  const [itens, setItens] = useState<EscalaModeloItemRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [itemEdicao, setItemEdicao] = useState<EscalaModeloItemRow | null>(null)
  const [diaClicado, setDiaClicado] = useState(1)
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFim, setHoraFim] = useState('19:00')
  const [tipo, setTipo] = useState<TomModelo>('util')
  const [profissionalIdModal, setProfissionalIdModal] = useState('')
  const [diasSemanaSel, setDiasSemanaSel] = useState<Set<number>>(() => new Set([1]))
  const [salvandoModal, setSalvandoModal] = useState(false)

  const [modalLimpar, setModalLimpar] = useState(false)
  const [limpando, setLimpando] = useState(false)
  const [modalApagarModelo, setModalApagarModelo] = useState(false)
  const [apagandoModelo, setApagandoModelo] = useState(false)
  const [exportandoExcel, setExportandoExcel] = useState(false)
  const [duplicandoModelo, setDuplicandoModelo] = useState(false)

  const modeloAtual = useMemo(
    () => modelos.find((m) => m.id === modeloId) ?? null,
    [modelos, modeloId],
  )

  const setoresDoLocal = useMemo(
    () => getSetoresDoLocal(localId),
    [getSetoresDoLocal, localId],
  )

  const nomeLocalAtual = useMemo(
    () => locais.find((l) => l.id === localId)?.nome ?? '',
    [locais, localId],
  )

  const nomeSetorAtual = useMemo(
    () => setoresDoLocal.find((s) => s.id === setorId)?.nome ?? '',
    [setoresDoLocal, setorId],
  )

  const carregarProfissionais = useCallback(async () => {
    if (!user) return
    const P = await buscarProfissionaisEscala(user.id)
    setProfissionais(P)
  }, [user])

  useEffect(() => {
    if (authLoading || !user) return
    void carregarProfissionais()
  }, [authLoading, user, carregarProfissionais])

  useEffect(() => {
    if (locais.length === 0) {
      setLocalId('')
      setSetorId('')
      return
    }
    setLocalId((prev) => (prev && locais.some((l) => l.id === prev) ? prev : locais[0].id))
  }, [locais])

  useEffect(() => {
    const validos = getSetoresDoLocal(localId)
    setSetorId((prev) => {
      if (prev && validos.some((s) => s.id === prev)) return prev
      return validos[0]?.id ?? ''
    })
  }, [getSetoresDoLocal, localId])

  useEffect(() => {
    if (!user || !localId || !setorId) {
      setModelos([])
      setModeloId(null)
      setItens([])
      setCarregando(false)
      return
    }
    let cancelled = false
    void (async () => {
      setCarregando(true)
      setErro(null)
      try {
        const lista = await listarModelosLocalSetor(user.id, localId, setorId)
        if (cancelled) return
        setModelos(lista)
        setModeloId((cur) => {
          if (cur && lista.some((m) => m.id === cur)) return cur
          return lista[0]?.id ?? null
        })
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Erro ao carregar.'
        setErro(
          msg.includes('escala_modelos') || msg.includes('schema')
            ? 'Tabela de modelos ainda não disponível. Aplique a migração supabase/migrations/20260521120000_escala_modelos.sql.'
            : msg,
        )
        setModelos([])
        setModeloId(null)
      } finally {
        if (!cancelled) setCarregando(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, localId, setorId])

  useEffect(() => {
    if (!user || !modeloId) {
      setItens([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const m = modelos.find((x) => x.id === modeloId)
        if (m) setQuantidadeSemanas(m.quantidade_semanas)
        const its = await listarItensModelo(user.id, modeloId)
        if (!cancelled) setItens(its)
      } catch (e) {
        if (!cancelled) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar itens.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, modeloId, modelos])

  useEffect(() => {
    if (semanaAtiva > quantidadeSemanas) {
      setSemanaAtiva(Math.max(1, quantidadeSemanas))
    }
  }, [quantidadeSemanas, semanaAtiva])

  const itensSemanaAtual = useMemo(
    () => itens.filter((i) => i.semana_index === semanaAtiva),
    [itens, semanaAtiva],
  )

  const porDia = useMemo(() => {
    const map = new Map<number, EscalaModeloItemRow[]>()
    for (const d of DIAS_SEMANA) {
      map.set(
        d.dia,
        itensSemanaAtual.filter((i) => i.dia_semana === d.dia),
      )
    }
    return map
  }, [itensSemanaAtual])

  async function aoMudarQuantidadeSemanas(novo: number) {
    const v = Math.min(52, Math.max(1, novo))
    setQuantidadeSemanas(v)
    if (!user || !modeloId) return
    try {
      await atualizarEscalaModelo(user.id, modeloId, { quantidade_semanas: v })
      await excluirItensSemanaIndexAcima(user.id, modeloId, v)
      const its = await listarItensModelo(user.id, modeloId)
      setItens(its)
      if (semanaAtiva > v) setSemanaAtiva(v)
      setModelos((prev) =>
        prev.map((m) => (m.id === modeloId ? { ...m, quantidade_semanas: v } : m)),
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar.')
    }
  }

  async function criarNovoModelo() {
    if (!user || !localId || !setorId) {
      setErro('Selecione hospital e setor antes de criar um modelo.')
      return
    }
    setErro(null)
    try {
      const nome = `Modelo ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
      const m = await criarEscalaModelo(user.id, {
        local_id: localId,
        setor_id: setorId,
        nome,
        quantidade_semanas: quantidadeSemanas,
      })
      setModelos((prev) => [m, ...prev])
      setModeloId(m.id)
      setQuantidadeSemanas(m.quantidade_semanas)
      setItens([])
      setSemanaAtiva(1)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar modelo.')
    }
  }

  function abrirModalAdicionar(dia: number) {
    setItemEdicao(null)
    setDiaClicado(dia)
    setHoraInicio('07:00')
    setHoraFim('19:00')
    setTipo('util')
    setProfissionalIdModal('')
    setDiasSemanaSel(new Set([dia]))
    setModalAberto(true)
  }

  function abrirModalEditar(item: EscalaModeloItemRow) {
    setItemEdicao(item)
    setDiaClicado(item.dia_semana)
    setHoraInicio(formatarHoraDb(item.hora_inicio))
    setHoraFim(formatarHoraDb(item.hora_fim))
    setTipo(item.tipo as TomModelo)
    setProfissionalIdModal(item.profissional_id ?? '')
    setDiasSemanaSel(new Set([item.dia_semana]))
    setModalAberto(true)
  }

  function toggleDia(dia: number) {
    if (itemEdicao) {
      setDiasSemanaSel(new Set([dia]))
      return
    }
    setDiasSemanaSel((prev) => {
      const next = new Set(prev)
      if (next.has(dia)) {
        if (next.size > 1) next.delete(dia)
      } else {
        next.add(dia)
      }
      return next
    })
  }

  async function salvarModal() {
    if (!user || !modeloId) return
    setSalvandoModal(true)
    setErro(null)
    try {
      const profId = profissionalIdModal || null
      if (itemEdicao) {
        const unico = [...diasSemanaSel][0] ?? itemEdicao.dia_semana
        await atualizarItemModelo(user.id, itemEdicao.id, {
          semana_index: semanaAtiva,
          dia_semana: unico,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          tipo,
          profissional_id: profId,
        })
      } else {
        for (const dia of diasSemanaSel) {
          await inserirItemModelo(user.id, {
            modelo_id: modeloId,
            semana_index: semanaAtiva,
            dia_semana: dia,
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            tipo,
            profissional_id: profId,
          })
        }
      }
      const its = await listarItensModelo(user.id, modeloId)
      setItens(its)
      setModalAberto(false)
      setItemEdicao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao guardar.')
    } finally {
      setSalvandoModal(false)
    }
  }

  async function excluirItemAtual() {
    if (!user || !itemEdicao) return
    setSalvandoModal(true)
    try {
      await excluirItemModelo(user.id, itemEdicao.id)
      const its = await listarItensModelo(user.id, modeloId!)
      setItens(its)
      setModalAberto(false)
      setItemEdicao(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir.')
    } finally {
      setSalvandoModal(false)
    }
  }

  async function confirmarLimpar() {
    if (!user || !modeloId) return
    setLimpando(true)
    try {
      await limparTodosItensModelo(user.id, modeloId)
      setItens([])
      setModalLimpar(false)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao limpar.')
    } finally {
      setLimpando(false)
    }
  }

  async function confirmarApagarModelo() {
    if (!user || !modeloId || !localId || !setorId) return
    setApagandoModelo(true)
    setErro(null)
    try {
      await excluirEscalaModelo(user.id, modeloId)
      const lista = await listarModelosLocalSetor(user.id, localId, setorId)
      setModelos(lista)
      const nextId = lista[0]?.id ?? null
      setModeloId(nextId)
      setModalApagarModelo(false)
      if (nextId) {
        const m = lista.find((x) => x.id === nextId)
        if (m) setQuantidadeSemanas(m.quantidade_semanas)
        const its = await listarItensModelo(user.id, nextId)
        setItens(its)
      } else {
        setItens([])
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao apagar o modelo.')
    } finally {
      setApagandoModelo(false)
    }
  }

  async function exportarExcel() {
    if (!user || !modeloAtual) return
    setExportandoExcel(true)
    setErro(null)
    try {
      const profissionaisPorId = await buscarProfissionaisRelatorioEscala(user.id)
      const { exportarEscalaModeloParaXlsx } = await import(
        '../../lib/escalas/exportarEscalaModeloXlsx'
      )
      await exportarEscalaModeloParaXlsx({
        localNome: nomeLocalAtual || '—',
        setorNome: nomeSetorAtual || '—',
        modeloNome: modeloAtual.nome,
        quantidadeSemanas: modeloAtual.quantidade_semanas,
        itens: itens.map((i) => ({
          semana_index: i.semana_index,
          dia_semana: i.dia_semana,
          hora_inicio: i.hora_inicio,
          hora_fim: i.hora_fim,
          duracao_minutos: i.duracao_minutos,
          tipo: i.tipo as TomModelo,
          profissional_id: i.profissional_id,
        })),
        profissionaisPorId,
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao exportar.')
    } finally {
      setExportandoExcel(false)
    }
  }

  async function duplicarModelo() {
    if (!user || !modeloId) return
    setDuplicandoModelo(true)
    setErro(null)
    try {
      const novo = await duplicarEscalaModelo(user.id, modeloId)
      setModelos((prev) => [novo, ...prev])
      setModeloId(novo.id)
      setQuantidadeSemanas(novo.quantidade_semanas)
      setSemanaAtiva(1)
      const its = await listarItensModelo(user.id, novo.id)
      setItens(its)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao duplicar.')
    } finally {
      setDuplicandoModelo(false)
    }
  }

  function imprimirEscala() {
    window.print()
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        A carregar…
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <header className="no-print flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <LayoutGrid className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Escalas</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Modelos</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Defina padrões semanais por hospital e setor. Cada célula pode ter vários blocos de horário; use
              «Várias datas» para replicar o mesmo turno em vários dias.
            </p>
          </div>
        </div>
      </header>

      {erro ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {erro}
        </div>
      ) : null}

      <div className="no-print flex flex-col gap-4 ug-card p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <SeletorLocalSetor
          className="lg:flex-1"
          localId={localId}
          setorId={setorId}
          onLocalChange={setLocalId}
          onSetorChange={setSetorId}
          localLabel="Hospital"
          disabled={carregandoCatalogoLocais}
          selectClassName={cn(INPUT, 'min-w-[200px]')}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:gap-4">

          {modelos.length > 0 ? (
            <div className="min-w-[200px]">
              <span className="mb-1 block text-xs font-medium text-slate-600">Modelo</span>
              <select
                value={modeloId ?? ''}
                onChange={(e) => {
                  const id = e.target.value
                  setModeloId(id)
                  const m = modelos.find((x) => x.id === id)
                  if (m) setQuantidadeSemanas(m.quantidade_semanas)
                }}
                className={cn(INPUT, 'min-w-[200px]')}
              >
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">Quantidade de Semanas</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
                disabled={!modeloAtual || quantidadeSemanas <= 1}
                onClick={() => void aoMudarQuantidadeSemanas(quantidadeSemanas - 1)}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                max={52}
                value={quantidadeSemanas}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (Number.isFinite(n)) void aoMudarQuantidadeSemanas(n)
                }}
                className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm font-semibold tabular-nums"
              />
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
                disabled={!modeloAtual || quantidadeSemanas >= 52}
                onClick={() => void aoMudarQuantidadeSemanas(quantidadeSemanas + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void criarNovoModelo()}
          disabled={!localId || !setorId}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-50 lg:self-end"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Novo Modelo
        </button>
      </div>

      {modeloAtual && quantidadeSemanas > 1 ? (
        <div className="no-print flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Semana do ciclo:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              disabled={semanaAtiva <= 1}
              onClick={() => setSemanaAtiva((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-28 text-center text-sm font-semibold text-slate-800">
              Semana {semanaAtiva} / {quantidadeSemanas}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              disabled={semanaAtiva >= quantidadeSemanas}
              onClick={() => setSemanaAtiva((s) => Math.min(quantidadeSemanas, s + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {!localId || !setorId ? (
        <p className="text-sm text-slate-500">Escolha hospital e setor para ver ou criar modelos.</p>
      ) : carregando ? (
        <div className="flex items-center gap-2 py-12 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          A carregar modelos…
        </div>
      ) : !modeloId ? (
        <div className="no-print rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">
            Nenhum modelo para esta combinação. Clique em <strong>+ Novo Modelo</strong> para começar.
          </p>
        </div>
      ) : (
        <>
          <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Modelo: <span className="font-medium text-slate-900">{modeloAtual?.nome}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                title="Imprimir"
                className={BTN_ICONE}
                onClick={() => imprimirEscala()}
                aria-label="Imprimir escala"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={BTN_ACAO}
                disabled={exportandoExcel}
                onClick={() => void exportarExcel()}
              >
                {exportandoExcel ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                )}
                Exportar Escala
              </button>
              <button
                type="button"
                className={BTN_ACAO}
                disabled={duplicandoModelo}
                onClick={() => void duplicarModelo()}
              >
                {duplicandoModelo ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                )}
                Duplicar Modelo
              </button>
              <button type="button" className={BTN_ACAO} onClick={() => setModalLimpar(true)}>
                <X className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                Limpar Modelo
              </button>
              <button type="button" className={BTN_ACAO} onClick={() => setModalApagarModelo(true)}>
                <Trash2 className="h-4 w-4 shrink-0 text-red-700" aria-hidden />
                Apagar Modelo
              </button>
            </div>
          </div>

          <div className="hidden print:block print:mb-4 print:space-y-2 print:border-b print:border-slate-300 print:pb-4">
            <p className="text-center text-lg font-bold uppercase text-[#0070C0]">RELATÓRIO DE ESCALA MODELO</p>
            <p className="text-sm text-[#0070C0]">Quantidade de Semanas: {quantidadeSemanas}</p>
            <p className="text-sm text-slate-800">
              <span className="font-semibold">{nomeLocalAtual || '—'}</span>
              {' · '}
              <span className="font-semibold">{nomeSetorAtual || '—'}</span>
              {' — '}
              {modeloAtual?.nome}
            </p>
            {quantidadeSemanas > 1 ? (
              <p className="text-sm text-slate-600">
                Semana do ciclo (vista): {semanaAtiva} / {quantidadeSemanas}
              </p>
            ) : null}
          </div>

          <div className="overflow-x-auto ug-card shadow-sm print:border-slate-400 print:shadow-none">
            <table className="w-full min-w-[840px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {DIAS_SEMANA.map(({ dia, sigla }) => (
                    <th
                      key={dia}
                      className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {sigla}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DIAS_SEMANA.map(({ dia }) => (
                    <td key={dia} className="align-top border-l border-slate-100 p-2 first:border-l-0">
                      <button
                        type="button"
                        onClick={() => abrirModalAdicionar(dia)}
                        className="flex min-h-36 w-full flex-col gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                      >
                        {(porDia.get(dia) ?? []).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              abrirModalEditar(item)
                            }}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-left text-xs font-medium shadow-sm transition-colors',
                              item.tipo === 'fds'
                                ? 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100'
                                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                            )}
                          >
                            <span className="tabular-nums">
                              {formatarHoraDb(item.hora_inicio)} – {formatarHoraDb(item.hora_fim)}
                            </span>
                            {item.profissionais?.nome ? (
                              <span className="mt-0.5 block truncate text-[10px] font-normal text-slate-600">
                                {item.profissionais.nome}
                              </span>
                            ) : null}
                          </button>
                        ))}
                        <span className="mt-auto text-[10px] text-slate-400 print:hidden">
                          + clique para adicionar
                        </span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <ModalAdicionarModelo
        aberto={modalAberto}
        titulo={itemEdicao ? 'Editar modelo' : 'Adicionar modelo'}
        semanaIndex={semanaAtiva}
        diaClicado={diaClicado}
        profissionais={profissionais}
        horaInicio={horaInicio}
        horaFim={horaFim}
        tipo={tipo}
        profissionalId={profissionalIdModal}
        diasSemanaSel={diasSemanaSel}
        salvarLabel={itemEdicao ? 'Guardar' : 'Adicionar'}
        salvando={salvandoModal}
        onFechar={() => {
          setModalAberto(false)
          setItemEdicao(null)
        }}
        onChangeHoraInicio={setHoraInicio}
        onChangeHoraFim={setHoraFim}
        onChangeTipo={setTipo}
        onChangeProfissional={setProfissionalIdModal}
        onToggleDia={toggleDia}
        onSalvar={() => void salvarModal()}
        modoEdicao={Boolean(itemEdicao)}
        onExcluirItem={itemEdicao ? () => void excluirItemAtual() : undefined}
      />

      <ModalConfirmarLimpar
        aberto={modalLimpar}
        onFechar={() => setModalLimpar(false)}
        onConfirmar={() => void confirmarLimpar()}
        carregando={limpando}
      />

      <ModalConfirmarApagarModelo
        aberto={modalApagarModelo}
        onFechar={() => setModalApagarModelo(false)}
        onConfirmar={() => void confirmarApagarModelo()}
        carregando={apagandoModelo}
      />
    </div>
  )
}
