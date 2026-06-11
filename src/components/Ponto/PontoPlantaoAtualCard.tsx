import { Building2, Clock3, MapPin } from 'lucide-react'

import { cn } from '../../lib/cn'
import { formatarHoraPlantao } from '../../lib/ponto/registroPontoDb'
import type { PlantaoPontoHoje } from '../../lib/ponto/registroPontoTypes'

const ROTULOS_STATUS_PLANTAO: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  realizado: 'Realizado',
}

const ESTILOS_STATUS_PLANTAO: Record<string, string> = {
  confirmado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  pendente: 'border-amber-200 bg-amber-50 text-amber-800',
  realizado: 'border-sky-200 bg-sky-50 text-sky-800',
}

type PontoPlantaoAtualCardProps = {
  plantao: PlantaoPontoHoje
  turnoAtivo: boolean
  segundosDecorridos: number
  entradaEm: string | null
  formatarCronometro: (segundos: number) => string
  formatarDataHora: (iso: string | null) => string
  className?: string
}

export function PontoPlantaoAtualCard({
  plantao,
  turnoAtivo,
  segundosDecorridos,
  entradaEm,
  formatarCronometro,
  formatarDataHora,
  className,
}: PontoPlantaoAtualCardProps) {
  const statusRotulo = ROTULOS_STATUS_PLANTAO[plantao.status] ?? plantao.status
  const statusEstilo =
    ESTILOS_STATUS_PLANTAO[plantao.status] ?? 'border-slate-200 bg-slate-50 text-slate-700'

  const temCoordenadas = plantao.latitude != null && plantao.longitude != null
  const urlMapa = temCoordenadas
    ? `https://www.google.com/maps/search/?api=1&query=${plantao.latitude},${plantao.longitude}`
    : null

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-white shadow-sm ring-1 ring-primary-100',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-primary-100 bg-primary-600 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">
          Plantão de hoje
        </p>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            statusEstilo,
          )}
        >
          {statusRotulo}
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <Building2 className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
              {plantao.hospital}
            </p>
            <p className="mt-1 text-sm text-slate-600">{plantao.setor}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200/80">
            <Clock3 className="h-4 w-4 shrink-0 text-primary-600" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Horário previsto
              </p>
              <p className="font-semibold tabular-nums">
                {formatarHoraPlantao(plantao.hora_inicio)} – {formatarHoraPlantao(plantao.hora_fim)}
              </p>
            </div>
          </div>

          {urlMapa ? (
            <a
              href={urlMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-primary-700 ring-1 ring-slate-200/80 transition hover:bg-primary-50"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-medium">Ver hospital no mapa</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200/80">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              Localização do hospital pendente de cadastro
            </div>
          )}
        </div>

        {turnoAtivo ? (
          <div className="rounded-2xl bg-slate-900 px-4 py-6 text-center text-white sm:px-5">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Tempo em serviço
            </p>
            <p
              className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
              aria-live="polite"
            >
              {formatarCronometro(segundosDecorridos)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Check-in: {formatarDataHora(entradaEm)}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  )
}
