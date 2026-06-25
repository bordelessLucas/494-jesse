import {
  buscarArtigosAtivos,
  buscarFluxoComOpcoes,
  buscarFluxoPorId,
  buscarFluxoPorSlug,
  buscarOpcaoFluxo,
  atualizarConversa,
  inserirMensagem,
} from './suporte.db'
import type {
  ResultadoInteracaoSuporte,
  SuporteConversa,
  SuporteFluxoOpcao,
  SuporteMensagem,
} from '../domain/suporte.types'

const SLUG_FLUXO_RAIZ = 'raiz'

export async function obterFluxoRaizId(): Promise<string> {
  const fluxo = await buscarFluxoPorSlug(SLUG_FLUXO_RAIZ)
  if (!fluxo) {
    throw new Error('Fluxo raiz de suporte não configurado. Aplique a migration de suporte.')
  }
  return fluxo.id
}

/** Mensagem inicial do sistema ao criar conversa. */
export async function enviarMensagemInicialFluxo(
  conversa: SuporteConversa,
): Promise<{ mensagem: SuporteMensagem; opcoes: SuporteFluxoOpcao[] }> {
  const fluxoId = conversa.fluxoAtualId ?? (await obterFluxoRaizId())
  const fluxo = await buscarFluxoComOpcoes(fluxoId)
  if (!fluxo) throw new Error('Fluxo de suporte não encontrado.')

  const mensagem = await inserirMensagem({
    conversaId: conversa.id,
    autorTipo: 'sistema',
    texto: fluxo.mensagem,
  })

  return { mensagem, opcoes: fluxo.tipo === 'menu' ? fluxo.opcoes : [] }
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** FAQ por palavra-chave — sem IA, apenas includes. */
export async function buscarArtigoPorTexto(
  texto: string,
): Promise<{ titulo: string; conteudo: string } | null> {
  const norm = normalizarTexto(texto)
  if (!norm.trim()) return null

  const artigos = await buscarArtigosAtivos()
  for (const artigo of artigos) {
    const termos = [
      artigo.titulo,
      ...artigo.palavrasChave,
    ].map(normalizarTexto)

    if (termos.some((t) => norm.includes(t) || t.includes(norm))) {
      return { titulo: artigo.titulo, conteudo: artigo.conteudo }
    }
  }
  return null
}

async function aplicarProximoFluxo(
  conversa: SuporteConversa,
  proximoFluxoId: string,
): Promise<ResultadoInteracaoSuporte> {
  const proximo = await buscarFluxoPorId(proximoFluxoId)
  if (!proximo) throw new Error('Próximo passo do fluxo não encontrado.')

  let status = conversa.status
  let encaminhouParaHumano = false
  let encerrouFluxo = false

  if (proximo.tipo === 'abrir_ticket') {
    status = 'aberta'
    encaminhouParaHumano = true
  } else if (proximo.tipo === 'resposta_final') {
    status = 'aguardando_usuario'
    encerrouFluxo = true
  } else {
    status = 'aguardando_usuario'
  }

  const conversaAtualizada = await atualizarConversa(conversa.id, {
    status,
    fluxoAtualId: proximo.id,
  })

  const msgSistema = await inserirMensagem({
    conversaId: conversa.id,
    autorTipo: 'sistema',
    texto: proximo.mensagem,
  })

  let opcoes: SuporteFluxoOpcao[] = []
  if (proximo.tipo === 'menu') {
    const comOpcoes = await buscarFluxoComOpcoes(proximo.id)
    opcoes = comOpcoes?.opcoes ?? []
  } else if (!encerrouFluxo && !encaminhouParaHumano) {
    opcoes = []
  }

  // Após resposta final, oferece retorno ao menu raiz.
  if (encerrouFluxo) {
    const raiz = await buscarFluxoComOpcoes(await obterFluxoRaizId())
    opcoes = raiz?.opcoes ?? []
  }

  return {
    conversa: conversaAtualizada,
    mensagensNovas: [msgSistema],
    opcoesAtuais: opcoes,
    encaminhouParaHumano,
    encerrouFluxo,
  }
}

export async function processarOpcaoFluxo(params: {
  conversa: SuporteConversa
  opcaoId: string
  usuarioId: string
}): Promise<ResultadoInteracaoSuporte> {
  const opcao = await buscarOpcaoFluxo(params.opcaoId)
  if (!opcao) throw new Error('Opção inválida.')

  const msgUsuario = await inserirMensagem({
    conversaId: params.conversa.id,
    autorTipo: 'usuario',
    autorId: params.usuarioId,
    texto: opcao.label,
    fluxoOpcaoId: opcao.id,
  })

  if (!opcao.proximoFluxoId) {
    throw new Error('Opção sem próximo fluxo configurado.')
  }

  const resultado = await aplicarProximoFluxo(params.conversa, opcao.proximoFluxoId)
  return {
    ...resultado,
    mensagensNovas: [msgUsuario, ...resultado.mensagensNovas],
  }
}

export async function processarTextoLivre(params: {
  conversa: SuporteConversa
  texto: string
  usuarioId: string
}): Promise<ResultadoInteracaoSuporte> {
  const texto = params.texto.trim()
  if (!texto) {
    throw new Error('Mensagem vazia.')
  }

  const msgUsuario = await inserirMensagem({
    conversaId: params.conversa.id,
    autorTipo: 'usuario',
    autorId: params.usuarioId,
    texto,
  })

  // Se já está com humano, apenas registra a mensagem.
  if (params.conversa.status === 'aberta') {
    return {
      conversa: params.conversa,
      mensagensNovas: [msgUsuario],
      opcoesAtuais: [],
      encaminhouParaHumano: false,
      encerrouFluxo: false,
    }
  }

  const artigo = await buscarArtigoPorTexto(texto)
  if (artigo) {
    const msgSistema = await inserirMensagem({
      conversaId: params.conversa.id,
      autorTipo: 'sistema',
      texto: `**${artigo.titulo}**\n\n${artigo.conteudo}`,
    })
    const raiz = await buscarFluxoComOpcoes(await obterFluxoRaizId())
    return {
      conversa: params.conversa,
      mensagensNovas: [msgUsuario, msgSistema],
      opcoesAtuais: raiz?.opcoes ?? [],
      encaminhouParaHumano: false,
      encerrouFluxo: false,
    }
  }

  const conversaAtualizada = await atualizarConversa(params.conversa.id, {
    status: 'aberta',
    fluxoAtualId: null,
  })

  const msgSistema = await inserirMensagem({
    conversaId: params.conversa.id,
    autorTipo: 'sistema',
    texto:
      'Não encontrei uma resposta automática. Encaminhei para um analista — você será atendido neste chat em breve.',
  })

  return {
    conversa: conversaAtualizada,
    mensagensNovas: [msgUsuario, msgSistema],
    opcoesAtuais: [],
    encaminhouParaHumano: true,
    encerrouFluxo: false,
  }
}

export async function responderComoAnalista(params: {
  conversa: SuporteConversa
  texto: string
  analistaId: string
}): Promise<SuporteMensagem> {
  const texto = params.texto.trim()
  if (!texto) throw new Error('Mensagem vazia.')

  await atualizarConversa(params.conversa.id, {
    status: params.conversa.status === 'resolvida' ? 'resolvida' : 'aguardando_usuario',
  })

  return inserirMensagem({
    conversaId: params.conversa.id,
    autorTipo: 'analista',
    autorId: params.analistaId,
    texto,
  })
}

export async function marcarConversaResolvida(
  conversaId: string,
): Promise<SuporteConversa> {
  return atualizarConversa(conversaId, {
    status: 'resolvida',
    fluxoAtualId: null,
  })
}

export async function carregarOpcoesAtuais(
  conversa: SuporteConversa,
): Promise<SuporteFluxoOpcao[]> {
  if (conversa.status === 'aberta' || conversa.status === 'resolvida') {
    return []
  }
  const fluxoId = conversa.fluxoAtualId ?? (await obterFluxoRaizId())
  const fluxo = await buscarFluxoComOpcoes(fluxoId)
  if (!fluxo || fluxo.tipo !== 'menu') {
    const raiz = await buscarFluxoComOpcoes(await obterFluxoRaizId())
    return raiz?.opcoes ?? []
  }
  return fluxo.opcoes
}
