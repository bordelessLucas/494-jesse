import { expect, type Page } from '@playwright/test'

import { aguardarAreaAutenticada } from './login'

export type AssertPagina =
  | { tipo: 'heading'; texto: string }
  | { tipo: 'heading-h2'; texto: string }
  | { tipo: 'heading-regex'; texto: RegExp }
  | { tipo: 'filtro-relatorio'; texto: string }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'botao'; texto: string }

export async function assertPaginaCarregada(
  page: Page,
  assert: AssertPagina,
): Promise<void> {
  await aguardarAreaAutenticada(page)

  switch (assert.tipo) {
    case 'heading':
      await expect(
        page.getByRole('heading', { name: assert.texto, level: 1 }),
      ).toBeVisible({
        timeout: 30_000,
      })
      break
    case 'heading-h2':
      await expect(
        page.getByRole('heading', { name: assert.texto, level: 2 }),
      ).toBeVisible({ timeout: 30_000 })
      break
    case 'heading-regex':
      await expect(page.getByRole('heading', { name: assert.texto })).toBeVisible({
        timeout: 30_000,
      })
      break
    case 'filtro-relatorio':
      await expect(page.locator('#filtro-relatorio')).toContainText(assert.texto, {
        timeout: 30_000,
      })
      break
    case 'texto':
      await expect(page.getByText(assert.texto, { exact: false })).toBeVisible({
        timeout: 30_000,
      })
      break
    case 'botao':
      await expect(page.getByRole('button', { name: assert.texto })).toBeVisible({
        timeout: 30_000,
      })
      break
  }

  await expect(page.getByRole('heading', { name: 'Não encontrado' })).toBeHidden()
}

export async function visitarRotaEValidar(
  page: Page,
  path: string,
  assert: AssertPagina,
): Promise<void> {
  await page.goto(path)
  await assertPaginaCarregada(page, assert)
}
