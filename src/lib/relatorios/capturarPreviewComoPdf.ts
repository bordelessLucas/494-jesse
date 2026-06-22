const DIMENSOES_A4_MM = {
  portrait: { largura: 210, altura: 297 },
  landscape: { largura: 297, altura: 210 },
} as const

export type OrientacaoPdf = keyof typeof DIMENSOES_A4_MM

export type OpcoesCapturaPdf = {
  orientacao?: OrientacaoPdf
  seletorPagina?: string
}

/**
 * Captura o preview do relatório (páginas `.pagina-a4`) e gera um PDF A4.
 */
export async function capturarPreviewComoPdf(
  elementoRaiz: HTMLElement,
  opcoes: OpcoesCapturaPdf = {},
): Promise<Uint8Array> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas-pro'),
  ])

  const orientacao = opcoes.orientacao ?? 'portrait'
  const seletor = opcoes.seletorPagina ?? '.pagina-a4'
  const { largura: larguraPaginaMm, altura: alturaPaginaMm } =
    DIMENSOES_A4_MM[orientacao]

  const paginas = elementoRaiz.querySelectorAll<HTMLElement>(seletor)
  const alvos = paginas.length > 0 ? Array.from(paginas) : [elementoRaiz]

  const pdf = new jsPDF({
    orientation: orientacao,
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  for (let indice = 0; indice < alvos.length; indice += 1) {
    const alvo = alvos[indice]
    const canvas = await html2canvas(alvo, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: alvo.offsetWidth,
      height: alvo.offsetHeight,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    if (indice > 0) pdf.addPage()

    const proporcao = canvas.width / canvas.height
    let largura = larguraPaginaMm
    let altura = largura / proporcao

    if (altura > alturaPaginaMm) {
      altura = alturaPaginaMm
      largura = altura * proporcao
    }

    const offsetX = (larguraPaginaMm - largura) / 2
    const offsetY = (alturaPaginaMm - altura) / 2

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, largura, altura)
  }

  return new Uint8Array(pdf.output('arraybuffer'))
}

export function pdfParaBase64(bytes: Uint8Array): string {
  let binario = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binario += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binario)
}
