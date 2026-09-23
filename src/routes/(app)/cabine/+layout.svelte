<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { t, translate } from '$lib/stores/locale'
  import { cabinAuth } from '$lib/stores/cabin-auth.svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'
  import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte'

  let { children } = $props()
  let reduit = $state(false)
  let estMobile = $state(false)

  const nav = [
    { href: '/cabine/tableau-de-bord', icone: 'grid_view',    label: 'Tableau de bord' },
    { href: '/cabine/commandes',        icone: 'receipt_long', label: 'Commandes' },
    { href: '/cabine/messagerie',       icone: 'chat_bubble',  label: 'Messagerie' },
    { href: '/cabine/uv',               icone: 'bolt',         label: 'Solde UV' },
    { href: '/cabine/abonnement',       icone: 'verified',     label: 'Abonnement' },
    { href: '/cabine/performance',      icone: 'analytics',    label: 'Performance' },
    { href: '/cabine/documents',        icone: 'badge',        label: 'Documents' },
    { href: '/cabine/parametres',       icone: 'tune',         label: 'Paramètres' },
    { href: '/cabine/profil',           icone: 'person',       label: 'Mon profil' },
  ]

  function verifierViewport() {
    if (typeof window !== 'undefined') {
      estMobile = window.innerWidth < 1024
      if (estMobile) reduit = true
    }
  }

  let dernierChemin = $state<string | null>(null)
  $effect(() => {
    const chemin = page.url.pathname
    if (dernierChemin !== null && chemin !== dernierChemin && estMobile && !reduit) {
      reduit = true
    }
    dernierChemin = chemin
  })

  function estActif(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/')
  }

  async function seDeconnecter() {
    try { await apiCabin.post('/cabin/auth/logout') } catch {}
    cabinAuth.logout()
    // Le message est affiché une fois la navigation faite : émis avant,
    // il se monte pendant le changement de page et s'affiche à moitié.
    await goto('/login')
    toast.info(translate('cabin.logout.title'), translate('toast.goodbye'))
  }

  function titrePage() {
    const chemin = page.url.pathname
    if (chemin.startsWith('/cabine/tableau-de-bord')) return 'Tableau de bord'
    if (chemin.startsWith('/cabine/commandes'))        return 'Commandes'
    if (chemin.startsWith('/cabine/messagerie'))       return 'Messagerie'
    if (chemin.startsWith('/cabine/uv'))               return 'Solde UV'
    if (chemin.startsWith('/cabine/abonnement'))       return 'Abonnement'
    if (chemin.startsWith('/cabine/performance'))      return 'Performance'
    if (chemin.startsWith('/cabine/documents'))        return 'Documents'
    if (chemin.startsWith('/cabine/parametres'))       return 'Paramètres'
    if (chemin.startsWith('/cabine/profil'))           return 'Mon profil'
    return 'Espace cabine'
  }

  function initiale() {
    const nom = cabinAuth.user?.managerName ?? cabinAuth.user?.cabinName ?? '?'
    return nom[0]?.toUpperCase() ?? '?'
  }

  onMount(() => {
    cabinAuth.init()
    if (!cabinAuth.isAuthenticated()) {
      goto('/login')
      return
    }
    verifierViewport()
    window.addEventListener('resize', verifierViewport)
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', verifierViewport)
  })

  const annee = new Date().getFullYear()
  const largeurSidebar = $derived(reduit ? 64 : 240)
</script>

<div class="flex h-screen overflow-hidden bg-slate-50">

  <!-- ── Sidebar (fixe) ── -->
  <aside
    class="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 border-r border-slate-100 bg-white"
    style="
      width: {reduit && !estMobile ? '64px' : '240px'};
      transform: translateX({estMobile && reduit ? '-100%' : '0'});
    "
  >
    <!-- Logo -->
    <div class="flex items-center justify-center px-4 py-4 border-b border-slate-100 min-h-[64px]">
      {#if !reduit || estMobile}
        <div class="flex items-center gap-2.5 w-full">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
          >
            <span class="material-symbols-outlined icon-filled text-white" style="font-size: 18px;">store</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-slate-900 text-sm leading-none truncate">{cabinAuth.user?.cabinName ?? 'Cabine'}</p>
            <p class="text-xs text-orange-500 font-medium mt-0.5 capitalize">{cabinAuth.user?.type ?? 'standard'}</p>
          </div>
          {#if estMobile}
            <button
              type="button"
              onclick={() => reduit = true}
              class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
              aria-label={$t('common.close')}
            >
              <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
            </button>
          {/if}
        </div>
      {:else}
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center"
          style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
        >
          <span class="material-symbols-outlined icon-filled text-white" style="font-size: 18px;">store</span>
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {#each nav as item}
        <a
          href={item.href}
          class="sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-xl"
          class:is-active={estActif(item.href)}
          title={reduit && !estMobile ? item.label : ''}
        >
          <span class="material-symbols-outlined icon-filled shrink-0" style="font-size: 20px;">{item.icone}</span>
          {#if !reduit || estMobile}
            <span class="text-sm whitespace-nowrap flex-1">{item.label}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Profil + Déconnexion -->
    <div class="border-t border-slate-100 p-2 space-y-0.5">
      <a
        href="/cabine/profil"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
        title={reduit && !estMobile ? $t('cabin.layout.header.profile') : ''}
      >
        <div
          class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
        >
          {initiale()}
        </div>
        {#if !reduit || estMobile}
          <div class="overflow-hidden flex-1 min-w-0">
            <p class="text-slate-800 text-sm font-semibold truncate leading-none">
              {cabinAuth.user?.managerName?.split(' ')[0] ?? $t('cabin.layout.manager')}
            </p>
            <p class="text-slate-400 text-xs mt-0.5 truncate">{cabinAuth.user?.cabinName ?? ''}</p>
          </div>
        {/if}
      </a>
      <button
        onclick={seDeconnecter}
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        title={reduit && !estMobile ? $t('cabin.layout.sidebar.logout') : ''}
      >
        <span class="material-symbols-outlined shrink-0" style="font-size: 20px;">logout</span>
        {#if !reduit || estMobile}
          <span class="text-sm font-medium">{$t('cabin.layout.sidebar.logout')}</span>
        {/if}
      </button>
    </div>
  </aside>

  <!-- Overlay mobile -->
  {#if estMobile && !reduit}
    <button
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
      onclick={() => reduit = true}
      aria-label={$t('common.close')}
    ></button>
  {/if}

  <!-- ── Contenu principal ── -->
  <div
    class="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 min-w-0"
    style="margin-left: {estMobile ? 0 : largeurSidebar}px;"
  >
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center gap-3 bg-white">
      <!-- Hamburger + titre -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <button
          onclick={() => reduit = !reduit}
          class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"
          aria-label="Menu"
        >
          <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
        </button>
        <h1 class="font-bold text-lg tracking-tight text-slate-900 truncate hidden sm:block">
          {titrePage()}
        </h1>
      </div>

      <!-- Droite -->
      <div class="flex items-center gap-1.5 shrink-0">
        <LanguageSwitcher />

        <!-- Statut cabine -->
        {#if cabinAuth.user?.status}
          <span
            class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border
              {cabinAuth.user.status === 'active'    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
               cabinAuth.user.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' :
               'bg-amber-50 text-amber-700 border-amber-100'}"
          >
            <span class="w-1.5 h-1.5 rounded-full
              {cabinAuth.user.status === 'active'    ? 'bg-emerald-500' :
               cabinAuth.user.status === 'suspended' ? 'bg-red-500' : 'bg-amber-500'}">
            </span>
            {cabinAuth.user.status === 'active'    ? $t('status.active') :
             cabinAuth.user.status === 'suspended' ? $t('status.suspended') : $t('status.paused')}
          </span>
        {/if}

        <!-- Avatar -->
        <a
          href="/cabine/profil"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all ml-1"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
          >
            {initiale()}
          </div>
          <div class="hidden sm:block">
            <p class="text-sm font-semibold text-slate-800 leading-none">
              {cabinAuth.user?.managerName?.split(' ')[0] ?? $t('cabin.layout.manager')}
            </p>
          </div>
        </a>
      </div>
    </header>

    <!-- Zone scrollable -->
    <main class="flex-1 overflow-y-auto p-4 lg:p-6">
      <div class="max-w-5xl mx-auto animate-fade-in-up">
        {@render children()}
      </div>
    </main>

    <footer class="shrink-0 px-4 lg:px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
      {$t('cabin.footer', { year: annee })}
    </footer>
  </div>
</div>
