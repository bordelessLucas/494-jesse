import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RedirectIfAuthenticated, RequireAuth } from './lib/auth/RequireAuth'
import { CadastroPage } from './pages/CadastroPage'
import { CadastrosEspecialidadesPage } from './pages/CadastrosEspecialidadesPage'
import { CadastrosLocaisPage } from './pages/CadastrosLocaisPage'
import { CadastrosProfissionaisPage } from './pages/CadastrosProfissionaisPage'
import { ConfiguracaoPage } from './pages/ConfiguracaoPage'
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
import { RelatoriosPage } from './pages/painel/RelatoriosPage'
import { ResumoPage } from './pages/painel/ResumoPage'

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

            <Route path="profissionais" element={<ProfissionaisPage />} />
            <Route path="locais" element={<LocaisPage />} />

            <Route
              path="cadastros"
              element={<Navigate to="/cadastros/profissionais" replace />}
            />
            <Route
              path="cadastros/profissionais"
              element={<CadastrosProfissionaisPage />}
            />
            <Route path="cadastros/locais" element={<CadastrosLocaisPage />} />
            <Route
              path="cadastros/especialidades"
              element={<CadastrosEspecialidadesPage />}
            />

            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="financeiro/extratos" element={<FinanceiroExtratosPage />} />
            <Route path="financeiro/repasses" element={<FinanceiroRepassesPage />} />
            <Route path="meus-dados" element={<MeusDadosPage />} />
            <Route path="configuracao" element={<ConfiguracaoPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
