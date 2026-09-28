<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'

  type Onglet = 'demandes' | 'simcards' | 'historique'
  let onglet = $state<Onglet>('demandes')

  // Demandes
  let demandes = $state<any[]>([])
  let metaDem = $state<any>(null)
  let pageDem = $state(1)
  let filtreStatutDem = $state('')

  // SIM Cards
  let simCards = $state<any[]>([])
  let simCardsValidation = $state<any[]>([])
  let filtreReseau = $state('')

  let cabines = $state<any[]>([])
  const nomsCabines = $derived(Object.fromEntries(cabines.map((c) => [c.id, c.name])))

  // Historique
  let historique = $state<any[]>([])
  let metaHist = $state<any>(null)
  let pageHist = $state(1)

  let chargement = $state(true)
  let actionEnCours = $state('')

  // Modals
  let afficherModalSim = $state(false)
  let afficherModalValider = $state(false)
  let afficherModalRejeter = $state(false)
  let demandeSelectionnee = $state<any>(null)

  // Formulaires
  let formSim = $state({ network: 'mtn', cardName: '', phoneNumber: '', assignedCabinId: '' })
  let simCardId = $state('')
  let raisonRejet = $state('')

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  async function chargerDemandes() {
    chargement = true
    try {
      const params: any = { page: pageDem, per_page: 20 }
      if (filtreStatutDem) params.status = filtreStatutDem
      const res = await api.get('/admin/uv/requests', { params })
      demandes = res.data?.data ?? []
      metaDem = res.data?.meta ?? null
    } catch { toast.erreur(translate('toast.error'), translate('common.error_load')) }
    finally { chargement = false }
  }

  async function chargerSimCards() {
    chargement = true
    try {
      const params: any = {}
      if (filtreReseau) params.network = filtreReseau
      const res = await api.get('/admin/uv/sim-cards', { params })
      simCards = res.data?.data ?? []
    } catch { toast.erreur(translate('toast.error'), translate('common.error_load')) }
    finally { chargement = false }
  }

  async function chargerCabines() {
    try {
      const res = await api.get('/cabins', { params: { page: 1, perPage: 200 } })
      cabines = res.data?.data ?? []
    } catch { cabines = [] }
  }

  async function ouvrirValidation(dem: any) {
    demandeSelectionnee = dem
    simCardId = ''
    afficherModalValider = true
    try {
      const params: any = { is_active: 'true' }
      if (dem.network) params.network = dem.network
      const res = await api.get('/admin/uv/sim-cards', { params })
      simCardsValidation = res.data?.data ?? []
    } catch { simCardsValidation = [] }
  }

  async function chargerHistorique() {
    chargement = true
    try {
      const res = await api.get('/admin/uv/history', { params: { page: pageHist, per_page: 20 } })
      historique = res.data?.data ?? []
      metaHist = res.data?.meta ?? null
    } catch { toast.erreur(translate('toast.error'), translate('common.error_load')) }
    finally { chargement = false }
  }

  async function validerDemande() {
    if (!demandeSelectionnee) return
    actionEnCours = demandeSelectionnee.id
    try {
      await api.post(`/admin/uv/requests/${demandeSelectionnee.id}/validate`, {
        simCardId: simCardId || undefined,
      })
      toast.succes(translate('admin.uv.recharge_validated'))
      afficherModalValider = false
      simCardId = ''
      await chargerDemandes()
    } catch (e: any) {
      const erreurs = e.response?.data?.errors
      toast.erreur(translate('toast.error'), Array.isArray(erreurs) && erreurs.length ? erreurs.map((x: any) => x.message).join(' • ') : (e.response?.data?.message ?? translate('common.error_save')))
    } finally { actionEnCours = '' }
  }

  async function rejeterDemande() {
    if (!demandeSelectionnee) return
    actionEnCours = demandeSelectionnee.id + '_r'
    try {
      await api.post(`/admin/uv/requests/${demandeSelectionnee.id}/reject`, { reason: raisonRejet })
      toast.succes(translate('admin.uv.request_rejected'))
      afficherModalRejeter = false
      raisonRejet = ''
      await chargerDemandes()
    } catch (e: any) {
      const erreurs = e.response?.data?.errors
      toast.erreur(translate('toast.error'), Array.isArray(erreurs) && erreurs.length ? erreurs.map((x: any) => x.message).join(' • ') : (e.response?.data?.message ?? translate('common.error_save')))
    } finally { actionEnCours = '' }
  }

  async function creerSimCard() {
    actionEnCours = 'sim'
    try {
      const payload: any = { ...formSim }
      if (!payload.assignedCabinId) delete payload.assignedCabinId
      payload.phoneNumber = payload.phoneNumber.replace(/[\s\-]/g, '')
      await api.post('/admin/uv/sim-cards', payload)
      toast.succes(translate('admin.uv.sim_created'))
      afficherModalSim = false
      formSim = { network: 'mtn', cardName: '', phoneNumber: '', assignedCabinId: '' }
      await chargerSimCards()
    } catch (e: any) {
      const erreurs = e.response?.data?.errors
      toast.erreur(translate('toast.error'), Array.isArray(erreurs) && erreurs.length ? erreurs.map((x: any) => x.message).join(' • ') : (e.response?.data?.message ?? translate('common.error_save')))
    } finally { actionEnCours = '' }
  }

  $effect(() => {
    const o = onglet
    untrack(() => {
      if (o === 'demandes') chargerDemandes()
      else if (o === 'simcards') chargerSimCards()
      else chargerHistorique()
    })
  })

  onMount(chargerCabines)

  const libellesType: Record<string, string> = {
    recharge: 'Recharge',
    deduction: 'Déduction',
    adjustment: 'Ajustement',
  }

  const couleurType: Record<string, string> = {
    recharge: 'text-emerald-600 bg-emerald-50',
    deduction: 'text-red-600 bg-red-50',
    adjustment: 'text-blue-600 bg-blue-50',
  }
</script>

<svelte:head><title>{$t('admin.uv.title')} — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('admin.uv.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">{$t('admin.uv.subtitle')}</p>
  </div>
  {#if onglet === 'simcards'}
    <button onclick={() => afficherModalSim = true} class="btn-primary">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
      {$t('admin.uv.new_sim')}
    </button>
  {/if}
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['demandes', 'inbox', 'admin.uv.tab_requests'], ['simcards', 'sim_card', 'admin.uv.tab_simcards'], ['historique', 'history', 'admin.uv.tab_history']] as [val, icone, labelKey]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {$t(labelKey)}
    </button>
  {/each}
</div>

<!-- ── Demandes ── -->
{#if onglet === 'demandes'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <select bind:value={filtreStatutDem} onchange={() => { pageDem = 1; chargerDemandes() }} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">{$t('common.all')}</option>
      <option value="pending">{$t('status.pending')}</option>
      <option value="validated">{$t('admin.uv.status_validated')}</option>
      <option value="rejected">{$t('status.rejected')}</option>
      <option value="cancelled">{$t('status.cancelled')}</option>
    </select>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if demandes.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">bolt</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('admin.uv.no_requests')}</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">{$t('admin.cabins.col_cabin')}</div>
        <div class="col-span-2">{$t('admin.uv.amount_requested')}</div>
        <div class="col-span-2">{$t('common.status')}</div>
        <div class="col-span-3">{$t('common.date')}</div>
        <div class="col-span-2">{$t('common.actions')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each demandes as dem}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="lg:col-span-3">
              <p class="text-sm font-semibold text-slate-800">{dem.cabinName ?? nomsCabines[dem.cabinId] ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-sm font-bold text-slate-900">{dem.amountRequested ?? '—'} UV</p>
              {#if dem.paymentAmount}
                <p class="text-xs text-slate-400 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full inline-block align-middle mr-1 {dem.paymentMethod === 'mtn' ? 'bg-amber-400' : 'bg-orange-500'}"></span>
                  {Number(dem.paymentAmount).toLocaleString('fr-CM')} XAF
                </p>
              {/if}
            </div>
            <div class="lg:col-span-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full border
                {dem.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                 dem.status === 'validated' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                 dem.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                 'bg-red-100 text-red-700 border-red-200'}">
                {dem.status === 'pending' ? $t('status.pending') : dem.status === 'validated' ? $t('admin.uv.status_validated') : dem.status === 'cancelled' ? $t('status.cancelled') : $t('status.rejected')}
              </span>
            </div>
            <div class="lg:col-span-3">
              <p class="text-xs text-slate-500">{formaterDate(dem.createdAt)}</p>
              {#if dem.status === 'rejected' && dem.rejectionReason}
                <p class="text-xs text-red-500 mt-0.5">{dem.rejectionReason}</p>
              {/if}
            </div>
            <div class="lg:col-span-2 flex gap-1.5">
              {#if dem.status === 'pending'}
                <button onclick={() => ouvrirValidation(dem)}
                  class="text-xs px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 flex items-center gap-1">
                  <span class="material-symbols-outlined icon-filled" style="font-size:13px">check</span>
                  {$t('admin.uv.validate')}
                </button>
                <button onclick={() => { demandeSelectionnee = dem; afficherModalRejeter = true }}
                  class="text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                  {$t('admin.uv.reject')}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      {#if metaDem && metaDem.lastPage > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">{$t('pagination.page')} {metaDem.currentPage} {$t('pagination.of')} {metaDem.lastPage}</p>
          <div class="flex gap-2">
            <button onclick={() => { pageDem--; chargerDemandes() }} disabled={pageDem <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← {$t('button.previous')}</button>
            <button onclick={() => { pageDem++; chargerDemandes() }} disabled={pageDem >= metaDem.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">{$t('button.next')} →</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>

<!-- ── SIM Cards ── -->
{:else if onglet === 'simcards'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <select bind:value={filtreReseau} onchange={chargerSimCards} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">{$t('admin.orders.all_networks')}</option>
      <option value="mtn">MTN</option>
      <option value="orange">Orange</option>
    </select>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if simCards.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">sim_card</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('admin.uv.no_sim_cards')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each simCards as sim}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style="background:{sim.network === 'mtn' ? '#fef3c7' : '#fff7ed'}">
              <span class="w-3 h-3 rounded-full" style="background:{sim.network === 'mtn' ? '#fbbf24' : '#f97316'}"></span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{sim.cardName ?? '—'}</p>
              <p class="text-xs font-mono text-slate-500">{sim.phoneNumber ?? '—'} · {sim.network === 'mtn' ? 'MTN' : sim.network === 'orange' ? 'Orange' : (sim.network ?? '—')}</p>
              {#if sim.assignedCabinId}
                <p class="text-xs text-slate-400">{$t('admin.cabins.col_cabin')} : {nomsCabines[sim.assignedCabinId] ?? '—'}</p>
              {/if}
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-slate-900">{sim.currentBalance ?? 0} UV</p>
              <p class="text-xs {sim.isActive ? 'text-emerald-600' : 'text-slate-400'} font-medium">
                {sim.isActive ? $t('status.active') : $t('status.inactive')}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ── Historique ── -->
{:else}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(8) as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if historique.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">{$t('admin.uv.no_history')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each historique as tx}
          <div class="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 {couleurType[tx.transactionType] ?? 'bg-slate-100 text-slate-600'}">
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">
                {tx.transactionType === 'recharge' ? 'add_circle' : tx.transactionType === 'deduction' ? 'remove_circle' : 'tune'}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{tx.cabinName ?? nomsCabines[tx.cabinId] ?? '—'}</p>
              <p class="text-xs text-slate-500">{tx.description ?? libellesType[tx.transactionType] ?? '—'}</p>
              <p class="text-xs text-slate-400">{formaterDate(tx.createdAt)}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold {tx.transactionType === 'recharge' ? 'text-emerald-600' : 'text-red-600'}">
                {tx.transactionType === 'recharge' ? '+' : '-'}{tx.amount ?? 0} UV
              </p>
              {#if tx.balanceBefore !== null && tx.balanceBefore !== undefined && tx.balanceAfter !== null && tx.balanceAfter !== undefined}
                <p class="text-xs text-slate-400">{tx.balanceBefore} → {tx.balanceAfter} UV</p>
              {:else if tx.balanceAfter !== null && tx.balanceAfter !== undefined}
                <p class="text-xs text-slate-400">{tx.balanceAfter} UV {$t('admin.uv.remaining')}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      {#if metaHist && metaHist.lastPage > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">{$t('pagination.page')} {metaHist.currentPage} {$t('pagination.of')} {metaHist.lastPage}</p>
          <div class="flex gap-2">
            <button onclick={() => { pageHist--; chargerHistorique() }} disabled={pageHist <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← {$t('button.previous')}</button>
            <button onclick={() => { pageHist++; chargerHistorique() }} disabled={pageHist >= metaHist.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">{$t('button.next')} →</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<!-- Modal : Valider demande UV -->
{#if afficherModalValider && demandeSelectionnee}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.uv.modal_validate_title')}</h3>
        <button onclick={() => afficherModalValider = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <!-- Résumé demande -->
        <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p class="text-xs text-emerald-700 font-medium">{$t('admin.cabins.col_cabin')} : {demandeSelectionnee.cabinName ?? nomsCabines[demandeSelectionnee.cabinId] ?? '—'}</p>
          <p class="text-2xl font-black text-slate-900 mt-1">{demandeSelectionnee.amountRequested} UV</p>
        </div>

        <!-- Preuve de paiement -->
        {#if demandeSelectionnee.paymentAmount}
          <div class="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div class="px-4 py-2.5 bg-slate-50">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">Preuve de paiement</p>
            </div>
            <div class="grid grid-cols-2 gap-px bg-slate-100">
              <div class="px-4 py-3 bg-white">
                <p class="text-xs text-slate-400 mb-0.5">Montant payé</p>
                <p class="text-sm font-bold text-slate-900">{Number(demandeSelectionnee.paymentAmount).toLocaleString('fr-CM')} XAF</p>
              </div>
              <div class="px-4 py-3 bg-white">
                <p class="text-xs text-slate-400 mb-0.5">Opérateur</p>
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full {demandeSelectionnee.paymentMethod === 'mtn' ? 'bg-amber-400' : 'bg-orange-500'}"></span>
                  <p class="text-sm font-bold text-slate-900">{demandeSelectionnee.paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'}</p>
                </div>
              </div>
              {#if demandeSelectionnee.paymentPhone}
                <div class="px-4 py-3 bg-white col-span-2">
                  <p class="text-xs text-slate-400 mb-0.5">N° Mobile Money de la cabine</p>
                  <p class="text-sm font-bold font-mono text-slate-900">{demandeSelectionnee.paymentPhone}</p>
                </div>
              {/if}
            </div>
            {#if demandeSelectionnee.notes}
              <div class="px-4 py-3 bg-white">
                <p class="text-xs text-slate-400 mb-0.5">Note</p>
                <p class="text-sm text-slate-700">{demandeSelectionnee.notes}</p>
              </div>
            {/if}
            {#if demandeSelectionnee.paymentReference}
              <div class="px-4 py-3 bg-white">
                <p class="text-xs text-slate-400 mb-0.5">Référence</p>
                <p class="text-sm font-mono text-slate-700">{demandeSelectionnee.paymentReference}</p>
              </div>
            {/if}
          </div>
        {/if}

        <div>
          <label for="sim-card-id" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.uv.sim_used_optional')}</label>
          <select id="sim-card-id" bind:value={simCardId} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">{$t('admin.uv.no_specific_sim')}</option>
            {#each simCardsValidation as sim}
              <option value={sim.id}>{sim.cardName} — {sim.phoneNumber} ({sim.currentBalance ?? 0} UV)</option>
            {/each}
          </select>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalValider = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={validerDemande} disabled={actionEnCours === demandeSelectionnee.id} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === demandeSelectionnee.id}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>{$t('admin.uv.validate')}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Rejeter demande UV -->
{#if afficherModalRejeter && demandeSelectionnee}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.uv.modal_reject_title')}</h3>
        <button onclick={() => afficherModalRejeter = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="raison-rejet-uv" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.uv.rejection_reason')} *</label>
          <textarea id="raison-rejet-uv" bind:value={raisonRejet} rows="3" placeholder="{$t('admin.uv.rejection_placeholder')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalRejeter = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={rejeterDemande} disabled={!raisonRejet || actionEnCours === demandeSelectionnee.id + '_r'}
            class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === demandeSelectionnee.id + '_r'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}{$t('admin.uv.reject')}{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Créer SIM Card -->
{#if afficherModalSim}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.uv.new_sim')}</h3>
        <button onclick={() => afficherModalSim = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="sim-network" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.network')} *</label>
            <select id="sim-network" bind:value={formSim.network} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="mtn">MTN</option>
              <option value="orange">Orange</option>
            </select>
          </div>
          <div>
            <label for="sim-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.phone')} *</label>
            <input id="sim-phone" type="tel" bind:value={formSim.phoneNumber} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div>
          <label for="sim-name" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.uv.card_name')} *</label>
          <input id="sim-name" type="text" bind:value={formSim.cardName} placeholder="Ex: SIM MTN Principale" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="sim-cabin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.uv.assigned_cabin_optional')}</label>
          <select id="sim-cabin" bind:value={formSim.assignedCabinId} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">—</option>
            {#each cabines as c}<option value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ''}</option>{/each}
          </select>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalSim = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={creerSimCard} disabled={!formSim.cardName || !formSim.phoneNumber || actionEnCours === 'sim'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'sim'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>{$t('common.create')}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

