import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

import { BrandedLogoOrInitial } from '../../../components/branding/BrandedLogoOrInitial'
import { cn } from '../../../lib/cn'
import { fmtDataHoraGeracao, fmtPeriodoTilde } from '../../../lib/relatorios/formatoPegaPlantao'

type RelatorioCabecalhoPegaPlantaoProps = {
  nomeEmpresa: string
  titulo: string
  dataGeracao?: string
  periodoInicio?: string
  periodoFim?: string
  subtituloLocal?: string
  subtituloExtra?: string
}

export function RelatorioCabecalhoPegaPlantao({
  nomeEmpresa,
  titulo,
  dataGeracao,
  periodoInicio,
  periodoFim,
  subtituloLocal,
  subtituloExtra,
}: RelatorioCabecalhoPegaPlantaoProps) {
  const gerado = dataGeracao || fmtDataHoraGeracao()

  return (
    <header className="mb-3 border-b border-gray-400 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <BrandedLogoOrInitial className="h-10 w-10 shrink-0" surface="light" alt="" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-800">{nomeEmpresa}</p>
            <h1 className="text-sm font-bold uppercase leading-tight text-gray-900">{titulo}</h1>
            {subtituloLocal ? (
              <p className="mt-0.5 text-[10px] font-semibold uppercase text-gray-700">
                {subtituloLocal}
              </p>
            ) : null}
            {subtituloExtra ? (
              <p className="text-[10px] text-gray-600">{subtituloExtra}</p>
            ) : null}
            {periodoInicio && periodoFim ? (
              <p className="mt-0.5 text-[10px] font-medium text-gray-700">
                {fmtPeriodoTilde(periodoInicio, periodoFim)}
              </p>
            ) : null}
          </div>
        </div>
        <p className="shrink-0 text-right text-[9px] leading-snug text-gray-600">
          gerado em {gerado}
        </p>
      </div>
    </header>
  )
}

type RelatorioRodapeTotaisProps = {
  children: ReactNode
  className?: string
}

export function RelatorioRodapeTotais({ children, className }: RelatorioRodapeTotaisProps) {
  return (
    <footer
      className={cn(
        'mt-2 border-t border-gray-400 pt-1 text-[10px] font-semibold text-gray-800',
        className,
      )}
    >
      {children}
    </footer>
  )
}

const TH_CLASS =
  'border border-gray-400 bg-gray-100 px-1.5 py-1 text-left text-[9px] font-bold uppercase text-gray-900'
const TD_CLASS =
  'border border-gray-400 px-1.5 py-0.5 align-top text-[9px] leading-snug text-gray-900'

export function RelatorioTabelaPega({ children }: { children: ReactNode }) {
  return (
    <table className="w-full border-collapse text-black">
      {children}
    </table>
  )
}

export function ThPega({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cn(TH_CLASS, className)} {...props}>
      {children}
    </th>
  )
}

export function TdPega({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn(TD_CLASS, className)} {...props}>
      {children}
    </td>
  )
}
