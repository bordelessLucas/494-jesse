import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ChevronDown, Loader2, Printer } from 'lucide-react'

import { useContaMembro } from '../../hooks/useContaMembro'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import {
  assinarRelatorioProfissional,
  listarProfissionaisComCertificadoAtivo,
  type ProfissionalCertificadoAtivo,
} from '../../lib/relatorios/assinarRelatorioProfissional'
import {
  capturarPreviewComoPdf,
  pdfParaBase64,
} from '../../lib/relatorios/capturarPreviewComoPdf'
import {
  buscarDadosAssinaturaEmissor,
  montarAssinaturaDocumento,
  type DadosAssinaturaEmissor,
} from '../../lib/relatorios/dadosAssinaturaEmissor'
import { registrarRelatorioImpresso } from '../../lib/relatorios/relatoriosHistoricoDb'
import {
  buscarLocaisRelatorio,
  buscarPlantoesRealizadosRelatorio,
  type LocalRelatorioOpcao,
  type PlantaoRelatorioRow,
} from '../../lib/relatorios/plantoesRelatorioDb'
import {
  calcularIndicadoresScirasEscala,
  detectarTurnosUnicos,
  mapearEscalaCoordenacao,
  mapearEscalaFrequenciaSetor,
  mapearLinhasFrequenciaDetalhada,
} from '../../lib/relatorios/mapearPlantoesRelatorio'
import type { Json } from '../../types/database.types'

import { carregarIndicadoresParaRelatorio } from '../../features/sciras/carregarIndicadoresRelatorio'
import type {
  IndicadorCirurgico,
  IndicadorUti,
} from '../../features/sciras/types'

import { EditorBlocosRelatorio } from '../../features/relatorios/components/EditorBlocosRelatorio'
import { EmissaoRelatorioCarregando } from '../../features/relatorios/components/EmissaoRelatorioCarregando'
import { HistoricoRelatoriosPanel } from '../../features/relatorios/components/HistoricoRelatoriosPanel'
import { useDebouncedEffect } from '../../features/relatorios/hooks/useDebouncedEffect'
import { useEmissaoRelatorioNavegacao } from '../../features/relatorios/hooks/useEmissaoRelatorioNavegacao'
import { useBlocosRelatorio } from '../../features/relatorios/hooks/useBlocosRelatorio'
import {
  lerEmissaoRelatorioRascunho,
  salvarEmissaoRelatorioRascunho,
} from '../../features/relatorios/utils/emissaoRelatorioRascunho'
import { FrequenciaCoordenacaoTemplate } from '../../features/relatorios/templates/FrequenciaCoordenacaoTemplate'
import { FrequenciaListaDetalhadaTemplate } from '../../features/relatorios/templates/FrequenciaListaDetalhadaTemplate'
import { FrequenciaSetorTemplate } from '../../features/relatorios/templates/FrequenciaSetorTemplate'
import { RelatorioAtividadesTemplate } from '../../features/relatorios/templates/RelatorioAtividadesTemplate'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  EscalaCoordenacaoEntrada,
  EscalaFrequenciaSetorEntrada,
  IndicadoresScirasEscala,
  LinhaFrequenciaDetalhada,
  RelatorioAtividadesBloco,
  TurnoFrequencia,
} from '../../features/relatorios/types'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'

/* ============================================================
 * Tipos do formulário e contratos de UI
 * ============================================================ */

type TipoRelatorio =
  | 'FrequenciaSetor'
  | 'FrequenciaCoordenacao'
  | 'RelatorioSCIRAS'

type OpcaoSelect<T extends string> = {
  id: T
  label: string
}

type LocalContratoId = string

type LocalContratoDetalhe = {
  nomeLocal: string
  servico: string
  tomador: string
  contratoGestao: string
  contratoPrestacao: string
  empresa: string
  cnpj: string
  coordenador: string
  turnosFrequencia: TurnoFrequencia[]
}

const DEFAULT_TURNOS_FREQUENCIA: TurnoFrequencia[] = ['07-13H', '13-19H', '19-07H']

const DETALHE_PADRAO: Omit<LocalContratoDetalhe, 'nomeLocal' | 'cnpj' | 'tomador'> = {
  servico: 'UTI Pediátrica',
  contratoGestao: '',
  contratoPrestacao: '',
  empresa: 'PlantãoCheck Serviços Médicos LTDA',
  coordenador: '',
  turnosFrequencia: DEFAULT_TURNOS_FREQUENCIA,
}

function montarDetalheLocal(local: LocalRelatorioOpcao | null): LocalContratoDetalhe {
  if (!local) {
    return {
      nomeLocal: '—',
      tomador: '—',
      cnpj: '',
      ...DETALHE_PADRAO,
    }
  }
  return {
    nomeLocal: local.nome,
    tomador: `${local.cidade} — ${local.uf}`,
    cnpj: local.cnpj ?? '',
    ...DETALHE_PADRAO,
  }
}

/* ============================================================
 * Opções de relatório
 * ============================================================ */

const TIPOS_RELATORIO: OpcaoSelect<TipoRelatorio>[] = [
  { id: 'FrequenciaSetor', label: 'Lista de Frequência — UTI Pediátrica' },
  {
    id: 'FrequenciaCoordenacao',
    label: 'Lista de Frequência — SCIH (Coordenação)',
  },
  { id: 'RelatorioSCIRAS', label: 'Relatório de Atividades — SCIRAS' },
]

/* ============================================================
 * Helpers de domínio
 * ============================================================ */

type CompetenciaOpcao = {
  /** Chave estável "YYYY-MM" usada como value do select. */
  id: string
  /** Rótulo amigável ex.: "Maio / 2026". */
  label: string
  /** Versão usada no cabeçalho oficial, ex.: "MAIO/2026". */
  cabecalho: string
}

const MESES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function gerarCompetencias(referencia: Date = new Date()): CompetenciaOpcao[] {
  const opcoes: CompetenciaOpcao[] = []
  for (let offset = -6; offset <= 1; offset += 1) {
    const data = new Date(
      referencia.getFullYear(),
      referencia.getMonth() + offset,
      1,
    )
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const mesNome = MESES_PT_BR[mes]
    const mesNum = String(mes + 1).padStart(2, '0')
    opcoes.push({
      id: `${ano}-${mesNum}`,
      label: `${mesNome} / ${ano}`,
      cabecalho: `${mesNome.toUpperCase()}/${ano}`,
    })
  }
  return opcoes.reverse()
}

function obterDiasNoMes(competenciaId: string): number {
  const [anoStr, mesStr] = competenciaId.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  if (Number.isNaN(ano) || Number.isNaN(mes)) return 31
  return new Date(ano, mes, 0).getDate()
}

function montarCabecalho(
  detalhe: LocalContratoDetalhe,
  competenciaCabecalho: string,
  logoUrl: string | null,
): CabecalhoContratualData {
  return {
    logoUrl,
    contratoGestao: detalhe.contratoGestao,
    contratoPrestacao: detalhe.contratoPrestacao,
    local: detalhe.nomeLocal,
    servico: detalhe.servico,
    tomador: detalhe.tomador,
    empresa: detalhe.empresa,
    cnpj: detalhe.cnpj,
    coordenador: detalhe.coordenador,
    competencia: competenciaCabecalho,
  }
}

/** Campos textuais do cabeçalho (o logo vem da marca da plataforma). */
type CabecalhoTextoEditavel = Omit<CabecalhoContratualData, 'logoUrl'>

function extrairTextoCabecalho(
  dados: CabecalhoContratualData,
): CabecalhoTextoEditavel {
  const { logoUrl: _logo, ...texto } = dados
  return texto
}

const CAMPOS_CONTRATUAIS_ACCORDION: {
  chave: keyof CabecalhoTextoEditavel
  label: string
}[] = [
  { chave: 'contratoGestao', label: 'Contrato de Gestão' },
  { chave: 'contratoPrestacao', label: 'Contrato de Prestação de Serviços' },
  { chave: 'local', label: 'Local' },
  { chave: 'servico', label: 'Serviço' },
  { chave: 'coordenador', label: 'Coordenador' },
  { chave: 'tomador', label: 'Tomador' },
  { chave: 'empresa', label: 'Empresa' },
  { chave: 'cnpj', label: 'CNPJ' },
  { chave: 'competencia', label: 'Competência (texto no relatório)' },
]

/** Blocos iniciais vazios — o coordenador adiciona texto/imagem pelos botões. */
const BLOCOS_INICIAIS_SCIRAS: RelatorioAtividadesBloco[] = []

function formatarDataEmissao(competenciaCabecalho: string): string {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = MESES_PT_BR[hoje.getMonth()].toLowerCase()
  const ano = hoje.getFullYear()
  return `São Paulo, ${dia} de ${mes} de ${ano} — Competência ${competenciaCabecalho}`
}

/* ============================================================
 * Componente principal — orquestrador da página
 * ============================================================ */

export function EmissaoRelatoriosPage() {
  const { tenantUserId } = useTenantUserId()
  const { isTitular, isMembroProfissional, profissionalId: profissionalIdMembro } =
    useContaMembro()
  const { logoUrl } = useThemeBranding()
  const previewCapturaRef = useRef<HTMLDivElement>(null)
  const { previewScrollRef } = useEmissaoRelatorioNavegacao('plantao-check:emissao-scih')
  const competencias = useMemo(() => gerarCompetencias(), [])
  const rascunhoGuardado = useMemo(() => lerEmissaoRelatorioRascunho(), [])

  const [locaisOpcoes, setLocaisOpcoes] = useState<LocalRelatorioOpcao[]>([])
  const [carregandoLocais, setCarregandoLocais] = useState(true)
  const [plantoesRelatorio, setPlantoesRelatorio] = useState<PlantaoRelatorioRow[]>([])
  const [carregandoPlantoes, setCarregandoPlantoes] = useState(false)
  const [erroPlantoes, setErroPlantoes] = useState<string | null>(null)

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>(
    () => rascunhoGuardado?.tipoSelecionado ?? TIPOS_RELATORIO[0].id,
  )
  const [competenciaId, setCompetenciaId] = useState<string>(
    () => rascunhoGuardado?.competenciaId ?? (competencias[0]?.id ?? ''),
  )
  const [localId, setLocalId] = useState<LocalContratoId>(
    () => rascunhoGuardado?.localId ?? '',
  )

  const blocosRelatorio = useBlocosRelatorio(
    rascunhoGuardado?.blocosSCIRAS ?? BLOCOS_INICIAIS_SCIRAS,
  )

  const [rotulosTurnosFrequenciaSetor, setRotulosTurnosFrequenciaSetor] =
    useState<TurnoFrequencia[]>(() => {
      if (rascunhoGuardado?.rotulosTurnosFrequenciaSetor.length) {
        return rascunhoGuardado.rotulosTurnosFrequenciaSetor.slice()
      }
      return DEFAULT_TURNOS_FREQUENCIA.slice()
    })

  const [cabecalhoTexto, setCabecalhoTexto] = useState<CabecalhoTextoEditavel>(
    () => {
      if (rascunhoGuardado?.cabecalhoTexto) {
        return rascunhoGuardado.cabecalhoTexto
      }
      const competenciaInicial =
        rascunhoGuardado?.competenciaId ?? competencias[0]?.id ?? ''
      const competenciaCab =
        competencias.find((c) => c.id === competenciaInicial)?.cabecalho ?? ''
      return extrairTextoCabecalho(
        montarCabecalho(montarDetalheLocal(null), competenciaCab, null),
      )
    },
  )

  const [indicadorUtiRelatorio, setIndicadorUtiRelatorio] =
    useState<IndicadorUti | null>(null)
  const [indicadorCirurgicoRelatorio, setIndicadorCirurgicoRelatorio] =
    useState<IndicadorCirurgico | null>(null)
  const [indicadoresRelatorioCarregando, setIndicadoresRelatorioCarregando] =
    useState(false)

  const [versaoHistorico, setVersaoHistorico] = useState(0)
  const [aAssinarRelatorio, setAAssinarRelatorio] = useState(false)
  const [avisoHistorico, setAvisoHistorico] = useState<string | null>(null)
  const [profissionaisComCertificado, setProfissionaisComCertificado] = useState<
    ProfissionalCertificadoAtivo[]
  >([])
  const [profissionalEmissorId, setProfissionalEmissorId] = useState('')
  const [carregandoEmissores, setCarregandoEmissores] = useState(false)
  const [dadosEmissor, setDadosEmissor] = useState<DadosAssinaturaEmissor | null>(
    null,
  )
  const [dataHoraAssinaturaPdf, setDataHoraAssinaturaPdf] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    if (!tenantUserId || !isTitular) {
      setProfissionaisComCertificado([])
      setProfissionalEmissorId('')
      return
    }

    let cancelado = false
    setCarregandoEmissores(true)
    void listarProfissionaisComCertificadoAtivo(tenantUserId)
      .then((lista) => {
        if (cancelado) return
        setProfissionaisComCertificado(lista)
        setProfissionalEmissorId((atual) => {
          if (atual && lista.some((p) => p.profissionalId === atual)) return atual
          return lista[0]?.profissionalId ?? ''
        })
      })
      .catch(() => {
        if (!cancelado) setProfissionaisComCertificado([])
      })
      .finally(() => {
        if (!cancelado) setCarregandoEmissores(false)
      })

    return () => {
      cancelado = true
    }
  }, [tenantUserId, isTitular])

  const profissionalEmissorEfetivo = isMembroProfissional
    ? profissionalIdMembro
    : profissionalEmissorId || null

  useEffect(() => {
    if (!profissionalEmissorEfetivo) {
      setDadosEmissor(null)
      return
    }

    let cancelado = false
    void buscarDadosAssinaturaEmissor(profissionalEmissorEfetivo)
      .then((dados) => {
        if (!cancelado) setDadosEmissor(dados)
      })
      .catch(() => {
        if (!cancelado) setDadosEmissor(null)
      })

    return () => {
      cancelado = true
    }
  }, [profissionalEmissorEfetivo])

  const competencia = useMemo(
    () =>
      competencias.find((opcao) => opcao.id === competenciaId) ??
      competencias[0],
    [competencias, competenciaId],
  )

  const localSelecionado = useMemo(
    () => locaisOpcoes.find((l) => l.id === localId) ?? null,
    [locaisOpcoes, localId],
  )

  const detalhe = useMemo(
    () => montarDetalheLocal(localSelecionado),
    [localSelecionado],
  )

  const locaisSelectOpcoes = useMemo(
    (): OpcaoSelect<LocalContratoId>[] =>
      locaisOpcoes.map((l) => ({ id: l.id, label: l.nome })),
    [locaisOpcoes],
  )

  const cabecalho = useMemo(
    (): CabecalhoContratualData => ({ ...cabecalhoTexto, logoUrl }),
    [cabecalhoTexto, logoUrl],
  )

  const assinaturaDocumento = useMemo(
    () =>
      montarAssinaturaDocumento(cabecalho, dadosEmissor, dataHoraAssinaturaPdf),
    [cabecalho, dadosEmissor, dataHoraAssinaturaPdf],
  )

  const modoPreviewAssinatura = !dataHoraAssinaturaPdf

  useDebouncedEffect(() => {
    salvarEmissaoRelatorioRascunho({
      tipoSelecionado,
      competenciaId,
      localId,
      cabecalhoTexto,
      rotulosTurnosFrequenciaSetor,
      blocosSCIRAS: blocosRelatorio.blocos,
    })
  }, [
    blocosRelatorio.blocos,
    cabecalhoTexto,
    competenciaId,
    localId,
    rotulosTurnosFrequenciaSetor,
    tipoSelecionado,
  ])

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
        setLocalId((atual) => {
          if (atual && lista.some((l) => l.id === atual)) return atual
          return lista[0]?.id ?? ''
        })
      })
      .catch(() => {
        if (!cancelado) setLocaisOpcoes([])
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
      setPlantoesRelatorio([])
      setErroPlantoes(null)
      setCarregandoPlantoes(false)
      return
    }
    let cancelado = false
    setCarregandoPlantoes(true)
    setErroPlantoes(null)
    void buscarPlantoesRealizadosRelatorio(tenantUserId, competenciaId, localId)
      .then((rows) => {
        if (cancelado) return
        setPlantoesRelatorio(rows)
      })
      .catch((e) => {
        if (!cancelado) {
          setPlantoesRelatorio([])
          setErroPlantoes(
            e instanceof Error ? e.message : 'Erro ao carregar plantões.',
          )
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoPlantoes(false)
      })
    return () => {
      cancelado = true
    }
  }, [tenantUserId, localId, competenciaId])

  const totalDias = useMemo(
    () => (competencia ? obterDiasNoMes(competencia.id) : 31),
    [competencia],
  )

  const linhasFrequencia = useMemo(
    () => mapearLinhasFrequenciaDetalhada(plantoesRelatorio),
    [plantoesRelatorio],
  )

  const escalaSetor = useMemo(
    () =>
      mapearEscalaFrequenciaSetor(
        plantoesRelatorio,
        rotulosTurnosFrequenciaSetor,
        totalDias,
      ),
    [plantoesRelatorio, rotulosTurnosFrequenciaSetor, totalDias],
  )

  const escalaCoordenacao = useMemo(
    () => mapearEscalaCoordenacao(plantoesRelatorio, totalDias),
    [plantoesRelatorio, totalDias],
  )

  const indicadoresEscala = useMemo(
    () => calcularIndicadoresScirasEscala(plantoesRelatorio),
    [plantoesRelatorio],
  )

  useEffect(() => {
    if (tipoSelecionado !== 'RelatorioSCIRAS') {
      setIndicadorUtiRelatorio(null)
      setIndicadorCirurgicoRelatorio(null)
      setIndicadoresRelatorioCarregando(false)
      return
    }

    let cancelado = false
    setIndicadoresRelatorioCarregando(true)

    void carregarIndicadoresParaRelatorio(
      competenciaId,
      cabecalhoTexto.servico,
    ).then(
      (resultado) => {
        if (cancelado) return
        setIndicadorUtiRelatorio(resultado.indicadorUti)
        setIndicadorCirurgicoRelatorio(resultado.indicadorCirurgico)
      },
    ).finally(() => {
      if (!cancelado) setIndicadoresRelatorioCarregando(false)
    })

    return () => {
      cancelado = true
    }
  }, [tipoSelecionado, competenciaId, cabecalhoTexto.servico])

  const restaurarCabecalhoDoContrato = () => {
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(detalhe, competencia?.cabecalho ?? '', null),
      ),
    )
  }

  const alterarCampoCabecalho = (
    chave: keyof CabecalhoTextoEditavel,
    valor: string,
  ) => {
    setCabecalhoTexto((atual) => ({ ...atual, [chave]: valor }))
  }

  const handleImprimir = async () => {
    setAvisoHistorico(null)

    if (!tenantUserId) {
      setAvisoHistorico('Inicie sessão para emitir e assinar relatórios.')
      return
    }

    if (!profissionalEmissorEfetivo) {
      setAvisoHistorico(
        isTitular
          ? 'Selecione um profissional com certificado digital ativo para assinar o relatório.'
          : 'Associe um perfil profissional com certificado digital em Meus dados.',
      )
      return
    }

    const elementoPreview = previewCapturaRef.current
    if (!elementoPreview) {
      setAvisoHistorico('Preview do relatório indisponível. Recarregue a página.')
      return
    }

    setAAssinarRelatorio(true)

    try {
      const dataHoraAssinatura = new Date().toISOString()
      flushSync(() => setDataHoraAssinaturaPdf(dataHoraAssinatura))

      const titulo =
        TIPOS_RELATORIO.find((t) => t.id === tipoSelecionado)?.label ?? tipoSelecionado
      const competenciaRotulo = competencia?.label ?? competenciaId

      const relatorioRegistado = await registrarRelatorioImpresso(tenantUserId, {
        tipo_relatorio: tipoSelecionado,
        titulo,
        competencia: competenciaRotulo,
        local_ref: localId,
        local_nome: detalhe.nomeLocal,
        cabecalho: { ...cabecalhoTexto, logoUrl } as Json,
        snapshot: {
          tipoSelecionado,
          competenciaId,
          competenciaRotulo,
          localId,
          cabecalho,
          totalDias,
          linhasFrequencia:
            tipoSelecionado !== 'RelatorioSCIRAS' ? linhasFrequencia : undefined,
          escalaSetor:
            tipoSelecionado === 'FrequenciaSetor' ? escalaSetor : undefined,
          escalaCoordenacao:
            tipoSelecionado === 'FrequenciaCoordenacao'
              ? escalaCoordenacao
              : undefined,
          indicadoresEscala:
            tipoSelecionado === 'RelatorioSCIRAS' ? indicadoresEscala : undefined,
          rotulosTurnosFrequenciaSetor:
            tipoSelecionado === 'FrequenciaSetor'
              ? rotulosTurnosFrequenciaSetor
              : undefined,
          blocosSCIRAS:
            tipoSelecionado === 'RelatorioSCIRAS'
              ? blocosRelatorio.blocos
              : undefined,
          indicadorUti: indicadorUtiRelatorio,
          indicadorCirurgico: indicadorCirurgicoRelatorio,
        } as Json,
      })

      const pdfBytes = await capturarPreviewComoPdf(elementoPreview)
      const resultado = await assinarRelatorioProfissional({
        relatorioId: relatorioRegistado.id,
        profissionalId: profissionalEmissorEfetivo,
        pdfBase64: pdfParaBase64(pdfBytes),
      })

      setVersaoHistorico((v) => v + 1)
      window.open(resultado.pdfAssinadoUrl, '_blank', 'noopener,noreferrer')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao assinar o relatório.'
      setAvisoHistorico(msg)
    } finally {
      setAAssinarRelatorio(false)
      setDataHoraAssinaturaPdf(undefined)
    }
  }

  const alterarRotuloTurnoFrequencia = (indice: number, valor: string) => {
    setRotulosTurnosFrequenciaSetor((atuais) => {
      const copia = atuais.slice()
      copia[indice] = valor
      return copia
    })
  }

  const restaurarRotulosTurnosPadrao = () => {
    const detectados = detectarTurnosUnicos(plantoesRelatorio)
    setRotulosTurnosFrequenciaSetor(
      detectados.length > 0 ? detectados : DEFAULT_TURNOS_FREQUENCIA.slice(),
    )
  }

  const aoMudarLocal = (novoLocal: LocalContratoId) => {
    setLocalId(novoLocal)
    const local = locaisOpcoes.find((l) => l.id === novoLocal) ?? null
    const competenciaCab = competencia?.cabecalho ?? ''
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(montarDetalheLocal(local), competenciaCab, null),
      ),
    )
  }

  const aoMudarCompetencia = (novaCompetenciaId: string) => {
    setCompetenciaId(novaCompetenciaId)
    const competenciaNova =
      competencias.find((opcao) => opcao.id === novaCompetenciaId) ??
      competencias[0]
    setCabecalhoTexto(
      extrairTextoCabecalho(
        montarCabecalho(
          detalhe,
          competenciaNova?.cabecalho ?? '',
          null,
        ),
      ),
    )
  }

  const mostrarEditorBlocos = tipoSelecionado === 'RelatorioSCIRAS'

  if (carregandoLocais && locaisOpcoes.length === 0) {
    return <EmissaoRelatorioCarregando titulo="Emissão de Relatórios — SCIH" />
  }

  return (
    <div className="-m-8 flex min-h-screen print:m-0 print:block print:min-h-0">
      <PainelConfiguracao
        tipoSelecionado={tipoSelecionado}
        onChangeTipoSelecionado={setTipoSelecionado}
        competenciaId={competenciaId}
        onChangeCompetencia={aoMudarCompetencia}
        competencias={competencias}
        localId={localId}
        onChangeLocal={aoMudarLocal}
        locaisOpcoes={locaisSelectOpcoes}
        carregandoLocais={carregandoLocais}
        carregandoPlantoes={carregandoPlantoes}
        erroPlantoes={erroPlantoes}
        totalPlantoesRealizados={plantoesRelatorio.length}
        onImprimir={() => void handleImprimir()}
        aAssinarRelatorio={aAssinarRelatorio}
        avisoHistorico={avisoHistorico}
        isTitular={isTitular}
        profissionaisComCertificado={profissionaisComCertificado}
        profissionalEmissorId={profissionalEmissorId}
        onChangeProfissionalEmissor={setProfissionalEmissorId}
        carregandoEmissores={carregandoEmissores}
        painelHistorico={
          <HistoricoRelatoriosPanel userId={tenantUserId ?? undefined} versaoLista={versaoHistorico} />
        }
        cabecalhoTexto={cabecalhoTexto}
        onAlterarCampoCabecalho={alterarCampoCabecalho}
        onRestaurarCabecalhoContrato={restaurarCabecalhoDoContrato}
        rotulosTurnosFrequenciaSetor={
          tipoSelecionado === 'FrequenciaSetor'
            ? rotulosTurnosFrequenciaSetor
            : undefined
        }
        onAlterarRotuloTurnoFrequencia={alterarRotuloTurnoFrequencia}
        onRestaurarRotulosTurnosPadrao={restaurarRotulosTurnosPadrao}
      >
        {mostrarEditorBlocos ? (
          <EditorBlocosRelatorio {...blocosRelatorio} />
        ) : null}
      </PainelConfiguracao>

      <PainelPreview capturaRef={previewCapturaRef} scrollRef={previewScrollRef}>
        <PreviewRelatorioSelecionado
          tipoSelecionado={tipoSelecionado}
          cabecalho={cabecalho}
          totalDias={totalDias}
          turnosFrequenciaSetor={rotulosTurnosFrequenciaSetor}
          linhasFrequencia={linhasFrequencia}
          escalaSetor={escalaSetor}
          escalaCoordenacao={escalaCoordenacao}
          carregandoPlantoes={carregandoPlantoes}
          totalPlantoesRealizados={plantoesRelatorio.length}
          blocosSCIRAS={blocosRelatorio.blocos}
          indicadorUtiRelatorio={indicadorUtiRelatorio}
          indicadorCirurgicoRelatorio={indicadorCirurgicoRelatorio}
          indicadoresEscala={indicadoresEscala}
          indicadoresRelatorioCarregando={
            indicadoresRelatorioCarregando || carregandoPlantoes
          }
          assinatura={assinaturaDocumento}
          modoPreviewAssinatura={modoPreviewAssinatura}
        />
      </PainelPreview>
    </div>
  )
}

/* ============================================================
 * Coluna esquerda — formulário de configuração
 * ============================================================ */

type PainelConfiguracaoProps = {
  tipoSelecionado: TipoRelatorio
  onChangeTipoSelecionado: (valor: TipoRelatorio) => void
  competenciaId: string
  onChangeCompetencia: (valor: string) => void
  competencias: CompetenciaOpcao[]
  localId: LocalContratoId
  onChangeLocal: (valor: LocalContratoId) => void
  locaisOpcoes: OpcaoSelect<LocalContratoId>[]
  carregandoLocais?: boolean
  carregandoPlantoes?: boolean
  erroPlantoes?: string | null
  totalPlantoesRealizados?: number
  onImprimir: () => void
  aAssinarRelatorio?: boolean
  avisoHistorico?: string | null
  isTitular?: boolean
  profissionaisComCertificado?: ProfissionalCertificadoAtivo[]
  profissionalEmissorId?: string
  onChangeProfissionalEmissor?: (valor: string) => void
  carregandoEmissores?: boolean
  painelHistorico?: ReactNode
  cabecalhoTexto: CabecalhoTextoEditavel
  onAlterarCampoCabecalho: (
    chave: keyof CabecalhoTextoEditavel,
    valor: string,
  ) => void
  onRestaurarCabecalhoContrato: () => void
  /** Só preenchido para «Lista de Frequência — Setor»: rótulos editáveis das colunas de turno. */
  rotulosTurnosFrequenciaSetor?: TurnoFrequencia[]
  onAlterarRotuloTurnoFrequencia?: (indice: number, valor: string) => void
  onRestaurarRotulosTurnosPadrao?: () => void
  /** Slot opcional para conteúdo específico do tipo selecionado (ex.: editor de blocos). */
  children?: ReactNode
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
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-2.5 border-t border-slate-100 p-3">{children}</div>
    </details>
  )
}

function CampoCabecalhoTexto({
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
        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  )
}

function PainelConfiguracao({
  tipoSelecionado,
  onChangeTipoSelecionado,
  competenciaId,
  onChangeCompetencia,
  competencias,
  localId,
  onChangeLocal,
  locaisOpcoes,
  carregandoLocais = false,
  carregandoPlantoes = false,
  erroPlantoes,
  totalPlantoesRealizados = 0,
  onImprimir,
  aAssinarRelatorio = false,
  avisoHistorico,
  isTitular = false,
  profissionaisComCertificado = [],
  profissionalEmissorId = '',
  onChangeProfissionalEmissor,
  carregandoEmissores = false,
  painelHistorico,
  cabecalhoTexto,
  onAlterarCampoCabecalho,
  onRestaurarCabecalhoContrato,
  rotulosTurnosFrequenciaSetor,
  onAlterarRotuloTurnoFrequencia,
  onRestaurarRotulosTurnosPadrao,
  children,
}: PainelConfiguracaoProps) {
  const mostrarTurnos =
    tipoSelecionado === 'FrequenciaSetor' &&
    rotulosTurnosFrequenciaSetor &&
    onAlterarRotuloTurnoFrequencia &&
    onRestaurarRotulosTurnosPadrao

  return (
    <aside className="no-print flex h-[100dvh] max-h-[100dvh] w-full max-w-md shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white print:hidden lg:w-1/3">
      {/* Topo fixo */}
      <div className="shrink-0 border-b border-slate-100 px-4 pb-4 pt-5">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          Emissão de Relatórios
        </h1>
        <div className="mt-4">
          <CampoSelect
            label="Tipo de Relatório"
            value={tipoSelecionado}
            onChange={(valor) => onChangeTipoSelecionado(valor as TipoRelatorio)}
            opcoes={TIPOS_RELATORIO}
          />
          <p className="mt-2 text-xs text-slate-500">
            Configure o documento e visualize o preview ao lado antes de imprimir.
          </p>
        </div>
      </div>

      {/* Área central scrollável */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div className="space-y-4">
          <CampoSelect
            label="Competência"
            value={competenciaId}
            onChange={onChangeCompetencia}
            opcoes={competencias}
          />

          <CampoSelect
            label="Local / Contrato"
            value={localId}
            onChange={(valor) => onChangeLocal(valor as LocalContratoId)}
            opcoes={
              locaisOpcoes.length > 0
                ? locaisOpcoes
                : [{ id: '', label: carregandoLocais ? 'A carregar locais…' : 'Nenhum local' }]
            }
          />

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
            {carregandoPlantoes ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                A carregar plantões realizados…
              </span>
            ) : erroPlantoes ? (
              <span className="text-red-700">{erroPlantoes}</span>
            ) : (
              <span>
                <strong className="text-slate-800">{totalPlantoesRealizados}</strong>{' '}
                plantão(ões) com status «realizado» nesta competência e local.
              </span>
            )}
          </div>

          <AccordionSecao titulo="Configurações Contratuais" defaultAberto>
            <p className="text-xs text-slate-500">
              Aparecem no relatório impresso. O logotipo vem da marca da plataforma.
            </p>
            {CAMPOS_CONTRATUAIS_ACCORDION.map(({ chave, label }) => (
              <CampoCabecalhoTexto
                key={chave}
                label={label}
                value={cabecalhoTexto[chave]}
                onChange={(valor) => onAlterarCampoCabecalho(chave, valor)}
              />
            ))}
            <button
              type="button"
              onClick={onRestaurarCabecalhoContrato}
              className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              Restaurar texto do contrato e competência seleccionados
            </button>
          </AccordionSecao>

          {mostrarTurnos ? (
            <AccordionSecao titulo="Configuração de Turnos">
              <p className="text-xs text-slate-500">
                Estes textos aparecem no cabeçalho da tabela da lista de presença.
              </p>
              <ul className="space-y-2">
                {rotulosTurnosFrequenciaSetor!.map((rotulo, indice) => (
                  <li key={indice}>
                    <CampoCabecalhoTexto
                      label={`Coluna ${indice + 1}`}
                      value={rotulo}
                      onChange={(valor) => onAlterarRotuloTurnoFrequencia!(indice, valor)}
                    />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onRestaurarRotulosTurnosPadrao}
                className="text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
              >
                Restaurar horários do contrato
              </button>
            </AccordionSecao>
          ) : null}

          {isTitular ? (
            <AccordionSecao titulo="Assinatura & Validação">
              <p className="text-xs text-slate-500">
                O certificado digital ICP-Brasil deste profissional será aplicado ao PDF.
              </p>
              {carregandoEmissores ? (
                <p className="flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  A carregar profissionais com certificado…
                </p>
              ) : profissionaisComCertificado.length === 0 ? (
                <p className="text-xs text-amber-800">
                  Nenhum profissional com certificado ativo. Peça ao médico que registe o
                  certificado em <strong>Meus dados</strong>.
                </p>
              ) : (
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Profissional assinante
                  <select
                    value={profissionalEmissorId}
                    onChange={(e) => onChangeProfissionalEmissor?.(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  >
                    {profissionaisComCertificado.map((prof) => (
                      <option key={prof.profissionalId} value={prof.profissionalId}>
                        {prof.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </AccordionSecao>
          ) : null}

          {children ? <div>{children}</div> : null}

          {painelHistorico ? (
            <div className="rounded-lg border border-slate-200 p-3">
              {painelHistorico}
            </div>
          ) : null}
        </div>
      </div>

      {/* Rodapé fixo */}
      <div className="mt-auto shrink-0 border-t border-slate-100 bg-white p-4">
        {avisoHistorico ? (
          <p role="status" className="mb-3 text-xs text-amber-800">
            {avisoHistorico}
          </p>
        ) : null}
        <button
          type="button"
          disabled={aAssinarRelatorio}
          onClick={onImprimir}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-60"
        >
          {aAssinarRelatorio ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Printer className="h-5 w-5" aria-hidden />
          )}
          {aAssinarRelatorio
            ? 'Autenticando e aplicando assinatura jurídica do conselho…'
            : 'Imprimir / Salvar PDF'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          O PDF assinado digitalmente será aberto numa nova aba para impressão ou download.
        </p>
      </div>
    </aside>
  )
}

/* ============================================================
 * Coluna direita — wrapper de preview
 * ============================================================ */

type PainelPreviewProps = {
  children: ReactNode
  capturaRef?: React.RefObject<HTMLDivElement | null>
  scrollRef?: React.RefObject<HTMLElement | null>
}

function PainelPreview({ children, capturaRef, scrollRef }: PainelPreviewProps) {
  return (
    <section
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-slate-300 p-8 print:overflow-visible print:bg-white print:p-0"
    >
      <div ref={capturaRef} className="flex justify-center">
        {children}
      </div>
    </section>
  )
}

/* ============================================================
 * Seletor do template a renderizar (decisão central)
 * ============================================================ */

type PreviewRelatorioSelecionadoProps = {
  tipoSelecionado: TipoRelatorio
  cabecalho: CabecalhoContratualData
  totalDias: number
  turnosFrequenciaSetor: TurnoFrequencia[]
  linhasFrequencia: LinhaFrequenciaDetalhada[]
  escalaSetor: EscalaFrequenciaSetorEntrada[]
  escalaCoordenacao: EscalaCoordenacaoEntrada[]
  carregandoPlantoes: boolean
  totalPlantoesRealizados: number
  blocosSCIRAS: RelatorioAtividadesBloco[]
  indicadorUtiRelatorio: IndicadorUti | null
  indicadorCirurgicoRelatorio: IndicadorCirurgico | null
  indicadoresEscala: IndicadoresScirasEscala
  indicadoresRelatorioCarregando: boolean
  assinatura: AssinaturaResponsavel
  modoPreviewAssinatura?: boolean
}

function PreviewRelatorioSelecionado({
  tipoSelecionado,
  cabecalho,
  totalDias,
  turnosFrequenciaSetor,
  linhasFrequencia,
  escalaSetor,
  escalaCoordenacao,
  carregandoPlantoes,
  totalPlantoesRealizados,
  blocosSCIRAS,
  indicadorUtiRelatorio,
  indicadorCirurgicoRelatorio,
  indicadoresEscala,
  indicadoresRelatorioCarregando,
  assinatura,
  modoPreviewAssinatura = true,
}: PreviewRelatorioSelecionadoProps) {
  switch (tipoSelecionado) {
    case 'FrequenciaSetor': {
      const temEscalaSetor = escalaSetor.length > 0
      return (
        <div className="flex flex-col gap-8">
          <FrequenciaListaDetalhadaTemplate
            cabecalho={cabecalho}
            titulo={`Lista de Frequência — ${cabecalho.servico}`}
            linhas={linhasFrequencia}
            carregando={carregandoPlantoes}
            totalPlantoes={totalPlantoesRealizados}
            assinatura={temEscalaSetor ? undefined : assinatura}
            modoPreviewAssinatura={modoPreviewAssinatura}
          />
          {temEscalaSetor ? (
            <FrequenciaSetorTemplate
              cabecalho={cabecalho}
              turnos={turnosFrequenciaSetor}
              escala={escalaSetor}
              totalDias={totalDias}
              assinatura={assinatura}
              modoPreviewAssinatura={modoPreviewAssinatura}
            />
          ) : null}
        </div>
      )
    }

    case 'FrequenciaCoordenacao':
      return (
        <div className="flex flex-col gap-8">
          <FrequenciaListaDetalhadaTemplate
            cabecalho={cabecalho}
            titulo={`Lista de Frequência — Coordenação ${cabecalho.servico}`}
            linhas={linhasFrequencia}
            carregando={carregandoPlantoes}
            totalPlantoes={totalPlantoesRealizados}
          />
          <FrequenciaCoordenacaoTemplate
            cabecalho={cabecalho}
            escala={escalaCoordenacao}
            totalDias={totalDias}
            assinatura={assinatura}
            modoPreviewAssinatura={modoPreviewAssinatura}
          />
        </div>
      )

    case 'RelatorioSCIRAS':
      return (
        <RelatorioAtividadesTemplate
          cabecalho={cabecalho}
          dataEmissao={formatarDataEmissao(cabecalho.competencia)}
          conteudo={blocosSCIRAS}
          competenciaRotulo={cabecalho.competencia}
          indicadorUti={indicadorUtiRelatorio}
          indicadorCirurgico={indicadorCirurgicoRelatorio}
          indicadoresEscala={indicadoresEscala}
          indicadoresCarregando={indicadoresRelatorioCarregando}
          assinatura={assinatura}
          modoPreviewAssinatura={modoPreviewAssinatura}
        />
      )

    default: {
      // Exhaustiveness check — força erro de compilação se TipoRelatorio crescer
      // e algum case ficar sem tratamento.
      const _impossivel: never = tipoSelecionado
      return _impossivel
    }
  }
}

/* ============================================================
 * Primitivo: campo Select estilizado
 * ============================================================ */

type CampoSelectProps<T extends string> = {
  label: string
  value: T
  onChange: (valor: T) => void
  opcoes: OpcaoSelect<T>[]
}

function CampoSelect<T extends string>({
  label,
  value,
  onChange,
  opcoes,
}: CampoSelectProps<T>) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as T)
  }

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={handleChange}
        className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      >
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.label}
          </option>
        ))}
      </select>
    </label>
  )
}
