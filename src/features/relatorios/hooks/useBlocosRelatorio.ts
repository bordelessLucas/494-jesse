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
  adicionarTexto: () => void
  adicionarImagem: () => void
  remover: (indice: number) => void
  moverParaCima: (indice: number) => void
  moverParaBaixo: (indice: number) => void
  atualizarTexto: (indice: number, content: string) => void
  atualizarImagem: (indice: number, atualizacao: AtualizacaoImagem) => void
}

const BLOCO_TEXTO_VAZIO: RelatorioAtividadesBloco = {
  type: 'text',
  content: '',
}

const BLOCO_IMAGEM_VAZIO: RelatorioAtividadesBloco = {
  type: 'image',
  url: '',
  caption: '',
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
  const [blocos, setBlocos] =
    useState<RelatorioAtividadesBloco[]>(blocosIniciais)

  const adicionarTexto = useCallback(() => {
    setBlocos((atuais) => [...atuais, { ...BLOCO_TEXTO_VAZIO }])
  }, [])

  const adicionarImagem = useCallback(() => {
    setBlocos((atuais) => [...atuais, { ...BLOCO_IMAGEM_VAZIO }])
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

  return {
    blocos,
    adicionarTexto,
    adicionarImagem,
    remover,
    moverParaCima,
    moverParaBaixo,
    atualizarTexto,
    atualizarImagem,
  }
}
