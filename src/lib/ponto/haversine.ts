const RAIO_TERRA_METROS = 6_371_000

function grausParaRadianos(graus: number): number {
  return (graus * Math.PI) / 180
}

/** Distância em metros entre duas coordenadas (fórmula de Haversine). */
export function distanciaMetrosHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const φ1 = grausParaRadianos(lat1)
  const φ2 = grausParaRadianos(lat2)
  const Δφ = grausParaRadianos(lat2 - lat1)
  const Δλ = grausParaRadianos(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return RAIO_TERRA_METROS * c
}

export function parseCoordenada(valor: string | null | undefined): number | null {
  if (valor == null || valor.trim() === '') return null
  const n = Number.parseFloat(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
