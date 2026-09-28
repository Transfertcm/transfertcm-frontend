<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge, { libelleStatut, libelleService } from '$lib/components/ui/Badge.svelte'

  const id = $derived($page.params.id)

  let commande = $state<any>(null)
  let chargement = $state(true)
  let actionEnCours = $state('')

  // Modals
  let afficherModalStatut = $state(false)
  let afficherModalPaiement = $state(false)
  let afficherModalRemboursement = $state(false)
  let afficherModalScores = $state(false)

  // Formulaires
  let nouveauStatut = $state('')
  let raisonStatut = $state('')
  let transactionId = $state('')
  let notesPaiement = $state('')
  let raisonRemboursement = $state('')
  let scores = $state<any[]>([])

  let lienPaiement = $state<string | null>(null)
  let afficherModalLien = $state(false)

  const transitionsAutorisees: Record<string, string[]> = {
    pending_admin_review: ['admin_approved', 'rejected', 'assigned_to_cabin'],
    admin_approved:       ['assigned_to_cabin', 'awaiting_payment', 'rejected'],
    assigned_to_cabin:    ['in_progress', 'returned_to_admin', 'cancelled'],
    awaiting_payment:     ['in_progress', 'payment_failed', 'payment_timeout', 'cancelled'],
    in_progress:          ['completed', 'returned_to_admin', 'cancelled'],
    returned_to_admin:    ['assigned_to_cabin', 'rejected', 'cancelled'],
  }

  const statutsDisponibles = $derived(
    (transitionsAutorisees[commande?.status] ?? []).map((val) => ({ val, label: libelleStatut(val) }))
  )

  const libellesMethodes: Record<string, string> = {
    mobile_money: 'Mobile Money',
    orange_money: 'Orange Money',
    mtn_money: 'MTN MoMo',
    wallet: 'Portefeuille',
    cash: 'Espèces',
    virement: 'Virement',
    mock: 'Simulation (test)',
    notchpay: 'NotchPay',
    cinetpay: 'CinetPay',
    moneyfusion: 'MoneyFusion',
  }

  const libellesTypesCabine: Record<string, string> = { basic: 'Basique', standard: 'Standard', premium: 'Premium' }

  function libelleMethode(m: string | null | undefined) {
    if (!m) return '—'
    return libellesMethodes[m] ?? m
  }

  function pourcentage(n: any) {
    const num = Number(n)
    return isNaN(num) ? '—' : Math.round(num * 100) + ' %'
  }

  function copierLien(url: string) {
    navigator.clipboard.writeText(url)
    toast.succes('Lien copié')
  }

  const peutAssigner = $derived(
    !!commande && !commande.cabinId && ['pending_admin_review', 'admin_approved', 'returned_to_admin'].includes(commande.status)
  )
  const peutCreerLien = $derived(
    !!commande && !!commande.amount && !commande.paymentVerified &&
    ['pending', 'pending_admin_review', 'awaiting_payment', 'pending_payment'].includes(commande.status)
  )

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function charger() {
    chargement = true
    try {
      const res = await api.get(`/admin/orders/${id}`)
      commande = res.data?.data ?? res.data
    } catch {
      toast.erreur('Erreur', 'Commande introuvable')
      goto('/admin/commandes')
    } finally {
      chargement = false
    }
  }

  async function changerStatut() {
    if (!nouveauStatut) return
    actionEnCours = 'statut'
    try {
      await api.patch(`/admin/orders/${id}/status`, {
        status: nouveauStatut,
        reason: raisonStatut || undefined,
      })
      toast.succes('Statut mis à jour')
      afficherModalStatut = false
      raisonStatut = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de mettre à jour')
    } finally {
      actionEnCours = ''
    }
  }

  async function assigner() {
    actionEnCours = 'assigner'
    try {
      await api.post(`/admin/orders/${id}/assign`)
      toast.succes('Commande assignée', 'La cabine a été sélectionnée automatiquement')
      await charger()
    } catch (e: any) {
      toast.erreur('Assignation échouée', e.response?.data?.message ?? 'Aucune cabine disponible')
    } finally {
      actionEnCours = ''
    }
  }

  async function creerLienPaiement() {
    actionEnCours = 'lien'
    try {
      const res = await api.post(`/admin/orders/${id}/payment-link`)
      const url = res.data?.data?.paymentUrl ?? null
      if (url) {
        lienPaiement = url
        afficherModalLien = true
      } else if (res.data?.data?.confirmed) {
        toast.succes('Paiement confirmé', 'Confirmé automatiquement (paiement en mode simulation)')
      } else {
        toast.succes('Lien de paiement généré')
      }
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de créer le lien')
    } finally {
      actionEnCours = ''
    }
  }

  async function validerPaiement() {
    actionEnCours = 'valider'
    try {
      await api.post(`/admin/orders/${id}/validate-payment`, {
        transactionId: transactionId || undefined,
        notes: notesPaiement || undefined,
      })
      toast.succes('Paiement validé manuellement')
      afficherModalPaiement = false
      transactionId = ''
      notesPaiement = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de valider')
    } finally {
      actionEnCours = ''
    }
  }

  async function rembourser() {
    actionEnCours = 'rembourser'
    try {
      await api.post(`/admin/orders/${id}/refund`, { reason: raisonRemboursement })
      toast.succes('Commande remboursée')
      afficherModalRemboursement = false
      raisonRemboursement = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de rembourser')
    } finally {
      actionEnCours = ''
    }
  }

  async function voirScores() {
    actionEnCours = 'scores'
    try {
      const res = await api.get(`/admin/orders/${id}/cabin-scores`)
      scores = res.data?.data ?? []
      afficherModalScores = true
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de charger les scores')
    } finally {
      actionEnCours = ''
    }
  }

  onMount(charger)
</script>

<svelte:head><title>Commande #{commande?.orderCode ?? id} — TransfertCM Admin</title></svelte:head>

<!-- En-tête -->
<div class="mb-6 flex items-start justify-between flex-wrap gap-3">
  <div class="flex items-center gap-3">
    <a href="/admin/commandes" class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
      <span class="material-symbols-outlined" style="font-size:20px">arrow_back</span>
    </a>
    <div>
      <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">
        Commande <span class="text-orange-500 font-mono">#{commande?.orderCode ?? (id as string).slice(-8)}</span>
      </h2>
      <p class="text-sm text-slate-500 mt-0.5">{formaterDate(commande?.timestamp ?? commande?.createdAt)}</p>
    </div>
  </div>
  {#if commande}
    <div class="flex items-center gap-2 flex-wrap">
      <Badge statut={commande.status} />
      {#if statutsDisponibles.length > 0}
        <button onclick={() => { nouveauStatut = statutsDisponibles[0]?.val ?? ''; afficherModalStatut = true }} class="btn-secondary">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">edit</span>
          Changer statut
        </button>
      {/if}
      {#if peutAssigner}
        <button onclick={assigner} disabled={actionEnCours === 'assigner'} class="btn-primary">
          {#if actionEnCours === 'assigner'}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size:16px">assignment_ind</span>
          {/if}
          Assigner
        </button>
        <button onclick={voirScores} disabled={actionEnCours === 'scores'} class="btn-secondary">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">leaderboard</span>
          Scores cabines
        </button>
      {/if}
      {#if peutCreerLien}
        <button onclick={creerLienPaiement} disabled={actionEnCours === 'lien'} class="btn-secondary">
          {#if actionEnCours === 'lien'}
            <span class="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"></span>
          {:else}
            <span class="material-symbols-outlined icon-filled" style="font-size:16px">link</span>
          {/if}
          Lien paiement
        </button>
      {/if}
      {#if commande.status === 'awaiting_payment' || commande.status === 'pending_payment'}
        <button onclick={() => afficherModalPaiement = true} class="btn-secondary">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">verified</span>
          Valider paiement
        </button>
      {/if}
      {#if ['completed', 'in_progress'].includes(commande.status)}
        <button onclick={() => afficherModalRemboursement = true} class="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">currency_exchange</span>
          Rembourser
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if chargement}
  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">
    <div class="lg:col-span-2 space-y-5">
      <div class="skeleton h-48 rounded-2xl"></div>
      <div class="skeleton h-40 rounded-2xl"></div>
    </div>
    <div class="space-y-5">
      <div class="skeleton h-40 rounded-2xl"></div>
      <div class="skeleton h-32 rounded-2xl"></div>
    </div>
  </div>
{:else if commande}
  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">

    <!-- Colonne principale -->
    <div class="lg:col-span-2 space-y-5">

      <!-- Infos service -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">receipt_long</span>
          </div>
          <h3 class="font-bold text-slate-900">Détails du service</h3>
        </div>
        <div class="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Service</p>
            <p class="text-sm font-semibold text-slate-800">{libelleService(commande.serviceType)}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Réseau</p>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background:{commande.network==='mtn'?'#fbbf24':'#f97316'}"></span>
              <p class="text-sm font-semibold text-slate-800 uppercase">{commande.network ?? '—'}</p>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Montant</p>
            <p class="text-sm font-bold text-slate-900">{formaterMontant(commande.amount)}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Frais</p>
            <p class="text-sm font-semibold text-slate-700">{formaterMontant(commande.transactionFees ?? commande.transaction_fees)}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total avec frais</p>
            <p class="text-sm font-bold text-orange-600">{formaterMontant(commande.totalAmountWithFees ?? commande.total_amount_with_fees)}</p>
          </div>
          {#if commande.packageName ?? commande.package_name}
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Forfait</p>
              <p class="text-sm font-semibold text-slate-800">{commande.packageName ?? commande.package_name}</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Parties -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">people</span>
          </div>
          <h3 class="font-bold text-slate-900">Parties impliquées</h3>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
              {(commande.customerPhone ?? '?').slice(-2)}
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium">Client</p>
              <p class="text-sm font-bold text-slate-900 font-mono">{commande.customerPhone ?? '—'}</p>
              {#if commande.expectedPayerPhone ?? commande.expected_payer_phone}
                <p class="text-xs text-slate-500 mt-0.5">Payeur : {commande.expectedPayerPhone ?? commande.expected_payer_phone}</p>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div class="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 text-sm font-bold shrink-0">
              {(commande.recipientPhone ?? '?').slice(-2)}
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium">Destinataire</p>
              <p class="text-sm font-bold text-slate-900 font-mono">{commande.recipientPhone ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Paiement -->
      {#if commande.payment}
        {@const pmt = commande.payment}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:18px">payments</span>
            </div>
            <h3 class="font-bold text-slate-900">Paiement</h3>
            <span class="ml-auto">
              <Badge statut={pmt.status ?? 'pending'} />
            </span>
          </div>
          <div class="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Méthode</p>
              <p class="text-sm font-semibold text-slate-800">{libelleMethode(pmt.paymentMethod)}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Montant</p>
              <p class="text-sm font-bold text-slate-900">{formaterMontant(pmt.amount)}</p>
            </div>
            {#if pmt.gatewayReference ?? pmt.gateway_reference}
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Réf. passerelle</p>
                <p class="text-xs font-mono text-slate-700 break-all">{pmt.gatewayReference ?? pmt.gateway_reference}</p>
              </div>
            {/if}
            {#if pmt.gatewayTransactionId ?? pmt.gateway_transaction_id}
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">ID transaction</p>
                <p class="text-xs font-mono text-slate-700 break-all">{pmt.gatewayTransactionId ?? pmt.gateway_transaction_id}</p>
              </div>
            {/if}
            {#if pmt.clientConfirmedAt ?? pmt.client_confirmed_at}
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Confirmé le</p>
                <p class="text-xs text-slate-700">{formaterDate(pmt.clientConfirmedAt ?? pmt.client_confirmed_at)}</p>
              </div>
            {/if}
            {#if pmt.cabinValidatedAt ?? pmt.cabin_validated_at}
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Validé cabine</p>
                <p class="text-xs text-slate-700">{formaterDate(pmt.cabinValidatedAt ?? pmt.cabin_validated_at)}</p>
              </div>
            {/if}
          </div>
          {#if commande.paymentGatewayUrl}
            <div class="px-5 pb-5 flex items-center gap-3 flex-wrap">
              <a href={commande.paymentGatewayUrl} target="_blank" rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm text-orange-600 font-semibold hover:text-orange-700">
                <span class="material-symbols-outlined icon-filled" style="font-size:16px">open_in_new</span>
                Voir le lien de paiement
              </a>
              <button onclick={() => copierLien(commande.paymentGatewayUrl)}
                class="inline-flex items-center gap-1.5 text-sm text-slate-500 font-semibold hover:text-slate-700">
                <span class="material-symbols-outlined" style="font-size:16px">content_copy</span>
                Copier
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Colonne latérale -->
    <div class="space-y-5">

      <!-- Cabine assignée -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">store</span>
          </div>
          <h3 class="font-bold text-slate-900">Cabine</h3>
        </div>
        {#if commande.cabin}
          {@const cab = commande.cabin}
          <div class="p-5 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">store</span>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">{cab.name ?? '—'}</p>
                <p class="text-xs text-slate-500">{cab.managerName ?? cab.manager_name ?? '—'}</p>
              </div>
            </div>
            <div class="space-y-2 text-xs">
              {#if cab.phone}
                <div class="flex items-center gap-2 text-slate-600">
                  <span class="material-symbols-outlined" style="font-size:14px">phone</span>
                  <span class="font-mono">{cab.phone}</span>
                </div>
              {/if}
              {#if cab.city}
                <div class="flex items-center gap-2 text-slate-600">
                  <span class="material-symbols-outlined" style="font-size:14px">location_on</span>
                  <span>{cab.city}</span>
                </div>
              {/if}
              {#if cab.type}
                <div class="flex items-center gap-2 text-slate-600">
                  <span class="material-symbols-outlined" style="font-size:14px">grade</span>
                  <span>{libellesTypesCabine[cab.type] ?? cab.type}</span>
                </div>
              {/if}
            </div>
            <a href="/admin/cabines/{cab.id}" class="block text-center text-xs text-orange-500 font-semibold hover:text-orange-600 mt-2">
              Voir la cabine →
            </a>
          </div>
        {:else}
          <div class="p-5 text-center">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <span class="material-symbols-outlined text-slate-400" style="font-size:20px">store</span>
            </div>
            <p class="text-sm text-slate-500">Aucune cabine assignée</p>
          </div>
        {/if}
      </div>

      <!-- Chronologie -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">timeline</span>
          </div>
          <h3 class="font-bold text-slate-900">Chronologie</h3>
        </div>
        <div class="p-5 space-y-3">
          {#each [
            { label: 'Créée', date: commande.timestamp, icone: 'add_circle', couleur: 'text-slate-400' },
            { label: 'Lien de paiement créé', date: commande.paymentLinkCreatedAt, icone: 'link', couleur: 'text-amber-500' },
            { label: 'Paiement demandé', date: commande.paymentRequestedAt, icone: 'payments', couleur: 'text-amber-500' },
            { label: 'Payée', date: commande.paidAt, icone: 'check_circle', couleur: 'text-emerald-500' },
            { label: 'Assignée à une cabine', date: commande.allocatedAt, icone: 'assignment_ind', couleur: 'text-blue-500' },
            { label: 'Complétée', date: commande.completedAt, icone: 'task_alt', couleur: 'text-emerald-600' },
            { label: 'Annulée', date: commande.cancelledAt, icone: 'cancel', couleur: 'text-red-500' },
            { label: 'Remboursée', date: commande.refundedAt, icone: 'currency_exchange', couleur: 'text-teal-500' },
          ].filter(e => e.date) as evt}
            <div class="flex items-start gap-2.5">
              <span class="material-symbols-outlined icon-filled {evt.couleur} shrink-0 mt-0.5" style="font-size:16px">{evt.icone}</span>
              <div>
                <p class="text-xs font-semibold text-slate-700">{evt.label}</p>
                <p class="text-xs text-slate-400">{formaterDate(evt.date)}</p>
              </div>
            </div>
          {/each}
          {#if commande.cancellationReason}
            <div class="mt-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <p class="text-xs font-semibold text-red-700 mb-0.5">Raison d'annulation</p>
              <p class="text-xs text-red-600">{commande.cancellationReason}</p>
            </div>
          {/if}
          {#if commande.returnReason}
            <div class="mt-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <p class="text-xs font-semibold text-purple-700 mb-0.5">Motif du retour</p>
              <p class="text-xs text-purple-600">{commande.returnReason}</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Méthode de paiement -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Infos paiement</p>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Méthode</span>
            <span class="font-semibold text-slate-800">{libelleMethode(commande.paymentMethod)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Vérifié</span>
            <span class="font-semibold {commande.paymentVerified ?? commande.payment_verified ? 'text-emerald-600' : 'text-slate-400'}">
              {commande.paymentVerified ?? commande.payment_verified ? 'Oui' : 'Non'}
            </span>
          </div>
          {#if commande.paymentReference ?? commande.payment_reference}
            <div class="flex justify-between gap-2">
              <span class="text-slate-500 shrink-0">Référence</span>
              <span class="font-mono text-xs text-slate-700 text-right break-all">{commande.paymentReference ?? commande.payment_reference}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Changer statut -->
{#if afficherModalStatut}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Changer le statut</h3>
        <button onclick={() => afficherModalStatut = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="nouveau-statut" class="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau statut</label>
          <select id="nouveau-statut" bind:value={nouveauStatut} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            {#each statutsDisponibles as s}
              <option value={s.val}>{s.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="raison-statut" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison (optionnel)</label>
          <textarea id="raison-statut" bind:value={raisonStatut} rows="2" placeholder="Motif du changement..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalStatut = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={changerStatut} disabled={!nouveauStatut || actionEnCours === 'statut'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'statut'}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              Confirmer
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Valider paiement -->
{#if afficherModalPaiement}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Valider le paiement manuellement</h3>
        <button onclick={() => afficherModalPaiement = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Cette action marque le paiement comme validé manuellement par un administrateur.
        </p>
        <div>
          <label for="transaction-id" class="block text-xs font-semibold text-slate-600 mb-1.5">ID de transaction (optionnel)</label>
          <input id="transaction-id" type="text" bind:value={transactionId} placeholder="Ex: TXN123456" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="notes-paiement" class="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
          <textarea id="notes-paiement" bind:value={notesPaiement} rows="2" placeholder="Notes de validation..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalPaiement = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={validerPaiement} disabled={actionEnCours === 'valider'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'valider'}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">verified</span>
              Valider
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Remboursement -->
{#if afficherModalRemboursement}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-red-700">Rembourser la commande</h3>
        <button onclick={() => afficherModalRemboursement = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Cette action est irréversible. Le client sera remboursé du montant de la commande.
        </p>
        <div>
          <label for="raison-remboursement" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison du remboursement *</label>
          <textarea id="raison-remboursement" bind:value={raisonRemboursement} rows="3" placeholder="Expliquez la raison du remboursement..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" required></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalRemboursement = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={rembourser} disabled={!raisonRemboursement || actionEnCours === 'rembourser'} class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === 'rembourser'}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">currency_exchange</span>
              Rembourser
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Scores cabines -->
{#if afficherModalScores}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Scores des cabines éligibles</h3>
        <button onclick={() => afficherModalScores = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="max-h-96 overflow-y-auto">
        {#if scores.length === 0}
          <div class="py-12 text-center text-slate-400">
            <span class="material-symbols-outlined" style="font-size:32px">store_mall_directory</span>
            <p class="text-sm mt-2">Aucune cabine éligible</p>
          </div>
        {:else}
          <div class="divide-y divide-slate-50">
            {#each scores as s, i}
              <div class="flex items-center gap-4 px-6 py-3.5">
                <span class="text-lg font-black {i === 0 ? 'text-orange-500' : 'text-slate-300'} w-6 text-center">#{i + 1}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800">{s.cabinName ?? '—'}</p>
                  <p class="text-xs text-slate-400">Complétion {pourcentage(s.completionRate)} · Charge {pourcentage(s.loadRatio)}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-900">{pourcentage(s.score)}</p>
                  <p class="text-xs text-slate-400">score</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="px-6 py-4 border-t border-slate-100">
        <button onclick={() => { afficherModalScores = false; assigner() }} disabled={scores.length === 0} class="btn-primary w-full justify-center disabled:opacity-50">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">assignment_ind</span>
          Assigner automatiquement
        </button>
      </div>
    </div>
  </div>
{/if}

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
            onclick={() => copierLien(lienPaiement!)}
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
