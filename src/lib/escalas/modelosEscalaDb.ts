import { supabase } from '../supabase'

export type TomModelo = 'util' | 'fds'

export type EscalaModeloRow = {
  id: string
  user_id: string
  local_id: string
  setor_id: string
  nome: string
  quantidade_semanas: number
  created_at?: string
  updated_at?: string
}

export type EscalaModeloItemRow = {
  id: string
  modelo_id: string
  semana_index: number
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  duracao_minutos: number | null
  tipo: TomModelo
  profissional_id: string | null
  profissionais?: { id: string; nome: string } | null
}

export function calcularDuracaoMinutos(horaInicio: string, horaFim: string): number {
  const parse = (s: string) => {
    const [h, m] = s.trim().slice(0, 5).split(':').map(Number)
    return (
      (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
    )
  }
  const a = parse(horaInicio)
  let b = parse(horaFim)
  if (b <= a) b += 24 * 60
  return b - a
}

export function formatarHoraModelo(v: string): string {
  const part = v.trim().slice(0, 5)
  return /^\d{2}:\d{2}$/.test(part) ? part : '08:00'
}

export async function listarModelosLocalSetor(
  userId: string,
  localId: string,
  setorId: string,
): Promise<EscalaModeloRow[]> {
  const { data, error } = await supabase
    .from('escala_modelos')
    .select('id, user_id, local_id, setor_id, nome, quantidade_semanas, created_at, updated_at')
    .eq('user_id', userId)
    .eq('local_id', localId)
    .eq('setor_id', setorId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as EscalaModeloRow[]
}

export async function criarEscalaModelo(
  userId: string,
  input: {
    local_id: string
    setor_id: string
    nome: string
    quantidade_semanas: number
  },
): Promise<EscalaModeloRow> {
  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from('escala_modelos')
    .insert({
      user_id: userId,
      local_id: input.local_id,
      setor_id: input.setor_id,
      nome: input.nome,
      quantidade_semanas: input.quantidade_semanas,
      updated_at: agora,
    })
    .select('id, user_id, local_id, setor_id, nome, quantidade_semanas, created_at, updated_at')
    .single()

  if (error) throw new Error(error.message)
  return data as EscalaModeloRow
}

export async function atualizarEscalaModelo(
  userId: string,
  modeloId: string,
  patch: Partial<
    Pick<EscalaModeloRow, 'nome' | 'quantidade_semanas' | 'local_id' | 'setor_id'>
  >,
): Promise<void> {
  const { error } = await supabase
    .from('escala_modelos')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', modeloId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function excluirEscalaModelo(
  userId: string,
  modeloId: string,
): Promise<void> {
  const { error } = await supabase
    .from('escala_modelos')
    .delete()
    .eq('id', modeloId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function listarItensModelo(
  userId: string,
  modeloId: string,
): Promise<EscalaModeloItemRow[]> {
  const { data, error } = await supabase
    .from('escala_modelo_itens')
    .select(
      `
      id,
      modelo_id,
      semana_index,
      dia_semana,
      hora_inicio,
      hora_fim,
      duracao_minutos,
      tipo,
      profissional_id,
      profissionais ( id, nome )
    `,
    )
    .eq('user_id', userId)
    .eq('modelo_id', modeloId)
    .order('semana_index', { ascending: true })
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as EscalaModeloItemRow[]
}

export async function inserirItemModelo(
  userId: string,
  input: {
    modelo_id: string
    semana_index: number
    dia_semana: number
    hora_inicio: string
    hora_fim: string
    tipo: TomModelo
    profissional_id: string | null
  },
): Promise<EscalaModeloItemRow> {
  const hi = formatarHoraModelo(input.hora_inicio)
  const hf = formatarHoraModelo(input.hora_fim)
  const duracao = calcularDuracaoMinutos(hi, hf)
  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from('escala_modelo_itens')
    .insert({
      user_id: userId,
      modelo_id: input.modelo_id,
      semana_index: input.semana_index,
      dia_semana: input.dia_semana,
      hora_inicio: hi,
      hora_fim: hf,
      duracao_minutos: duracao,
      tipo: input.tipo,
      profissional_id: input.profissional_id,
      updated_at: agora,
    })
    .select(
      `
      id,
      modelo_id,
      semana_index,
      dia_semana,
      hora_inicio,
      hora_fim,
      duracao_minutos,
      tipo,
      profissional_id,
      profissionais ( id, nome )
    `,
    )
    .single()

  if (error) throw new Error(error.message)
  return data as EscalaModeloItemRow
}

export async function atualizarItemModelo(
  userId: string,
  itemId: string,
  input: {
    semana_index: number
    dia_semana: number
    hora_inicio: string
    hora_fim: string
    tipo: TomModelo
    profissional_id: string | null
  },
): Promise<void> {
  const hi = formatarHoraModelo(input.hora_inicio)
  const hf = formatarHoraModelo(input.hora_fim)
  const duracao = calcularDuracaoMinutos(hi, hf)
  const { error } = await supabase
    .from('escala_modelo_itens')
    .update({
      semana_index: input.semana_index,
      dia_semana: input.dia_semana,
      hora_inicio: hi,
      hora_fim: hf,
      duracao_minutos: duracao,
      tipo: input.tipo,
      profissional_id: input.profissional_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function excluirItemModelo(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase
    .from('escala_modelo_itens')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

/** Após reduzir N semanas, remove itens fora do ciclo. */
export async function excluirItensSemanaIndexAcima(
  userId: string,
  modeloId: string,
  semanaMax: number,
): Promise<void> {
  const { error } = await supabase
    .from('escala_modelo_itens')
    .delete()
    .eq('modelo_id', modeloId)
    .eq('user_id', userId)
    .gt('semana_index', semanaMax)

  if (error) throw new Error(error.message)
}

export async function limparTodosItensModelo(userId: string, modeloId: string): Promise<void> {
  const { error } = await supabase
    .from('escala_modelo_itens')
    .delete()
    .eq('modelo_id', modeloId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

/** Duplica o cabeçalho e todos os itens do modelo (novo registo com nome distinto). */
export async function duplicarEscalaModelo(
  userId: string,
  modeloId: string,
  nomeNovo?: string,
): Promise<EscalaModeloRow> {
  const { data: origem, error: e1 } = await supabase
    .from('escala_modelos')
    .select(
      'id, user_id, local_id, setor_id, nome, quantidade_semanas, created_at, updated_at',
    )
    .eq('id', modeloId)
    .eq('user_id', userId)
    .single()

  if (e1) throw new Error(e1.message)
  if (!origem) throw new Error('Modelo não encontrado.')

  const nome =
    nomeNovo?.trim() ||
    `${origem.nome} (cópia ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })})`

  const novo = await criarEscalaModelo(userId, {
    local_id: origem.local_id,
    setor_id: origem.setor_id,
    nome,
    quantidade_semanas: origem.quantidade_semanas,
  })

  const itens = await listarItensModelo(userId, modeloId)
  for (const it of itens) {
    await inserirItemModelo(userId, {
      modelo_id: novo.id,
      semana_index: it.semana_index,
      dia_semana: it.dia_semana,
      hora_inicio: it.hora_inicio,
      hora_fim: it.hora_fim,
      tipo: it.tipo,
      profissional_id: it.profissional_id,
    })
  }

  return novo
}
