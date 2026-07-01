import { supabase } from '../supabase'
import { permissoesPadraoVisualizador } from './visualizadorTypes'

export type CriarAcessoVisualizadorInput = {
  email: string
  nome: string
  permissoes: Record<string, boolean>
}

export type CriarAcessoVisualizadorResult = {
  authUserId: string
  senhaInicial?: string
  mensagem: string
}

export async function criarAcessoVisualizador(
  input: CriarAcessoVisualizadorInput,
): Promise<CriarAcessoVisualizadorResult> {
  const permissoes = {
    ...permissoesPadraoVisualizador(),
    ...input.permissoes,
  }

  const { data, error } = await supabase.functions.invoke('create-professional-access', {
    body: {
      role: 'visualizador',
      email: input.email.trim().toLowerCase(),
      nome: input.nome.trim(),
      permissoes,
    },
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível criar o acesso.')
  }

  const payload = data as { error?: string } & Partial<CriarAcessoVisualizadorResult>
  if (payload?.error) throw new Error(payload.error)
  if (!payload?.authUserId) throw new Error('Resposta inválida ao criar acesso.')

  return {
    authUserId: payload.authUserId,
    senhaInicial: payload.senhaInicial,
    mensagem: payload.mensagem ?? 'Acesso criado com sucesso.',
  }
}
