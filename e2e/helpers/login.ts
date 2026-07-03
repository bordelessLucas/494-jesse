import { expect, type Page } from '@playwright/test'

import { credenciaisMasterE2E } from './env'

export async function loginComoMaster(page: Page): Promise<void> {
  const credenciais = credenciaisMasterE2E()
  if (!credenciais) {
    throw new Error(
      'Defina E2E_MASTER_EMAIL e E2E_MASTER_PASSWORD em .env.e2e para testes autenticados.',
    )
  }

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

  await page.getByLabel('E-mail').fill(credenciais.email)
  await page.getByLabel('Senha').fill(credenciais.password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).not.toHaveURL(/\/login$/, { timeout: 25_000 })
  await expect(page.getByText('Carregando sessão...')).toBeHidden({ timeout: 25_000 })
}

export async function aguardarAreaAutenticada(page: Page): Promise<void> {
  await expect(page.getByText('A carregar…')).toBeHidden({ timeout: 25_000 })
}
