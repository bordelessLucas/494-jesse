import { ShieldCheck } from 'lucide-react'

import { formatarDataSegura } from '../../../lib/datas/formatacaoSegura'
import type { AssinaturaResponsavel } from '../types'

type BlocoAssinaturaDigitalJuridicaProps = {
  assinatura: AssinaturaResponsavel
  /** Quando true, indica que a assinatura criptográfica será aplicada na emissão. */
  modoPreview?: boolean
}

export function BlocoAssinaturaDigitalJuridica({
  assinatura,
  modoPreview = false,
}: BlocoAssinaturaDigitalJuridicaProps) {
  const titular =
    assinatura.titularCertificado?.trim() || assinatura.nomeProfissional
  const dataAssinatura = assinatura.dataHoraAssinatura
    ? formatarDataSegura(assinatura.dataHoraAssinatura, "dd/MM/yyyy 'às' HH:mm")
    : modoPreview
      ? 'Na emissão do documento'
      : null

  return (
    <footer className="mt-auto break-inside-avoid pt-10">
      <div className="grid grid-cols-[1fr_auto] items-end gap-6">
        <div className="text-center">
          <div className="mx-auto max-w-md border-t border-black pt-2">
            <p className="text-sm font-bold uppercase tracking-wide text-black">
              {titular}
            </p>
            <p className="text-xs text-black">{assinatura.crmRqe}</p>
            <p className="mt-3 text-sm font-bold text-black">{assinatura.nomeEmpresa}</p>
            <p className="text-xs text-black">CNPJ: {assinatura.cnpjEmpresa || '—'}</p>
          </div>
        </div>

        <aside className="w-44 shrink-0">
          <div className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-emerald-700 bg-emerald-50 p-3 text-center text-[9px] leading-tight text-emerald-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Assinatura Digital
            </span>
            <span className="font-semibold">ICP-Brasil</span>
            <span className="mt-1 border-t border-emerald-300 pt-1.5 text-[8px]">
              {modoPreview
                ? 'Será autenticado com certificado digital na emissão'
                : 'Documento assinado digitalmente'}
            </span>
            {dataAssinatura ? (
              <span className="font-medium">{dataAssinatura}</span>
            ) : null}
            {assinatura.certificadoValidoAte ? (
              <span className="text-[8px] text-emerald-800">
                Cert. válido até {assinatura.certificadoValidoAte}
              </span>
            ) : null}
          </div>
        </aside>
      </div>
    </footer>
  )
}
