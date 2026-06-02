import { Link } from 'react-router-dom'
import { Calculator, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'

import { atualizarNomeEmpresa, buscarEmpresaDoTenant } from '../lib/auth/empresaDb'

export function ConfiguracaoPage() {
  const [empresaNome, setEmpresaNome] = useState('')
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false)
  const [empresaMsg, setEmpresaMsg] = useState<string | null>(null)

  useEffect(() => {
    void buscarEmpresaDoTenant().then((e) => {
      if (e?.nome) setEmpresaNome(e.nome)
    })
  }, [])

  async function salvarEmpresa() {
    setSalvandoEmpresa(true)
    setEmpresaMsg(null)
    try {
      const e = await atualizarNomeEmpresa(empresaNome)
      setEmpresaNome(e.nome)
      setEmpresaMsg('Nome da empresa atualizado.')
    } catch (err) {
      setEmpresaMsg(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setSalvandoEmpresa(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-lg font-semibold text-slate-900">Configuração</h1>
        <p className="mt-2 text-sm text-slate-600">
          Área exclusiva do <strong className="font-medium">MASTER</strong> da empresa.
          Funcionários convidados não acedem a estas definições; os dados de cada empresa
          permanecem isolados no sistema.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">Empresa</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nome exibido no topo da plataforma para a sua organização.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="empresa-nome" className="text-sm font-medium text-slate-700">
              Nome da empresa
            </label>
            <input
              id="empresa-nome"
              type="text"
              value={empresaNome}
              onChange={(e) => setEmpresaNome(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button
            type="button"
            disabled={salvandoEmpresa || !empresaNome.trim()}
            onClick={() => void salvarEmpresa()}
            className="h-11 shrink-0 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {salvandoEmpresa ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
        {empresaMsg ? (
          <p className="mt-2 text-sm text-slate-600">{empresaMsg}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">
          Motor de remuneração
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Tipos de plantão, acréscimos (fim de semana, feriado, especialidade) e feriados
          usados no cálculo do valor bruto do extrato financeiro.
        </p>
        <Link
          to="/configuracao/avancadas"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50"
        >
          <Calculator className="h-4 w-4" aria-hidden />
          Configurações avançadas
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-slate-900">
          Aparência e white label
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Defina a cor principal e o logotipo usados na barra lateral e no topo.
        </p>
        <Link
          to="/configuracao/marca"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50"
        >
          <Palette className="h-4 w-4" aria-hidden />
          Abrir marca da plataforma
        </Link>
      </div>
    </section>
  )
}

