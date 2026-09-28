<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { derived } from 'svelte/store'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import { t } from '$lib/stores/locale'
  import api from '$lib/api'
  import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte'
  import { libelleStatut } from '$lib/components/ui/Badge.svelte'

  let { surToggleSidebar } = $props<{ surToggleSidebar: () => void }>()

  let afficherNotifs  = $state(false)
  let modeSombre      = $state(false)
  let notifications   = $state<any[]>([])
  let nbNonLues       = $state(0)
  let rechercheQuery  = $state('')
  let rechercheResults = $state<any[]>([])
  let rechercheLoading = $state(false)
  let rechercheErreur = $state(false)
  let afficherRecherche = $state(false)
  let rechercheTimer: ReturnType<typeof setTimeout> | null = null
  let filtreType = $state<'all' | 'order' | 'cabin' | 'complaint' | 'promo_agent'>('all')

  // ── Cabines connectées ────────────────────────────────────────────────────
  let afficherCabines      = $state(false)
  let cabinesEnLigne       = $state<any[]>([])
  let commandesEnAttente   = $state(0)
  let cabinesLoading       = $state(false)
  let cabinesRefreshTimer: ReturnType<typeof setInterval> | null = null

  const SEARCH_TYPES = [
    { key: 'all',         label: 'Tous',         icon: 'search' },
    { key: 'order',       label: 'Commandes',    icon: 'receipt_long' },
    { key: 'cabin',       label: 'Cabines',      icon: 'store' },
    { key: 'complaint',   label: 'Réclamations', icon: 'report' },
    { key: 'promo_agent', label: 'Agents',       icon: 'badge' },
  ] as const

  const TYPE_ICON: Record<string, string>    = { order: 'receipt_long', cabin: 'store', complaint: 'report', promo_agent: 'badge' }
  const TYPE_BG: Record<string, string>      = { order: 'bg-orange-50', cabin: 'bg-amber-50', complaint: 'bg-red-50', promo_agent: 'bg-violet-50' }
  const TYPE_TEXT: Record<string, string>    = { order: 'text-orange-500', cabin: 'text-amber-500', complaint: 'text-red-500', promo_agent: 'text-violet-500' }
  const TYPE_LABEL: Record<string, string>   = { order: 'Commande', cabin: 'Cabine', complaint: 'Réclamation', promo_agent: 'Agent promo' }
  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-slate-100 text-slate-600',
    active: 'bg-emerald-100 text-emerald-700', suspended: 'bg-red-100 text-red-700',
    open: 'bg-orange-100 text-orange-700', resolved: 'bg-emerald-100 text-emerald-700',
  }
  const TYPE_URL_LISTE: Record<string, string> = { complaint: '/admin/reclamations', promo_agent: '/admin/agents-promo' }
  const CODES_SOUS_TITRE: Record<string, string> = {
    basic: 'Basique', standard: 'Standard', premium: 'Premium',
    in_verification: 'En vérification', resolved: 'Résolue',
  }

  function lienResultat(r: any) {
    return TYPE_URL_LISTE[r.type] ?? r.url ?? '#'
  }

  function sousTitre(r: any) {
    if (!r.subtitle) return TYPE_LABEL[r.type]
    return String(r.subtitle)
      .split(' · ')
      .map((morceau: string) => {
        const code = morceau.trim()
        if (CODES_SOUS_TITRE[code]) return CODES_SOUS_TITRE[code]
        if (/^[a-z]+(_[a-z]+)*$/.test(code) && code !== 'mtn' && code !== 'orange') return libelleStatut(code, $t)
        return morceau
      })
      .join(' · ')
  }

  function rechercheFiltered() {
    if (filtreType === 'all') return rechercheResults
    return rechercheResults.filter(r => r.type === filtreType)
  }

  function rechercheCount(type: string) {
    if (type === 'all') return rechercheResults.length
    return rechercheResults.filter(r => r.type === type).length
  }

  // Titre de la page courante via les clés i18n
  const titrePage = derived(page, ($page) => {
    const chemin = $page.url.pathname
    const carte: [string, string][] = [
      ['/admin/tableau-de-bord', 'admin.nav.dashboard'],
      ['/admin/commandes',       'admin.nav.orders'],
      ['/admin/cabines',         'admin.nav.cabins'],
      ['/admin/abonnements',     'admin.nav.subscriptions'],
      ['/admin/uv',              'UV'],
      ['/admin/reclamations',    'admin.nav.complaints'],
      ['/admin/agents-promo',    'admin.nav.promo_agents'],
      ['/admin/messagerie',      'admin.nav.messaging'],
      ['/admin/support',         'Support'],
      ['/admin/call-center',     'admin.nav.call_center'],
      ['/admin/notifications',   'admin.nav.notifications'],
      ['/admin/taches',          'admin.nav.tasks'],
      ['/admin/fraude',          'Fraude'],
      ['/admin/rapports',        'admin.nav.reports'],
      ['/admin/salaires',        'admin.nav.salaries'],
      ['/admin/remunerations',   'Rémunérations'],
      ['/admin/equipe',          'admin.nav.team'],
      ['/admin/parametres',      'admin.nav.settings'],
      ['/admin/profil',          'admin.nav.profile'],
      ['/admin/packages',        'Forfaits'],
    ]
    for (const [prefix, cle] of carte) {
      if (chemin === prefix || chemin.startsWith(prefix + '/')) return cle
    }
    return 'common.app_name'
  })

  onMount(() => {
    modeSombre = document.documentElement.classList.contains('dark')
    chargerNotifications()
    chargerCabinesEnLigne()
    // Rafraîchir toutes les 30s pour rester synchronisé avec le scheduler
    cabinesRefreshTimer = setInterval(chargerCabinesEnLigne, 30_000)
    return () => { if (cabinesRefreshTimer) clearInterval(cabinesRefreshTimer) }
  })

  async function chargerCabinesEnLigne() {
    cabinesLoading = true
    try {
      const res = await api.get('/cabins/online')
      const payload = res.data?.data
      cabinesEnLigne = Array.isArray(payload) ? payload : (payload?.data ?? [])
      commandesEnAttente = res.data?.meta?.pendingOrdersCount ?? 0
    } catch {
      cabinesEnLigne = []
    } finally {
      cabinesLoading = false
    }
  }

  async function chargerNotifications() {
    try {
      const [liste, compteur] = await Promise.all([
        api.get('/admin/notifications', { params: { per_page: 8 } }),
        api.get('/admin/notifications/count'),
      ])
      notifications = Array.isArray(liste.data?.data) ? liste.data.data : []
      nbNonLues = Number(compteur.data?.data?.count ?? notifications.filter((n: any) => n.isNew).length)
    } catch {}
  }

  function basculerModeSombre() {
    modeSombre = !modeSombre
    document.documentElement.classList.toggle('dark', modeSombre)
    localStorage.setItem('theme', modeSombre ? 'dark' : 'light')
  }

  async function marquerToutLu() {
    try {
      await api.patch('/admin/notifications/read-all')
      notifications = notifications.map(n => ({ ...n, isNew: false }))
      nbNonLues = 0
    } catch {}
  }

  function initiales(nom: string | null) {
    if (!nom) return '?'
    return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  function fermerRecherche() {
    afficherRecherche = false
    rechercheResults = []
    rechercheQuery = ''
    filtreType = 'all'
  }

  function onRechercheInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    rechercheQuery = val
    afficherRecherche = rechercheQuery.length > 0
    filtreType = 'all'
    rechercheErreur = false
    if (rechercheTimer) clearTimeout(rechercheTimer)
    if (rechercheQuery.trim().length < 2) { rechercheResults = []; return }
    rechercheTimer = setTimeout(async () => {
      rechercheLoading = true
      try {
        const res = await api.get('/admin/search', { params: { q: rechercheQuery, per_page: 30 } })
        rechercheResults = Array.isArray(res.data?.data) ? res.data.data : []
      } catch {
        rechercheResults = []
        rechercheErreur = true
      } finally {
        rechercheLoading = false
      }
    }, 300)
  }
</script>

<header class="sticky top-0 z-30 border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center gap-3 bg-white">

  <!-- Gauche : toggle + titre -->
  <div class="flex items-center gap-3 flex-1 min-w-0">
    <button
      onclick={surToggleSidebar}
      class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"
      aria-label="Menu"
    >
      <span class="material-symbols-outlined" style="font-size: 20px;">menu</span>
    </button>

    <h1 class="font-bold text-lg tracking-tight hidden sm:block text-slate-900 truncate">
      {$t($titrePage)}
    </h1>

    <!-- Recherche globale (desktop) -->
    <div class="relative hidden md:block flex-1 max-w-md ml-4">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400" style="font-size:16px">search</span>
        <input
          type="search"
          class="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all"
          value={rechercheQuery}
          oninput={onRechercheInput}
          onfocus={() => { if (rechercheQuery.length > 0) afficherRecherche = true }}
          onkeydown={(e) => { if (e.key === 'Escape') fermerRecherche() }}
          placeholder={$t('common.search')}
          aria-label={$t('common.search')}
        />
        {#if rechercheLoading}
          <span class="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
        {:else if rechercheQuery}
          <button onclick={fermerRecherche} class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined" style="font-size:14px">close</span>
          </button>
        {/if}
      </div>

      {#if afficherRecherche}
        <button class="fixed inset-0 z-40" onclick={fermerRecherche} aria-label="Fermer"></button>
        <div class="absolute left-0 right-0 mt-2 bg-white rounded-2xl z-50 border border-slate-100 overflow-hidden"
          style="box-shadow:0 20px 50px rgba(0,0,0,0.14),0 6px 20px rgba(0,0,0,0.08); min-width:480px">

          {#if rechercheLoading}
            <div class="divide-y divide-slate-50">
              {#each Array(4) as _}
                <div class="flex items-center gap-3 px-4 py-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 bg-slate-100 rounded animate-pulse w-40"></div>
                    <div class="h-2.5 bg-slate-100 rounded animate-pulse w-60"></div>
                  </div>
                </div>
              {/each}
            </div>

          {:else if rechercheErreur}
            <div class="py-10 text-center px-6">
              <span class="material-symbols-outlined text-red-300" style="font-size:32px">error</span>
              <p class="text-sm text-slate-500 mt-2">La recherche est momentanément indisponible.</p>
              <p class="text-xs text-slate-400 mt-1">Utilisez les filtres des pages Commandes ou Cabines en attendant.</p>
            </div>

          {:else if rechercheResults.length === 0}
            <div class="py-10 text-center">
              <span class="material-symbols-outlined text-slate-300" style="font-size:32px">search_off</span>
              <p class="text-sm text-slate-400 mt-2">Aucun résultat pour « {rechercheQuery} »</p>
            </div>

          {:else}
            <!-- Filtres par type -->
            <div class="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-slate-100 flex-wrap">
              {#each SEARCH_TYPES as t}
                {@const count = rechercheCount(t.key)}
                {#if t.key === 'all' || count > 0}
                  <button
                    onclick={() => filtreType = t.key}
                    class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                      {filtreType === t.key
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                    {t.label}
                    <span class="text-[10px] opacity-70">{count}</span>
                  </button>
                {/if}
              {/each}
            </div>

            <!-- Résultats -->
            <div class="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {#each rechercheFiltered() as r}
                <a href={lienResultat(r)} onclick={fermerRecherche}
                  class="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors group">
                  <div class="w-8 h-8 rounded-lg {TYPE_BG[r.type]} flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined icon-filled {TYPE_TEXT[r.type]}" style="font-size:15px">
                      {TYPE_ICON[r.type]}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                      {r.title}
                    </p>
                    <p class="text-xs text-slate-400 truncate">{sousTitre(r)}</p>
                  </div>
                  {#if r.status}
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 {STATUS_COLORS[r.status] ?? 'bg-slate-100 text-slate-600'}">
                      {libelleStatut(r.status, $t)}
                    </span>
                  {/if}
                  <span class="material-symbols-outlined text-slate-300 group-hover:text-orange-400 shrink-0" style="font-size:16px">chevron_right</span>
                </a>
              {/each}
            </div>

            <div class="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 text-right">
              {rechercheFiltered().length} résultat{rechercheFiltered().length > 1 ? 's' : ''}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Droite : langue + mode sombre + notifs + avatar -->
  <div class="flex items-center gap-1 shrink-0">

    <!-- Bouton recherche mobile -->
    <button
      onclick={() => { afficherRecherche = !afficherRecherche }}
      class="md:hidden w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600"
      aria-label="Rechercher"
    >
      <span class="material-symbols-outlined" style="font-size: 20px;">search</span>
    </button>

    <!-- Sélecteur de langue -->
    <LanguageSwitcher />

    <!-- Bouton mode sombre -->
    <button
      onclick={basculerModeSombre}
      title={modeSombre ? 'Mode clair' : 'Mode sombre'}
      class="w-9 h-9 rounded-xl flex items-center justify-center transition-all ml-1"
      style="background-color: {modeSombre ? '#363c4a' : '#f1f5f9'}; color: {modeSombre ? '#94a3b8' : '#64748b'}"
    >
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">
        {modeSombre ? 'light_mode' : 'dark_mode'}
      </span>
    </button>

    <!-- Cabines connectées -->
    <div class="relative">
      <button
        onclick={() => { afficherCabines = !afficherCabines; afficherNotifs = false; if (afficherCabines) chargerCabinesEnLigne() }}
        class="relative flex items-center gap-1.5 px-2.5 h-9 rounded-xl hover:bg-slate-100 transition-all text-slate-700"
        title="Cabines en ligne"
      >
        <!-- Pastille verte animée -->
        <span class="relative flex h-2.5 w-2.5 shrink-0">
          {#if cabinesEnLigne.length > 0}
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          {:else}
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300"></span>
          {/if}
        </span>
        <span class="text-sm font-semibold hidden sm:block">
          {cabinesEnLigne.length}
        </span>
        <span class="material-symbols-outlined text-slate-500 hidden sm:block" style="font-size:16px">store</span>
        {#if commandesEnAttente > 0}
          <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
            {commandesEnAttente > 9 ? '9+' : commandesEnAttente}
          </span>
        {/if}
      </button>

      {#if afficherCabines}
        <button class="fixed inset-0 z-40" onclick={() => afficherCabines = false} aria-label="Fermer"></button>
        <div class="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">

          <!-- En-tête du panel -->
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p class="font-bold text-slate-900 text-sm">Cabines en ligne</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {cabinesEnLigne.length} connectée{cabinesEnLigne.length > 1 ? 's' : ''}
                {#if commandesEnAttente > 0}
                  · <span class="text-orange-500 font-semibold">{commandesEnAttente} en attente</span>
                {/if}
              </p>
            </div>
            <button
              onclick={() => { chargerCabinesEnLigne() }}
              class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              title="Rafraîchir"
            >
              <span class="material-symbols-outlined {cabinesLoading ? 'animate-spin' : ''}" style="font-size:15px">refresh</span>
            </button>
          </div>

          <!-- Liste des cabines -->
          <div class="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {#if cabinesLoading && cabinesEnLigne.length === 0}
              {#each Array(3) as _}
                <div class="flex items-center gap-3 px-4 py-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="h-3 bg-slate-100 rounded animate-pulse w-28"></div>
                    <div class="h-2.5 bg-slate-100 rounded animate-pulse w-36"></div>
                  </div>
                </div>
              {/each}
            {:else if cabinesEnLigne.length === 0}
              <div class="py-8 text-center">
                <span class="material-symbols-outlined text-slate-300" style="font-size:28px">store_off</span>
                <p class="text-xs text-slate-400 mt-2">Aucune cabine connectée</p>
              </div>
            {:else}
              {#each cabinesEnLigne as cabin}
                {@const slotPct = Math.round((cabin.dailyOrdersCount / Math.max(1, cabin.maxDailyOrders)) * 100)}
                <a
                  href="/admin/commandes?cabin={cabin.id}"
                  onclick={() => afficherCabines = false}
                  class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <!-- Avatar cabine -->
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:15px">store</span>
                  </div>

                  <!-- Infos -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                        {cabin.name}
                      </p>
                      <!-- Réseau -->
                      {#if cabin.network}
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0
                          {cabin.network === 'mtn' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}">
                          {cabin.network.toUpperCase()}
                        </span>
                      {/if}
                    </div>
                    <!-- Barre de charge -->
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all
                            {slotPct >= 80 ? 'bg-red-400' : slotPct >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}"
                          style="width:{slotPct}%"
                        ></div>
                      </div>
                      <span class="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {cabin.dailyOrdersCount}/{cabin.maxDailyOrders}
                      </span>
                    </div>
                  </div>

                  <!-- Commandes actives -->
                  {#if cabin.activeOrders > 0}
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                      {cabin.activeOrders} en cours
                    </span>
                  {:else}
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                      Libre
                    </span>
                  {/if}
                </a>
              {/each}
            {/if}
          </div>

          <!-- Footer -->
          <div class="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
            <a
              href="/admin/cabines"
              onclick={() => afficherCabines = false}
              class="text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              Toutes les cabines
            </a>
            {#if commandesEnAttente > 0}
              <a
                href="/admin/commandes?status=pending_admin_review"
                onclick={() => afficherCabines = false}
                class="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
              >
                <span class="material-symbols-outlined" style="font-size:12px">assignment_late</span>
                {commandesEnAttente} à assigner
              </a>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Notifications -->
    <div class="relative">
      <button
        onclick={() => { afficherNotifs = !afficherNotifs; if (afficherNotifs) chargerNotifications() }}
        class="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600"
        aria-label={$t('common.notifications')}
      >
        <span class="material-symbols-outlined icon-filled" style="font-size: 20px;">notifications</span>
        {#if nbNonLues > 0}
          <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
            {nbNonLues > 9 ? '9+' : nbNonLues}
          </span>
        {/if}
      </button>

      {#if afficherNotifs}
        <button class="fixed inset-0 z-40" onclick={() => afficherNotifs = false} aria-label="Fermer"></button>
        <div class="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span class="font-bold text-slate-900 text-sm">{$t('common.notifications')}</span>
            <div class="flex items-center gap-2">
              {#if nbNonLues > 0}
                <span class="text-xs px-2 py-0.5 rounded-full font-medium text-white bg-orange-500">
                  {nbNonLues > 9 ? '9+' : nbNonLues} {$t('admin.notifications.unread').replace('{count}', '')}
                </span>
                <button onclick={marquerToutLu} class="text-xs text-slate-400 hover:text-orange-500 transition-colors">
                  {$t('admin.notifications.mark_all_read')}
                </button>
              {/if}
            </div>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#if notifications.length === 0}
              <div class="py-8 text-center text-slate-400">
                <span class="material-symbols-outlined" style="font-size: 28px;">notifications_none</span>
                <p class="text-xs mt-1">{$t('admin.notifications.none')}</p>
              </div>
            {:else}
              {#each notifications as notif}
                <div class="px-4 py-3 border-b border-slate-50 last:border-0 {notif.isNew ? 'bg-orange-50/60' : ''}">
                  <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size: 13px;">notifications</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-slate-700 leading-snug line-clamp-2">
                        {notif.message ?? notif.title ?? 'Nouvelle notification'}
                      </p>
                      <p class="text-xs text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('fr-CM')}
                      </p>
                    </div>
                    {#if notif.isNew}
                      <div class="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5"></div>
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="px-4 py-2.5 border-t border-slate-100">
            <a href="/admin/notifications" onclick={() => afficherNotifs = false} class="text-xs text-orange-500 font-semibold hover:text-orange-600">
              {$t('admin.notifications.see_all')}
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Avatar -->
    <a href="/admin/profil" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all ml-1">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
      >
        {initiales(auth.user?.fullName ?? null)}
      </div>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold text-slate-800 leading-none">
          {auth.user?.fullName?.split(' ')[0] ?? 'Admin'}
        </p>
      </div>
    </a>
  </div>
</header>
