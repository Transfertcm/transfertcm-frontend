<script lang="ts">
  import { page } from '$app/stores'
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'
  import api from '$lib/api'

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
    if (dernierChemin !== null && chemin !== dernierChemin) {
      groupeOuvert = null
      if (estMobile && !reduit) reduit = true
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

  // Liens directs (sans sous-menu)
  type LienDirect = { href: string; icone: string; labelKey: string; badge: number; roles: string[] }
  const liensDirects = $derived<LienDirect[]>([
    { href: '/admin/tableau-de-bord', icone: 'grid_view', labelKey: 'admin.nav.dashboard', badge: 0, roles: ['super_admin','admin','service_client','chef_agents_promo','controleur_cabine'] },
    { href: '/admin/parametres',      icone: 'settings',  labelKey: 'admin.nav.settings',  badge: 0, roles: ['super_admin','admin'] },
  ].filter(l => l.roles.includes(role)))

  // Groupes avec sous-menus
  type SousMenu = { href: string; icone: string; label: string; desc: string; badge?: number; roles: string[] }
  type Groupe = { key: string; icone: string; label: string; couleur: string; roles: string[]; items: SousMenu[] }

  const groupes = $derived<Groupe[]>([
    {
      key: 'cabines',
      icone: 'store_mall_directory',
      label: 'Réseau de cabines',
      couleur: '#3b82f6',
      roles: ['super_admin','admin','controleur_cabine'],
      items: [
        { href: '/admin/abonnements', icone: 'card_membership', label: 'Abonnements',    desc: 'Plans & facturation des cabines', roles: ['super_admin','admin','controleur_cabine'] },
        { href: '/admin/cabines',     icone: 'store',           label: 'Cabines',         desc: 'Points de collecte physiques',   roles: ['super_admin','admin','controleur_cabine'] },
        { href: '/admin/uv',          icone: 'bolt',            label: 'UV',              desc: 'Unités de valeur (crédit)',       roles: ['super_admin','admin'] },
      ].filter(i => i.roles.includes(role)),
    },
    {
      key: 'operations',
      icone: 'hub',
      label: 'Opérations',
      couleur: '#f97316',
      roles: ['super_admin','admin','controleur_cabine','chef_agents_promo'],
      items: [
        { href: '/admin/commandes',    icone: 'receipt_long', label: 'Commandes',     desc: 'Transferts clients en cours',    roles: ['super_admin','admin','controleur_cabine'] },
        { href: '/admin/packages',     icone: 'inventory_2',  label: 'Forfaits',       desc: 'Catalogue forfaits MTN & Orange', roles: ['super_admin','admin'] },
        { href: '/admin/agents-promo', icone: 'groups',       label: 'Agents promo',  desc: 'Agents terrain & recrutement',  roles: ['super_admin','admin','chef_agents_promo'] },
      ].filter(i => i.roles.includes(role)),
    },
    {
      key: 'clients',
      icone: 'support_agent',
      label: 'Relation client',
      couleur: '#8b5cf6',
      roles: ['super_admin','admin','service_client'],
      items: [
        { href: '/admin/reclamations', icone: 'report_problem', label: 'Réclamations', desc: 'Plaintes & litiges clients',    roles: ['super_admin','admin','service_client'] },
        { href: '/admin/messagerie',   icone: 'chat_bubble',    label: 'Messagerie',   desc: 'Chat interne & avec cabines',  roles: ['super_admin','admin','service_client'] },
        { href: '/admin/support',      icone: 'help_center',    label: 'Support',      desc: 'Tickets support clients',      roles: ['super_admin','admin','service_client'] },
        { href: '/admin/call-center',  icone: 'call',           label: 'Call Center',  desc: 'Journal & appels téléphoniques', roles: ['super_admin','admin','service_client'] },
        { href: '/admin/fraude',       icone: 'security',       label: 'Fraude',       desc: 'Anti-fraude & liste noire',   roles: ['super_admin','admin'] },
      ].filter(i => i.roles.includes(role)),
    },
    {
      key: 'reporting',
      icone: 'analytics',
      label: 'Suivi & reporting',
      couleur: '#10b981',
      roles: ['super_admin','admin','service_client','chef_agents_promo','controleur_cabine'],
      items: [
        { href: '/admin/notifications', icone: 'notifications', label: 'Notifications', desc: 'Alertes temps réel',         badge: notifCount, roles: ['super_admin','admin','service_client','chef_agents_promo','controleur_cabine'] },
        { href: '/admin/taches',        icone: 'task_alt',      label: 'Tâches',        desc: 'Tâches internes de l\'équipe', roles: ['super_admin','admin'] },
        { href: '/admin/rapports',      icone: 'bar_chart',     label: 'Rapports',      desc: 'Bilans & statistiques',      roles: ['super_admin','admin'] },
      ].filter(i => i.roles.includes(role)),
    },
    {
      key: 'equipe',
      icone: 'people',
      label: 'Équipe',
      couleur: '#ec4899',
      roles: ['super_admin','admin','service_client','chef_agents_promo','controleur_cabine'],
      items: [
        { href: '/admin/salaires',      icone: 'payments',        label: 'Salaires',      desc: 'Sessions de travail & paiements',      roles: ['super_admin','admin','service_client','chef_agents_promo','controleur_cabine'] },
        { href: '/admin/remunerations', icone: 'store',           label: 'Rémunérations', desc: 'Payer les cabines selon leur chiffre', roles: ['super_admin','admin'] },
        { href: '/admin/equipe',        icone: 'manage_accounts', label: 'Équipe',        desc: 'Comptes & rôles administrateurs',       roles: ['super_admin'] },
      ].filter(i => i.roles.includes(role)),
    },
  ].filter(g => g.roles.includes(role) && g.items.length > 0))

  function estActif(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }

  function estGroupeActif(g: Groupe) {
    return g.items.some(i => estActif(i.href))
  }

  function toggleGroupe(key: string) {
    groupeOuvert = groupeOuvert === key ? null : key
  }

  function naviguer(href: string) {
    groupeOuvert = null
    goto(href)
  }

  async function seDeconnecter() {
    try { await api.post('/auth/logout') } catch {}
    auth.logout()
    toast.info(translate('common.logout'), translate('toast.goodbye'))
    goto('/login')
  }

  function initiales(nom: string | null) {
    if (!nom) return '?'
    return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  const groupeActuel = $derived(groupes.find(g => g.key === groupeOuvert) ?? null)
</script>

<!-- Backdrop -->
{#if groupeOuvert}
  <div
    class="fixed inset-0 z-30  backdrop-white/30 backdrop-blur-sm"
    onclick={() => groupeOuvert = null}
    role="presentation"
  ></div>
{/if}

<!-- Panneau sous-menu -->
{#if groupeActuel}
  <div
    class="fixed z-50 top-1/2 -translate-y-1/2 animate-fade-in-up"
    style="left: 250px; width: 50vw; height: 60%;"
  >
    <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08);">
      <!-- En-tête -->
      <div class="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <p class="font-bold text-slate-900 text-sm">{groupeActuel.label}</p>
        <button
          onclick={() => groupeOuvert = null}
          class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
        >
          <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
        </button>
      </div>

      <!-- Liste de liens -->
      <div class="p-2">
        {#each groupeActuel.items as item}
          <button
            onclick={() => naviguer(item.href)}
            class="w-full text-left flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-150 hover:bg-slate-50 group"
            class:bg-slate-50={estActif(item.href)}
          >
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold"
                  style="color: {estActif(item.href) ? groupeActuel.couleur : '#1e293b'}">
                  {item.label}
                </p>
                {#if (item.badge ?? 0) > 0}
                  <span class="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                  </span>
                {/if}
              </div>
              <p class="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            {#if estActif(item.href)}
              <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background: {groupeActuel.couleur};"></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

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
          style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
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
        style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
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
      <button
        type="button"
        onclick={() => toggleGroupe(groupe.key)}
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative text-left"
        class:text-slate-900={estGroupeActif(groupe) || groupeOuvert === groupe.key}
        class:font-semibold={estGroupeActif(groupe) || groupeOuvert === groupe.key}
        class:text-slate-600={!estGroupeActif(groupe) && groupeOuvert !== groupe.key}
        style={groupeOuvert === groupe.key
          ? `background: ${groupe.couleur}12; color: ${groupe.couleur};`
          : estGroupeActif(groupe)
            ? `background: ${groupe.couleur}10;`
            : ''}
        title={reduit && !estMobile ? groupe.label : ''}
      >
        <!-- Point actif -->
        {#if estGroupeActif(groupe) && (!groupeOuvert || groupeOuvert !== groupe.key)}
          <span class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
            style="background: {groupe.couleur};"></span>
        {/if}

        <span class="material-symbols-outlined icon-filled shrink-0" style="font-size: 20px; {groupeOuvert === groupe.key ? `color: ${groupe.couleur};` : ''}">{groupe.icone}</span>

        {#if !reduit || estMobile}
          <span class="text-sm flex-1 whitespace-nowrap">{groupe.label}</span>
        {/if}
      </button>
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
        style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
      >
        {initiales(auth.user?.fullName ?? null)}
      </div>
      {#if !reduit || estMobile}
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="text-slate-800 text-sm font-semibold truncate leading-none">
            {auth.user?.fullName ?? auth.user?.email ?? 'Admin'}
          </p>
          <p class="text-slate-400 text-xs mt-0.5 capitalize">{auth.user?.role?.replace('_', ' ') ?? ''}</p>
        </div>
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
