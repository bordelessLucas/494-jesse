import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Loader2, Printer } from 'lucide-react'

import { useTenantUserId } from '../../../hooks/useTenantUserId'
import { buscarProfissionaisLista } from '../../../lib/financeiro/financeiroData'
import {
  buscarDadosFrequencia,
  type DadosFrequenciaConsolidados,
} from '../../../lib/gestao/buscarDadosFrequencia'
import { buscarLocaisRelatorio } from '../../../lib/relatorios/plantoesRelatorioDb'
import { capturarPreviewComoPdf, pdfParaBase64 } from '../../../lib/relatorios/capturarPreviewComoPdf'
import { FrequenciaOficialTemplate } from '../templates/FrequenciaOficialTemplate'
import {
  gerarCompetencias,
  intervaloMensal,
  intervaloQuinzena,
  intervaloSemanal,
  montarCabecalho,
  montarDetalheLocal,
  obterDiasNoMes,
} from '../gestaoRelatoriosUtils'
import { useEmissaoRelatorioNavegacao } from '../../relatorios/hooks/useEmissaoRelatorioNavegacao'
import { EmissaoRelatorioCarregando } from '../../relatorios/components/EmissaoRelatorioCarregando'
import { useThemeBranding } from '../../../theme/ThemeBrandingProvider'

export type ModoFrequenciaGestao = 'quinzenal' | 'mensal' | 'semanal'

type FrequenciaGestaoPageProps = {
  modo: ModoFrequenciaGestao
  tituloPagina: string
  tituloRelatorio: string
}

const TITULOS: Record<ModoFrequenciaGestao, string> = {
  quinzenal: 'Frequência Quinzenal',
  mensal: 'Frequência Mensal',
  semanal: 'Frequência Semanal',
}

export function FrequenciaGestaoPage({ modo, tituloPagina, tituloRelatorio }: FrequenciaGestaoPageProps) {
  const { tenantUserId } = useTenantUserId()
  const { logoUrl } = useThemeBranding()
  const previewRef = useRef<HTMLDivElement>(null)
  const { previewScrollRef } = useEmissaoRelatorioNavegacao(`frequencia-gestao-${modo}`)
  const competencias = useMemo(() => gerarCompetencias(), [])

  const [competenciaId, setCompetenciaId] = useState(competencias[0]?.id ?? '')
  const [localId, setLocalId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [quinzena, setQuinzena] = useState<'1' | '2'>('1')
  const [semanaOffset, setSemanaOffset] = useState(0)

  const [profissionais, setProfissionais] = useState<{ id: string; nome: string }[]>([])
  const [locais, setLocais] = useState<{ id: string; nome: string }[]>([])
  const [carregandoMeta, setCarregandoMeta] = useState(true)
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [dados, setDados] = useState<DadosFrequenciaConsolidados>({
    profissionalId: '',
    profissionalNome: '—',
    profissionalConselho: '—',
    linhas: [],
    totalHorasValidadas: 0,
    totalFaltas: 0,
  })
  const [aImprimir, setAImprimir] = useState(false)

  const competencia = useMemo(
    () => competencias.find((c) => c.id === competenciaId) ?? competencias[0],
    [competencias, competenciaId],
  )

  const intervalo = useMemo(() => {
    if (modo === 'quinzenal') return intervaloQuinzena(competenciaId, quinzena)
    if (modo === 'semanal') return intervaloSemanal(competenciaId, semanaOffset)
    return intervaloMensal(competenciaId)
  }, [modo, competenciaId, quinzena, semanaOffset])

  const totalSemanas = useMemo(
    () => Math.ceil(obterDiasNoMes(competenciaId) / 7),
    [competenciaId],
  )

  const cabecalho = useMemo(() => {
    const local = locais.find((l) => l.id === localId)
    const detalhe = montarDetalheLocal(
      local
        ? {
            id: local.id,
            nome: local.nome,
            cidade: '',
            uf: '',
            cnpj: null,
          }
        : null,
      TITULOS[modo],
    )
    return montarCabecalho(detalhe, competencia?.cabecalho ?? '', logoUrl)
  }, [locais, localId, competencia, logoUrl, modo])

  useEffect(() => {
    if (!tenantUserId) {
      setProfissionais([])
      setLocais([])
      setCarregandoMeta(false)
      return
    }
    let cancelado = false
    setCarregandoMeta(true)
    void Promise.all([
      buscarProfissionaisLista(tenantUserId),
      buscarLocaisRelatorio(tenantUserId),
    ])
      .then(([profs, locs]) => {
        if (cancelado) return
        setProfissionais(profs)
        setLocais(locs.map((l) => ({ id: l.id, nome: l.nome })))
        setProfissionalId((atual) =>
          atual && profs.some((p) => p.id === atual) ? atual : (profs[0]?.id ?? ''),
        )
        setLocalId((atual) =>
          atual && locs.some((l) => l.id === atual) ? atual : (locs[0]?.id ?? ''),
        )
      })
      .finally(() => {
        if (!cancelado) setCarregandoMeta(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantUserId])

  useEffect(() => {
    if (!tenantUserId || !profissionalId) {
      setDados({
        profissionalId: '',
        profissionalNome: '—',
        profissionalConselho: '—',
        linhas: [],
        totalHorasValidadas: 0,
        totalFaltas: 0,
      })
      setCarregandoDados(false)
      return
    }

    let cancelado = false
    setCarregandoDados(true)
    void buscarDadosFrequencia(
      tenantUserId,
      profissionalId,
      intervalo.dataInicio,
      intervalo.dataFim,
    )
      .then((resultado) => {
        if (!cancelado) setDados(resultado)
      })
      .catch(() => {
        if (!cancelado) {
          setDados({
            profissionalId,
            profissionalNome: '—',
            profissionalConselho: '—',
            linhas: [],
            totalHorasValidadas: 0,
            totalFaltas: 0,
          })
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoDados(false)
      })

    return () => {
      cancelado = true
    }
  }, [tenantUserId, profissionalId, intervalo.dataInicio, intervalo.dataFim])

  const handleImprimir = async () => {
    const el = previewRef.current
    if (!el) return
    setAImprimir(true)
    try {
      const pdf = await capturarPreviewComoPdf(el)
      const dataUrl = `data:application/pdf;base64,${pdfParaBase64(pdf)}`
      window.open(dataUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setAImprimir(false)
    }
  }

  if (carregandoMeta && locais.length === 0) {
    return <EmissaoRelatorioCarregando titulo={tituloPagina} />
  }

  return (
    <div className="-m-8 flex min-h-screen print:m-0 print:block">
      <aside className="no-print flex h-[100dvh] w-full max-w-md shrink-0 flex-col border-r border-slate-200 bg-white lg:w-1/3">
        <div className="border-b border-slate-100 px-4 py-5">
          <h1 className="text-lg font-bold text-slate-900">{tituloPagina}</h1>
          <p className="mt-1 text-xs text-slate-500">
            Folha de ponto oficial com dados de escala e registo de ponto.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <CampoSelect
            label="Competência"
            value={competenciaId}
            onChange={setCompetenciaId}
            opcoes={competencias.map((c) => ({ id: c.id, label: c.label }))}
          />

          {modo === 'quinzenal' ? (
            <CampoSelect
              label="Quinzena"
              value={quinzena}
              onChange={(v) => setQuinzena(v as '1' | '2')}
              opcoes={[
                { id: '1', label: '1.ª quinzena (dias 1–15)' },
                { id: '2', label: '2.ª quinzena (dias 16–fim)' },
              ]}
            />
          ) : null}

          {modo === 'semanal' ? (
            <CampoSelect
              label="Semana do mês"
              value={String(semanaOffset)}
              onChange={(v) => setSemanaOffset(Number(v))}
              opcoes={Array.from({ length: totalSemanas }, (_, i) => ({
                id: String(i),
                label: `Semana ${i + 1}`,
              }))}
            />
          ) : null}

          <CampoSelect
            label="Local / Contrato"
            value={localId}
            onChange={setLocalId}
            opcoes={
              locais.length > 0
                ? locais.map((l) => ({ id: l.id, label: l.nome }))
                : [{ id: '', label: carregandoMeta ? 'A carregar…' : 'Nenhum local' }]
            }
          />

          <CampoSelect
            label="Profissional"
            value={profissionalId}
            onChange={setProfissionalId}
            opcoes={
              profissionais.length > 0
                ? profissionais.map((p) => ({ id: p.id, label: p.nome }))
                : [{ id: '', label: carregandoMeta ? 'A carregar…' : 'Nenhum profissional' }]
            }
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {carregandoDados ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                A consolidar frequência…
              </span>
            ) : (
              <span>
                Período: <strong>{intervalo.rotulo}</strong> · {dados.linhas.length} registo(s) ·{' '}
                {dados.totalHorasValidadas.toLocaleString('pt-PT', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                h validadas · {dados.totalFaltas} falta(s)
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            disabled={aImprimir || carregandoDados}
            onClick={() => void handleImprimir()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {aImprimir ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Printer className="h-5 w-5" />
            )}
            Imprimir / Salvar PDF
          </button>
        </div>
      </aside>

      <section
        ref={previewScrollRef}
        className="flex-1 overflow-y-auto bg-slate-300 p-8 print:bg-white print:p-0"
      >
        <div ref={previewRef} className="flex justify-center">
          <FrequenciaOficialTemplate
            cabecalho={cabecalho}
            titulo={tituloRelatorio}
            periodoRotulo={intervalo.rotulo}
            dados={dados}
            carregando={carregandoDados || carregandoMeta}
          />
        </div>
      </section>
    </div>
  )
}

function CampoSelect({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string
  value: string
  onChange: (valor: string) => void
  opcoes: { id: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 px-3 py-2 text-sm"
      >
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
