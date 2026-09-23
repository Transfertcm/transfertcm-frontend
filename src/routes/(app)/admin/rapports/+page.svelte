<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  type Onglet = 'finances' | 'rapports' | 'budgets'
  let onglet = $state<Onglet>('finances')

  // Dashboard financier
  let finances = $state<any>(null)
  let chargementFinances = $state(false)
  let periodeFinances = $state<'month' | 'annual' | 'custom'>('month')
  let dateFrom = $state('')
  let dateTo = $state('')

  async function chargerFinances() {
    chargementFinances = true
    try {
      const params: any = {}
      if (periodeFinances === 'annual') {
        params.period = 'annual'
      } else if (periodeFinances === 'custom' && dateFrom && dateTo) {
        params.date_from = dateFrom
        params.date_to = dateTo
      }
      const res = await api.get('/admin/dashboard/financial', { params })
      finances = res.data?.data ?? null
    } catch {
      toast.erreur('Erreur', 'Impossible de charger le tableau financier')
    } finally { chargementFinances = false }
  }

  let rapports = $state<any[]>([])
  let metaRap = $state<any>(null)
  let pageRap = $state(1)
  let filtreStatutRap = $state('')

  let budgets = $state<any[]>([])
  let metaBud = $state<any>(null)
  let pageBud = $state(1)
  let filtreStatutBud = $state('')

  let chargement = $state(true)
  let actionEnCours = $state('')

  let afficherModalRapport = $state(false)
  let afficherModalBudget = $state(false)
  let rapportSelectionne = $state<any>(null)
  let afficherDetailRapport = $state(false)

  let formRapport = $state({ title: '', introduction: '', workDone: '', conclusions: '' })
  let formBudget = $state({ object: '', estimatedAmount: '', justification: '', priority: 'medium' })
  let raisonRejet = $state('')

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  const configStatut: Record<string, { label: string; classe: string }> = {
    pending:  { label: 'En attente', classe: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Approuvé',   classe: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejeté',     classe: 'bg-red-100 text-red-700 border-red-200' },
    draft:    { label: 'Brouillon',  classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  }

  const configPriorite: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700',
  }

  async function chargerRapports() {
    chargement = true
    try {
      const params: any = { page: pageRap, per_page: 20 }
      if (filtreStatutRap) params.status = filtreStatutRap
      const res = await api.get('/admin/reports', { params })
      const d = res.data?.data
      rapports = d?.data ?? d ?? []
      metaRap = d?.meta ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger les rapports') }
    finally { chargement = false }
  }

  async function chargerBudgets() {
    chargement = true
    try {
      const params: any = { page: pageBud, per_page: 20 }
      if (filtreStatutBud) params.status = filtreStatutBud
      const res = await api.get('/admin/reports/budgets', { params })
      const d = res.data?.data
      budgets = d?.data ?? d ?? []
      metaBud = d?.meta ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger les budgets') }
    finally { chargement = false }
  }

  async function voirRapport(id: string) {
    try {
      const res = await api.get(`/admin/reports/${id}`)
      rapportSelectionne = res.data?.data ?? null
      afficherDetailRapport = true
    } catch { toast.erreur('Erreur', 'Impossible de charger le rapport') }
  }

  async function validerRapport(id: string) {
    actionEnCours = id
    try {
      await api.post(`/admin/reports/${id}/validate`)
      toast.succes('Rapport validé')
      afficherDetailRapport = false
      await chargerRapports()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de valider')
    } finally { actionEnCours = '' }
  }

  async function rejeterRapport(id: string) {
    actionEnCours = id + '_r'
    try {
      await api.post(`/admin/reports/${id}/reject`, { reason: raisonRejet })
      toast.succes('Rapport rejeté')
      afficherDetailRapport = false
      raisonRejet = ''
      await chargerRapports()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de rejeter')
    } finally { actionEnCours = '' }
  }

  async function creerRapport() {
    actionEnCours = 'creer_rap'
    try {
      await api.post('/admin/reports', formRapport)
      toast.succes('Rapport soumis')
      afficherModalRapport = false
      formRapport = { title: '', introduction: '', workDone: '', conclusions: '' }
      await chargerRapports()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de créer')
    } finally { actionEnCours = '' }
  }

  async function creerBudget() {
    actionEnCours = 'creer_bud'
    try {
      await api.post('/admin/reports/budgets', {
        ...formBudget,
        estimatedAmount: Number(formBudget.estimatedAmount),
      })
      toast.succes('Demande de budget créée')
      afficherModalBudget = false
      formBudget = { object: '', estimatedAmount: '', justification: '', priority: 'medium' }
      await chargerBudgets()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de créer')
    } finally { actionEnCours = '' }
  }

  async function approuverBudget(id: string) {
    actionEnCours = id
    try {
      await api.post(`/admin/reports/budgets/${id}/approve`)
      toast.succes('Budget approuvé')
      await chargerBudgets()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'approuver')
    } finally { actionEnCours = '' }
  }

  $effect(() => {
    if (onglet === 'finances') {
      periodeFinances; dateFrom; dateTo
      chargerFinances()
    } else if (onglet === 'rapports') chargerRapports()
    else chargerBudgets()
  })

  onMount(chargerFinances)
</script>

<svelte:head><title>Rapports SGPR — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Rapports SGPR</h2>
    <p class="text-sm text-slate-500 mt-0.5">Rapports d'activité et demandes de budget</p>
  </div>
  <div class="flex gap-2">
    {#if onglet === 'rapports'}
      <button onclick={() => afficherModalRapport = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
        Nouveau rapport
      </button>
    {:else if onglet === 'budgets'}
      <button onclick={() => afficherModalBudget = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
        Demande de budget
      </button>
    {/if}
  </div>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['finances', 'trending_up', 'Finances'], ['rapports', 'bar_chart', 'Rapports'], ['budgets', 'account_balance_wallet', 'Budgets']] as [val, icone, label]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {label}
    </button>
  {/each}
</div>

<!-- ── Onglet Finances ── -->
{#if onglet === 'finances'}
  <!-- Filtres période -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
        {#each [['month', 'Ce mois'], ['annual', 'Cette année'], ['custom', 'Personnalisé']] as [val, lbl]}
          <button onclick={() => periodeFinances = val as typeof periodeFinances}
            class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
              {periodeFinances === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
            {lbl}
          </button>
        {/each}
      </div>
      {#if periodeFinances === 'custom'}
        <input type="date" bind:value={dateFrom} class="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        <span class="text-slate-400 text-sm">→</span>
        <input type="date" bind:value={dateTo} class="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
      {/if}
    </div>
  </div>

  {#if chargementFinances}
    <div class="grid grid-cols-2 md:grid-cols-4 stagger gap-4 mb-5">
      {#each Array(4) as _}<div class="skeleton h-24 rounded-2xl"></div>{/each}
    </div>
  {:else if finances}
    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 stagger gap-4 mb-5">
      {#each [
        { label: 'Revenu total', val: formaterMontant(finances.totals?.total_revenue), icone: 'payments', couleur: '#10b981' },
        { label: 'Montant transféré', val: formaterMontant(finances.totals?.total_amount), icone: 'swap_horiz', couleur: '#007A5E' },
        { label: 'Commandes complétées', val: finances.totals?.total_orders ?? 0, icone: 'check_circle', couleur: '#3b82f6' },
        { label: 'Cabines actives', val: (finances.topCabins ?? []).length, icone: 'store', couleur: '#8b5cf6' },
      ] as kpi}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style="background:{kpi.couleur}18">
            <span class="material-symbols-outlined icon-filled" style="font-size:18px;color:{kpi.couleur}">{kpi.icone}</span>
          </div>
          <p class="text-xl font-black text-slate-900">{kpi.val}</p>
          <p class="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 stagger gap-5 mb-5">
      <!-- Par réseau -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
        <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined icon-filled text-orange-500" style="font-size:18px">signal_cellular_alt</span>
          Par réseau
        </h3>
        {#if (finances.byNetwork ?? []).length === 0}
          <p class="text-sm text-slate-400 text-center py-6">Aucune donnée</p>
        {:else}
          <div class="space-y-3">
            {#each finances.byNetwork as row}
              {@const couleur = row.network === 'mtn' ? '#fbbf24' : row.network === 'orange' ? '#f97316' : '#94a3b8'}
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full shrink-0" style="background:{couleur}"></span>
                <div class="flex-1">
                  <div class="flex justify-between mb-1">
                    <span class="text-xs font-semibold text-slate-700 uppercase">{row.network}</span>
                    <span class="text-xs text-slate-500">{row.total_orders} cmd · {formaterMontant(row.total_amount)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Par service -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
        <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span class="material-symbols-outlined icon-filled text-blue-500" style="font-size:18px">category</span>
          Par service
        </h3>
        {#if (finances.byServiceType ?? []).length === 0}
          <p class="text-sm text-slate-400 text-center py-6">Aucune donnée</p>
        {:else}
          <div class="space-y-2">
            {#each finances.byServiceType as row}
              <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span class="text-sm font-medium text-slate-700 capitalize">{row.service_type ?? '—'}</span>
                <div class="text-right">
                  <span class="text-sm font-bold text-slate-900">{formaterMontant(row.total_amount)}</span>
                  <span class="text-xs text-slate-400 ml-2">({row.total_orders} cmd)</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Top cabines -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <span class="material-symbols-outlined icon-filled text-purple-500" style="font-size:18px">store</span>
        <h3 class="font-bold text-slate-900">Top cabines</h3>
      </div>
      {#if (finances.topCabins ?? []).length === 0}
        <div class="py-12 text-center">
          <p class="text-sm text-slate-400">Aucune commande complétée sur cette période</p>
        </div>
      {:else}
        <div class="divide-y divide-slate-50">
          {#each finances.topCabins as cab, i}
            <div class="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all">
              <span class="text-sm font-black text-slate-300 w-5 text-center">{i + 1}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">{cab.name ?? '—'}</p>
                <p class="text-xs text-slate-400">{cab.total_orders} commandes</p>
              </div>
              <p class="text-sm font-bold text-slate-900 shrink-0">{formaterMontant(cab.total_amount)}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="py-20 text-center bg-white rounded-2xl border border-slate-100 card-shadow">
      <span class="material-symbols-outlined text-slate-300 icon-filled" style="font-size:48px">trending_up</span>
      <p class="text-slate-500 mt-3">Aucune donnée financière disponible</p>
    </div>
  {/if}

{:else if onglet === 'rapports'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <select bind:value={filtreStatutRap} onchange={chargerRapports} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">Tous les statuts</option>
      <option value="pending">En attente</option>
      <option value="approved">Approuvés</option>
      <option value="rejected">Rejetés</option>
    </select>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-16 rounded-xl"></div>{/each}</div>
    {:else if rapports.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">bar_chart</span>
        </div>
        <p class="text-slate-600 font-semibold">Aucun rapport</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each rapports as rap}
          {@const cfg = configStatut[rap.status] ?? configStatut.pending}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">description</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{rap.title ?? '—'}</p>
              <p class="text-xs text-slate-400 mt-0.5">{formaterDate(rap.created_at)}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe}">{cfg.label}</span>
            <button onclick={() => voirRapport(rap.id)}
              class="w-8 h-8 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500">
              <span class="material-symbols-outlined" style="font-size:16px">open_in_new</span>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

{:else}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <select bind:value={filtreStatutBud} onchange={chargerBudgets} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">Tous les statuts</option>
      <option value="draft">Brouillon</option>
      <option value="pending">En attente</option>
      <option value="approved">Approuvés</option>
      <option value="rejected">Rejetés</option>
    </select>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-16 rounded-xl"></div>{/each}</div>
    {:else if budgets.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">account_balance_wallet</span>
        </div>
        <p class="text-slate-600 font-semibold">Aucune demande de budget</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each budgets as bud}
          {@const cfg = configStatut[bud.status] ?? configStatut.draft}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{bud.object ?? '—'}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {configPriorite[bud.priority] ?? 'bg-slate-100 text-slate-600'} capitalize">
                  {bud.priority ?? '—'}
                </span>
                <span class="text-xs text-slate-400">{formaterDate(bud.created_at)}</span>
              </div>
            </div>
            <p class="text-sm font-bold text-slate-900 shrink-0">{formaterMontant(bud.estimated_amount)}</p>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe} shrink-0">{cfg.label}</span>
            {#if bud.status === 'pending' || bud.status === 'draft'}
              <button onclick={() => approuverBudget(bud.id)} disabled={actionEnCours === bud.id}
                class="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 disabled:opacity-50 shrink-0">
                {actionEnCours === bud.id ? '...' : 'Approuver'}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Modal : Détail rapport -->
{#if afficherDetailRapport && rapportSelectionne}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-2xl pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-slate-900 truncate pr-4">{rapportSelectionne.title}</h3>
        <button onclick={() => afficherDetailRapport = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-5">
        {#if rapportSelectionne.introduction}
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Introduction</p>
            <p class="text-sm text-slate-700 leading-relaxed">{rapportSelectionne.introduction}</p>
          </div>
        {/if}
        {#if rapportSelectionne.work_done}
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Travaux réalisés</p>
            <p class="text-sm text-slate-700 leading-relaxed">{rapportSelectionne.work_done}</p>
          </div>
        {/if}
        {#if rapportSelectionne.conclusions}
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Conclusions</p>
            <p class="text-sm text-slate-700 leading-relaxed">{rapportSelectionne.conclusions}</p>
          </div>
        {/if}
        {#if rapportSelectionne.status === 'pending'}
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <label for="raison-rejet-rap" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison de rejet (si rejet)</label>
              <input id="raison-rejet-rap" type="text" bind:value={raisonRejet} placeholder="Motif..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div class="flex gap-3">
              <button onclick={() => rejeterRapport(rapportSelectionne.id)} disabled={!raisonRejet || actionEnCours === rapportSelectionne.id + '_r'}
                class="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionEnCours === rapportSelectionne.id + '_r' ? '...' : 'Rejeter'}
              </button>
              <button onclick={() => validerRapport(rapportSelectionne.id)} disabled={actionEnCours === rapportSelectionne.id}
                class="btn-primary flex-1 justify-center">
                {#if actionEnCours === rapportSelectionne.id}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">check</span>Valider{/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Créer rapport -->
{#if afficherModalRapport}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-slate-900">Nouveau rapport</h3>
        <button onclick={() => afficherModalRapport = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="rap-title" class="block text-xs font-semibold text-slate-600 mb-1.5">Titre *</label>
          <input id="rap-title" type="text" bind:value={formRapport.title} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
        </div>
        <div>
          <label for="rap-intro" class="block text-xs font-semibold text-slate-600 mb-1.5">Introduction</label>
          <textarea id="rap-intro" bind:value={formRapport.introduction} rows="3" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div>
          <label for="rap-work" class="block text-xs font-semibold text-slate-600 mb-1.5">Travaux réalisés</label>
          <textarea id="rap-work" bind:value={formRapport.workDone} rows="4" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div>
          <label for="rap-concl" class="block text-xs font-semibold text-slate-600 mb-1.5">Conclusions</label>
          <textarea id="rap-concl" bind:value={formRapport.conclusions} rows="3" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick={() => afficherModalRapport = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={creerRapport} disabled={!formRapport.title || actionEnCours === 'creer_rap'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'creer_rap'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">send</span>Soumettre{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Créer budget -->
{#if afficherModalBudget}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Demande de budget</h3>
        <button onclick={() => afficherModalBudget = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="bud-object" class="block text-xs font-semibold text-slate-600 mb-1.5">Objet *</label>
          <input id="bud-object" type="text" bind:value={formBudget.object} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="bud-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">Montant estimé (XAF) *</label>
            <input id="bud-amount" type="number" bind:value={formBudget.estimatedAmount} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
          </div>
          <div>
            <label for="bud-priority" class="block text-xs font-semibold text-slate-600 mb-1.5">Priorité</label>
            <select id="bud-priority" bind:value={formBudget.priority} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
        <div>
          <label for="bud-justif" class="block text-xs font-semibold text-slate-600 mb-1.5">Justification *</label>
          <textarea id="bud-justif" bind:value={formBudget.justification} rows="3" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" required></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalBudget = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={creerBudget} disabled={!formBudget.object || !formBudget.estimatedAmount || !formBudget.justification || actionEnCours === 'creer_bud'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'creer_bud'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">send</span>Soumettre{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

