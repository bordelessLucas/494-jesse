export type EnderecoGeocodificavel = {
  nome?: string | null
  rua: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  uf: string
  cep?: string | null
}

export function montarEnderecoCompleto(endereco: EnderecoGeocodificavel): string {
  const logradouro = [endereco.rua.trim(), endereco.numero.trim()].filter(Boolean).join(', ')
  const partes = [
    endereco.nome?.trim(),
    logradouro,
    endereco.complemento?.trim(),
    endereco.bairro.trim(),
    endereco.cidade.trim(),
    endereco.uf.trim().toUpperCase(),
    endereco.cep?.trim(),
    'Brasil',
  ].filter((p): p is string => Boolean(p && p.length > 0))

  return partes.join(', ')
}

export function urlGoogleMapsEndereco(endereco: EnderecoGeocodificavel): string {
  const query = montarEnderecoCompleto(endereco)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

type NominatimResult = {
  lat: string
  lon: string
  display_name?: string
}

/**
 * Converte endereço em coordenadas via Nominatim (OpenStreetMap).
 * As coordenadas são guardadas internamente para o ponto eletrónico (GPS).
 */
export async function geocodificarEndereco(
  endereco: EnderecoGeocodificavel,
): Promise<{ latitude: string; longitude: string; rotulo?: string }> {
  const query = montarEnderecoCompleto(endereco)
  if (!query) {
    throw new Error('Endereço incompleto para localização.')
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

  const resposta = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'pt-BR',
      'User-Agent': 'Unique Gestor/1.0 (cadastro-locais)',
    },
  })

  if (!resposta.ok) {
    throw new Error('Serviço de localização indisponível. Tente novamente em instantes.')
  }

  const resultados = (await resposta.json()) as NominatimResult[]
  const primeiro = resultados[0]
  if (!primeiro?.lat || !primeiro?.lon) {
    throw new Error(
      'Não foi possível localizar este endereço. Confira rua, número, bairro, cidade e UF.',
    )
  }

  return {
    latitude: primeiro.lat,
    longitude: primeiro.lon,
    rotulo: primeiro.display_name,
  }
}
