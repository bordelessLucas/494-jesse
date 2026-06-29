import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from './layouts/AuthLayout'
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { RotaInicial } from './components/auth/RotaInicial'
import { MasterOnlyOutlet } from './components/auth/MasterOnlyOutlet'
import { RedirectIfAuthenticated, RequireAuth } from './lib/auth/RequireAuth'
import { PageLoader } from './components/PageLoader'
import { CadastroPage } from './pages/CadastroPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AppToaster } from './components/AppToaster'
import { PwaInstallPrompt } from './components/PwaInstallPrompt'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'

const AlterarSenhaObrigatoriaPage = lazy(() =>
  import('./pages/AlterarSenhaObrigatoriaPage').then((m) => ({
    default: m.AlterarSenhaObrigatoriaPage,
  })),
)
const CadastrosLocaisPage = lazy(() =>
  import('./pages/CadastrosLocaisPage').then((m) => ({
    default: m.CadastrosLocaisPage,
  })),
)
const CoordenadoresPage = lazy(() =>
  import('./pages/CoordenadoresPage').then((m) => ({
    default: m.CoordenadoresPage,
  })),
)
const ConfiguracaoPage = lazy(() =>
  import('./pages/ConfiguracaoPage').then((m) => ({
    default: m.ConfiguracaoPage,
  })),
)
const MarcaPlataformaPage = lazy(() =>
  import('./pages/configuracao/MarcaPlataformaPage').then((m) => ({
    default: m.MarcaPlataformaPage,
  })),
)
const ConfiguracaoSecaoPage = lazy(() =>
  import('./pages/configuracao/ConfiguracaoSecaoPage').then((m) => ({
    default: m.ConfiguracaoSecaoPage,
  })),
)
const ConfiguracoesAvancadasPage = lazy(() =>
  import('./pages/configuracao/ConfiguracoesAvancadasPage').then((m) => ({
    default: m.ConfiguracoesAvancadasPage,
  })),
)
const EscalasPage = lazy(() =>
  import('./pages/EscalasPage').then((m) => ({ default: m.EscalasPage })),
)
const EscalaMensalPage = lazy(() =>
  import('./pages/Escalas/EscalaMensalPage').then((m) => ({
    default: m.EscalaMensalPage,
  })),
)
const MinhaAgendaPage = lazy(() =>
  import('./pages/Escalas/MinhaAgendaPage').then((m) => ({
    default: m.MinhaAgendaPage,
  })),
)
const EscalasModelosPage = lazy(() =>
  import('./pages/EscalasModelosPage').then((m) => ({
    default: m.EscalasModelosPage,
  })),
)
const EscalaSemanalPage = lazy(() =>
  import('./pages/Escalas/EscalaSemanalPage').then((m) => ({
    default: m.EscalaSemanalPage,
  })),
)
const FinanceiroPage = lazy(() =>
  import('./pages/FinanceiroPage').then((m) => ({ default: m.FinanceiroPage })),
)
const FinanceiroExtratosPage = lazy(() =>
  import('./pages/FinanceiroExtratosPage').then((m) => ({
    default: m.FinanceiroExtratosPage,
  })),
)
const FinanceiroRepassesPage = lazy(() =>
  import('./pages/FinanceiroRepassesPage').then((m) => ({
    default: m.FinanceiroRepassesPage,
  })),
)
const LocaisPage = lazy(() =>
  import('./pages/LocaisPage').then((m) => ({ default: m.LocaisPage })),
)
const MeusDadosPage = lazy(() =>
  import('./pages/MeusDadosPage').then((m) => ({ default: m.MeusDadosPage })),
)
const NotificacoesPage = lazy(() =>
  import('./pages/NotificacoesPage').then((m) => ({
    default: m.NotificacoesPage,
  })),
)
const SuporteInboxPage = lazy(() =>
  import('./pages/Admin/SuporteInboxPage').then((m) => ({
    default: m.SuporteInboxPage,
  })),
)
const ProfissionaisPage = lazy(() =>
  import('./pages/ProfissionaisPage').then((m) => ({
    default: m.ProfissionaisPage,
  })),
)
const CargaHorariaPage = lazy(() =>
  import('./pages/Dashboard/CargaHorariaPage').then((m) => ({
    default: m.CargaHorariaPage,
  })),
)
const RelatoriosPage = lazy(() =>
  import('./pages/Dashboard/RelatoriosPage').then((m) => ({
    default: m.RelatoriosPage,
  })),
)
const ResumoPage = lazy(() =>
  import('./pages/Dashboard/ResumoPage').then((m) => ({ default: m.ResumoPage })),
)
const ConfirmacoesPainelPage = lazy(() =>
  import('./pages/Dashboard/ConfirmacoesPainelPage').then((m) => ({
    default: m.ConfirmacoesPainelPage,
  })),
)
const DocumentosUsuarioPage = lazy(() =>
  import('./pages/UsuariosEmBrevePage').then((m) => ({
    default: m.DocumentosUsuarioPage,
  })),
)
const EmissaoRelatoriosPage = lazy(() =>
  import('./pages/Relatorios/EmissaoRelatoriosPage').then((m) => ({
    default: m.EmissaoRelatoriosPage,
  })),
)
const HistoricoRelatoriosPage = lazy(() =>
  import('./pages/Relatorios/HistoricoRelatoriosPage').then((m) => ({
    default: m.HistoricoRelatoriosPage,
  })),
)
const IndicadoresScirasPage = lazy(() =>
  import('./pages/Relatorios/IndicadoresScirasPage').then((m) => ({
    default: m.IndicadoresScirasPage,
  })),
)
const MuralTrocasPage = lazy(() =>
  import('./pages/Escalas/MuralTrocasPage').then((m) => ({
    default: m.MuralTrocasPage,
  })),
)
const PontoPage = lazy(() =>
  import('./pages/Profissional/PontoPage').then((m) => ({ default: m.PontoPage })),
)
const RelatorioPlantaoFaltasPage = lazy(() =>
  import('./pages/RelatoriosPlantao/RelatoriosPlantaoPlaceholderPages').then((m) => ({
    default: m.RelatorioPlantaoFaltasPage,
  })),
)
const RelatorioPlantaoEscalasPage = lazy(() =>
  import('./pages/RelatoriosPlantao/RelatoriosPlantaoPlaceholderPages').then((m) => ({
    default: m.RelatorioPlantaoEscalasPage,
  })),
)
const RelatorioPlantaoProfissionaisPage = lazy(() =>
  import('./pages/RelatoriosPlantao/RelatoriosPlantaoPlaceholderPages').then((m) => ({
    default: m.RelatorioPlantaoProfissionaisPage,
  })),
)
const RelatorioPlantaoCoordenadoresPage = lazy(() =>
  import('./pages/RelatoriosPlantao/RelatoriosPlantaoPlaceholderPages').then((m) => ({
    default: m.RelatorioPlantaoCoordenadoresPage,
  })),
)
const GestaoEmissaoUtiAdultoPage = lazy(() =>
  import('./pages/Gestao/GestaoEmissaoPlaceholderPages').then((m) => ({
    default: m.GestaoEmissaoUtiAdultoPage,
  })),
)
const GestaoEmissaoUtiPediatricaPage = lazy(() =>
  import('./pages/Gestao/GestaoEmissaoPlaceholderPages').then((m) => ({
    default: m.GestaoEmissaoUtiPediatricaPage,
  })),
)
const FrequenciaQuinzenalPage = lazy(() =>
  import('./pages/Gestao/FrequenciaPlaceholderPages').then((m) => ({
    default: m.FrequenciaQuinzenalPage,
  })),
)
const FrequenciaMensalPage = lazy(() =>
  import('./pages/Gestao/FrequenciaPlaceholderPages').then((m) => ({
    default: m.FrequenciaMensalPage,
  })),
)
const FrequenciaSemanalPage = lazy(() =>
  import('./pages/Gestao/FrequenciaPlaceholderPages').then((m) => ({
    default: m.FrequenciaSemanalPage,
  })),
)
const TipoServicoPage = lazy(() =>
  import('./pages/Gestao/CadastrosGestaoPlaceholderPages').then((m) => ({
    default: m.TipoServicoPage,
  })),
)
const UtilizadorCoordenadorGestaoPage = lazy(() =>
  import('./pages/Gestao/CadastrosGestaoPlaceholderPages').then((m) => ({
    default: m.UtilizadorCoordenadorGestaoPage,
  })),
)
const UtilizadorAuditorPage = lazy(() =>
  import('./pages/Gestao/CadastrosGestaoPlaceholderPages').then((m) => ({
    default: m.UtilizadorAuditorPage,
  })),
)
const UtilizadorFaturistaPage = lazy(() =>
  import('./pages/Gestao/CadastrosGestaoPlaceholderPages').then((m) => ({
    default: m.UtilizadorFaturistaPage,
  })),
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="auth" element={<Navigate to="/login" replace />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="cadastro" element={<CadastroPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AuthenticatedLayout />}>
            <Route index element={<RotaInicial />} />

            <Route
              path="painel"
              element={<Navigate to="/painel/resumo" replace />}
            />
            <Route
              path="painel/resumo"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ResumoPage />
                </Suspense>
              }
            />
            <Route
              path="painel/carga-horaria"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CargaHorariaPage />
                </Suspense>
              }
            />
            <Route
              path="painel/relatorios"
              element={
                <Suspense fallback={<PageLoader />}>
                  <RelatoriosPage />
                </Suspense>
              }
            />

            <Route
              path="relatorios"
              element={<Navigate to="/relatorios/emissao" replace />}
            />
            <Route
              path="relatorios/emissao"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EmissaoRelatoriosPage />
                </Suspense>
              }
            />
            <Route
              path="relatorios/historico"
              element={
                <Suspense fallback={<PageLoader />}>
                  <HistoricoRelatoriosPage />
                </Suspense>
              }
            />
            <Route
              path="relatorios/indicadores-sciras"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IndicadoresScirasPage />
                </Suspense>
              }
            />

            <Route
              path="escalas"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EscalasPage />
                </Suspense>
              }
            />
            <Route
              path="escalas/mensal"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EscalaMensalPage />
                </Suspense>
              }
            />
            <Route
              path="escalas/semanal"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EscalaSemanalPage />
                </Suspense>
              }
            />
            <Route
              path="escalas/modelos"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EscalasModelosPage />
                </Suspense>
              }
            />
            <Route
              path="escalas/mural-trocas"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MuralTrocasPage />
                </Suspense>
              }
            />
            <Route
              path="minha-agenda"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MinhaAgendaPage />
                </Suspense>
              }
            />
            <Route
              path="ponto"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PontoPage />
                </Suspense>
              }
            />

            <Route
              path="profissionais"
              element={<Navigate to="/usuarios/profissionais" replace />}
            />
            <Route
              path="locais"
              element={<Navigate to="/configuracao/locais" replace />}
            />

            <Route element={<MasterOnlyOutlet />}>
              <Route
                path="relatorios-plantao/faltas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioPlantaoFaltasPage />
                  </Suspense>
                }
              />
              <Route
                path="relatorios-plantao/escalas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioPlantaoEscalasPage />
                  </Suspense>
                }
              />
              <Route
                path="relatorios-plantao/profissionais"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioPlantaoProfissionaisPage />
                  </Suspense>
                }
              />
              <Route
                path="relatorios-plantao/coordenadores"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RelatorioPlantaoCoordenadoresPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/emissao/uti-adulto"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <GestaoEmissaoUtiAdultoPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/emissao/uti-pediatrica"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <GestaoEmissaoUtiPediatricaPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/frequencia/quinzenal"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FrequenciaQuinzenalPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/frequencia/mensal"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FrequenciaMensalPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/frequencia/semanal"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FrequenciaSemanalPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/cadastros/tipo-servico"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TipoServicoPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/cadastros/utilizadores/coordenador"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <UtilizadorCoordenadorGestaoPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/cadastros/utilizadores/auditor"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <UtilizadorAuditorPage />
                  </Suspense>
                }
              />
              <Route
                path="gestao/cadastros/utilizadores/faturista"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <UtilizadorFaturistaPage />
                  </Suspense>
                }
              />
              <Route
                path="painel/confirmacoes"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConfirmacoesPainelPage />
                  </Suspense>
                }
              />
              <Route
                path="admin/suporte"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SuporteInboxPage />
                  </Suspense>
                }
              />
              <Route
                path="usuarios"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />
              <Route
                path="usuarios/profissionais"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProfissionaisPage />
                  </Suspense>
                }
              />
              <Route
                path="usuarios/coordenadores"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CoordenadoresPage />
                  </Suspense>
                }
              />
              <Route
                path="usuarios/documentos"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DocumentosUsuarioPage />
                  </Suspense>
                }
              />
              <Route
                path="usuarios/locais"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CadastrosLocaisPage />
                  </Suspense>
                }
              />
              <Route
                path="usuarios/visualizadores"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />
              <Route
                path="usuarios/especialidades"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />

              <Route
                path="cadastros"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />
              <Route
                path="cadastros/profissionais"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />
              <Route
                path="cadastros/locais"
                element={<Navigate to="/usuarios/locais" replace />}
              />
              <Route
                path="cadastros/especialidades"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />

              <Route
                path="financeiro"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FinanceiroPage />
                  </Suspense>
                }
              />
              <Route
                path="financeiro/extratos"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FinanceiroExtratosPage />
                  </Suspense>
                }
              />
              <Route
                path="financeiro/repasses"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FinanceiroRepassesPage />
                  </Suspense>
                }
              />

              <Route
                path="configuracao/marca"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MarcaPlataformaPage />
                  </Suspense>
                }
              />
              <Route
                path="configuracao/avancadas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConfiguracoesAvancadasPage />
                  </Suspense>
                }
              />
              <Route
                path="configuracao"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConfiguracaoPage />
                  </Suspense>
                }
              />
              <Route
                path="configuracao/locais"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LocaisPage />
                  </Suspense>
                }
              />
              <Route
                path="configuracao/:secao"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConfiguracaoSecaoPage />
                  </Suspense>
                }
              />
            </Route>
            <Route
              path="meus-dados"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MeusDadosPage />
                </Suspense>
              }
            />
            <Route
              path="notificacoes"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotificacoesPage />
                </Suspense>
              }
            />
            <Route
              path="alterar-senha-obrigatoria"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AlterarSenhaObrigatoriaPage />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <AppToaster />
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
    </BrowserRouter>
  )
}

export default App
