import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  Home,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
  ThumbsUp,
  X,
} from 'lucide-react'

import { cn } from '../../lib/cn'

const AZUL_CHAT = '#1e88e5'

function TextoEstiloAjudaBot({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {partes.map((parte, idx) => {
        if (
          parte.startsWith('**') &&
          parte.endsWith('**') &&
          parte.length >= 4
        ) {
          return <strong key={`s-${idx}`}>{parte.slice(2, -2)}</strong>
        }
        if (parte.startsWith('*') && parte.endsWith('*') && parte.length >= 2) {
          return <em key={`e-${idx}`}>{parte.slice(1, -1)}</em>
        }
        return <span key={`t-${idx}-${parte.slice(0, 12)}`}>{parte}</span>
      })}
    </>
  )
}

type TelaSuporte = 'inicio' | 'privacidade' | 'chat' | 'historico'

export interface MensagemSuporteMock {
  id: string
  de: 'bot' | 'usuario'
  texto: string
  opcoes?: { id: string; texto: string }[]
}

const RESPOSTAS_MOCK_POR_PALAVRA_CHAVE: { match: RegExp; resposta: string }[] = [
  {
    match: /plant(ão|oes)|escala/i,
    resposta:
      'Para escalas você pode usar o menu **Escalas** (mensal, semanal ou modelos). Se precisar de troca ou conflito, abra um chamado pelo financeiro.',
  },
  {
    match: /financeir|repasse|pagamento/i,
    resposta:
      'Extratos e repasses ficam em **Financeiro**. Se algo não conferir, envie competência + print da tela — um analista retorna em até 1 dia útil.',
  },
  {
    match: /cadastr|usuario|profissional|usuário/i,
    resposta:
      'Cadastros de profissionais e locais estão em **Usuários**. Campos obrigatórios: nome, CRM/COREN, e-mail institucional e vínculo com local/setor.',
  },
  {
    match: /analista|humano|pessoa/i,
    resposta:
      'Encaminhei seu pedido para a fila de analistas. **Protocolo mock:** PC-8492 — tempo médio de retorno na próxima janela útil.',
  },
]

function respostaMockParaTexto(texto: string): string {
  const t = texto.trim()
  if (!t) return 'Posso ajudar com outra dúvida? Você também pode usar os atalhos abaixo.'
  for (const { match, resposta } of RESPOSTAS_MOCK_POR_PALAVRA_CHAVE) {
    if (match.test(t)) return resposta
  }
  return (
    'Obrigado pela mensagem! ' +
    'Enquanto não há integração real, use as opções rápidas ou reformule com palavras como *escalas*, *financeiro* ou *cadastro*.'
  )
}

const OPCOES_INICIAIS: { id: string; texto: string }[] = [
  { id: 'o1', texto: 'Plantões e escalas' },
  { id: 'o2', texto: 'Financeiro / repasses' },
  { id: 'o3', texto: 'Cadastro de usuários' },
  { id: 'o4', texto: 'Falar com um analista' },
]

function idMsg() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function SuporteChatWidget() {
  const [painelAberto, setPainelAberto] = useState(false)
  const [tela, setTela] = useState<TelaSuporte>('inicio')
  const [mensagens, setMensagens] = useState<MensagemSuporteMock[]>([])
  const [rascunho, setRascunho] = useState('')
  const [aguardandoBot, setAguardandoBot] = useState(false)
  const listaRef = useRef<HTMLDivElement>(null)

  const iniciarChat = useCallback(() => {
    setMensagens([
      {
        id: idMsg(),
        de: 'bot',
        texto:
          'Olá! Sou o assistente do **PlantãoCheck**. Escolha um assunto ou escreva sua dúvida — as respostas abaixo são apenas demonstração (mock).',
        opcoes: OPCOES_INICIAIS,
      },
    ])
    setTela('chat')
  }, [])

  useEffect(() => {
    listaRef.current?.scrollTo({
      top: listaRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [mensagens, aguardandoBot])

  function fecharPainel() {
    setPainelAberto(false)
    setTela('inicio')
  }

  function enviarOpcao(texto: string) {
    if (aguardandoBot) return
    setMensagens((prev) => [...prev, { id: idMsg(), de: 'usuario', texto }])
    setAguardandoBot(true)
    window.setTimeout(() => {
      const resposta = respostaMockParaTexto(texto)
      setMensagens((prev) => [
        ...prev,
        {
          id: idMsg(),
          de: 'bot',
          texto: resposta,
          opcoes: OPCOES_INICIAIS.filter((o) => o.texto !== texto).slice(0, 3),
        },
      ])
      setAguardandoBot(false)
    }, 700)
  }

  function enviarTexto() {
    const t = rascunho.trim()
    if (!t || aguardandoBot) return
    setRascunho('')
    setMensagens((prev) => [...prev, { id: idMsg(), de: 'usuario', texto: t }])
    setAguardandoBot(true)
    window.setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        {
          id: idMsg(),
          de: 'bot',
          texto: respostaMockParaTexto(t),
          opcoes: OPCOES_INICIAIS,
        },
      ])
      setAguardandoBot(false)
    }, 900)
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[50] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {painelAberto ? (
        <div
          className="pointer-events-auto flex h-[min(520px,78dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          role="dialog"
          aria-label="Suporte PlantãoCheck"
        >
          {tela === 'inicio' ? (
            <>
              <div
                className="relative flex flex-1 flex-col px-4 pb-5 pt-3"
                style={{ backgroundColor: AZUL_CHAT }}
              >
                <button
                  type="button"
                  onClick={fecharPainel}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-white/90 hover:bg-white/10"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mt-8 flex items-start gap-2 pr-8 text-sm leading-snug text-white">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  <p>
                    Estamos <strong className="font-semibold">Online</strong>, diga algo para iniciar
                    uma conversa com um de nossos analistas!
                  </p>
                </div>
                <div className="mt-6 flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => setTela('privacidade')}
                    className="w-full rounded-xl bg-white p-4 text-left shadow-md transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">Novo atendimento</p>
                        <p className="mt-1 text-sm text-slate-500">Em que podemos te ajudar?</p>
                      </div>
                      <span
                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: AZUL_CHAT }}
                        aria-hidden
                      >
                        <Send className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                </div>
              </div>
              <RodapeNavegacao
                telaAtiva="home"
                onHome={() => setTela('inicio')}
                onMensagens={() => setTela('historico')}
              />
            </>
          ) : null}

          {tela === 'privacidade' ? (
            <>
              <div
                className="relative flex flex-1 flex-col px-3 pb-4 pt-2"
                style={{ backgroundColor: AZUL_CHAT }}
              >
                <div className="flex items-center justify-between px-1 py-2 text-white">
                  <button
                    type="button"
                    onClick={() => setTela('inicio')}
                    className="rounded-md p-2 hover:bg-white/10"
                    aria-label="Voltar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={fecharPainel}
                    className="rounded-md p-2 hover:bg-white/10"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-1 flex flex-1 flex-col gap-3 overflow-y-auto px-1">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-center text-sm leading-relaxed text-slate-800">
                      Os dados pessoais coletados neste atendimento serão utilizados com a
                      exclusiva finalidade de seu atendimento.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-center text-sm leading-relaxed text-slate-800">
                      Para mais informações, consulte a nossa{' '}
                      <span className="cursor-pointer font-semibold text-[#1e88e5] underline">
                        Política de Privacidade
                      </span>{' '}
                      e os nossos{' '}
                      <span className="cursor-pointer font-semibold text-[#1e88e5] underline">
                        Termos de Uso
                      </span>
                      .
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <button
                      type="button"
                      onClick={iniciarChat}
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white"
                      style={{ backgroundColor: AZUL_CHAT }}
                    >
                      <Send className="h-4 w-4" aria-hidden />
                      Iniciar chat
                    </button>
                  </div>
                </div>
              </div>
              <Marcadagua />
            </>
          ) : null}

          {tela === 'historico' ? (
            <>
              <CabecalhoChat
                aoVoltar={() => setTela('inicio')}
                aoFechar={fecharPainel}
                mostrarMenu={false}
              />
              <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
                <MessageCircle className="mb-3 h-12 w-12 text-slate-300" aria-hidden />
                <p className="text-sm font-medium text-slate-700">Nenhuma conversa anterior</p>
                <p className="mt-2 text-xs text-slate-500">
                  Quando houver histórico real, aparecerá aqui.
                </p>
              </div>
              <RodapeNavegacao
                telaAtiva="mensagens"
                onHome={() => setTela('inicio')}
                onMensagens={() => setTela('historico')}
              />
            </>
          ) : null}

          {tela === 'chat' ? (
            <>
              <CabecalhoChat
                aoVoltar={() => {
                  setMensagens([])
                  setTela('privacidade')
                }}
                aoFechar={fecharPainel}
                mostrarMenu
              />
              <div
                ref={listaRef}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-white px-3 py-3"
              >
                {mensagens.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <div
                      className={cn(
                        'flex w-full',
                        m.de === 'usuario' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                          m.de === 'usuario'
                            ? 'rounded-br-md bg-[#1e88e5] text-white'
                            : 'rounded-bl-md border border-slate-100 bg-slate-50 text-slate-800',
                        )}
                      >
                        <p>
                          <TextoEstiloAjudaBot texto={m.texto} />
                        </p>
                      </div>
                    </div>
                    {m.opcoes && m.opcoes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pl-0.5 pt-1">
                        {m.opcoes.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => enviarOpcao(opt.texto)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-[#1e88e5] hover:bg-blue-50"
                          >
                            {opt.texto}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {aguardandoBot ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                      Digitando...
                    </div>
                  </div>
                ) : null}
              </div>
              <Marcadagua />
              <div className="border-t border-slate-100 bg-white px-2 pb-3 pt-2">
                <div className="flex items-end gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-1.5">
                  <textarea
                    rows={1}
                    placeholder="Digite aqui e aperte enter..."
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        enviarTexto()
                      }
                    }}
                    className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Curtir"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Anexar"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setPainelAberto((abertoAntes) => {
            if (!abertoAntes) setTela('inicio')
            return !abertoAntes
          })
        }}
        className="pointer-events-auto inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium tracking-tight text-white shadow-xl ring-2 ring-black/60 transition hover:bg-slate-900"
        aria-expanded={painelAberto}
        aria-label={painelAberto ? 'Recolher chat de suporte' : 'Abrir chat de suporte'}
      >
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        Online
      </button>
    </div>
  )
}

function CabecalhoChat({
  aoVoltar,
  aoFechar,
  mostrarMenu,
}: {
  aoVoltar: () => void
  aoFechar: () => void
  mostrarMenu: boolean
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-2 py-2 text-white"
      style={{ backgroundColor: AZUL_CHAT }}
    >
      <button
        type="button"
        onClick={aoVoltar}
        className="rounded-md p-2 hover:bg-white/10"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1">
        {mostrarMenu ? (
          <button
            type="button"
            className="rounded-md p-2 hover:bg-white/10"
            aria-label="Menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={aoFechar}
          className="rounded-md p-2 hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function RodapeNavegacao({
  telaAtiva,
  onHome,
  onMensagens,
}: {
  telaAtiva: 'home' | 'mensagens'
  onHome: () => void
  onMensagens: () => void
}) {
  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-6 pb-2 pt-3">
      <div className="flex items-center justify-center gap-14">
        <button
          type="button"
          onClick={onHome}
          className={cn(
            'rounded-lg p-2 transition-colors',
            telaAtiva === 'home' ? 'text-[#1e88e5]' : 'text-slate-400 hover:text-slate-600',
          )}
          aria-label="Início"
        >
          <Home className="h-6 w-6" strokeWidth={telaAtiva === 'home' ? 2.5 : 2} />
        </button>
        <button
          type="button"
          onClick={onMensagens}
          className={cn(
            'rounded-lg p-2 transition-colors',
            telaAtiva === 'mensagens'
              ? 'text-[#1e88e5]'
              : 'text-slate-400 hover:text-slate-600',
          )}
          aria-label="Mensagens"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={telaAtiva === 'mensagens' ? 2.5 : 2} />
        </button>
      </div>
      <Marcadagua />
    </div>
  )
}

function Marcadagua() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] text-slate-400">
      <span className="text-sm" aria-hidden>
        🦜
      </span>
      <span>Demonstração · PlantãoCheck Suporte</span>
    </div>
  )
}
