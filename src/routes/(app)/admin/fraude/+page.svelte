<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'
  import StatCard from '$lib/components/ui/StatCard.svelte'

  type Onglet = 'blacklist' | 'verifier'
  let onglet = $state<Onglet>('blacklist')

  let blacklist = $state<any[]>([])
  let metaBl = $state<any>(null)
  let pageBl = $state(1)
  let stats = $state<any>(null)
  let chargement = $state(true)
  let actionEnCours = $state('')

  // Vérification téléphone
  let phoneAVerifier = $state('')
  let resultVerif = $state<any>(null)
  let verificationEnCours = $state(false)

  // Vérification reçu
  let imageUrl = $state('')
  let montantAttendu = $state('')
  let phoneAttendu = $state('')
  let orderId = $state('')
  let resultRecu = $state<any>(null)
  let verificationRecuEnCours = $state(false)

  // Modal ajout blacklist
  let afficherModalAjout = $state(false)
  let formBl = $state({ phone: '', reason: '', expiresInDays: '' })

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function charger() {
    chargement = true
    try {
      const [blRes, statsRes] = await Promise.all([
        api.get('/admin/fraud/blacklist', { params: { page: pageBl, per_page: 20 } }),
        api.get('/admin/fraud/stats'),
      ])
      const d = blRes.data?.data
      blacklist = d?.data ?? d ?? []
      metaBl = d?.meta ?? null
      stats = statsRes.data?.data ?? null
    } catch { toast.erreur(translate('toast.error'), translate('common.error_load')) }
    finally { chargement = false }
  }

  async function ajouterBlacklist() {
    actionEnCours = 'ajouter'
    try {
      await api.post('/admin/fraud/blacklist', {
        phone: formBl.phone,
        reason: formBl.reason,
        expiresInDays: formBl.expiresInDays ? Number(formBl.expiresInDays) : undefined,
      })
      toast.succes(translate('admin.fraud.blocked'), formBl.phone)
      afficherModalAjout = false
      formBl = { phone: '', reason: '', expiresInDays: '' }
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally { actionEnCours = '' }
  }

  async function retirerBlacklist(phone: string) {
    actionEnCours = phone
    try {
      await api.delete(`/admin/fraud/blacklist/${phone}`)
      toast.succes(translate('admin.fraud.unblocked'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally { actionEnCours = '' }
  }

  async function verifierTelephone() {
    if (!phoneAVerifier) return
    verificationEnCours = true
    resultVerif = null
    try {
      const res = await api.post('/admin/fraud/check-phone', { phone: phoneAVerifier })
      resultVerif = res.data?.data ?? null
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally { verificationEnCours = false }
  }

  async function verifierRecu() {
    if (!imageUrl) return
    verificationRecuEnCours = true
    resultRecu = null
    try {
      const res = await api.post('/admin/fraud/verify-receipt', {
        imageUrl,
        expectedAmount: montantAttendu ? Number(montantAttendu) : undefined,
        expectedPhone: phoneAttendu || undefined,
        orderId: orderId || undefined,
      })
      resultRecu = res.data?.data ?? null
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally { verificationRecuEnCours = false }
  }

  onMount(charger)
</script>

<svelte:head><title>{$t('admin.fraud.title')} — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('admin.fraud.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">{$t('admin.fraud.subtitle')}</p>
  </div>
  <button onclick={() => afficherModalAjout = true} class="btn-primary">
    <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>
    {$t('admin.fraud.block_number')}
  </button>
</div>

<!-- Stats -->
{#if stats}
  <div class="grid grid-cols-2 lg:grid-cols-4 stagger gap-3 mb-5">
    <StatCard titre={$t('admin.fraud.stat.blocked')} valeur={stats.totalBlacklisted ?? 0} icone="block" couleur="rouge" />
    <StatCard titre={$t('admin.fraud.stat.attempts')} valeur={stats.blockedAttempts ?? 0} icone="security" couleur="orange" />
    <StatCard titre={$t('admin.fraud.stat.receipts')} valeur={stats.receiptsVerified ?? 0} icone="receipt_long" couleur="bleu" />
    <StatCard titre={$t('admin.fraud.stat.detected')} valeur={stats.fraudsDetected ?? 0} icone="warning" couleur="jaune" />
  </div>
{/if}

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['blacklist', 'block', 'admin.fraud.blacklist'], ['verifier', 'search', 'admin.fraud.verify']] as [val, icone, labelKey]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {$t(labelKey)}
    </button>
  {/each}
</div>

{#if onglet === 'blacklist'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(8) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if blacklist.length === 0}
      <div class="py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:28px">verified_user</span>
        </div>
        <p class="text-slate-600 font-semibold">{$t('admin.fraud.blacklist_empty')}</p>
        <p class="text-slate-400 text-sm mt-1">{$t('admin.fraud.blacklist_empty_hint')}</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">{$t('admin.fraud.col_number')}</div>
        <div class="col-span-4">{$t('admin.fraud.col_reason')}</div>
        <div class="col-span-2">{$t('admin.fraud.col_blocked_at')}</div>
        <div class="col-span-2">{$t('admin.fraud.col_expires')}</div>
        <div class="col-span-1">{$t('common.actions')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each blacklist as item}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="lg:col-span-3 flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:14px">block</span>
              </div>
              <span class="text-sm font-mono font-semibold text-slate-900">{item.phone ?? item.phone_number ?? '—'}</span>
            </div>
            <div class="lg:col-span-4">
              <p class="text-sm text-slate-600 line-clamp-2">{item.reason ?? '—'}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-xs text-slate-500">{formaterDate(item.created_at ?? item.blocked_at)}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-xs {item.expires_at ? 'text-amber-600' : 'text-slate-400'}">
                {item.expires_at ? formaterDate(item.expires_at) : $t('admin.fraud.permanent')}
              </p>
            </div>
            <div class="lg:col-span-1">
              <button onclick={() => retirerBlacklist(item.phone ?? item.phone_number)}
                disabled={actionEnCours === (item.phone ?? item.phone_number)}
                class="text-xs px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 disabled:opacity-50">
                {actionEnCours === (item.phone ?? item.phone_number) ? '...' : $t('admin.fraud.unblock')}
              </button>
            </div>
          </div>
        {/each}
      </div>
      {#if metaBl && metaBl.lastPage > 1}
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">{$t('pagination.page')} {metaBl.currentPage} {$t('pagination.of')} {metaBl.lastPage}</p>
          <div class="flex gap-2">
            <button onclick={() => { pageBl--; charger() }} disabled={pageBl <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← {$t('button.previous')}</button>
            <button onclick={() => { pageBl++; charger() }} disabled={pageBl >= metaBl.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">{$t('button.next')} →</button>
          </div>
        </div>
      {/if}
    {/if}
  </div>

{:else}
  <!-- Vérification -->
  <div class="grid grid-cols-1 lg:grid-cols-2 stagger gap-5">
    <!-- Vérifier un téléphone -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">phone_in_talk</span>
        </div>
        <h3 class="font-bold text-slate-900">{$t('admin.fraud.verify_phone')}</h3>
      </div>
      <div class="p-5 space-y-4">
        <div class="flex gap-2">
          <input type="tel" bind:value={phoneAVerifier} placeholder="6XXXXXXXX"
            onkeydown={(e) => e.key === 'Enter' && verifierTelephone()}
            class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <button onclick={verifierTelephone} disabled={!phoneAVerifier || verificationEnCours} class="btn-primary">
            {#if verificationEnCours}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">search</span>{/if}
          </button>
        </div>

        {#if resultVerif}
          <div class="p-4 rounded-xl border {resultVerif.blacklisted ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined icon-filled {resultVerif.blacklisted ? 'text-red-500' : 'text-emerald-500'}" style="font-size:20px">
                {resultVerif.blacklisted ? 'block' : 'verified'}
              </span>
              <p class="font-bold {resultVerif.blacklisted ? 'text-red-700' : 'text-emerald-700'}">
                {resultVerif.blacklisted ? $t('admin.fraud.phone_blocked') : $t('admin.fraud.phone_ok')}
              </p>
            </div>
            {#if resultVerif.blacklistReason}
              <p class="text-sm text-red-700 mb-2">{$t('admin.fraud.col_reason')} : {resultVerif.blacklistReason}</p>
            {/if}
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-slate-500 mb-0.5">{$t('admin.fraud.risk_score')}</p>
                <p class="font-bold {resultVerif.riskScore > 70 ? 'text-red-600' : resultVerif.riskScore > 40 ? 'text-amber-600' : 'text-emerald-600'}">
                  {resultVerif.riskScore ?? 0}/100
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-0.5">{$t('admin.fraud.recommendation')}</p>
                <p class="font-semibold text-slate-800 capitalize">{resultVerif.recommendation ?? '—'}</p>
              </div>
            </div>
            {#if resultVerif.riskFlags?.length > 0}
              <div class="mt-3">
                <p class="text-xs text-slate-500 mb-1.5">{$t('admin.fraud.signals')}</p>
                <div class="flex flex-wrap gap-1.5">
                  {#each resultVerif.riskFlags as flag}
                    <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{flag}</span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Vérifier un reçu -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:18px">receipt_long</span>
        </div>
        <h3 class="font-bold text-slate-900">{$t('admin.fraud.verify_receipt')}</h3>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label for="receipt-url" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.image_url')} *</label>
          <input id="receipt-url" type="url" bind:value={imageUrl} placeholder="https://..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="receipt-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.expected_amount')}</label>
            <input id="receipt-amount" type="number" bind:value={montantAttendu} placeholder="5000" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="receipt-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.expected_phone')}</label>
            <input id="receipt-phone" type="tel" bind:value={phoneAttendu} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div>
          <label for="receipt-order" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.order_id')}</label>
          <input id="receipt-order" type="text" bind:value={orderId} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <button onclick={verifierRecu} disabled={!imageUrl || verificationRecuEnCours} class="btn-primary w-full justify-center">
          {#if verificationRecuEnCours}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">document_scanner</span>{/if}
          {$t('admin.fraud.analyze')}
        </button>

        {#if resultRecu}
          <div class="p-4 rounded-xl border {resultRecu.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined icon-filled {resultRecu.isValid ? 'text-emerald-500' : 'text-red-500'}" style="font-size:20px">
                {resultRecu.isValid ? 'verified' : 'cancel'}
              </span>
              <p class="font-bold {resultRecu.isValid ? 'text-emerald-700' : 'text-red-700'}">
                {resultRecu.isValid ? $t('admin.fraud.receipt_valid') : $t('admin.fraud.receipt_invalid')}
              </p>
            </div>
            {#if resultRecu.extractedAmount}
              <p class="text-sm text-slate-700">{$t('admin.fraud.extracted_amount')} : <span class="font-bold">{resultRecu.extractedAmount} XAF</span></p>
            {/if}
            {#if resultRecu.reason}
              <p class="text-sm text-slate-600 mt-1">{resultRecu.reason}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Ajouter à la blacklist -->
{#if afficherModalAjout}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.fraud.block_number')}</h3>
        <button onclick={() => afficherModalAjout = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="bl-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('common.phone')} *</label>
          <input id="bl-phone" type="tel" bind:value={formBl.phone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
        </div>
        <div>
          <label for="bl-reason" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.col_reason')} *</label>
          <textarea id="bl-reason" bind:value={formBl.reason} rows="2" placeholder="{$t('admin.fraud.reason_placeholder')}" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" required></textarea>
        </div>
        <div>
          <label for="bl-expires" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.fraud.expires_days')}</label>
          <input id="bl-expires" type="number" bind:value={formBl.expiresInDays} placeholder="Ex: 30" min="1" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalAjout = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={ajouterBlacklist} disabled={!formBl.phone || !formBl.reason || actionEnCours === 'ajouter'}
            class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if actionEnCours === 'ajouter'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">block</span>{$t('admin.fraud.block_number')}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

