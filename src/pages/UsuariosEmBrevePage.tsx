/** Páginas de usuários ainda não implementadas (marcador UX). */

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

export function DocumentosUsuarioPage() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        Documentos <span className="text-orange-600">NOVO</span>
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Módulo de documentos dos utilizadores — em desenvolvimento.
      </p>
    </div>
  )
}
