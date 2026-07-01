import type { LinhaLocalSetorRelatorio } from '../../../lib/relatorios/relatoriosPlantaoDb'
import { fmtDataHoraGeracao } from '../../../lib/relatorios/formatoPegaPlantao'
import {
  RelatorioCabecalhoPegaPlantao,
  RelatorioTabelaPega,
  TdPega,
  ThPega,
} from './RelatorioCabecalhoPegaPlantao'

type Props = {
  linhas: LinhaLocalSetorRelatorio[]
  nomeEmpresa: string
  dataGeracao?: string
  isLoading?: boolean
}

export function RelatorioLocaisSetoresFolha({
  linhas,
  nomeEmpresa,
  dataGeracao,
  isLoading = false,
}: Props) {
  return (
    <>
      <RelatorioCabecalhoPegaPlantao
        nomeEmpresa={nomeEmpresa}
        titulo="Locais e Setores"
        dataGeracao={dataGeracao || fmtDataHoraGeracao()}
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-gray-100" />
      ) : (
        <RelatorioTabelaPega>
          <thead>
            <tr>
              <ThPega>Código Local</ThPega>
              <ThPega>Código Setor</ThPega>
              <ThPega>Local</ThPega>
              <ThPega>Setor</ThPega>
              <ThPega>Rua</ThPega>
              <ThPega>Número</ThPega>
              <ThPega>Complemento</ThPega>
              <ThPega>Bairro</ThPega>
              <ThPega>CEP</ThPega>
              <ThPega>Cidade</ThPega>
              <ThPega>UF</ThPega>
              <ThPega>Situação</ThPega>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <TdPega colSpan={12} className="py-6 text-center text-gray-500">
                  Nenhum local ou setor cadastrado.
                </TdPega>
              </tr>
            ) : (
              linhas.map((l, idx) => (
                <tr key={`${l.codigoLocal}-${l.codigoSetor}-${idx}`}>
                  <TdPega>{l.codigoLocal}</TdPega>
                  <TdPega>{l.codigoSetor}</TdPega>
                  <TdPega>{l.localNome}</TdPega>
                  <TdPega>{l.setorNome}</TdPega>
                  <TdPega>{l.rua}</TdPega>
                  <TdPega>{l.numero}</TdPega>
                  <TdPega>{l.complemento}</TdPega>
                  <TdPega>{l.bairro}</TdPega>
                  <TdPega>{l.cep}</TdPega>
                  <TdPega>{l.cidade}</TdPega>
                  <TdPega>{l.uf}</TdPega>
                  <TdPega>{l.situacao}</TdPega>
                </tr>
              ))
            )}
          </tbody>
        </RelatorioTabelaPega>
      )}
    </>
  )
}
