import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import {
  atualizarStatusDocumento,
  excluirDocumentoProfissional,
  listarDocumentosProfissional,
  registrarDocumentoProfissional,
} from '../../lib/documentos/documentosUsuariosDb'
import {
  ROTULOS_STATUS_DOCUMENTO,
  ROTULOS_TIPO_DOCUMENTO,
  type DocumentoUsuarioRow,
  type StatusDocumentoProfissional,
  type TipoDocumentoProfissional,
} from '../../lib/documentos/documentosUsuariosTypes'
import {
  obterUrlAssinadaDocumento,
  uploadDocumentoProfissionalPdf,
} from '../../lib/documentos/uploadDocumentoProfissional'
import {
  profissionalPossuiConselhoValidado,
  tipoConselhoDocumentoObrigatorio,
} from '../../lib/documentos/validacaoDocumentos'

const TIPOS_UPLOAD: TipoDocumentoProfissional[] = ['contrato', 'crm', 'coren']

function iconeStatus(status: StatusDocumentoProfissional) {
  switch (status) {
    case 'validado':
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
    case 'rejeitado':
      return <XCircle className="h-5 w-5 text-red-600" aria-hidden />
    default:
      return <Clock3 className="h-5 w-5 text-amber-500" aria-hidden />
  }
}

function classeStatus(status: StatusDocumentoProfissional): string {
  switch (status) {
    case 'validado':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'rejeitado':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-800'
  }
}

type DocumentosProfissionalPanelProps = {
  profissionalId: string
  siglaConselho?: string | null
  /** Titular pode validar/rejeitar documentos. */
  podeValidar?: boolean
}

export function DocumentosProfissionalPanel({
  profissionalId,
  siglaConselho,
  podeValidar = false,
}: DocumentosProfissionalPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [documentos, setDocumentos] = useState<DocumentoUsuarioRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoDocumentoProfissional>('contrato')
  const [arrastando, setArrastando] = useState(false)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [docRejeicao, setDocRejeicao] = useState<DocumentoUsuarioRow | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const motivoRejeicaoRef = useRef<HTMLTextAreaElement>(null)
  const tituloRejeicaoId = useId()

  const tipoConselho = tipoConselhoDocumentoObrigatorio(siglaConselho)
  const conselhoOk = profissionalPossuiConselhoValidado(documentos, siglaConselho)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const rows = await listarDocumentosProfissional(profissionalId)
      setDocumentos(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar documentos.')
      setDocumentos([])
    } finally {
      setCarregando(false)
    }
  }, [profissionalId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    if (!docRejeicao) return
    motivoRejeicaoRef.current?.focus()
    function aoTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') fecharModalRejeicao()
    }
    document.addEventListener('keydown', aoTecla)
    return () => document.removeEventListener('keydown', aoTecla)
  }, [docRejeicao])

  function fecharModalRejeicao() {
    setDocRejeicao(null)
    setMotivoRejeicao('')
  }

  async function processarFicheiro(file: File) {
    if (!file) return
    setEnviando(true)
    try {
      const { storagePath } = await uploadDocumentoProfissionalPdf({
        profissionalId,
        file,
      })
      await registrarDocumentoProfissional({
        profissionalId,
        tipo: tipoSelecionado,
        nomeArquivo: file.name,
        storagePath,
      })
      toast.success('Documento enviado. Aguarde a validação do coordenador.')
      await carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha no upload.')
    } finally {
      setEnviando(false)
    }
  }

  function aoSelecionarFicheiros(ficheiros: FileList | null) {
    const file = ficheiros?.[0]
    if (file) void processarFicheiro(file)
  }

  async function aoAbrir(doc: DocumentoUsuarioRow) {
    try {
      const url = await obterUrlAssinadaDocumento(doc.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o PDF.')
    }
  }

  async function executarAtualizacaoStatus(
    doc: DocumentoUsuarioRow,
    status: StatusDocumentoProfissional,
    motivo?: string,
  ) {
    setProcessandoId(doc.id)
    try {
      await atualizarStatusDocumento({
        documentoId: doc.id,
        status,
        motivoRejeicao: motivo,
      })
      toast.success(
        status === 'validado'
          ? 'Documento validado.'
          : status === 'rejeitado'
            ? 'Documento rejeitado.'
            : 'Status atualizado.',
      )
      await carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status.')
    } finally {
      setProcessandoId(null)
    }
  }

  function aoValidar(doc: DocumentoUsuarioRow, status: StatusDocumentoProfissional) {
    if (status === 'rejeitado') {
      setDocRejeicao(doc)
      setMotivoRejeicao('')
      return
    }
    void executarAtualizacaoStatus(doc, status)
  }

  async function confirmarRejeicao() {
    if (!docRejeicao) return
    const doc = docRejeicao
    const motivo = motivoRejeicao
    fecharModalRejeicao()
    await executarAtualizacaoStatus(doc, 'rejeitado', motivo)
  }

  async function aoExcluir(doc: DocumentoUsuarioRow) {
    if (!window.confirm(`Remover o documento "${doc.nome_arquivo}"?`)) return
    setProcessandoId(doc.id)
    try {
      await excluirDocumentoProfissional(doc.id)
      toast.success('Documento removido.')
      await carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir.')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Validação do conselho ({tipoConselho.toUpperCase()})
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Para assumir plantões, o documento de{' '}
              <strong>{ROTULOS_TIPO_DOCUMENTO[tipoConselho]}</strong> deve estar com status{' '}
              <strong>Validado</strong>.
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
              conselhoOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800',
            )}
          >
            {conselhoOk ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <Clock3 className="h-4 w-4" aria-hidden />
            )}
            {conselhoOk ? 'Conselho validado' : 'Pendente de validação'}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tipo de documento
        </label>
        <select
          value={tipoSelecionado}
          onChange={(e) => setTipoSelecionado(e.target.value as TipoDocumentoProfissional)}
          className="w-full max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={enviando}
        >
          {TIPOS_UPLOAD.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ROTULOS_TIPO_DOCUMENTO[tipo]}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          arrastando
            ? 'border-primary-400 bg-primary-50/60'
            : 'border-slate-300 bg-white hover:border-primary-300 hover:bg-slate-50',
          enviando && 'pointer-events-none opacity-60',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          aoSelecionarFicheiros(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            aoSelecionarFicheiros(e.target.files)
            e.target.value = ''
          }}
        />
        {enviando ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
        ) : (
          <Upload className="h-8 w-8 text-slate-400" aria-hidden />
        )}
        <p className="mt-3 text-sm font-medium text-slate-800">
          Arraste um PDF ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Contratos, CRM ou COREN — máximo 10 MB
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Documentos enviados</h3>

        {carregando ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            A carregar documentos…
          </div>
        ) : documentos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm text-slate-600">Nenhum documento enviado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 ug-card">
            {documentos.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {iconeStatus(doc.status)}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {doc.nome_arquivo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ROTULOS_TIPO_DOCUMENTO[doc.tipo]} ·{' '}
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {doc.motivo_rejeicao ? (
                      <p className="mt-0.5 text-xs text-red-600">{doc.motivo_rejeicao}</p>
                    ) : null}
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    classeStatus(doc.status),
                  )}
                >
                  {ROTULOS_STATUS_DOCUMENTO[doc.status]}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Abrir PDF"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => void aoAbrir(doc)}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </button>

                  {podeValidar && doc.status === 'pendente' ? (
                    <>
                      <button
                        type="button"
                        title="Validar"
                        disabled={processandoId === doc.id}
                        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => void aoValidar(doc, 'validado')}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Rejeitar"
                        disabled={processandoId === doc.id}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        onClick={() => void aoValidar(doc, 'rejeitado')}
                      >
                        <XCircle className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : null}

                  {(podeValidar || doc.status !== 'validado') && (
                    <button
                      type="button"
                      title="Excluir"
                      disabled={processandoId === doc.id}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => void aoExcluir(doc)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    {docRejeicao ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
          aria-label="Fechar"
          onClick={fecharModalRejeicao}
        />
        <div
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
          role="dialog"
          aria-modal
          aria-labelledby={tituloRejeicaoId}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" aria-hidden />
              </span>
              <div>
                <h2 id={tituloRejeicaoId} className="text-lg font-semibold text-slate-900">
                  Rejeitar documento
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{docRejeicao.nome_arquivo}</span>
                  {' · '}
                  {ROTULOS_TIPO_DOCUMENTO[docRejeicao.tipo]}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fecharModalRejeicao}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-5">
            <label
              htmlFor="motivo-rejeicao-doc"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Motivo da rejeição <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              ref={motivoRejeicaoRef}
              id="motivo-rejeicao-doc"
              rows={3}
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Ex.: documento ilegível, registro divergente do cadastro…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fecharModalRejeicao}
              disabled={processandoId === docRejeicao.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmarRejeicao()}
              disabled={processandoId === docRejeicao.id}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {processandoId === docRejeicao.id ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <XCircle className="h-4 w-4" aria-hidden />
              )}
              Rejeitar documento
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  )
}
