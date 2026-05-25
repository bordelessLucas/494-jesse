import { eachDayOfInterval, getISOWeek, parseISO } from 'date-fns'

import { supabase } from '../supabase'
import {
  formatarHoraDb,
  type PlantaoRowDb,
} from './plantoesDb'
import type {
  EscalaModeloItemRow,
  EscalaModeloRow,
} from './modelosEscalaDb'

/** 1 = segunda … 7 = domingo (igual à tabela escala_modelo_itens). */
export function diaSemanaModelo(data: Date): number {
  const js = data.getDay()
  return js === 0 ? 7 : js
}

/** Semana do ciclo (1..N) com base na semana ISO do calendário. */
export function semanaIndexCiclo(data: Date, quantidadeSemanas: number): number {
  if (quantidadeSemanas <= 1) return 1
  const semanaIso = getISOWeek(data)
  return ((semanaIso - 1) % quantidadeSemanas) + 1
}

function chaveSlotPlantao(p: {
  data_plantao: string
  setor_id: string
  hora_inicio: string
  hora_fim: string
}): string {
  return `${p.data_plantao}|${p.setor_id}|${formatarHoraDb(p.hora_inicio)}|${formatarHoraDb(p.hora_fim)}`
}

export type PlantaoInsertFromModelo = {
  user_id: string
  local_id: string
  setor_id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: 'vago' | 'confirmado' | 'pendente' | 'realizado'
  valor_plantao: number
  ajuste_financeiro: number
  observacao_ajuste: string | null
  updated_at: string
}

export function gerarPlantoesDoModeloParaIntervalo(
  userId: string,
  modelo: EscalaModeloRow,
  itens: EscalaModeloItemRow[],
  dataInicioIso: string,
  dataFimIso: string,
  plantoesExistentes: PlantaoRowDb[] = [],
): PlantaoInsertFromModelo[] {
  const inicio = parseISO(dataInicioIso)
  const fim = parseISO(dataFimIso)
  const dias = eachDayOfInterval({ start: inicio, end: fim })

  const slotsOcupados = new Set(
    plantoesExistentes
      .filter(
        (p) =>
          p.local_id === modelo.local_id && p.setor_id === modelo.setor_id,
      )
      .map((p) => chaveSlotPlantao(p)),
  )

  const agora = new Date().toISOString()
  const inserts: PlantaoInsertFromModelo[] = []

  for (const dia of dias) {
    const dataIso = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`
    const semIdx = semanaIndexCiclo(dia, modelo.quantidade_semanas)
    const diaSem = diaSemanaModelo(dia)

    const itensDia = itens.filter(
      (it) => it.semana_index === semIdx && it.dia_semana === diaSem,
    )

    for (const it of itensDia) {
      const candidato = {
        data_plantao: dataIso,
        setor_id: modelo.setor_id,
        hora_inicio: formatarHoraDb(it.hora_inicio),
        hora_fim: formatarHoraDb(it.hora_fim),
      }
      if (slotsOcupados.has(chaveSlotPlantao(candidato))) continue

      inserts.push({
        user_id: userId,
        local_id: modelo.local_id,
        setor_id: modelo.setor_id,
        profissional_id: it.profissional_id,
        data_plantao: dataIso,
        hora_inicio: candidato.hora_inicio,
        hora_fim: candidato.hora_fim,
        status: it.profissional_id ? 'confirmado' : 'vago',
        valor_plantao: 0,
        ajuste_financeiro: 0,
        observacao_ajuste: null,
        updated_at: agora,
      })
      slotsOcupados.add(chaveSlotPlantao(candidato))
    }
  }

  return inserts
}

export async function aplicarModeloNaEscala(
  userId: string,
  modelo: EscalaModeloRow,
  itens: EscalaModeloItemRow[],
  dataInicioIso: string,
  dataFimIso: string,
  plantoesExistentes: PlantaoRowDb[] = [],
): Promise<{ inseridos: number; ignorados: number }> {
  const inserts = gerarPlantoesDoModeloParaIntervalo(
    userId,
    modelo,
    itens,
    dataInicioIso,
    dataFimIso,
    plantoesExistentes,
  )

  if (inserts.length === 0) {
    return { inseridos: 0, ignorados: 0 }
  }

  const { error } = await supabase.from('plantoes').insert(inserts)
  if (error) throw new Error(error.message)

  return { inseridos: inserts.length, ignorados: 0 }
}
