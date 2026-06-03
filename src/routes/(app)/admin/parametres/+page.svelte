<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let settings = $state<any[]>([])
  let phones = $state<any[]>([])
  let cityAssignments = $state<any[]>([])
  let chargement = $state(true)
  let actionEnCours = $state('')

  type Onglet = 'frais' | 'phones' | 'villes' | 'general'
  let onglet = $state<Onglet>('frais')

  // Frais de service
  const reseaux = [
    { key: 'mtn',     label: 'MTN Mobile Money', couleur: '#f59e0b' },
    { key: 'orange',  label: 'Orange Money',      couleur: '#f97316' },
    { key: 'viettel', label: 'Viettel Cash',      couleur: '#3b82f6' },
    { key: 'wave',    label: 'Wave',              couleur: '#06b6d4' },
  ]
  type FraisReseau = { percent: number; fixed: number }
  let frais = $state<Record<string, FraisReseau>>({
    mtn:     { percent: 0, fixed: 0 },
    orange:  { percent: 0, fixed: 0 },
    viettel: { percent: 0, fixed: 0 },
    wave:    { percent: 0, fixed: 0 },
  })
  let fraisEnEdition = $state<string | null>(null)
  let fraisEdit = $state<FraisReseau>({ percent: 0, fixed: 0 })

  // Edition paramètre général
  let settingEnEdition = $state<any>(null)
  let nouvelleValeur = $state('')

  // Plans d'abonnement parsés depuis les settings
  const subscriptionPlans = $derived<Record<string, any> | null>(
    (() => {
      const row = settings.find((s: any) => s.key === 'subscription_plans')
      if (!row?.value) return null
      try { return JSON.parse(row.value) } catch { return null }
    })()
  )

  // Settings généraux (hors ceux gérés par les autres onglets)
  const CLES_EXCLUES = ['transaction_fees', 'subscription_plans']
  const settingsGeneraux = $derived(settings.filter((s: any) => !CLES_EXCLUES.includes(s.key)))

  // Modals
  let afficherModalPhone = $state(false)
  let afficherModalVille = $state(false)

  let formPhone = $state({ phoneNumber: '', phoneLabel: '', isPrimary: false })
  let formVille = $state({ city: '', adminUserId: '' })

  async function charger() {
    chargement = true
    try {
      const [settRes, phoneRes, villeRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/settings/service-phones'),
        api.get('/admin/settings/city-assignments'),
      ])
      settings = settRes.data?.data ?? []
      phones = phoneRes.data?.data ?? []
      cityAssignments = villeRes.data?.data ?? []

      // Charger les frais depuis les settings
      const fraisRow = settings.find((s: any) => s.key === 'transaction_fees')
      if (fraisRow?.value) {
        try {
          const parsed = JSON.parse(fraisRow.value)
          for (const k of Object.keys(frais)) {
            if (parsed[k]) frais[k] = parsed[k]
          }
        } catch {}
      }
    } catch { toast.erreur('Erreur', 'Impossible de charger les paramètres') }
    finally { chargement = false }
  }

  function ouvrirEditionFrais(key: string) {
    fraisEnEdition = key
    fraisEdit = { ...frais[key] }
  }

  async function sauvegarderFrais() {
    if (!fraisEnEdition) return
    actionEnCours = 'frais'
    try {
      frais[fraisEnEdition] = { ...fraisEdit }
      await api.put('/admin/settings/transaction_fees', {
        value: JSON.stringify(frais),
      })
      toast.succes('Frais mis à jour')
      fraisEnEdition = null
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { actionEnCours = '' }
  }

  async function sauvegarderSetting(key: string) {
    actionEnCours = key
    try {
      await api.put(`/admin/settings/${key}`, { value: nouvelleValeur })
      toast.succes('Paramètre mis à jour')
      settingEnEdition = null
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { actionEnCours = '' }
  }

  async function ajouterPhone() {
    actionEnCours = 'phone'
    try {
      await api.post('/admin/settings/service-phones', formPhone)
      toast.succes('Numéro ajouté')
      afficherModalPhone = false
      formPhone = { phoneNumber: '', phoneLabel: '', isPrimary: false }
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'ajouter')
    } finally { actionEnCours = '' }
  }

  async function supprimerPhone(id: string) {
    actionEnCours = id
    try {
      await api.delete(`/admin/settings/service-phones/${id}`)
      toast.succes('Numéro désactivé')
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de supprimer')
    } finally { actionEnCours = '' }
  }

  async function assignerVille() {
    actionEnCours = 'ville'
    try {
      await api.post('/admin/settings/city-assignments', formVille)
      toast.succes('Ville assignée')
      afficherModalVille = false
      formVille = { city: '', adminUserId: '' }
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'assigner')
    } finally { actionEnCours = '' }
  }

  onMount(charger)
</script>

<svelte:head><title>Paramètres — TransfertCM Admin</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Paramètres</h2>
  <p class="text-sm text-slate-500 mt-0.5">Configuration de la plateforme TransfertCM</p>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['frais','percent','Frais de service'],['phones','phone','Téléphones service'],['villes','location_city','Villes'],['general','tune','Général']] as [val, icone, label]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      <span class="hidden sm:inline">{label}</span>
    </button>
  {/each}
</div>

<!-- ── Frais de service ─────────────────────────────────────────────────────── -->
{#if onglet === 'frais'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <div>
        <p class="font-bold text-slate-900 text-sm">Frais de transfert par réseau</p>
        <p class="text-xs text-slate-400 mt-0.5">Montant total = montant + (montant × %) + frais fixe</p>
      </div>
    </div>

    {#if chargement}
      <div class="p-5 space-y-3">{#each Array(4) as _}<div class="skeleton h-16 rounded-xl"></div>{/each}</div>
    {:else}
      <!-- En-tête tableau -->
      <div class="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-4">Réseau mobile</div>
        <div class="col-span-3 text-right">Frais (%)</div>
        <div class="col-span-3 text-right">Frais fixe (XAF)</div>
        <div class="col-span-2"></div>
      </div>

      <div class="divide-y divide-slate-50">
        {#each reseaux as reseau}
          <div class="grid grid-cols-12 gap-3 items-center px-5 py-4">
            <!-- Réseau -->
            <div class="col-span-4 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style="background: {reseau.couleur}20">
                <span class="material-symbols-outlined icon-filled" style="font-size:16px; color:{reseau.couleur}">smartphone</span>
              </div>
              <p class="text-sm font-semibold text-slate-800">{reseau.label}</p>
            </div>

            {#if fraisEnEdition === reseau.key}
              <!-- Mode édition -->
              <div class="col-span-3 flex justify-end">
                <div class="flex items-center gap-1">
                  <input type="number" bind:value={fraisEdit.percent} min="0" max="100" step="0.1"
                    class="w-20 px-2 py-1.5 rounded-lg border border-orange-300 text-sm text-right" />
                  <span class="text-xs text-slate-400">%</span>
                </div>
              </div>
              <div class="col-span-3 flex justify-end">
                <div class="flex items-center gap-1">
                  <input type="number" bind:value={fraisEdit.fixed} min="0" step="50"
                    class="w-24 px-2 py-1.5 rounded-lg border border-orange-300 text-sm text-right" />
                  <span class="text-xs text-slate-400">XAF</span>
                </div>
              </div>
              <div class="col-span-2 flex gap-1.5 justify-end">
                <button onclick={sauvegarderFrais} disabled={actionEnCours === 'frais'}
                  class="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50">
                  {actionEnCours === 'frais' ? '...' : 'OK'}
                </button>
                <button onclick={() => fraisEnEdition = null}
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  ✕
                </button>
              </div>
            {:else}
              <!-- Mode affichage -->
              <div class="col-span-3 text-right">
                <p class="text-sm font-bold text-slate-900">{frais[reseau.key]?.percent ?? 0} %</p>
              </div>
              <div class="col-span-3 text-right">
                <p class="text-sm font-bold text-slate-900">{(frais[reseau.key]?.fixed ?? 0).toLocaleString('fr-CM')} XAF</p>
              </div>
              <div class="col-span-2 flex justify-end">
                <button onclick={() => ouvrirEditionFrais(reseau.key)}
                  class="w-8 h-8 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500">
                  <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Exemple de calcul -->
      <div class="px-5 py-4 border-t border-slate-100 bg-slate-50">
        <p class="text-xs text-slate-500">
          <span class="font-semibold text-slate-700">Exemple MTN :</span>
          Pour un transfert de 10 000 XAF →
          frais = {Math.round(10000 * (frais.mtn?.percent ?? 0) / 100 + (frais.mtn?.fixed ?? 0)).toLocaleString('fr-CM')} XAF →
          total client = {Math.round(10000 + 10000 * (frais.mtn?.percent ?? 0) / 100 + (frais.mtn?.fixed ?? 0)).toLocaleString('fr-CM')} XAF
        </p>
      </div>
    {/if}
  </div>

<!-- ── Téléphones service ───────────────────────────────────────────────────── -->
{:else if onglet === 'phones'}
  <div class="mb-4 flex justify-end">
    <button onclick={() => afficherModalPhone = true} class="btn-primary">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
      Ajouter un numéro
    </button>
  </div>
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(4) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if phones.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">Aucun numéro de service configuré</p>
        <button onclick={() => afficherModalPhone = true} class="btn-primary mt-4">Ajouter le premier numéro</button>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each phones as phone}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">phone</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-slate-900 font-mono">{phone.phone_number}</p>
                {#if phone.is_primary}
                  <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">Principal</span>
                {/if}
              </div>
              <p class="text-xs text-slate-500">{phone.phone_label ?? '—'}</p>
            </div>
            <button onclick={() => supprimerPhone(phone.id)} disabled={actionEnCours === phone.id}
              class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 disabled:opacity-50">
              <span class="material-symbols-outlined" style="font-size:16px">delete</span>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ── Villes ───────────────────────────────────────────────────────────────── -->
{:else if onglet === 'villes'}
  <div class="mb-4 flex justify-end">
    <button onclick={() => afficherModalVille = true} class="btn-primary">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
      Assigner une ville
    </button>
  </div>
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(4) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if cityAssignments.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">Aucune assignation de ville</p>
        <button onclick={() => afficherModalVille = true} class="btn-primary mt-4">Assigner la première ville</button>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each cityAssignments as assign}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">location_city</span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-slate-900">{assign.city}</p>
              <p class="text-xs text-slate-500">Admin : {assign.admin_user_id?.slice(-8) ?? '—'}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full {assign.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
              {assign.is_enabled ? 'Actif' : 'Inactif'}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ── Général ──────────────────────────────────────────────────────────────── -->
{:else}
  {#if chargement}
    <div class="space-y-4">
      {#each Array(3) as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}
    </div>
  {:else}

    <!-- Plans d'abonnement -->
    {#if subscriptionPlans}
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden mb-5">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">workspace_premium</span>
          </div>
          <div>
            <p class="font-bold text-slate-900 text-sm">Plans d'abonnement</p>
            <p class="text-xs text-slate-400">Tarifs et limites de chaque plan cabine</p>
          </div>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {#each Object.entries(subscriptionPlans) as [cle, plan]}
            {@const couleurs: Record<string, string> = { basic: 'slate', standard: 'blue', premium: 'amber' }}
            {@const c = couleurs[cle] ?? 'slate'}
            <div class="rounded-xl border border-slate-200 p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-2 h-2 rounded-full bg-{c}-400"></span>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wide">{plan.name ?? cle}</p>
              </div>
              <p class="font-black text-2xl text-slate-900 tabular-nums">
                {(plan.price ?? 0).toLocaleString('fr-CM')}
                <span class="text-sm font-normal text-slate-400">XAF</span>
              </p>
              <p class="text-xs text-slate-400 mt-0.5">par mois</p>
              <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600">
                <span class="material-symbols-outlined" style="font-size:14px">shopping_cart</span>
                <span class="font-semibold">{plan.maxOrders ?? '∞'}</span> commandes max / jour
              </div>
            </div>
          {/each}
        </div>
        <div class="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p class="text-xs text-slate-400">Pour modifier les plans, contactez l'équipe technique (modification JSON avancée).</p>
        </div>
      </div>
    {/if}

    <!-- Autres paramètres généraux -->
    {#if settingsGeneraux.length > 0}
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <p class="font-bold text-slate-900 text-sm">Autres paramètres</p>
        </div>
        <div class="divide-y divide-slate-50">
          {#each settingsGeneraux as setting}
            <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wide font-mono mb-0.5">{setting.key}</p>
                {#if settingEnEdition?.key === setting.key}
                  <div class="flex gap-2 mt-2">
                    <input type="text" bind:value={nouvelleValeur}
                      onkeydown={(e) => e.key === 'Enter' && sauvegarderSetting(setting.key)}
                      class="flex-1 px-3 py-1.5 rounded-lg border border-orange-300 text-sm" />
                    <button onclick={() => sauvegarderSetting(setting.key)} disabled={actionEnCours === setting.key}
                      class="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50">
                      {actionEnCours === setting.key ? '...' : 'OK'}
                    </button>
                    <button onclick={() => settingEnEdition = null}
                      class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      Annuler
                    </button>
                  </div>
                {:else}
                  <p class="text-sm text-slate-700 truncate">{setting.value ?? '—'}</p>
                {/if}
              </div>
              {#if settingEnEdition?.key !== setting.key}
                <button onclick={() => { settingEnEdition = setting; nouvelleValeur = setting.value ?? '' }}
                  class="w-8 h-8 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500 shrink-0">
                  <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if !subscriptionPlans}
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow py-20 text-center">
        <p class="text-slate-600 font-semibold">Aucun paramètre général configuré</p>
      </div>
    {/if}

  {/if}
{/if}

<!-- Modal : Ajouter téléphone -->
{#if afficherModalPhone}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Ajouter un numéro de service</h3>
        <button onclick={() => afficherModalPhone = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="ph-number" class="block text-xs font-semibold text-slate-600 mb-1.5">Numéro *</label>
          <input id="ph-number" type="tel" bind:value={formPhone.phoneNumber} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="ph-label" class="block text-xs font-semibold text-slate-600 mb-1.5">Libellé</label>
          <input id="ph-label" type="text" bind:value={formPhone.phoneLabel} placeholder="Service Client, WhatsApp..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" bind:checked={formPhone.isPrimary} class="w-4 h-4 accent-orange-500 rounded" />
          <span class="text-sm font-medium text-slate-700">Numéro principal</span>
        </label>
        <div class="flex gap-3">
          <button onclick={() => afficherModalPhone = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={ajouterPhone} disabled={!formPhone.phoneNumber || actionEnCours === 'phone'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'phone'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}Ajouter{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Assigner ville -->
{#if afficherModalVille}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Assigner une ville</h3>
        <button onclick={() => afficherModalVille = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="vl-city" class="block text-xs font-semibold text-slate-600 mb-1.5">Ville *</label>
          <input id="vl-city" type="text" bind:value={formVille.city} placeholder="Douala, Yaoundé, Bafoussam..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="vl-admin" class="block text-xs font-semibold text-slate-600 mb-1.5">ID Admin responsable *</label>
          <input id="vl-admin" type="text" bind:value={formVille.adminUserId} placeholder="ID de l'admin" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalVille = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={assignerVille} disabled={!formVille.city || !formVille.adminUserId || actionEnCours === 'ville'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'ville'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}Assigner{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
