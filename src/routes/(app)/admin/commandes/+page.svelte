<script lang="ts">
  import { untrack } from 'svelte'
  import { page as pageApp } from '$app/stores'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import Badge, { libelleStatut, libelleService } from '$lib/components/ui/Badge.svelte'
  import { t, translate } from '$lib/stores/locale'
  import { formatOrderCode } from '$lib/reference'

  let commandes = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let chargementAction = $state<string | null>(null)

  let recherche = $state('')
  let filtreStatut = $state('')
  let filtreReseau = $state('')
  let filtreService = $state('')
  let filtreCabine = $state('')
  let nomCabineFiltre = $state('')
  let page = $state(1)
  let perPage = 20

  const peutAssigner = $derived(auth.peut('canAssignOrders'))
  const peutValiderPaiement = $derived(auth.peut('canValidatePayments'))

  // ── Modal assignation ──────────────────────────────────────────────────────
  let modalAssign        = $state(false)
  let assignOrderId      = $state<string | null>(null)
  let assignOrderCode    = $state('')
  let cabinesEnLigne     = $state<any[]>([])
  let cabineChoisie      = $state<string>('')
  let assignEnCours      = $state(false)
  let chargementCabines  = $state(false)

  async function ouvrirAssign(cmd: any) {
    if (!peutAssigner) return
    assignOrderId   = cmd.id
    assignOrderCode = cmd.orderCode ?? cmd.order_code ?? cmd.id
    cabineChoisie   = ''
    modalAssign     = true
    chargementCabines = true
    try {
      const res = await api.get('/cabins/online')
      cabinesEnLigne = res.data?.data ?? []
    } catch {
      cabinesEnLigne = []
    } finally {
      chargementCabines = false
    }
  }

  async function confirmerAssign() {
    if (!assignOrderId) return
    assignEnCours = true
    try {
      const body = cabineChoisie ? { cabinId: cabineChoisie } : {}
      await api.post(`/admin/orders/${assignOrderId}/assign`, body)
      toast.succes('Commande assignée', cabineChoisie ? 'Assignée à la cabine choisie' : 'Assignée automatiquement à la meilleure cabine disponible')
      modalAssign = false
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur assignation', e.response?.data?.message ?? 'Impossible d\'assigner')
    } finally {
      assignEnCours = false
    }
  }

  let afficherModal = $state(false)
  let nouvelleCommande = $state({
    customerPhone: '',
    recipientPhone: '',
    serviceType: 'credit',
    network: 'mtn',
    amount: '',
    packageName: '',
    paymentMethod: 'mobile_money',
    expectedPayerPhone: '',
  })

  let forfaits = $state<any[]>([])
  const forfaitsReseau = $derived(forfaits.filter((f) => f.network === nouvelleCommande.network && f.type !== 'credit'))

  async function ouvrirCreation() {
    erreurs = {}
    erreurGenerale = ''
    afficherModal = true
    if (forfaits.length === 0) {
      try {
        const res = await api.get('/packages')
        forfaits = res.data?.data ?? []
      } catch {
        forfaits = []
      }
    }
  }

  function choisirForfait(nom: string) {
    nouvelleCommande.packageName = nom
    const forfait = forfaitsReseau.find((f) => f.name === nom)
    if (forfait?.price) nouvelleCommande.amount = String(forfait.price)
  }
  let erreurs = $state<Record<string, string>>({})
  let erreurGenerale = $state('')

  const servicesDisponibles = [
    { val: 'credit',   label: 'Crédit' },
    { val: 'package',  label: 'Forfait' },
    { val: 'transfer', label: 'Transfert' },
  ]

  let creationEnCours = $state(false)

  const statuts = $derived([
    { val: '', label: $t('admin.orders.all_statuses') },
    ...[
      'pending', 'pending_admin_review', 'admin_approved', 'pending_payment', 'awaiting_payment',
      'allocated', 'assigned_to_cabin', 'in_progress', 'completed', 'returned_to_admin',
      'cancelled', 'rejected', 'payment_failed', 'payment_timeout', 'expired', 'refunded',
    ].map((val) => ({ val, label: libelleStatut(val, $t) })),
  ])

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function formaterDate(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  async function charger() {
    chargement = true
    try {
      const params: Record<string, any> = { page, per_page: perPage }
      if (filtreStatut) params.status = filtreStatut
      if (filtreReseau) params.network = filtreReseau
      if (filtreService) params.service_type = filtreService
      if (filtreCabine) params.cabin_id = filtreCabine
      const terme = recherche.trim()
      if (terme) params.search = terme

      const res = await api.get('/admin/orders', { params })
      commandes = res.data?.data ?? []
      meta = res.data?.meta ?? null
    } catch {
      toast.erreur(translate('toast.error'), translate('common.error_load'))
    } finally {
      chargement = false
    }
  }

  async function changerStatut(id: string, statut: string) {
    chargementAction = id
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: statut })
      toast.succes(translate('admin.orders.status_updated'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      chargementAction = null
    }
  }

  async function assigner(id: string) {
    chargementAction = id
    try {
      await api.post(`/admin/orders/${id}/assign`)
      toast.succes(translate('admin.orders.assigned_success'), translate('admin.orders.assign'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('admin.orders.assign_failed'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      chargementAction = null
    }
  }

  let lienPaiement = $state<string | null>(null)
  let afficherModalLien = $state(false)

  async function creerLienPaiement(id: string) {
    chargementAction = id + '_lien'
    try {
      const res = await api.post(`/admin/orders/${id}/payment-link`)
      lienPaiement = res.data?.data?.paymentUrl ?? null
      if (lienPaiement) afficherModalLien = true
      else if (res.data?.data?.confirmed) toast.succes('Paiement confirmé', 'Confirmé automatiquement (paiement en mode simulation)')
      else toast.succes('Lien de paiement généré')
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de créer le lien')
    } finally {
      chargementAction = null
    }
  }

  async function validerPaiement(id: string) {
    chargementAction = id + '_valider'
    try {
      await api.post(`/admin/orders/${id}/validate-payment`, { method: 'manual' })
      toast.succes('Paiement validé', 'La commande est maintenant approuvée')
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de valider')
    } finally {
      chargementAction = null
    }
  }

  async function creerCommande() {
    erreurs = {}
    erreurGenerale = ''
    creationEnCours = true
    try {
      const payload: any = {
        customerPhone: nouvelleCommande.customerPhone,
        recipientPhone: nouvelleCommande.recipientPhone,
        serviceType: nouvelleCommande.serviceType,
        network: nouvelleCommande.network,
        paymentMethod: nouvelleCommande.paymentMethod,
      }
      if (nouvelleCommande.amount) payload.amount = Number(nouvelleCommande.amount)
      if (nouvelleCommande.serviceType === 'package' && forfaitsReseau.some((f) => f.name === nouvelleCommande.packageName)) payload.packageName = nouvelleCommande.packageName
      if (nouvelleCommande.expectedPayerPhone) payload.expectedPayerPhone = nouvelleCommande.expectedPayerPhone

      const res = await api.post('/admin/orders', payload)
      toast.succes(translate('admin.orders.created'))
      afficherModal = false
      nouvelleCommande = { customerPhone: '', recipientPhone: '', serviceType: 'credit', network: 'mtn', amount: '', packageName: '', paymentMethod: 'mobile_money', expectedPayerPhone: '' }
      const urlPaiement = res.data?.data?.paymentUrl ?? null
      if (urlPaiement) {
        lienPaiement = urlPaiement
        afficherModalLien = true
      }
      await charger()
    } catch (e: any) {
      const liste = e.response?.data?.errors
      if (e.response?.status === 422 && Array.isArray(liste)) {
        const autres: string[] = []
        liste.forEach((err: any) => {
          const message = err.message ?? translate('common.error_save')
          if (err.field === 'customerPhone' || err.field === 'recipientPhone') erreurs[err.field] = message
          else autres.push(message)
        })
        erreurGenerale = autres.join(' · ')
      } else {
        erreurGenerale = e.response?.data?.message ?? translate('common.error_save')
      }
    } finally {
      creationEnCours = false
    }
  }

  let rechercheTimer: ReturnType<typeof setTimeout>
  function surRecherche() {
    clearTimeout(rechercheTimer)
    rechercheTimer = setTimeout(() => { page = 1; charger() }, 400)
  }

  const rechercheUrl = $derived($pageApp.url.search)
  $effect(() => {
    const q = new URLSearchParams(rechercheUrl)
    untrack(() => {
      filtreCabine = q.get('cabin') ?? ''
      const statutUrl = q.get('status')
      if (statutUrl) filtreStatut = statutUrl
      page = 1
    })
  })

  $effect(() => {
    const id = filtreCabine
    nomCabineFiltre = ''
    if (!id || !auth.peut('canManageCabins')) return
    api.get(`/cabins/${id}`)
      .then((res) => { if (filtreCabine === id) nomCabineFiltre = res.data?.data?.name ?? '' })
      .catch(() => {})
  })

  $effect(() => { filtreStatut; filtreReseau; filtreService; filtreCabine; page; charger() })
</script>

<svelte:head><title>{$t('admin.orders.title')} — {$t('common.app_name')}</title></svelte:head>

<!-- En-tête -->
<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('admin.orders.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">
      {meta ? $t('admin.orders.subtitle', { total: meta.total ?? 0 }) : $t('admin.orders.subtitle_default')}
    </p>
  </div>
  <button onclick={ouvrirCreation} class="btn-primary">
    <span class="material-symbols-outlined icon-filled" style="font-size:18px">add</span>
    {$t('admin.orders.new')}
  </button>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:16px">search</span>
      <input
        type="text"
        placeholder="Code commande, n° client ou bénéficiaire"
        title="Recherche sur une partie du code commande ou d'un numéro client/bénéficiaire"
        bind:value={recherche}
        oninput={surRecherche}
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
      />
    </div>
    <select bind:value={filtreStatut} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      {#each statuts as s}
        <option value={s.val}>{s.label}</option>
      {/each}
    </select>
    <select bind:value={filtreReseau} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">{$t('admin.orders.all_networks')}</option>
      <option value="mtn">{$t('network.mtn')}</option>
      <option value="orange">{$t('network.orange')}</option>
    </select>
    <select bind:value={filtreService} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
      <option value="">{$t('admin.orders.all_services')}</option>
      {#each servicesDisponibles as s}
        <option value={s.val}>{s.label}</option>
      {/each}
    </select>
  </div>
  {#if filtreCabine}
    <div class="mt-3 flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
        <span class="material-symbols-outlined" style="font-size:14px">store</span>
        Cabine : {nomCabineFiltre || filtreCabine.slice(0, 8)}
        <button
          onclick={() => goto(filtreStatut ? `/admin/commandes?status=${filtreStatut}` : '/admin/commandes')}
          class="ml-0.5 w-4 h-4 rounded-full hover:bg-orange-100 flex items-center justify-center"
          aria-label="Retirer le filtre cabine"
        >
          <span class="material-symbols-outlined" style="font-size:12px">close</span>
        </button>
      </span>
    </div>
  {/if}
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-2">
      {#each Array(8) as _}
        <div class="skeleton h-14 rounded-xl"></div>
      {/each}
    </div>
  {:else if commandes.length === 0}
    <div class="py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">receipt_long</span>
      </div>
      <p class="text-slate-600 font-semibold">{$t('admin.orders.no_results')}</p>
      <p class="text-slate-400 text-sm mt-1">{$t('admin.orders.no_results_hint')}</p>
    </div>
  {:else}
    <!-- En-tête tableau desktop -->
    <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-1">{$t('admin.orders.col_code')}</div>
      <div class="col-span-2">{$t('admin.orders.col_client')}</div>
      <div class="col-span-2">{$t('admin.orders.col_recipient')}</div>
      <div class="col-span-1">{$t('admin.orders.col_network')}</div>
      <div class="col-span-2">{$t('admin.orders.col_amount')}</div>
      <div class="col-span-1">{$t('admin.orders.col_service')}</div>
      <div class="col-span-2">{$t('admin.orders.col_status')}</div>
      <div class="col-span-1">{$t('admin.orders.col_actions')}</div>
    </div>
    <div class="divide-y divide-slate-50">
      {#each commandes as cmd}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
          <!-- Code -->
          <div class="lg:col-span-1">
            <a href="/admin/commandes/{cmd.id}" class="text-xs font-mono text-orange-600 hover:text-orange-700 font-semibold">
              {formatOrderCode(cmd.orderCode, cmd.order_code, cmd.id)}
            </a>
          </div>
          <!-- Client -->
          <div class="lg:col-span-2 flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 gradient-brand">
              {(cmd.customerPhone ?? '?').slice(-2)}
            </div>
            <span class="text-sm text-slate-700 truncate">{cmd.customerPhone ?? '—'}</span>
          </div>
          <!-- Destinataire -->
          <div class="lg:col-span-2">
            <span class="text-sm text-slate-500">{cmd.recipientPhone ?? '—'}</span>
          </div>
          <!-- Réseau -->
          <div class="lg:col-span-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full shrink-0" style="background:{cmd.network==='mtn'?'#fbbf24':cmd.network==='orange'?'#f97316':'#94a3b8'}"></span>
            <span class="text-xs font-semibold text-slate-600 uppercase">{cmd.network ?? '—'}</span>
          </div>
          <!-- Montant -->
          <div class="lg:col-span-2">
            <span class="text-sm font-bold text-slate-900">{cmd.amount ? formaterMontant(cmd.amount) : '—'}</span>
          </div>
          <!-- Service -->
          <div class="lg:col-span-1">
            <span class="text-xs text-slate-500">{libelleService(cmd.serviceType)}</span>
          </div>
          <!-- Statut -->
          <div class="lg:col-span-2">
            <Badge statut={cmd.status ?? 'pending'} />
          </div>
          <!-- Actions -->
          <div class="lg:col-span-1 flex items-center gap-1 flex-wrap">
            <a href="/admin/commandes/{cmd.id}" class="w-7 h-7 rounded-lg hover:bg-orange-50 flex items-center justify-center text-slate-400 hover:text-orange-500" title={$t('common.view')}>
              <span class="material-symbols-outlined" style="font-size:16px">open_in_new</span>
            </a>
            {#if peutAssigner && ['pending_admin_review', 'admin_approved', 'returned_to_admin'].includes(cmd.status)}
              <button
                onclick={() => ouvrirAssign(cmd)}
                disabled={!!chargementAction}
                class="flex items-center gap-1 px-2 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold disabled:opacity-50 transition-all"
                title="Assigner à une cabine"
              >
                <span class="material-symbols-outlined" style="font-size:14px">assignment_ind</span>
                Assigner
              </button>
            {/if}
            {#if ['pending', 'pending_admin_review', 'awaiting_payment'].includes(cmd.status) && cmd.amount && !cmd.paymentVerified}
              <button
                onclick={() => creerLienPaiement(cmd.id)}
                disabled={!!chargementAction}
                class="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 disabled:opacity-50"
                title="Créer lien de paiement"
              >
                {#if chargementAction === cmd.id + '_lien'}
                  <span class="w-3 h-3 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined" style="font-size:16px">link</span>
                {/if}
              </button>
            {/if}
            {#if peutValiderPaiement && cmd.status === 'awaiting_payment'}
              <button
                onclick={() => validerPaiement(cmd.id)}
                disabled={!!chargementAction}
                class="w-7 h-7 rounded-lg hover:bg-green-50 flex items-center justify-center text-slate-400 hover:text-green-600 disabled:opacity-50"
                title="Valider paiement reçu"
              >
                {#if chargementAction === cmd.id + '_valider'}
                  <span class="w-3 h-3 border-2 border-green-300 border-t-green-600 rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
                {/if}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">
          {$t('common.page_of', { current: meta.currentPage, total: meta.lastPage })}
        </p>
        <div class="flex gap-2">
          <button
            onclick={() => page--}
            disabled={page <= 1}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← {$t('common.previous')}
          </button>
          <button
            onclick={() => page++}
            disabled={page >= meta.lastPage}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {$t('common.next')} →
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- ── Modal Assignation ──────────────────────────────────────────────────── -->
{#if modalAssign}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md animate-fade-in-up border border-slate-200" style="box-shadow:0 25px 60px rgba(0,0,0,0.18)">

      <!-- En-tête -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">assignment_ind</span>
            Assigner la commande
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">#{assignOrderCode}</p>
        </div>
        <button onclick={() => modalAssign = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>

      <div class="p-6 space-y-4">

        <!-- Cabines disponibles -->
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cabines en ligne</p>

          {#if chargementCabines}
            <div class="space-y-2">
              {#each Array(3) as _}
                <div class="h-14 bg-slate-100 rounded-xl animate-pulse"></div>
              {/each}
            </div>

          {:else if cabinesEnLigne.length === 0}
            <!-- Aucune cabine connectée — assignation auto -->
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <span class="material-symbols-outlined text-amber-500 shrink-0 mt-0.5" style="font-size:18px">warning</span>
              <div>
                <p class="text-sm font-semibold text-amber-800">Aucune cabine connectée</p>
                <p class="text-xs text-amber-600 mt-0.5">Vous pouvez tout de même assigner automatiquement : le système choisit la meilleure cabine éligible (active, abonnement valide, quota disponible), même hors ligne. Sans action, une commande en révision est assignée automatiquement après 5 minutes.</p>
              </div>
            </div>

          {:else}
            <!-- Liste des cabines -->
            <div class="space-y-2">
              <!-- Option : assignation auto -->
              <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                {cabineChoisie === '' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}">
                <input type="radio" bind:group={cabineChoisie} value="" class="accent-blue-500 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800">Meilleure cabine automatique</p>
                  <p class="text-xs text-slate-400">Le système choisit selon performance et charge</p>
                </div>
                <span class="material-symbols-outlined text-blue-400" style="font-size:16px">auto_awesome</span>
              </label>

              {#each cabinesEnLigne as cabin}
                {@const slotPct = Math.round((cabin.dailyOrdersCount / Math.max(1, cabin.maxDailyOrders)) * 100)}
                <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                  {cabineChoisie === cabin.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}">
                  <input type="radio" bind:group={cabineChoisie} value={cabin.id} class="accent-emerald-500 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-semibold text-slate-800 truncate">{cabin.name}</p>
                      <!-- Indicateur en ligne -->
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      {#if cabin.network}
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0
                          {cabin.network === 'mtn' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}">
                          {cabin.network.toUpperCase()}
                        </span>
                      {/if}
                    </div>
                    <!-- Barre de charge -->
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full rounded-full {slotPct >= 80 ? 'bg-red-400' : slotPct >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}"
                          style="width:{slotPct}%"></div>
                      </div>
                      <span class="text-[10px] text-slate-400 shrink-0">{cabin.dailyOrdersCount}/{cabin.maxDailyOrders}</span>
                    </div>
                  </div>
                  {#if cabin.activeOrders > 0}
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">{cabin.activeOrders} en cours</span>
                  {:else}
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">Libre</span>
                  {/if}
                </label>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => modalAssign = false} class="btn-secondary flex-1">
            Annuler
          </button>
          <button
            onclick={confirmerAssign}
            disabled={assignEnCours}
            class="btn-primary flex-1 justify-center"
          >
            {#if assignEnCours}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">assignment_ind</span>
            {/if}
            {cabineChoisie ? 'Assigner à cette cabine' : 'Assigner automatiquement'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal lien de paiement -->
{#if afficherModalLien && lienPaiement}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4" style="background:rgba(0,0,0,0.4)">
    <div class="bg-white rounded-2xl w-full max-w-md animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900 flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:20px">link</span>
          Lien de paiement
        </h3>
        <button onclick={() => afficherModalLien = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-slate-600">Partagez ce lien au client pour qu'il puisse effectuer son paiement.</p>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
          <p class="text-xs font-mono text-slate-700 flex-1 break-all">{lienPaiement}</p>
          <button
            onclick={() => { navigator.clipboard.writeText(lienPaiement!); toast.succes('Lien copié') }}
            class="shrink-0 w-8 h-8 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100 flex items-center justify-center"
            title="Copier"
          >
            <span class="material-symbols-outlined" style="font-size:16px">content_copy</span>
          </button>
        </div>
        <button onclick={() => afficherModalLien = false} class="btn-primary w-full justify-center">Fermer</button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal création commande -->
{#if afficherModal}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.orders.modal_title')}</h3>
        <button onclick={() => afficherModal = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={(e) => { e.preventDefault(); creerCommande() }} class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="customer-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.orders.customer_phone')} *</label>
            <input id="customer-phone" type="tel" bind:value={nouvelleCommande.customerPhone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.customerPhone ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.customerPhone}<p class="text-red-500 text-xs mt-1">{erreurs.customerPhone}</p>{/if}
          </div>
          <div>
            <label for="recipient-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.orders.recipient_phone')} *</label>
            <input id="recipient-phone" type="tel" bind:value={nouvelleCommande.recipientPhone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border text-sm {erreurs.recipientPhone ? 'border-red-400' : 'border-slate-200'}" required />
            {#if erreurs.recipientPhone}<p class="text-red-500 text-xs mt-1">{erreurs.recipientPhone}</p>{/if}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="service-type" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.orders.service_type')} *</label>
            <select id="service-type" bind:value={nouvelleCommande.serviceType} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              {#each servicesDisponibles as s}
                <option value={s.val}>{s.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="network" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.network')} *</label>
            <select id="network" bind:value={nouvelleCommande.network} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="mtn">{$t('network.mtn')}</option>
              <option value="orange">{$t('network.orange')}</option>
            </select>
          </div>
        </div>
        {#if nouvelleCommande.serviceType === 'package'}
          <div>
            <label for="package-name" class="block text-xs font-semibold text-slate-600 mb-1.5">Forfait</label>
            <select id="package-name" value={nouvelleCommande.packageName} onchange={(e) => choisirForfait((e.target as HTMLSelectElement).value)} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">Choisir un forfait</option>
              {#each forfaitsReseau as f}
                <option value={f.name}>{f.name} — {formaterMontant(f.price)}</option>
              {/each}
            </select>
          </div>
        {/if}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="amount" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.amount')} (XAF)</label>
            <input id="amount" type="number" bind:value={nouvelleCommande.amount} placeholder="5000" min="100" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="payment-method" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.orders.payment_method')}</label>
            <select id="payment-method" bind:value={nouvelleCommande.paymentMethod} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="mobile_money">{$t('admin.orders.payment.mobile_money')}</option>
              <option value="cash">{$t('admin.orders.payment.cash')}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="expected-payer-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.orders.expected_payer')}</label>
          <input id="expected-payer-phone" type="tel" bind:value={nouvelleCommande.expectedPayerPhone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        {#if erreurGenerale}
          <p class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erreurGenerale}</p>
        {/if}
        <div class="flex gap-3 pt-2">
          <button type="button" onclick={() => afficherModal = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button type="submit" disabled={creationEnCours} class="btn-primary flex-1 justify-center">
            {#if creationEnCours}
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
