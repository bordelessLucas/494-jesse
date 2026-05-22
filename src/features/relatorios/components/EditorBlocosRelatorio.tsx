import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Trash2,
  Type,
} from 'lucide-react'
import type { ChangeEvent, ComponentType } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { cn } from '../../../lib/cn'
import { uploadImagemRelatorio } from '../../../lib/storage'
import type {
  AtualizacaoImagem,
  BlocosRelatorioOperacoes,
} from '../hooks/useBlocosRelatorio'
import type { RelatorioAtividadesBloco } from '../types'
import { UploadImagemBloco } from './UploadImagemBloco'

/**
 * Editor dos blocos do relatório SCIRAS.
 * Cada clique em «Adicionar» cria um cartão visível com o campo correspondente.
 */
export function EditorBlocosRelatorio({
  blocos,
  adicionarTexto,
  adicionarImagem,
  adicionarImagemComUrl,
  remover,
  moverParaCima,
  moverParaBaixo,
  atualizarTexto,
  atualizarImagem,
  atualizarImagemPorChave,
}: BlocosRelatorioOperacoes) {
  const idFicheiroGhost = useId()
  const refFicheiroGhost = useRef<HTMLInputElement>(null)
  const refLista = useRef<HTMLUListElement>(null)
  const refChaveImagemPendente = useRef<string | null>(null)
  const [chaveTextoParaFocar, setChaveTextoParaFocar] = useState<string | null>(
    null,
  )
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [aEnviarImagem, setAEnviarImagem] = useState(false)

  const scrollParaBloco = useCallback((clientKey: string) => {
    window.requestAnimationFrame(() => {
      const el = refLista.current?.querySelector(
        `[data-bloco-editor="${CSS.escape(clientKey)}"]`,
      )
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [])

  const aoClicarAdicionarTexto = useCallback(() => {
    setErroUpload(null)
    const k = adicionarTexto()
    setChaveTextoParaFocar(k)
    scrollParaBloco(k)
  }, [adicionarTexto, scrollParaBloco])

  const aoClicarAdicionarImagem = useCallback(() => {
    setErroUpload(null)
    const k = adicionarImagem()
    refChaveImagemPendente.current = k
    scrollParaBloco(k)
    window.requestAnimationFrame(() => {
      refFicheiroGhost.current?.click()
    })
  }, [adicionarImagem, scrollParaBloco])

  const aoFicheiroSelecionado = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      event.target.value = ''
      const chave = refChaveImagemPendente.current
      refChaveImagemPendente.current = null

      if (!file) return

      setErroUpload(null)
      setAEnviarImagem(true)
      try {
        const publicUrl = await uploadImagemRelatorio(file)
        if (chave) {
          atualizarImagemPorChave(chave, { url: publicUrl })
        } else {
          adicionarImagemComUrl(publicUrl)
        }
      } catch (e) {
        setErroUpload(
          e instanceof Error ? e.message : 'Não foi possível enviar a imagem.',
        )
      } finally {
        setAEnviarImagem(false)
      }
    },
    [adicionarImagemComUrl, atualizarImagemPorChave],
  )

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={refFicheiroGhost}
        id={idFicheiroGhost}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={aoFicheiroSelecionado}
      />

      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Conteúdo do relatório
        </h2>
        <p className="text-xs text-slate-500">
          Edite, reordene ou remova os blocos. As mudanças aparecem no preview
          em tempo real e entram no PDF ao imprimir.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <BotaoAdicionar
          icone={Type}
          rotulo="Adicionar Texto"
          variante="contorno"
          onClick={aoClicarAdicionarTexto}
        />
        <BotaoAdicionar
          icone={ImageIcon}
          rotulo="Adicionar Imagem"
          variante="tracejado"
          disabled={aEnviarImagem}
          onClick={aoClicarAdicionarImagem}
        />
      </div>

      {erroUpload ? (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {erroUpload}
        </p>
      ) : null}

      {aEnviarImagem ? (
        <p className="text-xs text-primary-700">A enviar imagem…</p>
      ) : null}

      <ul
        ref={refLista}
        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/60 p-2"
      >
        {blocos.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-xs text-slate-500">
            Nenhum bloco ainda.
            <br />
            Clique em <strong>+ Adicionar Texto</strong> ou{' '}
            <strong>+ Adicionar Imagem</strong> acima.
          </li>
        ) : (
          blocos.map((bloco, indice) => (
            <li key={bloco.clientKey} data-bloco-editor={bloco.clientKey}>
              <CartaoBloco
                bloco={bloco}
                indice={indice}
                ehPrimeiro={indice === 0}
                ehUltimo={indice === blocos.length - 1}
                textoDeveReceberFoco={
                  bloco.type === 'text' && bloco.clientKey === chaveTextoParaFocar
                }
                onConsumirFocoTexto={() => setChaveTextoParaFocar(null)}
                onRemover={() => remover(indice)}
                onSubir={() => moverParaCima(indice)}
                onDescer={() => moverParaBaixo(indice)}
                onAtualizarTexto={(content) => atualizarTexto(indice, content)}
                onAtualizarImagem={(atualizacao) =>
                  atualizarImagem(indice, atualizacao)
                }
              />
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

type CartaoBlocoProps = {
  bloco: RelatorioAtividadesBloco
  indice: number
  ehPrimeiro: boolean
  ehUltimo: boolean
  textoDeveReceberFoco: boolean
  onConsumirFocoTexto: () => void
  onRemover: () => void
  onSubir: () => void
  onDescer: () => void
  onAtualizarTexto: (content: string) => void
  onAtualizarImagem: (atualizacao: AtualizacaoImagem) => void
}

function CartaoBloco({
  bloco,
  indice,
  ehPrimeiro,
  ehUltimo,
  textoDeveReceberFoco,
  onConsumirFocoTexto,
  onRemover,
  onSubir,
  onDescer,
  onAtualizarTexto,
  onAtualizarImagem,
}: CartaoBlocoProps) {
  const rotuloTipo =
    bloco.type === 'text'
      ? `Texto · #${indice + 1}`
      : `Imagem · #${indice + 1}`

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {rotuloTipo}
        </span>
        <div className="flex items-center gap-1">
          <BotaoIconeAcao
            icone={ArrowUp}
            rotulo="Mover bloco para cima"
            onClick={onSubir}
            desabilitado={ehPrimeiro}
          />
          <BotaoIconeAcao
            icone={ArrowDown}
            rotulo="Mover bloco para baixo"
            onClick={onDescer}
            desabilitado={ehUltimo}
          />
          <BotaoIconeAcao
            icone={Trash2}
            rotulo="Remover bloco"
            onClick={onRemover}
            variante="perigo"
          />
        </div>
      </header>

      <div className="p-3">
        {bloco.type === 'text' ? (
          <EditorBlocoTexto
            content={bloco.content}
            onChange={onAtualizarTexto}
            focoInicial={textoDeveReceberFoco}
            onFocoInicialConsumido={onConsumirFocoTexto}
          />
        ) : (
          <EditorBlocoImagem
            url={bloco.url}
            caption={bloco.caption ?? ''}
            onChange={onAtualizarImagem}
          />
        )}
      </div>
    </div>
  )
}

type EditorBlocoTextoProps = {
  content: string
  onChange: (valor: string) => void
  focoInicial: boolean
  onFocoInicialConsumido: () => void
}

function EditorBlocoTexto({
  content,
  onChange,
  focoInicial,
  onFocoInicialConsumido,
}: EditorBlocoTextoProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!focoInicial) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    onFocoInicialConsumido()
  }, [focoInicial, onFocoInicialConsumido])

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Escreva o parágrafo aqui…"
      rows={5}
      className="w-full resize-y rounded-md border-2 border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
    />
  )
}

type EditorBlocoImagemProps = {
  url: string
  caption: string
  onChange: (atualizacao: AtualizacaoImagem) => void
}

function EditorBlocoImagem({ url, caption, onChange }: EditorBlocoImagemProps) {
  return (
    <div className="flex flex-col gap-2">
      <UploadImagemBloco
        urlAtual={url}
        onUploadCompleto={(publicUrl) => onChange({ url: publicUrl })}
      />

      <CampoTextoCompacto
        label="Ou cole a URL da imagem"
        type="url"
        value={url}
        placeholder="https://…"
        onChange={(valor) => onChange({ url: valor.trim() })}
      />

      <CampoTextoCompacto
        label="Legenda (opcional)"
        type="text"
        value={caption}
        placeholder="Figura 1 — …"
        onChange={(valor) => onChange({ caption: valor })}
      />

      {url ? (
        <div className="mt-1 flex justify-center rounded-md border border-slate-200 bg-slate-50 p-2">
          <img
            src={url}
            alt={caption || 'Pré-visualização'}
            className="max-h-24 w-auto object-contain"
          />
        </div>
      ) : null}
    </div>
  )
}

type CampoTextoCompactoProps = {
  label: string
  type: 'text' | 'url'
  value: string
  placeholder?: string
  onChange: (valor: string) => void
}

function CampoTextoCompacto({
  label,
  type,
  value,
  placeholder,
  onChange,
}: CampoTextoCompactoProps) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  )
}

type IconeLucide = ComponentType<{ className?: string }>

type BotaoIconeAcaoProps = {
  icone: IconeLucide
  rotulo: string
  onClick: () => void
  desabilitado?: boolean
  variante?: 'padrao' | 'perigo'
}

function BotaoIconeAcao({
  icone: Icone,
  rotulo,
  onClick,
  desabilitado = false,
  variante = 'padrao',
}: BotaoIconeAcaoProps) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={onClick}
      disabled={desabilitado}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variante === 'perigo' && 'hover:bg-danger-50 hover:text-danger-700',
      )}
    >
      <Icone className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
}

type BotaoAdicionarProps = {
  icone: IconeLucide
  rotulo: string
  variante?: 'tracejado' | 'contorno'
  disabled?: boolean
  onClick: () => void
}

function BotaoAdicionar({
  icone: Icone,
  rotulo,
  variante = 'tracejado',
  disabled = false,
  onClick,
}: BotaoAdicionarProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50',
        variante === 'contorno' &&
          'border-2 border-slate-900 text-primary-700 hover:bg-primary-50',
        variante === 'tracejado' &&
          'border border-dashed border-slate-300 text-slate-700 hover:border-primary-400 hover:bg-primary-50/60',
      )}
    >
      <Icone className="h-3.5 w-3.5" aria-hidden />
      <span>+ {rotulo}</span>
    </button>
  )
}
