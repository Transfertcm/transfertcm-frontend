<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
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
  })

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
        {@render children()}
      </div>
    </main>

    <footer class="shrink-0 px-4 lg:px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
      © {annee} TransfertCM — Plateforme mobile money au Cameroun
    </footer>
  </div>
</div>
