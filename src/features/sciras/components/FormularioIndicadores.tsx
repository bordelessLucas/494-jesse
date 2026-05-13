import { Activity, Save, Scissors } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { cn } from '../../../lib/cn'
import { salvarIndicadoresSupabase } from '../salvarIndicadoresSupabase'
import {
  SETORES_UTI_PREDEFINIDOS,
  calcularTaxaBuscaAtiva,
  calcularTaxaInfeccao,
  type IndicadorCirurgico,
  type IndicadorUti,
} from '../types'

function formatarPercentagem(valor: number, denominadorZero: boolean): string {
  if (denominadorZero) return 'N/D'
  return `${valor.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`
}

function parseInteiroNaoNegativo(valor: string): number | null {
  if (valor.trim() === '') return null
  const n = Number(valor)
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null
  return n
}

function parseDecimalNaoNegativo(valor: string): number | null {
  if (valor.trim() === '') return null
  const n = Number(valor)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

type Props = {
  className?: string
}

export function FormularioIndicadores({ className }: Props) {
  const [mesCompetencia, setMesCompetencia] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  })
  const [setorUti, setSetorUti] = useState<string>(SETORES_UTI_PREDEFINIDOS[0])

  const [pacientesDia, setPacientesDia] = useState('')
  const [acompanhados, setAcompanhados] = useState('')

  const [totalCirurgias, setTotalCirurgias] = useState('')
  const [cirurgiasLimpas, setCirurgiasLimpas] = useState('')
  const [infeccoesLimpas, setInfeccoesLimpas] = useState('')

  const [aGuardar, setAGuardar] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null,
  )
  const [ultimoParGuardado, setUltimoParGuardado] = useState<{
    indicadorUti: IndicadorUti
    cirurgico: IndicadorCirurgico
  } | null>(null)

  const nPacientesDia = parseDecimalNaoNegativo(pacientesDia)
  const nAcompanhados = parseInteiroNaoNegativo(acompanhados)
  const nTotalCirurgias = parseInteiroNaoNegativo(totalCirurgias)
  const nCirurgiasLimpas = parseInteiroNaoNegativo(cirurgiasLimpas)
  const nInfeccoes = parseInteiroNaoNegativo(infeccoesLimpas)

  const taxaBusca = useMemo(() => {
    if (nPacientesDia === null || nAcompanhados === null) return null
    return calcularTaxaBuscaAtiva(nPacientesDia, nAcompanhados)
  }, [nPacientesDia, nAcompanhados])

  const taxaInf = useMemo(() => {
    if (nCirurgiasLimpas === null || nInfeccoes === null) return null
    return calcularTaxaInfeccao(nCirurgiasLimpas, nInfeccoes)
  }, [nCirurgiasLimpas, nInfeccoes])

  const denominadorBuscaZero = nPacientesDia !== null && nPacientesDia <= 0
  const denominadorInfZero = nCirurgiasLimpas !== null && nCirurgiasLimpas <= 0

  const validarELancar = useCallback((): {
    indicadorUti: IndicadorUti
    cirurgico: IndicadorCirurgico
  } | null => {
    setMensagem(null)

    if (!mesCompetencia) {
      setMensagem({ tipo: 'erro', texto: 'Seleccione o mês de competência.' })
      return null
    }

    if (nPacientesDia === null) {
      setMensagem({
        tipo: 'erro',
        texto: 'Indique «Pacientes/Dia» (número ≥ 0).',
      })
      return null
    }
    if (nAcompanhados === null) {
      setMensagem({
        tipo: 'erro',
        texto: 'Indique «Usuários acompanhados» (inteiro ≥ 0).',
      })
      return null
    }
    if (nAcompanhados > nPacientesDia && nPacientesDia > 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'Acompanhados não pode exceder pacientes/dia (revise os valores).',
      })
      return null
    }

    if (nTotalCirurgias === null) {
      setMensagem({
        tipo: 'erro',
        texto: 'Indique o total de cirurgias (inteiro ≥ 0).',
      })
      return null
    }
    if (nCirurgiasLimpas === null) {
      setMensagem({
        tipo: 'erro',
        texto: 'Indique o total de cirurgias limpas (inteiro ≥ 0).',
      })
      return null
    }
    if (nInfeccoes === null) {
      setMensagem({
        tipo: 'erro',
        texto: 'Indique o número de infecções em cirurgias limpas (inteiro ≥ 0).',
      })
      return null
    }
    if (nCirurgiasLimpas > nTotalCirurgias) {
      setMensagem({
        tipo: 'erro',
        texto: 'Cirurgias limpas não pode exceder o total de cirurgias.',
      })
      return null
    }
    if (nInfeccoes > nCirurgiasLimpas) {
      setMensagem({
        tipo: 'erro',
        texto: 'Infecções não pode exceder cirurgias limpas.',
      })
      return null
    }

    const taxaBuscaAtiva = calcularTaxaBuscaAtiva(nPacientesDia, nAcompanhados)
    const taxaInfeccao = calcularTaxaInfeccao(nCirurgiasLimpas, nInfeccoes)

    const indicadorUti: IndicadorUti = {
      id: crypto.randomUUID(),
      mesCompetencia,
      setor: setorUti,
      totalPacientesDia: nPacientesDia,
      usuariosAcompanhadosBuscaAtiva: nAcompanhados,
      taxaBuscaAtiva,
    }

    const cirurgico: IndicadorCirurgico = {
      id: crypto.randomUUID(),
      mesCompetencia,
      totalCirurgias: nTotalCirurgias,
      totalCirurgiasLimpas: nCirurgiasLimpas,
      numInfeccoesCirurgiasLimpas: nInfeccoes,
      taxaInfeccao,
    }

    return { indicadorUti, cirurgico }
  }, [
    mesCompetencia,
    nAcompanhados,
    nCirurgiasLimpas,
    nInfeccoes,
    nPacientesDia,
    nTotalCirurgias,
    setorUti,
  ])

  const handleGuardar = async () => {
    const par = validarELancar()
    if (!par) return

    setAGuardar(true)
    setMensagem(null)
    try {
      await salvarIndicadoresSupabase(par.indicadorUti, par.cirurgico)
      setUltimoParGuardado(par)
      setMensagem({
        tipo: 'ok',
        texto:
          'Indicadores guardados no Supabase. Pode fechar ou editar e voltar a guardar.',
      })
    } catch (e: unknown) {
      const texto =
        e instanceof Error ? e.message : 'Erro ao guardar. Tente novamente.'
      setMensagem({ tipo: 'erro', texto })
    } finally {
      setAGuardar(false)
    }
  }

  const inputNumBase =
    'mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

  return (
    <div className={cn('space-y-6', className)}>
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Competência e setor</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-medium text-slate-700">
            Mês de competência
            <input
              type="month"
              value={mesCompetencia}
              onChange={(e) => setMesCompetencia(e.target.value)}
              className={inputNumBase}
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-700">
            Setor (UTI)
            <select
              value={setorUti}
              onChange={(e) => setSetorUti(e.target.value)}
              className={inputNumBase}
            >
              {SETORES_UTI_PREDEFINIDOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Activity className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Indicadores — UTI
              </h2>
              <p className="text-xs text-slate-500">
                Busca activa: acompanhados face a pacientes/dia
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex flex-col text-xs font-medium text-slate-700">
              Pacientes / dia (média)
              <input
                inputMode="decimal"
                value={pacientesDia}
                onChange={(e) => setPacientesDia(e.target.value)}
                placeholder="ex.: 12,5"
                className={inputNumBase}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-slate-700">
              Usuários acompanhados (busca activa)
              <input
                inputMode="numeric"
                value={acompanhados}
                onChange={(e) => setAcompanhados(e.target.value)}
                placeholder="ex.: 8"
                className={inputNumBase}
              />
            </label>

            <div className="rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary-800/80">
                Taxa de busca activa
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-primary-900">
                {taxaBusca === null
                  ? '—'
                  : formatarPercentagem(
                      taxaBusca,
                      denominadorBuscaZero,
                    )}
              </p>
              {taxaBusca !== null && !denominadorBuscaZero ? (
                <p className="mt-1 text-xs text-primary-800/70">
                  Fórmula: (acompanhados ÷ pacientes/dia) × 100
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Scissors className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Indicadores — Centro cirúrgico
              </h2>
              <p className="text-xs text-slate-500">
                Infecção em cirurgias limpas
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex flex-col text-xs font-medium text-slate-700">
              Total de cirurgias
              <input
                inputMode="numeric"
                value={totalCirurgias}
                onChange={(e) => setTotalCirurgias(e.target.value)}
                placeholder="ex.: 320"
                className={inputNumBase}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-slate-700">
              Cirurgias limpas
              <input
                inputMode="numeric"
                value={cirurgiasLimpas}
                onChange={(e) => setCirurgiasLimpas(e.target.value)}
                placeholder="ex.: 210"
                className={inputNumBase}
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-slate-700">
              Infecções em cirurgias limpas
              <input
                inputMode="numeric"
                value={infeccoesLimpas}
                onChange={(e) => setInfeccoesLimpas(e.target.value)}
                placeholder="ex.: 2"
                className={inputNumBase}
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                Taxa de infecção (cirurgias limpas)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                {taxaInf === null
                  ? '—'
                  : formatarPercentagem(taxaInf, denominadorInfZero)}
              </p>
              {taxaInf !== null && !denominadorInfZero ? (
                <p className="mt-1 text-xs text-slate-600">
                  Fórmula: (infecções ÷ cirurgias limpas) × 100
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void handleGuardar()}
          disabled={aGuardar}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors',
            'bg-primary-600 text-white hover:bg-primary-700',
            'disabled:pointer-events-none disabled:opacity-60',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
          )}
        >
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {aGuardar ? 'A guardar…' : 'Salvar indicadores'}
        </button>

        {mensagem ? (
          <p
            role="status"
            className={cn(
              'text-sm',
              mensagem.tipo === 'ok' ? 'text-emerald-700' : 'text-danger-600',
            )}
          >
            {mensagem.texto}
          </p>
        ) : null}
      </div>

      {ultimoParGuardado ? (
        <details className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-800">
            Último registo guardado
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(
              {
                uti: ultimoParGuardado.indicadorUti,
                cirurgico: ultimoParGuardado.cirurgico,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </div>
  )
}
