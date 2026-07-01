import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import type { IndicadorUti } from './types'

type RowUti = Database['public']['Tables']['sciras_indicadores_uti']['Row']

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

/** Carrega indicador UTI guardado para o tenant, mês e setor indicados. */
export async function carregarIndicadorUtiGestao(
  tenantUserId: string,
  mesCompetenciaYYYYMM: string,
  setor: string,
): Promise<IndicadorUti | null> {
  if (!tenantUserId || !/^\d{4}-\d{2}$/.test(mesCompetenciaYYYYMM)) {
    return null
  }

  const mesSql = `${mesCompetenciaYYYYMM}-01`

  const { data, error } = await supabase
    .from('sciras_indicadores_uti')
    .select('*')
    .eq('user_id', tenantUserId)
    .eq('mes_competencia', mesSql)
    .eq('setor', setor)
    .maybeSingle()

  if (error || !data) return null
  return rowUtiParaDominio(data)
}
