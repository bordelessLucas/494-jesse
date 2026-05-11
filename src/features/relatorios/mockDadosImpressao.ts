/** Dados de exemplo até integração com API — estrutura inspirada em mapas de frequência hospitalar. */

export const profissionaisFrequenciaMock = [
  'Dra. Ana Paula Ferreira',
  'Dr. Carlos Mendes Silva',
  'Enf. Mariana Costa',
  'Dr. Roberto Lima',
  'Dra. Juliana Rocha',
  'Dr. Paulo Henrique Alves',
] as const

/** Colunas numéricas = dias do mês (amostra). */
export const diasAmostra = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31,
] as const

/** Códigos de turno simulados. */
const turnos = ['D', 'N', '12', '6', '—', 'F'] as const

export function celulaTurnoMock(
  profIndex: number,
  diaIndex: number,
): (typeof turnos)[number] {
  const k = (profIndex + diaIndex * 3) % turnos.length
  return turnos[k]!
}

export const indicadoresScihMock = [
  { indicador: 'Pacientes em ventilação mecânica (média dia)', valor: '12' },
  { indicador: 'Taxa de ocupação UTI (%)', valor: '94' },
  { indicador: 'Intercorrências registradas', valor: '28' },
  { indicador: 'Passagens de plantão formalizadas', valor: '62' },
] as const

export const ocorrenciasScihMock = [
  {
    data: '05/03/2026',
    tipo: 'Intercorrência clínica',
    resumo: 'Reavaliação de parâmetros ventilatórios — equipe noturna.',
  },
  {
    data: '12/03/2026',
    tipo: 'Segurança do paciente',
    resumo: 'Checagem dupla de medicamentos alta vigilância.',
  },
  {
    data: '18/03/2026',
    tipo: 'Recursos humanos',
    resumo: 'Cobertura extra turno diurno — SCIH.',
  },
] as const
