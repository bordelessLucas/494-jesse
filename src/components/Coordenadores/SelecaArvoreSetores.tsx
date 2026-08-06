import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { cn } from '../../lib/cn'
import type { LocalComSetoresArvore } from '../Profissionais/ProfissionalDetalhesModal'

const inputEditavel =
  'w-full cursor-text rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20'

function filtrarArvoreGrupos(
  arvore: LocalComSetoresArvore[],
  busca: string,
  apenasSelecionados: boolean,
  selecionados: Set<string>,
): LocalComSetoresArvore[] {
  const q = busca.trim().toLowerCase()
  return arvore
    .map((local) => {
      const localMatch = q === '' || local.nome.toLowerCase().includes(q)
      const setores = local.setores.filter((s) => {
        if (apenasSelecionados && !selecionados.has(s.id)) return false
        if (q === '') return true
        if (localMatch) return true
        return s.nome.toLowerCase().includes(q)
      })
      return { ...local, setores }
    })
    .filter((local) => local.setores.length > 0)
}

function contarSetoresArvore(arvore: LocalComSetoresArvore[]) {
  return arvore.reduce((acc, l) => acc + l.setores.length, 0)
}

type SelecaArvoreSetoresProps = {
  ids: string[]
  onIdsChange: (next: string[]) => void
  locaisComSetoresArvore: LocalComSetoresArvore[]
}

/** Mesma UX da aba Grupos do profissional: locais expansíveis e setores com checkbox. */
export function SelecaArvoreSetores({
  ids,
  onIdsChange,
  locaisComSetoresArvore,
}: SelecaArvoreSetoresProps) {
  const [busca, setBusca] = useState('')
  const [apenasSelecionados, setApenasSelecionados] = useState(false)

  const selecionados = useMemo(() => new Set(ids), [ids])

  const arvoreFiltrada = useMemo(
    () =>
      filtrarArvoreGrupos(
        locaisComSetoresArvore,
        busca,
        apenasSelecionados,
        selecionados,
      ),
    [locaisComSetoresArvore, busca, apenasSelecionados, selecionados],
  )

  const totalCatalogo = useMemo(
    () => contarSetoresArvore(locaisComSetoresArvore),
    [locaisComSetoresArvore],
  )
  const totalVisiveis = useMemo(
    () => contarSetoresArvore(arvoreFiltrada),
    [arvoreFiltrada],
  )

  function toggleSetor(setorId: string) {
    const s = new Set(ids)
    if (s.has(setorId)) s.delete(setorId)
    else s.add(setorId)
    onIdsChange(Array.from(s))
  }

  function toggleLocal(localId: string) {
    const local = locaisComSetoresArvore.find((l) => l.id === localId)
    if (!local || local.setores.length === 0) return
    const s = new Set(ids)
    const listaIds = local.setores.map((x) => x.id)
    const allOn = listaIds.every((id) => s.has(id))
    if (allOn) listaIds.forEach((id) => s.delete(id))
    else listaIds.forEach((id) => s.add(id))
    onIdsChange(Array.from(s))
  }

  function estadoLocal(local: LocalComSetoresArvore) {
    if (local.setores.length === 0) return { checked: false, indet: false }
    const n = local.setores.filter((x) => selecionados.has(x.id)).length
    if (n === 0) return { checked: false, indet: false }
    if (n === local.setores.length) return { checked: true, indet: false }
    return { checked: false, indet: true }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm text-slate-600">
          Selecione os locais e setores aos quais o coordenador terá vínculo.
        </p>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={apenasSelecionados}
            onChange={(e) => setApenasSelecionados(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>Exibir apenas grupos selecionados</span>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Pesquisar local, setor ou grupo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={cn(inputEditavel, 'w-full pl-9')}
            autoComplete="off"
          />
        </div>
        <p className="shrink-0 text-sm tabular-nums text-slate-500">
          Exibindo {totalVisiveis} de {totalCatalogo}.
        </p>
      </div>

      {locaisComSetoresArvore.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          Cadastre locais e setores em <strong>Configurações</strong> para vincular o
          coordenador.
        </p>
      ) : arvoreFiltrada.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Nenhum local ou setor encontrado para os filtros atuais.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <ul className="divide-y divide-slate-200/80">
            {arvoreFiltrada.map((localLinha) => {
              const localFull =
                locaisComSetoresArvore.find((l) => l.id === localLinha.id) ?? localLinha
              const { checked, indet } = estadoLocal(localFull)

              return (
                <li key={localLinha.id} className="bg-slate-50">
                  <div className="flex items-center gap-3 bg-slate-200/80 px-3 py-2.5 sm:px-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      ref={(el) => {
                        if (el) el.indeterminate = indet
                      }}
                      onChange={() => toggleLocal(localLinha.id)}
                      className="h-4 w-4 shrink-0 rounded border-slate-400 text-primary focus:ring-primary"
                      aria-label={`Selecionar todos os setores de ${localLinha.nome}`}
                    />
                    <span className="min-w-0 flex-1 text-sm font-bold uppercase tracking-tight text-slate-900">
                      {localLinha.nome}
                    </span>
                    <span className="shrink-0 rounded-md bg-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-950">
                      Local
                    </span>
                  </div>
                  <ul className="bg-white">
                    {localLinha.setores.map((setItem) => (
                      <li
                        key={setItem.id}
                        className="flex items-center gap-3 border-t border-slate-100 py-2.5 pl-8 pr-3 sm:pl-10 sm:pr-4"
                      >
                        <input
                          type="checkbox"
                          checked={selecionados.has(setItem.id)}
                          onChange={() => toggleSetor(setItem.id)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
                          aria-label={`Setor ${setItem.nome}`}
                        />
                        <span className="min-w-0 flex-1 text-sm font-normal text-slate-800">
                          {setItem.nome}
                        </span>
                        <span className="shrink-0 rounded-md bg-sky-200 px-2 py-0.5 text-xs font-semibold text-sky-950">
                          Setor
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
