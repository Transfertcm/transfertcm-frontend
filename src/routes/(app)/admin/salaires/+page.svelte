<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import { t, translate } from '$lib/stores/locale'

  type Onglet = 'sessions' | 'paiements' | 'config'
  let onglet = $state<Onglet>('sessions')

  let sessions = $state<any[]>([])
  let paiements = $state<any[]>([])
  let config = $state<any>(null)
  let sessionActive = $state<any>(null)

  let chargement = $state(true)
  let actionEnCours = $state('')

  // Modals
  let afficherModalPaiement = $state(false)
  let afficherModalConfig = $state(false)

  let formPaiement = $state({ adminId: '', amountPaid: '', paymentMethod: 'cash', notes: '' })
  let formConfig = $state({ weeklyBudget: '', weekStartDay: 1, eligibleEmails: '' })
  let admins = $state<any[]>([])

  const joursSemaine = [
    [1, 'admin.salary.day.monday'], [2, 'admin.salary.day.tuesday'], [3, 'admin.salary.day.wednesday'],
    [4, 'admin.salary.day.thursday'], [5, 'admin.salary.day.friday'], [6, 'admin.salary.day.saturday'],
    [7, 'admin.salary.day.sunday'],
  ] as const

  // Timer session active
  let tempsEcoule = $state(0)
  let intervalTimer: ReturnType<typeof setInterval> | null = null

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formaterDuree(secondes: number) {
    const h = Math.floor(secondes / 3600)
    const m = Math.floor((secondes % 3600) / 60)
    const s = secondes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function formaterMontant(n: any) {
    const num = Number(n)
    if (isNaN(num)) return '—'
    return num.toLocaleString('fr-CM') + ' XAF'
  }

  function nomAdmin(id: string | null) {
    if (!id) return '—'
    if (id === auth.user?.id) return auth.user?.fullName || auth.user?.email || 'Vous'
    const a = admins.find((x: any) => x.id === id)
    return a ? (a.fullName || a.email) : `Admin ${id.slice(-8)}`
  }

  async function chargerAdmins() {
    if (auth.user?.role !== 'super_admin') return
    try {
      const res = await api.get('/admin/team')
      admins = (res.data?.data ?? []).filter((a: any) => a.role !== 'cabin')
    } catch {}
  }

  async function chargerSessionActive() {
    if (!auth.user?.id) return
    const res = await api.get('/admin/salary/sessions', { params: { admin_id: auth.user.id, per_page: 1 } })
    const derniere = (res.data?.data ?? [])[0]
    sessionActive = derniere && ['in_progress', 'paused'].includes(derniere.status) ? derniere : null
    mettreAJourTimer()
  }

  async function charger() {
    chargement = true
    try {
      const sessionParams: any = { per_page: 20 }
      if (auth.user?.role !== 'super_admin') sessionParams.admin_id = auth.user?.id

      const [sessRes, payRes, cfgRes] = await Promise.all([
        api.get('/admin/salary/sessions', { params: sessionParams }),
        api.get('/admin/salary/payments', { params: { ...sessionParams } }),
        api.get('/admin/salary/config'),
        chargerSessionActive(),
      ])
      sessions = sessRes.data?.data ?? []
      paiements = payRes.data?.data ?? []
      config = cfgRes.data?.data ?? null

      if (config) {
        formConfig = {
          weeklyBudget: config.weeklyBudget ?? '',
          weekStartDay: Number(config.weekStartDay) || 1,
          eligibleEmails: Array.isArray(config.eligibleEmails) ? config.eligibleEmails.join(', ') : '',
        }
      }
    } catch { toast.erreur(translate('toast.error'), translate('salary.error_load')) }
    finally { chargement = false }
  }

  function secondesTravaillees(sess: any, maintenant = Date.now()) {
    const debut = new Date(sess.startedAt).getTime()
    const fin = sess.status === 'paused' && sess.pausedAt ? new Date(sess.pausedAt).getTime() : maintenant
    return Math.max(0, Math.floor((fin - debut) / 1000) - (sess.totalPausedSeconds ?? 0))
  }

  function mettreAJourTimer() {
    if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null }
    if (!sessionActive) { tempsEcoule = 0; return }
    tempsEcoule = secondesTravaillees(sessionActive)
    if (sessionActive.status !== 'in_progress') return
    intervalTimer = setInterval(() => {
      if (sessionActive) tempsEcoule = secondesTravaillees(sessionActive)
    }, 1000)
  }

  async function demarrerSession() {
    actionEnCours = 'start'
    try {
      const res = await api.post('/admin/salary/sessions/start')
      sessionActive = res.data?.data ?? null
      mettreAJourTimer()
      toast.succes(translate('salary.session_started'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('salary.error_start'))
    } finally { actionEnCours = '' }
  }

  async function pauserSession() {
    if (!sessionActive) return
    actionEnCours = 'pause'
    try {
      await api.patch(`/admin/salary/sessions/${sessionActive.id}/pause`)
      toast.succes(translate('salary.session_paused'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('salary.error_pause'))
    } finally { actionEnCours = '' }
  }

  async function reprendreSession() {
    if (!sessionActive) return
    actionEnCours = 'resume'
    try {
      await api.patch(`/admin/salary/sessions/${sessionActive.id}/resume`)
      toast.succes(translate('salary.session_resumed'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('salary.error_resume'))
    } finally { actionEnCours = '' }
  }

  async function arreterSession() {
    if (!sessionActive) return
    actionEnCours = 'stop'
    try {
      const res = await api.patch(`/admin/salary/sessions/${sessionActive.id}/stop`)
      const data = res.data?.data
      toast.succes(translate('salary.session_stopped'), translate('salary.earned') + ' : ' + formaterMontant(data?.amountEarned))
      sessionActive = null
      mettreAJourTimer()
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('salary.error_stop'))
    } finally { actionEnCours = '' }
  }

  async function enregistrerPaiement() {
    actionEnCours = 'paiement'
    try {
      await api.post('/admin/salary/payments', {
        ...formPaiement,
        amountPaid: Number(formPaiement.amountPaid),
      })
      toast.succes(translate('salary.payment_recorded'))
      afficherModalPaiement = false
      formPaiement = { adminId: '', amountPaid: '', paymentMethod: 'cash', notes: '' }
      await charger()
    } catch (e: any) {
      const detail = e.response?.data?.errors?.map((x: any) => x.message).join(' ')
      toast.erreur(translate('toast.error'), detail || (e.response?.data?.message ?? translate('salary.error_save')))
    } finally { actionEnCours = '' }
  }

  async function sauvegarderConfig() {
    actionEnCours = 'config'
    try {
      await api.put('/admin/salary/config', {
        weeklyBudget: Number(formConfig.weeklyBudget),
        weekStartDay: Number(formConfig.weekStartDay),
        eligibleEmails: formConfig.eligibleEmails.split(',').map((e: string) => e.trim()).filter(Boolean),
      })
      toast.succes(translate('salary.config_saved'))
      afficherModalConfig = false
      await charger()
    } catch (e: any) {
      const detail = e.response?.data?.errors?.map((x: any) => x.message).join(' ')
      toast.erreur(translate('toast.error'), detail || (e.response?.data?.message ?? translate('salary.error_config')))
    } finally { actionEnCours = '' }
  }

  const idUtilisateur = $derived(auth.user?.id)

  $effect(() => {
    if (!idUtilisateur) return
    untrack(() => { charger(); chargerAdmins() })
  })

  onMount(() => () => { if (intervalTimer) clearInterval(intervalTimer) })

  const estSuperAdmin = $derived(auth.user?.role === 'super_admin')

  const couleurStatut: Record<string, string> = {
    in_progress: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    stopped: 'bg-slate-100 text-slate-600',
  }
</script>

<svelte:head><title>{$t('admin.salary.title')} — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">{$t('admin.salary.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">{$t('admin.salary.subtitle')}</p>
  </div>
  {#if estSuperAdmin}
    <div class="flex gap-2">
      <button onclick={() => afficherModalConfig = true} class="btn-secondary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">settings</span>
        {$t('admin.salary.config')}
      </button>
      <button onclick={() => afficherModalPaiement = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">payments</span>
        {$t('admin.salary.record_payment')}
      </button>
    </div>
  {/if}
</div>

<!-- Widget session active -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5">
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
        <span class="material-symbols-outlined text-white icon-filled" style="font-size:22px">timer</span>
      </div>
      <div>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">{$t('admin.salary.my_session')}</p>
        {#if sessionActive}
          <p class="text-2xl font-black text-slate-900 font-mono">{formaterDuree(tempsEcoule)}</p>
          <p class="text-xs {sessionActive.status === 'in_progress' ? 'text-emerald-600' : 'text-amber-600'} font-semibold mt-0.5">
            {sessionActive.status === 'in_progress' ? $t('admin.salary.status_in_progress') : $t('admin.salary.status_paused')}
          </p>
        {:else}
          <p class="text-lg font-bold text-slate-400">{$t('admin.salary.no_active_session')}</p>
        {/if}
      </div>
    </div>
    <div class="flex gap-2">
      {#if !sessionActive}
        <button onclick={demarrerSession} disabled={actionEnCours === 'start'} class="btn-primary">
          {#if actionEnCours === 'start'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">play_arrow</span>{/if}
          {$t('admin.salary.start')}
        </button>
      {:else if sessionActive.status === 'in_progress'}
        <button onclick={pauserSession} disabled={actionEnCours === 'pause'} class="btn-secondary">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">pause</span>
          {$t('admin.salary.pause')}
        </button>
        <button onclick={arreterSession} disabled={actionEnCours === 'stop'}
          class="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">stop</span>
          {$t('admin.salary.stop')}
        </button>
      {:else}
        <button onclick={reprendreSession} disabled={actionEnCours === 'resume'} class="btn-primary">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">play_arrow</span>
          {$t('admin.salary.resume')}
        </button>
        <button onclick={arreterSession} disabled={actionEnCours === 'stop'}
          class="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50">
          <span class="material-symbols-outlined icon-filled" style="font-size:16px">stop</span>
          {$t('admin.salary.stop')}
        </button>
      {/if}
    </div>
  </div>
  {#if config}
    <div class="mt-4 pt-4 border-t border-slate-100 flex gap-6 text-sm">
      <div>
        <p class="text-xs text-slate-400">{$t('admin.salary.weekly_budget')}</p>
        <p class="font-bold text-slate-900">{formaterMontant(config.weeklyBudget)}</p>
      </div>
      <div>
        <p class="text-xs text-slate-400">{$t('admin.salary.hourly_rate')}</p>
        <p class="font-bold text-slate-900">{formaterMontant(Math.round(config.hourlyRate ?? 0))}/h</p>
      </div>
    </div>
  {/if}
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each [['sessions', 'timer', 'admin.salary.tab_sessions'], ['paiements', 'payments', 'admin.salary.tab_payments']] as [val, icone, labelKey]}
    <button onclick={() => onglet = val as Onglet}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {$t(labelKey)}
    </button>
  {/each}
</div>

{#if onglet === 'sessions'}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if sessions.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">{$t('admin.salary.no_sessions')}</p>
      </div>
    {:else}
      <div class="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        <div class="col-span-3">{$t('admin.salary.col_admin')}</div>
        <div class="col-span-2">{$t('admin.salary.col_status')}</div>
        <div class="col-span-3">{$t('admin.salary.col_started')}</div>
        <div class="col-span-2">{$t('admin.salary.col_duration')}</div>
        <div class="col-span-2">{$t('admin.salary.col_earned')}</div>
      </div>
      <div class="divide-y divide-slate-50">
        {#each sessions as sess}
          <div class="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center px-5 py-3.5 hover:bg-slate-50 transition-all">
            <div class="lg:col-span-3">
              <p class="text-sm font-semibold text-slate-800">{nomAdmin(sess.adminId)}</p>
            </div>
            <div class="lg:col-span-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full {couleurStatut[sess.status] ?? 'bg-slate-100 text-slate-600'}">
                {sess.status === 'in_progress' ? $t('admin.salary.status.in_progress') : sess.status === 'paused' ? $t('admin.salary.status.paused') : $t('admin.salary.status.stopped')}
              </span>
            </div>
            <div class="lg:col-span-3">
              <p class="text-xs text-slate-500">{formaterDate(sess.startedAt)}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-sm font-mono text-slate-700">{formaterDuree(sess.status === 'stopped' ? (sess.workedSeconds ?? 0) : sess.id === sessionActive?.id ? tempsEcoule : secondesTravaillees(sess))}</p>
            </div>
            <div class="lg:col-span-2">
              <p class="text-sm font-bold text-slate-900">{sess.status === 'stopped' ? formaterMontant(sess.amountEarned) : '—'}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

{:else}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
    {#if chargement}
      <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}</div>
    {:else if paiements.length === 0}
      <div class="py-20 text-center">
        <p class="text-slate-600 font-semibold">{$t('admin.salary.no_payments')}</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each paiements as pay}
          <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:18px">payments</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{nomAdmin(pay.adminId)}</p>
              <p class="text-xs text-slate-400">{formaterDate(pay.paymentDate ?? pay.createdAt)} · {pay.paymentMethod ? $t('admin.salary.method.' + pay.paymentMethod) : '—'}{pay.notes ? ` · ${pay.notes}` : ''}</p>
            </div>
            <p class="text-sm font-bold text-emerald-600">{formaterMontant(pay.amountPaid)}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- Modal : Enregistrer paiement -->
{#if afficherModalPaiement}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.salary.modal_payment_title')}</h3>
        <button onclick={() => afficherModalPaiement = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="pay-admin" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.col_admin')} *</label>
          <select id="pay-admin" bind:value={formPaiement.adminId} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required>
            <option value="">—</option>
            {#each admins as a}
              <option value={a.id}>{a.fullName || a.email}{a.fullName ? ` (${a.email})` : ''}</option>
            {/each}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pay-amount" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.amount_xaf')} *</label>
            <input id="pay-amount" type="number" bind:value={formPaiement.amountPaid} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
          </div>
          <div>
            <label for="pay-method" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.method')}</label>
            <select id="pay-method" bind:value={formPaiement.paymentMethod} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="cash">{$t('admin.salary.method.cash')}</option>
              <option value="mtn_money">{$t('admin.salary.method.mtn_money')}</option>
              <option value="orange_money">{$t('admin.salary.method.orange_money')}</option>
              <option value="virement">{$t('admin.salary.method.virement')}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="pay-notes" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.notes')}</label>
          <input id="pay-notes" type="text" bind:value={formPaiement.notes} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalPaiement = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={enregistrerPaiement} disabled={!formPaiement.adminId || !formPaiement.amountPaid || actionEnCours === 'paiement'} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'paiement'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">payments</span>{$t('common.save')}{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal : Configuration -->
{#if afficherModalConfig}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">{$t('admin.salary.modal_config_title')}</h3>
        <button onclick={() => afficherModalConfig = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="cfg-budget" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.weekly_budget_xaf')}</label>
          <input id="cfg-budget" type="number" bind:value={formConfig.weeklyBudget} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label for="cfg-day" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.week_start')}</label>
          <select id="cfg-day" bind:value={formConfig.weekStartDay} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            {#each joursSemaine as [val, cle]}
              <option value={val}>{$t(cle)}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="cfg-emails" class="block text-xs font-semibold text-slate-600 mb-1.5">{$t('admin.salary.eligible_emails')}</label>
          <textarea id="cfg-emails" bind:value={formConfig.eligibleEmails} rows="3" placeholder={$t('admin.salary.emails_placeholder')} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalConfig = false} class="btn-secondary flex-1">{$t('common.cancel')}</button>
          <button onclick={sauvegarderConfig} disabled={actionEnCours === 'config' || !(Number(formConfig.weeklyBudget) > 0)} class="btn-primary flex-1 justify-center">
            {#if actionEnCours === 'config'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>{$t('common.save')}{/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
