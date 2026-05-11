import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RedirectIfAuthenticated, RequireAuth } from './lib/auth/RequireAuth'
import { ThemeBrandingProvider } from './theme/ThemeBrandingProvider'
import { CadastroPage } from './pages/CadastroPage'
import { CadastrosEspecialidadesPage } from './pages/CadastrosEspecialidadesPage'
import { CadastrosLocaisPage } from './pages/CadastrosLocaisPage'
import { ConfiguracaoPage } from './pages/ConfiguracaoPage'
import { MarcaPlataformaPage } from './pages/configuracao/MarcaPlataformaPage'
import { EscalasPage } from './pages/EscalasPage'
import { EscalasMensalPage } from './pages/EscalasMensalPage'
import { EscalasModelosPage } from './pages/EscalasModelosPage'
import { EscalasSemanalPage } from './pages/EscalasSemanalPage'
import { FinanceiroPage } from './pages/FinanceiroPage'
import { FinanceiroExtratosPage } from './pages/FinanceiroExtratosPage'
import { FinanceiroRepassesPage } from './pages/FinanceiroRepassesPage'
import { LoginPage } from './pages/LoginPage'
import { LocaisPage } from './pages/LocaisPage'
import { MeusDadosPage } from './pages/MeusDadosPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfissionaisPage } from './pages/ProfissionaisPage'
import { CargaHorariaPage } from './pages/painel/CargaHorariaPage'
import { RelatoriosPage } from './pages/Dashboard/RelatoriosPage'
import { ResumoPage } from './pages/Dashboard/ResumoPage'

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
            <Route index element={<Navigate to="/painel/resumo" replace />} />

            <Route
              path="painel"
              element={<Navigate to="/painel/resumo" replace />}
            />
            <Route path="painel/resumo" element={<ResumoPage />} />
            <Route path="painel/relatorios" element={<RelatoriosPage />} />
            <Route path="painel/carga-horaria" element={<CargaHorariaPage />} />

            <Route path="escalas" element={<EscalasPage />} />
            <Route path="escalas/mensal" element={<EscalasMensalPage />} />
            <Route path="escalas/semanal" element={<EscalasSemanalPage />} />
            <Route path="escalas/modelos" element={<EscalasModelosPage />} />

            <Route
              path="profissionais"
              element={<Navigate to="/usuarios/profissionais" replace />}
            />
            <Route path="locais" element={<LocaisPage />} />

            <Route
              path="usuarios"
              element={<Navigate to="/usuarios/profissionais" replace />}
            />
            <Route path="usuarios/profissionais" element={<ProfissionaisPage />} />
            <Route path="usuarios/locais" element={<CadastrosLocaisPage />} />
            <Route
              path="usuarios/especialidades"
              element={<CadastrosEspecialidadesPage />}
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
              element={<Navigate to="/usuarios/especialidades" replace />}
            />

            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="financeiro/extratos" element={<FinanceiroExtratosPage />} />
            <Route path="financeiro/repasses" element={<FinanceiroRepassesPage />} />
            <Route path="meus-dados" element={<MeusDadosPage />} />
            <Route path="configuracao/marca" element={<MarcaPlataformaPage />} />
            <Route path="configuracao" element={<ConfiguracaoPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      </ThemeBrandingProvider>
    </BrowserRouter>
  )
}

export default App
