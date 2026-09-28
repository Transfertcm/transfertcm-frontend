<script lang="ts">
  import { untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t, translate } from '$lib/stores/locale'

  let cabines = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)

  let recherche = $state('')
  let filtreStatut = $state('')
  let filtreType = $state('')
  let filtreVille = $state('')

  let afficherModal = $state(false)
  let creation = $state(false)
  let nouvelleCabine = $state({
    name: '', managerName: '', email: '', password: '', phone: '',
    city: '', location: '', type: 'basic',
    mtnNumber: '', orangeNumber: '',
  })
  let erreurs = $state<Record<string, string>>({})

  const statuts = $derived([
    { val: '', label: $t('admin.cabins.all_statuses') },
    { val: 'active', label: $t('status.active') },
    { val: 'suspended', label: $t('status.suspended') },
    { val: 'inactive', label: $t('status.inactive') },
  ])

  const types = $derived([
    { val: '', label: $t('admin.cabins.all_types') },
    { val: 'basic', label: $t('admin.cabins.type.basic') },
    { val: 'standard', label: $t('admin.cabins.type.standard') },
    { val: 'premium', label: $t('admin.cabins.type.premium') },
  ])

  async function charger() {
    chargement = true
    try {
      const params: any = { page, perPage: 20 }
      if (filtreStatut) params.status = filtreStatut
      if (filtreType) params.type = filtreType
      if (filtreVille) params.city = filtreVille
      if (recherche) params.search = recherche
      const res = await api.get('/cabins', { params })
      cabines = res.data?.data ?? []
      meta = res.data?.meta ?? null
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de charger les cabines')
    } finally {
      chargement = false
    }
  }

  async function creerCabine() {
    erreurs = {}
    creation = true
    try {
      const payload: any = { ...nouvelleCabine }
      // Supprimer les champs optionnels vides
      for (const key of ['phone', 'mtnNumber', 'orangeNumber', 'location', 'city']) {
        if (!payload[key]) delete payload[key]
      }
      // Normaliser les numéros : supprimer espaces et tirets
      for (const key of ['phone', 'mtnNumber', 'orangeNumber']) {
        if (payload[key]) payload[key] = payload[key].replace(/[\s\-]/g, '')
      }
      await api.post('/cabins', payload)
      toast.succes(translate('admin.cabins.created'))
      afficherModal = false
      nouvelleCabine = { name: '', managerName: '', email: '', password: '', phone: '', city: '', location: '', type: 'basic', mtnNumber: '', orangeNumber: '' }
      await charger()
    } catch (e: any) {
      const status = e.response?.status
      const data = e.response?.data
      if (status === 422) {
        const errors = data?.errors
        if (Array.isArray(errors) && errors.length) {
          errors.forEach((err: any) => { erreurs[err.field] = err.message })
          const msgs = errors.map((e: any) => e.message).join(' • ')
          toast.erreur('Formulaire invalide', msgs)
        } else {
          toast.erreur('Erreur création', data?.message ?? 'Une erreur est survenue.')
        }
      } else {
        toast.erreur('Erreur', data?.message ?? 'Une erreur est survenue.')
      }
    } finally {
      creation = false
    }
  }

  let timer: ReturnType<typeof setTimeout>
  function surRecherche() {
    clearTimeout(timer)
    timer = setTimeout(() => { page = 1; charger() }, 400)
  }

  $effect(() => { filtreStatut; filtreType; page; untrack(charger) })

  const couleurType: Record<string, string> = {
    basic: 'bg-slate-100 text-slate-500',
    standard: 'bg-blue-100 text-blue-700',
    premium: 'bg-amber-100 text-amber-700',
  }
</script>

<svelte:head><title>{$t('admin.cabins.title')} — {$t('common.app_name')}</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('admin.cabins.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">
      {meta ? $t('admin.cabins.subtitle', { total: meta.total ?? 0 }) : $t('admin.cabins.subtitle_default')}
    </p>
  </div>
  <button onclick={() => afficherModal = true} class="btn-primary">
    <span class="material-symbols-outlined icon-filled" style="font-size:18px">add</span>
    {$t('admin.cabins.new')}
  </button>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px">search</span>
      <input type="text" placeholder={$t('admin.cabins.search_placeholder')} bind:value={recherche} oninput={surRecherche}
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
    </div>
    <select bind:value={filtreStatut} onchange={() => page = 1} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      {#each statuts as s}<option value={s.val}>{s.label}</option>{/each}
    </select>
    <select bind:value={filtreType} onchange={() => page = 1} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      {#each types as tp}<option value={tp.val}>{tp.label}</option>{/each}
    </select>
    <input type="text" placeholder={$t('admin.cabins.filter_city')} bind:value={filtreVille} oninput={surRecherche}
      class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
  </div>
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-2">
      {#each Array(8) as _}
        <div class="skeleton h-16 rounded-xl"></div>
      {/each}
    </div>
  {:else if cabines.length === 0}
    <div class="py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">store</span>
      </div>
      <p class="text-slate-600 font-semibold">{$t('admin.cabins.no_results')}</p>
      <p class="text-slate-400 text-sm mt-1">{$t('admin.cabins.no_results_hint')}</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-3">{$t('admin.cabins.col_cabin')}</div>
      <div class="col-span-2">{$t('admin.cabins.col_manager')}</div>
      <div class="col-span-1">{$t('admin.cabins.col_type')}</div>
      <div class="col-span-2">{$t('admin.cabins.col_city')}</div>
      <div class="col-span-1">{$t('admin.cabins.col_uv')}</div>
      <div class="col-span-2">{$t('admin.cabins.col_status')}</div>
      <div class="col-span-1">{$t('common.actions')}</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each cabines as cab}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
          <div class="lg:col-span-3 flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">store</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{cab.name ?? '—'}</p>
              {#if cab.phone}
                <p class="text-xs text-slate-400 font-mono">{cab.phone}</p>
              {/if}
            </div>
          </div>
          <div class="lg:col-span-2">
            <p class="text-sm text-slate-600 truncate">{cab.managerName ?? cab.manager_name ?? '—'}</p>
          </div>
          <div class="lg:col-span-1">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full capitalize {couleurType[cab.type] ?? 'bg-slate-100 text-slate-600'}">
              {cab.type ? $t(`admin.cabins.type.${cab.type}`) : '—'}
            </span>
          </div>
          <div class="lg:col-span-2">
            <p class="text-sm text-slate-500">{cab.city ?? '—'}</p>
          </div>
          <div class="lg:col-span-1">
            <p class="text-sm font-bold text-slate-900">{cab.uvBalance ?? cab.uv_balance ?? 0}</p>
            <p class="text-xs text-slate-400">UV</p>
          </div>
          <div class="lg:col-span-2">
            <Badge statut={cab.paused && cab.status === 'active' ? 'paused' : (cab.status ?? 'inactive')} />
          </div>
          <div class="lg:col-span-1">
            <a href="/admin/cabines/{cab.id}" class="w-7 h-7 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500" title={$t('common.view')}>
              <span class="material-symbols-outlined" style="font-size:16px">open_in_new</span>
            </a>
          </div>
        </div>
      {/each}
    </div>

    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">
          {$t('common.page_of', { current: meta.currentPage, total: meta.lastPage })}
        </p>
        <div class="flex gap-2">
          <button onclick={() => page--} disabled={page <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            ← {$t('common.previous')}
          </button>
          <button onclick={() => page++} disabled={page >= meta.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            {$t('common.next')} →
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal création cabine -->
{#if afficherModal}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-2xl pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.cabins.new')}</h3>
        <button onclick={() => afficherModal = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); creerCabine() }} class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="cab-name" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.cabins.cabin_name')} *</label>
            <input id="cab-name" type="text" bind:value={nouvelleCabine.name} placeholder="Ex: Cabine Douala Centre" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.name ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.name}<p class="text-red-500 text-xs mt-1">{erreurs.name}</p>{/if}
          </div>
          <div>
            <label for="cab-manager" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.cabins.manager_name')} *</label>
            <input id="cab-manager" type="text" bind:value={nouvelleCabine.managerName} placeholder="Nom complet" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.managerName ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.managerName}<p class="text-red-500 text-xs mt-1">{erreurs.managerName}</p>{/if}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="cab-email" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.email')} *</label>
            <input id="cab-email" type="email" bind:value={nouvelleCabine.email} placeholder="cabine@example.com" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.email ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.email}<p class="text-red-500 text-xs mt-1">{erreurs.email}</p>{/if}
          </div>
          <div>
            <label for="cab-password" class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe *</label>
            <input id="cab-password" type="password" bind:value={nouvelleCabine.password} placeholder="Min. 8 caractères" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.password ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.password}<p class="text-red-500 text-xs mt-1">{erreurs.password}</p>{/if}
          </div>
        </div>
        <div>
          <label for="cab-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('cabin.profile.phone')}</label>
          <input id="cab-phone" type="tel" bind:value={nouvelleCabine.phone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="cab-city" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.cabins.col_city')}</label>
            <input id="cab-city" type="text" bind:value={nouvelleCabine.city} placeholder="Douala, Yaoundé..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="cab-type" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.cabins.col_type')}</label>
            <select id="cab-type" bind:value={nouvelleCabine.type} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="basic">{$t('admin.cabins.type.basic')}</option>
              <option value="standard">{$t('admin.cabins.type.standard')}</option>
              <option value="premium">{$t('admin.cabins.type.premium')}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="cab-location" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.cabins.location')}</label>
          <input id="cab-location" type="text" bind:value={nouvelleCabine.location} placeholder="Quartier, rue..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="cab-mtn" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('cabin.profile.mtn_number')}</label>
            <input id="cab-mtn" type="tel" bind:value={nouvelleCabine.mtnNumber} placeholder="67XXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="cab-orange" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('cabin.profile.orange_number')}</label>
            <input id="cab-orange" type="tel" bind:value={nouvelleCabine.orangeNumber} placeholder="69XXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="p-4 rounded-xl bg-orange-50 border border-orange-100">
          <p class="text-xs font-semibold text-orange-700">Abonnement</p>
          <p class="text-[11px] text-orange-600 mt-1">La cabine est créée sans abonnement actif. Activez son abonnement depuis sa fiche après la création.</p>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => afficherModal = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button type="submit" disabled={creation} class="btn-primary flex-1 justify-center">
            {#if creation}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
            {/if}
            {$t('common.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
