export type StatusConversaSuporte = 'aberta' | 'aguardando_usuario' | 'resolvida'

export type AutorTipoSuporte = 'usuario' | 'analista' | 'sistema'

export type TipoFluxoSuporte = 'menu' | 'resposta_final' | 'abrir_ticket'

export type TelaSuporte = 'inicio' | 'privacidade' | 'chat' | 'historico'

export interface SuporteConversa {
  id: string
  tenantUserId: string
  usuarioId: string
  status: StatusConversaSuporte
  fluxoAtualId: string | null
  criadaEm: string
  atualizadaEm: string
}

export interface SuporteMensagem {
  id: string
  conversaId: string
  autorTipo: AutorTipoSuporte
  autorId: string | null
  texto: string
  fluxoOpcaoId: string | null
  criadaEm: string
}

export interface SuporteFluxo {
  id: string
  titulo: string
  mensagem: string
  tipo: TipoFluxoSuporte
  slug: string | null
}

export interface SuporteFluxoOpcao {
  id: string
  fluxoId: string
  label: string
  proximoFluxoId: string | null
  ordem: number
}

export interface SuporteArtigo {
  id: string
  tenantUserId: string | null
  titulo: string
  palavrasChave: string[]
  conteudo: string
  ativo: boolean
}

export interface SuporteConversaResumo extends SuporteConversa {
  ultimaMensagem?: string
  nomeUsuario?: string
}

export interface SuporteFluxoComOpcoes extends SuporteFluxo {
  opcoes: SuporteFluxoOpcao[]
}

/** Resultado do motor de regras após interação do usuário. */
export interface ResultadoInteracaoSuporte {
  conversa: SuporteConversa
  mensagensNovas: SuporteMensagem[]
  opcoesAtuais: SuporteFluxoOpcao[]
  encaminhouParaHumano: boolean
  encerrouFluxo: boolean
}
