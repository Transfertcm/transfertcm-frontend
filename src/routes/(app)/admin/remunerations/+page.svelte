<script lang="ts">
  import { untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let date       = $state(new Date().toISOString().split('T')[0])
  let perf       = $state<any[]>([])
  let chargement = $state(true)

  // Modal paiement
  let modalPay    = $state(false)
  let payTarget   = $state<any>(null)
  let payAmount   = $state('')
  let payMethod   = $state('mtn_money')
  let payNote     = $state('')
  let payEnCours  = $state(false)

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  async function charger() {
    chargement = true
    try {
      const res = await api.get('/admin/cabin-remunerations/performances', { params: { date } })
      perf = res.data?.data ?? []
    } catch {
      perf = []
    } finally {
      chargement = false
    }
  }

  function ouvrirPaiement(cabin: any) {
    payTarget  = cabin
    payAmount  = ''
    payMethod  = 'mtn_money'
    payNote    = ''
    modalPay   = true
  }

  async function enregistrerPaiement() {
    if (!payTarget || !payAmount || Number(payAmount) <= 0) return
    payEnCours = true
    try {
      await api.post('/admin/cabin-remunerations', {
        cabinId:       payTarget.cabinId,
        date,
        amountPaid:    Number(payAmount),
        paymentMethod: payMethod,
        paymentNote:   payNote || null,
      })
      toast.succes('Paiement enregistré', `${payTarget.cabinName} a été payée`)
      modalPay = false
      await charger()
    } catch (e: any) {
      const champs = e.response?.data?.errors
      const detail = Array.isArray(champs) && champs.length ? champs.map((x: any) => x.message).join(' ') : null
      if (!e.toastAffiche) toast.erreur('Erreur', detail ?? e.response?.data?.message ?? 'Impossible d\'enregistrer')
    } finally {
      payEnCours = false
    }
  }

  $effect(() => { date; untrack(charger) })
</script>

<svelte:head><title>Rémunérations cabines — Admin</title></svelte:head>

<!-- En-tête -->
<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Rémunérations cabines</h2>
    <p class="text-sm text-slate-500 mt-0.5">Commandes traitées du jour par cabine (assignées, en cours ou terminées) · Enregistrez les paiements</p>
  </div>
  <div class="flex items-center gap-3">
    <input
      type="date"
      bind:value={date}
      class="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
    />
    <button onclick={charger} class="btn-secondary">
      <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
      Actualiser
    </button>
  </div>
</div>

<!-- Résumé du jour -->
{#if perf.length > 0}
  {@const totalVolume = perf.reduce((s, c) => s + (c.totalVolume ?? 0), 0)}
  {@const totalOrders = perf.reduce((s, c) => s + (c.ordersCount ?? 0), 0)}
  {@const nonPayees   = perf.filter(c => !c.isPaid).length}
  <div class="grid grid-cols-3 gap-4 mb-5">
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Volume total traité</p>
      <p class="font-black text-2xl text-slate-900">{formaterMontant(totalVolume)}</p>
      <p class="text-xs text-slate-400 mt-1">{totalOrders} commande{totalOrders > 1 ? 's' : ''} traitée{totalOrders > 1 ? 's' : ''} (assignées, en cours ou terminées)</p>
    </div>
    <div class="bg-white rounded-2xl p-5 border border-slate-100 card-shadow">
      <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Cabines actives</p>
      <p class="font-black text-2xl text-slate-900">{perf.length}</p>
      <p class="text-xs text-slate-400 mt-1">ont traité des commandes</p>
    </div>
    <div class="rounded-2xl p-5 card-shadow
      {nonPayees > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-emerald-50 border border-emerald-200'}">
      <p class="text-xs uppercase tracking-wide mb-1 {nonPayees > 0 ? 'text-orange-500' : 'text-emerald-500'}">
        Non payées
      </p>
      <p class="font-black text-2xl {nonPayees > 0 ? 'text-orange-700' : 'text-emerald-700'}">{nonPayees}</p>
      <p class="text-xs mt-1 {nonPayees > 0 ? 'text-orange-500' : 'text-emerald-500'}">
        {nonPayees === 0 ? 'Toutes les cabines sont payées ✓' : 'cabine(s) en attente de paiement'}
      </p>
    </div>
  </div>
{/if}

<!-- Liste cabines -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-3">
      {#each Array(4) as _}
        <div class="skeleton h-16 rounded-xl"></div>
      {/each}
    </div>
  {:else if perf.length === 0}
    <div class="py-20 text-center">
      <span class="material-symbols-outlined text-slate-300" style="font-size:40px">store_off</span>
      <p class="text-slate-500 font-semibold mt-3">Aucune commande traitée ce jour</p>
      <p class="text-slate-400 text-sm mt-1">Aucune cabine n'a de chiffre à payer pour le {date}</p>
    </div>
  {:else}
    <!-- En-tête tableau -->
    <div class="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-3">Cabine</div>
      <div class="col-span-2 text-right">Commandes</div>
      <div class="col-span-3 text-right">Volume traité</div>
      <div class="col-span-2 text-right">Paiement</div>
      <div class="col-span-2 text-right">Action</div>
    </div>

    <div class="divide-y divide-slate-50">
      {#each perf as cabin}
        <div class="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-slate-50 transition-all">
          <!-- Cabine -->
          <div class="col-span-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:18px">store</span>
            </div>
            <div>
              <p class="font-semibold text-sm text-slate-800">{cabin.cabinName}</p>
              <p class="text-xs text-slate-400 font-mono">{cabin.cabinPhone}</p>
            </div>
          </div>

          <!-- Commandes -->
          <div class="col-span-2 text-right">
            <p class="font-bold text-slate-900">{cabin.ordersCount}</p>
            <p class="text-xs text-slate-400">
              {cabin.completedCount ?? 0} terminée{(cabin.completedCount ?? 0) > 1 ? 's' : ''}
            </p>
          </div>

          <!-- Volume -->
          <div class="col-span-3 text-right">
            <p class="font-bold text-slate-900">{formaterMontant(cabin.totalVolume)}</p>
            <p class="text-xs text-slate-400">traités</p>
          </div>

          <!-- Statut paiement -->
          <div class="col-span-2 text-right">
            {#if cabin.isPaid}
              <p class="text-sm font-bold text-emerald-600">{formaterMontant(cabin.payment?.amountPaid)}</p>
              <p class="text-xs text-emerald-500">✓ Payée</p>
            {:else}
              <p class="text-sm text-slate-400">—</p>
              <p class="text-xs text-amber-500">En attente</p>
            {/if}
          </div>

          <!-- Action -->
          <div class="col-span-2 flex justify-end">
            {#if cabin.isPaid}
              <span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold">
                <span class="material-symbols-outlined icon-filled" style="font-size:14px">check_circle</span>
                Payée
              </span>
            {:else}
              <button
                onclick={() => ouvrirPaiement(cabin)}
                class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
                style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%); box-shadow:0 4px 12px rgba(0,122,94,0.3)"
              >
                <span class="material-symbols-outlined icon-filled" style="font-size:16px">payments</span>
                Payer
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal Paiement -->
{#if modalPay && payTarget}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-md border border-slate-200 animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18)">

      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">payments</span>
            Payer {payTarget.cabinName}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            {payTarget.ordersCount} commandes ({payTarget.completedCount ?? 0} terminées)
            · {formaterMontant(payTarget.totalVolume)} traités
          </p>
        </div>
        <button onclick={() => modalPay = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <!-- Montant -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Montant à payer (XAF) *</label>
          <input
            type="number"
            bind:value={payAmount}
            placeholder="Ex: 5000"
            min="1"
            class="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 text-lg focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
          />
        </div>

        <!-- Méthode -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-2">Méthode de paiement *</label>
          <div class="grid grid-cols-2 gap-2">
            {#each [
              { val: 'mtn_money',    label: 'MTN Mobile Money', color: '#f59e0b' },
              { val: 'orange_money', label: 'Orange Money',     color: '#f97316' },
              { val: 'cash',         label: 'Espèces',          color: '#64748b' },
              { val: 'virement',     label: 'Virement',         color: '#3b82f6' },
            ] as m}
              <label class="flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all
                {payMethod === m.val ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}">
                <input type="radio" bind:group={payMethod} value={m.val} class="accent-orange-500 shrink-0" />
                <span class="text-sm font-semibold text-slate-700">{m.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Note (optionnel)</label>
          <input
            type="text"
            bind:value={payNote}
            placeholder="Ex: Paiement semaine du 02/06"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => modalPay = false} class="btn-secondary flex-1">Annuler</button>
          <button
            onclick={enregistrerPaiement}
            disabled={payEnCours || !payAmount || Number(payAmount) <= 0}
            class="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {#if payEnCours}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">payments</span>
            {/if}
            Confirmer le paiement
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
