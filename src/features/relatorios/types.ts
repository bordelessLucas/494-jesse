/**
 * Contratos do domínio de relatórios.
 *
 * São tipos puros, sem dependência de React/UI, para que possam ser
 * compartilhados entre a camada de dados (Repository/Service) e os templates
 * de impressão sem acoplamento.
 */

/** Dados institucionais que compõem o cabeçalho contratual padrão. */
export type CabecalhoContratualData = {
  /** URL pública do logotipo a ser injetado no topo. `null` esconde a área. */
  logoUrl: string | null
  contratoGestao: string
  contratoPrestacao: string
  local: string
  servico: string
  tomador: string
  empresa: string
  cnpj: string
  coordenador: string
  /** Competência da referência, ex.: "MAIO/2026" ou "05/2026". */
  competencia: string
}

/** Rótulo livre do turno na grade de frequência, ex.: "07-13H". */
export type TurnoFrequencia = string

/** Lançamento individual de profissional escalado em um dia/turno. */
export type EscalaFrequenciaSetorEntrada = {
  /** 1 a 31. */
  dia: number
  turno: TurnoFrequencia
  profissionalNome: string | null
}

/** Linha detalhada da lista de frequência (dados reais da escala). */
export type LinhaFrequenciaDetalhada = {
  profissionalNome: string
  crm: string
  data: string
  horaEntrada: string
  horaSaida: string
  /** Entrada e saída formatadas num único campo. */
  horario: string
  setor: string
}

/** Indicadores SCIRAS calculados a partir da escala realizada. */
export type IndicadoresScirasEscala = {
  totalHorasMedicasUti: number
  totalPlantoesRealizados: number
  totalPlantoesRealizadosUti: number
  horasPorSetor: { setor: string; horas: number; plantoes: number }[]
}

/** Lançamento de assinatura de coordenador em um dia. */
export type EscalaCoordenacaoEntrada = {
  dia: number
  coordenadorNome: string | null
}

/**
 * Bloco de conteúdo do relatório descritivo (SCIRAS).
 *
 * Modelado como união discriminada pelo campo `type`, suportando dois
 * tipos de bloco que o coordenador pode inserir no formulário:
 *
 *   - `text`:  parágrafo de texto livre justificado.
 *   - `image`: figura centralizada com legenda opcional (ex.: prints
 *              de planilhas, fotos de boletins, comprovantes etc.).
 */
/** Chave estável para listas React (evita estado trocado ao reordenizar blocos). */
type ChaveBloco = { clientKey: string }

export type RelatorioAtividadesBloco =
  | ({ type: 'text'; content: string } & ChaveBloco)
  | ({ type: 'image'; url: string; caption?: string } & ChaveBloco)

/** Dados que aparecem no rodapé de assinatura do relatório descritivo. */
export type AssinaturaResponsavel = {
  nomeProfissional: string
  /** Conselho e RQE, ex.: "CRM/SP 123456 — RQE 987". */
  crmRqe: string
  nomeEmpresa: string
  /** CNPJ já formatado (ex.: "00.000.000/0001-00"). */
  cnpjEmpresa: string
  /** Nome no certificado ICP-Brasil (CN), quando distinto do cadastro. */
  titularCertificado?: string
  /** Validade do certificado digital (ISO ou texto formatado). */
  certificadoValidoAte?: string
  /** Data/hora da assinatura jurídica aplicada ao PDF. */
  dataHoraAssinatura?: string
}

/** Default usado quando o consumidor não passa explicitamente. */
export const DEFAULT_TOTAL_DIAS_MES = 31
