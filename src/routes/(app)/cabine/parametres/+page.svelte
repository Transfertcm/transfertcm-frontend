<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  let chargement = $state(true)

  // Valeurs actuelles (serveur)
  let ussdMtn    = $state('auto_ussd')
  let ussdOrange = $state('auto_ussd')
  let notifType  = $state('sms')

  // Quel panneau est ouvert
  let ouvert = $state<'ussd-mtn' | 'ussd-orange' | 'notif' | null>(null)

  // Indicateurs de sauvegarde par section
  let saving = $state<Record<string, boolean>>({})
  let saved  = $state<Record<string, boolean>>({})

  const USSD_OPTIONS = [
    {
      val:  'auto_ussd',
      label: 'Automatique',
      icon:  'bolt',
      desc:  'Le système déclenche le USSD sans intervention',
    },
    {
      val:  'method_161',
      label: 'Menu *161#',
      icon:  'dialpad',
      desc:  'L\'agent compose le menu opérateur manuellement',
    },
    {
      val:  'copy_only',
      label: 'Copier-coller',
      icon:  'content_copy',
      desc:  'Le code USSD est affiché pour copie manuelle',
    },
  ]

  const NOTIF_OPTIONS = [
    {
      val:  'sms',
      label: 'SMS',
      icon:  'sms',
      color: 'bg-blue-500',
      desc:  'Alerte par message texte',
    },
    {
      val:  'whatsapp',
      label: 'WhatsApp',
      icon:  'chat',
      color: 'bg-emerald-500',
      desc:  'Alerte via WhatsApp',
    },
    {
      val:  'push',
      label: 'Push',
      icon:  'notifications_active',
      color: 'bg-violet-500',
      desc:  'Notification push',
    },
  ]

  const USSD_LABEL: Record<string, string> = {
    auto_ussd:  'Automatique',
    method_161: 'Menu *161#',
    copy_only:  'Copier-coller',
  }

  const NOTIF_LABEL: Record<string, string> = {
    sms:      'SMS',
    whatsapp: 'WhatsApp',
    push:     'Push',
  }

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/profile')
      const d = res.data?.data
      if (d) {
        ussdMtn    = d.ussd?.mtn    ?? 'auto_ussd'
        ussdOrange = d.ussd?.orange ?? 'auto_ussd'
        notifType  = d.notificationType ?? 'sms'
      }
    } catch {
      toast.erreur('Erreur', 'Impossible de charger les paramètres')
    } finally {
      chargement = false
    }
  }

  async function selectUssd(op: 'mtn' | 'orange', val: string) {
    if (op === 'mtn') ussdMtn = val
    else ussdOrange = val
    ouvert = null

    const key = `ussd-${op}`
    saving = { ...saving, [key]: true }
    saved  = { ...saved,  [key]: false }
    try {
      await apiCabin.put('/cabin/profile/ussd-preferences', {
        mtn: ussdMtn, orange: ussdOrange,
      })
      saved = { ...saved, [key]: true }
      setTimeout(() => { saved = { ...saved, [key]: false } }, 2000)
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally {
      saving = { ...saving, [key]: false }
    }
  }

  async function selectNotif(val: string) {
    notifType = val
    ouvert = null

    saving = { ...saving, notif: true }
    saved  = { ...saved,  notif: false }
    try {
      await apiCabin.put('/cabin/profile/notifications', { notificationType: val })
      saved = { ...saved, notif: true }
      setTimeout(() => { saved = { ...saved, notif: false } }, 2000)
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de sauvegarder')
      notifType = notifType // rollback visuel non implémenté
    } finally {
      saving = { ...saving, notif: false }
    }
  }

  function toggle(panel: typeof ouvert) {
    ouvert = ouvert === panel ? null : panel
  }

  onMount(charger)
</script>

<svelte:head><title>Paramètres — Espace cabine</title></svelte:head>

<div class="mb-8">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Paramètres</h2>
  <p class="text-sm text-slate-500 mt-0.5">Configurez votre mode de paiement USSD et vos alertes</p>
</div>

{#if chargement}
  <div class="space-y-px">
    {#each Array(5) as _}
      <div class="skeleton h-16 first:rounded-t-2xl last:rounded-b-2xl"></div>
    {/each}
  </div>
{:else}

  <!-- ── Section USSD ───────────────────────────────────────────── -->
  <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Paiement USSD</p>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden mb-6">

    <!-- Ligne MTN -->
    <div>
      <button
        type="button"
        onclick={() => toggle('ussd-mtn')}
        class="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <!-- Icône opérateur -->
        <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
          <span class="w-3 h-3 rounded-full bg-amber-400"></span>
        </div>

        <!-- Texte -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900">MTN Mobile Money</p>
          <p class="text-xs text-slate-400 mt-0.5">Mode d'exécution du code USSD</p>
        </div>

        <!-- État + flèche -->
        <div class="flex items-center gap-2 shrink-0">
          {#if saving['ussd-mtn']}
            <span class="w-3.5 h-3.5 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></span>
          {:else if saved['ussd-mtn']}
            <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:16px">check_circle</span>
          {/if}
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            {USSD_LABEL[ussdMtn]}
          </span>
          <span class="material-symbols-outlined text-slate-300 transition-transform duration-200
            {ouvert === 'ussd-mtn' ? 'rotate-180' : ''}" style="font-size:18px">
            expand_more
          </span>
        </div>
      </button>

      <!-- Panel MTN -->
      {#if ouvert === 'ussd-mtn'}
        <div class="border-t border-slate-100 px-5 py-4 bg-slate-50">
          <div class="grid grid-cols-3 gap-3">
            {#each USSD_OPTIONS as opt}
              <button
                type="button"
                onclick={() => selectUssd('mtn', opt.val)}
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                  {ussdMtn === opt.val
                    ? 'border-orange-400 bg-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'}"
              >
                <div class="w-9 h-9 rounded-xl flex items-center justify-center
                  {ussdMtn === opt.val ? 'bg-orange-500' : 'bg-slate-100'}">
                  <span class="material-symbols-outlined icon-filled
                    {ussdMtn === opt.val ? 'text-white' : 'text-slate-500'}" style="font-size:18px">
                    {opt.icon}
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold {ussdMtn === opt.val ? 'text-orange-600' : 'text-slate-700'}">{opt.label}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                </div>
                {#if ussdMtn === opt.val}
                  <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:14px">check_circle</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="mx-5 border-t border-slate-100"></div>

    <!-- Ligne Orange -->
    <div>
      <button
        type="button"
        onclick={() => toggle('ussd-orange')}
        class="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <span class="w-3 h-3 rounded-full bg-orange-500"></span>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900">Orange Money</p>
          <p class="text-xs text-slate-400 mt-0.5">Mode d'exécution du code USSD</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          {#if saving['ussd-orange']}
            <span class="w-3.5 h-3.5 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></span>
          {:else if saved['ussd-orange']}
            <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:16px">check_circle</span>
          {/if}
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
            {USSD_LABEL[ussdOrange]}
          </span>
          <span class="material-symbols-outlined text-slate-300 transition-transform duration-200
            {ouvert === 'ussd-orange' ? 'rotate-180' : ''}" style="font-size:18px">
            expand_more
          </span>
        </div>
      </button>

      {#if ouvert === 'ussd-orange'}
        <div class="border-t border-slate-100 px-5 py-4 bg-slate-50">
          <div class="grid grid-cols-3 gap-3">
            {#each USSD_OPTIONS as opt}
              <button
                type="button"
                onclick={() => selectUssd('orange', opt.val)}
                class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                  {ussdOrange === opt.val
                    ? 'border-orange-400 bg-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'}"
              >
                <div class="w-9 h-9 rounded-xl flex items-center justify-center
                  {ussdOrange === opt.val ? 'bg-orange-500' : 'bg-slate-100'}">
                  <span class="material-symbols-outlined icon-filled
                    {ussdOrange === opt.val ? 'text-white' : 'text-slate-500'}" style="font-size:18px">
                    {opt.icon}
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold {ussdOrange === opt.val ? 'text-orange-600' : 'text-slate-700'}">{opt.label}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                </div>
                {#if ussdOrange === opt.val}
                  <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:14px">check_circle</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

  </div>

  <!-- ── Section Notifications ─────────────────────────────────── -->
  <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Alertes</p>

  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">

    <button
      type="button"
      onclick={() => toggle('notif')}
      class="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
    >
      <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:20px">notifications</span>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-900">Canal de notification</p>
        <p class="text-xs text-slate-400 mt-0.5">Alerte à la réception d'une nouvelle commande</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        {#if saving['notif']}
          <span class="w-3.5 h-3.5 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></span>
        {:else if saved['notif']}
          <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:16px">check_circle</span>
        {/if}
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
          {NOTIF_LABEL[notifType]}
        </span>
        <span class="material-symbols-outlined text-slate-300 transition-transform duration-200
          {ouvert === 'notif' ? 'rotate-180' : ''}" style="font-size:18px">
          expand_more
        </span>
      </div>
    </button>

    {#if ouvert === 'notif'}
      <div class="border-t border-slate-100 px-5 py-4 bg-slate-50">
        <div class="grid grid-cols-3 gap-3">
          {#each NOTIF_OPTIONS as opt}
            <button
              type="button"
              onclick={() => selectNotif(opt.val)}
              class="flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center
                {notifType === opt.val
                  ? 'border-orange-400 bg-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'}"
            >
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center
                {notifType === opt.val ? opt.color : 'bg-slate-100'}">
                <span class="material-symbols-outlined icon-filled text-white
                  {notifType === opt.val ? '' : '!text-slate-400'}" style="font-size:22px">
                  {opt.icon}
                </span>
              </div>
              <div>
                <p class="text-sm font-bold {notifType === opt.val ? 'text-orange-600' : 'text-slate-800'}">{opt.label}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
              {#if notifType === opt.val}
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Actif</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

  </div>

{/if}
