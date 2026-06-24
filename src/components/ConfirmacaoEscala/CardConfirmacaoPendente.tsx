import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useConfirmacaoEscala } from '../../hooks/useConfirmacaoEscala'
import { cn } from '../../lib/cn'
import { dataLocalAPartirDeIsoData } from '../../lib/escalas/plantoesDb'
import { duracaoHorasPlantao } from '../../lib/dashboard/plantaoHoras'
import type { PlantaoConfirmacaoPendente } from '../../lib/escalas/confirmacaoEscalaDb'

type CardConfirmacaoPendenteProps = {
  plantao: PlantaoConfirmacaoPendente
  onRemovido?: () => void
  className?: string
}

function formatarDataPorExtenso(iso: string): string {
  const d = dataLocalAPartirDeIsoData(iso)
  const texto = format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatarHorarioComDuracao(
  dataIso: string,
  inicio: string,
  fim: string,
): string {
  const hi = String(inicio).slice(0, 5)
  const hf = String(fim).slice(0, 5)
  const horas = Math.round(duracaoHorasPlantao(dataIso, inicio, fim))
  return `${hi} às ${hf} (${horas}h)`
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CardConfirmacaoPendente({
  plantao,
  onRemovido,
  className,
}: CardConfirmacaoPendenteProps) {
  const { confirmarPlantao, loadingPorPlantao } = useConfirmacaoEscala()
  const [mostrarRecusa, setMostrarRecusa] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [saindo, setSaindo] = useState(false)

  const loading = loadingPorPlantao[plantao.id] ?? null

  async function handleConfirmar() {
    const result = await confirmarPlantao(plantao.id, true)
    if (result.success) {
      setSaindo(true)
      window.setTimeout(() => onRemovido?.(), 300)
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  async function handleRecusar() {
    if (motivo.trim().length < 10) {
      toast.error('Descreva o motivo com pelo menos 10 caracteres.')
      return
    }
    const result = await confirmarPlantao(plantao.id, false, motivo.trim())
    if (result.success) {
      setSaindo(true)
      window.setTimeout(() => onRemovido?.(), 300)
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <article
      className={cn(
        'rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition-all duration-300',
        saindo && 'pointer-events-none scale-95 opacity-0',
        className,
      )}
    >
      <p className="text-sm font-semibold text-slate-900">
        {formatarDataPorExtenso(plantao.data_plantao)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {formatarHorarioComDuracao(
          plantao.data_plantao,
          plantao.hora_inicio,
          plantao.hora_fim,
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {plantao.local_nome} · {plantao.setor_nome}
      </p>
      {plantao.valor_plantao > 0 ? (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {fmtBRL(plantao.valor_plantao)}
        </p>
      ) : null}

      {mostrarRecusa ? (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          <label className="block text-xs font-medium text-slate-700">
            Motivo da recusa <span className="text-red-600">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Explique por que não pode assumir este plantão…"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading === 'recusar'}
              onClick={() => void handleRecusar()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              {loading === 'recusar' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              Enviar recusa
            </button>
            <button
              type="button"
              disabled={loading != null}
              onClick={() => {
                setMostrarRecusa(false)
                setMotivo('')
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading != null}
            onClick={() => void handleConfirmar()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading === 'confirmar' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <span aria-hidden>✅</span>
            )}
            Confirmar
          </button>
          <button
            type="button"
            disabled={loading != null}
            onClick={() => setMostrarRecusa(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {loading === 'recusar' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <span aria-hidden>❌</span>
            )}
            Recusar
          </button>
        </div>
      )}
    </article>
  )
}
