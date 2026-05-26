import { supabase } from '../supabase'

export type CriarAcessoProfissionalInput = {
  profissionalId: string
  email: string
  nome: string
  permissoes: Record<string, boolean>
}

export type CriarAcessoProfissionalResult = {
  authUserId: string
  senhaInicial?: string
  mensagem: string
}

export async function criarAcessoProfissional(
  input: CriarAcessoProfissionalInput,
): Promise<CriarAcessoProfissionalResult> {
  const { data, error } = await supabase.functions.invoke('create-professional-access', {
    body: {
      profissionalId: input.profissionalId,
      email: input.email.trim().toLowerCase(),
      nome: input.nome.trim(),
      permissoes: input.permissoes,
    },
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível criar o acesso.')
  }

  const payload = data as { error?: string } & Partial<CriarAcessoProfissionalResult>
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
