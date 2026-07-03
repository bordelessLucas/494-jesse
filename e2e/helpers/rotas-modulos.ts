import type { AssertPagina } from './assert-pagina'

export type RotaModulo = {
  path: string
  nome: string
  assert: AssertPagina
}

export const MODULOS: Record<string, RotaModulo[]> = {
  Painel: [
    { path: '/painel/resumo', nome: 'Resumo', assert: { tipo: 'heading', texto: 'Resumo' } },
    {
      path: '/painel/carga-horaria',
      nome: 'Carga horária',
      assert: { tipo: 'heading', texto: 'Gestão de Carga Horária' },
    },
    {
      path: '/painel/relatorios',
      nome: 'Relatórios financeiros',
      assert: { tipo: 'filtro-relatorio', texto: 'Pagamentos para Plantões' },
    },
    {
      path: '/painel/confirmacoes',
      nome: 'Confirmações',
      assert: { tipo: 'heading', texto: 'Confirmações de plantões' },
    },
  ],

  Relatórios: [
    {
      path: '/relatorios/emissao',
      nome: 'Emissão',
      assert: { tipo: 'heading', texto: 'Emissão de Relatórios' },
    },
    {
      path: '/relatorios/historico',
      nome: 'Histórico',
      assert: { tipo: 'heading', texto: 'Histórico de Relatórios' },
    },
    {
      path: '/relatorios/indicadores-sciras',
      nome: 'Indicadores SCIRAS',
      assert: { tipo: 'heading', texto: 'Indicadores clínicos SCIRAS' },
    },
    {
      path: '/relatorios-plantao/faltas',
      nome: 'Faltas',
      assert: { tipo: 'filtro-relatorio', texto: 'Listagem de Faltas' },
    },
    {
      path: '/relatorios-plantao/escalas',
      nome: 'Escalas (relatório)',
      assert: { tipo: 'filtro-relatorio', texto: 'Escala de Plantões' },
    },
    {
      path: '/relatorios-plantao/profissionais',
      nome: 'Plantões (listagem)',
      assert: { tipo: 'filtro-relatorio', texto: 'Listagem de Plantões' },
    },
    {
      path: '/relatorios-plantao/coordenadores',
      nome: 'Trocas e passagens',
      assert: {
        tipo: 'filtro-relatorio',
        texto: 'Trocas e Passagens entre Profissionais',
      },
    },
  ],

  Escalas: [
    {
      path: '/escalas',
      nome: 'Hub',
      assert: { tipo: 'heading', texto: 'Central de Operação de Escalas' },
    },
    {
      path: '/escalas/mensal',
      nome: 'Mensal',
      assert: { tipo: 'texto', texto: 'Mês / Ano' },
    },
    {
      path: '/escalas/semanal',
      nome: 'Semanal',
      assert: { tipo: 'botao', texto: 'Semana anterior' },
    },
    {
      path: '/escalas/modelos',
      nome: 'Modelos',
      assert: { tipo: 'heading', texto: 'Modelos' },
    },
    {
      path: '/escalas/mural-trocas',
      nome: 'Mural de trocas',
      assert: { tipo: 'heading', texto: 'Mural de Trocas' },
    },
    {
      path: '/minha-agenda',
      nome: 'Minha agenda',
      assert: { tipo: 'heading', texto: 'Meus Próximos Plantões' },
    },
    {
      path: '/ponto',
      nome: 'Ponto eletrónico',
      assert: { tipo: 'heading', texto: 'Ponto eletrónico' },
    },
  ],

  Usuários: [
    {
      path: '/usuarios/profissionais',
      nome: 'Profissionais',
      assert: { tipo: 'heading', texto: 'Profissionais' },
    },
    {
      path: '/usuarios/coordenadores',
      nome: 'Coordenadores',
      assert: { tipo: 'heading', texto: 'Coordenadores' },
    },
    {
      path: '/usuarios/documentos',
      nome: 'Documentos',
      assert: { tipo: 'heading-regex', texto: /Documentos/i },
    },
    {
      path: '/usuarios/locais',
      nome: 'Locais (usuários)',
      assert: { tipo: 'heading', texto: 'Locais de Prestação' },
    },
    {
      path: '/usuarios/visualizadores',
      nome: 'Visualizadores',
      assert: { tipo: 'heading', texto: 'Visualizadores' },
    },
    {
      path: '/usuarios/especialidades',
      nome: 'Especialidades',
      assert: { tipo: 'heading', texto: 'Especialidades' },
    },
  ],

  Financeiro: [
    {
      path: '/financeiro',
      nome: 'Visão geral',
      assert: { tipo: 'heading', texto: 'Visão geral' },
    },
    {
      path: '/financeiro/extratos',
      nome: 'Extratos',
      assert: { tipo: 'heading', texto: 'Extrato Financeiro' },
    },
    {
      path: '/financeiro/repasses',
      nome: 'Repasses',
      assert: { tipo: 'heading', texto: 'Repasses' },
    },
  ],

  Configuração: [
    {
      path: '/configuracao',
      nome: 'Hub configuração',
      assert: { tipo: 'heading', texto: 'Configuração' },
    },
    {
      path: '/configuracao/locais',
      nome: 'Locais',
      assert: { tipo: 'heading', texto: 'Locais de Prestação' },
    },
    {
      path: '/configuracao/marca',
      nome: 'Marca',
      assert: { tipo: 'heading', texto: 'Marca da plataforma' },
    },
    {
      path: '/configuracao/avancadas',
      nome: 'Avançadas',
      assert: { tipo: 'heading', texto: 'Configurações avançadas' },
    },
    {
      path: '/configuracao/grupos',
      nome: 'Grupos',
      assert: { tipo: 'heading-h2', texto: 'Grupos' },
    },
    {
      path: '/configuracao/tipos-plantao',
      nome: 'Tipos de plantão',
      assert: { tipo: 'heading-h2', texto: 'Tipos de Plantão' },
    },
    {
      path: '/configuracao/situacoes-plantao',
      nome: 'Situações do plantão',
      assert: { tipo: 'heading-h2', texto: 'Situações do Plantão' },
    },
    {
      path: '/configuracao/valores',
      nome: 'Valores',
      assert: { tipo: 'heading-h2', texto: 'Valores' },
    },
    {
      path: '/configuracao/auto-ajustes',
      nome: 'Auto-ajustes',
      assert: { tipo: 'heading-h2', texto: 'Auto-Ajustes' },
    },
    {
      path: '/configuracao/tipos-contratacao',
      nome: 'Tipos de contratação',
      assert: { tipo: 'heading-h2', texto: 'Tipos de Contratação' },
    },
    {
      path: '/configuracao/habilidades',
      nome: 'Habilidades',
      assert: { tipo: 'heading-h2', texto: 'Habilidades' },
    },
  ],

  Gestão: [
    {
      path: '/gestao/emissao/uti-adulto',
      nome: 'Emissão UTI adulto',
      assert: { tipo: 'heading', texto: 'Relatório UTI Adulto' },
    },
    {
      path: '/gestao/emissao/uti-pediatrica',
      nome: 'Emissão UTI pediátrica',
      assert: { tipo: 'heading', texto: 'Relatório UTI Pediátrica' },
    },
    {
      path: '/gestao/frequencia/quinzenal',
      nome: 'Frequência quinzenal',
      assert: { tipo: 'heading', texto: 'Frequência Quinzenal' },
    },
    {
      path: '/gestao/frequencia/mensal',
      nome: 'Frequência mensal',
      assert: { tipo: 'heading', texto: 'Frequência Mensal' },
    },
    {
      path: '/gestao/frequencia/semanal',
      nome: 'Frequência semanal',
      assert: { tipo: 'heading', texto: 'Frequência Semanal' },
    },
    {
      path: '/gestao/frequencia/producao',
      nome: 'Produção de frequência',
      assert: { tipo: 'heading', texto: 'Produção de Frequência' },
    },
    {
      path: '/gestao/cadastros/tipo-servico',
      nome: 'Tipo serviço (SCIH)',
      assert: { tipo: 'heading', texto: 'SCIH' },
    },
    {
      path: '/gestao/cadastros/tipo-servico/scih',
      nome: 'SCIH',
      assert: { tipo: 'heading', texto: 'SCIH' },
    },
    {
      path: '/gestao/cadastros/tipo-servico/uti-adulto',
      nome: 'UTI adulto',
      assert: { tipo: 'heading', texto: 'UTI Adulto' },
    },
    {
      path: '/gestao/cadastros/tipo-servico/uti-pediatrica',
      nome: 'UTI pediátrica',
      assert: { tipo: 'heading', texto: 'UTI Pediátrica' },
    },
    {
      path: '/gestao/cadastros/utilizadores/coordenador',
      nome: 'Utilizador coordenador',
      assert: { tipo: 'heading', texto: 'Coordenador' },
    },
    {
      path: '/gestao/cadastros/utilizadores/auditor',
      nome: 'Utilizador auditor',
      assert: { tipo: 'heading', texto: 'Auditor' },
    },
    {
      path: '/gestao/cadastros/utilizadores/faturista',
      nome: 'Utilizador faturista',
      assert: { tipo: 'heading', texto: 'Faturista / Financeiro' },
    },
  ],

  Conta: [
    {
      path: '/meus-dados',
      nome: 'Meus dados',
      assert: { tipo: 'heading', texto: 'Meus dados' },
    },
    {
      path: '/notificacoes',
      nome: 'Notificações',
      assert: { tipo: 'heading', texto: 'Notificações' },
    },
  ],

  Admin: [
    {
      path: '/admin/suporte',
      nome: 'Inbox de suporte',
      assert: { tipo: 'heading', texto: 'Inbox de Suporte' },
    },
  ],
}

export const REDIRECTS_LEGACY: { de: string; para: RegExp }[] = [
  { de: '/profissionais', para: /\/usuarios\/profissionais$/ },
  { de: '/locais', para: /\/configuracao\/locais$/ },
  { de: '/cadastros/profissionais', para: /\/usuarios\/profissionais$/ },
  { de: '/painel', para: /\/painel\/resumo$/ },
  { de: '/relatorios', para: /\/relatorios\/emissao$/ },
]
