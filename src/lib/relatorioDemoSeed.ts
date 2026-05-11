import {
  celulaTurnoMock,
  diasAmostra,
  indicadoresScihMock,
  ocorrenciasScihMock,
  profissionaisFrequenciaMock,
} from '../features/relatorios/mockDadosImpressao'
import { supabase } from './supabase'

export type CenarioPopularBanco =
  | ''
  | 'limpar'
  | 'uti_ped'
  | 'scih_freq'
  | 'scih_rel'
  | 'tudo'

async function obterUsuarioId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function limparDadosDemonstracaoRelatorio(): Promise<{
  error?: string
}> {
  const uid = await obterUsuarioId()
  if (!uid) {
    return { error: 'Faça login para alterar dados de demonstração.' }
  }

  const tabelas = [
    supabase.from('relatorio_demo_frequencia').delete().eq('user_id', uid),
    supabase.from('relatorio_demo_scih_indicador').delete().eq('user_id', uid),
    supabase.from('relatorio_demo_scih_ocorrencia').delete().eq('user_id', uid),
  ] as const

  for (const op of tabelas) {
    const { error } = await op
    if (error) {
      return { error: error.message }
    }
  }
  return {}
}

function linhasFrequencia(
  userId: string,
  competencia: string,
  setor: 'UTI_PED' | 'SCIH',
  offsetProf: number,
) {
  const linhas: {
    user_id: string
    setor: 'UTI_PED' | 'SCIH'
    competencia: string
    profissional_nome: string
    dia: number
    turno: string
  }[] = []

  profissionaisFrequenciaMock.forEach((nome, pi) => {
    diasAmostra.forEach((dia, di) => {
      linhas.push({
        user_id: userId,
        setor,
        competencia,
        profissional_nome: nome,
        dia,
        turno: celulaTurnoMock(pi + offsetProf, di),
      })
    })
  })
  return linhas
}

/** Datas ISO alinhadas ao mock textual de ocorrências (março/2026). */
const OCORRENCIAS_ISO = [
  { data: '2026-03-05', tipo: 'Intercorrência clínica', resumo: ocorrenciasScihMock[0]!.resumo },
  { data: '2026-03-12', tipo: 'Segurança do paciente', resumo: ocorrenciasScihMock[1]!.resumo },
  { data: '2026-03-18', tipo: 'Recursos humanos', resumo: ocorrenciasScihMock[2]!.resumo },
] as const

export async function popularCenarioRelatorio(
  cenario: CenarioPopularBanco,
  competenciaPrimeiroDiaIso: string,
): Promise<{ error?: string }> {
  const cenarioStr = cenario as string
  if (!cenarioStr) {
    return {}
  }

  const uid = await obterUsuarioId()
  if (!uid) {
    return { error: 'Faça login para popular dados de demonstração.' }
  }

  if (cenario === 'limpar') {
    return limparDadosDemonstracaoRelatorio()
  }

  const limp = await limparDadosDemonstracaoRelatorio()
  if (limp.error) {
    return limp
  }

  const competencia = competenciaPrimeiroDiaIso

  try {
    if (cenario === 'uti_ped' || cenario === 'tudo') {
      const rows = linhasFrequencia(uid, competencia, 'UTI_PED', 0)
      const { error } = await supabase.from('relatorio_demo_frequencia').insert(rows)
      if (error) return { error: error.message }
    }

    if (cenario === 'scih_freq' || cenario === 'tudo') {
      const rows = linhasFrequencia(uid, competencia, 'SCIH', 2)
      const { error } = await supabase.from('relatorio_demo_frequencia').insert(rows)
      if (error) return { error: error.message }
    }

    if (cenario === 'scih_rel' || cenario === 'tudo') {
      const indRows = indicadoresScihMock.map((row) => ({
        user_id: uid,
        competencia,
        indicador: row.indicador,
        valor: row.valor,
      }))
      const { error: e1 } = await supabase
        .from('relatorio_demo_scih_indicador')
        .insert(indRows)
      if (e1) return { error: e1.message }

      const occRows = OCORRENCIAS_ISO.map((row) => ({
        user_id: uid,
        competencia,
        data_ocorrencia: row.data,
        tipo: row.tipo,
        resumo: row.resumo,
      }))
      const { error: e2 } = await supabase
        .from('relatorio_demo_scih_ocorrencia')
        .insert(occRows)
      if (e2) return { error: e2.message }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao inserir dados.'
    return { error: msg }
  }

  return {}
}
