import { supabase } from '../../lib/supabase'
import type { IndicadorCirurgico, IndicadorUti } from './types'

function mesCompetenciaParaDataSql(mesCompetencia: string): string {
  if (!/^\d{4}-\d{2}$/.test(mesCompetencia)) {
    throw new Error('Mês de competência inválido.')
  }
  return `${mesCompetencia}-01`
}

/**
 * Persiste (ou actualiza) o par de indicadores do mês no Supabase.
 * Reutiliza o mesmo `mes_competencia` nas duas tabelas; taxas são calculadas na BD.
 */
export async function salvarIndicadoresSupabase(
  indicadorUti: IndicadorUti,
  indicadorCirurgico: IndicadorCirurgico,
): Promise<void> {
  if (indicadorCirurgico.mesCompetencia !== indicadorUti.mesCompetencia) {
    throw new Error('Os indicadores devem partilhar o mesmo mês de competência.')
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  const user = sessionData.session?.user
  if (!user) {
    throw new Error('É necessário iniciar sessão para guardar os indicadores.')
  }

  const mesSql = mesCompetenciaParaDataSql(indicadorUti.mesCompetencia)

  const { error: errorUti } = await supabase.from('sciras_indicadores_uti').upsert(
    {
      user_id: user.id,
      mes_competencia: mesSql,
      setor: indicadorUti.setor,
      total_pacientes_dia: indicadorUti.totalPacientesDia,
      usuarios_acompanhados_busca_ativa:
        indicadorUti.usuariosAcompanhadosBuscaAtiva,
    },
    { onConflict: 'user_id,mes_competencia,setor' },
  )

  if (errorUti) {
    throw new Error(errorUti.message)
  }

  const { error: errorCir } = await supabase
    .from('sciras_indicadores_cirurgicos')
    .upsert(
      {
        user_id: user.id,
        mes_competencia: mesSql,
        total_cirurgias: indicadorCirurgico.totalCirurgias,
        total_cirurgias_limpas: indicadorCirurgico.totalCirurgiasLimpas,
        num_infeccoes_cirurgias_limpas:
          indicadorCirurgico.numInfeccoesCirurgiasLimpas,
      },
      { onConflict: 'user_id,mes_competencia' },
    )

  if (errorCir) {
    throw new Error(errorCir.message)
  }
}
