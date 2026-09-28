<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth } from '$lib/stores/auth.svelte'

  type Network = 'mtn' | 'orange' | ''
  type PackageType = 'call' | 'data' | 'sms' | 'combo' | 'credit' | ''
  type Etat = 'actifs' | 'desactives' | 'tous'

  interface Package {
    id: string
    name: string
    price: number
    network: string
    type: string
    description: string | null
    details: Record<string, any>
    isActive: boolean
    createdAt: string
  }

  let packages = $state<Package[]>([])
  let chargement = $state(true)
  let enregistrement = $state(false)

  // Filtres
  let filtreNetwork  = $state<Network>('')
  let filtreType     = $state<PackageType>('')
  let filtreEtat     = $state<Etat>('actifs')

  const peutEcrire = $derived(auth.peut('canViewSettings'))

  // Modals
  let modalCreer  = $state(false)
  let modalEditer = $state(false)
  let modalSuppression = $state(false)
  let pkgEdite = $state<Package | null>(null)
  let pkgAsupprimer = $state<Package | null>(null)

  let form = $state({
    name: '',
    price: 0,
    network: 'mtn' as 'mtn' | 'orange',
    type: 'data' as 'call' | 'data' | 'sms' | 'combo' | 'credit',
    description: '',
  })

  const NETWORKS: { key: Network; label: string; color: string; dot: string }[] = [
    { key: '',       label: 'Tous réseaux', color: 'slate',  dot: 'bg-slate-400' },
    { key: 'mtn',    label: 'MTN',          color: 'amber',  dot: 'bg-amber-400' },
    { key: 'orange', label: 'Orange',       color: 'orange', dot: 'bg-orange-500' },
  ]

  const TYPES: { key: PackageType; label: string; icon: string }[] = [
    { key: '',      label: 'Tous types', icon: 'widgets' },
    { key: 'data',  label: 'Data',       icon: 'wifi' },
    { key: 'call',  label: 'Appels',     icon: 'call' },
    { key: 'sms',   label: 'SMS',        icon: 'sms' },
    { key: 'combo', label: 'Combo',      icon: 'stars' },
    { key: 'credit', label: 'Crédit',    icon: 'payments' },
  ]

  const TYPE_ICONS: Record<string, string> = {
    data:  'wifi',
    call:  'call',
    sms:   'sms',
    combo: 'stars',
    credit: 'payments',
  }

  const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPES.filter(t => t.key).map(t => [t.key, t.label]))

  const ETATS: { key: Etat; label: string }[] = [
    { key: 'actifs',     label: 'Actifs' },
    { key: 'desactives', label: 'Désactivés' },
    { key: 'tous',       label: 'Tous' },
  ]

  const actifs = $derived(packages.filter(p => p.isActive))

  const filtered = $derived(packages.filter(p => {
    if (filtreEtat === 'actifs' && !p.isActive) return false
    if (filtreEtat === 'desactives' && p.isActive) return false
    if (filtreNetwork && p.network !== filtreNetwork) return false
    if (filtreType && p.type !== filtreType) return false
    return true
  }))

  const countMtn    = $derived(actifs.filter(p => p.network === 'mtn').length)
  const countOrange = $derived(actifs.filter(p => p.network === 'orange').length)
  const countDesactives = $derived(packages.length - actifs.length)

  async function charger() {
    chargement = true
    try {
      const res = await api.get('/admin/packages')
      packages = res.data?.data ?? []
    } catch {
      toast.erreur('Erreur', 'Impossible de charger les forfaits')
    } finally {
      chargement = false
    }
  }

  function ouvrirCreer() {
    form = { name: '', price: 0, network: 'mtn', type: 'data', description: '' }
    modalCreer = true
  }

  function ouvrirEditer(pkg: Package) {
    pkgEdite = pkg
    form = {
      name:        pkg.name,
      price:       pkg.price,
      network:     pkg.network as 'mtn' | 'orange',
      type:        pkg.type as 'call' | 'data' | 'sms' | 'combo' | 'credit',
      description: pkg.description ?? '',
    }
    modalEditer = true
  }

  async function creer(e: Event) {
    e.preventDefault()
    enregistrement = true
    try {
      await api.post('/packages', {
        name:        form.name,
        price:       Number(form.price),
        network:     form.network,
        type:        form.type,
        description: form.description || undefined,
      })
      toast.succes('Forfait créé')
      modalCreer = false
      await charger()
    } catch (err: any) {
      const erreurs = err.response?.data?.errors
      toast.erreur('Erreur', Array.isArray(erreurs) && erreurs.length ? erreurs.map((x: any) => x.message).join(' • ') : (err.response?.data?.message ?? 'Impossible de créer'))
    } finally { enregistrement = false }
  }

  async function modifier(e: Event) {
    e.preventDefault()
    if (!pkgEdite) return
    enregistrement = true
    try {
      await api.put(`/packages/${pkgEdite.id}`, {
        name:        form.name,
        price:       Number(form.price),
        description: form.description,
      })
      toast.succes('Forfait mis à jour')
      modalEditer = false
      pkgEdite = null
      await charger()
    } catch (err: any) {
      const erreurs = err.response?.data?.errors
      toast.erreur('Erreur', Array.isArray(erreurs) && erreurs.length ? erreurs.map((x: any) => x.message).join(' • ') : (err.response?.data?.message ?? 'Impossible de modifier'))
    } finally { enregistrement = false }
  }

  async function reactiver(pkg: Package) {
    enregistrement = true
    try {
      await api.put(`/packages/${pkg.id}`, { isActive: true })
      toast.succes('Forfait réactivé')
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de réactiver')
    } finally { enregistrement = false }
  }

  async function desactiver() {
    if (!pkgAsupprimer) return
    enregistrement = true
    try {
      await api.delete(`/packages/${pkgAsupprimer.id}`)
      toast.succes('Forfait désactivé')
      modalSuppression = false
      pkgAsupprimer = null
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de désactiver')
    } finally { enregistrement = false }
  }

  function formaterPrix(price: number) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA'
  }

  onMount(charger)
</script>

<svelte:head>
  <title>Forfaits — TransfertCM Admin</title>
</svelte:head>

<!-- En-tête -->
<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Forfaits mobiles</h2>
    <p class="text-sm text-slate-500 mt-0.5">Gérez les forfaits Data, Appels, SMS et Combo disponibles</p>
  </div>
  {#if peutEcrire}
  <button onclick={ouvrirCreer} class="btn-primary shrink-0">
    <span class="material-symbols-outlined icon-filled" style="font-size:18px">add</span>
    Nouveau forfait
  </button>
  {/if}
</div>

<!-- Statistiques rapides -->
<div class="grid grid-cols-2 md:grid-cols-4 stagger gap-4 mb-5">
  {#each [
    { label: 'Total actifs', val: actifs.length, icon: 'inventory_2', color: 'orange' },
    { label: 'MTN actifs',   val: countMtn,    icon: 'cell_tower', color: 'amber' },
    { label: 'Orange actifs',val: countOrange, icon: 'cell_tower', color: 'orange' },
    { label: 'Désactivés',   val: countDesactives, icon: 'block', color: 'slate' },
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

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="flex flex-wrap gap-3 items-center">
    <div class="flex items-center gap-1.5">
      {#each ETATS as e}
        <button
          onclick={() => filtreEtat = e.key}
          class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            {filtreEtat === e.key
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}">
          {e.label}
        </button>
      {/each}
    </div>

    <div class="w-px h-6 bg-slate-200 mx-1"></div>

    <!-- Réseau -->
    <div class="flex items-center gap-1.5">
      {#each NETWORKS as n}
        <button
          onclick={() => filtreNetwork = n.key}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            {filtreNetwork === n.key
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'}">
          {#if n.key}
            <span class="w-2 h-2 rounded-full {n.dot}"></span>
          {/if}
          {n.label}
        </button>
      {/each}
    </div>

    <div class="w-px h-6 bg-slate-200 mx-1"></div>

    <!-- Type -->
    <div class="flex items-center gap-1.5">
      {#each TYPES as t}
        <button
          onclick={() => filtreType = t.key}
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
            {filtreType === t.key
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}">
          <span class="material-symbols-outlined icon-filled" style="font-size:13px">{t.icon}</span>
          {t.label}
        </button>
      {/each}
    </div>
  </div>
</div>

<!-- Liste des forfaits -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="divide-y divide-slate-100">
      {#each Array(6) as _}
        <div class="flex items-center gap-4 px-6 py-4">
          <div class="skeleton w-10 h-10 rounded-xl shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-40 rounded"></div>
            <div class="skeleton h-3 w-56 rounded"></div>
          </div>
          <div class="skeleton h-6 w-20 rounded-full"></div>
          <div class="skeleton h-8 w-8 rounded-lg"></div>
        </div>
      {/each}
    </div>

  {:else if filtered.length === 0}
    <div class="py-16 text-center">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-slate-400" style="font-size:32px">inventory_2</span>
      </div>
      <p class="text-slate-600 font-semibold">Aucun forfait trouvé</p>
      <p class="text-sm text-slate-400 mt-1">Modifiez les filtres{peutEcrire ? ' ou créez un nouveau forfait' : ''}</p>
      {#if peutEcrire}
      <button onclick={ouvrirCreer} class="btn-primary mt-4 text-sm">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
        Créer un forfait
      </button>
      {/if}
    </div>

  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            <th class="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Forfait</th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Réseau</th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Type</th>
            <th class="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Prix</th>
            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filtered as pkg}
            <tr class="hover:bg-slate-50 transition-colors {pkg.isActive ? '' : 'opacity-60'}">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    {pkg.network === 'mtn' ? 'bg-amber-50' : 'bg-orange-50'}">
                    <span class="material-symbols-outlined icon-filled
                      {pkg.network === 'mtn' ? 'text-amber-500' : 'text-orange-500'}"
                      style="font-size:18px">
                      {TYPE_ICONS[pkg.type] ?? 'widgets'}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">
                      {pkg.name}
                      {#if !pkg.isActive}
                        <span class="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 align-middle">Désactivé</span>
                      {/if}
                    </p>
                    {#if pkg.description}
                      <p class="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{pkg.description}</p>
                    {/if}
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <span class="flex items-center gap-1.5 text-sm">
                  <span class="w-2 h-2 rounded-full shrink-0
                    {pkg.network === 'mtn' ? 'bg-amber-400' : 'bg-orange-500'}">
                  </span>
                  <span class="font-semibold text-slate-700 uppercase text-xs">{pkg.network}</span>
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="flex items-center gap-1 text-xs text-slate-500">
                  <span class="material-symbols-outlined icon-filled" style="font-size:14px">{TYPE_ICONS[pkg.type] ?? 'widgets'}</span>
                  <span>{pkg.type ? (TYPE_LABELS[pkg.type] ?? pkg.type) : '—'}</span>
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-bold text-slate-900">{formaterPrix(pkg.price)}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  {#if peutEcrire}
                  <button
                    onclick={() => ouvrirEditer(pkg)}
                    title="Modifier"
                    class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
                    <span class="material-symbols-outlined icon-filled" style="font-size:16px">edit</span>
                  </button>
                  {#if pkg.isActive}
                  <button
                    onclick={() => { pkgAsupprimer = pkg; modalSuppression = true; }}
                    title="Désactiver"
                    class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                    <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>
                  </button>
                  {:else}
                  <button
                    onclick={() => reactiver(pkg)}
                    disabled={enregistrement}
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1 disabled:opacity-50 transition-all">
                    <span class="material-symbols-outlined icon-filled" style="font-size:14px">replay</span>
                    Réactiver
                  </button>
                  {/if}
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
      {filtered.length} forfait{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
      {#if filtreNetwork || filtreType} · filtres actifs{/if}
    </div>
  {/if}
</div>

<!-- Modal : Créer forfait -->
{#if modalCreer}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Nouveau forfait</h3>
        <button onclick={() => modalCreer = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={creer} class="p-6 space-y-4">
        <div>
          <label for="c-name" class="block text-xs font-semibold text-slate-600 mb-1.5">Nom du forfait</label>
          <input id="c-name" type="text" bind:value={form.name} required minlength="2"
            placeholder="Ex: Forfait Data 1Go MTN"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="c-network" class="block text-xs font-semibold text-slate-600 mb-1.5">Réseau</label>
            <select id="c-network" bind:value={form.network}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white">
              <option value="mtn">MTN</option>
              <option value="orange">Orange</option>
            </select>
          </div>
          <div>
            <label for="c-type" class="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
            <select id="c-type" bind:value={form.type}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white">
              <option value="data">Data</option>
              <option value="call">Appels</option>
              <option value="sms">SMS</option>
              <option value="combo">Combo</option>
              <option value="credit">Crédit</option>
            </select>
          </div>
        </div>
        {#if form.type === 'credit'}
          <p class="text-[11px] text-slate-400 -mt-2">Les forfaits de type Crédit ne sont pas encore affichés dans l'application mobile.</p>
        {/if}
        <div>
          <label for="c-price" class="block text-xs font-semibold text-slate-600 mb-1.5">Prix (FCFA)</label>
          <input id="c-price" type="number" bind:value={form.price} required min="100"
            placeholder="500"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="c-desc" class="block text-xs font-semibold text-slate-600 mb-1.5">Description (optionnel)</label>
          <input id="c-desc" type="text" bind:value={form.description}
            placeholder="Ex: 1Go valable 7 jours"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => modalCreer = false} class="btn-secondary flex-1 justify-center">Annuler</button>
          <button type="submit" disabled={enregistrement} class="btn-primary flex-1 justify-center">
            {#if enregistrement}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
            {/if}
            Créer
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal : Modifier forfait -->
{#if modalEditer && pkgEdite}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Modifier le forfait</h3>
        <button onclick={() => { modalEditer = false; pkgEdite = null; }} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={modifier} class="p-6 space-y-4">
        <div>
          <label for="e-name" class="block text-xs font-semibold text-slate-600 mb-1.5">Nom du forfait</label>
          <input id="e-name" type="text" bind:value={form.name} required minlength="2"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
          <span class="w-2.5 h-2.5 rounded-full {pkgEdite.network === 'mtn' ? 'bg-amber-400' : 'bg-orange-500'}"></span>
          <span class="font-semibold uppercase">{pkgEdite.network}</span> · <span>{TYPE_LABELS[pkgEdite.type] ?? pkgEdite.type}</span>
          <span class="ml-auto text-slate-400 italic">Réseau et type non modifiables</span>
        </div>
        <div>
          <label for="e-price" class="block text-xs font-semibold text-slate-600 mb-1.5">Prix (FCFA)</label>
          <input id="e-price" type="number" bind:value={form.price} required min="100"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="e-desc" class="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
          <input id="e-desc" type="text" bind:value={form.description}
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => { modalEditer = false; pkgEdite = null; }} class="btn-secondary flex-1 justify-center">Annuler</button>
          <button type="submit" disabled={enregistrement} class="btn-primary flex-1 justify-center">
            {#if enregistrement}
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

<!-- Modal : Confirmer désactivation -->
{#if modalSuppression && pkgAsupprimer}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-sm pointer-events-auto animate-fade-in-up"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)">
      <div class="p-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:28px">block</span>
        </div>
        <h3 class="font-bold text-slate-900 mb-1">Désactiver ce forfait ?</h3>
        <p class="text-sm text-slate-500">
          Le forfait <strong>{pkgAsupprimer.name}</strong> sera masqué et ne sera plus accessible aux clients.
          Il peut être réactivé à tout moment depuis le filtre « Désactivés ».
        </p>
        <div class="flex gap-3 mt-6">
          <button onclick={() => { modalSuppression = false; pkgAsupprimer = null; }} class="btn-secondary flex-1 justify-center">Annuler</button>
          <button onclick={desactiver} disabled={enregistrement} class="btn-primary flex-1 justify-center !bg-red-500 hover:!bg-red-600 border-red-500">
            {#if enregistrement}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>
            {/if}
            Désactiver
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
