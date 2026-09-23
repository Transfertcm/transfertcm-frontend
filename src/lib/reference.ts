const REFERENCE_PATTERN = /^TCM-[A-Z]{3}-[0-9A-HJKMNP-TV-Z]{16}$/

export function formatOrderCode(...candidats: Array<string | null | undefined>): string {
  for (const candidat of candidats) {
    if (candidat === null || candidat === undefined || candidat === '') continue

    const code = candidat.toString().trim()
    if (code === '') continue

    if (REFERENCE_PATTERN.test(code.toUpperCase())) return code.toUpperCase()

    return `#${code.slice(-8)}`
  }

  return '—'
}
