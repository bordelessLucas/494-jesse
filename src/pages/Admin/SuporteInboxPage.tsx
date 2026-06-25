import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Loader2, MessageCircle, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { BlocoMensagemSuporte } from '../../features/suporte/components/ChatWidget/suporteUi'
import type { StatusConversaSuporte } from '../../features/suporte/domain/suporte.types'
import { useSuporteInbox } from '../../features/suporte/hooks/useSuporteInbox'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'
import { useTenantUserId } from '../../hooks/useTenantUserId'
import { cn } from '../../lib/cn'

const FILTROS: { id: StatusConversaSuporte | 'todas'; label: string }[] = [
  { id: 'aberta', label: 'Aguardando analista' },
  { id: 'aguardando_usuario', label: 'Em andamento' },
  { id: 'resolvida', label: 'Resolvidas' },
  { id: 'todas', label: 'Todas' },
]

const ROTULO_STATUS: Record<StatusConversaSuporte, string> = {
  aberta: 'Aguardando analista',
  aguardando_usuario: 'Em andamento',
  resolvida: 'Resolvida',
}

export function SuporteInboxPage() {
  const [searchParams] = useSearchParams()
  const conversaUrl = searchParams.get('conversa')
  const { tenantUserId, isLoading: loadingTenant } = useTenantUserId()
  const { user } = useSupabaseUser()
  const [rascunho, setRascunho] = useState('')
  const listaRef = useRef<HTMLDivElement>(null)

  const inbox = useSuporteInbox(tenantUserId, user?.id, conversaUrl)

  useEffect(() => {
    if (conversaUrl) inbox.setSelecionadaId(conversaUrl)
  }, [conversaUrl, inbox.setSelecionadaId])

  function handleResponder() {
    const t = rascunho.trim()
    if (!t) return
    setRascunho('')
    void inbox.responder(t)
  }

  if (loadingTenant) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        Carregando…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Atendimento
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inbox de Suporte</h1>
          <p className="mt-1 text-sm text-slate-600">
            Conversas do seu tenant — responda e marque como resolvida quando concluir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void inbox.recarregarLista()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Atualizar
        </button>
      </header>

      {inbox.erro ? (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
          {inbox.erro}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => inbox.setFiltroStatus(f.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              inbox.filtroStatus === f.id
                ? 'bg-primary-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-[28rem] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            Conversas
          </div>
          {inbox.carregandoLista ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : inbox.conversas.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">Nenhuma conversa.</p>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
              {inbox.conversas.map((c) => {
                const ativa = inbox.selecionadaId === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => inbox.setSelecionadaId(c.id)}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors',
                        ativa ? 'bg-primary-50' : 'hover:bg-slate-50',
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {ROTULO_STATUS[c.status]}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {c.ultimaMensagem ?? 'Sem mensagens'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {format(new Date(c.atualizadaEm), "d MMM HH:mm", { locale: ptBR })}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[28rem] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          {!inbox.selecionadaId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
              <MessageCircle className="mb-3 h-12 w-12 text-slate-300" aria-hidden />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {inbox.conversaSelecionada
                      ? ROTULO_STATUS[inbox.conversaSelecionada.status]
                      : 'Conversa'}
                  </p>
                  <p className="text-xs text-slate-500">ID: {inbox.selecionadaId.slice(0, 8)}…</p>
                </div>
                {inbox.conversaSelecionada?.status !== 'resolvida' ? (
                  <button
                    type="button"
                    disabled={inbox.enviando}
                    onClick={() => void inbox.resolver()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-success-200 bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-800 hover:bg-success-100 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Marcar como resolvida
                  </button>
                ) : null}
              </div>

              <div
                ref={listaRef}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
                aria-live="polite"
              >
                {inbox.carregandoChat ? (
                  <div className="flex justify-center py-8 text-sm text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando mensagens…
                  </div>
                ) : (
                  inbox.mensagens.map((m) => (
                    <BlocoMensagemSuporte
                      key={m.id}
                      de={m.autorTipo === 'usuario' ? 'usuario' : 'outro'}
                      texto={m.texto}
                    />
                  ))
                )}
              </div>

              {inbox.conversaSelecionada?.status !== 'resolvida' ? (
                <div className="border-t border-slate-100 p-3">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={rascunho}
                      disabled={inbox.enviando}
                      placeholder="Resposta do analista…"
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleResponder()
                        }
                      }}
                      className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      disabled={inbox.enviando || !rascunho.trim()}
                      onClick={handleResponder}
                      className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">
                  Conversa encerrada.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
