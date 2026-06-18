import { create } from 'zustand'

import {
  buscarLocaisEscala,
  buscarSetoresEscala,
  type LocalEscalaOpcao,
  type SetorEscalaDb,
} from '../lib/escalas/plantoesDb'

export type LocalComSetoresOpcao = {
  id: string
  nome: string
  setores: { id: string; nome: string }[]
}

const SETORES_VAZIOS: SetorEscalaDb[] = []

function agruparSetoresPorLocal(
  setores: SetorEscalaDb[],
): Record<string, SetorEscalaDb[]> {
  const acc: Record<string, SetorEscalaDb[]> = {}
  for (const setor of setores) {
    const lista = acc[setor.local_id]
    if (lista) {
      lista.push(setor)
    } else {
      acc[setor.local_id] = [setor]
    }
  }
  return acc
}

export function montarArvoreLocaisSetores(
  locais: LocalEscalaOpcao[],
  setoresPorLocalId: Record<string, SetorEscalaDb[]>,
): LocalComSetoresOpcao[] {
  return locais
    .map((local) => ({
      id: local.id,
      nome: local.nome,
      setores: (setoresPorLocalId[local.id] ?? []).map((setor) => ({
        id: setor.id,
        nome: setor.nome,
      })),
    }))
    .filter((local) => local.setores.length > 0)
}

type CatalogoLocaisSetoresState = {
  tenantUserId: string | null
  locais: LocalEscalaOpcao[]
  setores: SetorEscalaDb[]
  setoresPorLocalId: Record<string, SetorEscalaDb[]>
  isLoading: boolean
  error: string | null
  carregadoEm: number | null
  promessaEmVoo: Promise<void> | null
  carregar: (tenantUserId: string, opcoes?: { forcar?: boolean }) => Promise<void>
  invalidar: () => void
  getSetoresDoLocal: (localId: string) => SetorEscalaDb[]
}

export const useCatalogoLocaisSetoresStore = create<CatalogoLocaisSetoresState>(
  (set, get) => ({
    tenantUserId: null,
    locais: [],
    setores: [],
    setoresPorLocalId: {},
    isLoading: false,
    error: null,
    carregadoEm: null,
    promessaEmVoo: null,

    getSetoresDoLocal(localId: string) {
      if (!localId) return SETORES_VAZIOS
      return get().setoresPorLocalId[localId] ?? SETORES_VAZIOS
    },

    invalidar() {
      set({
        tenantUserId: null,
        locais: [],
        setores: [],
        setoresPorLocalId: {},
        carregadoEm: null,
        error: null,
        promessaEmVoo: null,
      })
    },

    async carregar(tenantUserId, opcoes) {
      const estado = get()
      const forcar = opcoes?.forcar ?? false

      if (
        !forcar &&
        estado.tenantUserId === tenantUserId &&
        estado.carregadoEm !== null &&
        !estado.error
      ) {
        return
      }

      if (!forcar && estado.promessaEmVoo) {
        await estado.promessaEmVoo
        if (get().tenantUserId === tenantUserId && get().carregadoEm !== null) {
          return
        }
      }

      const promessa = (async () => {
        set({ isLoading: true, error: null, tenantUserId })

        try {
          const [locais, setores] = await Promise.all([
            buscarLocaisEscala(tenantUserId),
            buscarSetoresEscala(tenantUserId),
          ])

          set({
            tenantUserId,
            locais,
            setores,
            setoresPorLocalId: agruparSetoresPorLocal(setores),
            carregadoEm: Date.now(),
            isLoading: false,
            error: null,
            promessaEmVoo: null,
          })
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Erro ao carregar locais e setores.',
            promessaEmVoo: null,
          })
          throw e
        }
      })()

      set({ promessaEmVoo: promessa })
      await promessa
    },
  }),
)

export function invalidarCatalogoLocaisSetores() {
  useCatalogoLocaisSetoresStore.getState().invalidar()
}

export async function recarregarCatalogoLocaisSetores(tenantUserId: string) {
  await useCatalogoLocaisSetoresStore.getState().carregar(tenantUserId, {
    forcar: true,
  })
}
