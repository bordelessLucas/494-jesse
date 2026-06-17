import {
  Loader2,
  ArrowLeftRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Headphones,
  History,
  Info,
  Megaphone,
  Plus,
  Printer,
  RefreshCw,
  Settings2,
  Trash2,
  User,
  UserCog,
  X,
} from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import {
  buscarLocaisEscala,
  buscarPlantoesIntervalo,
  buscarProfissionaisEscala,
  buscarSetoresEscala,
  chaveDataPlantaoDb,
  formatarHoraDb,
  plantaoRowParaCartao,
  tomParaData,
  type PlantaoRowDb,
  type SetorEscalaDb,
} from '../../lib/escalas/plantoesDb'
import type {
  ContextoModalPlantao,
  PlantaoCartao,
  StatusPlantaoEscala,
} from '../../lib/escalas/escalaTypes'
import { marcarAnuncioProprio } from '../../lib/escalas/muralTrocasAlertas'
import { carregarMapaConselhoValidado } from '../../lib/documentos/documentosUsuariosDb'
import {
  EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO,
  MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO,
  profissionalPodeSerAlocadoEmPlantao,
} from '../../lib/documentos/validacaoDocumentos'
import {
  anunciarPlantaoNoMural,
  aprovarTrocaPlantao,
  buscarCandidatosPlantao,
  cancelarAnuncioPlantaoMural,
  candidatarSePlantao,
  substituirProfissionalPlantao,
  type CandidatoTrocaPlantao,
} from '../../lib/escalas/muralTrocasDb'
import {
  avaliarAvisoCargaSemanal,
  calcularCargaHorariaSemanal,
  intervaloPlantao,
  observacoesComJustificativaCoordenacao,
  verificarChoqueHorario,
  type ResultadoAvisoCargaSemanal,
  type ResultadoChoqueHorario,
} from '../../lib/escalas/validacoesEscala'
import { duracaoHorasPlantao } from '../../lib/dashboard/plantaoHoras'
import { supabase } from '../../lib/supabase'
import { useContaMembro } from '../../hooks/useContaMembro'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { SeletorModeloEscala } from './components/SeletorModeloEscala'

const MESES_PT_MAIUSC = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
] as const

const DIAS_SEMANA_SIGLA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'] as const

/** Mesmo valor que em EscalaMensalPage: combina com todos os setores do local. */
const TODOS_SETORES = 'todos-setores'

export type {
  ContextoModalPlantao,
  PlantaoCartao,
  StatusPlantaoEscala,
  TomCartao,
} from '../../lib/escalas/escalaTypes'

function inicioSemanaISO(ref: Date): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const diaJs = d.getDay()
  const offset = diaJs === 0 ? -6 : 1 - diaJs
  d.setDate(d.getDate() + offset)
  return d
}

function adicionarDias(data: Date, dias: number): Date {
  const n = new Date(data)
  n.setDate(n.getDate() + dias)
  return n
}

function chaveData(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function mesmoDia(a: Date, b: Date): boolean {
  return chaveData(a) === chaveData(b)
}

function rotuloMesAnoRefSemana(inicioSegunda: Date): string {
  const fim = adicionarDias(inicioSegunda, 6)
  const m0 = inicioSegunda.getMonth()
  const y0 = inicioSegunda.getFullYear()
  const m1 = fim.getMonth()
  const y1 = fim.getFullYear()
  if (m0 === m1 && y0 === y1) {
    return `${MESES_PT_MAIUSC[m0]} / ${y0}`
  }
  return `${MESES_PT_MAIUSC[m0]} – ${MESES_PT_MAIUSC[m1]} / ${y1}`
}

/** Habilidades de demonstração para a aba «Habilidades» (por índice do profissional). */
const HABILIDADES_DEMO: string[][] = [
  ['ACLS', 'PALS', 'Ventilação mecânica', 'Intercorrências em UTI'],
  ['Suporte avançado de vida', 'Sedação', 'Cateterismo periférico'],
  ['ATLS', 'Trauma grave', 'Via aérea difícil'],
  ['Neonatologia', 'Reanimação neonatal', 'Aleitamento'],
  ['Centro cirúrgico', 'Instrumentação', 'Pré-operatório'],
  ['Cardiologia', 'ECG', 'Farmacologia cardioativa'],
  ['Emergência', 'Triagem Manchester', 'Oxigenoterapia'],
  ['Nefrologia', 'Diálise', 'Controle eletrolítico'],
]

type CartaoPlantaoProps = {
  cartao: PlantaoCartao
  onClick?: () => void
  /** Ex.: nome do setor quando o filtro da grelha é «Todos os setores». */
  linhaAuxiliar?: string
}

function formatarDataBrasileira(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Diferença aproximada HH:MM entre início e fim (tratavirada para o dia seguinte). */
function diferencaHoras(ini: string, fim: string): string {
  const parse = (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
  }
  const start = parse(ini)
  let end = parse(fim)
  if (end < start) end += 24 * 60
  const diff = Math.max(0, end - start)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const INPUT_MODAL =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100'

const TEXTAREA_MODAL =
  'min-h-[7.5rem] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner outline-none transition-colors focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100'

function minutosDesdeMeiaNoite(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

/** Se o horário de fim é anterior ou igual ao de início, assume plantão com virada de dia. */
function plantaoCruzaMeiaNoite(horaInicio: string, horaFim: string): boolean {
  return minutosDesdeMeiaNoite(horaFim) <= minutosDesdeMeiaNoite(horaInicio)
}

function habilidadesDemoParaNome(nome: string): string[] {
  let s = 0
  for (let i = 0; i < nome.length; i++) s += nome.charCodeAt(i)
  return HABILIDADES_DEMO[s % HABILIDADES_DEMO.length]
}

function capitalizeFirstLetter(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

type AbaPlantaoModal =
  | 'informacoes'
  | 'detalhes'
  | 'habilidades'
  | 'trocas'
  | 'anunciar'

type ItemLocalModal = { id: string; nome: string }
type ItemSetorModal = { id: string; nome: string; local_id: string }
type ItemProfModal = { id: string; nome: string }

type ModalAlterarPlantaoProps = {
  aberto: boolean
  contexto: ContextoModalPlantao | null
  onFechar: () => void
  userId: string | null
  locais: ItemLocalModal[]
  setores: ItemSetorModal[]
  profissionais: ItemProfModal[]
  conselhoValidadoPorProf: Map<string, boolean>
  onPlantaoMutado: () => void
}

const ABAS_PLANTAO: {
  id: AbaPlantaoModal
  rotulo: string
  Icone: typeof FileText
}[] = [
  { id: 'informacoes', rotulo: 'Informações', Icone: FileText },
  { id: 'detalhes', rotulo: 'Detalhes', Icone: User },
  { id: 'habilidades', rotulo: 'Habilidades', Icone: UserCog },
  { id: 'trocas', rotulo: 'Trocas', Icone: ArrowLeftRight },
  { id: 'anunciar', rotulo: 'Anunciar', Icone: Megaphone },
]

export function ModalAlterarPlantao({
  aberto,
  contexto,
  onFechar,
  userId,
  locais,
  setores,
  profissionais,
  conselhoValidadoPorProf,
  onPlantaoMutado,
}: ModalAlterarPlantaoProps) {
  const { enviarNotificacaoNovaEscala } = useNotificacoes()
  const { isTitular, isMembroProfissional, profissionalId: profissionalIdMembro } =
    useContaMembro()
  const isCoordenador = isTitular
  const isProfissional = isMembroProfissional

  function profissionalPodeAssumirPlantao(profId: string | null | undefined): boolean {
    if (!profId || !isCoordenador) return true
    return profissionalPodeSerAlocadoEmPlantao(profId, conselhoValidadoPorProf)
  }

  function alertarDocumentosPendentes(): void {
    setErroSalvar(MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO)
    window.alert(MENSAGEM_BLOQUEIO_DOCUMENTOS_CONSELHO)
  }

  function aoSelecionarProfissional(profId: string) {
    if (profId && isCoordenador && !profissionalPodeAssumirPlantao(profId)) {
      alertarDocumentosPendentes()
      return
    }
    setProfissionalSel(profId)
    setErroSalvar(null)
  }

  function aoSelecionarRepasse(profId: string) {
    if (profId && isCoordenador && !profissionalPodeAssumirPlantao(profId)) {
      alertarDocumentosPendentes()
      return
    }
    setRepasseProfissionalId(profId)
  }
  const tituloModalId = useId()
  const [aba, setAba] = useState<AbaPlantaoModal>('informacoes')
  const [informarProfissionais, setInformarProfissionais] = useState(false)
  const [listarTodosFixo, setListarTodosFixo] = useState(false)
  const [listarTodosPlantao, setListarTodosPlantao] = useState(false)
  const [precisaCobertura, setPrecisaCobertura] = useState(false)

  const [localSel, setLocalSel] = useState('')
  const [setorSel, setSetorSel] = useState('')
  const [profissionalSel, setProfissionalSel] = useState('')
  const [horaInicioForm, setHoraInicioForm] = useState('07:00')
  const [horaFimForm, setHoraFimForm] = useState('19:00')
  const [situacao, setSituacao] = useState<StatusPlantaoEscala>('pendente')
  const [valorPlantaoNum, setValorPlantaoNum] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  /** yyyy-MM-dd para input type="date" */
  const [dataPlantaoIso, setDataPlantaoIso] = useState('')

  const [entradaData, setEntradaData] = useState('')
  const [entradaHora, setEntradaHora] = useState('')
  const [saidaData, setSaidaData] = useState('')
  const [saidaHora, setSaidaHora] = useState('')
  const [outrasInformacoes, setOutrasInformacoes] = useState('')
  const [observacaoInterna, setObservacaoInterna] = useState('')
  const [disponivelMural, setDisponivelMural] = useState(false)
  const [salvandoAnuncio, setSalvandoAnuncio] = useState(false)
  const [candidatosMural, setCandidatosMural] = useState<CandidatoTrocaPlantao[]>([])
  const [repasseProfissionalId, setRepasseProfissionalId] = useState('')
  const [salvandoTroca, setSalvandoTroca] = useState(false)
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false)
  const [choqueHorario, setChoqueHorario] = useState<ResultadoChoqueHorario | null>(null)
  const [avisoCarga, setAvisoCarga] = useState<ResultadoAvisoCargaSemanal | null>(null)
  const [justificativaCoordenacao, setJustificativaCoordenacao] = useState('')
  const [validandoCompliance, setValidandoCompliance] = useState(false)

  const setoresDoLocal = useMemo(
    () => setores.filter((s) => s.local_id === localSel),
    [localSel, setores],
  )

  useEffect(() => {
    if (!aberto || !contexto) return
    setLocalSel(contexto.localId)
    setSetorSel(contexto.setorId)
    setProfissionalSel(contexto.profissionalId ?? '')
    setHoraInicioForm(contexto.cartao.horaInicio)
    setHoraFimForm(contexto.cartao.horaFim)
    const st =
      contexto.cartao.status ??
      (contexto.profissionalId ? 'confirmado' : 'pendente')
    setSituacao(st === 'vago' ? 'vago' : st)
    setValorPlantaoNum(
      typeof contexto.valorPlantao === 'number' && Number.isFinite(contexto.valorPlantao)
        ? contexto.valorPlantao
        : 0,
    )
    setErroSalvar(null)

    const { dia, cartao } = contexto
    setDataPlantaoIso(format(dia, 'yyyy-MM-dd'))
    setEntradaData(formatarDataBrasileira(dia))
    setEntradaHora(cartao.horaInicio)
    const diaSaida = plantaoCruzaMeiaNoite(cartao.horaInicio, cartao.horaFim)
      ? adicionarDias(dia, 1)
      : dia
    setSaidaData(formatarDataBrasileira(diaSaida))
    setSaidaHora(cartao.horaFim)
    setDisponivelMural(contexto.disponivelMural ?? false)
    setCandidatosMural([])
    setRepasseProfissionalId('')
  }, [aberto, contexto])

  const carregarCandidatosMural = useCallback(async (plantaoId: string) => {
    setCarregandoCandidatos(true)
    try {
      const rows = await buscarCandidatosPlantao(plantaoId)
      setCandidatosMural(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar candidatos.')
      setCandidatosMural([])
    } finally {
      setCarregandoCandidatos(false)
    }
  }, [])

  useEffect(() => {
    if (!aberto || !contexto?.plantaoId || !disponivelMural) {
      if (!disponivelMural) setCandidatosMural([])
      return
    }
    if (aba !== 'trocas' && aba !== 'anunciar') return
    void carregarCandidatosMural(contexto.plantaoId)
  }, [
    aba,
    aberto,
    carregarCandidatosMural,
    contexto?.plantaoId,
    disponivelMural,
  ])

  useEffect(() => {
    if (!aberto || !contexto || !dataPlantaoIso) return
    setEntradaHora(horaInicioForm)
    const diaBase = parseISO(dataPlantaoIso)
    setEntradaData(formatarDataBrasileira(diaBase))
    const diaSaida = plantaoCruzaMeiaNoite(horaInicioForm, horaFimForm)
      ? adicionarDias(diaBase, 1)
      : diaBase
    setSaidaData(formatarDataBrasileira(diaSaida))
    setSaidaHora(horaFimForm)
  }, [aberto, contexto, dataPlantaoIso, horaFimForm, horaInicioForm])

  useEffect(() => {
    if (!aberto || !contexto) return
    const validos = setores.filter((s) => s.local_id === localSel)
    if (validos.length === 0) return
    if (!validos.some((s) => s.id === setorSel)) {
      setSetorSel(validos[0].id)
    }
  }, [aberto, contexto, localSel, setorSel, setores])

  useEffect(() => {
    if (situacao === 'vago') setProfissionalSel('')
  }, [situacao])

  useEffect(() => {
    if (!aberto || !contexto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, contexto, onFechar])

  useEffect(() => {
    if (aberto) {
      setAba('informacoes')
      setInformarProfissionais(false)
      setListarTodosFixo(false)
      setListarTodosPlantao(false)
      setPrecisaCobertura(false)
      setOutrasInformacoes('')
      setObservacaoInterna('')
      setJustificativaCoordenacao('')
      setChoqueHorario(null)
      setAvisoCarga(null)
    }
  }, [aberto, contexto?.cartao.id, contexto?.dia])

  useEffect(() => {
    if (!aberto || !userId || !profissionalSel || situacao === 'vago') {
      setChoqueHorario(null)
      setAvisoCarga(null)
      return
    }
    if (!dataPlantaoIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataPlantaoIso)) return

    const plantaoIdExcluir = contexto?.plantaoId ?? null
    let cancelado = false

    const timer = window.setTimeout(() => {
      void (async () => {
        setValidandoCompliance(true)
        try {
          const { inicio, fim } = intervaloPlantao(
            dataPlantaoIso,
            horaInicioForm,
            horaFimForm,
          )
          const choque = await verificarChoqueHorario(
            userId,
            profissionalSel,
            inicio,
            fim,
            plantaoIdExcluir,
          )
          const horasNovo = duracaoHorasPlantao(
            dataPlantaoIso,
            horaInicioForm,
            horaFimForm,
          )
          const acumulada = await calcularCargaHorariaSemanal(
            userId,
            profissionalSel,
            dataPlantaoIso,
            plantaoIdExcluir,
          )
          if (cancelado) return
          setChoqueHorario(choque)
          setAvisoCarga(avaliarAvisoCargaSemanal(acumulada, horasNovo))
        } catch {
          if (!cancelado) {
            setChoqueHorario(null)
            setAvisoCarga(null)
          }
        } finally {
          if (!cancelado) setValidandoCompliance(false)
        }
      })()
    }, 350)

    return () => {
      cancelado = true
      window.clearTimeout(timer)
    }
  }, [
    aberto,
    userId,
    profissionalSel,
    situacao,
    dataPlantaoIso,
    horaInicioForm,
    horaFimForm,
    contexto?.plantaoId,
  ])

  const reaplicarDatasDetalhes = useCallback(() => {
    if (!contexto || !dataPlantaoIso) return
    const diaBase = parseISO(dataPlantaoIso)
    setEntradaData(formatarDataBrasileira(diaBase))
    setEntradaHora(horaInicioForm)
    const diaSaida = plantaoCruzaMeiaNoite(horaInicioForm, horaFimForm)
      ? adicionarDias(diaBase, 1)
      : diaBase
    setSaidaData(formatarDataBrasileira(diaSaida))
    setSaidaHora(horaFimForm)
  }, [contexto, dataPlantaoIso, horaFimForm, horaInicioForm])

  if (!aberto || !contexto) return null

  const plantaoIdReal = contexto.plantaoId ?? null
  const isNovo = !plantaoIdReal

  const { cartao } = contexto
  const plantaoProfissionalId = profissionalSel || contexto.profissionalId || null
  const nomeProfissionalPlantao =
    profissionais.find((p) => p.id === plantaoProfissionalId)?.nome ?? cartao.nome
  const podeAnunciarPlantao =
    Boolean(plantaoIdReal) &&
    situacao !== 'vago' &&
    Boolean(plantaoProfissionalId) &&
    isProfissional &&
    plantaoProfissionalId === profissionalIdMembro

  const isDonoProfissionalPlantao =
    isProfissional && plantaoProfissionalId === profissionalIdMembro
  const podeCancelarAnuncioMural = isDonoProfissionalPlantao && disponivelMural
  const veListaCandidatosMural =
    disponivelMural && (isCoordenador || isDonoProfissionalPlantao)
  const veInteressePlantao =
    disponivelMural &&
    isProfissional &&
    Boolean(plantaoProfissionalId) &&
    plantaoProfissionalId !== profissionalIdMembro
  const jaCandidatou =
    Boolean(profissionalIdMembro) &&
    candidatosMural.some((c) => c.profissionalId === profissionalIdMembro)
  const profissionaisRepasseDireto = profissionais.filter(
    (p) => p.id !== plantaoProfissionalId,
  )

  const diaPlantaoExibicao =
    dataPlantaoIso && /^\d{4}-\d{2}-\d{2}$/.test(dataPlantaoIso)
      ? parseISO(dataPlantaoIso)
      : contexto.dia
  const hospitalRotulo =
    locais.find((l) => l.id === localSel)?.nome.toUpperCase() ?? 'LOCAL'
  const duracao = diferencaHoras(horaInicioForm, horaFimForm)
  const bloqueadoPorChoque = Boolean(choqueHorario?.temChoque)
  const exigeJustificativaCarga = Boolean(avisoCarga?.excedeLimite)
  const justificativaPendente =
    exigeJustificativaCarga && !justificativaCoordenacao.trim()
  const salvarDesabilitado =
    salvando || bloqueadoPorChoque || justificativaPendente

  async function salvarPlantao() {
    if (!userId) {
      setErroSalvar('Sessão inválida.')
      return
    }
    if (!localSel || !setorSel) {
      setErroSalvar('Selecione local e setor.')
      return
    }
    const setorOk = setores.some((s) => s.id === setorSel && s.local_id === localSel)
    if (!setorOk) {
      setErroSalvar('Setor inválido para o local.')
      return
    }

    let statusFinal: StatusPlantaoEscala = situacao
    let profId: string | null = profissionalSel || null
    if (situacao === 'vago') {
      profId = null
      statusFinal = 'vago'
    } else if (situacao === 'confirmado' && !profId) {
      setErroSalvar('Selecione um profissional para situação confirmada.')
      return
    } else if (situacao === 'realizado' && !profId) {
      setErroSalvar('Selecione um profissional para situação realizada.')
      return
    }

    if (profId && isCoordenador && !profissionalPodeAssumirPlantao(profId)) {
      alertarDocumentosPendentes()
      return
    }

    if (profId && situacao !== 'vago') {
      if (choqueHorario?.temChoque) {
        setErroSalvar(
          choqueHorario.mensagem ??
            'Conflito detetado: este profissional já está escalado neste horário.',
        )
        return
      }
      if (avisoCarga?.excedeLimite && !justificativaCoordenacao.trim()) {
        setErroSalvar(
          'Preencha a justificativa da coordenação para gravar com limite de 60 horas semanais excedido.',
        )
        return
      }
    }

    if (!dataPlantaoIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataPlantaoIso)) {
      setErroSalvar('Informe a data do plantão.')
      return
    }
    const dataIso = dataPlantaoIso
    const agora = new Date().toISOString()

    const valorPlantaoGravar =
      Number.isFinite(valorPlantaoNum) && valorPlantaoNum >= 0 ? valorPlantaoNum : 0

    let observacoesGravar: string | null | undefined = undefined
    if (profId && avisoCarga?.excedeLimite && justificativaCoordenacao.trim()) {
      if (isNovo) {
        observacoesGravar = observacoesComJustificativaCoordenacao(
          null,
          justificativaCoordenacao,
        )
      } else {
        const { data: rowObs } = await supabase
          .from('plantoes')
          .select('observacoes')
          .eq('id', plantaoIdReal)
          .eq('user_id', userId)
          .maybeSingle()
        observacoesGravar = observacoesComJustificativaCoordenacao(
          rowObs?.observacoes,
          justificativaCoordenacao,
        )
      }
    }

    setSalvando(true)
    setErroSalvar(null)
    try {
      if (isNovo) {
        const { error } = await supabase.from('plantoes').insert({
          user_id: userId,
          local_id: localSel,
          setor_id: setorSel,
          profissional_id: profId,
          data_plantao: dataIso,
          hora_inicio: horaInicioForm,
          hora_fim: horaFimForm,
          status: statusFinal,
          valor_plantao: valorPlantaoGravar,
          ...(observacoesGravar != null ? { observacoes: observacoesGravar } : {}),
          updated_at: agora,
        })
        if (error) {
          setErroSalvar(error.message)
          return
        }
      } else {
        const { error } = await supabase
          .from('plantoes')
          .update({
            local_id: localSel,
            setor_id: setorSel,
            profissional_id: profId,
            data_plantao: dataIso,
            hora_inicio: horaInicioForm,
            hora_fim: horaFimForm,
            status: statusFinal,
            valor_plantao: valorPlantaoGravar,
            ...(observacoesGravar != null ? { observacoes: observacoesGravar } : {}),
            updated_at: agora,
          })
          .eq('id', plantaoIdReal)
          .eq('user_id', userId)
        if (error) {
          setErroSalvar(error.message)
          return
        }
      }
      onPlantaoMutado()

      if (profId) {
        const setorNome = setores.find((s) => s.id === setorSel)?.nome ?? 'Setor'
        const dia = parseISO(dataIso)
        const mes = capitalizeFirstLetter(format(dia, 'MMMM', { locale: ptBR }))
        const dataRotulo = `${format(dia, 'dd', { locale: ptBR })}/${mes}`

        void enviarNotificacaoNovaEscala({
          profissionalId: profId,
          setor: setorNome,
          data: dataRotulo,
        })
        toast.success('Profissional notificado com sucesso!')
      }

      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluirPlantao() {
    if (!userId || !plantaoIdReal) return
    if (!window.confirm('Excluir este plantão?')) return
    setSalvando(true)
    setErroSalvar(null)
    try {
      const { error } = await supabase
        .from('plantoes')
        .delete()
        .eq('id', plantaoIdReal)
        .eq('user_id', userId)
      if (error) {
        setErroSalvar(error.message)
        return
      }
      onPlantaoMutado()
      onFechar()
    } finally {
      setSalvando(false)
    }
  }

  async function anunciarNoMural() {
    if (!userId || !plantaoIdReal || !podeAnunciarPlantao) return
    setSalvandoAnuncio(true)
    setErroSalvar(null)
    try {
      marcarAnuncioProprio(plantaoIdReal)
      await anunciarPlantaoNoMural(plantaoIdReal)

      setDisponivelMural(true)
      setSituacao('pendente_troca')
      onPlantaoMutado()
      toast.success('Plantão anunciado no Mural de Trocas!')
      void carregarCandidatosMural(plantaoIdReal)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao anunciar plantão.')
    } finally {
      setSalvandoAnuncio(false)
    }
  }

  async function cancelarAnuncioMural() {
    if (!userId || !plantaoIdReal || !podeCancelarAnuncioMural) return
    setSalvandoAnuncio(true)
    setErroSalvar(null)
    try {
      const statusRevertido: StatusPlantaoEscala = plantaoProfissionalId
        ? 'confirmado'
        : 'pendente'
      await cancelarAnuncioPlantaoMural(plantaoIdReal, statusRevertido)

      setDisponivelMural(false)
      setSituacao(statusRevertido)
      setCandidatosMural([])
      onPlantaoMutado()
      toast.success('Anúncio cancelado com sucesso.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cancelar anúncio.')
    } finally {
      setSalvandoAnuncio(false)
    }
  }

  async function aprovarCandidato(candidato: CandidatoTrocaPlantao) {
    if (!userId || !plantaoIdReal || !isCoordenador) return
    if (!profissionalPodeAssumirPlantao(candidato.profissionalId)) {
      alertarDocumentosPendentes()
      return
    }
    setSalvandoTroca(true)
    setErroSalvar(null)
    try {
      await aprovarTrocaPlantao({
        plantaoId: plantaoIdReal,
        solicitacaoId: candidato.id,
        candidatoProfissionalId: candidato.profissionalId,
      })

      setProfissionalSel(candidato.profissionalId)
      setSituacao('confirmado')
      setDisponivelMural(false)
      setCandidatosMural([])
      onPlantaoMutado()
      toast.success('Troca aprovada com sucesso!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao aprovar troca.')
    } finally {
      setSalvandoTroca(false)
    }
  }

  async function registrarInteressePlantao() {
    if (
      !profissionalIdMembro ||
      !veInteressePlantao ||
      jaCandidatou ||
      !plantaoIdReal ||
      !plantaoProfissionalId
    ) {
      return
    }
    setSalvandoTroca(true)
    try {
      await candidatarSePlantao({
        plantaoId: plantaoIdReal,
        anuncianteProfissionalId: plantaoProfissionalId,
      })
      await carregarCandidatosMural(plantaoIdReal)
      toast.success('Interesse registrado! Aguarde aprovação da coordenação.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar interesse.')
    } finally {
      setSalvandoTroca(false)
    }
  }

  async function substituirProfissionalDireto() {
    if (!userId || !plantaoIdReal || !isCoordenador || !repasseProfissionalId) return
    if (!profissionalPodeAssumirPlantao(repasseProfissionalId)) {
      alertarDocumentosPendentes()
      return
    }
    setSalvandoTroca(true)
    setErroSalvar(null)
    try {
      await substituirProfissionalPlantao({
        plantaoId: plantaoIdReal,
        novoProfissionalId: repasseProfissionalId,
      })

      setProfissionalSel(repasseProfissionalId)
      setSituacao('confirmado')
      setDisponivelMural(false)
      setCandidatosMural([])
      setRepasseProfissionalId('')
      onPlantaoMutado()
      toast.success('Profissional substituído com sucesso!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao substituir profissional.')
    } finally {
      setSalvandoTroca(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Fechar modal"
        onClick={onFechar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloModalId}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {choqueHorario?.temChoque ? (
          <div
            className="border-b border-danger-300 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800"
            role="alert"
          >
            {choqueHorario.mensagem}
          </div>
        ) : null}
        {avisoCarga?.excedeLimite ? (
          <div
            className="border-b border-warning-300 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-900"
            role="status"
          >
            {avisoCarga.mensagem}
          </div>
        ) : null}
        {erroSalvar ? (
          <div
            className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {erroSalvar}
          </div>
        ) : null}
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Plus className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
            <h2
              id={tituloModalId}
              className="text-base font-bold uppercase tracking-wide text-primary-600"
            >
              {isNovo ? 'Novo plantão' : 'Alterar plantão'}
            </h2>
            <History
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden
            />
          </div>

          <label className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
            <input
              type="checkbox"
              checked={informarProfissionais}
              onChange={(e) => setInformarProfissionais(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium">Profissional(is)</span>
            <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden />
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={salvando || isNovo}
              className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-40"
              title="Eliminar"
              aria-label="Eliminar plantão"
              onClick={() => void excluirPlantao()}
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              disabled={salvarDesabilitado}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
              onClick={() => void salvarPlantao()}
            >
              {validandoCompliance ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {isNovo ? 'Salvar' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <nav className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-50 py-3 md:flex">
            {ABAS_PLANTAO.map(({ id, rotulo, Icone }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors',
                  aba === id
                    ? 'border-l-4 border-primary-600 bg-sky-50/80 text-primary-800'
                    : 'border-l-4 border-transparent text-slate-600 hover:bg-white/80',
                )}
              >
                <Icone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {rotulo}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white">
            <div className="border-b border-slate-200 p-3 md:hidden">
              <select
                className={INPUT_MODAL}
                value={aba}
                onChange={(e) => setAba(e.target.value as AbaPlantaoModal)}
              >
                {ABAS_PLANTAO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </div>

            {aba === 'informacoes' && (
              <div className="space-y-0 p-5 sm:p-6">
                {exigeJustificativaCarga ? (
                  <section className="mb-6 rounded-lg border border-warning-200 bg-warning-50/60 p-4">
                    <label
                      htmlFor={`${tituloModalId}-justificativa-coordenacao`}
                      className="mb-2 block text-sm font-semibold text-warning-900"
                    >
                      Justificativa da Coordenação
                      <span className="text-danger-600"> *</span>
                    </label>
                    <textarea
                      id={`${tituloModalId}-justificativa-coordenacao`}
                      className={TEXTAREA_MODAL}
                      value={justificativaCoordenacao}
                      onChange={(e) => {
                        setJustificativaCoordenacao(e.target.value)
                        setErroSalvar(null)
                      }}
                      rows={3}
                      placeholder="Descreva o motivo da alocação acima do limite de 60 horas semanais…"
                      required
                    />
                    <p className="mt-2 text-xs text-warning-800">
                      Obrigatório para gravar este plantão. A justificativa será
                      registrada nas observações do plantão no Supabase.
                    </p>
                  </section>
                ) : null}
                <section className="border-b border-slate-200 pb-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Local e setor
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                        {hospitalRotulo}
                      </label>
                      <select
                        className={INPUT_MODAL}
                        value={localSel}
                        onChange={(e) => setLocalSel(e.target.value)}
                        disabled={salvando || locais.length === 0}
                      >
                        {locais.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                        Setor
                      </label>
                      <select
                        className={INPUT_MODAL}
                        value={setorSel}
                        onChange={(e) => setSetorSel(e.target.value)}
                        disabled={salvando || setoresDoLocal.length === 0}
                      >
                        {setoresDoLocal.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Tipo (visual)
                    </label>
                    <select className={INPUT_MODAL} defaultValue="normal">
                      <option value="normal">Normal</option>
                      <option value="fds">Fim de semana</option>
                      <option value="noturno">Noturno</option>
                    </select>
                  </div>
                </section>

                <section className="border-b border-slate-200 py-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Informe a duração, início, valor e data
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                        Duração
                        <Info className="h-3 w-3 text-slate-400" aria-hidden />
                      </label>
                      <input
                        type="text"
                        className={INPUT_MODAL}
                        readOnly
                        value={duracao}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Início
                      </label>
                      <input
                        type="text"
                        className={INPUT_MODAL}
                        value={horaInicioForm}
                        onChange={(e) => setHoraInicioForm(e.target.value)}
                        disabled={salvando}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Fim
                      </label>
                      <input
                        type="text"
                        className={INPUT_MODAL}
                        value={horaFimForm}
                        onChange={(e) => setHoraFimForm(e.target.value)}
                        disabled={salvando}
                      />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                        Valor
                        <Info className="h-3 w-3 text-slate-400" aria-hidden />
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={INPUT_MODAL}
                        value={valorPlantaoNum}
                        onChange={(e) => {
                          const v =
                            e.target.value === '' ? 0 : Number.parseFloat(e.target.value)
                          setValorPlantaoNum(Number.isFinite(v) ? v : 0)
                        }}
                        disabled={salvando}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Data
                      </label>
                      <input
                        type="date"
                        className={INPUT_MODAL}
                        value={dataPlantaoIso}
                        onChange={(e) => setDataPlantaoIso(e.target.value)}
                        disabled={salvando}
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatarDataBrasileira(diaPlantaoExibicao)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="pt-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Selecione o(s) profissional(is) para este plantão
                  </h3>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={listarTodosFixo}
                          onChange={(e) => setListarTodosFixo(e.target.checked)}
                          className="rounded border-slate-300 text-primary-600"
                        />
                        Listar todos
                      </label>
                      <div className="relative">
                        <select
                          className={cn(INPUT_MODAL, 'pr-20')}
                          value={profissionalSel}
                          onChange={(e) => aoSelecionarProfissional(e.target.value)}
                          disabled={salvando || situacao === 'vago'}
                        >
                          <option value="">—</option>
                          {profissionais.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.nome}
                              {isCoordenador &&
                              EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO &&
                              conselhoValidadoPorProf.get(n.id) !== true
                                ? ' (doc. pendente)'
                                : ''}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-9 top-1/2 flex -translate-y-1/2 gap-1">
                          <Info className="h-4 w-4 text-slate-400" aria-hidden />
                          <Headphones className="h-4 w-4 text-slate-400" aria-hidden />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Profissional fixo
                      </p>
                      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={precisaCobertura}
                          onChange={(e) => setPrecisaCobertura(e.target.checked)}
                          className="rounded border-slate-300 text-primary-600"
                        />
                        Precisa de cobertura
                      </label>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Situação
                      </label>
                      <select
                        className={cn(INPUT_MODAL, 'mb-4')}
                        value={situacao}
                        onChange={(e) =>
                          setSituacao(e.target.value as StatusPlantaoEscala)
                        }
                        disabled={salvando}
                      >
                        <option value="vago">Vago</option>
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="realizado">Realizado</option>
                      </select>
                      <label className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={listarTodosPlantao}
                          onChange={(e) =>
                            setListarTodosPlantao(e.target.checked)
                          }
                          className="rounded border-slate-300 text-primary-600"
                        />
                        Listar todos
                      </label>
                      <div className="relative">
                        <select
                          className={cn(INPUT_MODAL, 'pr-20')}
                          value={profissionalSel}
                          onChange={(e) => aoSelecionarProfissional(e.target.value)}
                          disabled={salvando || situacao === 'vago'}
                        >
                          <option value="">—</option>
                          {profissionais.map((n) => (
                            <option key={`p-${n.id}`} value={n.id}>
                              {n.nome}
                              {isCoordenador &&
                              EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO &&
                              conselhoValidadoPorProf.get(n.id) !== true
                                ? ' (doc. pendente)'
                                : ''}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-9 top-1/2 flex -translate-y-1/2 gap-1">
                          <Info className="h-4 w-4 text-slate-400" aria-hidden />
                          <Headphones className="h-4 w-4 text-slate-400" aria-hidden />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Profissional de plantão
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {aba === 'detalhes' && (
              <div className="space-y-0 p-5 sm:p-6">
                <section className="border-b border-slate-200 pb-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Registros de entrada e saída
                  </h3>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-700">
                        Entrada
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Data
                          </label>
                          <input
                            type="text"
                            className={INPUT_MODAL}
                            placeholder="DD/MM/AAAA"
                            value={entradaData}
                            onChange={(e) => setEntradaData(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Hora
                          </label>
                          <input
                            type="text"
                            className={INPUT_MODAL}
                            placeholder="HH:mm"
                            value={entradaHora}
                            onChange={(e) => setEntradaHora(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-700">
                        Saída
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Data
                          </label>
                          <input
                            type="text"
                            className={INPUT_MODAL}
                            placeholder="DD/MM/AAAA"
                            value={saidaData}
                            onChange={(e) => setSaidaData(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Hora
                          </label>
                          <input
                            type="text"
                            className={INPUT_MODAL}
                            placeholder="HH:mm"
                            value={saidaHora}
                            onChange={(e) => setSaidaHora(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reaplicarDatasDetalhes}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    Copiar dados do plantão
                  </button>
                </section>

                <section className="border-b border-slate-200 py-6">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Observação do profissional (horários)
                  </h3>
                  <div
                    className={cn(
                      INPUT_MODAL,
                      'pointer-events-none text-slate-500',
                    )}
                  >
                    O profissional não deixou um comentário
                  </div>
                </section>

                <section className="grid gap-6 pt-6 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Outras informações:
                    </label>
                    <textarea
                      className={TEXTAREA_MODAL}
                      value={outrasInformacoes}
                      onChange={(e) => setOutrasInformacoes(e.target.value)}
                      rows={5}
                      aria-describedby={`${tituloModalId}-outras-ajuda`}
                    />
                    <p
                      id={`${tituloModalId}-outras-ajuda`}
                      className="mt-2 flex items-start gap-1 text-xs text-slate-500"
                    >
                      <Info
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden
                      />
                      Os profissionais também visualizam o conteúdo deste campo.
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Observação interna:
                    </label>
                    <textarea
                      className={TEXTAREA_MODAL}
                      value={observacaoInterna}
                      onChange={(e) => setObservacaoInterna(e.target.value)}
                      rows={5}
                      aria-describedby={`${tituloModalId}-interna-ajuda`}
                    />
                    <p
                      id={`${tituloModalId}-interna-ajuda`}
                      className="mt-2 flex items-start gap-1 text-xs text-slate-500"
                    >
                      <Info
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden
                      />
                      Apenas empresas e coordenadores visualizam o conteúdo
                      deste campo.
                    </p>
                  </div>
                </section>
              </div>
            )}

            {aba === 'habilidades' && (
              <div className="p-5 sm:p-6">
                <h3 className="mb-6 text-sm font-bold text-slate-800">
                  Compare as habilidades dos profissionais
                </h3>
                <div className="grid gap-6 border-b border-slate-200 pb-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Profissional fixo:
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-600">
                      {cartao.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Profissional de plantão:
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary-600">
                      {cartao.nome}
                    </p>
                  </div>
                </div>
                <div className="mt-6 min-h-[12rem] rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:min-h-[14rem]">
                  <div className="grid h-full gap-4 sm:grid-cols-2">
                    <ul className="space-y-2 text-sm text-slate-700">
                      {habilidadesDemoParaNome(cartao.nome).map((item) => (
                        <li
                          key={`f-${item}`}
                          className="flex gap-2 border-b border-slate-200/80 pb-2 last:border-0"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 text-sm text-slate-700 sm:border-l sm:border-slate-200 sm:pl-4">
                      {habilidadesDemoParaNome(cartao.nome).map((item) => (
                        <li
                          key={`p-${item}`}
                          className="flex gap-2 border-b border-slate-200/80 pb-2 last:border-0"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {aba === 'trocas' && (
              <div className="p-6 sm:p-8">
                {isNovo ? (
                  <p className="text-center text-sm text-slate-500">
                    Salve o plantão antes de gerir trocas.
                  </p>
                ) : veInteressePlantao ? (
                  <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
                    <p className="text-sm text-slate-600">
                      Este plantão está anunciado no Mural de Trocas. Deseja assumi-lo?
                    </p>
                    {jaCandidatou ? (
                      <div className="w-full rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                        Você já demonstrou interesse. Aguarde aprovação da
                        coordenação.
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={salvandoTroca}
                        onClick={() => void registrarInteressePlantao()}
                        className="inline-flex h-11 w-full max-w-sm items-center justify-center rounded-lg bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                      >
                        Tenho Interesse / Assumir Plantão
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
                    {veListaCandidatosMural ? (
                      <section>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Profissionais Interessados
                        </h3>
                        {isDonoProfissionalPlantao && !isCoordenador ? (
                          <p className="mt-2 text-sm text-slate-600">
                            A aguardar aprovação da coordenação.
                          </p>
                        ) : null}
                        {carregandoCandidatos ? (
                          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
                            <Loader2
                              className="h-4 w-4 animate-spin text-slate-400"
                              aria-hidden
                            />
                            Carregando candidatos…
                          </p>
                        ) : candidatosMural.length === 0 ? (
                          <p className="mt-4 text-sm text-slate-500">
                            Nenhum colega se candidatou ainda.
                          </p>
                        ) : (
                          <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                            {candidatosMural.map((candidato) => (
                              <li
                                key={candidato.id}
                                className="flex items-center justify-between gap-4 px-4 py-3"
                              >
                                <span className="text-sm font-medium text-slate-800">
                                  {candidato.nome}
                                </span>
                                {isCoordenador ? (
                                  <button
                                    type="button"
                                    disabled={salvandoTroca}
                                    onClick={() => void aprovarCandidato(candidato)}
                                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 disabled:opacity-50"
                                  >
                                    Aprovar
                                  </button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ) : !isCoordenador ? (
                      <p className="text-center text-sm text-slate-500">
                        {disponivelMural
                          ? 'Sem permissão para gerir trocas deste plantão.'
                          : 'Anuncie o plantão na aba Anunciar para receber candidatos do mural.'}
                      </p>
                    ) : null}

                    {isCoordenador ? (
                      <>
                        {veListaCandidatosMural ? (
                          <div className="relative flex items-center py-1">
                            <div className="grow border-t border-slate-200" />
                            <span className="mx-4 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                              ou
                            </span>
                            <div className="grow border-t border-slate-200" />
                          </div>
                        ) : null}

                        <section>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Repasse Direto
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Substitua o profissional do plantão imediatamente, sem
                            passar pelo mural de anúncios.
                          </p>
                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                                Novo profissional
                              </label>
                              <select
                                className={INPUT_MODAL}
                                value={repasseProfissionalId}
                                onChange={(e) => aoSelecionarRepasse(e.target.value)}
                                disabled={
                                  salvandoTroca ||
                                  profissionaisRepasseDireto.length === 0
                                }
                              >
                                <option value="">Selecione um profissional</option>
                                {profissionaisRepasseDireto.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome}
                                    {EXIGIR_CONSELHO_VALIDADO_PARA_PLANTAO &&
                                    conselhoValidadoPorProf.get(p.id) !== true
                                      ? ' (doc. pendente)'
                                      : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              disabled={
                                salvandoTroca ||
                                !repasseProfissionalId ||
                                profissionaisRepasseDireto.length === 0
                              }
                              onClick={() => void substituirProfissionalDireto()}
                              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-50 sm:w-auto"
                            >
                              {salvandoTroca
                                ? 'Substituindo…'
                                : 'Substituir Profissional'}
                            </button>
                          </div>
                        </section>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {aba === 'anunciar' && (
              <div className="flex min-h-[16rem] flex-col items-center justify-center p-6 sm:p-8">
                {isNovo ? (
                  <p className="max-w-md text-center text-sm text-slate-500">
                    Salve o plantão antes de anunciá-lo no Mural de Trocas.
                  </p>
                ) : situacao === 'vago' || !plantaoProfissionalId ? (
                  <p className="max-w-md text-center text-sm text-slate-500">
                    Atribua um profissional ao plantão para poder anunciá-lo no
                    mural.
                  </p>
                ) : !podeAnunciarPlantao && !disponivelMural ? (
                  <p className="max-w-md text-center text-sm text-slate-500">
                    Apenas o profissional escalado neste plantão pode anunciá-lo no
                    Mural de Trocas.
                  </p>
                ) : disponivelMural ? (
                  <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
                    <div
                      className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
                      role="status"
                    >
                      Este plantão está atualmente anunciado no Mural de Trocas.
                    </div>
                    <p className="text-sm text-slate-600">
                      Situação atual:{' '}
                      <span className="font-semibold text-violet-700">
                        Pendente de Troca
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Anunciado por{' '}
                      <span className="font-medium text-slate-700">
                        {nomeProfissionalPlantao}
                      </span>
                      .
                    </p>
                    {podeCancelarAnuncioMural ? (
                      <button
                        type="button"
                        disabled={salvandoAnuncio}
                        onClick={() => void cancelarAnuncioMural()}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-danger-200 bg-white px-5 text-sm font-semibold text-danger-600 shadow-sm transition-colors hover:bg-danger-50 disabled:opacity-50"
                      >
                        {salvandoAnuncio ? 'Cancelando…' : 'Cancelar Anúncio'}
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Somente o profissional escalado pode cancelar este anúncio.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
                    <Megaphone
                      className="h-14 w-14 text-primary-500"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-slate-600">
                      Deseja repassar este plantão? Ao anunciar, ele ficará
                      visível no Mural para que outros colegas possam demonstrar
                      interesse.
                    </p>
                    <p className="text-xs text-slate-500">
                      O anúncio será publicado em seu nome no Mural de Trocas.
                    </p>
                    <button
                      type="button"
                      disabled={salvandoAnuncio}
                      onClick={() => void anunciarNoMural()}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {salvandoAnuncio ? 'Anunciando…' : 'Anunciar no Mural'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CartaoPlantao({ cartao, onClick, linhaAuxiliar }: CartaoPlantaoProps) {
  const barraStatus =
    cartao.status === 'vago'
      ? 'bg-rose-500'
      : cartao.status === 'pendente'
        ? 'bg-amber-500'
        : cartao.status === 'pendente_troca'
          ? 'bg-violet-500'
          : cartao.status === 'confirmado'
            ? 'bg-emerald-600'
            : cartao.status === 'realizado'
              ? 'bg-sky-600'
              : cartao.tom === 'util'
                ? 'bg-emerald-500'
                : 'bg-orange-500'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-lg border border-slate-200/90 bg-white text-left shadow-sm transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
      )}
    >
      <span className={cn('w-1.5 shrink-0 self-stretch', barraStatus)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-slate-800">
            {cartao.nome}
          </span>
          <div className="shrink-0 text-right text-[11px] tabular-nums leading-tight text-slate-500">
            <div>{cartao.horaInicio}</div>
            <div>{cartao.horaFim}</div>
          </div>
        </div>
        {linhaAuxiliar ? (
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {linhaAuxiliar}
          </span>
        ) : null}
      </div>
      <span
        className="pointer-events-none absolute bottom-0.5 right-0.5 h-2 w-2 border-b border-r border-slate-300/80 opacity-40"
        aria-hidden
      />
    </button>
  )
}

export function EscalaSemanalPage() {
  const { tenantUserId, isLoading: authLoading } = useTenantUserId()
  const [inicioSemana, setInicioSemana] = useState(() =>
    inicioSemanaISO(new Date()),
  )
  const [locais, setLocais] = useState<{ id: string; nome: string }[]>([])
  const [setores, setSetores] = useState<SetorEscalaDb[]>([])
  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>(
    [],
  )
  const [conselhoValidadoPorProf, setConselhoValidadoPorProf] = useState<
    Map<string, boolean>
  >(() => new Map())
  const [plantoes, setPlantoes] = useState<PlantaoRowDb[]>([])
  const [localId, setLocalId] = useState('')
  const [setorId, setSetorId] = useState('')
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true)
  const [carregandoPlantoes, setCarregandoPlantoes] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [replicando, setReplicando] = useState(false)

  const [diaDestaque, setDiaDestaque] = useState<Date | null>(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const inicio = inicioSemanaISO(new Date())
    const chaveHoje = chaveData(hoje)
    const naSemana = Array.from({ length: 7 }, (_, i) =>
      chaveData(adicionarDias(inicio, i)),
    ).includes(chaveHoje)
    if (naSemana) return hoje
    return adicionarDias(inicio, 2)
  })

  const tituloRefId = useId()

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => adicionarDias(inicioSemana, i)),
    [inicioSemana],
  )

  const [plantaoModal, setPlantaoModal] = useState<ContextoModalPlantao | null>(
    null,
  )

  const carregarCatalogo = useCallback(async () => {
    if (authLoading) return
    const uid = tenantUserId
    if (!uid) {
      setLocais([])
      setSetores([])
      setProfissionais([])
      setConselhoValidadoPorProf(new Map())
      setLocalId('')
      setSetorId('')
      setCarregandoCatalogo(false)
      return
    }
    setCarregandoCatalogo(true)
    setErro(null)
    try {
      const [L, S, P, mapaDocs] = await Promise.all([
        buscarLocaisEscala(uid),
        buscarSetoresEscala(uid),
        buscarProfissionaisEscala(uid),
        carregarMapaConselhoValidado(uid),
      ])
      setLocais(L)
      setSetores(S)
      setProfissionais(P)
      setConselhoValidadoPorProf(mapaDocs)
      setLocalId((prev) => {
        if (prev && L.some((l) => l.id === prev)) return prev
        return L[0]?.id ?? ''
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setCarregandoCatalogo(false)
    }
  }, [authLoading, tenantUserId])

  useEffect(() => {
    void carregarCatalogo()
  }, [carregarCatalogo])

  useEffect(() => {
    const primeiros = setores.filter((s) => s.local_id === localId)
    setSetorId((prev) => {
      if (prev === TODOS_SETORES) return TODOS_SETORES
      if (prev && primeiros.some((s) => s.id === prev)) return prev
      return TODOS_SETORES
    })
  }, [localId, setores])

  const carregarPlantoesSemana = useCallback(async () => {
    if (authLoading || !tenantUserId) {
      setPlantoes([])
      return
    }
    const ini = chaveData(dias[0])
    const fim = chaveData(dias[6])
    setCarregandoPlantoes(true)
    try {
      const rows = await buscarPlantoesIntervalo(tenantUserId, ini, fim)
      setPlantoes(rows)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar plantões')
    } finally {
      setCarregandoPlantoes(false)
    }
  }, [authLoading, dias, tenantUserId])

  useEffect(() => {
    void carregarPlantoesSemana()
  }, [carregarPlantoesSemana])

  useEffect(() => {
    if (diaDestaque === null) return
    const k = chaveData(diaDestaque)
    const valido = dias.some((d) => chaveData(d) === k)
    if (!valido) {
      setDiaDestaque(adicionarDias(inicioSemana, 2))
    }
  }, [dias, diaDestaque, inicioSemana])

  const cartoesPorDia = useMemo(() => {
    const mapa = new Map<
      string,
      { cartao: PlantaoCartao; linhaAuxiliar?: string }[]
    >()
    const filtraSetor = (p: PlantaoRowDb) =>
      setorId === TODOS_SETORES || p.setor_id === setorId
    for (const dia of dias) {
      const k = chaveData(dia)
      const lista = plantoes
        .filter(
          (p) =>
            chaveDataPlantaoDb(p.data_plantao) === k &&
            p.local_id === localId &&
            filtraSetor(p),
        )
        .map((p) => ({
          cartao: plantaoRowParaCartao(p),
          linhaAuxiliar:
            setorId === TODOS_SETORES
              ? setores.find((s) => s.id === p.setor_id)?.nome
              : undefined,
        }))
        .sort(
          (a, b) =>
            minutosDesdeMeiaNoite(a.cartao.horaInicio) -
            minutosDesdeMeiaNoite(b.cartao.horaInicio),
        )
      mapa.set(k, lista)
    }
    return mapa
  }, [dias, localId, plantoes, setorId, setores])

  const mesAnoCabecalho = useMemo(
    () => rotuloMesAnoRefSemana(inicioSemana),
    [inicioSemana],
  )

  const semanaAnterior = useCallback(() => {
    setInicioSemana((a) => adicionarDias(a, -7))
  }, [])

  const semanaSeguinte = useCallback(() => {
    setInicioSemana((a) => adicionarDias(a, 7))
  }, [])

  const setoresDoLocal = useMemo(
    () => setores.filter((s) => s.local_id === localId),
    [localId, setores],
  )

  const replicarSemana = useCallback(async () => {
    const uid = tenantUserId
    if (!uid || !localId) return
    if (setorId === TODOS_SETORES) {
      window.alert('Selecione um setor específico para replicar a semana.')
      return
    }
    if (!setorId) return
    const segunda = dias[0]
    const chaveSeg = chaveData(segunda)
    const modelo = plantoes.filter(
      (p) =>
        chaveDataPlantaoDb(p.data_plantao) === chaveSeg &&
        p.local_id === localId &&
        p.setor_id === setorId,
    )
    if (modelo.length === 0) {
      window.alert('Não há plantões na segunda-feira para replicar.')
      return
    }
    const agora = new Date().toISOString()
    const inserts = []
    for (let i = 1; i < 7; i++) {
      const dataIso = chaveData(dias[i])
      for (const p of modelo) {
        inserts.push({
          user_id: uid,
          local_id: localId,
          setor_id: setorId,
          profissional_id: p.profissional_id,
          data_plantao: dataIso,
          hora_inicio: formatarHoraDb(p.hora_inicio),
          hora_fim: formatarHoraDb(p.hora_fim),
          status: p.status,
          valor_plantao: Number(p.valor_plantao ?? 0),
          ajuste_financeiro: Number(p.ajuste_financeiro ?? 0),
          observacao_ajuste: p.observacao_ajuste ?? null,
          updated_at: agora,
        })
      }
    }
    setReplicando(true)
    try {
      const { error } = await supabase.from('plantoes').insert(inserts)
      if (error) {
        setErro(error.message)
        return
      }
      await carregarPlantoesSemana()
    } finally {
      setReplicando(false)
    }
  }, [
    carregarPlantoesSemana,
    dias,
    localId,
    plantoes,
    setorId,
    tenantUserId,
  ])

  const setoresModal = useMemo(
    () =>
      setores.map((s) => ({
        id: s.id,
        nome: s.nome,
        local_id: s.local_id,
      })),
    [setores],
  )

  const setorIdParaNovoPlantao = useMemo(
    () =>
      setorId === TODOS_SETORES ? setoresDoLocal[0]?.id ?? '' : setorId,
    [setorId, setoresDoLocal],
  )

  return (
    <div className="min-h-full bg-slate-50 pb-8">
      {erro ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {erro}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-md flex-col gap-1 text-sm font-medium text-slate-700">
          Unidade
          <select
            className="rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            disabled={carregandoCatalogo || locais.length === 0}
          >
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            title="Configurar"
            aria-label="Configurar"
          >
            <Settings2 className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            title="Imprimir"
            aria-label="Imprimir"
          >
            <Printer className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => void carregarPlantoesSemana()}
            disabled={carregandoPlantoes}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            title="Recarregar"
            aria-label="Recarregar"
          >
            {carregandoPlantoes ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-md">
        <div className="min-w-[960px]">
        <div
          className="grid border-b border-slate-700/80 bg-zinc-800 text-white"
          style={{
            gridTemplateColumns:
              'minmax(12rem, 14rem) repeat(7, minmax(0, 1fr))',
          }}
        >
          <div
            className="flex items-center gap-2 border-r border-white/10 px-3 py-3"
            id={tituloRefId}
          >
            <Calendar className="h-5 w-5 shrink-0 text-white/90" aria-hidden />
            <span className="min-w-0 text-sm font-semibold tracking-wide">
              {mesAnoCabecalho}
            </span>
            <button
              type="button"
              onClick={semanaAnterior}
              className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={semanaSeguinte}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10"
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {dias.map((dia, i) => {
            const destaque = diaDestaque !== null && mesmoDia(dia, diaDestaque)
            const ehHoje = isToday(dia)
            return (
              <button
                key={chaveData(dia)}
                type="button"
                onClick={() => setDiaDestaque(new Date(dia))}
                aria-current={ehHoje ? 'date' : undefined}
                className={cn(
                  'relative border-r border-white/10 px-1 py-3 text-center transition-colors last:border-r-0 hover:bg-white/5',
                  destaque && 'bg-white/10',
                  ehHoje &&
                    'z-[1] ring-2 ring-inset ring-amber-400 shadow-[inset_0_-3px_0_0] shadow-amber-400/90',
                )}
              >
                <span
                  className={cn(
                    'block text-lg font-bold tabular-nums leading-none',
                    destaque ? 'text-primary-400' : ehHoje ? 'text-amber-200' : 'text-white',
                  )}
                >
                  {dia.getDate()}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-[11px] font-semibold uppercase tracking-wider',
                    destaque ? 'text-primary-300' : ehHoje ? 'text-amber-200/90' : 'text-white/80',
                  )}
                >
                  {DIAS_SEMANA_SIGLA[i]}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="grid min-h-[22rem] bg-slate-50/90"
          style={{
            gridTemplateColumns:
              'minmax(12rem, 14rem) repeat(7, minmax(0, 1fr))',
          }}
        >
          <aside className="border-r border-slate-200 bg-slate-100/80 px-3 py-4">
            <label className="sr-only" htmlFor="escala-setor">
              Setor
            </label>
            <select
              id="escala-setor"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
              className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400"
            >
              <option value={TODOS_SETORES}>Todos os setores</option>
              {setoresDoLocal.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <SeletorModeloEscala
              compacto
              className="mb-3"
              userId={tenantUserId ?? undefined}
              localId={localId}
              setorId={setorId === TODOS_SETORES ? '' : setorId}
              setorIndefinido={setorId === TODOS_SETORES || !localId}
              dataInicioIso={chaveData(dias[0])}
              dataFimIso={chaveData(dias[6])}
              plantoesExistentes={plantoes}
              onAplicado={carregarPlantoesSemana}
            />
            <button
              type="button"
              disabled={
                replicando ||
                !tenantUserId ||
                setorId === TODOS_SETORES ||
                !localId ||
                !setorId
              }
              onClick={() => void replicarSemana()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary-600 bg-white px-3 py-2.5 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-50"
            >
              {replicando ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              Replicar semana
            </button>
          </aside>

          {dias.map((dia) => {
            const lista = cartoesPorDia.get(chaveData(dia)) ?? []
            const ehHoje = isToday(dia)
            return (
              <div
                key={chaveData(dia)}
                aria-current={ehHoje ? 'date' : undefined}
                className={cn(
                  'flex flex-col gap-2 border-r border-slate-200/80 p-2 last:border-r-0',
                  ehHoje && 'relative z-[1] bg-primary-50/90 ring-2 ring-inset ring-primary-500/50',
                )}
              >
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  {lista.map(({ cartao: c, linhaAuxiliar }) => (
                    <CartaoPlantao
                      key={c.id}
                      cartao={c}
                      linhaAuxiliar={linhaAuxiliar}
                      onClick={() => {
                        const row = plantoes.find((p) => p.id === c.id)
                        setPlantaoModal({
                          dia: new Date(dia),
                          cartao: c,
                          localId: row?.local_id ?? localId,
                          setorId: row?.setor_id ?? setorIdParaNovoPlantao,
                          plantaoId: c.id,
                          profissionalId: c.profissionalId ?? null,
                          valorPlantao:
                            row != null ? Number(row.valor_plantao ?? 0) : 0,
                          disponivelMural: row?.disponivel_mural ?? false,
                        })
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPlantaoModal({
                      dia: new Date(dia),
                      cartao: {
                        id: 'rascunho',
                        nome: 'Novo plantão',
                        horaInicio: '07:00',
                        horaFim: '19:00',
                        tom: tomParaData(dia),
                        status: 'pendente',
                      },
                      localId,
                      setorId: setorIdParaNovoPlantao,
                      plantaoId: undefined,
                      profissionalId: null,
                    })
                  }
                  disabled={!localId || !setorIdParaNovoPlantao}
                  className="flex min-h-[3.25rem] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white/50 text-slate-400 transition-colors hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600 disabled:opacity-40"
                  aria-label={`Adicionar profissional em ${chaveData(dia)}`}
                >
                  <Plus className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            )
          })}
        </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Dados carregados do Supabase. Barra do cartão: cor por situação (vago /
        pendente / confirmado / realizado) ou por tipo de dia quando não houver situação.
      </p>

      <ModalAlterarPlantao
        aberto={plantaoModal !== null}
        contexto={plantaoModal}
        onFechar={() => setPlantaoModal(null)}
        userId={tenantUserId ?? null}
        locais={locais}
        setores={setoresModal}
        profissionais={profissionais}
        conselhoValidadoPorProf={conselhoValidadoPorProf}
        onPlantaoMutado={() => void carregarPlantoesSemana()}
      />
    </div>
  )
}
