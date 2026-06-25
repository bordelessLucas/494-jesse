import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'

import type { SuporteConversa } from '../../domain/suporte.types'
import { CabecalhoChat } from './ChatMensagens'
import { RodapeNavegacao } from './ChatInicio'

const ROTULO_STATUS: Record<SuporteConversa['status'], string> = {
  aberta: 'Aguardando analista',
  aguardando_usuario: 'Em andamento',
  resolvida: 'Resolvida',
}

type ChatHistoricoProps = {
  historico: SuporteConversa[]
  onVoltar: () => void
  onFechar: () => void
  onAbrirConversa: (id: string) => void
}

export function ChatHistorico({
  historico,
  onVoltar,
  onFechar,
  onAbrirConversa,
}: ChatHistoricoProps) {
  return (
    <>
      <CabecalhoChat aoVoltar={onVoltar} aoFechar={onFechar} mostrarMenu={false} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
        {historico.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <MessageCircle className="mb-3 h-12 w-12 text-slate-300" aria-hidden />
            <p className="text-sm font-medium text-slate-700">Nenhuma conversa anterior</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 p-2">
            {historico.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onAbrirConversa(c.id)}
                  className="w-full rounded-lg px-3 py-3 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {ROTULO_STATUS[c.status]}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {format(new Date(c.atualizadaEm), "d MMM yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <RodapeNavegacao telaAtiva="mensagens" onHome={onVoltar} onMensagens={() => {}} />
    </>
  )
}
