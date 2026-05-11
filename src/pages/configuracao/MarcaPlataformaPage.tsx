import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ImagePlus, Loader2 } from 'lucide-react'

import { BrandedLogoOrInitial } from '../../components/branding/BrandedLogoOrInitial'
import { DEFAULT_PRIMARY_HEX, normalizeBrandHex } from '../../lib/brandColors'
import { useThemeBranding } from '../../theme/ThemeBrandingProvider'

export function MarcaPlataformaPage() {
  const colorId = useId()
  const fileId = useId()
  const removeId = useId()

  const {
    primaryColor,
    logoUrl,
    isReady,
    loadError,
    setPreviewPrimaryColor,
    persistBranding,
  } = useThemeBranding()

  const [colorInput, setColorInput] = useState(DEFAULT_PRIMARY_HEX)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (!isReady) return
    setColorInput(primaryColor)
    setLogoFile(null)
    setRemoveLogo(false)
    setFormError(null)
    setSavedOk(false)
  }, [isReady, primaryColor, logoUrl])

  useEffect(() => {
    const hex = normalizeBrandHex(colorInput)
    const saved = normalizeBrandHex(primaryColor)
    if (hex && saved && hex === saved) {
      setPreviewPrimaryColor(null)
    } else if (hex) {
      setPreviewPrimaryColor(hex)
    }
  }, [colorInput, primaryColor, setPreviewPrimaryColor])

  useEffect(() => {
    return () => {
      setPreviewPrimaryColor(null)
    }
  }, [setPreviewPrimaryColor])

  useEffect(() => {
    if (!logoFile) {
      setLocalPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLocalPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [logoFile])

  const displayLogoSrc = useMemo(() => {
    if (removeLogo) return null
    if (localPreviewUrl) return localPreviewUrl
    return logoUrl
  }, [localPreviewUrl, logoUrl, removeLogo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSavedOk(false)
    const hex = normalizeBrandHex(colorInput)
    if (!hex) {
      setFormError('Informe uma cor principal válida (#RRGGBB).')
      return
    }
    setSaving(true)
    const { error } = await persistBranding({
      primaryColor: hex,
      logoFile,
      removeLogo,
    })
    setSaving(false)
    if (error) {
      setFormError(error)
      return
    }
    setLogoFile(null)
    setRemoveLogo(false)
    setSavedOk(true)
  }

  if (!isReady) {
    return (
      <section className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden />
        <span className="sr-only">Carregando preferências</span>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          to="/configuracao"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Voltar para configuração
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Marca da plataforma
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Defina a cor principal e o logotipo exibidos na barra lateral e no topo.
          As alterações são salvas na sua conta.
        </p>
      </div>

      {loadError ? (
        <p
          className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900"
          role="status"
        >
          {loadError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-4 sm:w-48">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Barra lateral
              </p>
              <div className="mt-2 inline-flex rounded-xl bg-primary-950 p-4 ring-1 ring-black/10">
                <BrandedLogoOrInitial
                  className="h-14 w-14 rounded-xl"
                  surface="dark"
                  logoSrc={displayLogoSrc}
                  alt=""
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Topo
              </p>
              <div className="mt-2 inline-flex rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                <BrandedLogoOrInitial
                  className="h-8 w-8 rounded-lg"
                  surface="light"
                  logoSrc={displayLogoSrc}
                  alt=""
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div>
              <label
                htmlFor={colorId}
                className="block text-sm font-medium text-slate-700"
              >
                Cor principal
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Usada em botões, links e destaques da interface.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  id={colorId}
                  type="color"
                  value={normalizeBrandHex(colorInput) ?? DEFAULT_PRIMARY_HEX}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1 shadow-sm"
                  aria-label="Escolher cor principal"
                />
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="#2563eb"
                  spellCheck={false}
                  className="min-w-32 flex-1 rounded-md border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={fileId}
                className="block text-sm font-medium text-slate-700"
              >
                Logotipo
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                PNG com fundo transparente ou SVG recomendados — assim o logo
                integra na barra lateral colorida sem “caixa” branca.
              </p>
              <div className="mt-2">
                <label
                  htmlFor={fileId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <ImagePlus className="h-4 w-4 text-primary-600" aria-hidden />
                  Escolher arquivo
                </label>
                <input
                  id={fileId}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setLogoFile(f)
                    setRemoveLogo(false)
                    setSavedOk(false)
                  }}
                />
              </div>
              {logoUrl && !logoFile ? (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    id={removeId}
                    type="checkbox"
                    checked={removeLogo}
                    onChange={(e) => {
                      setRemoveLogo(e.target.checked)
                      if (e.target.checked) setLogoFile(null)
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={removeId} className="text-sm text-slate-600">
                    Remover logotipo atual
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {formError ? (
          <p
            className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        {savedOk ? (
          <p
            className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-900"
            role="status"
          >
            Preferências salvas com sucesso.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Salvar marca
          </button>
        </div>
      </form>
    </section>
  )
}
