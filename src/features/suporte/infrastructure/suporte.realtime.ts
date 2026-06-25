import { supabase } from '../../../lib/supabase'
import { mapConversa, mapMensagem } from './suporte.db'
import type { SuporteConversa, SuporteMensagem } from '../domain/suporte.types'

type MensagemCallback = (mensagem: SuporteMensagem) => void
type ConversaCallback = (conversa: SuporteConversa) => void

function idCanal(prefixo: string, escopo: string): string {
  // Nome único por inscrição evita colisão no React Strict Mode (remount rápido).
  return `${prefixo}-${escopo}-${crypto.randomUUID()}`
}

export function inscreverMensagensConversa(
  conversaId: string,
  onInsert: MensagemCallback,
): () => void {
  const channel = supabase
    .channel(idCanal('suporte-msgs', conversaId))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suporte_mensagens',
        filter: `conversa_id=eq.${conversaId}`,
      },
      (payload) => {
        const row = payload.new as Parameters<typeof mapMensagem>[0]
        onInsert(mapMensagem(row))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function inscreverConversasInbox(
  tenantUserId: string,
  onChange: ConversaCallback,
): () => void {
  const channel = supabase
    .channel(idCanal('suporte-inbox', tenantUserId))
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'suporte_conversas',
        filter: `tenant_user_id=eq.${tenantUserId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as Parameters<typeof mapConversa>[0]
        if (row?.id) onChange(mapConversa(row))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
