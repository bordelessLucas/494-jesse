import forge from 'node-forge'

function abrirPkcs12(buffer: ArrayBuffer, senha: string) {
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

function obterPrimeiroCertificado(pkcs12: forge.pkcs12.Pkcs12Pfx) {
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
export function extrairTitularCertificadoPfx(
  buffer: ArrayBuffer,
  senha: string,
): string {
  const pkcs12 = abrirPkcs12(buffer, senha)
  const cert = obterPrimeiroCertificado(pkcs12)
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
export function extrairValidadeCertificadoPfx(
  buffer: ArrayBuffer,
  senha: string,
): Date {
  const pkcs12 = abrirPkcs12(buffer, senha)
  const cert = obterPrimeiroCertificado(pkcs12)

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
