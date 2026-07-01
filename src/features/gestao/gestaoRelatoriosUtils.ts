import type { CabecalhoContratualData } from '../relatorios/types'
import type { LocalRelatorioOpcao, PlantaoRelatorioRow } from '../../lib/relatorios/plantoesRelatorioDb'

export type CompetenciaOpcao = {
  id: string
  label: string
  cabecalho: string
}

export const MESES_PT_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function gerarCompetencias(referencia: Date = new Date()): CompetenciaOpcao[] {
  const opcoes: CompetenciaOpcao[] = []
  for (let offset = -6; offset <= 1; offset += 1) {
    const data = new Date(referencia.getFullYear(), referencia.getMonth() + offset, 1)
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const mesNome = MESES_PT_BR[mes]
    const mesNum = String(mes + 1).padStart(2, '0')
    opcoes.push({
      id: `${ano}-${mesNum}`,
      label: `${mesNome} / ${ano}`,
      cabecalho: `${mesNome.toUpperCase()}/${ano}`,
    })
  }
  return opcoes.reverse()
}

export function obterDiasNoMes(competenciaId: string): number {
  const [anoStr, mesStr] = competenciaId.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  if (Number.isNaN(ano) || Number.isNaN(mes)) return 31
  return new Date(ano, mes, 0).getDate()
}

type LocalContratoDetalhe = {
  nomeLocal: string
  servico: string
  tomador: string
  contratoGestao: string
  contratoPrestacao: string
  empresa: string
  cnpj: string
  coordenador: string
}

export function montarDetalheLocal(
  local: LocalRelatorioOpcao | null,
  servicoPadrao: string,
): LocalContratoDetalhe {
  if (!local) {
    return {
      nomeLocal: '—',
      tomador: '—',
      cnpj: '',
      servico: servicoPadrao,
      contratoGestao: '',
      contratoPrestacao: '',
      empresa: 'PlantãoCheck Serviços Médicos LTDA',
      coordenador: '',
    }
  }
  return {
    nomeLocal: local.nome,
    tomador: `${local.cidade} — ${local.uf}`,
    cnpj: local.cnpj ?? '',
    servico: servicoPadrao,
    contratoGestao: '',
    contratoPrestacao: '',
    empresa: 'PlantãoCheck Serviços Médicos LTDA',
    coordenador: '',
  }
}

export function montarCabecalho(
  detalhe: LocalContratoDetalhe,
  competenciaCabecalho: string,
  logoUrl: string | null,
): CabecalhoContratualData {
  return {
    logoUrl,
    contratoGestao: detalhe.contratoGestao,
    contratoPrestacao: detalhe.contratoPrestacao,
    local: detalhe.nomeLocal,
    servico: detalhe.servico,
    tomador: detalhe.tomador,
    empresa: detalhe.empresa,
    cnpj: detalhe.cnpj,
    coordenador: detalhe.coordenador,
    competencia: competenciaCabecalho,
  }
}

export type CabecalhoTextoEditavel = Omit<CabecalhoContratualData, 'logoUrl'>

export function extrairTextoCabecalho(
  dados: CabecalhoContratualData,
): CabecalhoTextoEditavel {
  const { logoUrl: _logo, ...texto } = dados
  return texto
}

export function formatarDataEmissao(competenciaCabecalho: string): string {
  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = MESES_PT_BR[hoje.getMonth()].toLowerCase()
  const ano = hoje.getFullYear()
  return `São Paulo, ${dia} de ${mes} de ${ano} — Competência ${competenciaCabecalho}`
}

export function filtrarPlantoesPorSetorUti(
  plantoes: PlantaoRelatorioRow[],
  setorUti: 'UTI Adulto' | 'UTI Pediátrica' | 'UTI Neonatal',
): PlantaoRelatorioRow[] {
  return plantoes.filter((p) => {
    const nome = p.setores?.nome ?? ''
    if (setorUti === 'UTI Adulto') {
      return /uti.*adulto/i.test(nome) || (/uti/i.test(nome) && !/pedi|neo/i.test(nome))
    }
    return /pedi|pediátrica|pediatrica|neonatal/i.test(nome)
  })
}

export function intervaloQuinzena(
  competenciaId: string,
  quinzena: '1' | '2',
): { dataInicio: string; dataFim: string; rotulo: string } {
  const [anoStr, mesStr] = competenciaId.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const mesNome = MESES_PT_BR[mes - 1]

  if (quinzena === '1') {
    return {
      dataInicio: `${competenciaId}-01`,
      dataFim: `${competenciaId}-15`,
      rotulo: `1.ª quinzena de ${mesNome}/${ano}`,
    }
  }

  return {
    dataInicio: `${competenciaId}-16`,
    dataFim: `${competenciaId}-${String(ultimoDia).padStart(2, '0')}`,
    rotulo: `2.ª quinzena de ${mesNome}/${ano}`,
  }
}

export function intervaloMensal(competenciaId: string): {
  dataInicio: string
  dataFim: string
  rotulo: string
} {
  const [anoStr, mesStr] = competenciaId.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const mesNome = MESES_PT_BR[mes - 1]
  return {
    dataInicio: `${competenciaId}-01`,
    dataFim: `${competenciaId}-${String(ultimoDia).padStart(2, '0')}`,
    rotulo: `${mesNome} / ${ano}`,
  }
}

export function intervaloSemanal(
  competenciaId: string,
  semanaOffset: number,
): { dataInicio: string; dataFim: string; rotulo: string } {
  const [anoStr, mesStr] = competenciaId.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const inicioMes = new Date(ano, mes - 1, 1)
  const inicioSemana = new Date(inicioMes)
  inicioSemana.setDate(1 + semanaOffset * 7)
  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(inicioSemana.getDate() + 6)

  const ultimoDiaMes = new Date(ano, mes, 0)
  if (fimSemana > ultimoDiaMes) fimSemana.setTime(ultimoDiaMes.getTime())
  if (inicioSemana > ultimoDiaMes) {
    inicioSemana.setTime(ultimoDiaMes.getTime())
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const rotulo = `${String(inicioSemana.getDate()).padStart(2, '0')}/${String(inicioSemana.getMonth() + 1).padStart(2, '0')} a ${String(fimSemana.getDate()).padStart(2, '0')}/${String(fimSemana.getMonth() + 1).padStart(2, '0')}/${fimSemana.getFullYear()}`

  return { dataInicio: fmt(inicioSemana), dataFim: fmt(fimSemana), rotulo }
}

export const CAMPOS_CONTRATUAIS: {
  chave: keyof CabecalhoTextoEditavel
  label: string
}[] = [
  { chave: 'contratoGestao', label: 'Contrato de Gestão' },
  { chave: 'contratoPrestacao', label: 'Contrato de Prestação de Serviços' },
  { chave: 'local', label: 'Local' },
  { chave: 'servico', label: 'Serviço' },
  { chave: 'coordenador', label: 'Coordenador' },
  { chave: 'tomador', label: 'Tomador' },
  { chave: 'empresa', label: 'Empresa' },
  { chave: 'cnpj', label: 'CNPJ' },
  { chave: 'competencia', label: 'Competência (texto no relatório)' },
]
