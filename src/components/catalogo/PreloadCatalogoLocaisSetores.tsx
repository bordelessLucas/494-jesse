import { useCatalogoLocaisSetores } from '../../hooks/useCatalogoLocaisSetores'

/** Pré-carrega locais/setores no layout autenticado para seletores abrirem sem latência. */
export function PreloadCatalogoLocaisSetores() {
  useCatalogoLocaisSetores()
  return null
}
