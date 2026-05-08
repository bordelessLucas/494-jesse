import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserMinus,
  UserPlus,
} from 'lucide-react'

import { ProfissionalDetalhesModal } from '../components/Profissionais/ProfissionalDetalhesModal'
import { ProfissionalSlideOver } from '../components/Profissionais/ProfissionalSlideOver'
import { MOCK_PROFISSIONAIS_COMPLETO } from '../components/Profissionais/mockProfissionaisCompleto'
import type { ProfissionalCompleto } from '../components/Profissionais/profissionalTypes'
import { cn } from '../lib/cn'

const TOTAL_REGISTROS = 166
const TAMANHO_PAGINA = 30

const MOCK_PROFISSIONAIS = MOCK_PROFISSIONAIS_COMPLETO

const selectClassName =
  'min-w-0 rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function ProfissionaisPage() {
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [profissionalModal, setProfissionalModal] =
    useState<ProfissionalCompleto | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [irParaPagina, setIrParaPagina] = useState('1')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const totalPaginas = Math.max(1, Math.ceil(TOTAL_REGISTROS / TAMANHO_PAGINA))

  useEffect(() => {
    setIrParaPagina(String(paginaAtual))
  }, [paginaAtual])
  const indicesVisiveis = useMemo(() => {
    const ini = (paginaAtual - 1) * TAMANHO_PAGINA + 1
    const fim = Math.min(paginaAtual * TAMANHO_PAGINA, TOTAL_REGISTROS)
    return { ini, fim }
  }, [paginaAtual])

  const todosDaPaginaIds = MOCK_PROFISSIONAIS.map((p) => p.id)
  const todosMarcados =
    todosDaPaginaIds.length > 0 &&
    todosDaPaginaIds.every((id) => selecionados.has(id))

  function alternarTodos() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (todosMarcados) {
        todosDaPaginaIds.forEach((id) => next.delete(id))
      } else {
        todosDaPaginaIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function alternarLinha(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function irParaPaginaSubmit() {
    const n = parseInt(irParaPagina, 10)
    if (Number.isFinite(n) && n >= 1 && n <= totalPaginas) {
      setPaginaAtual(n)
    }
  }

  const listaPaginas = useMemo(() => {
    const lista: number[] = []
    const maxVis = 6
    for (let i = 1; i <= Math.min(totalPaginas, maxVis); i++) lista.push(i)
    return lista
  }, [totalPaginas])

  return (
    <div className="relative mx-auto w-full max-w-7xl pb-16">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        Profissionais
      </h1>

      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setIsSlideOverOpen(true)}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-[#007bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0069d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007bff]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Adicionar Profissional
        </button>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Ir para a página:</span>
            <input
              type="text"
              inputMode="numeric"
              value={irParaPagina}
              onChange={(e) => setIrParaPagina(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && irParaPaginaSubmit()}
              className="h-9 w-12 rounded border border-slate-300 bg-white px-2 text-center text-sm text-slate-900 tabular-nums outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
              aria-label="Número da página"
            />
          </div>

          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Paginação"
          >
            <button
              type="button"
              disabled={paginaAtual <= 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>
            {listaPaginas.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPaginaAtual(n)}
                className={cn(
                  'min-w-9 rounded border px-3 py-1.5 text-sm tabular-nums transition-colors',
                  n === paginaAtual
                    ? 'border-[#007bff] bg-white font-medium text-[#007bff]'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={paginaAtual >= totalPaginas}
              onClick={() =>
                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
              }
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Próximo
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>

          <p className="text-sm whitespace-nowrap text-slate-500">
            Exibindo {indicesVisiveis.ini} a {indicesVisiveis.fim} de{' '}
            {TOTAL_REGISTROS}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <input
              type="checkbox"
              checked={todosMarcados}
              onChange={alternarTodos}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
              aria-label="Selecionar todos os profissionais nesta página"
            />

            <select className={selectClassName} defaultValue="">
              <option value="">Todos os locais, setores</option>
              <option value="amazonia">HOSPITAL AMAZÔNIA</option>
              <option value="ps">PRONTO SOCORRO CENTRAL</option>
              <option value="norte">HOSPITAL REGIONAL NORTE</option>
            </select>

            <select className={selectClassName} defaultValue="">
              <option value="">Todas profissões</option>
              <option value="med">Médico(a)</option>
              <option value="enf">Enfermeiro(a)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 bg-white px-3 py-2 text-sm font-medium text-[#007bff] transition-colors hover:bg-blue-50"
            >
              <UserMinus className="h-4 w-4 shrink-0" aria-hidden />
              Remover Selecionados de um Grupo
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#007bff]/40 bg-white px-3 py-2 text-sm font-medium text-[#007bff] transition-colors hover:bg-blue-50"
            >
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              Adicionar Selecionados a um Grupo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="w-10 px-3 py-3.5" />
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Profissão
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Registro Profissional
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide"
                >
                  <span className="text-orange-600">Local</span>
                  <span className="text-slate-300"> / </span>
                  <span className="text-teal-600">Setor</span>
                  <span className="text-slate-300"> / </span>
                  <span className="text-slate-500">Grupo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PROFISSIONAIS.map((profissional) => (
                <tr
                  key={profissional.id}
                  className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50"
                >
                  <td className="px-3 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selecionados.has(profissional.id)}
                      onChange={() => alternarLinha(profissional.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      aria-label={`Selecionar ${profissional.nome}`}
                    />
                  </td>
                  <td className="px-3 py-4 align-middle">
                    <button
                      type="button"
                      onClick={() => setProfissionalModal(profissional)}
                      className="text-left font-medium text-[#007bff] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007bff]"
                    >
                      {profissional.nome}
                    </button>
                  </td>
                  <td className="px-3 py-4 align-middle text-slate-600">
                    {profissional.profissao}
                  </td>
                  <td className="px-3 py-4 align-middle text-slate-600 tabular-nums">
                    {profissional.registroProfissional}
                  </td>
                  <td className="px-3 py-4 align-middle text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-amber-950 bg-amber-200/90">
                        {profissional.localNome}
                      </span>
                      {profissional.setores.map((setor) => (
                        <span
                          key={`${profissional.id}-${setor}`}
                          className="inline-block max-w-full rounded px-2 py-0.5 text-xs font-medium text-teal-950 bg-teal-200/90"
                        >
                          {setor}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProfissionalDetalhesModal
        open={profissionalModal !== null}
        profissional={profissionalModal}
        onClose={() => setProfissionalModal(null)}
      />

      <ProfissionalSlideOver
        open={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
      />
    </div>
  )
}
