import ExcelJS from 'exceljs'

import type { TomModelo } from './modelosEscalaDb'

/** 1 = segunda … 7 = domingo */
const NOME_DIA_SEMANA_COMPLETO: Record<number, string> = {
  1: 'Segunda-Feira',
  2: 'Terça-Feira',
  3: 'Quarta-Feira',
  4: 'Quinta-Feira',
  5: 'Sexta-Feira',
  6: 'Sábado',
  7: 'Domingo',
}

function fmtDuracao(min: number | null | undefined): string {
  if (min == null || !Number.isFinite(min)) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function horaCurta(s: string): string {
  return s.trim().slice(0, 5)
}

function tipoPlanilha(t: TomModelo): string {
  return t === 'fds' ? 'Fim de Semana' : 'Normal'
}

function sanitizeNomeFicheiro(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'modelo'
}

export type ItemLinhaExportacao = {
  semana_index: number
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  duracao_minutos: number | null
  tipo: TomModelo
  profissional_id: string | null
}

export type ExportarEscalaModeloXlsxInput = {
  localNome: string
  setorNome: string
  modeloNome: string
  quantidadeSemanas: number
  itens: ItemLinhaExportacao[]
  profissionaisPorId: Record<
    string,
    { nome: string; registroProfissional: string; cpf: string | null }
  >
}

/**
 * Gera um ficheiro .xlsx no layout do relatório «RELATÓRIO DE ESCALA MODELO»
 * e inicia o download no browser.
 */
export async function exportarEscalaModeloParaXlsx(
  input: ExportarEscalaModeloXlsxInput,
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Escala modelo', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToHeight: 5, fitToWidth: 1 },
  })

  const gerado = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  })

  ws.mergeCells('A1:G1')
  const titulo = ws.getCell('A1')
  titulo.value = 'RELATÓRIO DE ESCALA MODELO'
  titulo.font = { bold: true, size: 16, color: { argb: 'FF0070C0' } }
  titulo.alignment = { vertical: 'middle' }

  ws.mergeCells('H1:K1')
  const stamp = ws.getCell('H1')
  stamp.value = `gerado em ${gerado} (UTC -3)`
  stamp.font = { size: 9, color: { argb: 'FF333333' } }
  stamp.alignment = { horizontal: 'right', vertical: 'middle' }

  ws.mergeCells('A2:K2')
  const sub = ws.getCell('A2')
  sub.value = `Quantidade de Semanas: ${input.quantidadeSemanas}`
  sub.font = { size: 11, color: { argb: 'FF0070C0' } }

  const linhaCabecalhoTabela = 4
  const colunas = [
    'Local',
    'Setor',
    'Modelo',
    'Semana',
    'Dia da Semana',
    'Duração',
    'Início',
    'Tipo',
    'Profissional',
    'Reg. Prof.',
    'CPF',
  ] as const

  colunas.forEach((texto, i) => {
    const c = ws.getCell(linhaCabecalhoTabela, i + 1)
    c.value = texto
    c.font = { bold: true }
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    }
    c.border = {
      top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
    }
  })

  const ordenados = [...input.itens].sort((a, b) => {
    if (a.semana_index !== b.semana_index) return a.semana_index - b.semana_index
    if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana
    return a.hora_inicio.localeCompare(b.hora_inicio)
  })

  let r = linhaCabecalhoTabela + 1
  for (const it of ordenados) {
    const det =
      it.profissional_id && input.profissionaisPorId[it.profissional_id]
        ? input.profissionaisPorId[it.profissional_id]
        : undefined

    const vals: (string | number)[] = [
      input.localNome,
      input.setorNome,
      input.modeloNome,
      it.semana_index,
      NOME_DIA_SEMANA_COMPLETO[it.dia_semana] ?? `Dia ${it.dia_semana}`,
      fmtDuracao(it.duracao_minutos),
      horaCurta(it.hora_inicio),
      tipoPlanilha(it.tipo),
      det?.nome ?? '',
      it.profissional_id && det ? det.registroProfissional : '/',
      det?.cpf ?? '',
    ]

    vals.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = v
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      }
    })
    r++
  }

  const linhaRodape = r
  ws.mergeCells(`A${linhaRodape}:K${linhaRodape}`)
  const rodape = ws.getCell(`A${linhaRodape}`)
  rodape.value = `Total: ${ordenados.length} registros encontrados.`
  rodape.font = { bold: true, color: { argb: 'FF111111' } }
  rodape.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  }
  rodape.alignment = { horizontal: 'right', vertical: 'middle' }
  rodape.border = {
    top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
    left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
    bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
    right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
  }

  ws.columns = [
    { width: 28 },
    { width: 22 },
    { width: 38 },
    { width: 9 },
    { width: 16 },
    { width: 10 },
    { width: 10 },
    { width: 16 },
    { width: 28 },
    { width: 14 },
    { width: 18 },
  ]

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const nomeBase = sanitizeNomeFicheiro(input.modeloNome)
  const nomeFicheiro = `${nomeBase}-escala-modelo.xlsx`

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
