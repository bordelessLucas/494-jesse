import { test as base } from '@playwright/test'

import { temCredenciaisMasterE2E } from '../helpers/env'
import { aguardarAreaAutenticada, loginComoMaster } from '../helpers/login'

export { expect } from '@playwright/test'

export const test = base.extend({
  _sessaoMaster: [
    async ({ page }, use) => {
      if (!temCredenciaisMasterE2E()) {
        base.skip(true, 'Defina E2E_MASTER_EMAIL e E2E_MASTER_PASSWORD em .env.e2e')
      }
      await loginComoMaster(page)
      await aguardarAreaAutenticada(page)
      await use()
    },
    { auto: true },
  ],
})
