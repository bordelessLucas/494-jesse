import {
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
import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { cn } from '../../lib/cn'

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

type LocalEscala = { id: string; nome: string }

const LOCAIS_MOCK: LocalEscala[] = [
  { id: 'amazonas', nome: 'Hospital Regional Amazonas' },
  { id: 'central', nome: 'Hospital Municipal Central' },
  { id: 'norte', nome: 'UPA Norte' },
]

/** Rótulo institucional no modal (referência UI). */
const LOCAIS_ROTULO_MODAL: Record<string, string> = {
  amazonas: 'HOSPITAL AMAZÔNIA',
  central: 'HOSPITAL MUNICIPAL CENTRAL',
  norte: 'UPA NORTE',
}

type SetorEscala = { id: string; nome: string }

const SETORES_MOCK: SetorEscala[] = [
  { id: 'enfermaria', nome: 'ENFERMARIA' },
  { id: 'uti-amazonia', nome: 'UTI AMAZÔNIA' },
  { id: 'ps-adulto', nome: 'PS ADULTO' },
  { id: 'centro-cirurgico', nome: 'CENTRO CIRÚRGICO' },
  { id: 'uti-neo', nome: 'UTI NEONATAL' },
]

/** Barra lateral do cartão: verde dias úteis, laranja fim de semana. */
export type TomCartao = 'util' | 'fds'

export type PlantaoCartao = {
  id: string
  nome: string
  horaInicio: string
  horaFim: string
  tom: TomCartao
}

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

const NOMES_PLANTONISTAS = [
  'Nayana Mota Carvalho',
  'Dra. Ana Paula Ferreira',
  'Dr. Carlos Mendes Silva',
  'Enf. Mariana Costa',
  'Dr. Roberto Lima',
  'Dra. Juliana Rocha',
  'Enf. Fernanda Duarte',
  'Dr. Paulo Henrique Alves',
] as const

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

function gerarCartoesPorDia(
  dias: Date[],
  _setorId: string,
  seed: number,
): Map<string, PlantaoCartao[]> {
  const mapa = new Map<string, PlantaoCartao[]>()

  dias.forEach((dia, di) => {
    const dow = dia.getDay()
    const fds = dow === 0 || dow === 6
    const tom: TomCartao = fds ? 'fds' : 'util'
    const key = chaveData(dia)
    const n = (di + seed * 2) % 4
    const cartoes: PlantaoCartao[] = []

    if (n === 0) {
      mapa.set(key, [])
    } else {
      const inicio = fds ? '19:00' : '07:00'
      const fim = fds ? '07:00' : di % 3 === 0 ? '13:00' : '14:00'
      cartoes.push({
        id: `${key}-a`,
        nome: NOMES_PLANTONISTAS[(di + seed) % NOMES_PLANTONISTAS.length],
        horaInicio: inicio,
        horaFim: fim,
        tom,
      })
      if (n >= 2) {
        cartoes.push({
          id: `${key}-b`,
          nome: NOMES_PLANTONISTAS[(di + seed + 3) % NOMES_PLANTONISTAS.length],
          horaInicio: fds ? '07:00' : '13:00',
          horaFim: fds ? '13:00' : '19:00',
          tom: 'util',
        })
      }
      if (n >= 3) {
        cartoes.push({
          id: `${key}-c`,
          nome: NOMES_PLANTONISTAS[(di + seed + 5) % NOMES_PLANTONISTAS.length],
          horaInicio: '19:00',
          horaFim: '07:00',
          tom: 'fds',
        })
      }
      mapa.set(key, cartoes)
    }
  })

  return mapa
}

type CartaoPlantaoProps = {
  cartao: PlantaoCartao
  onClick?: () => void
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
  let start = parse(ini)
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
  const idx = NOMES_PLANTONISTAS.indexOf(nome as (typeof NOMES_PLANTONISTAS)[number])
  const i = idx >= 0 ? idx : 0
  return HABILIDADES_DEMO[i % HABILIDADES_DEMO.length]
}

type AbaPlantaoModal =
  | 'informacoes'
  | 'detalhes'
  | 'habilidades'
  | 'trocas'
  | 'anunciar'

export type ContextoModalPlantao = {
  dia: Date
  cartao: PlantaoCartao
  localId: string
  setorId: string
}

type ModalAlterarPlantaoProps = {
  aberto: boolean
  contexto: ContextoModalPlantao | null
  onFechar: () => void
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
}: ModalAlterarPlantaoProps) {
  const tituloModalId = useId()
  const [aba, setAba] = useState<AbaPlantaoModal>('informacoes')
  const [informarProfissionais, setInformarProfissionais] = useState(false)
  const [listarTodosFixo, setListarTodosFixo] = useState(false)
  const [listarTodosPlantao, setListarTodosPlantao] = useState(false)
  const [precisaCobertura, setPrecisaCobertura] = useState(false)

  const [entradaData, setEntradaData] = useState('')
  const [entradaHora, setEntradaHora] = useState('')
  const [saidaData, setSaidaData] = useState('')
  const [saidaHora, setSaidaHora] = useState('')
  const [outrasInformacoes, setOutrasInformacoes] = useState('')
  const [observacaoInterna, setObservacaoInterna] = useState('')

  const aplicarDatasRegistroAPartirDoPlantao = useCallback(() => {
    if (!contexto) return
    const { dia, cartao } = contexto
    setEntradaData(formatarDataBrasileira(dia))
    setEntradaHora(cartao.horaInicio)
    const diaSaida =
      plantaoCruzaMeiaNoite(cartao.horaInicio, cartao.horaFim)
        ? adicionarDias(dia, 1)
        : dia
    setSaidaData(formatarDataBrasileira(diaSaida))
    setSaidaHora(cartao.horaFim)
  }, [contexto])

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, onFechar])

  useEffect(() => {
    if (aberto) {
      setAba('informacoes')
      setInformarProfissionais(false)
      setListarTodosFixo(false)
      setListarTodosPlantao(false)
      setPrecisaCobertura(false)
      setOutrasInformacoes('')
      setObservacaoInterna('')
    }
  }, [aberto, contexto?.cartao.id, contexto?.dia])

  useEffect(() => {
    if (!aberto || !contexto) return
    aplicarDatasRegistroAPartirDoPlantao()
  }, [aberto, contexto, aplicarDatasRegistroAPartirDoPlantao])

  if (!aberto || !contexto) return null

  const { dia, cartao, localId, setorId } = contexto
  const hospitalRotulo =
    LOCAIS_ROTULO_MODAL[localId] ?? LOCAIS_MOCK.find((l) => l.id === localId)?.nome.toUpperCase() ?? '—'
  const duracao = diferencaHoras(cartao.horaInicio, cartao.horaFim)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print"
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
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Plus className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
            <h2
              id={tituloModalId}
              className="text-base font-bold uppercase tracking-wide text-primary-600"
            >
              Alterar plantão
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
              className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
              title="Eliminar"
              aria-label="Eliminar plantão"
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              onClick={onFechar}
            >
              <Check className="h-4 w-4" aria-hidden />
              Atualizar
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
                <section className="border-b border-slate-200 pb-6">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Configure o setor e tipo
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                        {hospitalRotulo}
                      </label>
                      <select className={INPUT_MODAL} defaultValue={setorId}>
                        {SETORES_MOCK.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Tipo
                      </label>
                      <select className={INPUT_MODAL} defaultValue="normal">
                        <option value="normal">Normal</option>
                        <option value="fds">Fim de semana</option>
                        <option value="noturno">Noturno</option>
                      </select>
                    </div>
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
                        defaultValue={cartao.horaInicio}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Fim
                      </label>
                      <input
                        type="text"
                        className={INPUT_MODAL}
                        readOnly
                        value={cartao.horaFim}
                      />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                        Valor
                        <Info className="h-3 w-3 text-slate-400" aria-hidden />
                      </label>
                      <input
                        type="text"
                        className={INPUT_MODAL}
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Data
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={cn(INPUT_MODAL, 'pr-10')}
                          readOnly
                          value={formatarDataBrasileira(dia)}
                        />
                        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
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
                          defaultValue={cartao.nome}
                        >
                          {NOMES_PLANTONISTAS.map((n) => (
                            <option key={n} value={n}>
                              {n}
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
                      <select className={cn(INPUT_MODAL, 'mb-4')} defaultValue="designado">
                        <option value="designado">DESIGNADO</option>
                        <option value="pendente">PENDENTE</option>
                        <option value="trocado">TROCADO</option>
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
                          defaultValue={cartao.nome}
                        >
                          {NOMES_PLANTONISTAS.map((n) => (
                            <option key={`p-${n}`} value={n}>
                              {n}
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
                    onClick={aplicarDatasRegistroAPartirDoPlantao}
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

            {(aba === 'trocas' || aba === 'anunciar') && (
              <div className="flex min-h-[12rem] items-center justify-center p-8 text-center text-sm text-slate-500">
                Secção «{ABAS_PLANTAO.find((a) => a.id === aba)?.rotulo}» —
                conteúdo em desenvolvimento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CartaoPlantao({ cartao, onClick }: CartaoPlantaoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-lg border border-slate-200/90 bg-white text-left shadow-sm transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
      )}
    >
      <span
        className={cn(
          'w-1.5 shrink-0 self-stretch',
          cartao.tom === 'util' ? 'bg-emerald-500' : 'bg-orange-500',
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 py-2">
        <span className="truncate text-sm font-medium text-slate-800">
          {cartao.nome}
        </span>
        <div className="shrink-0 text-right text-[11px] tabular-nums leading-tight text-slate-500">
          <div>{cartao.horaInicio}</div>
          <div>{cartao.horaFim}</div>
        </div>
      </div>
      <span
        className="pointer-events-none absolute bottom-0.5 right-0.5 h-2 w-2 border-b border-r border-slate-300/80 opacity-40"
        aria-hidden
      />
    </button>
  )
}

export function EscalaSemanalPage() {
  const [versaoMock, setVersaoMock] = useState(0)
  const [inicioSemana, setInicioSemana] = useState(() =>
    inicioSemanaISO(new Date()),
  )
  const [localId, setLocalId] = useState(LOCAIS_MOCK[0].id)
  const [setorId, setSetorId] = useState(SETORES_MOCK[0].id)

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

  const cartoesBase = useMemo(
    () => gerarCartoesPorDia(dias, setorId, versaoMock),
    [dias, setorId, versaoMock],
  )

  const [cartoesPersonalizados, setCartoesPersonalizados] = useState<Map<
    string,
    PlantaoCartao[]
  > | null>(null)

  const [plantaoModal, setPlantaoModal] = useState<ContextoModalPlantao | null>(
    null,
  )

  useEffect(() => {
    setCartoesPersonalizados(null)
  }, [inicioSemana, setorId, versaoMock])

  useEffect(() => {
    if (diaDestaque === null) return
    const k = chaveData(diaDestaque)
    const valido = dias.some((d) => chaveData(d) === k)
    if (!valido) {
      setDiaDestaque(adicionarDias(inicioSemana, 2))
    }
  }, [dias, diaDestaque, inicioSemana])

  const cartoesPorDia = cartoesPersonalizados ?? cartoesBase

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

  const replicarSemana = useCallback(() => {
    const modelo = cartoesPorDia.get(chaveData(dias[0])) ?? []
    const novo = new Map<string, PlantaoCartao[]>()
    dias.forEach((dia) => {
      const k = chaveData(dia)
      novo.set(
        k,
        modelo.map((c, idx) => ({
          ...c,
          id: `${k}-rep-${idx}-${c.id}`,
        })),
      )
    })
    setCartoesPersonalizados(novo)
  }, [cartoesPorDia, dias])

  return (
    <div className="min-h-full bg-slate-50 pb-8">
      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex max-w-md flex-col gap-1 text-sm font-medium text-slate-700">
          Unidade
          <select
            className="rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
          >
            {LOCAIS_MOCK.map((l) => (
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
            onClick={() => setVersaoMock((v) => v + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            title="Recarregar"
            aria-label="Recarregar"
          >
            <RefreshCw className="h-5 w-5" aria-hidden />
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
            return (
              <button
                key={chaveData(dia)}
                type="button"
                onClick={() => setDiaDestaque(new Date(dia))}
                className={cn(
                  'border-r border-white/10 px-1 py-3 text-center transition-colors last:border-r-0 hover:bg-white/5',
                  destaque && 'bg-white/10',
                )}
              >
                <span
                  className={cn(
                    'block text-lg font-bold tabular-nums leading-none',
                    destaque ? 'text-primary-400' : 'text-white',
                  )}
                >
                  {dia.getDate()}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-[11px] font-semibold uppercase tracking-wider',
                    destaque ? 'text-primary-300' : 'text-white/80',
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
              {SETORES_MOCK.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={replicarSemana}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary-600 bg-white px-3 py-2.5 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Replicar semana
            </button>
          </aside>

          {dias.map((dia) => {
            const lista = cartoesPorDia.get(chaveData(dia)) ?? []
            return (
              <div
                key={chaveData(dia)}
                className="flex flex-col gap-2 border-r border-slate-200/80 p-2 last:border-r-0"
              >
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  {lista.map((c) => (
                    <CartaoPlantao
                      key={c.id}
                      cartao={c}
                      onClick={() =>
                        setPlantaoModal({
                          dia: new Date(dia),
                          cartao: c,
                          localId,
                          setorId,
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="flex min-h-[3.25rem] w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white/50 text-slate-400 transition-colors hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600"
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
        Cabeçalho escuro: seleccione o dia em destaque (azul). Cartões com barra
        verde (dia útil) ou laranja (fim de semana). Dados de demonstração.
      </p>

      <ModalAlterarPlantao
        aberto={plantaoModal !== null}
        contexto={plantaoModal}
        onFechar={() => setPlantaoModal(null)}
      />
    </div>
  )
}
