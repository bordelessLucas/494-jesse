import { LayoutGrid, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../../../lib/cn'
import { aplicarModeloNaEscala } from '../../../lib/escalas/aplicarModeloEscala'
import {
  listarItensModelo,
  listarModelosLocalSetor,
  type EscalaModeloRow,
} from '../../../lib/escalas/modelosEscalaDb'
import type { PlantaoRowDb } from '../../../lib/escalas/plantoesDb'

type SeletorModeloEscalaProps = {
  userId: string | undefined
  localId: string
  setorId: string
  /** Quando true, o seletor fica desabilitado (ex.: «Todos os setores»). */
  setorIndefinido?: boolean
  dataInicioIso: string
  dataFimIso: string
  plantoesExistentes?: PlantaoRowDb[]
  onAplicado: () => void | Promise<void>
  /** Estilo compacto para a barra lateral da escala semanal. */
  compacto?: boolean
  className?: string
}

export function SeletorModeloEscala({
  userId,
  localId,
  setorId,
  setorIndefinido = false,
  dataInicioIso,
  dataFimIso,
  plantoesExistentes = [],
  onAplicado,
  compacto = false,
  className,
}: SeletorModeloEscalaProps) {
  const [modelos, setModelos] = useState<EscalaModeloRow[]>([])
  const [modeloId, setModeloId] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const podeCarregar = Boolean(userId && localId && setorId && !setorIndefinido)

  const carregarModelos = useCallback(async () => {
    if (!podeCarregar || !userId) {
      setModelos([])
      setModeloId('')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarModelosLocalSetor(userId, localId, setorId)
      setModelos(lista)
      setModeloId((cur) =>
        cur && lista.some((m) => m.id === cur) ? cur : (lista[0]?.id ?? ''),
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar modelos.'
      setErro(
        msg.includes('escala_modelos') || msg.includes('schema')
          ? 'Modelos indisponíveis. Aplique a migração de modelos no Supabase.'
          : msg,
      )
      setModelos([])
      setModeloId('')
    } finally {
      setCarregando(false)
    }
  }, [localId, podeCarregar, setorId, userId])

  useEffect(() => {
    void carregarModelos()
  }, [carregarModelos])

  async function aoAplicar() {
    if (!userId || !modeloId) return
    const modelo = modelos.find((m) => m.id === modeloId)
    if (!modelo) return

    const ok = window.confirm(
      `Aplicar o modelo «${modelo.nome}» entre ${dataInicioIso} e ${dataFimIso}?\n\n` +
        'Serão criados plantões nos dias correspondentes do ciclo. Slots já existentes com o mesmo horário serão ignorados.',
    )
    if (!ok) return

    setAplicando(true)
    setErro(null)
    setSucesso(null)
    try {
      const itens = await listarItensModelo(userId, modeloId)
      if (itens.length === 0) {
        setErro('Este modelo não tem plantões definidos.')
        return
      }
      const { inseridos } = await aplicarModeloNaEscala(
        userId,
        modelo,
        itens,
        dataInicioIso,
        dataFimIso,
        plantoesExistentes,
      )
      if (inseridos === 0) {
        setErro('Nenhum plantão novo foi criado (intervalo vazio ou slots já ocupados).')
      } else {
        setSucesso(`${inseridos} plantão(ões) criado(s) a partir do modelo.`)
        await onAplicado()
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao aplicar modelo.')
    } finally {
      setAplicando(false)
    }
  }

  const selectCls = compacto
    ? 'w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400'
    : 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        compacto ? '' : 'rounded-lg border border-slate-200 bg-slate-50/80 p-3',
        className,
      )}
    >
      {!compacto ? (
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary-600" aria-hidden />
          <p className="text-sm font-semibold text-slate-900">Modelo de escala</p>
        </div>
      ) : null}

      {!compacto ? (
        <p className="text-xs text-slate-500">
          Escolha um modelo criado em{' '}
          <Link to="/escalas/modelos" className="font-medium text-primary-700 hover:underline">
            Escalas → Modelos
          </Link>{' '}
          e aplique à {compacto ? 'semana' : 'período'} visível.
        </p>
      ) : null}

      {setorIndefinido || !localId ? (
        <p className="text-xs text-slate-500">
          Selecione um <strong>local</strong> e um <strong>setor específico</strong> para usar
          modelos.
        </p>
      ) : !userId ? (
        <p className="text-xs text-slate-500">Inicie sessão para carregar modelos.</p>
      ) : (
        <>
          <label
            className={cn(
              'flex flex-col gap-1',
              compacto ? 'text-xs font-bold uppercase tracking-wide text-slate-800' : 'text-sm font-medium text-slate-700',
            )}
          >
            {compacto ? 'Modelo' : 'Modelo disponível'}
            <select
              value={modeloId}
              onChange={(e) => setModeloId(e.target.value)}
              disabled={carregando || modelos.length === 0 || aplicando}
              className={selectCls}
            >
              {carregando ? (
                <option value="">A carregar…</option>
              ) : modelos.length === 0 ? (
                <option value="">Nenhum modelo</option>
              ) : (
                modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.quantidade_semanas} sem.)
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            type="button"
            disabled={
              aplicando ||
              carregando ||
              !modeloId ||
              modelos.length === 0
            }
            onClick={() => void aoAplicar()}
            className={cn(
              'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50',
              compacto
                ? 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm hover:bg-slate-50'
                : 'rounded-lg bg-primary-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-primary-700',
            )}
          >
            {aplicando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LayoutGrid className="h-4 w-4" aria-hidden />
            )}
            Aplicar modelo
          </button>
        </>
      )}

      {erro ? (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {erro}
        </p>
      ) : null}
      {sucesso ? (
        <p role="status" className="text-xs font-medium text-emerald-700">
          {sucesso}
        </p>
      ) : null}
    </div>
  )
}
