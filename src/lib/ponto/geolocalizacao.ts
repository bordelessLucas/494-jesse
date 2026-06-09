export type PosicaoGps = {
  latitude: number
  longitude: number
  accuracy: number | null
}

function mensagemErroGeolocalizacao(code: number): string {
  switch (code) {
    case 1:
      return 'Permissão de localização negada. Ative o GPS nas definições do navegador.'
    case 2:
      return 'Não foi possível obter a sua posição. Verifique se o GPS está ativo.'
    case 3:
      return 'Tempo esgotado ao obter a localização. Tente novamente.'
    default:
      return 'Falha ao obter a localização do dispositivo.'
  }
}

export function obterPosicaoAtual(): Promise<PosicaoGps> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        })
      },
      (err) => {
        reject(new Error(mensagemErroGeolocalizacao(err.code)))
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 0,
      },
    )
  })
}
