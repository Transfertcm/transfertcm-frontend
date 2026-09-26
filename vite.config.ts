import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

function verifierUrlApi(mode: string) {
  const url = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL
  if (!url) throw new Error('VITE_API_BASE_URL manquante pour le build de production')
  let parsee: URL
  try {
    parsee = new URL(url)
  } catch {
    throw new Error(`VITE_API_BASE_URL invalide : ${url}`)
  }
  if (parsee.protocol !== 'https:') throw new Error(`VITE_API_BASE_URL doit être en https : ${url}`)
  if (/^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|\[::1\])/.test(parsee.hostname)) {
    throw new Error(`VITE_API_BASE_URL pointe vers une adresse locale : ${url}`)
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') verifierUrlApi(mode)
  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
