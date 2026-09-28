<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { accesDePage } from '$lib/permissions'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import Header from '$lib/components/layout/Header.svelte'

  let { children } = $props()
  let reduit = $state(false)
  let estMobile = $state(false)
  const annee = new Date().getFullYear()

  function verifierViewport() {
    const mobile = window.innerWidth < 1024
    estMobile = mobile
    if (mobile) reduit = true
  }

  onMount(() => {
    auth.init()
    if (!auth.isAuthenticated()) {
      goto('/login')
      return
    }
    verifierViewport()
    window.addEventListener('resize', verifierViewport)
    chargerProfil()
  })

  async function chargerProfil() {
    try {
      const res = await api.get('/account/profile')
      const p = res.data?.data
      if (!p) return
      auth.update({
        fullName: p.fullName ?? auth.user?.fullName ?? null,
        role: p.role ?? auth.user?.role,
        initials: p.initials ?? auth.user?.initials,
        avatarUrl: p.profile?.avatarUrl ?? null,
      })
      auth.definirPermissions(p.permissions ?? {})
    } catch {}
  }

  const permissionsConnues = $derived(auth.user?.role === 'super_admin' || auth.permissions !== null)
  const autorise = $derived(auth.aAcces(accesDePage($page.url.pathname)))

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', verifierViewport)
  })

  const largeurSidebar = $derived(reduit ? 64 : 240)
</script>

<div class="flex h-screen overflow-hidden bg-slate-50" id="app-layout" data-clarity-mask="True">
  <Sidebar bind:reduit />

  {#if estMobile && !reduit}
    <button
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
      onclick={() => reduit = true}
      aria-label="Fermer le menu"
    ></button>
  {/if}

  <div
    class="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 min-w-0"
    style="margin-left: {estMobile ? 0 : largeurSidebar}px;"
  >
    <Header surToggleSidebar={() => reduit = !reduit} />

    <main class="flex-1 overflow-y-auto p-4 lg:p-6">
      <div class="animate-fade-in-up max-w-7xl mx-auto min-w-0">
        {#if !permissionsConnues}
          <div class="flex items-center justify-center py-24">
            <div class="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
          </div>
        {:else if autorise}
          {@render children()}
        {:else}
          <div class="flex flex-col items-center justify-center text-center py-24 px-4">
            <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">lock</span>
            <h2 class="text-lg font-bold text-slate-900">Accès refusé</h2>
            <p class="text-sm text-slate-500 mt-1 max-w-sm">Votre compte n'a pas les droits nécessaires pour ouvrir cette page. Contactez un super administrateur si vous en avez besoin.</p>
            <a href="/admin/tableau-de-bord" class="mt-5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style="background:#007A5E">Retour au tableau de bord</a>
          </div>
        {/if}
      </div>
    </main>

    <footer class="shrink-0 px-4 lg:px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
      © {annee} TransfertCM — Plateforme mobile money au Cameroun
    </footer>
  </div>
</div>
