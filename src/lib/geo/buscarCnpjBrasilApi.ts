export type EmpresaPorCnpj = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
}

export function normalizarCnpjDigitos(cnpj: string): string {
  return cnpj.replace(/\D/g, '').slice(0, 14)
}

export function formatarCnpjVisual(cnpj: string): string {
  const digitos = normalizarCnpjDigitos(cnpj)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`
}

type BrasilApiCnpjResponse = {
  cnpj?: string
  razao_social?: string
  nome_fantasia?: string
  message?: string
}

/** Consulta dados cadastrais pelo CNPJ usando a API gratuita BrasilAPI. */
export async function buscarEmpresaPorCnpj(cnpj: string): Promise<EmpresaPorCnpj> {
  const digitos = normalizarCnpjDigitos(cnpj)
  if (digitos.length !== 14) {
    throw new Error('Informe um CNPJ com 14 dígitos.')
  }

  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`)
  if (resposta.status === 404) {
    throw new Error('CNPJ não encontrado.')
  }
  if (!resposta.ok) {
    throw new Error('Não foi possível consultar o CNPJ. Tente novamente.')
  }

  const dados = (await resposta.json()) as BrasilApiCnpjResponse
  if (!dados.razao_social?.trim()) {
    throw new Error('CNPJ não encontrado ou sem razão social disponível.')
  }

  return {
    cnpj: formatarCnpjVisual(dados.cnpj ?? digitos),
    razaoSocial: dados.razao_social.trim(),
    nomeFantasia: dados.nome_fantasia?.trim() ?? '',
  }
}
