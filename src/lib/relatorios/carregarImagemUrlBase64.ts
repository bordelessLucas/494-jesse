export type ImagemBase64 = {
  base64: string
  extension: 'png' | 'jpeg'
}

/**
 * Carrega uma imagem remota e devolve o conteúdo em base64 para uso no ExcelJS.
 */
export async function carregarImagemUrlBase64(
  url: string,
): Promise<ImagemBase64 | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binario = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binario += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }

    const extension: ImagemBase64['extension'] = blob.type.includes('png')
      ? 'png'
      : 'jpeg'

    return { base64: btoa(binario), extension }
  } catch {
    return null
  }
}
