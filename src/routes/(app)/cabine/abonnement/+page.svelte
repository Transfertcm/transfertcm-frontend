<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  // Hiérarchie des plans — ordre croissant
  const PLAN_ORDER = ['basic', 'standard', 'premium'] as const
  type Plan = typeof PLAN_ORDER[number]

  const PLAN_INFO: Record<Plan, { label: string; desc: string; price: string; color: string }> = {
    basic:    { label: 'Basic',    desc: 'Jusqu\'à 100 commandes/jour', price: '5 000 FCFA/mois',  color: 'bg-slate-100 text-slate-700 border-slate-200' },
    standard: { label: 'Standard', desc: 'Jusqu\'à 300 commandes/jour', price: '10 000 FCFA/mois', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    premium:  { label: 'Premium',  desc: 'Commandes illimitées',        price: '20 000 FCFA/mois', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  }

  let data = $state<any>(null)
  let chargement = $state(true)
  let enregistrement = $state(false)
  let modalUpgrade = $state(false)

  let formUpgrade = $state({
    requestedPlan: 'standard' as Plan,
    justification: '',
    urgencyLevel: 'normal',
  })

  // Plans disponibles = ceux strictement au-dessus du plan actuel
  const plansDisponibles = $derived<Plan[]>(() => {
    const currentPlan = (data?.currentPlan ?? 'basic') as Plan
    const currentIndex = PLAN_ORDER.indexOf(currentPlan)
    return PLAN_ORDER.slice(currentIndex + 1)
  })

  const peutDemanderUpgrade = $derived(
    data !== null &&
    !data.pendingUpgradeRequests?.length &&
    plansDisponibles.length > 0
  )

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/profile/subscription')
      data = res.data?.data ?? null
      // Pré-sélectionner le premier plan disponible
      if (data) {
        const currentIndex = PLAN_ORDER.indexOf(data.currentPlan ?? 'basic')
        const premier = PLAN_ORDER[currentIndex + 1]
        if (premier) formUpgrade.requestedPlan = premier
      }
    } catch {
      toast.erreur('Erreur', 'Impossible de charger l\'abonnement')
    } finally {
      chargement = false
    }
  }

  async function soumettreUpgrade(e: Event) {
    e.preventDefault()
    enregistrement = true
    try {
      await apiCabin.post('/cabin/profile/subscription/upgrade-request', {
        requestedPlan: formUpgrade.requestedPlan,
        justification: formUpgrade.justification,
        urgencyLevel:  formUpgrade.urgencyLevel,
      })
      toast.succes('Demande envoyée à l\'administration')
      modalUpgrade = false
      formUpgrade = { requestedPlan: 'standard', justification: '', urgencyLevel: 'normal' }
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible d\'envoyer')
    } finally { enregistrement = false }
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  onMount(charger)
</script>

<svelte:head><title>Abonnement — Espace cabine</title></svelte:head>

<div class="mb-6 flex items-center justify-between gap-4">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Abonnement</h2>
    <p class="text-sm text-slate-500 mt-0.5">Statut, historique et demande de mise à niveau</p>
  </div>
  {#if peutDemanderUpgrade}
    <button onclick={() => modalUpgrade = true} class="btn-primary shrink-0">
      <span class="material-symbols-outlined icon-filled" style="font-size:18px">upgrade</span>
      Passer au plan supérieur
    </button>
  {/if}
</div>

{#if chargement}
  <div class="space-y-4">
    {#each Array(3) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
  </div>
{:else if data}

  <!-- Alerte expiration -->
  {#if data.alert}
    <div class="mb-5 flex items-start gap-3 p-4 rounded-2xl
      {(data.daysUntilExpiry ?? 1) <= 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}">
      <span class="material-symbols-outlined icon-filled shrink-0 mt-0.5
        {(data.daysUntilExpiry ?? 1) <= 0 ? 'text-red-500' : 'text-amber-500'}" style="font-size:20px">warning</span>
      <p class="text-sm font-semibold
        {(data.daysUntilExpiry ?? 1) <= 0 ? 'text-red-800' : 'text-amber-800'}">{data.alert}</p>
    </div>
  {/if}

  <!-- Statut principal -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5">
    <div class="grid grid-cols-2 md:grid-cols-4 stagger gap-4">
      <div class="text-center p-4 rounded-xl bg-slate-50">
        <p class="text-xs text-slate-500 mb-2">Plan actuel</p>
        <span class="text-xs font-bold px-3 py-1 rounded-full capitalize
          {data.currentPlan === 'premium'  ? 'bg-amber-100 text-amber-700' :
           data.currentPlan === 'standard' ? 'bg-blue-100 text-blue-700' :
           'bg-slate-100 text-slate-600'}">
          {data.currentPlan ?? '—'}
        </span>
      </div>
      <div class="text-center p-4 rounded-xl bg-slate-50">
        <p class="text-xs text-slate-500 mb-2">Statut</p>
        <span class="text-xs font-bold px-3 py-1 rounded-full
          {data.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
           data.status === 'expired' ? 'bg-red-100 text-red-700' :
           'bg-slate-100 text-slate-600'}">
          {data.status === 'active' ? 'Actif' : data.status === 'expired' ? 'Expiré' : data.status ?? '—'}
        </span>
      </div>
      <div class="text-center p-4 rounded-xl bg-slate-50">
        <p class="text-xs text-slate-500 mb-1">Expiration</p>
        <p class="text-sm font-bold text-slate-800">{formatDate(data.expiry)}</p>
      </div>
      <div class="text-center p-4 rounded-xl bg-slate-50">
        <p class="text-xs text-slate-500 mb-1">Jours restants</p>
        <p class="text-2xl font-black {(data.daysUntilExpiry ?? 0) <= 7 ? 'text-red-600' : 'text-slate-800'}">
          {data.daysUntilExpiry ?? '—'}
        </p>
      </div>
    </div>
  </div>

  <!-- Demande upgrade en cours -->
  {#if data.pendingUpgradeRequests?.length}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-violet-500 icon-filled" style="font-size:18px">pending</span>
        </div>
        <h3 class="font-bold text-slate-900">Demande en cours</h3>
      </div>
      {#each data.pendingUpgradeRequests as req}
        <div class="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-100">
          <div>
            <p class="text-sm font-semibold text-slate-800">
              Upgrade vers <strong>{req.requested_plan}</strong>
            </p>
            <p class="text-xs text-slate-500 mt-0.5">Soumis le {formatDate(req.created_at)}</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 capitalize">
            {req.status}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Historique factures -->
  {#if data.recentInvoices?.length}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden mb-5">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:18px">receipt</span>
        </div>
        <h3 class="font-bold text-slate-900">Dernières factures</h3>
      </div>
      <div class="divide-y divide-slate-100">
        {#each data.recentInvoices as inv}
          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">
                {inv.amount ? new Intl.NumberFormat('fr-FR').format(inv.amount) + ' FCFA' : '—'}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">{formatDate(inv.created_at)}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full
              {inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
              {inv.status === 'paid' ? 'Payée' : inv.status}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Renouvellements récents -->
  {#if data.recentRenewals?.length}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">autorenew</span>
        </div>
        <h3 class="font-bold text-slate-900">Renouvellements</h3>
      </div>
      <div class="divide-y divide-slate-100">
        {#each data.recentRenewals as r}
          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="text-sm font-semibold text-slate-800">
                {r.duration_months ? `${r.duration_months} mois` : '—'}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">{formatDate(r.created_at)}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full
              {r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
              {r.status}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

{/if}

<!-- Modal : Demande upgrade -->
{#if modalUpgrade}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-900">Passer au plan supérieur</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Plan actuel : <span class="font-semibold capitalize">{data?.currentPlan ?? '—'}</span>
          </p>
        </div>
        <button onclick={() => modalUpgrade = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={soumettreUpgrade} class="p-6 space-y-5">

        <!-- Sélection du plan cible -->
        <div>
          <p class="text-xs font-semibold text-slate-600 mb-2">Choisir le plan cible</p>
          <div class="grid gap-2" style="grid-template-columns: repeat({plansDisponibles.length}, 1fr)">
            {#each plansDisponibles as plan}
              {@const info = PLAN_INFO[plan]}
              <button
                type="button"
                onclick={() => formUpgrade.requestedPlan = plan}
                class="flex flex-col gap-1.5 p-4 rounded-xl border-2 text-left transition-all
                  {formUpgrade.requestedPlan === plan
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'}"
              >
                <span class="text-xs font-bold px-2 py-0.5 rounded-full border {info.color} w-fit">
                  {info.label}
                </span>
                <p class="text-xs text-slate-500">{info.desc}</p>
                <p class="text-sm font-bold text-slate-900">{info.price}</p>
                {#if formUpgrade.requestedPlan === plan}
                  <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:16px">check_circle</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Urgence -->
        <div>
          <label for="urgence" class="block text-xs font-semibold text-slate-600 mb-1.5">Niveau d'urgence</label>
          <select id="urgence" bind:value={formUpgrade.urgencyLevel}
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 bg-white">
            <option value="low">Faible — pas pressé</option>
            <option value="normal">Normal — dans les prochains jours</option>
            <option value="high">Haute — cette semaine</option>
            <option value="critical">Critique — urgent</option>
          </select>
        </div>

        <!-- Justification -->
        <div>
          <label for="just" class="block text-xs font-semibold text-slate-600 mb-1.5">
            Justification
            <span class="text-slate-400 font-normal">(min. 20 caractères)</span>
          </label>
          <textarea id="just" bind:value={formUpgrade.justification} rows="3" required
            placeholder="Ex: Mon volume de commandes dépasse régulièrement ma limite actuelle…"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 resize-none">
          </textarea>
          <p class="text-xs text-right mt-1 {formUpgrade.justification.length < 20 ? 'text-red-400' : 'text-slate-400'}">
            {formUpgrade.justification.length}/500
          </p>
        </div>

        <div class="flex gap-3">
          <button type="button" onclick={() => modalUpgrade = false} class="btn-secondary flex-1 justify-center">
            Annuler
          </button>
          <button type="submit"
            disabled={enregistrement || formUpgrade.justification.length < 20}
            class="btn-primary flex-1 justify-center">
            {#if enregistrement}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">send</span>
            {/if}
            Envoyer la demande
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
