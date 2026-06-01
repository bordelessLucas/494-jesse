import { Clock3, FileText, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  listarDocumentosProfissionais,
  buscarProfissionaisComSiglaConselho,
} from '../lib/documentos/documentosUsuariosDb'
import {
  ROTULOS_TIPO_DOCUMENTO,
  ROTULOS_STATUS_DOCUMENTO,
  type DocumentoUsuarioRow,
} from '../lib/documentos/documentosUsuariosTypes'
import { useSupabaseUser } from '../hooks/useSupabaseUser'

/** Painel do titular: documentos pendentes de validação. */
export function DocumentosUsuarioPage() {
  const { user, isLoading: authLoading } = useSupabaseUser()
  const [documentos, setDocumentos] = useState<DocumentoUsuarioRow[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setDocumentos([])
      setCarregando(false)
      return
    }
    setCarregando(true)
    try {
      const profs = await buscarProfissionaisComSiglaConselho(user.id)
      const rows = await listarDocumentosProfissionais(profs.map((p) => p.id))
      setDocumentos(rows.filter((d) => d.status === 'pendente'))
    } catch {
      setDocumentos([])
    } finally {
      setCarregando(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    void carregar()
  }, [authLoading, carregar])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Documentos <span className="text-orange-600">Validações</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Revise e valide os PDFs enviados pelos profissionais (contrato, CRM ou COREN).
          Profissionais sem conselho validado não podem ser alocados em plantões.
        </p>
        <Link
          to="/usuarios/profissionais"
          className="mt-4 inline-flex text-sm font-medium text-primary-700 hover:underline"
        >
          Abrir cadastro de profissionais →
        </Link>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 py-12 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          A carregar pendências…
        </div>
      ) : documentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-slate-800">
            Nenhum documento pendente de validação.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {documentos.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <Clock3 className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {doc.nome_arquivo}
                </p>
                <p className="text-xs text-slate-500">
                  {ROTULOS_TIPO_DOCUMENTO[doc.tipo]} · Profissional{' '}
                  {doc.profissional_id.slice(0, 8)}… ·{' '}
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {ROTULOS_STATUS_DOCUMENTO[doc.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function VisualizadoresPage() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Visualizadores</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Esta área será integrada ao Supabase em seguida. Por ora, apenas coordenadores e
        profissionais estão ativos sob <strong className="text-slate-800">Usuários</strong>.
      </p>
    </div>
  )
}
