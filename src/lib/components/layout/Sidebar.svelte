<script lang="ts">
  import { page } from '$app/stores'
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { slide } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'
  import api from '$lib/api'
  import { accesDePage } from '$lib/permissions'

  let { reduit = $bindable(false) } = $props()

  let estMobile = $state(false)
  let notifCount = $state(0)
  let groupeOuvert = $state<string | null>(null)

  function verifierViewport() {
    if (typeof window !== 'undefined') estMobile = window.innerWidth < 1024
  }

  let dernierChemin = $state<string | null>(null)
  $effect(() => {
    const chemin = $page.url.pathname
    if (chemin !== dernierChemin) {
      // Le groupe de la page courante reste déplié : on doit pouvoir passer
      // d'un sous-item à l'autre sans rouvrir le menu à chaque fois.
      const porteur = groupes.find(g => g.items.some(i => estActif(i.href)))
      if (porteur) groupeOuvert = porteur.key
      if (dernierChemin !== null && estMobile && !reduit) reduit = true
    }
    dernierChemin = chemin
  })

  onMount(() => {
    verifierViewport()
    window.addEventListener('resize', verifierViewport)
    chargerNotifications()
    const intervalle = setInterval(chargerNotifications, 30000)
    return () => clearInterval(intervalle)
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', verifierViewport)
  })

  async function chargerNotifications() {
    try {
      const res = await api.get('/admin/notifications/count')
      notifCount = res.data?.data?.count ?? 0
    } catch {}
  }

  const role = $derived(auth.user?.role ?? 'admin')

  function visible(href: string) {
    return auth.aAcces(accesDePage(href))
  }

  const libellesRoles: Record<string, string> = {
    super_admin: 'Super admin',
    admin: 'Admin',
    service_client: 'Service client',
    chef_agents_promo: 'Chef agents promo',
    controleur_cabine: 'Contrôleur cabine',
  }

  // Liens directs (sans sous-menu)
  type LienDirect = { href: string; icone: string; labelKey: string; badge: number }
  const liensDirects = $derived<LienDirect[]>([
    { href: '/admin/tableau-de-bord', icone: 'grid_view', labelKey: 'admin.nav.dashboard', badge: 0 },
    { href: '/admin/parametres',      icone: 'settings',  labelKey: 'admin.nav.settings',  badge: 0 },
  ].filter(l => visible(l.href)))

  // Groupes avec sous-menus
  type SousMenu = { href: string; icone: string; label: string; desc: string; badge?: number }
  type Groupe = { key: string; icone: string; label: string; couleur: string; items: SousMenu[] }

  const groupes = $derived<Groupe[]>([
    {
      key: 'cabines',
      icone: 'store_mall_directory',
      label: 'Réseau de cabines',
      couleur: '#3b82f6',
      items: [
        { href: '/admin/abonnements', icone: 'card_membership', label: 'Abonnements',    desc: 'Plans & facturation des cabines' },
        { href: '/admin/cabines',     icone: 'store',           label: 'Cabines',         desc: 'Points de collecte physiques' },
        { href: '/admin/uv',          icone: 'bolt',            label: 'UV',              desc: 'Unités de valeur (crédit)' },
      ].filter(i => visible(i.href)),
    },
    {
      key: 'operations',
      icone: 'hub',
      label: 'Opérations',
      couleur: '#007A5E',
      items: [
        { href: '/admin/commandes',    icone: 'receipt_long', label: 'Commandes',     desc: 'Transferts clients en cours' },
        { href: '/admin/finance',      icone: 'account_balance', label: 'Réconciliation', desc: 'À livrer, à rembourser, remboursées' },
        { href: '/admin/packages',     icone: 'inventory_2',  label: 'Forfaits',       desc: 'Catalogue forfaits MTN & Orange' },
        { href: '/admin/agents-promo', icone: 'groups',       label: 'Agents promo',  desc: 'Agents terrain & recrutement' },
      ].filter(i => visible(i.href)),
    },
    {
      key: 'clients',
      icone: 'support_agent',
      label: 'Relation client',
      couleur: '#8b5cf6',
      items: [
        { href: '/admin/reclamations', icone: 'report_problem', label: 'Réclamations', desc: 'Plaintes & litiges clients' },
        { href: '/admin/messagerie',   icone: 'chat_bubble',    label: 'Messagerie',   desc: 'Chat interne & avec cabines' },
        { href: '/admin/support',      icone: 'help_center',    label: 'Support',      desc: 'Tickets support clients' },
        { href: '/admin/call-center',  icone: 'call',           label: 'Call Center',  desc: 'Journal & appels téléphoniques' },
        { href: '/admin/fraude',       icone: 'security',       label: 'Fraude',       desc: 'Anti-fraude & liste noire' },
      ].filter(i => visible(i.href)),
    },
    {
      key: 'reporting',
      icone: 'analytics',
      label: 'Suivi & reporting',
      couleur: '#10b981',
      items: [
        { href: '/admin/notifications', icone: 'notifications', label: 'Notifications', desc: 'Alertes temps réel',         badge: notifCount },
        { href: '/admin/taches',        icone: 'task_alt',      label: 'Tâches',        desc: 'Tâches internes de l\'équipe' },
        { href: '/admin/rapports',      icone: 'bar_chart',     label: 'Rapports',      desc: 'Bilans & statistiques' },
      ].filter(i => visible(i.href)),
    },
    {
      key: 'equipe',
      icone: 'people',
      label: 'Équipe',
      couleur: '#ec4899',
      items: [
        { href: '/admin/salaires',      icone: 'payments',        label: 'Salaires',      desc: 'Sessions de travail & paiements' },
        { href: '/admin/remunerations', icone: 'store',           label: 'Rémunérations', desc: 'Payer les cabines selon leur chiffre' },
        { href: '/admin/equipe',        icone: 'manage_accounts', label: 'Équipe',        desc: 'Comptes & rôles administrateurs' },
      ].filter(i => visible(i.href)),
    },
  ].filter(g => g.items.length > 0))

  function estActif(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }

  function estGroupeActif(g: Groupe) {
    return g.items.some(i => estActif(i.href))
  }

  function toggleGroupe(key: string) {
    // En mode réduit le sous-menu n'a pas la place de s'afficher : on déplie
    // d'abord la barre, sinon le clic n'aurait aucun effet visible.
    if (reduit && !estMobile) {
      reduit = false
      groupeOuvert = key
      return
    }
    groupeOuvert = groupeOuvert === key ? null : key
  }

  async function seDeconnecter() {
    try { await api.post('/account/logout') } catch {}
    auth.logout()
    // Le message est affiché une fois la navigation faite : émis avant,
    // il se monte pendant le changement de page et s'affiche à moitié.
    await goto('/login')
    toast.info(translate('common.logout'), translate('toast.goodbye'))
  }

  function initiales(nom: string | null) {
    if (!nom) return '?'
    return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

</script>

<!-- Sidebar -->
<aside
  class="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 border-r border-slate-200 bg-white"
  style="
    width: {reduit && !estMobile ? '64px' : '240px'};
    transform: translateX({estMobile && reduit ? '-100%' : '0'});
  "
>
  <!-- Logo -->
  <div class="flex items-center justify-center px-4 py-4 border-b border-slate-100 min-h-[64px]">
    {#if !reduit || estMobile}
      <div class="flex items-center gap-2.5">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
        >
          <span class="material-symbols-outlined icon-filled text-white" style="font-size: 20px;">swap_horiz</span>
        </div>
        <div>
          <p class="font-bold text-slate-900 text-sm leading-none">TransfertCM</p>
          <p class="text-xs text-orange-500 font-medium mt-0.5">{$t('admin.nav.backoffice')}</p>
        </div>
      </div>
      {#if estMobile}
        <button
          type="button"
          onclick={() => reduit = true}
          class="absolute right-3 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
          aria-label={$t('common.close')}
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>
      {/if}
    {:else}
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center"
        style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
      >
        <span class="material-symbols-outlined icon-filled text-white" style="font-size: 20px;">swap_horiz</span>
      </div>
    {/if}
  </div>

  <!-- Navigation -->
  <nav class="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">

    <!-- Liens directs -->
    {#each liensDirects as item}
      <a
        href={item.href}
        class="sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-xl relative"
        class:is-active={estActif(item.href)}
        title={reduit && !estMobile ? $t(item.labelKey) : ''}
      >
        <span class="material-symbols-outlined icon-filled shrink-0" style="font-size: 20px;">{item.icone}</span>
        {#if !reduit || estMobile}
          <span class="text-sm whitespace-nowrap flex-1">{$t(item.labelKey)}</span>
        {/if}
      </a>
    {/each}

    <!-- Séparateur -->
    {#if liensDirects.length > 0 && groupes.length > 0}
      <div class="mx-3 my-2 border-t border-slate-100"></div>
    {/if}

    <!-- Groupes -->
    {#each groupes as groupe}
      {@const ouvert = groupeOuvert === groupe.key}
      <div>
        <button
          type="button"
          onclick={() => toggleGroupe(groupe.key)}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative text-left"
          class:text-slate-900={estGroupeActif(groupe) || ouvert}
          class:font-semibold={estGroupeActif(groupe) || ouvert}
          class:text-slate-600={!estGroupeActif(groupe) && !ouvert}
          style={estGroupeActif(groupe) ? `background: ${groupe.couleur}10;` : ''}
          title={reduit && !estMobile ? groupe.label : ''}
          aria-expanded={ouvert}
        >
          {#if estGroupeActif(groupe)}
            <span class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
              style="background: {groupe.couleur};"></span>
          {/if}

          <span class="material-symbols-outlined icon-filled shrink-0" style="font-size: 20px; {estGroupeActif(groupe) ? `color: ${groupe.couleur};` : ''}">{groupe.icone}</span>

          {#if !reduit || estMobile}
            <span class="text-sm flex-1 whitespace-nowrap">{groupe.label}</span>
            <span
              class="material-symbols-outlined shrink-0 text-slate-400 transition-transform duration-200"
              style="font-size: 18px; {ouvert ? 'transform: rotate(180deg);' : ''}"
            >expand_more</span>
          {/if}
        </button>

        <!-- Sous-menu déplié dans la barre : il reste visible pendant qu'on
             passe d'une page à l'autre. -->
        {#if ouvert && (!reduit || estMobile)}
          <div class="mt-0.5 mb-1 ml-[1.35rem] pl-3 border-l border-slate-200 space-y-0.5" transition:slide={{ duration: 200, easing: cubicOut }}>
            {#each groupe.items as item}
              {@const actif = estActif(item.href)}
              <a
                href={item.href}
                class="block px-3 py-2 rounded-lg transition-all hover:bg-slate-50"
                style={actif ? `background: ${groupe.couleur}12;` : ''}
              >
                <div class="flex items-center gap-2">
                  <span class="text-[13px] font-medium truncate"
                    style="color: {actif ? groupe.couleur : '#475569'}">{item.label}</span>
                  {#if (item.badge ?? 0) > 0}
                    <span class="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style="background: {groupe.couleur}">
                      {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                    </span>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <!-- Profil + Déconnexion -->
  <div class="border-t border-slate-100 p-2 space-y-0.5">
    <a
      href="/admin/profil"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
      title={reduit && !estMobile ? $t('admin.nav.profile') : ''}
    >
      <div
        class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
        style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
      >
        {initiales(auth.user?.fullName ?? null)}
      </div>
      {#if !reduit || estMobile}
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="text-slate-800 text-sm font-semibold truncate leading-none">
            {auth.user?.fullName ?? auth.user?.email ?? 'Admin'}
          </p>
          <p class="text-slate-400 text-xs mt-0.5">{libellesRoles[auth.user?.role ?? ''] ?? auth.user?.role ?? ''}</p>
        </div>
      {/if}
    </a>

    <a
      href="/"
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
      title={reduit && !estMobile ? 'Voir le site' : ''}
    >
      <span class="material-symbols-outlined shrink-0" style="font-size: 20px;">public</span>
      {#if !reduit || estMobile}
        <span class="text-sm font-medium">Voir le site</span>
      {/if}
    </a>

    <button
      onclick={seDeconnecter}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
      title={reduit && !estMobile ? $t('common.logout') : ''}
    >
      <span class="material-symbols-outlined shrink-0" style="font-size: 20px;">logout</span>
      {#if !reduit || estMobile}
        <span class="text-sm font-medium">{$t('common.logout')}</span>
      {/if}
    </button>
  </div>
</aside>
