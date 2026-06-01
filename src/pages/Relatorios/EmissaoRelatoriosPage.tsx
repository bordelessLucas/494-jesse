import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Loader2, Printer } from 'lucide-react'

import { useTenantUserId } from '../../hooks/useTenantUserId'
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
import { HistoricoRelatoriosPanel } from '../../features/relatorios/components/HistoricoRelatoriosPanel'
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

const CAMPOS_CABECALHO_FORMULARIO: {
  chave: keyof CabecalhoTextoEditavel
  label: string
}[] = [
  { chave: 'contratoGestao', label: 'Contrato de Gestão' },
  { chave: 'contratoPrestacao', label: 'Contrato de Prestação de Serviços' },
  { chave: 'local', label: 'Local' },
  { chave: 'servico', label: 'Serviço' },
  { chave: 'tomador', label: 'Tomador' },
  { chave: 'empresa', label: 'Empresa' },
  { chave: 'cnpj', label: 'CNPJ' },
  { chave: 'coordenador', label: 'Coordenador' },
  { chave: 'competencia', label: 'Competência (texto no relatório)' },
]

function montarAssinaturaAPartirDoCabecalho(
  cab: CabecalhoContratualData,
): AssinaturaResponsavel {
  return {
    nomeProfissional: cab.coordenador,
    crmRqe: 'CRM/SP 123456 — RQE 7890',
    nomeEmpresa: cab.empresa,
    cnpjEmpresa: cab.cnpj,
  }
}

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
  const { logoUrl } = useThemeBranding()
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
  const [aRegistarImpressao, setARegistarImpressao] = useState(false)
  const [avisoHistorico, setAvisoHistorico] = useState<string | null>(null)

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

  useEffect(() => {
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

    if (tenantUserId) {
      setARegistarImpressao(true)
      try {
        const titulo =
          TIPOS_RELATORIO.find((t) => t.id === tipoSelecionado)?.label ??
          tipoSelecionado
        const competenciaRotulo = competencia?.label ?? competenciaId

        await registrarRelatorioImpresso(tenantUserId, {
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
        setVersaoHistorico((v) => v + 1)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao guardar histórico.'
        setAvisoHistorico(
          msg.includes('relatorios_historico') || msg.includes('schema')
            ? 'Não foi possível guardar o histórico (migração pendente). A impressão continuará.'
            : `Histórico não guardado: ${msg}. A impressão continuará.`,
        )
      } finally {
        setARegistarImpressao(false)
      }
    } else {
      setAvisoHistorico('Inicie sessão para registar o relatório no histórico.')
    }

    window.print()
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
        aRegistarImpressao={aRegistarImpressao}
        avisoHistorico={avisoHistorico}
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

      <PainelPreview>
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
  aRegistarImpressao?: boolean
  avisoHistorico?: string | null
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
  aRegistarImpressao = false,
  avisoHistorico,
  painelHistorico,
  cabecalhoTexto,
  onAlterarCampoCabecalho,
  onRestaurarCabecalhoContrato,
  rotulosTurnosFrequenciaSetor,
  onAlterarRotuloTurnoFrequencia,
  onRestaurarRotulosTurnosPadrao,
  children,
}: PainelConfiguracaoProps) {
  return (
    <aside className="no-print flex h-[100dvh] max-h-[100dvh] w-full max-w-md shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white print:hidden lg:w-1/3">
      <div className="shrink-0 p-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Emissão de Relatórios
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure o documento e visualize o preview ao lado antes de imprimir.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-4 px-6 pb-4">
        <CampoSelect
          label="Tipo de Relatório"
          value={tipoSelecionado}
          onChange={(valor) => onChangeTipoSelecionado(valor as TipoRelatorio)}
          opcoes={TIPOS_RELATORIO}
        />

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

        <div className="max-h-[min(380px,52vh)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Dados do cabeçalho
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Aparecem no relatório impresso. O logotipo vem da marca da
            plataforma (configuração).
          </p>
          <div className="mt-3 space-y-2.5">
            {CAMPOS_CABECALHO_FORMULARIO.map(({ chave, label }) => (
              <label
                key={chave}
                className="flex flex-col gap-0.5 text-xs font-medium text-slate-700"
              >
                {label}
                <input
                  type="text"
                  value={cabecalhoTexto[chave]}
                  onChange={(e) =>
                    onAlterarCampoCabecalho(chave, e.target.value)
                  }
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={onRestaurarCabecalhoContrato}
            className="mt-3 text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
          >
            Restaurar texto do contrato e competência seleccionados
          </button>
        </div>

        {tipoSelecionado === 'FrequenciaSetor' &&
        rotulosTurnosFrequenciaSetor &&
        onAlterarRotuloTurnoFrequencia &&
        onRestaurarRotulosTurnosPadrao ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-sm font-medium text-slate-800">
              Horários dos turnos
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Estes textos aparecem no cabeçalho da tabela da lista de presença.
            </p>
            <ul className="mt-3 space-y-2">
              {rotulosTurnosFrequenciaSetor.map((rotulo, indice) => (
                <li key={indice}>
                  <label className="flex flex-col gap-0.5 text-xs font-medium text-slate-700">
                    <span>Coluna {indice + 1}</span>
                    <input
                      type="text"
                      value={rotulo}
                      onChange={(e) =>
                        onAlterarRotuloTurnoFrequencia(indice, e.target.value)
                      }
                      placeholder="ex.: 07-13H"
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 shadow-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onRestaurarRotulosTurnosPadrao}
              className="mt-3 text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
            >
              Restaurar horários do contrato
            </button>
          </div>
        ) : null}
        </div>

        {children ? (
          <div className="border-t border-slate-100 px-6 py-4">{children}</div>
        ) : null}
      </div>

      {painelHistorico ? (
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          {painelHistorico}
        </div>
      ) : null}

      <div className="shrink-0 border-t border-slate-100 bg-white p-6">
        {avisoHistorico ? (
          <p role="status" className="mb-3 text-xs text-amber-800">
            {avisoHistorico}
          </p>
        ) : null}
        <button
          type="button"
          disabled={aRegistarImpressao}
          onClick={onImprimir}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-60"
        >
          {aRegistarImpressao ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Printer className="h-5 w-5" aria-hidden />
          )}
          {aRegistarImpressao ? 'A registar…' : 'Imprimir / Salvar PDF'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Dica: escolha “Salvar como PDF” na janela de impressão do navegador.
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
}

function PainelPreview({ children }: PainelPreviewProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-slate-300 p-8 print:overflow-visible print:bg-white print:p-0">
      <div className="flex justify-center">{children}</div>
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
}: PreviewRelatorioSelecionadoProps) {
  switch (tipoSelecionado) {
    case 'FrequenciaSetor':
      return (
        <div className="flex flex-col gap-8">
          <FrequenciaListaDetalhadaTemplate
            cabecalho={cabecalho}
            titulo={`Lista de Frequência — ${cabecalho.servico}`}
            linhas={linhasFrequencia}
            carregando={carregandoPlantoes}
            totalPlantoes={totalPlantoesRealizados}
          />
          {escalaSetor.length > 0 ? (
            <FrequenciaSetorTemplate
              cabecalho={cabecalho}
              turnos={turnosFrequenciaSetor}
              escala={escalaSetor}
              totalDias={totalDias}
            />
          ) : null}
        </div>
      )

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
          assinatura={montarAssinaturaAPartirDoCabecalho(cabecalho)}
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
