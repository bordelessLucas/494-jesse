import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

const LARGURA_A4_MM = 210
const ALTURA_A4_MM = 297

/**
 * Captura o preview do relatório (páginas `.pagina-a4`) e gera um PDF A4.
 */
export async function capturarPreviewComoPdf(
  elementoRaiz: HTMLElement,
): Promise<Uint8Array> {
  const paginas = elementoRaiz.querySelectorAll<HTMLElement>('.pagina-a4')
  const alvos = paginas.length > 0 ? Array.from(paginas) : [elementoRaiz]

  const pdf = new jsPDF({
    orientation: 'portrait',
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
    let largura = LARGURA_A4_MM
    let altura = largura / proporcao

    if (altura > ALTURA_A4_MM) {
      altura = ALTURA_A4_MM
      largura = altura * proporcao
    }

    const offsetX = (LARGURA_A4_MM - largura) / 2
    const offsetY = (ALTURA_A4_MM - altura) / 2

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
