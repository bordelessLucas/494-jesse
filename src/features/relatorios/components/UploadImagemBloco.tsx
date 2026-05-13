import { ImagePlus, Loader2, Upload } from 'lucide-react'
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import { cn } from '../../../lib/cn'
import {
  TAMANHO_MAX_IMAGEM_RELATORIO_BYTES,
  uploadImagemRelatorio,
} from '../../../lib/storage'

export type UploadImagemBlocoProps = {
  /** URL actual no bloco (p.ex. após upload anterior). */
  urlAtual: string
  /** Chamado com a `publicUrl` devolvida pelo Supabase após upload bem-sucedido. */
  onUploadCompleto: (publicUrl: string) => void
  desabilitado?: boolean
}

/**
 * Zona de arrastar/largar e clique para seleccionar imagem; envia para Supabase Storage.
 */
export function UploadImagemBloco({
  urlAtual,
  onUploadCompleto,
  desabilitado = false,
}: UploadImagemBlocoProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const envioEmCursoRef = useRef(false)
  const [estaArrastar, setEstaArrastar] = useState(false)
  const [aEnviar, setAEnviar] = useState(false)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  const processarFicheiro = useCallback(
    async (file: File | null | undefined) => {
      if (!file || desabilitado) return
      if (envioEmCursoRef.current) return
      setMensagemErro(null)

      if (!file.type.startsWith('image/')) {
        setMensagemErro('Apenas ficheiros de imagem são aceites.')
        return
      }
      if (file.size > TAMANHO_MAX_IMAGEM_RELATORIO_BYTES) {
        setMensagemErro(
          `Ficheiro demasiado grande. Máximo: ${Math.round(TAMANHO_MAX_IMAGEM_RELATORIO_BYTES / (1024 * 1024))} MB.`,
        )
        return
      }

      envioEmCursoRef.current = true
      setAEnviar(true)
      try {
        const publicUrl = await uploadImagemRelatorio(file)
        onUploadCompleto(publicUrl)
      } catch (erro: unknown) {
        const texto =
          erro instanceof Error
            ? erro.message
            : 'Ocorreu um erro inesperado ao enviar a imagem.'
        setMensagemErro(texto)
      } finally {
        envioEmCursoRef.current = false
        setAEnviar(false)
      }
    },
    [desabilitado, onUploadCompleto],
  )

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    void processarFicheiro(file)
    event.target.value = ''
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!desabilitado && !aEnviar) setEstaArrastar(true)
  }

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setEstaArrastar(false)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setEstaArrastar(false)
    if (desabilitado || envioEmCursoRef.current) return
    const file = event.dataTransfer.files?.[0]
    void processarFicheiro(file)
  }

  const mbMax = Math.round(TAMANHO_MAX_IMAGEM_RELATORIO_BYTES / (1024 * 1024))

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-slate-700">Imagem do relatório</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={desabilitado || aEnviar}
          onChange={onChangeInput}
        />
        <button
          type="button"
          disabled={desabilitado || aEnviar}
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          aria-busy={aEnviar}
          aria-describedby={mensagemErro ? `${inputId}-erro` : undefined}
          className={cn(
            'flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-4 text-center transition-colors',
            'outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-1',
            desabilitado || aEnviar
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              : estaArrastar
                ? 'cursor-pointer border-primary-400 bg-primary-50 text-primary-800'
                : 'cursor-pointer border-slate-300 bg-white text-slate-600 hover:border-primary-300 hover:bg-primary-50/40',
          )}
        >
          {aEnviar ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
              <span className="text-sm font-medium text-primary-700">
                A enviar…
              </span>
            </>
          ) : (
            <>
              {estaArrastar ? (
                <Upload className="h-8 w-8 text-primary-600" aria-hidden />
              ) : urlAtual ? (
                <ImagePlus className="h-8 w-8 text-slate-400" aria-hidden />
              ) : (
                <Upload className="h-8 w-8 text-slate-400" aria-hidden />
              )}
              <span className="text-sm font-medium">
                Arraste uma imagem para aqui ou clique para seleccionar
              </span>
              <span className="text-[11px] text-slate-500">
                PNG, JPG, WebP, GIF ou SVG — até {mbMax} MB
              </span>
            </>
          )}
        </button>
      </label>

      {mensagemErro ? (
        <p
          id={`${inputId}-erro`}
          role="alert"
          className="text-xs font-medium text-danger-600"
        >
          {mensagemErro}
        </p>
      ) : null}
    </div>
  )
}
