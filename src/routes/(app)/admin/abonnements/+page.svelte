<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t, translate } from '$lib/stores/locale'

  type Onglet = 'plans' | 'abonnements' | 'factures' | 'demandes'

  const statusLabels: Record<string, string> = {
    active: 'subscription.status.active',
    expired: 'subscription.status.expired',
    suspended: 'subscription.status.suspended',
    pending: 'subscription.status.pending',
  }

  const planLabels: Record<string, string> = {
    basic: 'plan.basic',
    standard: 'plan.standard',
    premium: 'plan.premium',
  }

  const paymentMethodLabels: Record<string, string> = {
    cash: 'form.method.cash',
    mtn_money: 'form.method.mtn_money',
    orange_money: 'form.method.orange_money',
    virement: 'form.method.bank_transfer',
  }
  let onglet = $state<Onglet>('plans')

  // Plans d'abonnement
  type PlanConfig = { name: string; price: number; maxOrders: number }
  let plans = $state<Record<string, PlanConfig>>({
    basic:    { name: 'Basic',    price: 5000,  maxOrders: 100 },
    standard: { name: 'Standard', price: 10000, maxOrders: 300 },
    premium:  { name: 'Premium',  price: 20000, maxOrders: 999 },
  })
  let chargementPlans = $state(false)
  let sauvegardePlans = $state(false)

  // Abonnements
  let abonnements = $state<any[]>([])
  let metaAbo = $state<any>(null)
  let pageAbo = $state(1)
  let filtreStatutAbo = $state('')
  let filtreExpirant = $state(false)

  // Factures
  let factures = $state<any[]>([])
  let pageFact = $state(1)

  // Demandes upgrade
  let demandes = $state<any[]>([])
  let pageDem = $state(1)
  let filtreStatutDem = $state('')

  let chargement = $state(true)
  let actionEnCours = $state('')

  // Modals
  let afficherModalRenouveler = $state(false)
  let afficherModalFacture = $state(false)
  let cabineSelectionnee = $state<any>(null)
  let demandeSelectionnee = $state<any>(null)
  let afficherModalDemande = $state(false)

  // Formulaires
  let formRenouveler = $state({ subscriptionType: 'basic', amountPaid: '', paymentMethod: 'cash', months: 1 })
  let formFacture = $state({ cabinId: '', subscriptionType: 'basic', amount: '', billingPeriodStart: '', billingPeriodEnd: '', dueDate: '' })
  let notesAdmin = $state('')
  let raisonRejet = $state('')

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function joursRestants(expiry: string | null) {
    if (!expiry) return null
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000)
    return diff
  }

  async function chargerPlans() {
    chargementPlans = true
    try {
      const res = await api.get('/admin/settings/subscription_plans')
      const setting = res.data?.data
      if (setting?.value) {
        const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value
        plans = { ...plans, ...parsed }
      }
    } catch {
      // Pas de config encore, valeurs par défaut utilisées
    } finally { chargementPlans = false }
  }

  async function sauvegarderPlans() {
    sauvegardePlans = true
    try {
      await api.put('/admin/settings/subscription_plans', { value: JSON.stringify(plans) })
      toast.succes('Plans mis à jour')
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { sauvegardePlans = false }
  }

  async function chargerAbonnements() {
    chargement = true
    try {
      const params: any = { page: pageAbo, per_page: 20 }
      if (filtreStatutAbo) params.status = filtreStatutAbo
      if (filtreExpirant) params.expiring_soon = 'true'
      const res = await api.get('/admin/subscriptions', { params })
      const d = res.data?.data
      abonnements = d?.data ?? d ?? []
      metaAbo = d?.meta ?? null
    } catch { toast.erreur(translate('toast.error'), translate('errors.load_subscriptions')) }
    finally { chargement = false }
  }

  async function chargerFactures() {
    chargement = true
    try {
      const res = await api.get('/admin/subscriptions/invoices', { params: { page: pageFact, per_page: 20 } })
      const d = res.data?.data
      factures = d?.data ?? d ?? []
      // metaFact non affiché (pas de pagination factures)
    } catch { toast.erreur(translate('toast.error'), translate('errors.load_invoices')) }
    finally { chargement = false }
  }

  async function chargerDemandes() {
    chargement = true
    try {
      const params: any = { page: pageDem, per_page: 20 }
      if (filtreStatutDem) params.status = filtreStatutDem
      const res = await api.get('/admin/subscriptions/upgrade-requests', { params })
      const d = res.data?.data
      demandes = d?.data ?? d ?? []
      // metaDem non affiché (pas de pagination demandes)
    } catch { toast.erreur(translate('toast.error'), translate('errors.load_requests')) }
    finally { chargement = false }
  }

  async function renouveler() {
    if (!cabineSelectionnee) return
    actionEnCours = 'renouveler'
    try {
      await api.post(`/admin/subscriptions/renew/${cabineSelectionnee.id}`, {
        subscriptionType: formRenouveler.subscriptionType,
        amountPaid: Number(formRenouveler.amountPaid),
        paymentMethod: formRenouveler.paymentMethod,
        months: Number(formRenouveler.months),
      })
      toast.succes(translate('success.subscription_renewed'))
      afficherModalRenouveler = false
      cabineSelectionnee = null
      await chargerAbonnements()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('errors.renew_subscription'))
    } finally { actionEnCours = '' }
  }

  async function creerFacture() {
    actionEnCours = 'facture'
    try {
      await api.post('/admin/subscriptions/invoices', {
        ...formFacture,
        amount: Number(formFacture.amount),
      })
      toast.succes(translate('success.invoice_created'))
      afficherModalFacture = false
      formFacture = { cabinId: '', subscriptionType: 'basic', amount: '', billingPeriodStart: '', billingPeriodEnd: '', dueDate: '' }
      await chargerFactures()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('errors.create_invoice'))
    } finally { actionEnCours = '' }
  }

  async function approuverDemande(id: string) {
    actionEnCours = id
    try {
      await api.post(`/admin/subscriptions/upgrade-requests/${id}/approve`, { adminNotes: notesAdmin })
      toast.succes(translate('success.request_approved'))
      afficherModalDemande = false
      notesAdmin = ''
      await chargerDemandes()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('errors.approve_request'))
    } finally { actionEnCours = '' }
  }

  async function rejeterDemande(id: string) {
    actionEnCours = id + '_reject'
    try {
      await api.post(`/admin/subscriptions/upgrade-requests/${id}/reject`, { rejectionReason: raisonRejet })
      toast.succes(translate('success.request_rejected'))
      afficherModalDemande = false
      raisonRejet = ''
      await chargerDemandes()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('errors.reject_request'))
    } finally { actionEnCours = '' }
  }

  $effect(() => {
    if (onglet === 'plans') chargerPlans()
    else if (onglet === 'abonnements') chargerAbonnements()
    else if (onglet === 'factures') chargerFactures()
    else chargerDemandes()
  })

  onMount(chargerPlans)
</script>

<svelte:head><title>{$t('page.subscriptions')} — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('page.subscriptions')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">{$t('subscriptions.description')}</p>
  </div>
  <div class="flex gap-2">
    {#if onglet === 'abonnements'}
      <button type="button" onclick={() => { cabineSelectionnee = null; afficherModalRenouveler = true }} class="btn-secondary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">autorenew</span>
        {$t('button.renew')}
      </button>
    {:else if onglet === 'factures'}
      <button type="button" onclick={() => afficherModalFacture = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
        {$t('button.new_invoice')}
      </button>
    {/if}
  </div>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [
    ['plans', 'workspace_premium', 'Plans'],
    ['abonnements', 'card_membership', 'page.subscriptions'],
    ['factures', 'receipt', 'page.invoices'],
    ['demandes', 'upgrade', 'page.upgrade_requests']
  ] as [val, icone, label]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {val === 'plans' ? label : $t(label)}
    </button>
  {/each}
</div>

<!-- ── Onglet Plans ── -->
{#if onglet === 'plans'}
  <div class="mb-5 flex items-center justify-between">
    <p class="text-sm text-slate-500">Configurez les noms et tarifs des plans d'abonnement proposés aux cabines.</p>
    <button onclick={sauvegarderPlans} disabled={sauvegardePlans}
      class="btn-primary">
      {#if sauvegardePlans}
        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {:else}
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>
        Enregistrer
      {/if}
    </button>
  </div>

  {#if chargementPlans}
    <div class="grid grid-cols-1 md:grid-cols-3 stagger gap-4">
      {#each Array(3) as _}<div class="skeleton h-52 rounded-2xl"></div>{/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 stagger gap-4">
      {#each [
        { key: 'basic',    couleur: '#64748b', label: 'Basic',    icone: 'star' },
        { key: 'standard', couleur: '#007A5E', label: 'Standard', icone: 'star_half' },
        { key: 'premium',  couleur: '#8b5cf6', label: 'Premium',  icone: 'workspace_premium' },
      ] as plan}
        {@const p = plans[plan.key]}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-6 flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:{plan.couleur}18">
              <span class="material-symbols-outlined icon-filled" style="font-size:20px;color:{plan.couleur}">{plan.icone}</span>
            </div>
            <div class="flex-1">
              <input
                type="text"
                bind:value={p.name}
                class="w-full text-base font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-orange-400 focus:outline-none py-0.5 transition-colors"
                placeholder="Nom du plan"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label for="{plan.key}-price" class="block text-xs font-semibold text-slate-500 mb-1.5">Prix mensuel (XAF)</label>
              <div class="relative">
                <input
                  id="{plan.key}-price"
                  type="number"
                  bind:value={p.price}
                  min="0"
                  class="w-full px-3 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="5000"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">XAF</span>
              </div>
            </div>

            <div>
              <label for="{plan.key}-maxorders" class="block text-xs font-semibold text-slate-500 mb-1.5">Commandes max / mois</label>
              <input
                id="{plan.key}-maxorders"
                type="number"
                bind:value={p.maxOrders}
                min="1"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="100"
              />
            </div>
          </div>

          <div class="mt-auto pt-4 border-t border-slate-50">
            <p class="text-xs text-slate-400">
              <span class="font-semibold text-slate-600">{p.price.toLocaleString('fr-CM')} XAF</span> / mois
              · max <span class="font-semibold text-slate-600">{p.maxOrders === 999 ? '∞' : p.maxOrders}</span> commandes
            </p>
          </div>
        </div>
      {/each}
    </div>
  {/if}

<!-- ── Onglet Abonnements ── -->
{:else if onglet === 'abonnements'}
  <!-- Filtres -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5">
    <div class="flex flex-wrap gap-3 items-center">
      <select bind:value={filtreStatutAbo} onchange={chargerAbonnements} class="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
        <option value="">{$t('filters.all_statuses')}</option>
        <option value="active">{$t('filters.active')}</option>
        <option value="expired">{$t('filters.expired')}</option>
        <option value="suspended">{$t('filters.suspended')}</option>
      </select>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={filtreExpirant} onchange={chargerAbonnements} class="w-4 h-4 accent-orange-500 rounded" />
        <span class="text-sm font-medium text-slate-700">{$t('filters.expiring_soon')}</span>
      </label>
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(8) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if abonnements.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">card_membership</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('empty.no_subscriptions')}</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">{$t('table.cabin')}</div>
        <div class="col-span-2">{$t('table.status')}</div>
        <div class="col-span-3">{$t('table.due_date')}</div>
        <div class="col-span-2">{$t('subscription.auto_renew')}</div>
        <div class="col-span-2">{$t('table.actions')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each abonnements as abo}
          {@const jours = joursRestants(abo.subscription_expiry)}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="lg:col-span-3">
              <p class="text-sm font-semibold text-slate-800">{abo.name ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <Badge statut={abo.subscription_status ?? 'inactive'} />
            </div>
            <div class="lg:col-span-3">
              <p class="text-sm text-slate-700">{formaterDate(abo.subscription_expiry)}</p>
              {#if jours !== null}
                <p class="text-xs {jours <= 0 ? 'text-red-500' : jours <= 7 ? 'text-amber-500' : 'text-slate-400'} font-medium">
                  {jours <= 0 ? $t('subscription.expired') : `${$t('subscription.in')} ${jours} ${jours > 1 ? $t('subscription.days') : $t('subscription.day')}`}
                </p>
              {/if}
            </div>
            <div class="lg:col-span-2">
              <span class="text-sm font-semibold {abo.auto_renew ? 'text-emerald-600' : 'text-slate-400'}">
                {$t(abo.auto_renew ? 'subscription.auto_renew.enabled' : 'subscription.auto_renew.disabled')}
              </span>
            </div>
            <div class="lg:col-span-2 flex gap-2">
              <button onclick={() => { cabineSelectionnee = abo; afficherModalRenouveler = true }}
                class="text-xs px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 flex items-center gap-1">
                <span class="material-symbols-outlined icon-filled" style="font-size:13px">autorenew</span>
                {$t('button.renew')}
              </button>
            </div>
          </div>
        {/each}
      </div>
      {#if metaAbo && metaAbo.lastPage > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">{$t('pagination.page')} {metaAbo.currentPage} {$t('pagination.of')} {metaAbo.lastPage}</p>
          <div class="flex gap-2">
            <button onclick={() => { pageAbo--; chargerAbonnements() }} disabled={pageAbo <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">{$t('button.previous')}</button>
            <button onclick={() => { pageAbo++; chargerAbonnements() }} disabled={pageAbo >= metaAbo.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">{$t('button.next')}</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>

<!-- ── Onglet Factures ── -->
{:else if onglet === 'factures'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(8) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if factures.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">receipt</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('empty.no_invoices')}</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-2">{$t('table.invoice_number')}</div>
        <div class="col-span-3">{$t('table.cabin')}</div>
        <div class="col-span-2">{$t('table.amount')}</div>
        <div class="col-span-2">{$t('table.status')}</div>
        <div class="col-span-3">{$t('table.due_date')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each factures as fact}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="lg:col-span-2">
              <p class="text-xs font-mono font-semibold text-orange-600">{fact.invoice_number ?? '—'}</p>
            </div>
            <div class="lg:col-span-3">
              <p class="text-sm text-slate-700">{fact.cabin_id ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-sm font-bold text-slate-900">{formaterMontant(fact.amount)}</p>
            </div>
            <div class="lg:col-span-2">
              <Badge statut={fact.status ?? 'pending'} />
            </div>
            <div class="lg:col-span-3">
              <p class="text-sm text-slate-600">{formaterDate(fact.due_date)}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

<!-- ── Onglet Demandes upgrade ── -->
{:else}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if demandes.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">upgrade</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('empty.no_requests')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each demandes as dem}
          <div class="flex flex-col gap-2 lg:flex-row lg:items-center px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{dem.cabin_name ?? '—'}</p>
              <p class="text-xs text-slate-500 mt-0.5">
                {dem.current_plan ?? '—'} → <span class="font-semibold text-orange-600">{dem.requested_plan ?? '—'}</span>
              </p>
              <p class="text-xs text-slate-400 mt-0.5">{formaterDate(dem.created_at)}</p>
            </div>
            <div class="flex items-center gap-2">
              <Badge statut={dem.status ?? 'pending'} />
              {#if dem.status === 'pending'}
                <button onclick={() => { demandeSelectionnee = dem; afficherModalDemande = true }}
                  class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200">
                  {$t('button.process')}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Modal : Renouveler abonnement -->
{#if afficherModalRenouveler}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('modal.renew_title')}</h3>
        <button onclick={() => afficherModalRenouveler = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        {#if cabineSelectionnee}
          <div class="p-3 rounded-xl bg-orange-50 border border-orange-100">
            <p class="text-xs text-orange-700 font-medium">{$t('form.cabin_id')}</p>
            <p class="text-sm font-bold text-slate-900">{cabineSelectionnee.name}</p>
          </div>
        {:else}
          <div>
            <label for="ren-cabin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.cabin_id')}</label>
            <input id="ren-cabin" type="text" bind:value={formRenouveler.subscriptionType} placeholder={$t('form.cabin_id_placeholder')} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        {/if}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ren-type" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.plan')}</label>
            <select id="ren-type" bind:value={formRenouveler.subscriptionType} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="basic">{$t('plan.basic')}</option>
              <option value="standard">{$t('plan.standard')}</option>
              <option value="premium">{$t('plan.premium')}</option>
            </select>
          </div>
          <div>
            <label for="ren-months" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.duration_months')}</label>
            <input id="ren-months" type="number" bind:value={formRenouveler.months} min="1" max="12" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ren-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.amount_paid')}</label>
            <input id="ren-amount" type="number" bind:value={formRenouveler.amountPaid} placeholder="5000" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="ren-method" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.payment_method')}</label>
            <select id="ren-method" bind:value={formRenouveler.paymentMethod} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="cash">{$t('form.method.cash')}</option>
              <option value="mtn_money">{$t('form.method.mtn_money')}</option>
              <option value="orange_money">{$t('form.method.orange_money')}</option>
              <option value="virement">{$t('form.method.bank_transfer')}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalRenouveler = false} class="btn-secondary flex-1">{$t('button.cancel')}</button>
          <button onclick={renouveler} disabled={actionEnCours === 'renouveler'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'renouveler'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">autorenew</span>{$t('button.renew')}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Facture -->
{#if afficherModalFacture}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('modal.invoice_title')}</h3>
        <button type="button" onclick={() => afficherModalFacture = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="facture-cabin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.cabin_id')}</label>
          <input id="facture-cabin" type="text" bind:value={formFacture.cabinId} placeholder={$t('form.cabin_id_placeholder')} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="facture-type" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.plan')}</label>
          <select id="facture-type" bind:value={formFacture.subscriptionType} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="basic">{$t('plan.basic')}</option>
            <option value="standard">{$t('plan.standard')}</option>
            <option value="premium">{$t('plan.premium')}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="facture-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.amount_paid')}</label>
            <input id="facture-amount" type="number" bind:value={formFacture.amount} placeholder="10000" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="facture-due" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.due_date')}</label>
            <input id="facture-due" type="date" bind:value={formFacture.dueDate} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="facture-begin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.billing_period_start')}</label>
            <input id="facture-begin" type="date" bind:value={formFacture.billingPeriodStart} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="facture-end" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.billing_period_end')}</label>
            <input id="facture-end" type="date" bind:value={formFacture.billingPeriodEnd} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick={() => afficherModalFacture = false} class="btn-secondary flex-1">{$t('button.cancel')}</button>
          <button type="button" onclick={creerFacture} disabled={actionEnCours === 'facture'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'facture'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}{$t('button.create_invoice')}{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Traiter demande upgrade -->
{#if afficherModalDemande && demandeSelectionnee}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('modal.request_title')}</h3>
        <button onclick={() => afficherModalDemande = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p class="text-sm font-semibold text-slate-800">{demandeSelectionnee.cabin_name}</p>
          <p class="text-xs text-slate-500 mt-1">
            {demandeSelectionnee.current_plan} → <span class="font-bold text-orange-600">{demandeSelectionnee.requested_plan}</span>
          </p>
          {#if demandeSelectionnee.reason}
            <p class="text-xs text-slate-600 mt-2 italic">"{demandeSelectionnee.reason}"</p>
          {/if}
        </div>
        <div>
          <label for="notes-admin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.notes_admin')}</label>
          <textarea id="notes-admin" bind:value={notesAdmin} rows="2" placeholder={$t('form.notes_optional')} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div>
          <label for="raison-rejet" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('form.rejection_reason')}</label>
          <input id="raison-rejet" type="text" bind:value={raisonRejet} placeholder={$t('form.rejection_reason_placeholder')} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3">
          <button onclick={() => rejeterDemande(demandeSelectionnee.id)} disabled={!raisonRejet || actionEnCours === demandeSelectionnee.id + '_reject'}
            class="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === demandeSelectionnee.id + '_reject'}<span class="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>{:else}{$t('button.reject')}{/if}
          </button>
          <button onclick={() => approuverDemande(demandeSelectionnee.id)} disabled={actionEnCours === demandeSelectionnee.id}
            class="btn-primary flex-1 justify-center">
            {#if actionEnCours === demandeSelectionnee.id}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">check</span>{$t('button.approve')}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
