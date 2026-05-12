import { cn } from '../../../lib/cn'
import type { CabecalhoContratualData } from '../types'

type CabecalhoContratualProps = CabecalhoContratualData & {
  className?: string
}

const ORGAO_TITULO = 'SECRETARIA DE ESTADO DA SAÚDE'

/**
 * Cabeçalho institucional usado por todos os templates oficiais.
 *
 * Estrutura: topo flex com logo à esquerda + título centralizado, seguido por
 * um bloco compacto com pares "Rótulo: Valor" em negrito/normal.
 */
export function CabecalhoContratual({
  logoUrl,
  contratoGestao,
  contratoPrestacao,
  local,
  servico,
  tomador,
  empresa,
  cnpj,
  coordenador,
  competencia,
  className,
}: CabecalhoContratualProps) {
  return (
    <header
      className={cn(
        'w-full border-b-2 border-black pb-3 text-black',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logotipo da instituição"
              className="max-h-16 max-w-full object-contain"
            />
          ) : null}
        </div>

        <h1 className="flex-1 text-center text-base font-bold uppercase tracking-wide">
          {ORGAO_TITULO}
        </h1>

        <div aria-hidden className="h-16 w-16 shrink-0" />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-y-0.5 text-xs leading-tight">
        <DadoCabecalho rotulo="Contrato de Gestão" valor={contratoGestao} />
        <DadoCabecalho
          rotulo="Contrato de Prestação de Serviços"
          valor={contratoPrestacao}
        />
        <DadoCabecalho rotulo="Local" valor={local} />
        <DadoCabecalho rotulo="Serviço" valor={servico} />
        <DadoCabecalho rotulo="Tomador" valor={tomador} />
        <DadoCabecalho rotulo="Empresa" valor={empresa} />
        <DadoCabecalho rotulo="CNPJ" valor={cnpj} />
        <DadoCabecalho rotulo="Coordenador" valor={coordenador} />
        <DadoCabecalho rotulo="Competência" valor={competencia} />
      </dl>
    </header>
  )
}

type DadoCabecalhoProps = {
  rotulo: string
  valor: string
}

function DadoCabecalho({ rotulo, valor }: DadoCabecalhoProps) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-bold">{rotulo}:</dt>
      <dd className="min-w-0 flex-1 font-normal">{valor}</dd>
    </div>
  )
}
