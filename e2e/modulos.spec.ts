import { test } from './fixtures/master'
import { visitarRotaEValidar } from './helpers/assert-pagina'
import { MODULOS } from './helpers/rotas-modulos'

for (const [modulo, rotas] of Object.entries(MODULOS)) {
  test.describe(`Módulo: ${modulo}`, () => {
    for (const rota of rotas) {
      test(`${rota.nome} — ${rota.path}`, async ({ page }) => {
        await visitarRotaEValidar(page, rota.path, rota.assert)
      })
    }
  })
}
