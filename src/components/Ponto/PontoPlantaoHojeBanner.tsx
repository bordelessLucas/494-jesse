import { Clock3, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { PlantaoPontoHoje } from '../../lib/ponto/registroPontoTypes'
import { formatarHoraPlantao } from '../../lib/ponto/registroPontoDb'

type PontoPlantaoHojeBannerProps = {
  plantao: PlantaoPontoHoje
  turnoAtivo?: boolean
}

export function PontoPlantaoHojeBanner({ plantao, turnoAtivo }: PontoPlantaoHojeBannerProps) {
  return (
    <Link
      to="/ponto"
      className="block overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white shadow-md transition active:scale-[0.99] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">
            {turnoAtivo ? 'Plantão em andamento' : 'Plantão de hoje'}
          </p>
          <p className="mt-1 truncate text-lg font-semibold">{plantao.hospital}</p>
          <p className="truncate text-sm text-primary-100">{plantao.setor}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-50">
            <Clock3 className="h-4 w-4 shrink-0" aria-hidden />
            {formatarHoraPlantao(plantao.hora_inicio)} – {formatarHoraPlantao(plantao.hora_fim)}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <MapPinned className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-white">
        {turnoAtivo ? 'Toque para ver o cronómetro e fazer check-out' : 'Toque para fazer check-in'}
      </p>
    </Link>
  )
}
