<script lang="ts">
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge, { libelleService } from '$lib/components/ui/Badge.svelte'
  import { formatOrderCode } from '$lib/reference'

  type Categorie = 'to_deliver' | 'to_refund' | 'refunded'

  const onglets: { val: Categorie; label: string; desc: string; icone: string; couleur: string }[] = [
    { val: 'to_deliver', label: 'À livrer',     desc: 'Payées, pas encore livrées',                 icone: 'local_shipping',    couleur: 'text-blue-500 bg-blue-50' },
    { val: 'to_refund',  label: 'À rembourser', desc: 'Payées puis rejetées, annulées ou expirées', icone: 'assignment_return', couleur: 'text-red-500 bg-red-50' },
    { val: 'refunded',   label: 'Remboursées',  desc: 'Montant remboursé',                          icone: 'currency_exchange', couleur: 'text-teal-500 bg-teal-50' },
  ]

  let categorie = $state<Categorie>('to_deliver')
  let commandes = $state<any[]>([])
  let meta = $state<any>(null)
  let resume = $state<Record<string, { count: number; amount: number }> | null>(null)
  let chargement = $state(true)

  let dateDebut = $state('')
  let dateFin = $state('')
  let page = $state(1)
  let perPage = 20

  let commandeARembourser = $state<any>(null)
  let raisonRemboursement = $state('')
  let remboursementEnCours = $state(false)

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function formaterDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  async function charger() {
    chargement = true
    try {
      const params: Record<string, any> = { category: categorie, page, per_page: perPage }
      if (dateDebut) params.date_from = dateDebut
      if (dateFin) params.date_to = dateFin
      const res = await api.get('/admin/finance/reconciliation', { params })
      commandes = Array.isArray(res.data?.data) ? res.data.data : []
      meta = res.data?.meta ?? null
      resume = res.data?.summary ?? null
    } catch (e: any) {
      commandes = []
      meta = null
      if (e.response?.status !== 403) toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de charger la réconciliation')
    } finally {
      chargement = false
    }
  }

  function choisirCategorie(val: Categorie) {
    if (categorie === val) return
    categorie = val
    page = 1
  }

  function reinitialiserDates() {
    dateDebut = ''
    dateFin = ''
    page = 1
  }

  function ouvrirRemboursement(cmd: any) {
    commandeARembourser = cmd
    raisonRemboursement = ''
  }

  async function rembourser() {
    if (!commandeARembourser || !raisonRemboursement.trim()) return
    remboursementEnCours = true
    try {
      await api.post(`/admin/orders/${commandeARembourser.id}/refund`, { reason: raisonRemboursement.trim() })
      toast.succes('Commande remboursée')
      commandeARembourser = null
      raisonRemboursement = ''
      if (commandes.length === 1 && page > 1) page--
      else await charger()
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de rembourser')
    } finally {
      remboursementEnCours = false
    }
  }

  $effect(() => { categorie; dateDebut; dateFin; page; charger() })
</script>

<svelte:head><title>Réconciliation — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Réconciliation</h2>
    <p class="text-sm text-slate-500 mt-0.5">Commandes payées à livrer, à rembourser ou déjà remboursées</p>
  </div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
  {#each onglets as o}
    {@const r = resume?.[o.val]}
    <button
      onclick={() => choisirCategorie(o.val)}
      class="text-left bg-white rounded-2xl border card-shadow p-4 transition-all
        {categorie === o.val ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-100 hover:border-slate-200'}"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-widest {categorie === o.val ? 'text-orange-500' : 'text-slate-400'}">{o.label}</p>
          <p class="font-bold text-2xl mt-2 leading-none text-slate-900">{r ? r.count : '—'}</p>
          <p class="text-sm font-semibold text-slate-700 mt-1.5">{r ? formaterMontant(r.amount) : '—'}</p>
          <p class="text-xs text-slate-400 mt-1">{o.desc}</p>
        </div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 {o.couleur}">
          <span class="material-symbols-outlined icon-filled" style="font-size:20px">{o.icone}</span>
        </div>
      </div>
    </button>
  {/each}
</div>

<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
  <div class="flex items-end gap-3 flex-wrap">
    <div>
      <label for="date-debut" class="block text-xs font-semibold text-slate-600 mb-1.5">Payées du</label>
      <input id="date-debut" type="date" bind:value={dateDebut} max={dateFin || undefined} onchange={() => page = 1} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
    </div>
    <div>
      <label for="date-fin" class="block text-xs font-semibold text-slate-600 mb-1.5">au</label>
      <input id="date-fin" type="date" bind:value={dateFin} min={dateDebut || undefined} onchange={() => page = 1} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
    </div>
    {#if dateDebut || dateFin}
      <button onclick={reinitialiserDates} class="btn-secondary">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
        Effacer les dates
      </button>
    {/if}
    <p class="text-xs text-slate-400 sm:ml-auto">Les dates portent sur la date de paiement. Montants frais compris.</p>
  </div>
</div>

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
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">account_balance</span>
      </div>
      <p class="text-slate-600 font-semibold">Aucune commande</p>
      <p class="text-slate-400 text-sm mt-1">Aucune commande dans cette catégorie pour la période choisie</p>
    </div>
  {:else}
    <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      <div class="col-span-2">Code</div>
      <div class="col-span-2">Client</div>
      <div class={categorie === 'to_refund' ? 'col-span-1' : 'col-span-2'}>Bénéficiaire</div>
      <div class="col-span-1">Service</div>
      <div class="col-span-1">Réseau</div>
      <div class="col-span-1">Montant</div>
      <div class="col-span-1">Statut</div>
      <div class={categorie === 'to_refund' ? 'col-span-1' : 'col-span-2'}>Date de paiement</div>
      {#if categorie === 'to_refund'}
        <div class="col-span-2 text-right">Actions</div>
      {/if}
    </div>
    <div class="divide-y divide-slate-50">
      {#each commandes as cmd}
        <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
          <div class="lg:col-span-2 min-w-0">
            <a href="/admin/commandes/{cmd.id}" class="text-xs font-mono text-orange-600 hover:text-orange-700 font-semibold break-all">
              {formatOrderCode(cmd.orderCode, cmd.order_code, cmd.id)}
            </a>
          </div>
          <div class="lg:col-span-2 flex items-center gap-2 min-w-0">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 gradient-brand">
              {(cmd.customerPhone ?? '?').slice(-2)}
            </div>
            <span class="text-sm text-slate-700 truncate">{cmd.customerPhone ?? '—'}</span>
          </div>
          <div class={categorie === 'to_refund' ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <span class="text-sm text-slate-500">{cmd.recipientPhone ?? '—'}</span>
          </div>
          <div class="lg:col-span-1">
            <span class="text-xs text-slate-500">{libelleService(cmd.serviceType)}</span>
          </div>
          <div class="lg:col-span-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full shrink-0" style="background:{cmd.network==='mtn'?'#fbbf24':cmd.network==='orange'?'#f97316':'#94a3b8'}"></span>
            <span class="text-xs font-semibold text-slate-600 uppercase">{cmd.network ?? '—'}</span>
          </div>
          <div class="lg:col-span-1">
            <span class="text-sm font-bold text-slate-900">{formaterMontant(cmd.refundAmount ?? cmd.totalAmountWithFees ?? cmd.amount)}</span>
          </div>
          <div class="lg:col-span-1">
            <Badge statut={cmd.status ?? 'pending'} />
          </div>
          <div class={categorie === 'to_refund' ? 'lg:col-span-1' : 'lg:col-span-2'}>
            {#if cmd.paidAt}
              <span class="text-xs text-slate-500">{formaterDate(cmd.paidAt)}</span>
            {:else}
              <span class="text-xs text-slate-500">{formaterDate(cmd.timestamp)}</span>
              <span class="block text-[10px] text-slate-400">(date de commande)</span>
            {/if}
          </div>
          {#if categorie === 'to_refund'}
            <div class="lg:col-span-2 lg:flex lg:justify-end">
              <button
                onclick={() => ouvrirRemboursement(cmd)}
                class="flex items-center gap-1 px-2 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all"
                title="Rembourser la commande"
              >
                <span class="material-symbols-outlined" style="font-size:14px">currency_exchange</span>
                Rembourser
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">
          Page {meta.currentPage} sur {meta.lastPage} · {meta.total} commande{meta.total > 1 ? 's' : ''}
        </p>
        <div class="flex gap-2">
          <button
            onclick={() => page--}
            disabled={page <= 1}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <button
            onclick={() => page++}
            disabled={page >= meta.lastPage}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

{#if commandeARembourser}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-red-700">Rembourser la commande</h3>
          <p class="text-xs text-slate-400 mt-0.5 font-mono">#{formatOrderCode(commandeARembourser.orderCode, commandeARembourser.order_code, commandeARembourser.id)}</p>
        </div>
        <button onclick={() => commandeARembourser = null} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Cette action est irréversible. Le client sera remboursé du montant payé, frais compris :
          <strong>{formaterMontant(commandeARembourser.totalAmountWithFees ?? commandeARembourser.amount)}</strong>.
        </p>
        <div>
          <label for="raison-remboursement" class="block text-xs font-semibold text-slate-600 mb-1.5">Raison du remboursement *</label>
          <textarea id="raison-remboursement" bind:value={raisonRemboursement} rows="3" placeholder="Expliquez la raison du remboursement..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" required></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => commandeARembourser = null} class="btn-secondary flex-1">Annuler</button>
          <button onclick={rembourser} disabled={!raisonRemboursement.trim() || remboursementEnCours} class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if remboursementEnCours}
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
