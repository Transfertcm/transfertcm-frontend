<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  let balance = $state(0)
  let historique = $state<any[]>([])
  let demandes = $state<any[]>([])
  let chargement = $state(true)
  let modalOuverte = $state(false)
  let envoiDemande = $state(false)
  let montant = $state('')
  let motif = $state('')
  let paymentMethod = $state<'mtn' | 'orange'>('mtn')
  let paymentAmount = $state('')
  let paymentNumbers = $state<{ mtn: string | null; orange: string | null }>({ mtn: null, orange: null })

  const demandePending = $derived(demandes.find((d) => d.status === 'pending') ?? null)
  const numeroAdmin = $derived(paymentMethod === 'mtn' ? paymentNumbers.mtn : paymentNumbers.orange)

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/uv/history')
      const data = res.data?.data ?? {}
      balance = data.balance ?? 0
      historique = data.history ?? []
      demandes = data.demandes ?? []
      paymentNumbers = data.paymentNumbers ?? { mtn: null, orange: null }
    } catch {
      toast.erreur('Erreur', 'Impossible de charger le solde UV')
    } finally {
      chargement = false
    }
  }

  async function soumettre(e: Event) {
    e.preventDefault()
    envoiDemande = true
    try {
      await apiCabin.post('/cabin/uv/request', {
        amountRequested: Number(montant),
        reason: motif.trim(),
        paymentAmount: Number(paymentAmount),
        paymentMethod,
      })
      toast.succes('Demande envoyée', "L'administration vérifiera le paiement et créditera votre solde.")
      fermerModal()
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? "Impossible d'envoyer la demande")
    } finally {
      envoiDemande = false
    }
  }

  function fermerModal() {
    modalOuverte = false
    montant = ''
    motif = ''
    paymentMethod = 'mtn'
    paymentAmount = ''
  }

  function formaterDate(d: string) {
    return new Date(d).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const statutMeta: Record<string, { label: string; classes: string; icone: string }> = {
    pending:   { label: 'En attente', classes: 'bg-amber-100 text-amber-700',     icone: 'schedule'     },
    validated: { label: 'Approuvée',  classes: 'bg-emerald-100 text-emerald-700', icone: 'check_circle' },
    rejected:  { label: 'Rejetée',    classes: 'bg-red-100 text-red-700',         icone: 'cancel'       },
  }

  onMount(charger)
</script>

<svelte:head><title>Solde UV — Espace cabine</title></svelte:head>

<div class="mb-6 flex items-start justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Solde UV</h2>
    <p class="text-sm text-slate-500 mt-0.5">Unités de valeur pour vos transferts</p>
  </div>
  <div class="flex items-center gap-2">
    <button onclick={charger} class="btn-secondary">
      <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
      Actualiser
    </button>
    {#if !chargement && !demandePending}
      <button onclick={() => modalOuverte = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">bolt</span>
        Demander une recharge
      </button>
    {/if}
  </div>
</div>

{#if chargement}
  <div class="space-y-4">
    {#each Array(3) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
  </div>
{:else}

  <!-- Stats cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:22px">bolt</span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Solde disponible</p>
      </div>
      <p class="font-black text-4xl text-slate-900 tabular-nums">{balance.toLocaleString('fr-CM')}</p>
      <p class="text-sm text-slate-400 mt-1">Unités de valeur (UV)</p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:22px">inbox</span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Demandes</p>
      </div>
      <p class="font-black text-4xl text-slate-900">{demandes.length}</p>
      <p class="text-sm text-slate-400 mt-1">Au total</p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:22px">history</span>
        </div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Transactions</p>
      </div>
      <p class="font-black text-4xl text-slate-900">{historique.length}</p>
      <p class="text-sm text-slate-400 mt-1">Enregistrées</p>
    </div>
  </div>

  <!-- Numéros de paiement admin -->
  {#if paymentNumbers.mtn || paymentNumbers.orange}
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:15px">phone_in_talk</span>
        </div>
        <h3 class="font-bold text-slate-900 text-sm">Comment recharger vos UV</h3>
      </div>
      <p class="text-xs text-slate-500 mb-4">
        Envoyez le montant correspondant à vos UV sur l'un des numéros ci-dessous, puis soumettez votre demande.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#if paymentNumbers.mtn}
          <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-amber-700">MTN MoMo</p>
              <p class="font-bold text-slate-900 text-base tracking-wide">{paymentNumbers.mtn}</p>
            </div>
          </div>
        {/if}
        {#if paymentNumbers.orange}
          <div class="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-orange-700">Orange Money</p>
              <p class="font-bold text-slate-900 text-base tracking-wide">{paymentNumbers.orange}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Alerte demande en cours -->
  {#if demandePending}
    <div class="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5">
      <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:20px">schedule</span>
      <div class="flex-1">
        <p class="font-semibold text-amber-800 text-sm">Demande en cours de traitement</p>
        <p class="text-xs text-amber-700 mt-0.5">
          {Number(demandePending.amount_requested).toLocaleString('fr-CM')} UV · Soumise le {formaterDate(demandePending.created_at)}
        </p>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 stagger gap-5">

    <!-- Demandes -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:15px">bolt</span>
        </div>
        <h3 class="font-bold text-slate-900 text-sm">Mes demandes</h3>
      </div>
      {#if demandes.length === 0}
        <div class="py-12 text-center">
          <span class="material-symbols-outlined text-slate-200 block mb-2" style="font-size:36px">inbox</span>
          <p class="text-sm text-slate-400">Aucune demande</p>
        </div>
      {:else}
        <div class="divide-y divide-slate-50">
          {#each demandes as d}
            {@const st = statutMeta[d.status] ?? statutMeta.pending}
            <div class="px-5 py-4">
              <div class="flex items-start justify-between gap-2 mb-1">
                <span class="font-bold text-slate-900">{Number(d.amount_requested).toLocaleString()} UV</span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full {st.classes} shrink-0">
                  <span class="material-symbols-outlined icon-filled" style="font-size:11px">{st.icone}</span>
                  {st.label}
                </span>
              </div>
              {#if d.payment_method && d.payment_amount}
                <p class="text-xs text-slate-400 mb-1">
                  Payé : {Number(d.payment_amount).toLocaleString()} XAF via
                  <span class="font-semibold">{d.payment_method === 'mtn' ? 'MTN MoMo' : 'Orange Money'}</span>
                </p>
              {/if}
              {#if d.notes}
                <p class="text-xs text-slate-500 line-clamp-1 mb-1">{d.notes}</p>
              {/if}
              <p class="text-xs text-slate-300">{formaterDate(d.created_at)}</p>
              {#if d.status === 'rejected' && d.rejection_reason}
                <div class="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                  <p class="text-xs text-red-600"><span class="font-semibold">Motif :</span> {d.rejection_reason}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Historique -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:15px">history</span>
        </div>
        <h3 class="font-bold text-slate-900 text-sm">Historique des transactions</h3>
      </div>
      {#if historique.length === 0}
        <div class="py-12 text-center">
          <span class="material-symbols-outlined text-slate-200 block mb-2" style="font-size:36px">history</span>
          <p class="text-sm text-slate-400">Aucune transaction</p>
        </div>
      {:else}
        <div class="divide-y divide-slate-50">
          {#each historique as tx}
            <div class="flex items-center gap-3 px-5 py-3.5">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                {tx.transaction_type === 'recharge' ? 'bg-emerald-50' : 'bg-red-50'}">
                <span class="material-symbols-outlined icon-filled
                  {tx.transaction_type === 'recharge' ? 'text-emerald-500' : 'text-red-400'}" style="font-size:16px">
                  {tx.transaction_type === 'recharge' ? 'add_circle' : 'remove_circle'}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800">
                  {tx.transaction_type === 'recharge' ? 'Recharge' : 'Déduction'}
                </p>
                {#if tx.description}
                  <p class="text-xs text-slate-400 truncate">{tx.description}</p>
                {/if}
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold {tx.transaction_type === 'recharge' ? 'text-emerald-600' : 'text-red-500'}">
                  {tx.transaction_type === 'recharge' ? '+' : '-'}{tx.amount} UV
                </p>
                <p class="text-xs text-slate-300">{formaterDate(tx.created_at)}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  </div>
{/if}

<!-- Modal : Demande de recharge -->
{#if modalOuverte}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 class="font-bold text-slate-900">Demande de recharge UV</h3>
          <p class="text-xs text-slate-400 mt-0.5">Payez d'abord via Mobile Money, puis soumettez votre demande</p>
        </div>
        <button onclick={fermerModal}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={soumettre} class="p-6 space-y-5">

        <!-- Rappel numéro admin selon opérateur sélectionné -->
        {#if numeroAdmin}
          <div class="p-4 rounded-xl border flex items-start gap-3
            {paymentMethod === 'mtn' ? 'bg-amber-50 border-amber-100' : 'bg-orange-50 border-orange-100'}">
            <span class="material-symbols-outlined icon-filled shrink-0 mt-0.5
              {paymentMethod === 'mtn' ? 'text-amber-500' : 'text-orange-500'}" style="font-size:18px">info</span>
            <div>
              <p class="text-xs font-semibold {paymentMethod === 'mtn' ? 'text-amber-800' : 'text-orange-800'} mb-0.5">
                Envoyez le paiement à ce numéro
              </p>
              <p class="font-bold text-slate-900 text-lg tracking-wide">{numeroAdmin}</p>
              <p class="text-xs {paymentMethod === 'mtn' ? 'text-amber-700' : 'text-orange-700'} mt-0.5">
                {paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'}
              </p>
            </div>
          </div>
        {:else}
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <span class="material-symbols-outlined text-slate-400 icon-filled shrink-0 mt-0.5" style="font-size:18px">info</span>
            <p class="text-xs text-slate-600 leading-relaxed">
              Effectuez d'abord le virement Mobile Money vers le numéro indiqué par l'administrateur, puis remplissez ce formulaire.
            </p>
          </div>
        {/if}

        <!-- Nombre d'UV -->
        <div>
          <label for="montant-uv" class="block text-xs font-semibold text-slate-600 mb-1.5">
            Nombre d'UV souhaité *
          </label>
          <input
            id="montant-uv"
            type="number"
            bind:value={montant}
            min="1"
            placeholder="Ex : 500"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <!-- Opérateur -->
        <div>
          <p class="text-xs font-semibold text-slate-600 mb-2">Opérateur utilisé *</p>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
              {paymentMethod === 'mtn' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}">
              <input type="radio" bind:group={paymentMethod} value="mtn" class="accent-amber-500" />
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
              <span class="text-sm font-semibold text-slate-700">MTN MoMo</span>
            </label>
            <label class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
              {paymentMethod === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}">
              <input type="radio" bind:group={paymentMethod} value="orange" class="accent-orange-500" />
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
              <span class="text-sm font-semibold text-slate-700">Orange Money</span>
            </label>
          </div>
        </div>

        <!-- Montant payé -->
        <div>
          <label for="payment-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">
            Montant payé (XAF) *
          </label>
          <input
            id="payment-amount"
            type="number"
            bind:value={paymentAmount}
            min="1"
            placeholder="Ex : 25000"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <!-- Motif -->
        <div>
          <label for="motif-uv" class="block text-xs font-semibold text-slate-600 mb-1.5">Motif / Note *</label>
          <textarea
            id="motif-uv"
            bind:value={motif}
            rows="3"
            required
            minlength="5"
            placeholder="Ex : Solde insuffisant pour traiter les commandes en cours..."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-orange-400 transition-colors"
          ></textarea>
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button" onclick={fermerModal} class="btn-secondary flex-1 justify-center">
            Annuler
          </button>
          <button type="submit"
            disabled={envoiDemande || !montant || !motif.trim() || !paymentAmount}
            class="btn-primary flex-1 justify-center">
            {#if envoiDemande}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Envoi...
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">send</span>
              Envoyer
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
