import ExcelJS from 'exceljs'

import type {
  CelulaCalendarioEscala,
  LinhaPagamentoProfissional,
  TipoRelatorioGerador,
} from '../../pages/Dashboard/relatoriosMockData'
import {
  fmtPeriodo,
  LEGENDA_ESCALA,
  montarGradeEscalaMes,
  totaisPagamentos,
} from '../../pages/Dashboard/relatoriosMockData'
import { carregarImagemUrlBase64 } from './carregarImagemUrlBase64'

const COR_TITULO = 'FF1E40AF'
const COR_SUBTITULO = 'FF334155'
const COR_CABECALHO_FUNDO = 'FFE2E8F0'
const COR_BORDA = 'FFCBD5E1'
const COR_BORDA_FORTE = 'FF94A3B8'
const COR_RODAPE_FUNDO = 'FFF1F5F9'
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
  listarTelefone?: boolean
  linhasPagamentos?: LinhaPagamentoProfissional[]
}

function tituloRelatorio(tipo: TipoRelatorioGerador): string {
  return tipo === 'pagamentos' ? 'Pagamentos para Plantões' : 'Escala de Plantões'
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
  const linhas = input.linhasPagamentos ?? []
  const totais = totaisPagamentos(linhas)
  const listarTelefone = Boolean(input.listarTelefone)
  const colunas = listarTelefone ? 5 : 4

  const ws = wb.addWorksheet('Pagamentos', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    views: [{ showGridLines: false }],
  })

  await montarCabecalhoPlanilha(ws, wb, input, colunas)

  const linhaCabecalhoTabela = 6
  const cabecalhos = listarTelefone
    ? ['Profissional', 'Telefone', 'Plantões', 'Duração (h)', 'Valor (R$)']
    : ['Profissional', 'Plantões', 'Duração (h)', 'Valor (R$)']

  cabecalhos.forEach((texto, i) => {
    const cell = ws.getCell(linhaCabecalhoTabela, i + 1)
    cell.value = texto
    aplicarEstiloCabecalhoTabela(cell)
  })
  ws.getRow(linhaCabecalhoTabela).height = 22

  let r = linhaCabecalhoTabela + 1
  for (const linha of linhas) {
    const valores: (string | number)[] = listarTelefone
      ? [
          linha.profissionalNome,
          linha.telefone || '—',
          linha.plantoes,
          linha.duracaoHoras,
          linha.valor,
        ]
      : [linha.profissionalNome, linha.plantoes, linha.duracaoHoras, linha.valor]

    valores.forEach((valor, i) => {
      const cell = ws.getCell(r, i + 1)
      if (i === valores.length - 1) {
        cell.value = linha.valor
        cell.numFmt = 'R$ #,##0.00'
        aplicarEstiloCelulaDados(cell, 'right')
      } else if (typeof valor === 'number') {
        cell.value = valor
        aplicarEstiloCelulaDados(cell, 'center')
      } else {
        cell.value = valor
        aplicarEstiloCelulaDados(cell, 'left')
      }
    })
    r++
  }

  const colSpanRodape = listarTelefone ? 2 : 1
  ws.mergeCells(r, 1, r, colSpanRodape)
  const cellTotalLabel = ws.getCell(r, 1)
  cellTotalLabel.value = 'TOTAL GERAL'
  cellTotalLabel.font = { bold: true, size: 10 }
  cellTotalLabel.alignment = { horizontal: 'right', vertical: 'middle' }
  cellTotalLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COR_RODAPE_FUNDO },
  }
  cellTotalLabel.border = BORDA_FORTE

  const colPlantoes = listarTelefone ? 3 : 2
  const colHoras = listarTelefone ? 4 : 3
  const colValor = listarTelefone ? 5 : 4

  const cellPlantoes = ws.getCell(r, colPlantoes)
  cellPlantoes.value = totais.plantoes
  aplicarEstiloCelulaDados(cellPlantoes, 'center')
  cellPlantoes.font = { bold: true, size: 10 }
  cellPlantoes.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COR_RODAPE_FUNDO },
  }
  cellPlantoes.border = BORDA_FORTE

  const cellHoras = ws.getCell(r, colHoras)
  cellHoras.value = totais.horas
  aplicarEstiloCelulaDados(cellHoras, 'center')
  cellHoras.font = { bold: true, size: 10 }
  cellHoras.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COR_RODAPE_FUNDO },
  }
  cellHoras.border = BORDA_FORTE

  const cellValor = ws.getCell(r, colValor)
  cellValor.value = totais.valor
  cellValor.numFmt = 'R$ #,##0.00'
  aplicarEstiloCelulaDados(cellValor, 'right')
  cellValor.font = { bold: true, size: 10 }
  cellValor.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COR_RODAPE_FUNDO },
  }
  cellValor.border = BORDA_FORTE

  ws.columns = listarTelefone
    ? [{ width: 34 }, { width: 18 }, { width: 12 }, { width: 14 }, { width: 16 }]
    : [{ width: 38 }, { width: 12 }, { width: 14 }, { width: 16 }]
}

function textoCelulaEscala(celula: CelulaCalendarioEscala): string {
  const linhas = celula.linhas.length > 0 ? celula.linhas : ['—']
  return [celula.rotulo, ...linhas].join('\n')
}

async function exportarEscala(
  wb: ExcelJS.Workbook,
  input: ExportarRelatorioGerencialXlsxInput,
) {
  const semanas = montarGradeEscalaMes(input.dataInicio, input.dataFim)
  const colunas = 7

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

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const linhaCabecalhoTabela = 6

  diasSemana.forEach((dia, i) => {
    const cell = ws.getCell(linhaCabecalhoTabela, i + 1)
    cell.value = dia
    aplicarEstiloCabecalhoTabela(cell)
  })
  ws.getRow(linhaCabecalhoTabela).height = 20

  let r = linhaCabecalhoTabela + 1
  for (const semana of semanas) {
    ws.getRow(r).height = 56
    semana.forEach((celula, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = textoCelulaEscala(celula)
      aplicarEstiloCelulaDados(cell, 'left')
      if (celula.foraMes) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
        cell.font = { size: 9, color: { argb: 'FF94A3B8' } }
      } else {
        cell.font = { size: 9, color: { argb: 'FF0F172A' } }
      }
    })
    r++
  }

  ws.mergeCells(r, 1, r, colunas)
  const cellLegenda = ws.getCell(r, 1)
  cellLegenda.value = LEGENDA_ESCALA
  cellLegenda.font = { size: 8, color: { argb: 'FF475569' } }
  cellLegenda.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
  cellLegenda.border = {
    top: { style: 'thin', color: { argb: COR_BORDA_FORTE } },
  }
  ws.getRow(r).height = 28

  ws.columns = Array.from({ length: colunas }, () => ({ width: 18 }))
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
