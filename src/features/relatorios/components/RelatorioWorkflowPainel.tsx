import { FileText, Loader2, Paperclip, Send, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useSupabaseUser } from '../../../hooks/useSupabaseUser'
import { useWorkflowRelatorioRole } from '../../../hooks/useWorkflowRelatorioRole'
import { cn } from '../../../lib/cn'
import {
  atualizarStatusWorkflowRelatorio,
  devolverRelatorioComObservacoes,
  extrairUltimaDevolucao,
  type RelatorioHistoricoRow,
} from '../../../lib/relatorios/relatoriosHistoricoDb'
import { uploadAnexoRelatorioPdf } from '../../../lib/relatorios/uploadAnexoRelatorio'
import { statusWorkflowSeguro } from '../workflow/relatorioWorkflowTypes'
import { ModalDevolverRelatorio } from './ModalDevolverRelatorio'
import { WorkflowRelatorioStepper } from './WorkflowRelatorioStepper'

type RelatorioWorkflowPainelProps = {
  relatorio: RelatorioHistoricoRow
  tenantUserId: string
  onRelatorioAtualizado: (relatorio: RelatorioHistoricoRow) => void
}

export function RelatorioWorkflowPainel({
  relatorio,
  tenantUserId,
  onRelatorioAtualizado,
}: RelatorioWorkflowPainelProps) {
  const { user } = useSupabaseUser()
  const { isCoordenador, isAuditor, isFaturista } = useWorkflowRelatorioRole()
  const inputFicheiroRef = useRef<HTMLInputElement>(null)

  const [aAtualizar, setAAtualizar] = useState(false)
  const [aEnviarAnexo, setAEnviarAnexo] = useState(false)
  const [modalDevolverAberto, setModalDevolverAberto] = useState(false)

  const status = statusWorkflowSeguro(relatorio.status_workflow)
  const editavel = status === 'rascunho' && isCoordenador
  const ultimaDevolucao = extrairUltimaDevolucao(relatorio.snapshot)

  async function executarTransicao(
    acao: () => Promise<RelatorioHistoricoRow>,
    mensagemSucesso: string,
  ) {
    setAAtualizar(true)
    const toastId = toast.loading('Atualizando status…')
    try {
      const atualizado = await acao()
      onRelatorioAtualizado(atualizado)
      toast.success(mensagemSucesso, { id: toastId })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível atualizar o relatório.'
      toast.error(msg, { id: toastId })
    } finally {
      setAAtualizar(false)
    }
  }

  async function aoEnviarParaAuditoria() {
    await executarTransicao(
      () =>
        atualizarStatusWorkflowRelatorio(tenantUserId, relatorio.id, {
          status_workflow: 'em_auditoria',
          anexos_urls: relatorio.anexos_urls,
        }),
      'Relatório enviado para auditoria.',
    )
  }

  async function aoAprovar() {
    if (!user?.id) return
    await executarTransicao(
      () =>
        atualizarStatusWorkflowRelatorio(tenantUserId, relatorio.id, {
          status_workflow: 'aprovado',
          auditor_id: user.id,
        }),
      'Relatório aprovado com sucesso.',
    )
  }

  async function aoDevolver(observacao: string) {
    if (!user?.id) return
    setAAtualizar(true)
    const toastId = toast.loading('Atualizando status…')
    try {
      const atualizado = await devolverRelatorioComObservacoes(tenantUserId, relatorio.id, {
        snapshot: relatorio.snapshot,
        observacao,
        auditorId: user.id,
      })
      onRelatorioAtualizado(atualizado)
      setModalDevolverAberto(false)
      toast.success('Relatório devolvido ao coordenador.', { id: toastId })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível devolver o relatório.'
      toast.error(msg, { id: toastId })
    } finally {
      setAAtualizar(false)
    }
  }

  async function aoMarcarFaturado() {
    if (!user?.id) return
    await executarTransicao(
      () =>
        atualizarStatusWorkflowRelatorio(tenantUserId, relatorio.id, {
          status_workflow: 'faturado',
          faturista_id: user.id,
        }),
      'Relatório marcado como faturado.',
    )
  }

  async function aoSelecionarAnexo(file: File | undefined) {
    if (!file || !editavel) return
    setAEnviarAnexo(true)
    try {
      const url = await uploadAnexoRelatorioPdf({
        tenantUserId,
        relatorioId: relatorio.id,
        file,
      })
      const novosAnexos = [...(relatorio.anexos_urls ?? []), url]
      const atualizado = await atualizarStatusWorkflowRelatorio(tenantUserId, relatorio.id, {
        status_workflow: 'rascunho',
        anexos_urls: novosAnexos,
      })
      onRelatorioAtualizado(atualizado)
      toast.success('Documento de juntada adicionado.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar o PDF.')
    } finally {
      setAEnviarAnexo(false)
      if (inputFicheiroRef.current) inputFicheiroRef.current.value = ''
    }
  }

  const mostrarAnexos =
    isCoordenador || isAuditor || isFaturista || (relatorio.anexos_urls?.length ?? 0) > 0

  return (
    <div className="space-y-5 border-b border-slate-200 px-4 py-5">
      <WorkflowRelatorioStepper status={status} />

      {ultimaDevolucao ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Última devolução do auditor</p>
          <p className="mt-1 whitespace-pre-wrap">{ultimaDevolucao.observacao}</p>
        </div>
      ) : null}

      {mostrarAnexos ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-900">Documentos de juntada</h3>
            </div>
            {editavel ? (
              <>
                <input
                  ref={inputFicheiroRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={aEnviarAnexo || aAtualizar}
                  onChange={(e) => void aoSelecionarAnexo(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={aEnviarAnexo || aAtualizar}
                  onClick={() => inputFicheiroRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {aEnviarAnexo ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Adicionar PDF
                </button>
              </>
            ) : null}
          </div>

          {(relatorio.anexos_urls?.length ?? 0) === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              {editavel
                ? 'Anexe PDFs complementares antes de enviar para auditoria.'
                : 'Nenhum documento de juntada.'}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {relatorio.anexos_urls.map((url, indice) => (
                <li key={`${url}-${indice}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    Documento {indice + 1}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {status === 'rascunho' && isCoordenador ? (
          <button
            type="button"
            disabled={aAtualizar || aEnviarAnexo}
            onClick={() => void aoEnviarParaAuditoria()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {aAtualizar ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Enviar para Auditoria
          </button>
        ) : null}

        {status === 'em_auditoria' && isAuditor ? (
          <>
            <button
              type="button"
              disabled={aAtualizar}
              onClick={() => void aoAprovar()}
              className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-success-700 disabled:opacity-50"
            >
              {aAtualizar ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Aprovar Relatório
            </button>
            <button
              type="button"
              disabled={aAtualizar}
              onClick={() => setModalDevolverAberto(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-danger-700 disabled:opacity-50"
            >
              Devolver com Observações
            </button>
          </>
        ) : null}

        {status === 'aprovado' && isFaturista ? (
          <button
            type="button"
            disabled={aAtualizar}
            onClick={() => void aoMarcarFaturado()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {aAtualizar ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Marcar como Faturado
          </button>
        ) : null}

        {aAtualizar && !modalDevolverAberto ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Atualizando status…
          </span>
        ) : null}
      </div>

      {!editavel && status !== 'faturado' ? (
        <p className={cn('text-xs text-slate-500')}>
          {status === 'em_auditoria'
            ? 'O relatório está em auditoria — edição e anexos bloqueados.'
            : status === 'aprovado'
              ? 'Relatório aprovado — aguarda faturação.'
              : null}
        </p>
      ) : null}

      {status === 'faturado' ? (
        <p className="text-xs font-medium text-success-700">
          Relatório faturado. Nenhuma alteração adicional é permitida.
        </p>
      ) : null}

      <ModalDevolverRelatorio
        aberto={modalDevolverAberto}
        aProcessar={aAtualizar}
        onFechar={() => !aAtualizar && setModalDevolverAberto(false)}
        onConfirmar={(obs) => void aoDevolver(obs)}
      />
    </div>
  )
}
