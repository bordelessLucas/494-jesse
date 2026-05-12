import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Printer } from 'lucide-react'

import { EditorBlocosRelatorio } from '../../features/relatorios/components/EditorBlocosRelatorio'
import { useBlocosRelatorio } from '../../features/relatorios/hooks/useBlocosRelatorio'
import { FrequenciaCoordenacaoTemplate } from '../../features/relatorios/templates/FrequenciaCoordenacaoTemplate'
import { FrequenciaSetorTemplate } from '../../features/relatorios/templates/FrequenciaSetorTemplate'
import { RelatorioAtividadesTemplate } from '../../features/relatorios/templates/RelatorioAtividadesTemplate'
import type {
  AssinaturaResponsavel,
  CabecalhoContratualData,
  EscalaCoordenacaoEntrada,
  EscalaFrequenciaSetorEntrada,
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

type LocalContratoId = 'hospital_estadual_xyz' | 'hospital_municipal_abc'

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

/* ============================================================
 * Opções estáticas (substituir por dados do backend ao integrar)
 * ============================================================ */

const TIPOS_RELATORIO: OpcaoSelect<TipoRelatorio>[] = [
  { id: 'FrequenciaSetor', label: 'Lista de Frequência — UTI Pediátrica' },
  {
    id: 'FrequenciaCoordenacao',
    label: 'Lista de Frequência — SCIH (Coordenação)',
  },
  { id: 'RelatorioSCIRAS', label: 'Relatório de Atividades — SCIRAS' },
]

const LOCAIS_OPCOES: OpcaoSelect<LocalContratoId>[] = [
  { id: 'hospital_estadual_xyz', label: 'Hospital Estadual XYZ' },
  { id: 'hospital_municipal_abc', label: 'Hospital Municipal ABC' },
]

const LOCAIS_DETALHE: Record<LocalContratoId, LocalContratoDetalhe> = {
  hospital_estadual_xyz: {
    nomeLocal: 'Hospital Estadual XYZ',
    servico: 'UTI Pediátrica',
    tomador: 'Secretaria de Estado da Saúde',
    contratoGestao: 'CG-001/2024',
    contratoPrestacao: 'CPS-045/2024',
    empresa: 'PlantãoCheck Serviços Médicos LTDA',
    cnpj: '00.000.000/0001-00',
    coordenador: 'Dr. Fulano de Tal',
    turnosFrequencia: ['07-13H', '13-19H', '19-07H'],
  },
  hospital_municipal_abc: {
    nomeLocal: 'Hospital Municipal ABC',
    servico: 'UTI Pediátrica',
    tomador: 'Município ABC',
    contratoGestao: 'CG-117/2024',
    contratoPrestacao: 'CPS-209/2024',
    empresa: 'PlantãoCheck Serviços Médicos LTDA',
    cnpj: '00.000.000/0001-00',
    coordenador: 'Dra. Beltrana de Almeida',
    turnosFrequencia: ['07-19H', '19-07H'],
  },
}

/* ============================================================
 * Helpers de domínio (mock até a integração com o backend)
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

/** Mock de escala — preencherá dias iniciais para tornar o preview ilustrativo. */
function montarEscalaSetorMock(
  turnos: TurnoFrequencia[],
): EscalaFrequenciaSetorEntrada[] {
  const profissionaisExemplo = [
    'Dra. Ana Souza',
    'Dr. Bruno Lima',
    'Dra. Clara Mendes',
    'Dr. Diego Ferreira',
  ]
  const entradas: EscalaFrequenciaSetorEntrada[] = []
  for (let dia = 1; dia <= 5; dia += 1) {
    turnos.forEach((turno, indice) => {
      const profissionalNome =
        profissionaisExemplo[(dia + indice) % profissionaisExemplo.length]
      entradas.push({ dia, turno, profissionalNome })
    })
  }
  return entradas
}

function montarEscalaCoordenacaoMock(): EscalaCoordenacaoEntrada[] {
  return Array.from({ length: 5 }, (_, indice) => ({
    dia: indice + 1,
    coordenadorNome: 'Dr. Fulano de Tal',
  }))
}

/**
 * Estrutura inicial sugerida pelo cliente para o relatório SCIRAS.
 * Padrão: Imagem (capa) → Texto → Texto → Imagem → Texto (conclusão).
 *
 * O coordenador pode editar, reordenar, remover ou adicionar blocos
 * livremente pelo EditorBlocosRelatorio.
 */
const BLOCOS_INICIAIS_SCIRAS: RelatorioAtividadesBloco[] = [
  {
    type: 'image',
    url: 'https://placehold.co/600x320?text=Capa+Institucional',
    caption: 'Figura 1 — Capa institucional da seção.',
  },
  {
    type: 'text',
    content:
      'Durante o período de referência, a coordenação médica do Serviço de Controle de Infecções Relacionadas à Assistência à Saúde (SCIRAS) conduziu as atividades habituais de monitoramento epidemiológico, suporte assistencial e revisão de protocolos institucionais.',
  },
  {
    type: 'text',
    content:
      'As principais ações incluíram a revisão semanal dos indicadores de infecção hospitalar das unidades críticas, a participação nas reuniões da Comissão de Controle de Infecção Hospitalar (CCIH), a capacitação da equipe assistencial em higienização das mãos e a investigação ativa de surtos suspeitos.',
  },
  {
    type: 'image',
    url: 'https://placehold.co/600x320?text=Indicadores+Consolidados',
    caption:
      'Figura 2 — Dashboard com indicadores consolidados da competência.',
  },
  {
    type: 'text',
    content:
      'Não foram identificados eventos sentinelas durante a competência. Permanecem em vigor as recomendações descritas no protocolo institucional vigente.',
  },
]

function montarAssinaturaSCIRASMock(
  detalhe: LocalContratoDetalhe,
): AssinaturaResponsavel {
  return {
    nomeProfissional: detalhe.coordenador,
    crmRqe: 'CRM/SP 123456 — RQE 7890',
    nomeEmpresa: detalhe.empresa,
    cnpjEmpresa: detalhe.cnpj,
  }
}

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
  const { logoUrl } = useThemeBranding()
  const competencias = useMemo(() => gerarCompetencias(), [])

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>(
    TIPOS_RELATORIO[0].id,
  )
  const [competenciaId, setCompetenciaId] = useState<string>(
    competencias[0]?.id ?? '',
  )
  const [localId, setLocalId] = useState<LocalContratoId>(LOCAIS_OPCOES[0].id)

  const blocosRelatorio = useBlocosRelatorio(BLOCOS_INICIAIS_SCIRAS)

  const competencia = useMemo(
    () =>
      competencias.find((opcao) => opcao.id === competenciaId) ??
      competencias[0],
    [competencias, competenciaId],
  )

  const detalhe = LOCAIS_DETALHE[localId]
  const cabecalho = useMemo(
    () => montarCabecalho(detalhe, competencia?.cabecalho ?? '', logoUrl),
    [detalhe, competencia, logoUrl],
  )

  const totalDias = useMemo(
    () => (competencia ? obterDiasNoMes(competencia.id) : 31),
    [competencia],
  )

  const handleImprimir = () => {
    window.print()
  }

  const mostrarEditorBlocos = tipoSelecionado === 'RelatorioSCIRAS'

  return (
    <div className="-m-8 flex min-h-screen print:m-0 print:block print:min-h-0">
      <PainelConfiguracao
        tipoSelecionado={tipoSelecionado}
        onChangeTipoSelecionado={setTipoSelecionado}
        competenciaId={competenciaId}
        onChangeCompetencia={setCompetenciaId}
        competencias={competencias}
        localId={localId}
        onChangeLocal={setLocalId}
        onImprimir={handleImprimir}
      >
        {mostrarEditorBlocos ? (
          <EditorBlocosRelatorio {...blocosRelatorio} />
        ) : null}
      </PainelConfiguracao>

      <PainelPreview>
        <PreviewRelatorioSelecionado
          tipoSelecionado={tipoSelecionado}
          cabecalho={cabecalho}
          competenciaCabecalho={competencia?.cabecalho ?? ''}
          detalhe={detalhe}
          totalDias={totalDias}
          blocosSCIRAS={blocosRelatorio.blocos}
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
  onImprimir: () => void
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
  onImprimir,
  children,
}: PainelConfiguracaoProps) {
  return (
    <aside className="no-print flex h-screen w-full max-w-md shrink-0 flex-col border-r border-slate-200 bg-white print:hidden lg:w-1/3">
      <div className="shrink-0 p-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Emissão de Relatórios
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure o documento e visualize o preview ao lado antes de imprimir.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-4 px-6 pb-4">
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
          opcoes={LOCAIS_OPCOES}
        />
      </div>

      {children ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 px-6 py-4">
          {children}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="shrink-0 border-t border-slate-100 p-6">
        <button
          type="button"
          onClick={onImprimir}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          <Printer className="h-5 w-5" aria-hidden />
          Imprimir / Salvar PDF
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
  competenciaCabecalho: string
  detalhe: LocalContratoDetalhe
  totalDias: number
  blocosSCIRAS: RelatorioAtividadesBloco[]
}

function PreviewRelatorioSelecionado({
  tipoSelecionado,
  cabecalho,
  competenciaCabecalho,
  detalhe,
  totalDias,
  blocosSCIRAS,
}: PreviewRelatorioSelecionadoProps) {
  switch (tipoSelecionado) {
    case 'FrequenciaSetor':
      return (
        <FrequenciaSetorTemplate
          cabecalho={cabecalho}
          turnos={detalhe.turnosFrequencia}
          escala={montarEscalaSetorMock(detalhe.turnosFrequencia)}
          totalDias={totalDias}
        />
      )

    case 'FrequenciaCoordenacao':
      return (
        <FrequenciaCoordenacaoTemplate
          cabecalho={cabecalho}
          escala={montarEscalaCoordenacaoMock()}
          totalDias={totalDias}
        />
      )

    case 'RelatorioSCIRAS':
      return (
        <RelatorioAtividadesTemplate
          cabecalho={cabecalho}
          dataEmissao={formatarDataEmissao(competenciaCabecalho)}
          conteudo={blocosSCIRAS}
          assinatura={montarAssinaturaSCIRASMock(detalhe)}
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
