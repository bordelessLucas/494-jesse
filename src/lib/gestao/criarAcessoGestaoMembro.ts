import { supabase } from '../supabase'
import type { PerfilGestaoMembro } from './gestaoMembroAcessoTypes'
import { permissoesPadraoPorPerfil, roleContaMembroPorPerfil } from './gestaoMembroAcessoTypes'

export type CriarAcessoGestaoMembroInput = {
  perfil: PerfilGestaoMembro
  email: string
  nome: string
  permissoes: Record<string, boolean>
  profissionalId?: string
}

export type CriarAcessoGestaoMembroResult = {
  authUserId: string
  senhaInicial?: string
  mensagem: string
}

export async function criarAcessoGestaoMembro(
  input: CriarAcessoGestaoMembroInput,
): Promise<CriarAcessoGestaoMembroResult> {
  const role = roleContaMembroPorPerfil(input.perfil)
  const permissoes = {
    ...permissoesPadraoPorPerfil(input.perfil),
    ...input.permissoes,
  }

  const body: Record<string, unknown> = {
    role,
    email: input.email.trim().toLowerCase(),
    nome: input.nome.trim(),
    permissoes,
  }

  if (input.profissionalId?.trim()) {
    body.profissionalId = input.profissionalId.trim()
  }

  const { data, error } = await supabase.functions.invoke('create-professional-access', {
    body,
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível criar o acesso.')
  }

  const payload = data as { error?: string } & Partial<CriarAcessoGestaoMembroResult>
  if (payload?.error) {
    throw new Error(payload.error)
  }

  if (!payload?.authUserId) {
    throw new Error('Resposta inválida ao criar acesso.')
  }

  return {
    authUserId: payload.authUserId,
    senhaInicial: payload.senhaInicial,
    mensagem: payload.mensagem ?? 'Acesso criado com sucesso.',
  }
}
