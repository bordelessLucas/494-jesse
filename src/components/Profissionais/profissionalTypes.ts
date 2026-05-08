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

export interface ProfissionalGrupoParticipacao {
  id: string
  nome: string
  local: string
}

export interface ProfissionalAfastamento {
  inicio: string
  fim: string
  motivo: string
}

export interface ProfissionalAnexo {
  nome: string
  tipo: string
  enviadoEm: string
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
  resumoFaturamento: string
  contratacao: {
    regime: string
    dataAdmissao: string
    cargaHorariaSemanal: string
    numeroContrato: string
  }
  afastamentos: ProfissionalAfastamento[]
  habilidades: string[]
  anexos: ProfissionalAnexo[]
}

export interface ProfissionalCompleto {
  id: string
  nome: string
  profissao: string
  registroProfissional: string
  localNome: string
  setores: string[]
  detalhes: ProfissionalDetalhes
}
