<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import StatCard from '$lib/components/ui/StatCard.svelte'

  const id = $derived($page.params.id)

  let cabine = $state<any>(null)
  let stats = $state<any>(null)
  let chargement = $state(true)
  let actionEnCours = $state('')

  // Modals
  let afficherModalSuspendre = $state(false)
  let afficherModalPause = $state(false)
  let afficherModalUV = $state(false)
  let afficherModalEditer = $state(false)
  let afficherModalActiverAbo = $state(false)
  let afficherModalDocument = $state(false)

  // Document identity
  let idCard = $state<any>(null)
  let motifRejet = $state('')
  let chargementDoc = $state(false)

  // Formulaires
  let raisonSuspension = $state('')
  let raisonPause = $state('')
  let deltaUV = $state(0)
  let descriptionUV = $state('')
  let durationMois = $state(1)
  let form = $state<any>({})

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  async function chargerDocument() {
    try {
      const res = await api.get(`/cabins/${id}/id-card`)
      idCard = res.data?.data ?? null
    } catch {
      idCard = null
    }
  }

  async function reviewDocument(action: 'approve' | 'reject') {
    if (action === 'reject' && !motifRejet.trim()) return
    chargementDoc = true
    try {
      await api.post(`/cabins/${id}/id-card/review`, {
        action,
        reason: action === 'reject' ? motifRejet.trim() : undefined,
      })
      toast.succes(action === 'approve' ? 'Document approuvé' : 'Document rejeté')
      afficherModalDocument = false
      motifRejet = ''
      await chargerDocument()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de traiter le document')
    } finally {
      chargementDoc = false
    }
  }

  async function charger() {
    chargement = true
    try {
      const [cabRes, statsRes] = await Promise.all([
        api.get(`/cabins/${id}`),
        api.get(`/cabins/${id}/stats`).catch(() => ({ data: null })),
      ])
      cabine = cabRes.data?.data ?? cabRes.data
      stats = statsRes.data?.data ?? null
      form = {
        name: cabine.name, managerName: cabine.managerName ?? cabine.manager_name,
        email: cabine.email, phone: cabine.phone, city: cabine.city,
        location: cabine.location, type: cabine.type,
        mtnNumber: cabine.mtnNumber ?? cabine.mtn_number,
        orangeNumber: cabine.orangeNumber ?? cabine.orange_number,
        maxDailyOrders: cabine.maxDailyOrders ?? cabine.max_daily_orders,
        maxOrderAmount: cabine.maxOrderAmount ?? cabine.max_order_amount,
      }
    } catch {
      toast.erreur('Erreur', 'Cabine introuvable')
      goto('/admin/cabines')
    } finally {
      chargement = false
    }
  }

  async function suspendre() {
    if (!raisonSuspension) return
    actionEnCours = 'suspendre'
    try {
      await api.post(`/cabins/${id}/suspend`, { reason: raisonSuspension })
      toast.succes('Cabine suspendue')
      afficherModalSuspendre = false
      raisonSuspension = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de suspendre')
    } finally { actionEnCours = '' }
  }

  async function reactiver() {
    actionEnCours = 'reactiver'
    try {
      await api.post(`/cabins/${id}/reactivate`)
      toast.succes('Cabine réactivée')
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de réactiver')
    } finally { actionEnCours = '' }
  }

  async function mettreEnPause() {
    if (!raisonPause) return
    actionEnCours = 'pause'
    try {
      await api.post(`/cabins/${id}/pause`, { reason: raisonPause })
      toast.succes('Cabine mise en pause')
      afficherModalPause = false
      raisonPause = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de mettre en pause')
    } finally { actionEnCours = '' }
  }

  async function reprendre() {
    actionEnCours = 'reprendre'
    try {
      await api.post(`/cabins/${id}/resume`)
      toast.succes('Cabine reprise')
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de reprendre')
    } finally { actionEnCours = '' }
  }

  async function ajusterUV() {
    if (!deltaUV) return
    actionEnCours = 'uv'
    try {
      await api.patch(`/cabins/${id}/uv-balance`, { delta: Number(deltaUV), description: descriptionUV })
      toast.succes('Solde UV mis à jour')
      afficherModalUV = false
      deltaUV = 0
      descriptionUV = ''
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'ajuster')
    } finally { actionEnCours = '' }
  }

  async function activerAbonnement() {
    actionEnCours = 'activer-abo'
    try {
      await api.post(`/cabins/${id}/activate-subscription`, { durationMonths: durationMois })
      toast.succes('Abonnement activé')
      afficherModalActiverAbo = false
      durationMois = 1
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible d\'activer')
    } finally { actionEnCours = '' }
  }

  async function sauvegarder() {
    actionEnCours = 'editer'
    try {
      await api.put(`/cabins/${id}`, form)
      toast.succes('Cabine mise à jour')
      afficherModalEditer = false
      await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { actionEnCours = '' }
  }

  onMount(async () => {
    await charger()
    await chargerDocument()
  })
</script>

<svelte:head><title>{cabine?.name ?? 'Cabine'} — TransfertCM Admin</title></svelte:head>

<!-- En-tête -->
<div class="mb-6 flex items-start justify-between flex-wrap gap-3">
  <div class="flex items-center gap-3">
    <a href="/admin/cabines" class="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
      <span class="material-symbols-outlined" style="font-size:20px">arrow_back</span>
    </a>
    <div>
      <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">
        {cabine?.name ?? '…'}
      </h2>
      <p class="text-sm text-slate-500 mt-0.5">{cabine?.city ?? ''} · {cabine?.managerName ?? cabine?.manager_name ?? ''}</p>
    </div>
  </div>
  {#if cabine}
    <div class="flex items-center gap-2 flex-wrap">
      <Badge statut={cabine.status ?? 'inactive'} />
      <button onclick={() => afficherModalEditer = true} class="btn-secondary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">edit</span>
        Modifier
      </button>
      <button onclick={() => afficherModalUV = true} class="btn-secondary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">bolt</span>
        Ajuster UV
      </button>
      {#if cabine.status === 'active'}
        {#if cabine.paused}
          <button onclick={reprendre} disabled={actionEnCours === 'reprendre'} class="btn-secondary">
            {#if actionEnCours === 'reprendre'}<span class="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">play_arrow</span>
            {/if}
            Reprendre
          </button>
        {:else}
          <button onclick={() => afficherModalPause = true} class="btn-secondary">
            <span class="material-symbols-outlined icon-filled" style="font-size:16px">pause</span>
            Mettre en pause
          </button>
        {/if}
        <button onclick={() => afficherModalSuspendre = true} class="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>
          Suspendre
        </button>
      {:else if cabine.status === 'suspended' || cabine.status === 'inactive'}
        <button onclick={reactiver} disabled={actionEnCours === 'reactiver'} class="btn-primary">
          {#if actionEnCours === 'reactiver'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
            <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>
          {/if}
          Réactiver
        </button>
      {/if}
    </div>
  {/if}
</div>

{#if chargement}
  <div class="grid grid-cols-2 lg:grid-cols-4 stagger gap-3 mb-5">
    {#each Array(4) as _}<div class="skeleton h-24 rounded-xl"></div>{/each}
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">
    <div class="lg:col-span-2 skeleton h-64 rounded-2xl"></div>
    <div class="skeleton h-64 rounded-2xl"></div>
  </div>
{:else if cabine}

  <!-- Stats rapides -->
  <div class="grid grid-cols-2 lg:grid-cols-4 stagger gap-3 mb-5">
    <StatCard titre="Commandes aujourd'hui" valeur={cabine.dailyOrdersCount ?? cabine.daily_orders_count ?? 0} icone="receipt_long" couleur="orange"
      sousTitre="Max : {cabine.maxDailyOrders ?? cabine.max_daily_orders ?? '∞'}" />
    <StatCard titre="Solde UV" valeur={cabine.uvBalance ?? cabine.uv_balance ?? 0} icone="bolt" couleur="jaune" />
    <StatCard titre="Total commandes" valeur={stats?.totals?.total ?? '—'} icone="bar_chart" couleur="bleu" />
    <StatCard titre="Chiffre d'affaires" valeur={stats?.totals?.total_amount ? (Number(stats.totals.total_amount) / 1000).toFixed(0) + ' K XAF' : '—'} icone="payments" couleur="vert" />
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">

    <!-- Colonne principale -->
    <div class="lg:col-span-2 space-y-5">

      <!-- Informations générales -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">store</span>
          </div>
          <h3 class="font-bold text-slate-900">Informations générales</h3>
        </div>
        <div class="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          {#each [
            { label: 'Nom', val: cabine.name },
            { label: 'Responsable', val: cabine.managerName ?? cabine.manager_name },
            { label: 'Type', val: cabine.type },
            { label: 'Email', val: cabine.email },
            { label: 'Téléphone', val: cabine.phone },
            { label: 'Ville', val: cabine.city },
            { label: 'Localisation', val: cabine.location },
            { label: 'WhatsApp', val: cabine.whatsappNumber ?? cabine.whatsapp_number },
          ] as info}
            {#if info.val}
              <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{info.label}</p>
                <p class="text-sm font-semibold text-slate-800 capitalize">{info.val}</p>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Mobile Money -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:18px">smartphone</span>
          </div>
          <h3 class="font-bold text-slate-900">Mobile Money</h3>
        </div>
        <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span class="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
            <div>
              <p class="text-xs font-semibold text-amber-700">MTN Mobile Money</p>
              <p class="text-sm font-bold text-slate-900 font-mono">{cabine.mtnNumber ?? cabine.mtn_number ?? '—'}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <span class="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
            <div>
              <p class="text-xs font-semibold text-orange-700">Orange Money</p>
              <p class="text-sm font-bold text-slate-900 font-mono">{cabine.orangeNumber ?? cabine.orange_number ?? '—'}</p>
            </div>
          </div>
          {#if (cabine.unavailableNetworks ?? cabine.unavailable_networks ?? []).length > 0}
            <div class="sm:col-span-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <p class="text-xs font-semibold text-red-700 mb-1">Réseaux indisponibles</p>
              <div class="flex gap-2">
                {#each (cabine.unavailableNetworks ?? cabine.unavailable_networks ?? []) as net}
                  <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold uppercase">{net}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Limites & quotas -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">tune</span>
          </div>
          <h3 class="font-bold text-slate-900">Limites & quotas</h3>
        </div>
        <div class="p-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Max commandes/jour</p>
            <p class="text-sm font-bold text-slate-900">{cabine.maxDailyOrders ?? cabine.max_daily_orders ?? '—'}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Montant max/commande</p>
            <p class="text-sm font-bold text-slate-900">{formaterMontant(cabine.maxOrderAmount ?? cabine.max_order_amount)}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Quota total</p>
            <p class="text-sm font-bold text-slate-900">{cabine.totalOrdersQuota ?? cabine.total_orders_quota ?? '—'}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Quota bloqué</p>
            <p class="text-sm font-semibold {(cabine.quotaBlocked ?? cabine.quota_blocked) ? 'text-red-600' : 'text-emerald-600'}">
              {(cabine.quotaBlocked ?? cabine.quota_blocked) ? 'Oui' : 'Non'}
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notification</p>
            <p class="text-sm font-semibold text-slate-800 capitalize">{cabine.notificationType ?? cabine.notification_type ?? '—'}</p>
          </div>
        </div>
        <!-- Barre de progression quotidienne -->
        {#if (cabine.maxDailyOrders ?? cabine.max_daily_orders ?? 0) > 0}
          {@const max = cabine.maxDailyOrders ?? cabine.max_daily_orders ?? 0}
          {@const count = cabine.dailyOrdersCount ?? cabine.daily_orders_count ?? 0}
          {@const pct = Math.min(Math.round((count / max) * 100), 100)}
          <div class="px-5 pb-5">
            <div class="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Commandes aujourd'hui</span>
              <span class="font-semibold">{count} / {max} ({pct}%)</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" style="width:{pct}%; background:linear-gradient(90deg, #007A5E 0%, #00A878 100%)"></div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Stats par statut -->
      {#if stats?.byStatus?.length > 0}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-900">Répartition des commandes</h3>
          </div>
          <div class="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {#each stats.byStatus as s}
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p class="text-xs text-slate-400 capitalize mb-1">{(s.status ?? '').replace(/_/g, ' ')}</p>
                <p class="text-lg font-black text-slate-900">{s.count}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Colonne latérale -->
    <div class="space-y-5">

      <!-- Abonnement -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">card_membership</span>
          </div>
          <h3 class="font-bold text-slate-900">Abonnement</h3>
        </div>
        <div class="p-5 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-500">Statut</span>
            <Badge statut={cabine.subscriptionStatus ?? cabine.subscription_status ?? 'inactive'} />
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-slate-500">Expiration</span>
            <span class="text-sm font-semibold text-slate-800">{formaterDate(cabine.subscriptionExpiry ?? cabine.subscription_expiry)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-slate-500">Renouvellement auto</span>
            <span class="text-sm font-semibold {cabine.autoRenew ?? cabine.auto_renew ? 'text-emerald-600' : 'text-slate-400'}">
              {cabine.autoRenew ?? cabine.auto_renew ? 'Activé' : 'Désactivé'}
            </span>
          </div>
          {#if (cabine.subscriptionStatus ?? cabine.subscription_status ?? 'inactive') !== 'active'}
            <button onclick={() => afficherModalActiverAbo = true}
              class="w-full mt-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>
              Activer l'abonnement
            </button>
          {:else}
            <a href="/admin/abonnements?cabin={id}" class="block text-center text-xs text-orange-500 font-semibold hover:text-orange-600 mt-2">
              Gérer l'abonnement →
            </a>
          {/if}
        </div>
      </div>

      <!-- Suspension / Pause -->
      {#if cabine.suspensionReason ?? cabine.suspension_reason}
        <div class="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p class="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Raison de suspension</p>
          <p class="text-sm text-red-700">{cabine.suspensionReason ?? cabine.suspension_reason}</p>
          <p class="text-xs text-red-500 mt-2">Le {formaterDate(cabine.suspensionDate ?? cabine.suspension_date)}</p>
        </div>
      {/if}
      {#if cabine.paused && (cabine.pauseReason ?? cabine.pause_reason)}
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p class="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">En pause</p>
          <p class="text-sm text-amber-700">{cabine.pauseReason ?? cabine.pause_reason}</p>
          <p class="text-xs text-amber-500 mt-2">Depuis le {formaterDate(cabine.pausedAt ?? cabine.paused_at)}</p>
        </div>
      {/if}

      <!-- Pièce d'identité -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">badge</span>
            </div>
            <h3 class="font-bold text-slate-900">Pièce d'identité</h3>
          </div>
          {#if idCard}
            <button onclick={() => afficherModalDocument = true}
              class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span class="material-symbols-outlined" style="font-size:14px">visibility</span>
              Voir
            </button>
          {/if}
        </div>
        <div class="p-5">
          {#if !idCard}
            <div class="flex items-center gap-2 text-slate-400">
              <span class="material-symbols-outlined" style="font-size:18px">hourglass_empty</span>
              <p class="text-sm">Aucun document soumis</p>
            </div>
          {:else}
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">Statut</span>
                {#if idCard.status === 'approved'}
                  <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <span class="material-symbols-outlined icon-filled" style="font-size:12px">check_circle</span>Approuvé
                  </span>
                {:else if idCard.status === 'rejected'}
                  <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                    <span class="material-symbols-outlined icon-filled" style="font-size:12px">cancel</span>Rejeté
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    <span class="material-symbols-outlined icon-filled" style="font-size:12px">schedule</span>En attente
                  </span>
                {/if}
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-500">Type</span>
                <span class="text-sm font-semibold text-slate-800 uppercase">{idCard.documentType ?? 'CNI'}</span>
              </div>
              {#if idCard.submittedAt}
                <div class="flex justify-between">
                  <span class="text-sm text-slate-500">Soumis le</span>
                  <span class="text-sm font-semibold text-slate-800">{formaterDate(idCard.submittedAt)}</span>
                </div>
              {/if}
              {#if idCard.status === 'pending'}
                <div class="flex gap-2 mt-1">
                  <button onclick={() => reviewDocument('approve')} disabled={chargementDoc}
                    class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                    {#if chargementDoc}
                      <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {:else}
                      <span class="material-symbols-outlined icon-filled" style="font-size:14px">check</span>
                    {/if}
                    Approuver
                  </button>
                  <button onclick={() => afficherModalDocument = true}
                    class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">
                    <span class="material-symbols-outlined icon-filled" style="font-size:14px">visibility</span>
                    Voir & Rejeter
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Dates -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Historique</p>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Créée le</span>
            <span class="font-semibold text-slate-800">{formaterDate(cabine.createdAt ?? cabine.created_at)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Dernière activité</span>
            <span class="font-semibold text-slate-800">{formaterDate(cabine.lastActivity ?? cabine.last_activity)}</span>
          </div>
          {#if cabine.reactivatedAt ?? cabine.reactivated_at}
            <div class="flex justify-between">
              <span class="text-slate-500">Réactivée le</span>
              <span class="font-semibold text-slate-800">{formaterDate(cabine.reactivatedAt ?? cabine.reactivated_at)}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Lien commandes -->
      <a href="/admin/commandes?cabin={id}" class="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 card-shadow p-4 hover:border-orange-200 transition-all group">
        <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">receipt_long</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate-800">Voir les commandes</p>
          <p class="text-xs text-slate-400">Toutes les commandes de cette cabine</p>
        </div>
        <span class="material-symbols-outlined text-slate-300 group-hover:text-orange-400 transition-colors" style="font-size:18px">chevron_right</span>
      </a>
    </div>
  </div>
{/if}

<!-- Modal : Suspendre -->
{#if afficherModalSuspendre}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-red-700">Suspendre la cabine</h3>
        <button onclick={() => afficherModalSuspendre = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          La cabine ne pourra plus recevoir de commandes tant qu'elle est suspendue.
        </p>
        <div>
          <label for="raison-suspension" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison de la suspension *</label>
          <textarea id="raison-suspension" bind:value={raisonSuspension} rows="3" placeholder="Expliquez la raison..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" required></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalSuspendre = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={suspendre} disabled={!raisonSuspension || actionEnCours === 'suspendre'} class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === 'suspendre'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>Suspendre
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Pause -->
{#if afficherModalPause}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Mettre en pause</h3>
        <button onclick={() => afficherModalPause = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="raison-pause" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison de la pause *</label>
          <textarea id="raison-pause" bind:value={raisonPause} rows="2" placeholder="Ex: Maintenance, absence temporaire..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalPause = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={mettreEnPause} disabled={!raisonPause || actionEnCours === 'pause'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'pause'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">pause</span>Mettre en pause
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Ajuster UV -->
{#if afficherModalUV}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Ajuster le solde UV</h3>
        <button onclick={() => afficherModalUV = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:20px">bolt</span>
          <div>
            <p class="text-xs text-amber-700 font-medium">Solde actuel</p>
            <p class="text-lg font-black text-slate-900">{cabine?.uvBalance ?? cabine?.uv_balance ?? 0} UV</p>
          </div>
        </div>
        <div>
          <label for="delta-uv" class="block text-xs font-semibold text-slate-600 mb-1.5">Variation (positif = recharge, négatif = déduction)</label>
          <input id="delta-uv" type="number" bind:value={deltaUV} placeholder="Ex: 100 ou -50" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          {#if deltaUV !== 0}
            <p class="text-xs mt-1 {deltaUV > 0 ? 'text-emerald-600' : 'text-red-600'}">
              Nouveau solde : {(cabine?.uvBalance ?? cabine?.uv_balance ?? 0) + Number(deltaUV)} UV
            </p>
          {/if}
        </div>
        <div>
          <label for="desc-uv" class="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
          <input id="desc-uv" type="text" bind:value={descriptionUV} placeholder="Ex: Recharge mensuelle" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalUV = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={ajusterUV} disabled={!deltaUV || !descriptionUV || actionEnCours === 'uv'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'uv'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">bolt</span>Confirmer
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Activer abonnement -->
{#if afficherModalActiverAbo}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-sm pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Activer l'abonnement</h3>
        <button onclick={() => afficherModalActiverAbo = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-slate-600">
          Activer manuellement l'abonnement de <strong>{cabine?.name}</strong>. La date de début est aujourd'hui.
        </p>
        <div>
          <label for="duration-mois" class="block text-xs font-semibold text-slate-600 mb-1.5">Durée (mois)</label>
          <select id="duration-mois" bind:value={durationMois} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value={1}>1 mois</option>
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
            <option value={12}>12 mois</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalActiverAbo = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={activerAbonnement} disabled={actionEnCours === 'activer-abo'}
            class="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === 'activer-abo'}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>Activer
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Pièce d'identité -->
{#if afficherModalDocument && idCard}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-2xl pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 class="font-bold text-slate-900">Pièce d'identité — {cabine?.name}</h3>
          <p class="text-xs text-slate-400 mt-0.5">Type : {(idCard.documentType ?? 'CNI').toUpperCase()}</p>
        </div>
        <button onclick={() => { afficherModalDocument = false; motifRejet = '' }}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-5">

        <!-- Images -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Face recto</p>
            {#if idCard.frontImageUrl}
              {#if idCard.frontImageUrl.startsWith('data:application/pdf') || idCard.frontImageUrl.includes('application/pdf')}
                <div class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:28px">picture_as_pdf</span>
                  <p class="text-sm font-semibold text-slate-700">Document PDF</p>
                </div>
              {:else}
                <img src={idCard.frontImageUrl} alt="Recto CNI"
                  class="w-full rounded-xl border border-slate-200 object-cover" style="max-height: 220px" />
              {/if}
            {:else}
              <div class="flex items-center justify-center h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p class="text-sm text-slate-400">Non fourni</p>
              </div>
            {/if}
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Face verso</p>
            {#if idCard.backImageUrl}
              {#if idCard.backImageUrl.startsWith('data:application/pdf') || idCard.backImageUrl.includes('application/pdf')}
                <div class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:28px">picture_as_pdf</span>
                  <p class="text-sm font-semibold text-slate-700">Document PDF</p>
                </div>
              {:else}
                <img src={idCard.backImageUrl} alt="Verso CNI"
                  class="w-full rounded-xl border border-slate-200 object-cover" style="max-height: 220px" />
              {/if}
            {:else}
              <div class="flex items-center justify-center h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p class="text-sm text-slate-400">Non fourni</p>
              </div>
            {/if}
          </div>
        </div>

        {#if idCard.status === 'pending'}
          <!-- Actions -->
          <div class="border-t border-slate-100 pt-5">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Décision</p>
            <div class="space-y-3">
              <div>
                <label for="motif-rejet" class="block text-xs font-semibold text-slate-600 mb-1.5">
                  Motif de rejet (requis si rejet)
                </label>
                <textarea id="motif-rejet" bind:value={motifRejet} rows="2"
                  placeholder="Ex : Photo floue, document illisible, identité non concordante..."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-red-300">
                </textarea>
              </div>
              <div class="flex gap-3">
                <button onclick={() => reviewDocument('reject')}
                  disabled={chargementDoc || !motifRejet.trim()}
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-40">
                  {#if chargementDoc}
                    <span class="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                  {:else}
                    <span class="material-symbols-outlined icon-filled" style="font-size:16px">cancel</span>
                  {/if}
                  Rejeter
                </button>
                <button onclick={() => reviewDocument('approve')}
                  disabled={chargementDoc}
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {#if chargementDoc}
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {:else}
                    <span class="material-symbols-outlined icon-filled" style="font-size:16px">check_circle</span>
                  {/if}
                  Approuver
                </button>
              </div>
            </div>
          </div>
        {:else if idCard.status === 'rejected' && idCard.rejectionReason}
          <div class="p-4 rounded-xl bg-red-50 border border-red-100">
            <p class="text-xs font-semibold text-red-700 mb-1">Motif de rejet</p>
            <p class="text-sm text-red-700">{idCard.rejectionReason}</p>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}

<!-- Modal : Modifier cabine -->
{#if afficherModalEditer}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-slate-900">Modifier la cabine</h3>
        <button onclick={() => afficherModalEditer = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-name" class="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
            <input id="edit-name" type="text" bind:value={form.name} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="edit-manager" class="block text-xs font-semibold text-slate-600 mb-1.5">Responsable *</label>
            <input id="edit-manager" type="text" bind:value={form.managerName} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-email" class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input id="edit-email" type="email" bind:value={form.email} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="edit-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
            <input id="edit-phone" type="tel" bind:value={form.phone} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-city" class="block text-xs font-semibold text-slate-600 mb-1.5">Ville</label>
            <input id="edit-city" type="text" bind:value={form.city} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="edit-type" class="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
            <select id="edit-type" bind:value={form.type} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-mtn" class="block text-xs font-semibold text-slate-600 mb-1.5">MTN MoMo</label>
            <input id="edit-mtn" type="tel" bind:value={form.mtnNumber} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="edit-orange" class="block text-xs font-semibold text-slate-600 mb-1.5">Orange Money</label>
            <input id="edit-orange" type="tel" bind:value={form.orangeNumber} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="edit-maxorders" class="block text-xs font-semibold text-slate-600 mb-1.5">Max commandes/jour</label>
            <input id="edit-maxorders" type="number" bind:value={form.maxDailyOrders} min="1" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="edit-maxamount" class="block text-xs font-semibold text-slate-600 mb-1.5">Montant max (XAF)</label>
            <input id="edit-maxamount" type="number" bind:value={form.maxOrderAmount} min="0" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick={() => afficherModalEditer = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={sauvegarder} disabled={actionEnCours === 'editer'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'editer'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>Sauvegarder
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
