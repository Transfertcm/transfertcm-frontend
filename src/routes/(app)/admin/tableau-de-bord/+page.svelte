<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { t } from '$lib/stores/locale'
  import StatCard from '$lib/components/ui/StatCard.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'

  let stats = $state<any>(null)
  let commandesRecentes = $state<any[]>([])
  let cabinesActives = $state<any[]>([])
  let chargement = $state(true)
  let periode = $state('jour')

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function formaterDate(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  async function chargerDonnees() {
    chargement = true
    try {
      const [dashRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard', { params: { periode } }),
        api.get('/admin/orders?per_page=8&page=1'),
      ])

      const dash = dashRes.data?.data ?? dashRes.data
      stats = dash
      commandesRecentes = ordersRes.data?.data ?? []
      cabinesActives = dash?.activeCabins ?? []
    } catch {
      stats = null
      commandesRecentes = []
      cabinesActives = []
    } finally {
      chargement = false
    }
  }

  onMount(chargerDonnees)

  $effect(() => {
    periode // réagir au changement
    chargerDonnees()
  })

  const prenomAdmin = $derived(auth.user?.fullName?.split(' ')[0] ?? 'Admin')
</script>

<svelte:head><title>{$t('admin.dashboard.title')} — TransfertCM Admin</title></svelte:head>

<!-- En-tête de page -->
<div class="mb-6 flex items-start lg:items-center justify-between flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-black text-2xl lg:text-3xl text-slate-900 leading-tight" style="letter-spacing: -0.02em">
      {$t('admin.dashboard.greeting', { name: prenomAdmin })}
    </h2>
    <p class="text-sm text-slate-500 mt-1">{$t('admin.dashboard.subtitle')}</p>
  </div>
  <div class="flex items-center gap-2 flex-wrap">
    <!-- Sélecteur de période -->
    <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
      {#each [['jour', 'admin.dashboard.period.today'], ['semaine', 'admin.dashboard.period.week'], ['mois', 'admin.dashboard.period.month']] as [val, labelKey]}
        <button
          onclick={() => periode = val}
          class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
            {periode === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
        >
          {$t(labelKey)}
        </button>
      {/each}
    </div>
    <a
      href="/admin/commandes"
      class="btn-primary"
    >
      <span class="material-symbols-outlined icon-filled" style="font-size: 18px;">receipt_long</span>
      <span class="hidden sm:inline">{$t('admin.dashboard.manage_orders')}</span>
      <span class="sm:hidden">{$t('common.orders')}</span>
    </a>
  </div>
</div>

<!-- Cartes de statistiques -->
{#if chargement}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    {#each Array(8) as _}
      <div class="skeleton h-24 rounded-xl"></div>
    {/each}
  </div>
{:else}
  {@const ordres = stats?.orders ?? {}}
  {@const cabines = stats?.cabins ?? {}}
  {@const paiements = stats?.payments ?? {}}

  {@const labelPeriode = periode === 'semaine' ? 'cette semaine' : periode === 'mois' ? 'ce mois' : "aujourd'hui"}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <StatCard
      titre="Commandes {labelPeriode}"
      valeur={ordres?.totals?.total ?? 0}
      icone="receipt_long"
      couleur="orange"
    />
    <StatCard
      titre="Chiffre d'affaires {labelPeriode}"
      valeur={formaterMontant(ordres?.totals?.total_amount ?? 0)}
      icone="payments"
      couleur="jaune"
    />
    <StatCard
      titre="Paiements reçus {labelPeriode}"
      valeur={paiements?.total_paid ?? 0}
      icone="check_circle"
      couleur="vert"
    />
    <StatCard
      titre="Revenus (frais) {labelPeriode}"
      valeur={formaterMontant(paiements?.total_revenue ?? 0)}
      icone="account_balance"
      couleur="violet"
    />
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    {#each (ordres?.byStatus ?? []) as s}
      <StatCard
        titre={s.status?.replace(/_/g, ' ') ?? '—'}
        valeur={s.count ?? 0}
        icone="circle"
        couleur="bleu"
      />
    {/each}
    <StatCard
      titre={$t('admin.dashboard.active_cabins')}
      valeur={(cabines?.byStatus ?? []).find((s: any) => s.status === 'active')?.count ?? 0}
      icone="store"
      couleur="vert"
    />
    <StatCard
      titre={$t('admin.dashboard.suspended_cabins')}
      valeur={(cabines?.byStatus ?? []).find((s: any) => s.status === 'suspended')?.count ?? 0}
      icone="block"
      couleur="rouge"
    />
  </div>
{/if}

<!-- Contenu principal : commandes + cabines -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

  <!-- Commandes récentes -->
  <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-bold text-slate-900">{$t('admin.dashboard.recent_orders')}</h3>
      <a href="/admin/commandes" class="text-sm text-orange-500 hover:text-orange-600 font-semibold">
        {$t('common.see_all')}
      </a>
    </div>

    {#if chargement}
      <div class="p-5 space-y-2">
        {#each Array(5) as _}
          <div class="skeleton h-12 rounded-xl"></div>
        {/each}
      </div>
    {:else if commandesRecentes.length === 0}
      <div class="py-14 text-center px-6">
        <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size: 24px;">receipt_long</span>
        </div>
        <p class="text-slate-600 font-semibold text-sm">{$t('common.no_data')}</p>
        <p class="text-slate-400 text-xs mt-1">{$t('admin.dashboard.orders_appear_here')}</p>
      </div>
    {:else}
      <!-- En-tête tableau (desktop) -->
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">{$t('admin.orders.col_client')}</div>
        <div class="col-span-2">{$t('common.network')}</div>
        <div class="col-span-2">{$t('common.amount')}</div>
        <div class="col-span-2">{$t('common.service')}</div>
        <div class="col-span-3">{$t('common.status')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each commandesRecentes as cmd}
          <a
            href="/admin/commandes/{cmd.id}"
            class="flex flex-col gap-1.5 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3 hover:bg-slate-50 transition-all"
          >
            <!-- Client -->
            <div class="lg:col-span-3 flex items-center gap-2 min-w-0">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
              >
                {(cmd.customerPhone ?? '?').slice(-2)}
              </div>
              <span class="text-sm text-slate-700 truncate font-medium">
                {cmd.customerPhone ?? '—'}
              </span>
            </div>
            <!-- Réseau -->
            <div class="lg:col-span-2 flex items-center gap-1.5 pl-9 lg:pl-0">
              <span
                class="w-2 h-2 rounded-full shrink-0"
                style="background: {cmd.network === 'mtn' ? '#fbbf24' : cmd.network === 'orange' ? '#f97316' : '#94a3b8'}"
              ></span>
              <span class="text-xs font-semibold text-slate-600 uppercase">
                {cmd.network ?? '—'}
              </span>
            </div>
            <!-- Montant -->
            <div class="lg:col-span-2 pl-9 lg:pl-0">
              <span class="text-sm font-bold text-slate-900">
                {cmd.amount ? cmd.amount.toLocaleString('fr-CM') + ' XAF' : '—'}
              </span>
            </div>
            <!-- Service -->
            <div class="lg:col-span-2 pl-9 lg:pl-0">
              <span class="text-xs text-slate-500 capitalize">{cmd.serviceType ?? '—'}</span>
            </div>
            <!-- Statut -->
            <div class="lg:col-span-3 pl-9 lg:pl-0">
              <Badge statut={cmd.status ?? 'pending'} />
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Cabines actives -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-bold text-slate-900">{$t('admin.dashboard.active_cabins')}</h3>
      <a href="/admin/cabines" class="text-sm text-orange-500 hover:text-orange-600 font-semibold">
        {$t('common.see_all')}
      </a>
    </div>

    {#if chargement}
      <div class="p-5 space-y-3">
        {#each Array(5) as _}
          <div class="skeleton h-14 rounded-xl"></div>
        {/each}
      </div>
    {:else if cabinesActives.length === 0}
      <div class="py-14 text-center px-6">
        <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size: 24px;">store</span>
        </div>
        <p class="text-slate-600 font-semibold text-sm">{$t('admin.dashboard.no_active_cabins')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each cabinesActives as cabine}
          <a
            href="/admin/cabines/{cabine.id}"
            class="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-all"
          >
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style="background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)"
            >
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size: 18px;">store</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{cabine.name ?? '—'}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {cabine.daily_orders_count ?? 0} commande{(cabine.daily_orders_count ?? 0) > 1 ? 's' : ''} aujourd'hui
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold {(cabine.uv_balance ?? 0) < 1000 ? 'text-red-500' : 'text-emerald-600'}">
                {Number(cabine.uv_balance ?? 0).toLocaleString('fr-CM')}
              </p>
              <p class="text-xs text-slate-400">XAF UV</p>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Répartition par réseau -->
{#if !chargement && (stats?.orders?.byNetwork ?? []).length > 0}
  <div class="mt-5 bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow">
    <div class="px-5 py-4 border-b border-slate-100">
      <h3 class="font-bold text-slate-900">{$t('admin.dashboard.by_operator')}</h3>
      <p class="text-xs text-slate-400 mt-0.5">{$t('admin.dashboard.operators_info')}</p>
    </div>
    <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each (stats?.orders?.byNetwork ?? []) as reseau}
        {@const total = (stats?.orders?.byNetwork ?? []).reduce((s: number, r: any) => s + Number(r.count), 0)}
        {@const pct = total > 0 ? Math.round((Number(reseau.count) / total) * 100) : 0}
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                style="background: {reseau.network === 'mtn' ? '#fbbf24' : '#f97316'}"
              ></span>
              <span class="text-sm font-semibold text-slate-700 uppercase">{reseau.network}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900">{reseau.count}</span>
              <span class="text-xs text-slate-400">{pct}%</span>
            </div>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full"
              style="width: {pct}%; background: {reseau.network === 'mtn' ? '#fbbf24' : '#f97316'}"
            ></div>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {$t('admin.dashboard.total')} : {formaterMontant(reseau.total_amount ?? 0)}
          </p>
        </div>
      {/each}
    </div>
  </div>
{/if}
