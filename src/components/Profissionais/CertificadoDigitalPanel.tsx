import { Loader2, RefreshCw, ShieldCheck, Upload } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { cn } from '../../lib/cn'
import {
  buscarCertificadoProfissional,
  salvarCertificadoProfissional,
} from '../../lib/certificados/certificadosDigitaisDb'
import type { CertificadoDigitalRow } from '../../lib/certificados/certificadosDigitaisTypes'
import { EXTENSOES_CERTIFICADO } from '../../lib/certificados/certificadosDigitaisTypes'
import {
  certificadoEstaAtivo,
  extrairTitularCertificadoPfx,
  extrairValidadeCertificadoPfx,
} from '../../lib/certificados/extrairValidadeCertificado'
import {
  removerCertificadoStorage,
  uploadCertificadoDigital,
} from '../../lib/certificados/uploadCertificadoDigital'
import { formatarDataSegura } from '../../lib/datas/formatacaoSegura'

type CertificadoDigitalPanelProps = {
  profissionalId: string
}

export function CertificadoDigitalPanel({ profissionalId }: CertificadoDigitalPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pinId = useId()
  const [certificado, setCertificado] = useState<CertificadoDigitalRow | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [pin, setPin] = useState('')
  const [arrastando, setArrastando] = useState(false)

  const certificadoAtivo =
    certificado != null && certificadoEstaAtivo(certificado.valido_ate)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const row = await buscarCertificadoProfissional(profissionalId)
      setCertificado(row)
      if (!row || !certificadoEstaAtivo(row.valido_ate)) {
        setMostrarFormulario(true)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar certificado.')
      setCertificado(null)
      setMostrarFormulario(true)
    } finally {
      setCarregando(false)
    }
  }, [profissionalId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  function limparFormulario() {
    setArquivo(null)
    setPin('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function aceitarFicheiro(file: File | undefined) {
    if (!file) return
    const nome = file.name.toLowerCase()
    if (!EXTENSOES_CERTIFICADO.some((ext) => nome.endsWith(ext))) {
      toast.error('Envie apenas ficheiros .pfx ou .p12.')
      return
    }
    setArquivo(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) {
      toast.error('Selecione o ficheiro do certificado.')
      return
    }
    if (!pin.trim()) {
      toast.error('Informe o PIN/senha do certificado.')
      return
    }

    setEnviando(true)
    const caminhoAnterior = certificado?.certificado_url ?? null

    try {
      const buffer = await arquivo.arrayBuffer()
      const validoAte = await extrairValidadeCertificadoPfx(buffer, pin)
      const titularCertificado = await extrairTitularCertificadoPfx(buffer, pin)

      const { storagePath } = await uploadCertificadoDigital({
        profissionalId,
        file: arquivo,
      })

      await salvarCertificadoProfissional({
        certificadoUrl: storagePath,
        senhaPlana: pin,
        validoAte,
        titularCertificado,
      })

      if (caminhoAnterior && caminhoAnterior !== storagePath) {
        await removerCertificadoStorage(caminhoAnterior)
      }

      toast.success('Certificado digital registado com sucesso.')
      limparFormulario()
      setMostrarFormulario(false)
      await carregar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao enviar certificado.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" aria-hidden />
        A carregar certificado…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Assinatura e Certificado Digital
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Envie o seu certificado ICP-Brasil (.pfx ou .p12) para assinatura digital de
          documentos. O ficheiro fica armazenado de forma privada e o PIN é criptografado
          no servidor.
        </p>
      </div>

      {certificadoAtivo && !mostrarFormulario ? (
        <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Certificado Digital Ativo
                {certificado!.titular_certificado
                  ? ` — ${certificado!.titular_certificado}`
                  : ''}{' '}
                (Válido até:{' '}
                {formatarDataSegura(certificado!.valido_ate, 'dd/MM/yyyy')})
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Registado em{' '}
                {formatarDataSegura(certificado!.criado_em, 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              limparFormulario()
              setMostrarFormulario(true)
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Substituir Certificado
          </button>
        </div>
      ) : null}

      {mostrarFormulario ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {certificadoAtivo ? (
            <p className="text-sm text-slate-600">
              Ao enviar um novo certificado, o anterior será substituído.
            </p>
          ) : certificado && !certificadoAtivo ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              O certificado anterior expirou em{' '}
              {formatarDataSegura(certificado.valido_ate, 'dd/MM/yyyy')}. Envie um novo
              ficheiro para reativar a assinatura digital.
            </p>
          ) : null}

          <div
            className={cn(
              'relative rounded-xl border-2 border-dashed p-6 text-center transition',
              arrastando
                ? 'border-primary-400 bg-primary-50'
                : 'border-slate-200 bg-slate-50 hover:border-primary-300',
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault()
              setArrastando(false)
              aceitarFicheiro(e.dataTransfer.files[0])
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pfx,.p12,application/x-pkcs12,application/pkcs12"
              className="sr-only"
              id="certificado-digital-upload"
              onChange={(e) => aceitarFicheiro(e.target.files?.[0])}
            />
            <label
              htmlFor="certificado-digital-upload"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-primary-600" aria-hidden />
              <span className="text-sm font-medium text-slate-800">
                {arquivo ? arquivo.name : 'Clique ou arraste o certificado (.pfx / .p12)'}
              </span>
              <span className="text-xs text-slate-500">Tamanho máximo: 5 MB</span>
            </label>
          </div>

          <div>
            <label htmlFor={pinId} className="mb-1.5 block text-sm font-medium text-slate-700">
              PIN / Senha do Certificado
            </label>
            <input
              id={pinId}
              type="password"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Senha do certificado digital"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={enviando || !arquivo || !pin.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {certificado ? 'Guardar novo certificado' : 'Enviar certificado'}
            </button>

            {certificadoAtivo ? (
              <button
                type="button"
                onClick={() => {
                  limparFormulario()
                  setMostrarFormulario(false)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  )
}
