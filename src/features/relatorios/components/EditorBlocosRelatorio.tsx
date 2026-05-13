import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  Trash2,
  Type,
} from 'lucide-react'
import type { ChangeEvent, ComponentType } from 'react'

import { cn } from '../../../lib/cn'
import type {
  AtualizacaoImagem,
  BlocosRelatorioOperacoes,
} from '../hooks/useBlocosRelatorio'
import type { RelatorioAtividadesBloco } from '../types'
import { UploadImagemBloco } from './UploadImagemBloco'

type EditorBlocosRelatorioProps = BlocosRelatorioOperacoes

/**
 * Editor visual e interativo dos blocos do relatório SCIRAS.
 *
 * Apresenta uma lista vertical de cartões editáveis (um por bloco) seguida
 * de dois botões de adição. É um componente "burro" — não possui estado
 * próprio, recebendo tudo via props vindas do hook `useBlocosRelatorio`.
 */
export function EditorBlocosRelatorio({
  blocos,
  adicionarTexto,
  adicionarImagem,
  remover,
  moverParaCima,
  moverParaBaixo,
  atualizarTexto,
  atualizarImagem,
}: EditorBlocosRelatorioProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Conteúdo do relatório
        </h2>
        <p className="text-xs text-slate-500">
          Edite, reordene ou remova os blocos. As mudanças aparecem no preview
          em tempo real.
        </p>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {blocos.map((bloco, indice) => (
          <li key={indice}>
            <CartaoBloco
              bloco={bloco}
              indice={indice}
              ehPrimeiro={indice === 0}
              ehUltimo={indice === blocos.length - 1}
              onRemover={() => remover(indice)}
              onSubir={() => moverParaCima(indice)}
              onDescer={() => moverParaBaixo(indice)}
              onAtualizarTexto={(content) => atualizarTexto(indice, content)}
              onAtualizarImagem={(atualizacao) =>
                atualizarImagem(indice, atualizacao)
              }
            />
          </li>
        ))}

        {blocos.length === 0 ? (
          <li className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
            Nenhum bloco ainda. Use os botões abaixo para começar.
          </li>
        ) : null}
      </ul>

      <div className="grid grid-cols-2 gap-2">
        <BotaoAdicionar
          icone={Type}
          rotulo="Adicionar Texto"
          onClick={adicionarTexto}
        />
        <BotaoAdicionar
          icone={ImageIcon}
          rotulo="Adicionar Imagem"
          onClick={adicionarImagem}
        />
      </div>
    </div>
  )
}

/* ============================================================
 * Cartão de um bloco — cabeçalho com ações + corpo editável
 * ============================================================ */

type CartaoBlocoProps = {
  bloco: RelatorioAtividadesBloco
  indice: number
  ehPrimeiro: boolean
  ehUltimo: boolean
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

/* ============================================================
 * Sub-editores especializados por tipo de bloco
 * ============================================================ */

type EditorBlocoTextoProps = {
  content: string
  onChange: (valor: string) => void
}

function EditorBlocoTexto({ content, onChange }: EditorBlocoTextoProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Escreva o conteúdo do parágrafo…"
      rows={4}
      className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
    />
  )
}

type EditorBlocoImagemProps = {
  url: string
  caption: string
  onChange: (atualizacao: AtualizacaoImagem) => void
}

function EditorBlocoImagem({
  url,
  caption,
  onChange,
}: EditorBlocoImagemProps) {
  return (
    <div className="flex flex-col gap-2">
      <UploadImagemBloco
        urlAtual={url}
        onUploadCompleto={(publicUrl) => onChange({ url: publicUrl })}
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
            alt={caption || 'Pré-visualização da imagem'}
            className="max-h-20 w-auto object-contain"
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
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  )
}

/* ============================================================
 * Botões reutilizáveis
 * ============================================================ */

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
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500',
        variante === 'perigo' &&
          'hover:bg-danger-50 hover:text-danger-700',
      )}
    >
      <Icone className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
}

type BotaoAdicionarProps = {
  icone: IconeLucide
  rotulo: string
  onClick: () => void
}

function BotaoAdicionar({
  icone: Icone,
  rotulo,
  onClick,
}: BotaoAdicionarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
    >
      <Icone className="h-3.5 w-3.5" aria-hidden />
      <span>+ {rotulo}</span>
    </button>
  )
}
