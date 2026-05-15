export interface ProfissionalEndereco {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface ProfissionalDadosBancarios {
  banco: string
  agencia: string
  conta: string
  tipoConta: string
  pix: string
}

/** Conta bancária nova (seção 2 — aba Dados bancários). */
export interface ProfissionalContaBancaria {
  id: string
  tipo: string
  tornarPrincipal: 'Sim' | 'Não'
}

export interface ProfissionalGrupoParticipacao {
  id: string
  nome: string
  local: string
}

export interface ProfissionalAfastamento {
  id: string
  inicio: string
  fim: string
  tipo: string
  comentario: string
}

export interface ProfissionalAnexo {
  nome: string
  tipo: string
  enviadoEm: string
}

/** Período de contratação (aba Contratação). */
export interface ProfissionalPeriodoContratacao {
  id: string
  tipo: string
  inicio: string
  fim: string
  comentario: string
}

export interface ProfissionalDetalhes {
  fotoUrl: string | null
  siglaConselho: string
  email: string
  cpf: string
  telefone: string
  celular: string
  rg: string
  orgaoEmissor: string
  dataNascimento: string
  sexo: string
  nomeMae: string
  especialidade: string
  endereco: ProfissionalEndereco
  grupos: ProfissionalGrupoParticipacao[]
  dadosBancarios: ProfissionalDadosBancarios
  /** Contas adicionadas na seção «Contas bancárias». */
  contasBancarias: ProfissionalContaBancaria[]
  resumoFaturamento: string
  /** Faturamento / dados de PJ (aba Faturamento). */
  faturamentoCnpj?: string
  faturamentoRazaoSocial?: string
  faturamentoNomeFantasia?: string
  contratacao: {
    regime: string
    dataAdmissao: string
    cargaHorariaSemanal: string
    numeroContrato: string
  }
  /** Períodos de contratação exibidos na aba Contratação. */
  periodosContratacao: ProfissionalPeriodoContratacao[]
  afastamentos: ProfissionalAfastamento[]
  habilidades: string[]
  anexos: ProfissionalAnexo[]
  /** Observações internas (coordenação); não exibidas ao profissional. */
  observacaoInterna?: string
}

export interface ProfissionalCompleto {
  id: string
  nome: string
  profissao: string
  registroProfissional: string
  /** Id do local principal em `locais`, quando vinculado no Supabase. */
  localId?: string | null
  localNome: string
  setores: string[]
  /** Ids em `setores` vindos de `profissional_setores` (aba Grupos). */
  setorIdsVinculados?: string[]
  detalhes: ProfissionalDetalhes
}
