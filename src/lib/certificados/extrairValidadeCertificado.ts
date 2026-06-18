type ForgeModule = typeof import('node-forge')

let forgePromise: Promise<ForgeModule> | null = null

function carregarForge(): Promise<ForgeModule> {
  if (!forgePromise) {
    forgePromise = import('node-forge').then((mod) => mod.default)
  }
  return forgePromise
}

async function abrirPkcs12(buffer: ArrayBuffer, senha: string) {
  const forge = await carregarForge()

  if (!senha.trim()) {
    throw new Error('Informe o PIN/senha do certificado.')
  }

  try {
    const bytes = new Uint8Array(buffer)
    const binary = forge.util.binary.raw.encode(bytes)
    const asn1 = forge.asn1.fromDer(binary)
    return forge.pkcs12.pkcs12FromAsn1(asn1, false, senha)
  } catch {
    throw new Error(
      'Não foi possível ler o certificado. Verifique o ficheiro (.pfx/.p12) e o PIN informado.',
    )
  }
}

async function obterPrimeiroCertificado(
  pkcs12: Awaited<ReturnType<typeof abrirPkcs12>>,
) {
  const forge = await carregarForge()
  const bags = pkcs12.getBags({ bagType: forge.pki.oids.certBag })
  const certBags = bags[forge.pki.oids.certBag] ?? []

  for (const bag of certBags) {
    if (bag.cert) return bag.cert
  }

  return null
}

/**
 * Extrai o Common Name (CN) do titular do certificado ICP-Brasil.
 */
export async function extrairTitularCertificadoPfx(
  buffer: ArrayBuffer,
  senha: string,
): Promise<string> {
  const pkcs12 = await abrirPkcs12(buffer, senha)
  const cert = await obterPrimeiroCertificado(pkcs12)
  if (!cert) {
    throw new Error('Nenhum certificado válido encontrado no ficheiro.')
  }

  const cn = cert.subject.getField('CN')
  return cn ? String(cn.value).trim() : ''
}

/**
 * Extrai a data de expiração do certificado a partir de um ficheiro PKCS#12.
 * Valida o PIN ao decifrar o contentor.
 */
export async function extrairValidadeCertificadoPfx(
  buffer: ArrayBuffer,
  senha: string,
): Promise<Date> {
  const pkcs12 = await abrirPkcs12(buffer, senha)
  const cert = await obterPrimeiroCertificado(pkcs12)

  if (cert?.validity?.notAfter) {
    return cert.validity.notAfter
  }

  throw new Error('Nenhum certificado válido encontrado no ficheiro.')
}

export function certificadoEstaAtivo(validoAte: string | Date | null | undefined): boolean {
  if (!validoAte) return false
  const data = validoAte instanceof Date ? validoAte : new Date(validoAte)
  return !Number.isNaN(data.getTime()) && data.getTime() > Date.now()
}
