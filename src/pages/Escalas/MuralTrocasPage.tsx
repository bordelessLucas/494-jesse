import { ArrowLeftRight, Calendar, Clock3, DollarSign, Loader2, MapPin } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import { supabase } from '../../lib/supabase'
import { useSupabaseUser } from '../../hooks/useSupabaseUser'

type PlantaoMuralRow = {
  id: string
  user_id: string
  local_id: string
  setor_id: string
  profissional_id: string | null
  data_plantao: string
  hora_inicio: string
  hora_fim: string
  status: string
  valor_plantao: number | null
  disponivel_mural: boolean
  locais?: { nome_fantasia: string } | null
  setores?: { nome: string } | null
}

async function buscarTenantUserId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('auth_tenant_user_id')
  if (error) return null
  return typeof data === 'string' ? data : (data as unknown as string | null)
}

async function buscarProfissionalIdMembro(): Promise<string | null> {
  const { data, error } = await supabase.rpc('membro_profissional_id')
  if (error) return null
  return typeof data === 'string' ? data : (data as unknown as string | null)
}

function capitalizar(texto: string): string {
  return texto.slice(0, 1).toUpperCase() + texto.slice(1)
}

function formatarDataLonga(isoData: string): string {
  const d = parseISO(String(isoData).slice(0, 10))
  return capitalizar(format(d, "dd 'de' MMMM", { locale: ptBR }))
}

function formatarHorario(inicio: string, fim: string): string {
  const a = String(inicio).slice(0, 5)
  const b = String(fim).slice(0, 5)
  return `${a} — ${b}`
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function MuralTrocasPage() {
  const { user, isLoading } = useSupabaseUser()
  const [carregando, setCarregando] = useState(true)
  const [itens, setItens] = useState<PlantaoMuralRow[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [assumindoId, setAssumindoId] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!user?.id) return
    setCarregando(true)
    setErro(null)
    try {
      const hojeIso = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('plantoes')
        .select(
          `
          id,
          user_id,
          local_id,
          setor_id,
          profissional_id,
          data_plantao,
          hora_inicio,
          hora_fim,
          status,
          valor_plantao,
          disponivel_mural,
          locais ( nome_fantasia ),
          setores ( nome )
        `,
        )
        .eq('disponivel_mural', true)
        .gte('data_plantao', hojeIso)
        .order('data_plantao', { ascending: true })

      if (error) throw new Error(error.message)
      setItens((data ?? []) as PlantaoMuralRow[])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mural.')
    } finally {
      setCarregando(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoading) return
    void carregar()
  }, [carregar, isLoading])

  const itensFuturos = useMemo(() => {
    const agora = new Date()
    return itens.filter((p) => {
      const d = parseISO(String(p.data_plantao).slice(0, 10))
      return isAfter(d, new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1))
    })
  }, [itens])

  const assumirPlantao = useCallback(
    async (plantao: PlantaoMuralRow) => {
      if (!user?.id) return
      setAssumindoId(plantao.id)
      try {
        const [tenantUserId, candidatoProfissionalId] = await Promise.all([
          buscarTenantUserId(),
          buscarProfissionalIdMembro(),
        ])

        if (!tenantUserId || !candidatoProfissionalId) {
          toast.error('Não foi possível identificar seu vínculo de profissional.')
          return
        }

        if (!plantao.profissional_id) {
          toast.error('Este plantão não tem anunciante vinculado.')
          return
        }

        const { error } = await supabase.from('plantoes_trocas_solicitacoes').insert({
          tenant_user_id: tenantUserId,
          plantao_id: plantao.id,
          anunciante_profissional_id: plantao.profissional_id,
          candidato_profissional_id: candidatoProfissionalId,
          status: 'aguardando_aprovacao_coordenador',
          updated_at: new Date().toISOString(),
        })

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success('Solicitação enviada! Aguarde aprovação da coordenação.')
        void carregar()
      } finally {
        setAssumindoId(null)
      }
    },
    [carregar, user?.id],
  )

  return (
    <div className="space-y-5">
      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-700">
              <ArrowLeftRight className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marketplace de plantões
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Mural de Trocas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Veja plantões anunciados e envie uma solicitação para assumir.
              </p>
            </div>
          </div>

          {carregando ? (
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
              Atualizando…
            </div>
          ) : null}
        </div>
      </header>

      {erro ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {carregando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Carregando plantões…
          </div>
        ) : itensFuturos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Nenhum plantão anunciado no momento.
          </div>
        ) : (
          itensFuturos.map((plantao) => {
            const hospital = plantao.locais?.nome_fantasia?.trim() ?? 'Hospital'
            const setor = plantao.setores?.nome?.trim() ?? 'Setor'
            const valor = plantao.valor_plantao ?? 0
            const isAssumindo = assumindoId === plantao.id

            return (
              <article
                key={plantao.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatarDataLonga(plantao.data_plantao)}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                      {hospital}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-700">{setor}</p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                    Troca
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" aria-hidden />
                    {formatarHorario(plantao.hora_inicio, plantao.hora_fim)}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
                    {hospital}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
                    {setor}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" aria-hidden />
                    {formatarValor(valor)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAssumindo}
                  onClick={() => void assumirPlantao(plantao)}
                  className={cn(
                    'mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700',
                    isAssumindo && 'opacity-60',
                  )}
                >
                  {isAssumindo ? 'Enviando…' : 'Assumir Plantão'}
                </button>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

