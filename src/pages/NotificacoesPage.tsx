import { Link } from 'react-router-dom'

import { useNotificacoes } from '../hooks/useNotificacoes'

export function NotificacoesPage() {
  const { notificacoes, marcarComoLida, marcarTodasComoLidas } = useNotificacoes()

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notificações</h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe avisos e mudanças recentes na sua escala.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          onClick={() => marcarTodasComoLidas()}
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {notificacoes.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Nenhuma notificação por aqui
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Quando algo mudar, você verá seus alertas nesta página.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notificacoes.map((notificacao) => {
              const isUnread = !notificacao.lida
              const containerClassName = [
                'px-5 py-4 transition-colors',
                isUnread ? 'bg-primary-50' : 'bg-white',
              ].join(' ')

              const content = (
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      'mt-2 h-2 w-2 flex-none rounded-full',
                      isUnread ? 'bg-primary-600' : 'bg-transparent',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {notificacao.titulo}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {notificacao.mensagem}
                    </p>
                    {notificacao.linkAcao ? (
                      <p className="mt-2">
                        <Link
                          to={notificacao.linkAcao}
                          className="text-sm font-semibold text-primary-700 hover:underline"
                          onClick={() => marcarComoLida(notificacao.id)}
                        >
                          Abrir
                        </Link>
                      </p>
                    ) : null}
                  </div>
                  {!notificacao.lida ? (
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => marcarComoLida(notificacao.id)}
                    >
                      Marcar como lida
                    </button>
                  ) : null}
                </div>
              )

              return (
                <li key={notificacao.id} className={containerClassName}>
                  {content}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

