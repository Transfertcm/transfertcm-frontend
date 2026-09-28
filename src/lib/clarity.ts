declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] }
  }
}

export function chargerClarity() {
  const id = import.meta.env.VITE_CLARITY_ID
  if (!id || window.clarity) return
  window.clarity = function (...args: unknown[]) {
    (window.clarity!.q ??= []).push(args)
  }
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.clarity.ms/tag/${id}`
  document.head.appendChild(script)
}
