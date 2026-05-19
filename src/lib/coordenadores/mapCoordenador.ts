import type { Json } from '../../types/database.types'
import type {
  CoordenadorCompleto,
  CoordenadorDetalhes,
  FormCoordenador,
} from '../../components/Coordenadores/coordenadorTypes'
import { PERMISSOES_COORDENADOR } from '../../components/Coordenadores/coordenadorTypes'
import type { ProfissionalGrupoParticipacao } from '../../components/Profissionais/profissionalTypes'

import { defaultProfissionalDetalhes } from '../profissionais/mapProfissional'

const chavesPermissoes = PERMISSOES_COORDENADOR.map((p) => p.key)

export function padraoCoordenadorDetalhes(): CoordenadorDetalhes {
  const base = defaultProfissionalDetalhes('CRM')
  const permissoes = Object.fromEntries(
    chavesPermissoes.map((key) => [key, false]),
  ) as CoordenadorDetalhes['permissoes']
  return {
    endereco: { ...base.endereco },
    grupos: [],
    permissoes,
    areasNotas: '',
  }
}

/** Rascunho vazio antes do insert (`id` ausente até gravar na base). */
export function novoCoordenadorRascunho(): CoordenadorCompleto {
  return {
    id: '',
    nome: '',
    email: '',
    telefone: null,
    telefone2: null,
    localId: null,
    localNome: '—',
    setores: [],
    setorIdsVinculados: [],
    nomesGruposLista: [],
    detalhes: padraoCoordenadorDetalhes(),
  }
}

export type CoordenadorSetorJoin = {
  setor_id: string
  setores: {
    nome: string
    locais: { nome_fantasia: string } | null
  } | null
}

function nomeFantasiaDosSetoresVinculados(
  juncoes: CoordenadorSetorJoin[] | null,
): string[] {
  const unicos = new Set<string>()
  for (const j of juncoes ?? []) {
    const n = j.setores?.locais?.nome_fantasia?.trim()
    if (n) unicos.add(n)
  }
  return [...unicos]
}

function rotulosGrupoPorVinculos(juncoes: CoordenadorSetorJoin[] | null): string[] {
  const vistos = new Set<string>()
  const rotulos: string[] = []
  for (const ps of juncoes ?? []) {
    const nf = ps.setores?.locais?.nome_fantasia?.trim() ?? ''
    const setorN = ps.setores?.nome?.trim() ?? ''
    if (!setorN) continue
    const rotulo = nf ? `${nf} › ${setorN}` : setorN
    if (vistos.has(rotulo)) continue
    vistos.add(rotulo)
    rotulos.push(rotulo)
  }
  return rotulos.sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function mergeDetalhesCoordenador(raw: unknown): CoordenadorDetalhes {
  const base = padraoCoordenadorDetalhes()
  if (!raw || typeof raw !== 'object') return base
  const j = raw as Record<string, unknown>
  const permissoes: CoordenadorDetalhes['permissoes'] = { ...base.permissoes }
  const rawPerm =
    typeof j.permissoes === 'object' && j.permissoes !== null
      ? (j.permissoes as Record<string, unknown>)
      : {}
  chavesPermissoes.forEach((key) => {
    if (key in rawPerm) permissoes[key] = Boolean(rawPerm[key])
  })

  let grupos: ProfissionalGrupoParticipacao[] = base.grupos
  if (Array.isArray(j.grupos)) {
    grupos = j.grupos as ProfissionalGrupoParticipacao[]
  }

  return {
    ...base,
    endereco:
      typeof j.endereco === 'object' && j.endereco !== null
        ? { ...base.endereco, ...(j.endereco as CoordenadorDetalhes['endereco']) }
        : base.endereco,
    grupos,
    permissoes,
    areasNotas: typeof j.areasNotas === 'string' ? j.areasNotas : base.areasNotas,
    observacaoInterna:
      typeof j.observacaoInterna === 'string' ? j.observacaoInterna : base.observacaoInterna,
  }
}

export type CoordenadorQueryRow = {
  id: string
  user_id: string
  nome: string
  email: string | null
  telefone: string | null
  telefone2: string | null
  local_id: string | null
  detalhes: Json
  created_at: string
  updated_at: string
  locais: { nome_fantasia: string } | null
  coordenador_setores: CoordenadorSetorJoin[] | null
}

export function detalhesCoordenadorParaJson(d: CoordenadorDetalhes): Json {
  return JSON.parse(JSON.stringify(d)) as Json
}

export function mergeFormCoordenador(
  atual: CoordenadorCompleto,
  form: FormCoordenador,
): CoordenadorDetalhes {
  const prev = atual.detalhes
  const permissoes: CoordenadorDetalhes['permissoes'] = { ...prev.permissoes }
  PERMISSOES_COORDENADOR.forEach(({ key }) => {
    permissoes[key] = Boolean(form.permissoes[key])
  })

  return {
    ...prev,
    permissoes,
    areasNotas: form.areasNotas.trim(),
    endereco: {
      ...prev.endereco,
      cep: form.enderecoCep,
      logradouro: form.enderecoRua,
      numero: form.enderecoNumero,
      complemento: form.enderecoComplemento,
      bairro: form.enderecoBairro,
      uf: form.enderecoUf,
      cidade: form.enderecoCidade,
    },
  }
}

export function mapRowToCoordenadorCompleto(row: CoordenadorQueryRow): CoordenadorCompleto {
  const nomeLocalFk = row.locais?.nome_fantasia?.trim() ?? ''
  const locaisViaSetores = nomeFantasiaDosSetoresVinculados(row.coordenador_setores).sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  )
  const localNome =
    nomeLocalFk ||
    (locaisViaSetores.length ? locaisViaSetores.join(', ') : '') ||
    '—'

  const setoresNomes =
    row.coordenador_setores
      ?.map((ps) => ps.setores?.nome?.trim())
      .filter((n): n is string => Boolean(n)) ?? []
  const setorIds =
    row.coordenador_setores
      ?.map((ps) => ps.setor_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? []

  const detalhes = mergeDetalhesCoordenador(row.detalhes)

  const nomesMetadatosGrupo = detalhes.grupos
    .map((g) => g.nome.trim())
    .filter((nome) => nome.length > 0)
  const nomesGruposListaBase =
    nomesMetadatosGrupo.length > 0
      ? nomesMetadatosGrupo
      : rotulosGrupoPorVinculos(row.coordenador_setores)
  const nomesGruposLista = nomesGruposListaBase.length ? nomesGruposListaBase : ['—']

  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    telefone2: row.telefone2,
    localId: row.local_id,
    localNome,
    setores: setoresNomes.length ? setoresNomes : ['—'],
    setorIdsVinculados: setorIds,
    nomesGruposLista,
    detalhes,
  }
}
