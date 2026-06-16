import { createClient } from 'npm:@supabase/supabase-js@2'
import { plainAddPlaceholder } from 'npm:@signpdf/placeholder-plain@3.2.4'
import { P12Signer } from 'npm:@signpdf/signer-p12@3.2.4'
import { SignPdf } from 'npm:@signpdf/signpdf@3.2.4'
import forge from 'npm:node-forge@1.3.1'
import { Buffer } from 'node:buffer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SERVICE_ROLE_SECRET = 'PLANTAOCHECK_SERVICE_ROLE_KEY'

type SignProfessionalDocumentBody = {
  relatorioId?: string
  profissionalId: string
  pdfBase64: string
  /** Metadados opcionais para criar o histórico se relatorioId não for enviado. */
  relatorioMeta?: {
    tipo_relatorio: string
    titulo: string
    competencia: string
    local_ref: string
    local_nome: string
    cabecalho: Record<string, unknown>
    snapshot: Record<string, unknown>
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get(SERVICE_ROLE_SECRET)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return json({ error: 'Configuração do servidor incompleta.' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user: caller },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !caller) {
      return json({ error: 'Sessão inválida.' }, 401)
    }

    const body = (await req.json()) as SignProfessionalDocumentBody
    const profissionalId = body.profissionalId?.trim()
    const pdfBase64 = body.pdfBase64?.trim()
    let relatorioId = body.relatorioId?.trim()

    if (!profissionalId || !pdfBase64) {
      return json(
        { error: 'profissionalId e pdfBase64 são obrigatórios.' },
        400,
      )
    }

    const { data: membroCaller } = await supabaseAdmin
      .from('contas_membros')
      .select('tenant_user_id, profissional_id')
      .eq('auth_user_id', caller.id)
      .maybeSingle()

    const tenantUserId = membroCaller?.tenant_user_id ?? caller.id
    const isTitular = !membroCaller

    if (membroCaller && membroCaller.profissional_id !== profissionalId) {
      return json(
        {
          error:
            'Profissionais só podem assinar relatórios com o próprio certificado digital.',
        },
        403,
      )
    }

    const { data: profissional, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('id, nome, user_id')
      .eq('id', profissionalId)
      .eq('user_id', tenantUserId)
      .maybeSingle()

    if (profError || !profissional) {
      return json({ error: 'Profissional não encontrado nesta conta.' }, 404)
    }

    const { data: certificado, error: certError } = await supabaseAdmin
      .from('certificados_profissionais')
      .select('certificado_url, senha_criptografada, valido_ate')
      .eq('profissional_id', profissionalId)
      .eq('tenant_user_id', tenantUserId)
      .maybeSingle()

    if (certError || !certificado) {
      return json(
        {
          error:
            'Nenhum certificado digital registado para este profissional. Configure em Meus dados.',
        },
        400,
      )
    }

    if (new Date(certificado.valido_ate).getTime() <= Date.now()) {
      return json(
        { error: 'O certificado digital deste profissional está expirado.' },
        400,
      )
    }

    if (!relatorioId) {
      if (!body.relatorioMeta) {
        return json(
          { error: 'relatorioId ou relatorioMeta são obrigatórios.' },
          400,
        )
      }

      const agora = new Date().toISOString()
      const { data: novoRelatorio, error: insertError } = await supabaseAdmin
        .from('relatorios_historico')
        .insert({
          user_id: tenantUserId,
          tipo_relatorio: body.relatorioMeta.tipo_relatorio,
          titulo: body.relatorioMeta.titulo,
          competencia: body.relatorioMeta.competencia,
          local_ref: body.relatorioMeta.local_ref,
          local_nome: body.relatorioMeta.local_nome,
          cabecalho: body.relatorioMeta.cabecalho,
          snapshot: body.relatorioMeta.snapshot,
          impresso_em: agora,
        })
        .select('id')
        .single()

      if (insertError || !novoRelatorio) {
        return json(
          { error: insertError?.message ?? 'Erro ao criar histórico do relatório.' },
          400,
        )
      }
      relatorioId = novoRelatorio.id
    } else {
      const { data: relatorio, error: relError } = await supabaseAdmin
        .from('relatorios_historico')
        .select('id, user_id')
        .eq('id', relatorioId)
        .maybeSingle()

      if (relError || !relatorio) {
        return json({ error: 'Relatório não encontrado.' }, 404)
      }

      if (relatorio.user_id !== tenantUserId) {
        return json({ error: 'Sem permissão para assinar este relatório.' }, 403)
      }
    }

    const { data: pfxBlob, error: downloadError } = await supabaseAdmin.storage
      .from('certificados_seguros')
      .download(certificado.certificado_url)

    if (downloadError || !pfxBlob) {
      return json(
        { error: 'Não foi possível obter o certificado digital do storage.' },
        500,
      )
    }

    const { data: pinPlano, error: decryptError } = await supabaseAdmin.rpc(
      'descriptografar_pin_certificado',
      { p_senha_criptografada: certificado.senha_criptografada },
    )

    if (decryptError || !pinPlano) {
      return json(
        { error: 'Falha ao descriptografar o PIN do certificado.' },
        500,
      )
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64')
    const p12Buffer = Buffer.from(await pfxBlob.arrayBuffer())
    const pinTexto = String(pinPlano)
    const titularCertificado =
      extrairTitularCertificado(p12Buffer, pinTexto) || profissional.nome

    const pdfComPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Assinatura digital ICP-Brasil — PlantaoCheck',
      contactInfo: 'PlantaoCheck',
      name: titularCertificado,
      location: 'Brasil',
    })

    const signer = new P12Signer(p12Buffer, { passphrase: pinTexto })
    const signedPdf = await new SignPdf().sign(pdfComPlaceholder, signer)

    const storagePath = `${tenantUserId}/${relatorioId}.pdf`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('relatorios_assinados')
      .upload(storagePath, signedPdf, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600',
      })

    if (uploadError) {
      return json(
        { error: `Falha ao guardar PDF assinado: ${uploadError.message}` },
        500,
      )
    }

    const assinadoEm = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('relatorios_historico')
      .update({
        pdf_assinado_url: storagePath,
        profissional_emissor_id: profissionalId,
        assinado_em: assinadoEm,
      })
      .eq('id', relatorioId)
      .eq('user_id', tenantUserId)

    if (updateError) {
      return json(
        { error: `PDF assinado gerado, mas falha ao atualizar histórico: ${updateError.message}` },
        500,
      )
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('relatorios_assinados')
      .getPublicUrl(storagePath)

    return json({
      relatorioId,
      pdfAssinadoUrl: publicUrlData.publicUrl,
      storagePath,
      assinadoEm,
      profissionalEmissor: profissional.nome,
      titularCertificado,
      isTitular,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno ao assinar documento.'
    console.error('sign-professional-document:', e)
    return json({ error: msg }, 500)
  }
})

function extrairTitularCertificado(p12Buffer: Buffer, pin: string): string {
  try {
    const der = forge.util.createBuffer(p12Buffer.toString('binary'))
    const asn1 = forge.asn1.fromDer(der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, pin)
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
    if (!cert) return ''
    const cn = cert.subject.getField('CN')
    return cn ? String(cn.value) : ''
  } catch {
    return ''
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
