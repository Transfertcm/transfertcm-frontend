<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'

  let settings = $state<any[]>([])
  let phones = $state<any[]>([])
  let cityAssignments = $state<any[]>([])
  let chargement = $state(true)
  let actionEnCours = $state('')

  type Onglet = 'frais' | 'phones' | 'villes' | 'general'
  let onglet = $state<Onglet>('frais')

  const FRAIS_PAR_DEFAUT = 20
  let fraisFixe = $state(FRAIS_PAR_DEFAUT)
  let fraisConfigure = $state(false)
  let fraisEnEdition = $state(false)
  let fraisEdit = $state<number | string>(FRAIS_PAR_DEFAUT)

  const estSuperAdmin = $derived(auth.user?.role === 'super_admin')
  let admins = $state<any[]>([])
  let phoneASupprimer = $state<any>(null)
  let confirmationPhone = $state(false)

  // Edition paramètre général
  let settingEnEdition = $state<any>(null)
  let nouvelleValeur = $state('')

  // Settings généraux (hors ceux gérés par les autres onglets)
  const CLES_EXCLUES = ['transaction_fees', 'subscription_plans']
  const libellesParametres: Record<string, string> = {
    deposit_fees: 'Frais de dépôt portefeuille (XAF)',
    transfer_fees: 'Frais de transfert entre membres (XAF)',
  }

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

      const fraisRow = settings.find((s: any) => s.key === 'transaction_fees')
      const lu = fraisRow ? Number.parseInt(fraisRow.value, 10) : Number.NaN
      fraisConfigure = Number.isFinite(lu)
      fraisFixe = fraisConfigure ? lu : FRAIS_PAR_DEFAUT
    } catch { toast.erreur('Erreur', 'Impossible de charger les paramètres') }
    finally { chargement = false }
  }

  async function chargerAdmins() {
    if (!estSuperAdmin) return
    try {
      const res = await api.get('/admin/team')
      admins = (res.data?.data ?? []).filter((a: any) => a.role !== 'cabin')
    } catch {}
  }

  function nomAdmin(id: string | null) {
    if (!id) return '—'
    const a = admins.find((x: any) => x.id === id)
    if (a) return a.fullName || a.email
    if (id === auth.user?.id) return auth.user?.fullName || auth.user?.email || 'Vous'
    return `Admin ${id.slice(-8)}`
  }

  function ouvrirEditionFrais() {
    fraisEnEdition = true
    fraisEdit = fraisFixe
  }

  async function sauvegarderFrais() {
    const valeur = Number(fraisEdit)
    if (!Number.isInteger(valeur) || valeur < 0) {
      toast.erreur('Valeur invalide', 'Le frais doit être un nombre entier de XAF, positif ou nul.')
      return
    }
    actionEnCours = 'frais'
    try {
      await api.put('/admin/settings/transaction_fees', { value: String(valeur) })
      toast.succes('Frais mis à jour', 'Pris en compte par le serveur sous 5 minutes maximum.')
      fraisEnEdition = false
      await charger()
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
      if (e.response?.status === 422) toast.erreur('Numéro invalide', 'Format attendu : 6XXXXXXXX (préfixe 237 facultatif).')
      else toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'ajouter')
    } finally { actionEnCours = '' }
  }

  function demanderSuppressionPhone(phone: any) {
    phoneASupprimer = phone
    confirmationPhone = true
  }

  async function supprimerPhone(id: string) {
    actionEnCours = id
    try {
      await api.delete(`/admin/settings/service-phones/${id}`)
      toast.succes('Numéro désactivé')
      confirmationPhone = false
      phoneASupprimer = null
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
  $effect(() => { if (estSuperAdmin) untrack(chargerAdmins) })
</script>

<svelte:head><title>Paramètres — TransfertCM Admin</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Paramètres</h2>
  <p class="text-sm text-slate-500 mt-0.5">Configuration de la plateforme TransfertCM</p>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['frais','payments','Frais de service'],['phones','phone','Téléphones service'],['villes','location_city','Villes'],['general','tune','Général']] as [val, icone, label]}
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
    <div class="px-5 py-4 border-b border-slate-100">
      <p class="font-bold text-slate-900 text-sm">Frais de service par commande</p>
      <p class="text-xs text-slate-400 mt-0.5">Montant fixe en XAF ajouté à chaque commande (crédit, forfait, transfert), identique pour MTN et Orange.</p>
    </div>

    {#if chargement}
      <div class="p-5"><div class="skeleton h-16 rounded-xl"></div></div>
    {:else}
      <div class="flex items-center gap-4 px-5 py-5 flex-wrap">
        <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">payments</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-slate-400">Frais fixe par commande</p>
          {#if fraisEnEdition}
            <div class="flex items-center gap-2 mt-1">
              <input type="number" bind:value={fraisEdit} min="0" step="1"
                onkeydown={(e) => e.key === 'Enter' && sauvegarderFrais()}
                class="w-28 px-2 py-1.5 rounded-lg border border-orange-300 text-sm text-right" />
              <span class="text-xs text-slate-400">XAF</span>
            </div>
          {:else}
            <p class="text-xl font-black text-slate-900">{fraisFixe.toLocaleString('fr-CM')} XAF</p>
            {#if !fraisConfigure}
              <p class="text-xs text-slate-400">Valeur par défaut du serveur (aucune valeur enregistrée)</p>
            {/if}
          {/if}
        </div>
        {#if fraisEnEdition}
          <div class="flex gap-1.5">
            <button onclick={sauvegarderFrais} disabled={actionEnCours === 'frais'}
              class="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50">
              {actionEnCours === 'frais' ? '...' : 'Enregistrer'}
            </button>
            <button onclick={() => fraisEnEdition = false}
              class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
          </div>
        {:else}
          <button onclick={ouvrirEditionFrais}
            class="w-8 h-8 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500">
            <span class="material-symbols-outlined" style="font-size:16px">edit</span>
          </button>
        {/if}
      </div>

      <div class="px-5 py-4 border-t border-slate-100 bg-slate-50 space-y-1">
        <p class="text-xs text-slate-500">
          <span class="font-semibold text-slate-700">Exemple :</span>
          pour une commande de 10 000 XAF → frais = {fraisFixe.toLocaleString('fr-CM')} XAF →
          total payé par le client = {(10000 + fraisFixe).toLocaleString('fr-CM')} XAF
        </p>
        <p class="text-xs text-slate-400">Une modification peut prendre jusqu'à 5 minutes pour s'appliquer aux nouvelles commandes.</p>
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
                <p class="text-sm font-bold text-slate-900 font-mono">{phone.phoneNumber}</p>
                {#if phone.isPrimary}
                  <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">Principal</span>
                {/if}
              </div>
              <p class="text-xs text-slate-500">{phone.phoneLabel ?? '—'}</p>
            </div>
            <button onclick={() => demanderSuppressionPhone(phone)} disabled={actionEnCours === phone.id} title="Supprimer"
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
    {#if estSuperAdmin}
      <button onclick={() => afficherModalVille = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
        Assigner une ville
      </button>
    {:else}
      <p class="text-xs text-slate-400">L'assignation des villes est réservée au super administrateur.</p>
    {/if}
  </div>
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(4) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if cityAssignments.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">Aucune assignation de ville</p>
        {#if estSuperAdmin}
          <button onclick={() => afficherModalVille = true} class="btn-primary mt-4">Assigner la première ville</button>
        {/if}
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
              <p class="text-xs text-slate-500">Admin : {nomAdmin(assign.adminUserId)}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full {assign.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
              {assign.isEnabled ? 'Actif' : 'Inactif'}
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
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{libellesParametres[setting.key] ?? setting.key}</p>
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
    {:else}
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
          <label for="vl-admin" class="block text-xs font-semibold text-slate-600 mb-1.5">Admin responsable *</label>
          <select id="vl-admin" bind:value={formVille.adminUserId} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— Choisir un admin —</option>
            {#each admins.filter((a) => a.isActive) as a}
              <option value={a.id}>{a.fullName || a.email}{a.fullName ? ` (${a.email})` : ''}</option>
            {/each}
          </select>
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

<Modal bind:ouvert={confirmationPhone} titre="Supprimer ce numéro ?" largeur="sm">
  <div class="p-6 space-y-4">
    <p class="text-sm text-slate-600">
      Le numéro <span class="font-mono font-semibold">{phoneASupprimer?.phoneNumber}</span> ne sera plus proposé comme numéro du service client.
    </p>
    <div class="flex gap-3">
      <button onclick={() => confirmationPhone = false} class="btn-secondary flex-1">Annuler</button>
      <button onclick={() => phoneASupprimer && supprimerPhone(phoneASupprimer.id)} disabled={!phoneASupprimer || actionEnCours === phoneASupprimer?.id}
        class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
        {actionEnCours === phoneASupprimer?.id ? '...' : 'Supprimer'}
      </button>
    </div>
  </div>
</Modal>
