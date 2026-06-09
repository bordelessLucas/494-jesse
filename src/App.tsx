import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RotaInicial } from './components/auth/RotaInicial'
import { MasterOnlyOutlet } from './components/auth/MasterOnlyOutlet'
import { RedirectIfAuthenticated, RequireAuth } from './lib/auth/RequireAuth'
import { ThemeBrandingProvider } from './theme/ThemeBrandingProvider'
import { AlterarSenhaObrigatoriaPage } from './pages/AlterarSenhaObrigatoriaPage'
import { CadastroPage } from './pages/CadastroPage'
import { CadastrosLocaisPage } from './pages/CadastrosLocaisPage'
import { CoordenadoresPage } from './pages/CoordenadoresPage'
import { ConfiguracaoPage } from './pages/ConfiguracaoPage'
import { MarcaPlataformaPage } from './pages/configuracao/MarcaPlataformaPage'
import { ConfiguracaoSecaoPage } from './pages/configuracao/ConfiguracaoSecaoPage'
import { ConfiguracoesAvancadasPage } from './pages/configuracao/ConfiguracoesAvancadasPage'
import { EscalasPage } from './pages/EscalasPage'
import { EscalaMensalPage } from './pages/Escalas/EscalaMensalPage'
import { MinhaAgendaPage } from './pages/Escalas/MinhaAgendaPage'
import { EscalasModelosPage } from './pages/EscalasModelosPage'
import { EscalaSemanalPage } from './pages/Escalas/EscalaSemanalPage'
import { FinanceiroPage } from './pages/FinanceiroPage'
import { FinanceiroExtratosPage } from './pages/FinanceiroExtratosPage'
import { FinanceiroRepassesPage } from './pages/FinanceiroRepassesPage'
import { LoginPage } from './pages/LoginPage'
import { LocaisPage } from './pages/LocaisPage'
import { MeusDadosPage } from './pages/MeusDadosPage'
import { NotificacoesPage } from './pages/NotificacoesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfissionaisPage } from './pages/ProfissionaisPage'
import { CargaHorariaPage } from './pages/Dashboard/CargaHorariaPage'
import { ResumoPage } from './pages/Dashboard/ResumoPage'
import { DocumentosUsuarioPage } from './pages/UsuariosEmBrevePage'
import { EmissaoRelatoriosPage } from './pages/Relatorios/EmissaoRelatoriosPage'
import { HistoricoRelatoriosPage } from './pages/Relatorios/HistoricoRelatoriosPage'
import { IndicadoresScirasPage } from './pages/Relatorios/IndicadoresScirasPage'
import { MuralTrocasPage } from './pages/Escalas/MuralTrocasPage'
import { PontoPage } from './pages/Profissional/PontoPage'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'

function App() {
  return (
    <BrowserRouter>
      <ThemeBrandingProvider>
      <Routes>
        <Route path="auth" element={<Navigate to="/login" replace />} />

        <Route element={<RedirectIfAuthenticated />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="cadastro" element={<CadastroPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<RotaInicial />} />

            <Route
              path="painel"
              element={<Navigate to="/painel/resumo" replace />}
            />
            <Route path="painel/resumo" element={<ResumoPage />} />
            <Route path="painel/carga-horaria" element={<CargaHorariaPage />} />

            <Route
              path="relatorios"
              element={<Navigate to="/relatorios/emissao" replace />}
            />
            <Route
              path="relatorios/emissao"
              element={<EmissaoRelatoriosPage />}
            />
            <Route
              path="relatorios/historico"
              element={<HistoricoRelatoriosPage />}
            />
            <Route
              path="relatorios/indicadores-sciras"
              element={<IndicadoresScirasPage />}
            />

            <Route path="escalas" element={<EscalasPage />} />
            <Route path="escalas/mensal" element={<EscalaMensalPage />} />
            <Route path="escalas/semanal" element={<EscalaSemanalPage />} />
            <Route path="escalas/modelos" element={<EscalasModelosPage />} />
            <Route path="escalas/mural-trocas" element={<MuralTrocasPage />} />
            <Route path="minha-agenda" element={<MinhaAgendaPage />} />
            <Route path="ponto" element={<PontoPage />} />

            <Route
              path="profissionais"
              element={<Navigate to="/usuarios/profissionais" replace />}
            />
            <Route path="locais" element={<Navigate to="/configuracao/locais" replace />} />

            <Route element={<MasterOnlyOutlet />}>
              <Route
                path="usuarios"
                element={<Navigate to="/usuarios/profissionais" replace />}
              />
              <Route path="usuarios/profissionais" element={<ProfissionaisPage />} />
              <Route path="usuarios/coordenadores" element={<CoordenadoresPage />} />
              <Route path="usuarios/documentos" element={<DocumentosUsuarioPage />} />
              <Route path="usuarios/locais" element={<CadastrosLocaisPage />} />
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

              <Route path="financeiro" element={<FinanceiroPage />} />
              <Route path="financeiro/extratos" element={<FinanceiroExtratosPage />} />
              <Route path="financeiro/repasses" element={<FinanceiroRepassesPage />} />

              <Route path="configuracao/marca" element={<MarcaPlataformaPage />} />
              <Route
                path="configuracao/avancadas"
                element={<ConfiguracoesAvancadasPage />}
              />
              <Route path="configuracao" element={<ConfiguracaoPage />} />
              <Route path="configuracao/locais" element={<LocaisPage />} />
              <Route path="configuracao/:secao" element={<ConfiguracaoSecaoPage />} />
            </Route>
            <Route path="meus-dados" element={<MeusDadosPage />} />
            <Route path="notificacoes" element={<NotificacoesPage />} />
            <Route
              path="alterar-senha-obrigatoria"
              element={<AlterarSenhaObrigatoriaPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <PwaUpdatePrompt />
      </ThemeBrandingProvider>
    </BrowserRouter>
  )
}

export default App
