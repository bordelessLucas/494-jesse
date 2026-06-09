export type EnderecoViaCep = {
  cep: string
  rua: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export function normalizarCepDigitos(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8)
}

export function formatarCepVisual(cep: string): string {
  const digitos = normalizarCepDigitos(cep)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

/** Consulta endereço pelo CEP usando a API gratuita ViaCEP. */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep> {
  const digitos = normalizarCepDigitos(cep)
  if (digitos.length !== 8) {
    throw new Error('Informe um CEP com 8 dígitos.')
  }

  const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
  if (!resposta.ok) {
    throw new Error('Não foi possível consultar o CEP. Tente novamente.')
  }

  const dados = (await resposta.json()) as ViaCepResponse
  if (dados.erro) {
    throw new Error('CEP não encontrado.')
  }

  return {
    cep: formatarCepVisual(dados.cep ?? digitos),
    rua: dados.logradouro?.trim() ?? '',
    complemento: dados.complemento?.trim() ?? '',
    bairro: dados.bairro?.trim() ?? '',
    cidade: dados.localidade?.trim() ?? '',
    uf: (dados.uf ?? '').trim().toUpperCase(),
  }
}
