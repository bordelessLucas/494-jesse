import { format } from 'date-fns'

import { supabase } from '../supabase'
import { distanciaMetrosHaversine, parseCoordenada } from './haversine'
import type { PosicaoGps } from './geolocalizacao'
import {
  MENSAGEM_CHECKIN_BLOQUEADO,
  RAIO_CHECKIN_METROS,
  type PlantaoPontoHoje,
  type RegistroPontoRow,
} from './registroPontoTypes'

const COLUNAS_REGISTRO =
  'id, user_id, profissional_id, plantao_id, entrada_em, saida_em, latitude_entrada, longitude_entrada, latitude_saida, longitude_saida, distancia_entrada_metros, distancia_saida_metros, status, created_at, updated_at'

type PlantaoPontoRowDb = {
  id: string
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  local_id: string
  setor_id: string
  locais: { nome_fantasia: string; latitude: string | null; longitude: string | null } | null
  setores: { nome: string } | null
}

function mapPlantaoPontoRow(row: PlantaoPontoRowDb): PlantaoPontoHoje {
  return {
    id: row.id,
    data_plantao: row.data_plantao,
    hora_inicio: row.hora_inicio,
    hora_fim: row.hora_fim,
    status: row.status,
    local_id: row.local_id,
    setor_id: row.setor_id,
    hospital: row.locais?.nome_fantasia ?? 'Hospital',
    setor: row.setores?.nome ?? 'Setor',
    latitude: parseCoordenada(row.locais?.latitude),
    longitude: parseCoordenada(row.locais?.longitude),
  }
}

export function dataHojeIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export async function buscarPlantoesHojeProfissional(
  tenantUserId: string,
  profissionalId: string,
): Promise<PlantaoPontoHoje[]> {
  const hoje = dataHojeIso()
  const { data, error } = await supabase
    .from('plantoes')
    .select(
      `
      id,
      data_plantao,
      hora_inicio,
      hora_fim,
      status,
      local_id,
      setor_id,
      locais ( nome_fantasia, latitude, longitude ),
      setores ( nome )
    `,
    )
    .eq('user_id', tenantUserId)
    .eq('profissional_id', profissionalId)
    .eq('data_plantao', hoje)
    .in('status', ['confirmado', 'pendente', 'realizado'])
    .order('hora_inicio', { ascending: true })

  if (error) {
    if (error.message.includes('registro_ponto') || error.message.includes('schema')) {
      throw error
    }
    throw new Error(error.message)
  }

  return ((data ?? []) as PlantaoPontoRowDb[]).map(mapPlantaoPontoRow)
}

export async function buscarRegistroAbertoPlantao(
  plantaoId: string,
): Promise<RegistroPontoRow | null> {
  const { data, error } = await supabase
    .from('registro_ponto')
    .select(COLUNAS_REGISTRO)
    .eq('plantao_id', plantaoId)
    .is('saida_em', null)
    .maybeSingle()

  if (error) {
    if (error.message.includes('registro_ponto') || error.message.includes('schema')) {
      return null
    }
    throw new Error(error.message)
  }

  return (data as RegistroPontoRow | null) ?? null
}

export async function listarUltimosRegistrosPonto(
  profissionalId: string,
  limite = 5,
): Promise<RegistroPontoRow[]> {
  const { data, error } = await supabase
    .from('registro_ponto')
    .select(COLUNAS_REGISTRO)
    .eq('profissional_id', profissionalId)
    .order('entrada_em', { ascending: false })
    .limit(limite)

  if (error) {
    if (error.message.includes('registro_ponto') || error.message.includes('schema')) {
      return []
    }
    throw new Error(error.message)
  }

  return (data ?? []) as RegistroPontoRow[]
}

function validarProximidadeHospital(
  posicao: PosicaoGps,
  plantao: PlantaoPontoHoje,
): { distanciaMetros: number } {
  if (plantao.latitude == null || plantao.longitude == null) {
    throw new Error(
      'Este hospital ainda não possui localização cadastrada. Peça à coordenação para rever o endereço em Locais & Setores.',
    )
  }

  const distanciaMetros = distanciaMetrosHaversine(
    posicao.latitude,
    posicao.longitude,
    plantao.latitude,
    plantao.longitude,
  )

  if (distanciaMetros > RAIO_CHECKIN_METROS) {
    throw new Error(MENSAGEM_CHECKIN_BLOQUEADO)
  }

  return { distanciaMetros }
}

export async function registrarCheckIn(params: {
  tenantUserId: string
  profissionalId: string
  plantao: PlantaoPontoHoje
  posicao: PosicaoGps
}): Promise<RegistroPontoRow> {
  const { distanciaMetros } = validarProximidadeHospital(params.posicao, params.plantao)
  const agora = new Date().toISOString()

  const { data, error } = await supabase
    .from('registro_ponto')
    .insert({
      user_id: params.tenantUserId,
      profissional_id: params.profissionalId,
      plantao_id: params.plantao.id,
      entrada_em: agora,
      latitude_entrada: params.posicao.latitude,
      longitude_entrada: params.posicao.longitude,
      distancia_entrada_metros: Math.round(distanciaMetros * 100) / 100,
      status: 'validado',
      updated_at: agora,
    })
    .select(COLUNAS_REGISTRO)
    .single()

  if (error) throw new Error(error.message)
  return data as RegistroPontoRow
}

export async function registrarCheckOut(params: {
  registro: RegistroPontoRow
  plantao: PlantaoPontoHoje
  posicao: PosicaoGps
}): Promise<RegistroPontoRow> {
  const { distanciaMetros } = validarProximidadeHospital(params.posicao, params.plantao)
  const agora = new Date().toISOString()

  const { data, error } = await supabase
    .from('registro_ponto')
    .update({
      saida_em: agora,
      latitude_saida: params.posicao.latitude,
      longitude_saida: params.posicao.longitude,
      distancia_saida_metros: Math.round(distanciaMetros * 100) / 100,
      updated_at: agora,
    })
    .eq('id', params.registro.id)
    .select(COLUNAS_REGISTRO)
    .single()

  if (error) throw new Error(error.message)

  const { error: plantaoError } = await supabase
    .from('plantoes')
    .update({ status: 'realizado', updated_at: agora })
    .eq('id', params.plantao.id)

  if (plantaoError) {
    console.warn('Saída registada, mas falha ao atualizar plantão:', plantaoError.message)
  }

  return data as RegistroPontoRow
}

export function formatarHoraPlantao(hora: string): string {
  return hora.slice(0, 5)
}
