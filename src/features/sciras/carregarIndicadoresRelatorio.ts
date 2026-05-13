import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import type { IndicadorCirurgico, IndicadorUti } from './types'

type RowUti = Database['public']['Tables']['sciras_indicadores_uti']['Row']
type RowCir =
  Database['public']['Tables']['sciras_indicadores_cirurgicos']['Row']

function rowUtiParaDominio(row: RowUti): IndicadorUti {
  return {
    id: row.id,
    mesCompetencia: row.mes_competencia.slice(0, 7),
    setor: row.setor,
    totalPacientesDia: Number(row.total_pacientes_dia),
    usuariosAcompanhadosBuscaAtiva: row.usuarios_acompanhados_busca_ativa,
    taxaBuscaAtiva: Number(row.taxa_busca_ativa),
  }
}

function rowCirParaDominio(row: RowCir): IndicadorCirurgico {
  return {
    id: row.id,
    mesCompetencia: row.mes_competencia.slice(0, 7),
    totalCirurgias: row.total_cirurgias,
    totalCirurgiasLimpas: row.total_cirurgias_limpas,
    numInfeccoesCirurgiasLimpas: row.num_infeccoes_cirurgias_limpas,
    taxaInfeccao: Number(row.taxa_infeccao),
  }
}

/**
 * Carrega indicadores SCIRAS guardados para o mês indicado (utilizador da sessão).
 * UTI: preferência pela linha cujo `setor` coincide com `setorUtiPreferido`,
 * caso contrário a primeira linha devolvida.
 */
export async function carregarIndicadoresParaRelatorio(
  mesCompetenciaYYYYMM: string,
  setorUtiPreferido: string,
): Promise<{
  indicadorUti: IndicadorUti | null
  indicadorCirurgico: IndicadorCirurgico | null
}> {
  if (!/^\d{4}-\d{2}$/.test(mesCompetenciaYYYYMM)) {
    return { indicadorUti: null, indicadorCirurgico: null }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session?.user) {
    return { indicadorUti: null, indicadorCirurgico: null }
  }

  const mesSql = `${mesCompetenciaYYYYMM}-01`

  const [resUti, resCir] = await Promise.all([
    supabase
      .from('sciras_indicadores_uti')
      .select('*')
      .eq('mes_competencia', mesSql),
    supabase
      .from('sciras_indicadores_cirurgicos')
      .select('*')
      .eq('mes_competencia', mesSql)
      .maybeSingle(),
  ])

  let indicadorUti: IndicadorUti | null = null
  const listaUti = resUti.data
  if (listaUti?.length) {
    const correspondente = listaUti.find((r) => r.setor === setorUtiPreferido)
    const escolhido = correspondente ?? listaUti[0]
    indicadorUti = rowUtiParaDominio(escolhido)
  }

  const indicadorCirurgico =
    resCir.data && !resCir.error ? rowCirParaDominio(resCir.data) : null

  return { indicadorUti, indicadorCirurgico }
}
