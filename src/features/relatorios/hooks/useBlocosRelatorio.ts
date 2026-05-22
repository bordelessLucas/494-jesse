import { useCallback, useState } from 'react'

import type { RelatorioAtividadesBloco } from '../types'

/** Atualização parcial possível em um bloco de imagem. */
export type AtualizacaoImagem = Partial<{
  url: string
  caption: string
}>

/**
 * API pública do hook. Modelada para ser passada inteira (via spread) ao
 * componente `EditorBlocosRelatorio`, mantendo a página como orquestradora
 * sem precisar repassar callback por callback.
 */
export type BlocosRelatorioOperacoes = {
  blocos: RelatorioAtividadesBloco[]
  /** Devolve `clientKey` do novo bloco (para focar o campo no editor). */
  adicionarTexto: () => string
  /** Bloco imagem vazio (URL pode ser preenchida no cartão ou via upload). Devolve `clientKey`. */
  adicionarImagem: () => string
  /** Insere uma imagem já com URL pública (ex.: após upload). Devolve `clientKey`. */
  adicionarImagemComUrl: (url: string, caption?: string) => string
  remover: (indice: number) => void
  moverParaCima: (indice: number) => void
  moverParaBaixo: (indice: number) => void
  atualizarTexto: (indice: number, content: string) => void
  atualizarImagem: (indice: number, atualizacao: AtualizacaoImagem) => void
  atualizarImagemPorChave: (clientKey: string, atualizacao: AtualizacaoImagem) => void
}

function criarBlocoTextoVazio(): Extract<RelatorioAtividadesBloco, { type: 'text' }> {
  return {
    type: 'text',
    clientKey: crypto.randomUUID(),
    content: '',
  }
}

function criarBlocoImagemVazio(): Extract<RelatorioAtividadesBloco, { type: 'image' }> {
  return {
    type: 'image',
    clientKey: crypto.randomUUID(),
    url: '',
    caption: '',
  }
}

function trocarPosicoes<T>(lista: T[], a: number, b: number): T[] {
  const copia = lista.slice()
  const aux = copia[a]
  copia[a] = copia[b]
  copia[b] = aux
  return copia
}

/**
 * Estado e operações imutáveis para uma sequência de blocos do relatório
 * descritivo (SCIRAS).
 *
 * Todas as mutações produzem um novo array (`slice`/`map`/`filter`/spread)
 * para preservar a integridade referencial exigida pelo React e por testes
 * baseados em igualdade rasa.
 */
export function useBlocosRelatorio(
  blocosIniciais: RelatorioAtividadesBloco[],
): BlocosRelatorioOperacoes {
  const [blocos, setBlocos] = useState<RelatorioAtividadesBloco[]>(() =>
    blocosIniciais.map((b) => ({ ...b })),
  )

  const adicionarTexto = useCallback((): string => {
    const novo = criarBlocoTextoVazio()
    setBlocos((atuais) => [...atuais, novo])
    return novo.clientKey
  }, [])

  const adicionarImagem = useCallback((): string => {
    const novo = criarBlocoImagemVazio()
    setBlocos((atuais) => [...atuais, novo])
    return novo.clientKey
  }, [])

  const adicionarImagemComUrl = useCallback((url: string, caption = ''): string => {
    const novo: Extract<RelatorioAtividadesBloco, { type: 'image' }> = {
      type: 'image',
      clientKey: crypto.randomUUID(),
      url,
      ...(caption.trim() ? { caption: caption.trim() } : {}),
    }
    setBlocos((atuais) => [...atuais, novo])
    return novo.clientKey
  }, [])

  const remover = useCallback((indice: number) => {
    setBlocos((atuais) => atuais.filter((_, posicao) => posicao !== indice))
  }, [])

  const moverParaCima = useCallback((indice: number) => {
    setBlocos((atuais) => {
      const indiceInvalido = indice <= 0 || indice >= atuais.length
      if (indiceInvalido) return atuais
      return trocarPosicoes(atuais, indice, indice - 1)
    })
  }, [])

  const moverParaBaixo = useCallback((indice: number) => {
    setBlocos((atuais) => {
      const indiceInvalido = indice < 0 || indice >= atuais.length - 1
      if (indiceInvalido) return atuais
      return trocarPosicoes(atuais, indice, indice + 1)
    })
  }, [])

  const atualizarTexto = useCallback((indice: number, content: string) => {
    setBlocos((atuais) =>
      atuais.map((bloco, posicao) => {
        if (posicao !== indice) return bloco
        if (bloco.type !== 'text') return bloco
        return { ...bloco, content }
      }),
    )
  }, [])

  const atualizarImagem = useCallback(
    (indice: number, atualizacao: AtualizacaoImagem) => {
      setBlocos((atuais) =>
        atuais.map((bloco, posicao) => {
          if (posicao !== indice) return bloco
          if (bloco.type !== 'image') return bloco
          return { ...bloco, ...atualizacao }
        }),
      )
    },
    [],
  )

  const atualizarImagemPorChave = useCallback(
    (clientKey: string, atualizacao: AtualizacaoImagem) => {
      setBlocos((atuais) =>
        atuais.map((bloco) => {
          if (bloco.clientKey !== clientKey || bloco.type !== 'image') return bloco
          return { ...bloco, ...atualizacao }
        }),
      )
    },
    [],
  )

  return {
    blocos,
    adicionarTexto,
    adicionarImagem,
    adicionarImagemComUrl,
    remover,
    moverParaCima,
    moverParaBaixo,
    atualizarTexto,
    atualizarImagem,
    atualizarImagemPorChave,
  }
}
