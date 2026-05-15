import type { Json } from '../../types/database.types'
import type {
  ProfissionalCompleto,
  ProfissionalAfastamento,
  ProfissionalContaBancaria,
  ProfissionalDetalhes,
  ProfissionalPeriodoContratacao,
} from '../../components/Profissionais/profissionalTypes'
import type { FormInformacoes } from '../../components/Profissionais/ProfissionalDetalhesModal'

export function defaultProfissionalDetalhes(siglaConselho: string): ProfissionalDetalhes {
  return {
    fotoUrl: null,
    siglaConselho,
    email: '',
    cpf: '',
    telefone: '',
    celular: '',
    rg: '',
    orgaoEmissor: '',
    dataNascimento: '',
    sexo: '',
    nomeMae: '',
    especialidade: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
    grupos: [],
    dadosBancarios: {
      banco: '',
      agencia: '',
      conta: '',
      tipoConta: '',
      pix: '',
    },
    contasBancarias: [],
    resumoFaturamento: '',
    contratacao: {
      regime: '',
      dataAdmissao: '',
      cargaHorariaSemanal: '',
      numeroContrato: '',
    },
    periodosContratacao: [],
    afastamentos: [],
    habilidades: [],
    anexos: [],
  }
}

export function mergeFormIntoDetalhes(
  current: ProfissionalCompleto,
  form: FormInformacoes,
): ProfissionalDetalhes {
  const d = current.detalhes
  return {
    ...d,
    email: form.email,
    telefone: form.telefone1,
    celular: form.telefone2,
    dataNascimento: form.dataNascimento,
    observacaoInterna: form.detalhesObservacao,
    cpf: form.cpf.trim(),
    faturamentoCnpj: form.faturamentoCnpj.trim(),
    faturamentoRazaoSocial: form.faturamentoRazaoSocial.trim(),
    faturamentoNomeFantasia: form.faturamentoNomeFantasia.trim(),
    endereco: {
      ...d.endereco,
      cep: form.enderecoCep,
      logradouro: form.enderecoRua,
      numero: form.enderecoNumero,
      bairro: form.enderecoBairro,
      complemento: form.enderecoComplemento,
      uf: form.enderecoUf,
      cidade: form.enderecoCidade,
    },
    contratacao: {
      ...d.contratacao,
      dataAdmissao: form.dataAdmissao,
      numeroContrato:
        form.codigo.trim() !== '' ? form.codigo : d.contratacao.numeroContrato,
    },
    periodosContratacao: form.periodosContratacao.map((p) => ({ ...p })),
    afastamentos: form.afastamentos.map((a) => ({ ...a })),
    contasBancarias: form.contasBancarias.map((c) => ({ ...c })),
  }
}

function normalizaPeriodosContratacao(
  raw: unknown,
): ProfissionalPeriodoContratacao[] {
  if (!Array.isArray(raw)) return []
  const out: ProfissionalPeriodoContratacao[] = []
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return
    const o = item as Record<string, unknown>
    const id =
      typeof o.id === 'string' && o.id.length > 0
        ? o.id
        : `periodo-${i}-${String(Math.random()).slice(2, 10)}`

    const temInicioFimOuComentario =
      'inicio' in o || 'fim' in o || 'comentario' in o

    if (temInicioFimOuComentario) {
      out.push({
        id,
        tipo: typeof o.tipo === 'string' ? o.tipo : '',
        inicio: typeof o.inicio === 'string' ? o.inicio : '',
        fim: typeof o.fim === 'string' ? o.fim : '',
        comentario: typeof o.comentario === 'string' ? o.comentario : '',
      })
      return
    }

    if (typeof o.periodo === 'string' && o.periodo.length > 0) {
      const periodo = o.periodo
      const partes = periodo.split(/\s*[–-]\s*/)
      const ini = partes[0]?.trim() ?? ''
      const fimP = partes.length > 1 ? partes.slice(1).join(' – ').trim() : ''
      out.push({
        id,
        tipo: typeof o.tipo === 'string' ? o.tipo : '',
        inicio: ini,
        fim: fimP,
        comentario: '',
      })
      return
    }

    out.push({
      id,
      tipo: typeof o.tipo === 'string' ? o.tipo : '',
      inicio: '',
      fim: '',
      comentario: '',
    })
  })
  return out
}

function normalizaAfastamentos(raw: unknown): ProfissionalAfastamento[] {
  if (!Array.isArray(raw)) return []
  const out: ProfissionalAfastamento[] = []
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return
    const o = item as Record<string, unknown>
    const id =
      typeof o.id === 'string' && o.id.length > 0
        ? o.id
        : `af-${i}-${String(Math.random()).slice(2, 10)}`

    if ('motivo' in o) {
      out.push({
        id,
        inicio: typeof o.inicio === 'string' ? o.inicio : '',
        fim: typeof o.fim === 'string' ? o.fim : '',
        tipo: typeof o.motivo === 'string' ? o.motivo : '',
        comentario: typeof o.comentario === 'string' ? o.comentario : '',
      })
      return
    }

    if ('periodo' in o && typeof o.periodo === 'string' && o.periodo.length > 0) {
      const periodo = o.periodo
      const partes = periodo.split(/\s*[–-]\s*/)
      const ini = partes[0]?.trim() ?? ''
      const fimP = partes.length > 1 ? partes.slice(1).join(' – ').trim() : ''
      out.push({
        id,
        inicio: ini,
        fim: fimP,
        tipo: typeof o.tipo === 'string' ? o.tipo : '',
        comentario: typeof o.comentario === 'string' ? o.comentario : '',
      })
      return
    }

    out.push({
      id,
      inicio: typeof o.inicio === 'string' ? o.inicio : '',
      fim: typeof o.fim === 'string' ? o.fim : '',
      tipo: typeof o.tipo === 'string' ? o.tipo : '',
      comentario: typeof o.comentario === 'string' ? o.comentario : '',
    })
  })
  return out
}

function normalizaContasBancarias(raw: unknown): ProfissionalContaBancaria[] {
  if (!Array.isArray(raw)) return []
  const out: ProfissionalContaBancaria[] = []
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return
    const o = item as Record<string, unknown>
    let tornarPrincipal: 'Sim' | 'Não' = 'Sim'
    if (o.tornarPrincipal === 'Não' || o.tornarPrincipal === false) tornarPrincipal = 'Não'
    else if (o.tornarPrincipal === 'Sim' || o.tornarPrincipal === true) tornarPrincipal = 'Sim'
    out.push({
      id:
        typeof o.id === 'string' && o.id.length > 0
          ? o.id
          : `conta-${i}-${String(Math.random()).slice(2, 10)}`,
      tipo: typeof o.tipo === 'string' ? o.tipo : '',
      tornarPrincipal,
    })
  })
  return out
}

function mergeDetalhes(
  sigla: string,
  raw: unknown,
): ProfissionalDetalhes {
  const base = defaultProfissionalDetalhes(sigla)
  if (!raw || typeof raw !== 'object') return base
  const j = raw as Record<string, unknown>
  return {
    ...base,
    ...j,
    siglaConselho: typeof j.siglaConselho === 'string' ? j.siglaConselho : sigla,
    endereco: {
      ...base.endereco,
      ...(typeof j.endereco === 'object' && j.endereco !== null
        ? (j.endereco as ProfissionalDetalhes['endereco'])
        : {}),
    },
    dadosBancarios: {
      ...base.dadosBancarios,
      ...(typeof j.dadosBancarios === 'object' && j.dadosBancarios !== null
        ? (j.dadosBancarios as ProfissionalDetalhes['dadosBancarios'])
        : {}),
    },
    contasBancarias:
      j.contasBancarias !== undefined
        ? normalizaContasBancarias(j.contasBancarias)
        : base.contasBancarias,
    contratacao: {
      ...base.contratacao,
      ...(typeof j.contratacao === 'object' && j.contratacao !== null
        ? (j.contratacao as ProfissionalDetalhes['contratacao'])
        : {}),
    },
    periodosContratacao:
      j.periodosContratacao !== undefined
        ? normalizaPeriodosContratacao(j.periodosContratacao)
        : base.periodosContratacao,
    grupos: Array.isArray(j.grupos)
      ? (j.grupos as ProfissionalDetalhes['grupos'])
      : base.grupos,
    afastamentos: Array.isArray(j.afastamentos)
      ? normalizaAfastamentos(j.afastamentos)
      : base.afastamentos,
    habilidades: Array.isArray(j.habilidades)
      ? (j.habilidades as ProfissionalDetalhes['habilidades'])
      : base.habilidades,
    anexos: Array.isArray(j.anexos)
      ? (j.anexos as ProfissionalDetalhes['anexos'])
      : base.anexos,
    observacaoInterna:
      typeof j.observacaoInterna === 'string' ? j.observacaoInterna : base.observacaoInterna,
    faturamentoCnpj:
      typeof j.faturamentoCnpj === 'string'
        ? j.faturamentoCnpj
        : base.faturamentoCnpj,
    faturamentoRazaoSocial:
      typeof j.faturamentoRazaoSocial === 'string'
        ? j.faturamentoRazaoSocial
        : base.faturamentoRazaoSocial,
    faturamentoNomeFantasia:
      typeof j.faturamentoNomeFantasia === 'string'
        ? j.faturamentoNomeFantasia
        : base.faturamentoNomeFantasia,
  }
}

export type ProfissionalSetorJoin = {
  setor_id: string
  setores: { nome: string } | null
}

export type ProfissionalQueryRow = {
  id: string
  user_id: string
  nome: string
  profissao: string
  sigla_conselho: string
  conselho_numero: string
  registro_uf: string
  email: string | null
  telefone: string | null
  cpf: string | null
  local_id: string | null
  detalhes: Json
  created_at: string
  updated_at: string
  locais: { nome_fantasia: string } | null
  profissional_setores: ProfissionalSetorJoin[] | null
}

export function mapRowToProfissionalCompleto(row: ProfissionalQueryRow): ProfissionalCompleto {
  const registroProfissional = `${row.conselho_numero?.trim() || ''}/${row.registro_uf?.trim() || '—'}`
  const localNome = row.locais?.nome_fantasia?.trim() || '—'
  const setorIdsVinculados =
    row.profissional_setores
      ?.map((ps) => ps.setor_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? []
  const setores =
    row.profissional_setores
      ?.map((ps) => ps.setores?.nome?.trim())
      .filter((n): n is string => Boolean(n)) ?? []

  const detalhes = mergeDetalhes(row.sigla_conselho, row.detalhes)
  detalhes.siglaConselho = row.sigla_conselho
  detalhes.email = row.email ?? detalhes.email
  detalhes.telefone = row.telefone ?? detalhes.telefone
  detalhes.cpf = row.cpf ?? detalhes.cpf

  return {
    id: row.id,
    nome: row.nome,
    profissao: row.profissao,
    registroProfissional,
    localId: row.local_id,
    localNome,
    setores: setores.length ? setores : ['—'],
    setorIdsVinculados,
    detalhes,
  }
}

export function detalhesToJson(d: ProfissionalDetalhes): Json {
  return JSON.parse(JSON.stringify(d)) as Json
}
