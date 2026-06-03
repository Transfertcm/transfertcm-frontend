<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let reclamations = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)
  let filtreStatut = $state('')
  let selected = $state<any>(null)
  let afficherDetail = $state(false)
  let actionEnCours = $state('')

  let resolutionNotes = $state('')
  let resolutionType = $state('refund')
  let raisonRejet = $state('')

  const statuts = [
    { val: '', label: 'Tous' },
    { val: 'pending', label: 'En attente' },
    { val: 'in_verification', label: 'En vérification' },
    { val: 'resolved', label: 'Résolues' },
    { val: 'rejected', label: 'Rejetées' },
  ]

  const configStatut: Record<string, { label: string; classe: string }> = {
    pending:         { label: 'En attente',      classe: 'bg-amber-100 text-amber-700 border-amber-200' },
    in_verification: { label: 'En vérification', classe: 'bg-blue-100 text-blue-700 border-blue-200' },
    resolved:        { label: 'Résolue',          classe: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    rejected:        { label: 'Rejetée',          classe: 'bg-red-100 text-red-700 border-red-200' },
  }

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function charger() {
    chargement = true
    try {
      const params: any = { page, per_page: 20 }
      if (filtreStatut) params.status = filtreStatut
      const res = await api.get('/admin/complaints', { params })
      const d = res.data?.data
      reclamations = d?.data ?? d ?? []
      meta = d?.meta ?? null
    } catch {
      toast.erreur('Erreur', 'Impossible de charger les réclamations')
    } finally {
      chargement = false
    }
  }

  async function ouvrirDetail(id: string) {
    try {
      const res = await api.get(`/admin/complaints/${id}`)
      selected = res.data?.data ?? res.data
      afficherDetail = true
    } catch {
      toast.erreur('Erreur', 'Impossible de charger la réclamation')
    }
  }

  async function resoudre() {
    if (!selected) return
    actionEnCours = 'resoudre'
    try {
      await api.patch(`/admin/complaints/${selected.id}/resolve`, {
        resolutionNotes,
        resolutionType,
      })
      toast.succes('Réclamation résolue')
      afficherDetail = false
      resolutionNotes = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de résoudre')
    } finally {
      actionEnCours = ''
    }
  }

  async function rejeter() {
    if (!selected) return
    actionEnCours = 'rejeter'
    try {
      await api.patch(`/admin/complaints/${selected.id}/reject`, { reason: raisonRejet })
      toast.succes('Réclamation rejetée')
      afficherDetail = false
      raisonRejet = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de rejeter')
    } finally {
      actionEnCours = ''
    }
  }

  async function archiver() {
    if (!selected) return
    actionEnCours = 'archiver'
    try {
      await api.patch(`/admin/complaints/${selected.id}/archive`)
      toast.succes('Réclamation archivée')
      afficherDetail = false
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'archiver')
    } finally {
      actionEnCours = ''
    }
  }

  $effect(() => { filtreStatut; page; charger() })
  onMount(charger)
</script>

<svelte:head><title>Réclamations — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Réclamations</h2>
    <p class="text-sm text-slate-500 mt-0.5">
      {meta ? `${meta.total ?? 0} réclamations` : 'Gestion des réclamations clients'}
    </p>
  </div>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="flex gap-2 flex-wrap">
    {#each statuts as s}
      <button
        onclick={() => { filtreStatut = s.val; page = 1 }}
        class="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
          {filtreStatut === s.val
            ? 'bg-orange-500 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
      >
        {s.label}
      </button>
    {/each}
  </div>
</div>

<!-- Liste -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-2">
      {#each Array(8) as _}
        <div class="skeleton h-16 rounded-xl"></div>
      {/each}
    </div>
  {:else if reclamations.length === 0}
    <div class="py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">report_problem</span>
      </div>
      <p class="text-slate-600 font-semibold">Aucune réclamation</p>
      <p class="text-slate-400 text-sm mt-1">
        {filtreStatut ? 'Aucune réclamation avec ce statut' : 'Aucune réclamation pour le moment'}
      </p>
    </div>
  {:else}
    <!-- En-tête tableau desktop -->
    <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-3">Client</div>
      <div class="col-span-3">Commande</div>
      <div class="col-span-2">Statut</div>
      <div class="col-span-2">Date</div>
      <div class="col-span-2">Actions</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each reclamations as rec}
        {@const cfg = configStatut[rec.status] ?? configStatut.pending}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-4 hover:bg-slate-50 transition-all">
          <!-- Client -->
          <div class="lg:col-span-3 flex items-center gap-2 min-w-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style="background:linear-gradient(135deg,#f97316,#fbbf24)">
              {String(rec.customerPhone ?? rec.customer_phone ?? '?').slice(-2)}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 font-mono truncate">
                {rec.customerPhone ?? rec.customer_phone ?? '—'}
              </p>
              {#if rec.subject}
                <p class="text-xs text-slate-400 truncate">{rec.subject}</p>
              {/if}
            </div>
          </div>
          <!-- Commande -->
          <div class="lg:col-span-3">
            {#if rec.orderId ?? rec.order_id}
              <a href="/admin/commandes/{rec.orderId ?? rec.order_id}"
                class="text-xs font-mono text-orange-600 hover:text-orange-700 font-semibold">
                #{String(rec.orderId ?? rec.order_id ?? '').slice(-8)}
              </a>
            {:else}
              <span class="text-xs text-slate-400">—</span>
            {/if}
          </div>
          <!-- Statut -->
          <div class="lg:col-span-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe}">
              {cfg.label}
            </span>
          </div>
          <!-- Date -->
          <div class="lg:col-span-2">
            <p class="text-xs text-slate-500">{formaterDate(rec.createdAt ?? rec.created_at)}</p>
          </div>
          <!-- Actions -->
          <div class="lg:col-span-2 flex gap-1.5">
            <button
              onclick={() => ouvrirDetail(rec.id)}
              class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 flex items-center gap-1"
            >
              <span class="material-symbols-outlined" style="font-size:13px">open_in_new</span>
              Voir
            </button>
            {#if rec.status === 'pending' || rec.status === 'in_verification'}
              <button
                onclick={() => ouvrirDetail(rec.id)}
                class="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100"
              >
                Traiter
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">Page {meta.currentPage} sur {meta.lastPage}</p>
        <div class="flex gap-2">
          <button onclick={() => page--} disabled={page <= 1}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            ← Précédent
          </button>
          <button onclick={() => page++} disabled={page >= meta.lastPage}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Suivant →
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal : Détail réclamation -->
{#if afficherDetail && selected}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-slate-900">Réclamation</h3>
        <button onclick={() => afficherDetail = false}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-5">

        <!-- Infos -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-xs text-slate-400 mb-0.5">Client</p>
            <p class="font-semibold text-slate-800 font-mono">{selected.customerPhone ?? selected.customer_phone ?? '—'}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">Statut</p>
            {#if selected}
              {@const cfg = configStatut[selected.status] ?? configStatut.pending}
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe}">{cfg.label}</span>
            {/if}
          </div>
          {#if selected.subject}
            <div class="col-span-2">
              <p class="text-xs text-slate-400 mb-0.5">Sujet</p>
              <p class="font-semibold text-slate-800">{selected.subject}</p>
            </div>
          {/if}
          {#if selected.description}
            <div class="col-span-2">
              <p class="text-xs text-slate-400 mb-0.5">Description</p>
              <p class="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
            </div>
          {/if}
          <div>
            <p class="text-xs text-slate-400 mb-0.5">Date</p>
            <p class="text-sm text-slate-700">{formaterDate(selected.createdAt ?? selected.created_at)}</p>
          </div>
          {#if selected.orderId ?? selected.order_id}
            <div>
              <p class="text-xs text-slate-400 mb-0.5">Commande liée</p>
              <a href="/admin/commandes/{selected.orderId ?? selected.order_id}"
                class="text-sm font-mono text-orange-600 hover:text-orange-700 font-semibold">
                #{String(selected.orderId ?? selected.order_id ?? '').slice(-8)}
              </a>
            </div>
          {/if}
        </div>

        <!-- Actions si en attente -->
        {#if selected.status === 'pending' || selected.status === 'in_verification'}
          <div class="border-t border-slate-100 pt-5 space-y-4">

            <!-- Résoudre -->
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-3">
              <p class="text-xs font-bold text-emerald-700 uppercase tracking-wide">Résoudre</p>
              <div>
                <label for="res-type" class="block text-xs font-semibold text-slate-600 mb-1.5">Type de résolution</label>
                <select id="res-type" bind:value={resolutionType} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="refund">Remboursement</option>
                  <option value="retry">Nouvelle tentative</option>
                  <option value="explanation">Explication fournie</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label for="res-notes" class="block text-xs font-semibold text-slate-600 mb-1.5">Notes de résolution</label>
                <textarea id="res-notes" bind:value={resolutionNotes} rows="2"
                  placeholder="Décrivez la résolution..."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
              </div>
              <button onclick={resoudre} disabled={actionEnCours === 'resoudre'}
                class="w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {#if actionEnCours === 'resoudre'}
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>
                  Marquer comme résolue
                {/if}
              </button>
            </div>

            <!-- Rejeter -->
            <div class="p-4 rounded-xl bg-red-50 border border-red-100 space-y-3">
              <p class="text-xs font-bold text-red-700 uppercase tracking-wide">Rejeter</p>
              <div>
                <label for="rej-raison" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison du rejet *</label>
                <textarea id="rej-raison" bind:value={raisonRejet} rows="2"
                  placeholder="Expliquez pourquoi la réclamation est rejetée..."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
              </div>
              <button onclick={rejeter} disabled={!raisonRejet || actionEnCours === 'rejeter'}
                class="w-full px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {#if actionEnCours === 'rejeter'}
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size:16px">cancel</span>
                  Rejeter
                {/if}
              </button>
            </div>
          </div>
        {/if}

        <!-- Archiver si résolue ou rejetée -->
        {#if selected.status === 'resolved' || selected.status === 'rejected'}
          <div class="border-t border-slate-100 pt-4">
            <button onclick={archiver} disabled={actionEnCours === 'archiver'}
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2">
              {#if actionEnCours === 'archiver'}
                <span class="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
              {:else}
                <span class="material-symbols-outlined icon-filled" style="font-size:16px">archive</span>
                Archiver
              {/if}
            </button>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}

