import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Loader2, Printer } from 'lucide-react'

import { useTenantUserId } from '../../../hooks/useTenantUserId'
import {
  buscarProducaoFrequenciaMes,
  type ProducaoFrequenciaLinha,
} from '../../../lib/gestao/buscarDadosFrequencia'
import { buscarLocaisRelatorio } from '../../../lib/relatorios/plantoesRelatorioDb'
import { capturarPreviewComoPdf, pdfParaBase64 } from '../../../lib/relatorios/capturarPreviewComoPdf'
import { ProducaoFrequenciaTemplate } from '../templates/ProducaoFrequenciaTemplate'
import { gerarCompetencias, montarCabecalho, montarDetalheLocal } from '../gestaoRelatoriosUtils'
import { useThemeBranding } from '../../../theme/ThemeBrandingProvider'

export function FrequenciaProducaoGestaoPage() {
  const { tenantUserId } = useTenantUserId()
  const { logoUrl } = useThemeBranding()
  const previewRef = useRef<HTMLDivElement>(null)
  const competencias = useMemo(() => gerarCompetencias(), [])

  const [competenciaId, setCompetenciaId] = useState(competencias[0]?.id ?? '')
  const [localId, setLocalId] = useState('')
  const [locais, setLocais] = useState<{ id: string; nome: string }[]>([])
  const [linhas, setLinhas] = useState<ProducaoFrequenciaLinha[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aImprimir, setAImprimir] = useState(false)

  const competencia = useMemo(
    () => competencias.find((c) => c.id === competenciaId) ?? competencias[0],
    [competencias, competenciaId],
  )

  const cabecalho = useMemo(() => {
    const local = locais.find((l) => l.id === localId)
    const detalhe = montarDetalheLocal(
      local
        ? { id: local.id, nome: local.nome, cidade: '', uf: '', cnpj: null }
        : null,
      'Produção de Frequência',
    )
    return montarCabecalho(detalhe, competencia?.cabecalho ?? '', logoUrl)
  }, [locais, localId, competencia, logoUrl])

  useEffect(() => {
    if (!tenantUserId) return
    void buscarLocaisRelatorio(tenantUserId).then((locs) => {
      setLocais(locs.map((l) => ({ id: l.id, nome: l.nome })))
      setLocalId((atual) =>
        atual && locs.some((l) => l.id === atual) ? atual : (locs[0]?.id ?? ''),
      )
    })
  }, [tenantUserId])

  useEffect(() => {
    if (!tenantUserId || !competenciaId) {
      setLinhas([])
      return
    }
    let cancelado = false
    setCarregando(true)
    void buscarProducaoFrequenciaMes(tenantUserId, competenciaId)
      .then((resultado) => {
        if (!cancelado) setLinhas(resultado)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantUserId, competenciaId])

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

  return (
    <div className="-m-8 flex min-h-screen print:m-0 print:block">
      <aside className="no-print flex h-[100dvh] w-full max-w-md shrink-0 flex-col border-r border-slate-200 bg-white lg:w-1/3">
        <div className="border-b border-slate-100 px-4 py-5">
          <h1 className="text-lg font-bold text-slate-900">Produção de Frequência</h1>
          <p className="mt-1 text-xs text-slate-500">
            Consolidado mensal de todos os profissionais com horas validadas.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <CampoSelect
            label="Competência"
            value={competenciaId}
            onChange={setCompetenciaId}
            opcoes={competencias.map((c) => ({ id: c.id, label: c.label }))}
          />
          <CampoSelect
            label="Local / Contrato"
            value={localId}
            onChange={setLocalId}
            opcoes={
              locais.length > 0
                ? locais.map((l) => ({ id: l.id, label: l.nome }))
                : [{ id: '', label: 'Nenhum local' }]
            }
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {carregando ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                A consolidar profissionais…
              </span>
            ) : (
              <span>
                <strong>{linhas.length}</strong> profissional(is) com registos na competência.
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            disabled={aImprimir || carregando}
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

      <section className="flex-1 overflow-y-auto bg-slate-300 p-8 print:bg-white print:p-0">
        <div ref={previewRef} className="flex justify-center">
          <ProducaoFrequenciaTemplate
            cabecalho={cabecalho}
            competenciaRotulo={competencia?.cabecalho ?? competenciaId}
            linhas={linhas}
            carregando={carregando}
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
