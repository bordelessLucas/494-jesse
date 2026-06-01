import { formatarHoraDb } from '../escalas/plantoesDb'
import { duracaoHorasPlantao } from '../dashboard/plantaoHoras'
import type {
  EscalaCoordenacaoEntrada,
  EscalaFrequenciaSetorEntrada,
  IndicadoresScirasEscala,
  LinhaFrequenciaDetalhada,
  TurnoFrequencia,
} from '../../features/relatorios/types'
import {
  formatarHorarioPlantao,
  formatarRegistroConselho,
  type PlantaoRelatorioRow,
} from './plantoesRelatorioDb'

function diaDoMes(dataPlantao: string): number {
  const chave = dataPlantao.slice(0, 10)
  const dia = Number(chave.slice(8, 10))
  return Number.isFinite(dia) ? dia : 0
}

function formatarDataBr(dataPlantao: string): string {
  const chave = dataPlantao.slice(0, 10)
  const [y, m, d] = chave.split('-')
  if (!y || !m || !d) return chave
  return `${d}/${m}/${y}`
}

function rotuloTurnoAPartirDoPlantao(inicio: string, fim: string): TurnoFrequencia {
  const a = formatarHoraDb(inicio).replace(':', '')
  const b = formatarHoraDb(fim).replace(':', '')
  return `${a}-${b}H`
}

function encaixarTurno(
  plantao: PlantaoRelatorioRow,
  turnos: TurnoFrequencia[],
): TurnoFrequencia | null {
  if (turnos.length === 0) return rotuloTurnoAPartirDoPlantao(plantao.hora_inicio, plantao.hora_fim)

  const gerado = rotuloTurnoAPartirDoPlantao(plantao.hora_inicio, plantao.hora_fim)
  if (turnos.includes(gerado)) return gerado

  const inicio = formatarHoraDb(plantao.hora_inicio)
  for (const turno of turnos) {
    if (turno.includes(inicio.slice(0, 2))) return turno
  }

  return turnos[0] ?? gerado
}

/** Lista detalhada: nome, CRM, data, horário, setor. */
export function mapearLinhasFrequenciaDetalhada(
  plantoes: PlantaoRelatorioRow[],
): LinhaFrequenciaDetalhada[] {
  return plantoes
    .filter((p) => p.profissionais?.nome)
    .map((p) => ({
      profissionalNome: p.profissionais!.nome.trim(),
      crm: formatarRegistroConselho(p.profissionais),
      data: formatarDataBr(p.data_plantao),
      horaEntrada: formatarHoraDb(p.hora_inicio),
      horaSaida: formatarHoraDb(p.hora_fim),
      horario: formatarHorarioPlantao(p.hora_inicio, p.hora_fim),
      setor: p.setores?.nome?.trim() || '—',
    }))
}

/** Grade dia × turno (nomes na célula). */
export function mapearEscalaFrequenciaSetor(
  plantoes: PlantaoRelatorioRow[],
  turnos: TurnoFrequencia[],
  totalDias: number,
): EscalaFrequenciaSetorEntrada[] {
  const entradas: EscalaFrequenciaSetorEntrada[] = []

  for (const plantao of plantoes) {
    const dia = diaDoMes(plantao.data_plantao)
    if (dia < 1 || dia > totalDias) continue
    const nome = plantao.profissionais?.nome?.trim()
    if (!nome) continue
    const turno = encaixarTurno(plantao, turnos)
    if (!turno) continue
    entradas.push({ dia, turno, profissionalNome: nome })
  }

  return entradas
}

/** Um nome por dia (primeiro plantão realizado do dia). */
export function mapearEscalaCoordenacao(
  plantoes: PlantaoRelatorioRow[],
  totalDias: number,
): EscalaCoordenacaoEntrada[] {
  const porDia = new Map<number, string>()

  for (const plantao of plantoes) {
    const dia = diaDoMes(plantao.data_plantao)
    if (dia < 1 || dia > totalDias || porDia.has(dia)) continue
    const nome = plantao.profissionais?.nome?.trim()
    if (nome) porDia.set(dia, nome)
  }

  return Array.from(porDia.entries()).map(([dia, coordenadorNome]) => ({
    dia,
    coordenadorNome,
  }))
}

function isSetorUti(nomeSetor: string): boolean {
  return /uti/i.test(nomeSetor)
}

export type { IndicadoresScirasEscala }

/** Indicadores derivados dos plantões realizados (escala real). */
export function calcularIndicadoresScirasEscala(
  plantoes: PlantaoRelatorioRow[],
): IndicadoresScirasEscala {
  const horasPorSetorMap = new Map<string, { horas: number; plantoes: number }>()
  let totalHorasMedicasUti = 0
  let totalPlantoesRealizadosUti = 0

  for (const p of plantoes) {
    const setor = p.setores?.nome?.trim() || 'Sem setor'
    const horas = duracaoHorasPlantao(p.data_plantao, p.hora_inicio, p.hora_fim)
    const atual = horasPorSetorMap.get(setor) ?? { horas: 0, plantoes: 0 }
    atual.horas += horas
    atual.plantoes += 1
    horasPorSetorMap.set(setor, atual)

    if (isSetorUti(setor)) {
      totalHorasMedicasUti += horas
      totalPlantoesRealizadosUti += 1
    }
  }

  const horasPorSetor = Array.from(horasPorSetorMap.entries())
    .map(([setor, v]) => ({ setor, horas: v.horas, plantoes: v.plantoes }))
    .sort((a, b) => b.horas - a.horas)

  return {
    totalHorasMedicasUti,
    totalPlantoesRealizados: plantoes.length,
    totalPlantoesRealizadosUti,
    horasPorSetor,
  }
}

/** Turnos únicos detectados na escala (para preencher colunas da grade). */
export function detectarTurnosUnicos(plantoes: PlantaoRelatorioRow[]): TurnoFrequencia[] {
  const vistos = new Set<TurnoFrequencia>()
  const lista: TurnoFrequencia[] = []
  for (const p of plantoes) {
    const rotulo = rotuloTurnoAPartirDoPlantao(p.hora_inicio, p.hora_fim)
    if (!vistos.has(rotulo)) {
      vistos.add(rotulo)
      lista.push(rotulo)
    }
  }
  return lista
}
