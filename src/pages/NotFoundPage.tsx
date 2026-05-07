export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Não encontrado</h1>
        <p className="mt-1 text-sm text-slate-600">
          A rota acessada não existe ou foi movida.
        </p>
      </div>
    </div>
  )
}

