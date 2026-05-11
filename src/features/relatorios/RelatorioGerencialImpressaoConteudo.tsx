import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useMemo } from 'react'

import { useThemeBranding } from '../../theme/ThemeBrandingProvider'
import type { PlantaoRelatorioLinha } from '../../pages/Dashboard/RelatoriosPage'

function parseDataBR(iso: string) {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusBadgeClasses(
  status: PlantaoRelatorioLinha['status'],
) {
  switch (status) {
    case 'pago':
      return 'bg-success-100 text-success-800 ring-1 ring-success-600/20'
    case 'pendente':
      return 'bg-warning-100 text-warning-800 ring-1 ring-warning-600/25'
    case 'glosado':
      return 'bg-danger-100 text-danger-800 ring-1 ring-danger-600/20'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function statusLabel(status: PlantaoRelatorioLinha['status']) {
  switch (status) {
    case 'pago':
      return 'Pago'
    case 'pendente':
      return 'Pendente'
    case 'glosado':
      return 'Glosado'
    default:
      return status
  }
}

function tipoLabel(tipo: PlantaoRelatorioLinha['tipo']) {
  return tipo === 'substituicao' ? 'Substituição / Troca' : 'Plantão normal'
}

export function RelatorioGerencialImpressaoConteudo(props: {
  tituloDocumento: string
  periodo: string
  linhas: PlantaoRelatorioLinha[]
}) {
  const { logoUrl } = useThemeBranding()
  const { tituloDocumento, periodo, linhas } = props

  const totais = useMemo(() => {
    const totalHoras = linhas.reduce((acc, r) => acc + r.horas, 0)
    const valorBruto = linhas.reduce((acc, r) => acc + r.valor, 0)
    const valorPendente = linhas
      .filter((r) => r.status === 'pendente')
      .reduce((acc, r) => acc + r.valor, 0)

    return {
      totalHoras,
      valorBruto,
      valorPendente,
      totalLinhas: linhas.length,
    }
  }, [linhas])

  return (
    <div className="bg-white text-slate-900">
      <header className="border-b-2 border-primary-600 bg-primary-600 px-4 py-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/15 ring-2 ring-white/30">
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
                Relatórios Gerenciais
              </p>
              <h1 className="text-lg font-bold leading-tight sm:text-xl">
                {tituloDocumento}
              </h1>
              <p className="mt-0.5 text-sm text-white/90">
                Visão gerencial e financeira (dados de demonstração)
              </p>
            </div>
          </div>

          <div className="text-right text-xs leading-relaxed text-white/90 sm:text-sm">
            <p>
              <span className="font-semibold text-white">Período:</span> {periodo}
            </p>
            <p className="mt-2 text-[10px] text-white/70">
              Emitido em{' '}
              {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <section className="p-4">
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Data
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Profissional
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Local / Setor
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Turno
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Tipo
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-right font-semibold text-slate-700">
                  Valor
                </th>
                <th className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-10 text-center text-slate-500"
                  >
                    Nenhum registro no período informado.
                  </td>
                </tr>
              ) : (
                linhas.map((row) => (
                  <tr key={row.id} className="odd:bg-white even:bg-slate-50/70">
                    <td className="border-b border-slate-200 px-2 py-2 text-slate-700 tabular-nums">
                      {parseDataBR(row.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2">
                      <div className="font-medium text-slate-900">
                        {row.profissionalNome}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {row.especialidade}
                      </div>
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded bg-orange-200/70 px-2 py-0.5 text-[10px] font-medium text-orange-950">
                          {row.localNome}
                        </span>
                        <span className="rounded bg-teal-200/70 px-2 py-0.5 text-[10px] font-medium text-teal-950">
                          {row.setorNome}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2 text-slate-700">
                      {row.turno}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2 text-slate-700">
                      {tipoLabel(row.tipo)}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2 text-right font-medium tabular-nums text-slate-900">
                      {formatarMoeda(row.valor)}
                    </td>
                    <td className="border-b border-slate-200 px-2 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusBadgeClasses(
                          row.status,
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg bg-slate-100 px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Totais (filtro atual)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-600">
                Total de plantões / horas
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                {totais.totalLinhas}{' '}
                <span className="text-base font-semibold text-slate-600">
                  · {totais.totalHoras} h
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">
                Valor total bruto
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                {formatarMoeda(totais.valorBruto)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">
                Valor pendente de repasse
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-warning-800">
                {formatarMoeda(totais.valorPendente)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

