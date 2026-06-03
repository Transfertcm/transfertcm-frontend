<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  let data = $state<any>(null)
  let chargement = $state(true)

  const STATUS_LABELS: Record<string, string> = {
    completed:          'Complétée',
    cancelled:          'Annulée',
    returned_to_admin:  'Retournée',
  }

  const STATUS_COLORS: Record<string, string> = {
    completed:         'bg-emerald-100 text-emerald-700',
    cancelled:         'bg-slate-100 text-slate-600',
    returned_to_admin: 'bg-amber-100 text-amber-700',
  }

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/profile/performance')
      data = res.data?.data ?? null
    } catch {
      toast.erreur('Erreur', 'Impossible de charger les performances')
    } finally {
      chargement = false
    }
  }

  function scoreColor(s: number) {
    if (s >= 80) return 'text-emerald-600'
    if (s >= 60) return 'text-amber-600'
    return 'text-red-500'
  }

  function barColor(s: number) {
    if (s >= 80) return 'bg-emerald-500'
    if (s >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  onMount(charger)
</script>

<svelte:head><title>Performance — Espace cabine</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Performance</h2>
  <p class="text-sm text-slate-500 mt-0.5">Scores et statistiques de traitement des commandes</p>
</div>

{#if chargement}
  <div class="space-y-4">
    {#each Array(3) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
  </div>
{:else if data}

  <!-- Score global -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-6 mb-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="font-bold text-slate-900">Score global</h3>
        {#if data.scores?.lastCalculatedAt}
          <p class="text-xs text-slate-400 mt-0.5">Mis à jour le {formatDate(data.scores.lastCalculatedAt ?? data.scores.last_calculated_at)}</p>
        {/if}
      </div>
      <p class="text-4xl font-black {scoreColor(data.scores?.overallScore ?? data.scores?.overall_score ?? 0)}">
        {data.scores?.overallScore ?? data.scores?.overall_score ?? 0}%
      </p>
    </div>
    <div class="w-full bg-slate-100 rounded-full h-3">
      <div
        class="h-3 rounded-full transition-all {barColor(data.scores?.overallScore ?? data.scores?.overall_score ?? 0)}"
        style="width: {data.scores?.overallScore ?? data.scores?.overall_score ?? 0}%">
      </div>
    </div>
  </div>

  <!-- Quota du jour -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
        <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">today</span>
      </div>
      <h3 class="font-bold text-slate-900">Aujourd'hui</h3>
    </div>
    <div class="grid grid-cols-3 gap-4">
      {#each [
        { label: 'Traitées', val: data.today?.count ?? 0, color: 'text-orange-600' },
        { label: 'Restantes', val: data.today?.remaining ?? 0, color: 'text-emerald-600' },
        { label: 'Max', val: data.today?.max ?? 0, color: 'text-slate-600' },
      ] as stat}
        <div class="text-center p-3 rounded-xl bg-slate-50">
          <p class="text-xs text-slate-500 mb-1">{stat.label}</p>
          <p class="text-2xl font-black {stat.color}">{stat.val}</p>
        </div>
      {/each}
    </div>
    {#if (data.today?.max ?? 0) > 0}
      <div class="mt-3">
        <div class="w-full bg-slate-100 rounded-full h-2">
          <div class="h-2 rounded-full bg-orange-500 transition-all"
            style="width: {Math.min(100, ((data.today?.count ?? 0) / (data.today?.max ?? 1)) * 100)}%">
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-1 text-right">
          {data.today?.count ?? 0} / {data.today?.max ?? 0} commandes
        </p>
      </div>
    {/if}
  </div>

  <!-- Statistiques globales -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
    {#each [
      { label: 'Total commandes', val: data.scores?.totalOrders ?? data.scores?.total_orders ?? 0, icon: 'receipt_long', color: 'slate' },
      { label: 'Complétées',      val: data.scores?.completedOrders ?? data.scores?.completed_orders ?? 0, icon: 'check_circle', color: 'emerald' },
      { label: 'En retard',       val: data.scores?.delayedOrders ?? data.scores?.delayed_orders ?? 0, icon: 'schedule', color: 'amber' },
      { label: 'Annulées',        val: data.scores?.cancelledOrders ?? data.scores?.cancelled_orders ?? 0, icon: 'cancel', color: 'red' },
    ] as stat}
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-{stat.color}-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-{stat.color}-500 icon-filled" style="font-size:18px">{stat.icon}</span>
          </div>
          <div>
            <p class="text-xs text-slate-500">{stat.label}</p>
            <p class="text-xl font-black text-slate-900">{stat.val}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Commandes récentes -->
  {#if data.recentOrders?.length}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">history</span>
        </div>
        <h3 class="font-bold text-slate-900">Commandes récentes</h3>
      </div>
      <div class="divide-y divide-slate-100">
        {#each data.recentOrders as order}
          <div class="flex items-center justify-between px-5 py-3.5">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{order.order_code ?? `#${order.id.slice(-8)}`}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {order.network ? order.network.toUpperCase() : '—'} · {order.service_type ?? '—'}
                {order.amount ? ` · ${new Intl.NumberFormat('fr-FR').format(order.amount)} FCFA` : ''}
              </p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3
              {STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-600'}">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow py-12 text-center">
      <span class="material-symbols-outlined text-slate-300" style="font-size:36px">inbox</span>
      <p class="text-sm text-slate-400 mt-2">Aucune commande récente</p>
    </div>
  {/if}

{/if}
