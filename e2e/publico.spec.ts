import { expect, test } from '@playwright/test'

test.describe('Páginas públicas', () => {
  test('exibe formulário de login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible()
  })

  test('exibe formulário de cadastro', async ({ page }) => {
    await page.goto('/cadastro')

    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
    await expect(page.getByLabel('Nome', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Nome da empresa')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible()
  })

  test('redireciona rota protegida para login', async ({ page }) => {
    await page.goto('/painel/resumo')

    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  })

  test('páginas de suporte carregam', async ({ page }) => {
    await page.goto('/suporte/politica-privacidade')
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()

    await page.goto('/suporte/termos-uso')
    await expect(page.getByRole('heading', { name: 'Termos de Uso' })).toBeVisible()
  })

  test('link de cadastro na página de login', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/cadastro$/)
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
  })
})
