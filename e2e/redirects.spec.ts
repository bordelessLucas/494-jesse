import { expect, test } from '@playwright/test'

import { test as testMaster } from './fixtures/master'
import { REDIRECTS_LEGACY } from './helpers/rotas-modulos'

test.describe('Redirects públicos', () => {
  test('/auth redireciona para login', async ({ page }) => {
    await page.goto('/auth')
    await expect(page).toHaveURL(/\/login$/)
  })
})

testMaster.describe('Redirects autenticados (master)', () => {
  for (const { de, para } of REDIRECTS_LEGACY) {
    testMaster(`${de} → ${para}`, async ({ page }) => {
      await page.goto(de)
      await expect(page).toHaveURL(para, { timeout: 20_000 })
    })
  }
})
