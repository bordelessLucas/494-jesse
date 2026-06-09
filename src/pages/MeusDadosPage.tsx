import { Loader2, MapPinned } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { DocumentosProfissionalPanel } from '../components/Profissionais/DocumentosProfissionalPanel'
import { useContaMembro } from '../hooks/useContaMembro'
import { supabase } from '../lib/supabase'

export function MeusDadosPage() {
  const { isLoading, isMembroProfissional, isTitular, profissionalId, permissoes } =
    useContaMembro()
  const [siglaConselho, setSiglaConselho] = useState<string | null>(null)
  const [carregandoProf, setCarregandoProf] = useState(false)

  useEffect(() => {
    if (isLoading || !profissionalId) return
    let cancelado = false
    async function load() {
      setCarregandoProf(true)
      const { data } = await supabase
        .from('profissionais')
        .select('sigla_conselho')
        .eq('id', profissionalId!)
        .maybeSingle()
      if (!cancelado) {
        setSiglaConselho(data?.sigla_conselho ?? null)
        setCarregandoProf(false)
      }
    }
    void load()
    return () => {
      cancelado = true
    }
  }, [isLoading, profissionalId])

  if (isLoading || carregandoProf) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden />
        A carregar…
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-lg font-semibold text-slate-900">Meus dados</h1>
        <p className="mt-2 text-sm text-slate-600">
          Envie os seus documentos legais (contrato, CRM ou COREN) e acompanhe o status de
          validação.
        </p>
      </div>

      {isMembroProfissional && profissionalId ? (
        <>
        {permissoes.registro_ponto ? (
          <Link
            to="/ponto"
            className="flex items-center gap-4 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
              <MapPinned className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">
                Ponto eletrónico
              </span>
              <span className="mt-0.5 block text-xs text-slate-600">
                Registe check-in e check-out com validação por GPS
              </span>
            </span>
          </Link>
        ) : null}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <DocumentosProfissionalPanel
            profissionalId={profissionalId}
            siglaConselho={siglaConselho}
            podeValidar={false}
          />
        </div>
        </>
      ) : isTitular ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Como titular da conta, gere os documentos de cada profissional em{' '}
          <strong>Usuários → Profissionais</strong>, aba <strong>Documentos</strong>.
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Nenhum perfil profissional associado a esta conta.
        </div>
      )}
    </section>
  )
}
