<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { cabinAuth } from '$lib/stores/cabin-auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'
  import { formatOrderCode } from '$lib/reference'

  let dashboard    = $state<any>(null)
  let chargement   = $state(true)
  let remunerations = $state<any>(null)

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

  async function charger() {
    chargement = true
    try {
      const [dashRes, remRes] = await Promise.all([
        apiCabin.get('/cabin/dashboard'),
        apiCabin.get('/cabin/profile/remunerations', { params: { per_page: 3 } }).catch(() => null),
      ])

      const raw = dashRes.data
      dashboard = (raw?.cabin ? raw : raw?.data) ?? null
      if (dashboard?.cabin) {
        cabinAuth.update({
          uvBalance:        dashboard.cabin.uvBalance ?? dashboard.cabin.uv_balance,
          dailyOrdersCount: dashboard.cabin.dailyOrdersCount ?? dashboard.cabin.daily_orders_count,
          maxDailyOrders:   dashboard.cabin.maxDailyOrders ?? dashboard.cabin.max_daily_orders,
          status:           dashboard.cabin.status,
        })
      }

      if (remRes) {
        const r = remRes.data
        remunerations = r?.meta ? r : (r?.data ?? null)
      }
    } catch {
      toast.erreur(translate('toast.error'), translate('cabin.dashboard.no_orders'))
    } finally {
      chargement = false
    }
  }

  onMount(charger)

  const cab = $derived(dashboard?.cabin ?? cabinAuth.user)
</script>

<svelte:head><title>Tableau de bord — {cabinAuth.user?.cabinName ?? 'Espace Cabine'}</title></svelte:head>

<!-- En-tête -->
<div class="mb-6 flex items-start lg:items-center justify-between flex-wrap gap-3">
  <div class="min-w-0 flex-1">
    <h2 class="font-black text-2xl lg:text-3xl text-slate-900 leading-tight" style="letter-spacing:-0.02em">
      Bonjour, {cabinAuth.user?.managerName?.split(' ')[0] ?? 'Gestionnaire'} 👋
    </h2>
    <p class="text-slate-500 text-sm mt-1">
      {new Date().toLocaleDateString('fr-CM', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
  </div>
  <button onclick={charger} class="btn-secondary">
    <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
    Actualiser
  </button>
</div>

{#if chargement}
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    {#each Array(3) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
  </div>
  <div class="skeleton h-64 rounded-2xl"></div>
{:else}

  <!-- Alerte suspension -->
  {#if cab?.status === 'suspended'}
    <div class="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
      <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:22px">block</span>
      <div>
        <p class="font-bold text-red-700">Cabine suspendue</p>
        <p class="text-sm text-red-600 mt-0.5">Contactez l'administrateur pour plus d'informations.</p>
      </div>
    </div>
  {/if}

  <!-- Stats principales -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

    <!-- Commandes du jour — illimité -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">receipt_long</span>
        </div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Commandes du jour</span>
      </div>
      <p class="font-black text-4xl text-slate-900 leading-none">
        {cab?.dailyOrdersCount ?? cab?.daily_orders_count ?? 0}
      </p>
      <p class="text-xs text-slate-400 mt-2">commandes traitées aujourd'hui</p>
    </div>

    <!-- Chiffre du jour -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:20px">payments</span>
        </div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Chiffre du jour</span>
      </div>
      <p class="font-black text-2xl text-slate-900 leading-none">
        {formaterMontant(dashboard?.today?.total_amount ?? 0)}
      </p>
      <p class="text-xs text-slate-400 mt-2">
        {dashboard?.today?.total ?? 0} commande{(dashboard?.today?.total ?? 0) > 1 ? 's' : ''} complétée{(dashboard?.today?.total ?? 0) > 1 ? 's' : ''}
      </p>
    </div>

    <!-- Statut cabine -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center
          {cab?.status === 'active' ? 'bg-emerald-50' : 'bg-amber-50'}">
          <span class="material-symbols-outlined icon-filled" style="font-size:20px;
            color:{cab?.status === 'active' ? '#10b981' : '#f59e0b'}">
            {cab?.status === 'active' ? 'check_circle' : 'pause_circle'}
          </span>
        </div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Statut</span>
      </div>
      <p class="font-black text-2xl capitalize
        {cab?.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}">
        {cab?.status === 'active' ? 'Active' : 'En pause'}
      </p>
      <p class="text-xs text-slate-400 mt-2">
        UV disponibles : <span class="font-bold text-slate-700">{cab?.uvBalance ?? cab?.uv_balance ?? 0}</span>
      </p>
    </div>
  </div>

  <!-- Stats secondaires : Paiement & Commandes en attente -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

    <!-- Dernier paiement reçu -->
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:20px">payments</span>
        </div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dernier paiement</span>
      </div>
      {#if remunerations?.meta?.lastAmount}
        <p class="font-black text-2xl text-slate-900 leading-none">
          {Number(remunerations.meta.lastAmount).toLocaleString('fr-CM')} XAF
        </p>
        <p class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2">
          <span class="truncate">
            {remunerations.meta.lastPaymentAt
              ? new Date(remunerations.meta.lastPaymentAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''} · Total : {Number(remunerations.meta.totalReceived ?? 0).toLocaleString('fr-CM')} XAF
          </span>
          <a href="/cabine/paiements" class="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 shrink-0">
            Historique<span class="material-symbols-outlined" style="font-size:13px">chevron_right</span>
          </a>
        </p>
      {:else}
        <p class="font-black text-2xl text-slate-400 leading-none">—</p>
        <p class="text-xs text-slate-400 mt-2">Aucun paiement reçu pour le moment</p>
      {/if}
    </div>

    <!-- Commandes en attente -->
    <a href="/cabine/commandes"
      class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow block group hover:border-orange-200 transition-colors">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">assignment_ind</span>
        </div>
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">En attente</span>
      </div>
      <p class="font-black text-4xl text-slate-900 leading-none">
        {dashboard?.pendingCount ?? 0}
      </p>
      <p class="text-xs text-slate-400 mt-2 flex items-center justify-between">
        <span>{(dashboard?.pendingCount ?? 0) > 0 ? 'Cliquez pour les traiter' : 'Aucune commande en attente'}</span>
        {#if (dashboard?.pendingCount ?? 0) > 0}
          <span class="material-symbols-outlined text-orange-400 group-hover:text-orange-500 transition-colors" style="font-size:16px">arrow_forward</span>
        {/if}
      </p>
    </a>
  </div>

  <!-- Dernières commandes complétées -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden card-shadow">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-bold text-slate-900">Commandes récentes complétées</h3>
      <a href="/cabine/commandes?status=completed" class="text-sm text-orange-500 font-semibold hover:text-orange-600">
        Voir tout
      </a>
    </div>

    {#if (dashboard?.recentCompleted ?? []).length === 0}
      <div class="py-14 text-center">
        <span class="material-symbols-outlined text-slate-300" style="font-size:40px">receipt_long</span>
        <p class="text-slate-500 text-sm mt-2">Aucune commande complétée aujourd'hui</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each (dashboard?.recentCompleted ?? []).slice(0, 8) as cmd}
          <div class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-all">
            <!-- Réseau -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style="background:{cmd.network === 'mtn' ? '#fef3c7' : '#fff7ed'}">
              <span class="text-xs font-black"
                style="color:{cmd.network === 'mtn' ? '#92400e' : '#9a3f0b'}">
                {(cmd.network ?? '?').toUpperCase()}
              </span>
            </div>

            <!-- Infos -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-xs font-mono font-bold text-orange-600">
                  {formatOrderCode(cmd.order_code, cmd.orderCode, cmd.id)}
                </p>
              </div>
              <p class="text-sm font-semibold text-slate-800 truncate">
                {cmd.customer_phone ?? '—'}
              </p>
            </div>

            <!-- Montant -->
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-slate-900">{formaterMontant(cmd.amount)}</p>
              <p class="text-xs text-slate-400">{formaterDate(cmd.completed_at)}</p>
            </div>

            <!-- Badge -->
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              Complétée
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

{/if}
