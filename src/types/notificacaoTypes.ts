export type TipoNotificacao = 'nova_escala' | 'alteracao_escala' | 'aviso'

export type Notificacao = {
  id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  lida: boolean
  criadoEm: string
  linkAcao?: string
}

