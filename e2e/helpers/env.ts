export function credenciaisMasterE2E(): { email: string; password: string } | null {
  const email = process.env.E2E_MASTER_EMAIL?.trim()
  const password = process.env.E2E_MASTER_PASSWORD

  if (!email || !password) return null
  return { email, password }
}

export function temCredenciaisMasterE2E(): boolean {
  return credenciaisMasterE2E() !== null
}
