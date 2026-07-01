import { EyeOff } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { useContaMembro } from '../../hooks/useContaMembro'

const PADROES_ACAO_ESCRITA =
  /\b(salvar|guardar|atualizar|excluir|remover|deletar|apagar|criar|adicionar|confirmar|aprovar|recusar|publicar|enviar|inserir|editar)\b/i

function rotuloIndicaEscrita(elemento: Element): boolean {
  const texto = [
    elemento.textContent ?? '',
    elemento.getAttribute('aria-label') ?? '',
    elemento.getAttribute('title') ?? '',
  ].join(' ')
  return PADROES_ACAO_ESCRITA.test(texto)
}

function elementoAcaoEscrita(alvo: EventTarget | null): HTMLElement | null {
  if (!(alvo instanceof Element)) return null
  const candidato = alvo.closest(
    'button, [role="button"], input[type="submit"], a[data-acao-escrita="true"]',
  )
  if (!candidato || !(candidato instanceof HTMLElement)) return null
  if (candidato.dataset.permitirEscrita === 'true') return null
  if (candidato.closest('[data-permitir-escrita="true"]')) return null
  if (rotuloIndicaEscrita(candidato)) return candidato
  return null
}

/** Banner + bloqueio global de ações de escrita para perfil visualizador. */
export function ModoSomenteLeituraShell({ children }: { children: ReactNode }) {
  const { isSomenteLeitura } = useContaMembro()

  useEffect(() => {
    document.body.dataset.somenteLeitura = isSomenteLeitura ? '1' : ''
    return () => {
      document.body.dataset.somenteLeitura = ''
    }
  }, [isSomenteLeitura])

  useEffect(() => {
    if (!isSomenteLeitura) return

    function interceptar(evento: Event) {
      const alvo = elementoAcaoEscrita(evento.target)
      if (!alvo) return
      evento.preventDefault()
      evento.stopPropagation()
    }

    document.addEventListener('click', interceptar, true)
    document.addEventListener('submit', interceptar, true)
    return () => {
      document.removeEventListener('click', interceptar, true)
      document.removeEventListener('submit', interceptar, true)
    }
  }, [isSomenteLeitura])

  if (!isSomenteLeitura) return children

  return (
    <>
      <div
        role="status"
        className="mb-4 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800"
      >
        <EyeOff className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
        <p>
          <strong>Modo somente leitura.</strong> O seu perfil de visualizador permite consultar
          dados, mas não executar alterações na plataforma.
        </p>
      </div>
      <div className="somente-leitura-conteudo">{children}</div>
    </>
  )
}

/** Oculta ações de escrita quando o utilizador é visualizador. */
export function AcaoEscrita({ children }: { children: ReactNode }) {
  const { isSomenteLeitura } = useContaMembro()
  if (isSomenteLeitura) return null
  return children
}
