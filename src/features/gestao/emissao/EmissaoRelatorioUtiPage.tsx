import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ChevronDown, Loader2, Printer } from 'lucide-react'

import { useContaMembro } from '../../../hooks/useContaMembro'
import { useTenantUserId } from '../../../hooks/useTenantUserId'
import {
  assinarRelatorioProfissional,
  listarProfissionaisComCertificadoAtivo,
  type ProfissionalCertificadoAtivo,
} from '../../../lib/relatorios/assinarRelatorioProfissional'
import {
  capturarPreviewComoPdf,
  pdfParaBase64,
} from '../../../lib/relatorios/capturarPreviewComoPdf'
import {
  buscarDadosAssinaturaEmissor,
  montarAssinaturaDocumento,
  type DadosAssinaturaEmissor,
} from '../../../lib/relatorios/dadosAssinaturaEmissor'
import { registrarRelatorioImpresso } from '../../../lib/relatorios/relatoriosHistoricoDb'
import type { TipoRelatorioHistorico } from '../../../lib/relatorios/relatoriosHistoricoDb'
import {
  buscarLocaisRelatorio,
  buscarPlantoesRealizadosRelatorio,
  type LocalRelatorioOpcao,
} from '../../../lib/relatorios/plantoesRelatorioDb'
import {
  calcularIndicadoresScirasEscala,
  type IndicadoresScirasEscala,
} from '../../../lib/relatorios/mapearPlantoesRelatorio'
import type { Json } from '../../../types/database.types'
import { carregarIndicadorUtiGestao } from '../../sciras/carregarIndicadorUtiGestao'
import type { IndicadorUti, SetorUtiPredefinido } from '../../sciras/types'
import { EditorBlocosRelatorio } from '../../relatorios/components/EditorBlocosRelatorio'
import { EmissaoRelatorioCarregando } from '../../relatorios/components/EmissaoRelatorioCarregando'
import { HistoricoRelatoriosPanel } from '../../relatorios/components/HistoricoRelatoriosPanel'
import { useDebouncedEffect } from '../../relatorios/hooks/useDebouncedEffect'
import { useEmissaoRelatorioNavegacao } from '../../relatorios/hooks/useEmissaoRelatorioNavegacao'
import { useBlocosRelatorio } from '../../relatorios/hooks/useBlocosRelatorio'
import type { RelatorioAtividadesBloco } from '../../relatorios/types'
import { useThemeBranding } from '../../../theme/ThemeBrandingProvider'
import { RelatorioAtividadesUtiTemplate } from '../templates/RelatorioAtividadesUtiTemplate'
import {
  CAMPOS_CONTRATUAIS,
  extrairTextoCabecalho,
  filtrarPlantoesPorSetorUti,
  formatarDataEmissao,
  gerarCompetencias,
  montarCabecalho,
  montarDetalheLocal,
  type CabecalhoTextoEditavel,
  type CompetenciaOpcao,
} from '../gestaoRelatoriosUtils'

export type EmissaoRelatorioUtiConfig = {
  setorUti: SetorUtiPredefinido
  tituloPagina: string
  tituloRelatorio: string
  tipoRelatorioHistorico: TipoRelatorioHistorico
  servicoPadrao: string
  chaveRascunho: string
}

const BLOCOS_INICIAIS: RelatorioAtividadesBloco[] = []

function lerRascunho(chave: string): {
  competenciaId?: string
  localId?: string
  cabecalhoTexto?: CabecalhoTextoEditavel
  blocos?: RelatorioAtividadesBloco[]
} | null {
  try {
    const raw = localStorage.getItem(chave)
    if (!raw) return null
    return JSON.parse(raw) as ReturnType<typeof lerRascunho>
  } catch {
    return null
  }
}

function salvarRascunho(
  chave: string,
  payload: {
    competenciaId: string
    localId: string
    cabecalhoTexto: CabecalhoTextoEditavel
    blocos: RelatorioAtividadesBloco[]
  },
) {
  try {
    localStorage.setItem(chave, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

type EmissaoRelatorioUtiPageProps = {
  config: EmissaoRelatorioUtiConfig
}

export function EmissaoRelatorioUtiPage({ config }: EmissaoRelatorioUtiPageProps) {
  const { tenantUserId } = useTenantUserId()
  const { isTitular, isMembroProfissional, profissionalId: profissionalIdMembro } =
    useContaMembro()
  const { logoUrl } = useThemeBranding()
  const previewCapturaRef = useRef<HTMLDivElement>(null)
  const { previewScrollRef } = useEmissaoRelatorioNavegacao(config.chaveRascunho)
  const competencias = useMemo(() => gerarCompetencias(), [])
  const rascunho = useMemo(() => lerRascunho(config.chaveRascunho), [config.chaveRascunho])

  const [locaisOpcoes, setLocaisOpcoes] = useState<LocalRelatorioOpcao[]>([])
  const [carregandoLocais, setCarregandoLocais] = useState(true)
  const [carregandoPlantoes, setCarregandoPlantoes] = useState(false)
  const [erroPlantoes, setErroPlantoes] = useState<string | null>(null)
  const [totalPlantoes, setTotalPlantoes] = useState(0)

  const [competenciaId, setCompetenciaId] = useState(
    () => rascunho?.competenciaId ?? competencias[0]?.id ?? '',
  )
  const [localId, setLocalId] = useState(() => rascunho?.localId ?? '')

  const blocosRelatorio = useBlocosRelatorio(rascunho?.blocos ?? BLOCOS_INICIAIS)

  const [cabecalhoTexto, setCabecalhoTexto] = useState<CabecalhoTextoEditavel>(() => {
    if (rascunho?.cabecalhoTexto) return rascunho.cabecalhoTexto
    const cab = competencias.find((c) => c.id === competenciaId)?.cabecalho ?? ''
    return extrairTextoCabecalho(
      montarCabecalho(montarDetalheLocal(null, config.servicoPadrao), cab, null),
    )
  })

  const [indicadorUti, setIndicadorUti] = useState<IndicadorUti | null>(null)
  const [indicadoresEscala, setIndicadoresEscala] = useState<IndicadoresScirasEscala | null>(
    null,
  )
  const [indicadoresCarregando, setIndicadoresCarregando] = useState(false)

  const [versaoHistorico, setVersaoHistorico] = useState(0)
  const [aAssinar, setAAssinar] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [profissionaisCert, setProfissionaisCert] = useState<ProfissionalCertificadoAtivo[]>([])
  const [profissionalEmissorId, setProfissionalEmissorId] = useState('')
  const [carregandoEmissores, setCarregandoEmissores] = useState(false)
  const [dadosEmissor, setDadosEmissor] = useState<DadosAssinaturaEmissor | null>(null)
  const [dataHoraAssinaturaPdf, setDataHoraAssinaturaPdf] = useState<string | undefined>()

  const competencia = useMemo(
    () => competencias.find((c) => c.id === competenciaId) ?? competencias[0],
    [competencias, competenciaId],
  )

  const localSelecionado = useMemo(
    () => locaisOpcoes.find((l) => l.id === localId) ?? null,
    [locaisOpcoes, localId],
  )

  const cabecalho = useMemo(
    (): ReturnType<typeof montarCabecalho> => ({ ...cabecalhoTexto, logoUrl }),
    [cabecalhoTexto, logoUrl],
  )

  const assinaturaDocumento = useMemo(
    () => montarAssinaturaDocumento(cabecalho, dadosEmissor, dataHoraAssinaturaPdf),
    [cabecalho, dadosEmissor, dataHoraAssinaturaPdf],
  )

  const profissionalEmissorEfetivo = isMembroProfissional
    ? profissionalIdMembro
    : profissionalEmissorId || null

  useDebouncedEffect(() => {
    salvarRascunho(config.chaveRascunho, {
      competenciaId,
      localId,
      cabecalhoTexto,
      blocos: blocosRelatorio.blocos,
    })
  }, [config.chaveRascunho, competenciaId, localId, cabecalhoTexto, blocosRelatorio.blocos])

  useEffect(() => {
    if (!tenantUserId || !isTitular) {
      setProfissionaisCert([])
      return
    }
    let cancelado = false
    setCarregandoEmissores(true)
    void listarProfissionaisComCertificadoAtivo(tenantUserId)
      .then((lista) => {
        if (cancelado) return
        setProfissionaisCert(lista)
        setProfissionalEmissorId((atual) =>
          atual && lista.some((p) => p.profissionalId === atual)
            ? atual
            : (lista[0]?.profissionalId ?? ''),
        )
      })
      .finally(() => {
        if (!cancelado) setCarregandoEmissores(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantUserId, isTitular])

  useEffect(() => {
    if (!profissionalEmissorEfetivo) {
      setDadosEmissor(null)
      return
    }
    let cancelado = false
    void buscarDadosAssinaturaEmissor(profissionalEmissorEfetivo).then((dados) => {
      if (!cancelado) setDadosEmissor(dados)
    })
    return () => {
      cancelado = true
    }
  }, [profissionalEmissorEfetivo])

  useEffect(() => {
    if (!tenantUserId) {
      setLocaisOpcoes([])
      setCarregandoLocais(false)
      return
    }
    let cancelado = false
    setCarregandoLocais(true)
    void buscarLocaisRelatorio(tenantUserId)
      .then((lista) => {
        if (cancelado) return
        setLocaisOpcoes(lista)
        setLocalId((atual) =>
          atual && lista.some((l) => l.id === atual) ? atual : (lista[0]?.id ?? ''),
        )
      })
      .finally(() => {
        if (!cancelado) setCarregandoLocais(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantUserId])

  useEffect(() => {
    if (!tenantUserId || !localId || !competenciaId) {
      setTotalPlantoes(0)
      setIndicadorUti(null)
      setIndicadoresEscala(null)
      setCarregandoPlantoes(false)
      setIndicadoresCarregando(false)
      return
    }

    let cancelado = false
    setIndicadoresCarregando(true)
    setCarregandoPlantoes(true)
    setErroPlantoes(null)

    void Promise.all([
      buscarPlantoesRealizadosRelatorio(tenantUserId, competenciaId, localId),
      carregarIndicadorUtiGestao(tenantUserId, competenciaId, config.setorUti),
    ])
      .then(([plantoes, indicador]) => {
        if (cancelado) return
        const filtrados = filtrarPlantoesPorSetorUti(plantoes, config.setorUti)
        setTotalPlantoes(filtrados.length)
        setIndicadorUti(indicador)
        setIndicadoresEscala(calcularIndicadoresScirasEscala(filtrados))
      })
      .catch((e) => {
        if (!cancelado) {
          setErroPlantoes(e instanceof Error ? e.message : 'Erro ao carregar dados.')
          setTotalPlantoes(0)
          setIndicadorUti(null)
          setIndicadoresEscala(null)
        }
      })
      .finally(() => {
        if (!cancelado) {
          setIndicadoresCarregando(false)
          setCarregandoPlantoes(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [tenantUserId, localId, competenciaId, config.setorUti])

  const restaurarCabecalho = () => {
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(
          montarDetalheLocal(localSelecionado, config.servicoPadrao),
          competencia?.cabecalho ?? '',
          null,
        ),
      ),
    )
  }

  const aoMudarLocal = (novoLocal: string) => {
    setLocalId(novoLocal)
    const local = locaisOpcoes.find((l) => l.id === novoLocal) ?? null
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(
          montarDetalheLocal(local, config.servicoPadrao),
          competencia?.cabecalho ?? '',
          null,
        ),
      ),
    )
  }

  const aoMudarCompetencia = (novaId: string) => {
    setCompetenciaId(novaId)
    const comp = competencias.find((c) => c.id === novaId) ?? competencias[0]
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(
          montarDetalheLocal(localSelecionado, config.servicoPadrao),
          comp?.cabecalho ?? '',
          null,
        ),
      ),
    )
  }

  const handleImprimir = async () => {
    setAviso(null)
    if (!tenantUserId) {
      setAviso('Inicie sessão para emitir relatórios.')
      return
    }
    if (!profissionalEmissorEfetivo) {
      setAviso(
        isTitular
          ? 'Selecione um profissional com certificado digital activo.'
          : 'Associe um perfil profissional com certificado em Meus dados.',
      )
      return
    }
    const elemento = previewCapturaRef.current
    if (!elemento) {
      setAviso('Preview indisponível.')
      return
    }

    setAAssinar(true)
    try {
      const dataHoraAssinatura = new Date().toISOString()
      flushSync(() => setDataHoraAssinaturaPdf(dataHoraAssinatura))

      const registro = await registrarRelatorioImpresso(tenantUserId, {
        tipo_relatorio: config.tipoRelatorioHistorico,
        titulo: config.tituloRelatorio,
        competencia: competencia?.label ?? competenciaId,
        local_ref: localId,
        local_nome: cabecalhoTexto.local,
        cabecalho: { ...cabecalhoTexto, logoUrl } as Json,
        snapshot: {
          setorUti: config.setorUti,
          competenciaId,
          indicadorUti,
          indicadoresEscala,
          blocos: blocosRelatorio.blocos,
        } as Json,
      })

      const pdfBytes = await capturarPreviewComoPdf(elemento)
      const resultado = await assinarRelatorioProfissional({
        relatorioId: registro.id,
        profissionalId: profissionalEmissorEfetivo,
        pdfBase64: pdfParaBase64(pdfBytes),
      })

      setVersaoHistorico((v) => v + 1)
      window.open(resultado.pdfAssinadoUrl, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Erro ao assinar o relatório.')
    } finally {
      setAAssinar(false)
      setDataHoraAssinaturaPdf(undefined)
    }
  }

  const cargaInicialPendente =
    carregandoLocais || (Boolean(localId) && (carregandoPlantoes || indicadoresCarregando))

  if (cargaInicialPendente && locaisOpcoes.length === 0) {
    return <EmissaoRelatorioCarregando titulo={config.tituloPagina} />
  }

  return (
    <div className="-m-8 flex min-h-screen print:m-0 print:block print:min-h-0">
      <aside className="no-print flex h-[100dvh] max-h-[100dvh] w-full max-w-md shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white lg:w-1/3">
        <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-5">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">{config.tituloPagina}</h1>
          <p className="mt-2 text-xs text-slate-500">
            Construtor de blocos, dados contratuais e histórico de impressões.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <CampoSelect
              label="Competência"
              value={competenciaId}
              onChange={aoMudarCompetencia}
              opcoes={competencias}
            />
            <CampoSelect
              label="Local / Contrato"
              value={localId}
              onChange={aoMudarLocal}
              opcoes={
                locaisOpcoes.length > 0
                  ? locaisOpcoes.map((l) => ({ id: l.id, label: l.nome }))
                  : [{ id: '', label: carregandoLocais ? 'A carregar…' : 'Nenhum local' }]
              }
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
              {carregandoPlantoes || indicadoresCarregando ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  A carregar plantões e indicadores UTI…
                </span>
              ) : erroPlantoes ? (
                <span className="text-red-700">{erroPlantoes}</span>
              ) : (
                <span>
                  <strong className="text-slate-800">{totalPlantoes}</strong> plantão(ões){' '}
                  realizados em {config.setorUti}.
                  {indicadorUti ? ' Indicadores SCIRAS carregados.' : ' Sem indicadores UTI guardados.'}
                </span>
              )}
            </div>

            <AccordionSecao titulo="Configurações Contratuais" defaultAberto>
              {CAMPOS_CONTRATUAIS.map(({ chave, label }) => (
                <CampoTexto
                  key={String(chave)}
                  label={label}
                  value={cabecalhoTexto[chave]}
                  onChange={(valor) =>
                    setCabecalhoTexto((atual) => ({ ...atual, [chave]: valor }))
                  }
                />
              ))}
              <button
                type="button"
                onClick={restaurarCabecalho}
                className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
              >
                Restaurar texto do contrato
              </button>
            </AccordionSecao>

            {isTitular ? (
              <AccordionSecao titulo="Assinatura & Validação">
                {carregandoEmissores ? (
                  <p className="text-xs text-slate-600">A carregar profissionais…</p>
                ) : profissionaisCert.length === 0 ? (
                  <p className="text-xs text-amber-800">
                    Nenhum profissional com certificado activo.
                  </p>
                ) : (
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                    Profissional assinante
                    <select
                      value={profissionalEmissorId}
                      onChange={(e) => setProfissionalEmissorId(e.target.value)}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      {profissionaisCert.map((p) => (
                        <option key={p.profissionalId} value={p.profissionalId}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </AccordionSecao>
            ) : null}

            <EditorBlocosRelatorio {...blocosRelatorio} />

            <div className="rounded-lg border border-slate-200 p-3">
              <HistoricoRelatoriosPanel
                userId={tenantUserId ?? undefined}
                versaoLista={versaoHistorico}
              />
            </div>
          </div>
        </div>

        <div className="mt-auto shrink-0 border-t border-slate-100 p-4">
          {aviso ? (
            <p role="status" className="mb-3 text-xs text-amber-800">
              {aviso}
            </p>
          ) : null}
          <button
            type="button"
            disabled={aAssinar}
            onClick={() => void handleImprimir()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {aAssinar ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Printer className="h-5 w-5" aria-hidden />
            )}
            {aAssinar ? 'A assinar PDF…' : 'Imprimir / Salvar PDF'}
          </button>
        </div>
      </aside>

      <section
        ref={previewScrollRef}
        className="flex-1 overflow-y-auto bg-slate-300 p-8 print:overflow-visible print:bg-white print:p-0"
      >
        <div ref={previewCapturaRef} className="flex justify-center">
          <RelatorioAtividadesUtiTemplate
            cabecalho={cabecalho}
            tituloRelatorio={config.tituloRelatorio}
            dataEmissao={formatarDataEmissao(cabecalho.competencia)}
            conteudo={blocosRelatorio.blocos}
            competenciaRotulo={cabecalho.competencia}
            indicadorUti={indicadorUti}
            indicadoresEscala={indicadoresEscala}
            indicadoresCarregando={indicadoresCarregando}
            assinatura={assinaturaDocumento}
            modoPreviewAssinatura={!dataHoraAssinaturaPdf}
          />
        </div>
      </section>
    </div>
  )
}

function AccordionSecao({
  titulo,
  defaultAberto = false,
  children,
}: {
  titulo: string
  defaultAberto?: boolean
  children: ReactNode
}) {
  const [aberto, setAberto] = useState(defaultAberto)
  return (
    <details
      open={aberto}
      onToggle={(e) => setAberto(e.currentTarget.open)}
      className="group overflow-hidden rounded-lg border border-slate-200"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
        <span>{titulo}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2.5 border-t border-slate-100 p-3">{children}</div>
    </details>
  )
}

function CampoTexto({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (valor: string) => void
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs font-medium text-slate-700">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
      />
    </label>
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
  opcoes: CompetenciaOpcao[] | { id: string; label: string }[]
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
