import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

import { useThemeBranding } from '../../theme/ThemeBrandingProvider'
import {
  celulaTurnoMock,
  diasAmostra,
  indicadoresScihMock,
  ocorrenciasScihMock,
  profissionaisFrequenciaMock,
} from './mockDadosImpressao'
import type { RelatorioImpressaoTipo } from './relatorioTipos'

type RelatorioImpressaoConteudoProps = {
  tipo: RelatorioImpressaoTipo
  tituloDocumento: string
  unidade: string
  dataInicioIso: string
  dataFimIso: string
  grupos: string
}

function formatarPeriodo(inicio: string, fim: string) {
  try {
    const a = parseISO(inicio)
    const b = parseISO(fim)
    return `${format(a, "dd/MM/yyyy", { locale: ptBR })} a ${format(b, "dd/MM/yyyy", { locale: ptBR })}`
  } catch {
    return `${inicio} a ${fim}`
  }
}

function CabecalhoMarca({
  tituloDocumento,
  subtitulo,
  periodo,
  grupos,
  unidade,
}: {
  tituloDocumento: string
  subtitulo: string
  periodo: string
  grupos: string
  unidade: string
}) {
  const { logoUrl } = useThemeBranding()

  return (
    <header className="border-b-2 border-primary-600 bg-primary-600 px-4 py-4 text-white print:border-primary-600 print:bg-primary-600">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/15 ring-2 ring-white/30 print:bg-white/15">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="max-h-full max-w-full object-contain p-1"
              />
            ) : (
              <span className="text-xl font-bold tracking-tight">P</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/85">
              {unidade}
            </p>
            <h1 className="text-lg font-bold leading-tight sm:text-xl">
              {tituloDocumento}
            </h1>
            <p className="mt-0.5 text-sm text-white/90">{subtitulo}</p>
          </div>
        </div>
        <div className="text-right text-xs leading-relaxed text-white/90 sm:text-sm">
          <p>
            <span className="font-semibold text-white">Período:</span> {periodo}
          </p>
          {grupos.trim() ? (
            <p className="mt-1">
              <span className="font-semibold text-white">Grupo(s):</span>{' '}
              {grupos}
            </p>
          ) : (
            <p className="mt-1 text-white/80">Grupo(s): todos</p>
          )}
          <p className="mt-2 text-[10px] text-white/70">
            Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </header>
  )
}

function TabelaFrequencia({
  tituloTabela,
  unidade,
}: {
  tituloTabela: string
  unidade: string
}) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 border-l-4 border-primary-600 pl-2 text-sm font-bold uppercase tracking-wide text-slate-800">
        {tituloTabela}
      </h2>
      <div className="overflow-x-auto border border-slate-300 print:border-slate-400">
        <table className="w-full min-w-max border-collapse text-[10px] sm:text-xs">
          <thead>
            <tr className="bg-primary-50 text-left print:bg-primary-50">
              <th className="sticky left-0 z-1 border border-slate-300 bg-primary-100 px-1.5 py-2 font-semibold text-slate-900 print:bg-primary-100">
                Profissional
              </th>
              {diasAmostra.map((d) => (
                <th
                  key={d}
                  className="border border-slate-300 px-0.5 py-2 text-center font-semibold text-slate-700 sm:min-w-7"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profissionaisFrequenciaMock.map((nome, pi) => (
              <tr key={nome} className="odd:bg-white even:bg-slate-50/80">
                <td className="sticky left-0 z-1 border border-slate-300 bg-white px-1.5 py-1.5 font-medium text-slate-900 print:bg-white">
                  {nome}
                </td>
                {diasAmostra.map((d, di) => (
                  <td
                    key={`${nome}-${d}`}
                    className="border border-slate-300 px-0.5 py-1.5 text-center tabular-nums text-slate-800"
                  >
                    {celulaTurnoMock(pi, di)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Legenda sugerida: D = diurno, N = noturno, 12 = 12h, 6 = 6h, F = folga, —
        = sem escala. Valores de demonstração — {unidade}.
      </p>
    </section>
  )
}

function CorpoRelatorioScih({
  unidade,
  periodo,
}: {
  unidade: string
  periodo: string
}) {
  return (
    <div className="mt-4 space-y-6">
      <section>
        <h2 className="mb-2 border-l-4 border-primary-600 pl-2 text-sm font-bold uppercase tracking-wide text-slate-800">
          Indicadores do período
        </h2>
        <table className="w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-800">
                Indicador
              </th>
              <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {indicadoresScihMock.map((row) => (
              <tr key={row.indicador} className="odd:bg-white even:bg-slate-50/60">
                <td className="border border-slate-300 px-3 py-2 text-slate-800">
                  {row.indicador}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                  {row.valor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 border-l-4 border-primary-600 pl-2 text-sm font-bold uppercase tracking-wide text-slate-800">
          Ocorrências e notas
        </h2>
        <table className="w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-800">
                Data
              </th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-800">
                Tipo
              </th>
              <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-800">
                Resumo
              </th>
            </tr>
          </thead>
          <tbody>
            {ocorrenciasScihMock.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/60">
                <td className="border border-slate-300 px-3 py-2 tabular-nums text-slate-700">
                  {row.data}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-slate-800">
                  {row.tipo}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-slate-700">
                  {row.resumo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-[10px] text-slate-500">
        Dados de demonstração — {unidade} — período {periodo}.
      </p>
    </div>
  )
}

export function RelatorioImpressaoConteudo(props: RelatorioImpressaoConteudoProps) {
  const { tipo, tituloDocumento, unidade, dataInicioIso, dataFimIso, grupos } =
    props
  const periodo = formatarPeriodo(dataInicioIso, dataFimIso)

  if (tipo === 'freq_uti_ped') {
    return (
      <div className="bg-white text-slate-900">
        <CabecalhoMarca
          tituloDocumento={tituloDocumento}
          subtitulo="Controle de frequência — UTI Pediátrica"
          periodo={periodo}
          grupos={grupos}
          unidade={unidade}
        />
        <div className="p-4">
          <TabelaFrequencia
            tituloTabela="Mapa de frequência (dias do mês)"
            unidade={unidade}
          />
        </div>
      </div>
    )
  }

  if (tipo === 'freq_scih') {
    return (
      <div className="bg-white text-slate-900">
        <CabecalhoMarca
          tituloDocumento={tituloDocumento}
          subtitulo="Controle de frequência — SCIH"
          periodo={periodo}
          grupos={grupos}
          unidade={unidade}
        />
        <div className="p-4">
          <TabelaFrequencia
            tituloTabela="Mapa de frequência (dias do mês)"
            unidade={unidade}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white text-slate-900">
      <CabecalhoMarca
        tituloDocumento={tituloDocumento}
        subtitulo="Relatório gerencial — SCIH"
        periodo={periodo}
        grupos={grupos}
        unidade={unidade}
      />
      <div className="p-4">
        <CorpoRelatorioScih unidade={unidade} periodo={periodo} />
      </div>
    </div>
  )
}
