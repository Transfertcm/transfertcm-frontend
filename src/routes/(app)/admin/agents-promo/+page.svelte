<script lang="ts">
  import { untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let agents = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)
  let filtreStatut = $state('')
  let filtreVille = $state('')
  let recherche = $state('')

  // Modals
  let afficherModalCreer = $state(false)
  let afficherModalDetail = $state(false)
  let agentSelectionne = $state<any>(null)
  let statsAgent = $state<any>(null)
  let statsChargement = $state(false)
  let statsErreur = $state('')
  let creation = $state(false)

  let form = $state({
    firstName: '', lastName: '', phone: '',
    city: '', neighborhood: '', idNumber: '', idType: 'CNI',
  })
  let erreurs = $state<Record<string, string>>({})

  const libellesStatut: Record<string, string> = { active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu' }

  const agentsFiltres = $derived.by(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return agents
    return agents.filter((a) =>
      [a.fullName, a.firstName, a.lastName, a.phone, a.referralCode, a.city, a.neighborhood]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    )
  })

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' M XAF'
    if (num >= 1_000) return (num / 1_000).toFixed(0) + ' K XAF'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  async function charger() {
    chargement = true
    try {
      const params: any = { page, per_page: 20 }
      if (filtreStatut) params.status = filtreStatut
      if (filtreVille) params.city = filtreVille
      const res = await api.get('/admin/promo-agents', { params })
      agents = res.data?.data ?? []
      meta = res.data?.meta ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger les agents') }
    finally { chargement = false }
  }

  async function voirDetail(agent: any) {
    agentSelectionne = agent
    statsAgent = null
    statsErreur = ''
    statsChargement = true
    afficherModalDetail = true
    try {
      const res = await api.get(`/admin/promo-agents/${agent.id}`)
      agentSelectionne = res.data?.data ?? agent
    } catch {}
    try {
      const statsRes = await api.get(`/admin/promo-agents/${agent.id}/stats`)
      statsAgent = statsRes.data?.data ?? null
    } catch (e: any) {
      statsErreur = e.response?.data?.message ?? 'Impossible de charger les statistiques'
    } finally { statsChargement = false }
  }

  async function creerAgent() {
    erreurs = {}
    creation = true
    try {
      await api.post('/admin/promo-agents', form)
      toast.succes('Agent créé', `Code de parrainage généré automatiquement`)
      afficherModalCreer = false
      form = { firstName: '', lastName: '', phone: '', city: '', neighborhood: '', idNumber: '', idType: 'CNI' }
      await charger()
    } catch (e: any) {
      if (e.response?.status === 422) {
        e.response.data?.errors?.forEach((err: any) => { erreurs[err.field] = err.message })
      } else {
        toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de créer')
      }
    } finally { creation = false }
  }

  let timer: ReturnType<typeof setTimeout>
  function surFiltreVille() {
    clearTimeout(timer)
    timer = setTimeout(() => { page = 1; charger() }, 400)
  }

  $effect(() => { filtreStatut; page; untrack(charger) })
</script>

<svelte:head><title>Agents promo — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Agents promoteurs</h2>
    <p class="text-sm text-slate-500 mt-0.5">{meta ? `${meta.total ?? 0} agent(s)` : 'Gestion des agents de terrain'}</p>
  </div>
  <button onclick={() => afficherModalCreer = true} class="btn-primary">
    <span class="material-symbols-outlined icon-filled" style="font-size:18px">person_add</span>
    Nouvel agent
  </button>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px">search</span>
      <input type="text" placeholder="Rechercher (nom, téléphone, code)..." bind:value={recherche}
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
    </div>
    <select bind:value={filtreStatut} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">Tous les statuts</option>
      <option value="active">Actif</option>
      <option value="inactive">Inactif</option>
      <option value="suspended">Suspendu</option>
    </select>
    <input type="text" placeholder="Filtrer par ville..." bind:value={filtreVille} oninput={surFiltreVille}
      class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
  </div>
</div>

<!-- Grille agents -->
{#if chargement}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each Array(6) as _}<div class="skeleton h-40 rounded-2xl"></div>{/each}
  </div>
{:else if agentsFiltres.length === 0}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow py-20 text-center">
    <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
      <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">groups</span>
    </div>
    <p class="text-slate-600 font-semibold">Aucun agent trouvé</p>
  </div>
{:else}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each agentsFiltres as agent}
      <button onclick={() => voirDetail(agent)}
        class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 text-left hover:border-orange-200 transition-all group">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
            {(agent.firstName ?? '?')[0]}{(agent.lastName ?? '?')[0]}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 truncate">{agent.firstName} {agent.lastName}</p>
            <p class="text-xs font-mono text-orange-600 font-semibold">{agent.referralCode ?? '—'}</p>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full
            {agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
            {libellesStatut[agent.status] ?? '—'}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="text-slate-400 mb-0.5">Téléphone</p>
            <p class="font-semibold text-slate-700 font-mono">{agent.phone ?? '—'}</p>
          </div>
          <div>
            <p class="text-slate-400 mb-0.5">Ville</p>
            <p class="font-semibold text-slate-700">{agent.city ?? '—'}</p>
          </div>
          <div>
            <p class="text-slate-400 mb-0.5">Quartier</p>
            <p class="font-semibold text-slate-700">{agent.neighborhood ?? '—'}</p>
          </div>
          <div>
            <p class="text-slate-400 mb-0.5">Inscrit le</p>
            <p class="font-semibold text-slate-700">{formaterDate(agent.createdAt)}</p>
          </div>
        </div>
      </button>
    {/each}
  </div>

  {#if meta && meta.lastPage > 1}
    <div class="mt-5 flex items-center justify-between">
      <p class="text-sm text-slate-500">Page {meta.currentPage} sur {meta.lastPage}</p>
      <div class="flex gap-2">
        <button onclick={() => page--} disabled={page <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Précédent</button>
        <button onclick={() => page++} disabled={page >= meta.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
      </div>
    </div>
  {/if}
{/if}

<!-- Modal : Détail agent -->
{#if afficherModalDetail && agentSelectionne}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
            style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
            {(agentSelectionne.firstName ?? '?')[0]}{(agentSelectionne.lastName ?? '?')[0]}
          </div>
          <div>
            <p class="font-bold text-slate-900">{agentSelectionne.firstName} {agentSelectionne.lastName}</p>
            <p class="text-xs font-mono text-orange-600">{agentSelectionne.referralCode}</p>
          </div>
        </div>
        <button onclick={() => afficherModalDetail = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-5">
        <!-- Infos -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          {#each [
            ['Téléphone', agentSelectionne.phone],
            ['Ville', agentSelectionne.city],
            ['Quartier', agentSelectionne.neighborhood],
            ['Type pièce', agentSelectionne.idType],
            ['Statut', libellesStatut[agentSelectionne.status]],
            ['Inscrit le', formaterDate(agentSelectionne.createdAt)],
          ] as [label, val]}
            {#if val}
              <div>
                <p class="text-xs text-slate-400 mb-0.5">{label}</p>
                <p class="font-semibold text-slate-800">{val}</p>
              </div>
            {/if}
          {/each}
        </div>

        <!-- Stats -->
        {#if statsAgent}
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Statistiques</p>
            <div class="grid grid-cols-3 gap-3">
              {#each [
                ['Parrainages', statsAgent.stats?.totalReferrals ?? 0, 'people'],
                ['Commandes', statsAgent.stats?.totalOrders ?? 0, 'receipt_long'],
                ['Volume', formaterMontant(statsAgent.stats?.totalAmount ?? 0), 'payments'],
              ] as [label, val, icone]}
                <div class="p-3 rounded-xl bg-orange-50 border border-orange-100 text-center">
                  <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">{icone}</span>
                  <p class="text-lg font-black text-slate-900 mt-1">{val}</p>
                  <p class="text-xs text-slate-500">{label}</p>
                </div>
              {/each}
            </div>
          </div>

          <!-- Top clients -->
          {#if statsAgent.topClients?.length > 0}
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Top clients</p>
              <div class="space-y-2">
                {#each statsAgent.topClients.slice(0, 5) as client}
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-mono text-slate-700">{client.clientPhone}</span>
                    <div class="flex items-center gap-3">
                      <span class="text-slate-500">{client.orderCount} cmd</span>
                      <span class="font-semibold text-slate-900">{formaterMontant(client.totalAmount)}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else if statsChargement}
          <div class="flex justify-center py-4">
            <span class="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
          </div>
        {:else}
          <p class="text-sm text-slate-400 text-center py-4">{statsErreur || 'Aucune statistique disponible'}</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Créer agent -->
{#if afficherModalCreer}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Nouvel agent promoteur</h3>
        <button onclick={() => afficherModalCreer = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); creerAgent() }} class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ag-prenom" class="block text-xs font-semibold text-slate-600 mb-1.5">Prénom *</label>
            <input id="ag-prenom" type="text" bind:value={form.firstName} class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.firstName ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.firstName}<p class="text-red-500 text-xs mt-1">{erreurs.firstName}</p>{/if}
          </div>
          <div>
            <label for="ag-nom" class="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
            <input id="ag-nom" type="text" bind:value={form.lastName} class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.lastName ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.lastName}<p class="text-red-500 text-xs mt-1">{erreurs.lastName}</p>{/if}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ag-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone *</label>
            <input id="ag-phone" type="tel" bind:value={form.phone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.phone ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.phone}<p class="text-red-500 text-xs mt-1">{erreurs.phone}</p>{/if}
          </div>
          <div>
            <label for="ag-ville" class="block text-xs font-semibold text-slate-600 mb-1.5">Ville</label>
            <input id="ag-ville" type="text" bind:value={form.city} placeholder="Douala, Yaoundé..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ag-quartier" class="block text-xs font-semibold text-slate-600 mb-1.5">Quartier</label>
            <input id="ag-quartier" type="text" bind:value={form.neighborhood} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="ag-id-type" class="block text-xs font-semibold text-slate-600 mb-1.5">Type pièce</label>
            <select id="ag-id-type" bind:value={form.idType} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="CNI">CNI</option>
              <option value="Passeport">Passeport</option>
              <option value="Permis">Permis</option>
            </select>
          </div>
        </div>
        <div>
          <label for="ag-id-num" class="block text-xs font-semibold text-slate-600 mb-1.5">Numéro de pièce</label>
          <input id="ag-id-num" type="text" bind:value={form.idNumber} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => afficherModalCreer = false} class="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={creation} class="btn-primary flex-1 justify-center">
            {#if creation}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">person_add</span>Créer
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

