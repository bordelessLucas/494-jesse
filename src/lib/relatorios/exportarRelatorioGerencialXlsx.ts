import ExcelJS from 'exceljs'

import type { SemanaEscalaPega } from './montarGradeEscalaPegaPlantao'
import type {
  GrupoPagamentoProfissional,
  LinhaPlantaoListagem,
} from './relatoriosPlantaoDb'
import {
  fmtDataPlantaoHora,
  fmtDuracaoHHMM,
  LEGENDA_ESCALA_PEGA,
} from './formatoPegaPlantao'
import type { TipoRelatorioGerador } from '../../pages/Dashboard/relatoriosGerenciaisTypes'
import { TITULOS_RELATORIO_GERENCIAL, fmtPeriodo } from '../../pages/Dashboard/relatoriosGerenciaisTypes'
import { carregarImagemUrlBase64 } from './carregarImagemUrlBase64'

const COR_TITULO = 'FF1E40AF'
const COR_SUBTITULO = 'FF334155'
const COR_CABECALHO_FUNDO = 'FFE2E8F0'
const COR_BORDA = 'FFCBD5E1'
const COR_BORDA_FORTE = 'FF94A3B8'
const NOME_PLATAFORMA_PADRAO = 'PlantaoCheck'

const BORDA_FINA: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COR_BORDA } },
  left: { style: 'thin', color: { argb: COR_BORDA } },
  bottom: { style: 'thin', color: { argb: COR_BORDA } },
  right: { style: 'thin', color: { argb: COR_BORDA } },
}

const BORDA_FORTE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
  left: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
  bottom: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
  right: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
}

export type ExportarRelatorioGerencialXlsxInput = {
  tipoRelatorio: TipoRelatorioGerador
  nomePlataforma?: string
  nomeEmpresa: string
  logoUrl: string | null
  dataInicio: string
  dataFim: string
  dataGeracao: string
  semanasEscala?: SemanaEscalaPega[]
  gruposPagamentos?: GrupoPagamentoProfissional[]
  linhasPlantoes?: LinhaPlantaoListagem[]
}

function tituloRelatorio(tipo: TipoRelatorioGerador): string {
  return TITULOS_RELATORIO_GERENCIAL[tipo] ?? 'Relatório'
}

function sanitizeNomeFicheiro(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'relatorio'
}

function aplicarEstiloCabecalhoTabela(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: 'FF0F172A' }, size: 10 }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COR_CABECALHO_FUNDO },
  }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = BORDA_FORTE
}

function aplicarEstiloCelulaDados(cell: ExcelJS.Cell, alinhamento: 'left' | 'center' | 'right' = 'left') {
  cell.font = { size: 10, color: { argb: 'FF0F172A' } }
  cell.alignment = { vertical: 'middle', horizontal: alinhamento, wrapText: true }
  cell.border = BORDA_FINA
}

function colLetter(col: number): string {
  return String.fromCharCode(64 + col)
}

async function montarCabecalhoPlanilha(
  ws: ExcelJS.Worksheet,
  wb: ExcelJS.Workbook,
  input: ExportarRelatorioGerencialXlsxInput,
  colunasTotais: number,
) {
  const nomePlataforma = input.nomePlataforma?.trim() || NOME_PLATAFORMA_PADRAO
  const titulo = tituloRelatorio(input.tipoRelatorio)
  const periodo = fmtPeriodo(input.dataInicio, input.dataFim)
  const colConteudoFim = Math.max(2, colunasTotais - 1)
  const colConteudoFimLetra = colLetter(colConteudoFim)
  const colUltimaLetra = colLetter(colunasTotais)

  ws.getRow(1).height = 22
  ws.getRow(2).height = 18
  ws.getRow(3).height = 16

  if (input.logoUrl) {
    const imagem = await carregarImagemUrlBase64(input.logoUrl)
    if (imagem) {
      const imageId = wb.addImage({
        base64: imagem.base64,
        extension: imagem.extension,
      })
      ws.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 52, height: 52 },
      })
    }
  }

  ws.mergeCells(`B1:${colConteudoFimLetra}1`)
  const cellTitulo = ws.getCell('B1')
  cellTitulo.value = titulo.toUpperCase()
  cellTitulo.font = { bold: true, size: 15, color: { argb: COR_TITULO } }
  cellTitulo.alignment = { vertical: 'middle', horizontal: 'left' }

  ws.mergeCells(`B2:${colConteudoFimLetra}2`)
  const cellEmpresa = ws.getCell('B2')
  cellEmpresa.value = input.nomeEmpresa
  cellEmpresa.font = { size: 11, color: { argb: COR_SUBTITULO } }
  cellEmpresa.alignment = { vertical: 'middle', horizontal: 'left' }

  ws.mergeCells(`B3:${colConteudoFimLetra}3`)
  const cellPeriodo = ws.getCell('B3')
  cellPeriodo.value = `Período: ${periodo}`
  cellPeriodo.font = { size: 10, color: { argb: COR_SUBTITULO } }
  cellPeriodo.alignment = { vertical: 'middle', horizontal: 'left' }

  ws.mergeCells(`${colUltimaLetra}1:${colUltimaLetra}3`)
  const cellGerado = ws.getCell(`${colUltimaLetra}1`)
  cellGerado.value = `Gerado em:\n${input.dataGeracao}`
  cellGerado.font = { size: 9, color: { argb: 'FF64748B' } }
  cellGerado.alignment = { vertical: 'top', horizontal: 'right', wrapText: true }

  ws.mergeCells(`A4:${colUltimaLetra}4`)
  const cellPlataforma = ws.getCell('A4')
  cellPlataforma.value = nomePlataforma
  cellPlataforma.font = { bold: true, size: 9, color: { argb: COR_TITULO } }
  cellPlataforma.alignment = { horizontal: 'left', vertical: 'middle' }
  cellPlataforma.border = {
    bottom: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
  }
  ws.getRow(4).height = 18
}

async function exportarPagamentos(
  wb: ExcelJS.Workbook,
  input: ExportarRelatorioGerencialXlsxInput,
) {
  const grupos = input.gruposPagamentos ?? []
  const ws = wb.addWorksheet('Pagamentos', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  })

  await montarCabecalhoPlanilha(ws, wb, input, 5)

  let r = 6
  for (const grupo of grupos) {
    ws.mergeCells(r, 1, r, 5)
    ws.getCell(r, 1).value = grupo.profissionalNome
    ws.getCell(r, 1).font = { bold: true, size: 11 }
    r++

    const cabecalhos = ['Data', 'Setor', 'Tipo', 'Duração (h)', 'Valor']
    cabecalhos.forEach((texto, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = texto
      aplicarEstiloCabecalhoTabela(cell)
    })
    r++

    for (const linha of grupo.linhas) {
      const valores = [
        fmtDataPlantaoHora(linha.dataPlantao, linha.horaInicio),
        linha.setorLabel,
        linha.tipo,
        linha.duracao,
        linha.valor,
      ]
      valores.forEach((valor, i) => {
        const cell = ws.getCell(r, i + 1)
        cell.value = valor
        if (i === 4) {
          cell.numFmt = 'R$ #,##0.00'
          aplicarEstiloCelulaDados(cell, 'right')
        } else {
          aplicarEstiloCelulaDados(cell, i === 3 ? 'center' : 'left')
        }
      })
      r++
    }
    r++
  }

  ws.columns = [{ width: 22 }, { width: 40 }, { width: 16 }, { width: 12 }, { width: 14 }]
}

async function exportarPlantoes(
  wb: ExcelJS.Workbook,
  input: ExportarRelatorioGerencialXlsxInput,
) {
  const linhas = input.linhasPlantoes ?? []
  const ws = wb.addWorksheet('Plantões', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  })

  await montarCabecalhoPlanilha(ws, wb, input, 6)

  const cabecalhos = ['Data', 'Duração (h)', 'Setor', 'Responsável', 'Tipo', 'Valor']
  const linhaCabecalho = 6
  cabecalhos.forEach((texto, i) => {
    const cell = ws.getCell(linhaCabecalho, i + 1)
    cell.value = texto
    aplicarEstiloCabecalhoTabela(cell)
  })

  let r = linhaCabecalho + 1
  for (const linha of linhas) {
    const valores = [
      fmtDataPlantaoHora(linha.dataPlantao, linha.horaInicio),
      fmtDuracaoHHMM(linha.dataPlantao, linha.horaInicio, linha.horaFim),
      linha.setorLabel,
      linha.responsavelNome,
      linha.tipo,
      linha.valor,
    ]
    valores.forEach((valor, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = valor
      if (i === 5) {
        cell.numFmt = 'R$ #,##0.00'
        aplicarEstiloCelulaDados(cell, 'right')
      } else {
        aplicarEstiloCelulaDados(cell, i === 1 ? 'center' : 'left')
      }
    })
    r++
  }

  ws.columns = [{ width: 20 }, { width: 12 }, { width: 36 }, { width: 28 }, { width: 14 }, { width: 14 }]
}

async function exportarEscala(
  wb: ExcelJS.Workbook,
  input: ExportarRelatorioGerencialXlsxInput,
) {
  const semanas = input.semanasEscala ?? []
  const colunas = 8

  const ws = wb.addWorksheet('Escala', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ showGridLines: false }],
  })

  await montarCabecalhoPlanilha(ws, wb, input, colunas)

  let r = 6
  for (const semana of semanas) {
    ws.getCell(r, 1).value = ''
    semana.rotulosDias.forEach((rotulo, i) => {
      const cell = ws.getCell(r, i + 2)
      cell.value = rotulo
      aplicarEstiloCabecalhoTabela(cell)
    })
    r++

    for (const faixa of semana.faixas) {
      ws.getCell(r, 1).value = faixa.faixaRotulo
      aplicarEstiloCelulaDados(ws.getCell(r, 1), 'left')
      faixa.dias.forEach((celula, i) => {
        const cell = ws.getCell(r, i + 2)
        cell.value = celula.linhas.join('\n') || '—'
        aplicarEstiloCelulaDados(cell, 'left')
      })
      ws.getRow(r).height = 40
      r++
    }
    r++
  }

  ws.mergeCells(r, 1, r, colunas)
  const cellLegenda = ws.getCell(r, 1)
  cellLegenda.value = LEGENDA_ESCALA_PEGA
  cellLegenda.font = { size: 8, color: { argb: 'FF475569' } }
  cellLegenda.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  ws.getRow(r).height = 28

  ws.columns = [{ width: 12 }, ...Array.from({ length: 7 }, () => ({ width: 16 }))]
}

/**
 * Gera um ficheiro .xlsx formatado para relatórios gerenciais e inicia o download.
 */
export async function exportarRelatorioGerencialParaXlsx(
  input: ExportarRelatorioGerencialXlsxInput,
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = input.nomePlataforma?.trim() || NOME_PLATAFORMA_PADRAO
  wb.created = new Date()

  if (input.tipoRelatorio === 'pagamentos') {
    await exportarPagamentos(wb, input)
  } else if (input.tipoRelatorio === 'plantoes') {
    await exportarPlantoes(wb, input)
  } else if (input.tipoRelatorio === 'escala') {
    await exportarEscala(wb, input)
  } else {
    await exportarEscala(wb, input)
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const slug = sanitizeNomeFicheiro(tituloRelatorio(input.tipoRelatorio))
  const nomeFicheiro = `${slug}-gerencial.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFicheiro
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
