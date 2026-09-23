<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  type Onglet = 'urgents' | 'historique' | 'stats'
  let onglet = $state<Onglet>('urgents')

  let urgents = $state<any[]>([])
  let logs = $state<any[]>([])
  let metaLogs = $state<any>(null)
  let stats = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)
  let actionEnCours = $state('')

  // Formulaire enregistrer un appel
  let afficherFormAppel = $state(false)
  let formAppel = $state({ phoneNumber: '', status: 'called', notes: '', callDurationSeconds: '' })
  let envoiAppel = $state(false)

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formaterDuree(s: number | null) {
    if (!s) return '—'
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}min ${s % 60}s`
  }

  async function chargerUrgents() {
    chargement = true
    try {
      const res = await api.get('/admin/call-center/urgent-requests')
      const d = res.data?.data
      urgents = d?.data ?? d ?? []
    } catch { toast.erreur('Erreur', 'Impossible de charger les demandes urgentes') }
    finally { chargement = false }
  }

  async function chargerLogs() {
    chargement = true
    try {
      const res = await api.get('/admin/call-center/logs', { params: { page, per_page: 20 } })
      const d = res.data?.data
      logs = d?.data ?? d ?? []
      metaLogs = d?.meta ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger l\'historique') }
    finally { chargement = false }
  }

  async function chargerStats() {
    chargement = true
    try {
      const res = await api.get('/admin/call-center/stats')
      stats = res.data?.data ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger les statistiques') }
    finally { chargement = false }
  }

  async function traiterUrgent(id: string) {
    actionEnCours = id
    try {
      await api.patch(`/admin/call-center/urgent-requests/${id}/handle`)
      toast.succes('Demande traitée')
      urgents = urgents.map(u => u.id === id ? { ...u, status: 'handled' } : u)
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de traiter')
    } finally { actionEnCours = '' }
  }

  async function enregistrerAppel(e: Event) {
    e.preventDefault()
    envoiAppel = true
    try {
      await api.post('/admin/call-center/logs', {
        ...formAppel,
        callDurationSeconds: formAppel.callDurationSeconds ? Number(formAppel.callDurationSeconds) : null,
      })
      toast.succes('Appel enregistré')
      afficherFormAppel = false
      formAppel = { phoneNumber: '', status: 'called', notes: '', callDurationSeconds: '' }
      if (onglet === 'historique') chargerLogs()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'enregistrer')
    } finally { envoiAppel = false }
  }

  $effect(() => {
    if (onglet === 'urgents') chargerUrgents()
    else if (onglet === 'historique') { page; chargerLogs() }
    else chargerStats()
  })

  onMount(chargerUrgents)

  const configStatutUrgent: Record<string, { label: string; classe: string }> = {
    pending: { label: 'En attente', classe: 'bg-red-100 text-red-700 border-red-200' },
    handled: { label: 'Traité',     classe: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  }

  const configStatutLog: Record<string, { label: string; classe: string }> = {
    called:     { label: 'Appelé',        classe: 'bg-blue-100 text-blue-700 border-blue-200' },
    no_answer:  { label: 'Pas de réponse', classe: 'bg-amber-100 text-amber-700 border-amber-200' },
    resolved:   { label: 'Résolu',        classe: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    callback:   { label: 'Rappel prévu',  classe: 'bg-purple-100 text-purple-700 border-purple-200' },
  }
</script>

<svelte:head><title>Call Center — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Call Center</h2>
    <p class="text-sm text-slate-500 mt-0.5">Suivi des appels et demandes urgentes clients</p>
  </div>
  <button
    onclick={() => afficherFormAppel = true}
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
    style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
  >
    <span class="material-symbols-outlined icon-filled" style="font-size:16px">add_call</span>
    Enregistrer un appel
  </button>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['urgents', 'emergency', 'Demandes urgentes'], ['historique', 'history', 'Historique'], ['stats', 'bar_chart', 'Statistiques']] as [val, icone, label]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:15px">{icone}</span>
      {label}
      {#if val === 'urgents' && urgents.filter(u => u.status === 'pending').length > 0}
        <span class="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {urgents.filter(u => u.status === 'pending').length}
        </span>
      {/if}
    </button>
  {/each}
</div>

<!-- Demandes urgentes -->
{#if onglet === 'urgents'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(5) as _}<div class="skeleton h-16 rounded-xl"></div>{/each}</div>
    {:else if urgents.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-emerald-400 icon-filled" style="font-size:28px">check_circle</span>
        </div>
        <p class="text-slate-600 font-semibold">Aucune demande urgente</p>
        <p class="text-slate-400 text-sm mt-1">Toutes les demandes ont été traitées</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">Client</div>
        <div class="col-span-3">Motif</div>
        <div class="col-span-2">Statut</div>
        <div class="col-span-2">Date</div>
        <div class="col-span-2">Action</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each urgents as u}
          {@const cfg = configStatutUrgent[u.status] ?? configStatutUrgent.pending}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-4 hover:bg-slate-50">
            <div class="lg:col-span-3 flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:16px">person</span>
              </div>
              <p class="text-sm font-semibold text-slate-800 font-mono">{u.phone ?? u.member_phone ?? '—'}</p>
            </div>
            <div class="lg:col-span-3">
              <p class="text-xs text-slate-600">{u.reason ?? u.message ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe}">{cfg.label}</span>
            </div>
            <div class="lg:col-span-2">
              <p class="text-xs text-slate-500">{formaterDate(u.created_at)}</p>
            </div>
            <div class="lg:col-span-2">
              {#if u.status === 'pending'}
                <button
                  onclick={() => traiterUrgent(u.id)}
                  disabled={actionEnCours === u.id}
                  class="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {#if actionEnCours === u.id}
                    <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {:else}
                    <span class="material-symbols-outlined icon-filled" style="font-size:13px">check</span>
                  {/if}
                  Traiter
                </button>
              {:else}
                <span class="text-xs text-slate-400">Traité par {u.handled_by ?? '—'}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Historique -->
{#if onglet === 'historique'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(8) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if logs.length === 0}
      <div class="py-20 text-center">
        <span class="material-symbols-outlined text-slate-300 block mb-3" style="font-size:40px">call_log</span>
        <p class="text-slate-500 font-semibold">Aucun appel enregistré</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">Numéro appelé</div>
        <div class="col-span-2">Statut</div>
        <div class="col-span-2">Durée</div>
        <div class="col-span-3">Notes</div>
        <div class="col-span-2">Agent / Date</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each logs as log}
          {@const cfg = configStatutLog[log.status] ?? configStatutLog.called}
          <div class="flex flex-col gap-1.5 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-4 hover:bg-slate-50">
            <div class="lg:col-span-3">
              <p class="text-sm font-semibold text-slate-800 font-mono">{log.phone_number ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full border {cfg.classe}">{cfg.label}</span>
            </div>
            <div class="lg:col-span-2">
              <p class="text-sm text-slate-600">{formaterDuree(log.call_duration_seconds)}</p>
            </div>
            <div class="lg:col-span-3">
              <p class="text-xs text-slate-500 line-clamp-2">{log.notes ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-xs font-semibold text-slate-700">{log.caller_email ?? '—'}</p>
              <p class="text-xs text-slate-400">{formaterDate(log.created_at)}</p>
            </div>
          </div>
        {/each}
      </div>
      {#if metaLogs && metaLogs.lastPage > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">Page {metaLogs.currentPage} sur {metaLogs.lastPage}</p>
          <div class="flex gap-2">
            <button onclick={() => page--} disabled={page <= 1}
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Précédent
            </button>
            <button onclick={() => page++} disabled={page >= metaLogs.lastPage}
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Suivant →
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<!-- Statistiques -->
{#if onglet === 'stats'}
  {#if chargement}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {#each Array(3) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
    </div>
  {:else if stats}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Total appels (semaine)</p>
        <p class="font-black text-3xl text-slate-900">{stats.total?.total ?? 0}</p>
        <p class="text-xs text-slate-500 mt-1">Durée moy. {formaterDuree(Math.round(stats.total?.avg_duration ?? 0))}</p>
      </div>
      {#each (stats.byStatus ?? []) as s}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{configStatutLog[s.status]?.label ?? s.status}</p>
          <p class="font-black text-3xl text-slate-900">{s.count}</p>
        </div>
      {/each}
    </div>

    <!-- Par agent -->
    {#if stats.byAgent?.length > 0}
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
        <h3 class="font-bold text-slate-900 mb-4">Performance par agent</h3>
        <div class="space-y-3">
          {#each stats.byAgent as agent}
            <div class="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
                  {(agent.caller_email ?? '?')[0].toUpperCase()}
                </div>
                <p class="text-sm font-semibold text-slate-800">{agent.caller_email}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-slate-900">{agent.count} appels</p>
                <p class="text-xs text-slate-400">Moy. {formaterDuree(Math.round(agent.avg_duration ?? 0))}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow py-20 text-center">
      <p class="text-slate-500">Aucune statistique disponible</p>
    </div>
  {/if}
{/if}

<!-- Modal : Enregistrer un appel -->
{#if afficherFormAppel}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Enregistrer un appel</h3>
        <button onclick={() => afficherFormAppel = false}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={enregistrerAppel} class="p-6 space-y-4">
        <div>
          <label for="phone-appel" class="block text-xs font-semibold text-slate-600 mb-1.5">Numéro appelé *</label>
          <input id="phone-appel" type="tel" bind:value={formAppel.phoneNumber} required
            placeholder="+237 6XX XXX XXX"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="statut-appel" class="block text-xs font-semibold text-slate-600 mb-1.5">Résultat</label>
          <select id="statut-appel" bind:value={formAppel.status} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="called">Appelé</option>
            <option value="no_answer">Pas de réponse</option>
            <option value="resolved">Résolu</option>
            <option value="callback">Rappel prévu</option>
          </select>
        </div>
        <div>
          <label for="duree-appel" class="block text-xs font-semibold text-slate-600 mb-1.5">Durée (secondes)</label>
          <input id="duree-appel" type="number" bind:value={formAppel.callDurationSeconds}
            placeholder="Ex: 120"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="notes-appel" class="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
          <textarea id="notes-appel" bind:value={formAppel.notes} rows="3"
            placeholder="Résumé de l'appel..."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick={() => afficherFormAppel = false}
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
            Annuler
          </button>
          <button type="submit" disabled={envoiAppel || !formAppel.phoneNumber}
            class="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
            {#if envoiAppel}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>
            {/if}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
