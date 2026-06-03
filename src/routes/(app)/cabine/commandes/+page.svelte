<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'
  import Badge from '$lib/components/ui/Badge.svelte'
  import { t, translate } from '$lib/stores/locale'

  let commandes = $state<any[]>([])
  let chargement = $state(true)
  let actionEnCours = $state<string | null>(null)
  let filtreStatut = $state('')

  const statuts = [
    { val: '', labelKey: 'cabin.orders.all' },
    { val: 'assigned_to_cabin', labelKey: 'cabin.orders.assigned' },
    { val: 'in_progress', labelKey: 'cabin.orders.in_progress' },
    { val: 'completed', labelKey: 'cabin.orders.completed' },
    { val: 'returned_to_admin', labelKey: 'cabin.orders.returned' },
  ]

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
      const params: any = {}
      if (filtreStatut) params.status = filtreStatut
      const res = await apiCabin.get('/cabin/orders', { params })
      const raw = res.data
      commandes = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
    } catch {
      toast.erreur(translate('toast.error'), translate('common.error_load'))
    } finally {
      chargement = false
    }
  }

  async function demarrer(id: string) {
    actionEnCours = id
    try {
      await apiCabin.post(`/cabin/orders/${id}/start`)
      toast.succes(translate('cabin.orders.started'), translate('cabin.orders.started_hint'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      actionEnCours = null
    }
  }

  async function completer(id: string) {
    actionEnCours = id
    try {
      await apiCabin.post(`/cabin/orders/${id}/complete`)
      toast.succes(translate('cabin.orders.completed_success'), translate('cabin.orders.completed_hint'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      actionEnCours = null
    }
  }

  async function retourner(id: string) {
    const raison = prompt(translate('cabin.orders.return_reason'))
    if (!raison) return
    actionEnCours = id
    try {
      await apiCabin.post(`/cabin/orders/${id}/return`, { reason: raison })
      toast.info(translate('cabin.orders.returned_success'), translate('cabin.orders.returned_hint'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      actionEnCours = null
    }
  }

  async function signalerDelai(id: string) {
    actionEnCours = id
    try {
      await apiCabin.post(`/cabin/orders/${id}/delay`)
      toast.info(translate('cabin.orders.delay_success'), translate('cabin.orders.delay_hint'))
      await charger()
    } catch (e: any) {
      toast.erreur(translate('toast.error'), e.response?.data?.message ?? translate('common.error_save'))
    } finally {
      actionEnCours = null
    }
  }

  $effect(() => { filtreStatut; charger() })
  onMount(charger)
</script>

<svelte:head><title>{$t('cabin.orders.title')} — {$t('cabin.nav.space')}</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing: -0.02em">{$t('cabin.orders.title')}</h2>
    <p class="text-sm text-slate-500 mt-0.5">{$t('cabin.orders.subtitle')}</p>
  </div>
  <button onclick={charger} class="btn-secondary">
    <span class="material-symbols-outlined" style="font-size: 16px;">refresh</span>
    {$t('common.refresh')}
  </button>
</div>

<!-- Filtre statut -->
<div class="flex gap-2 mb-5 flex-wrap">
  {#each statuts as s}
    <button
      onclick={() => filtreStatut = s.val}
      class="px-4 py-2 rounded-xl text-sm font-semibold transition-all border
        {filtreStatut === s.val
          ? 'text-white border-orange-500'
          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'}"
      style={filtreStatut === s.val ? 'background: linear-gradient(135deg, #f97316, #fbbf24); border-color: transparent' : ''}
    >
      {$t(s.labelKey)}
    </button>
  {/each}
</div>

<!-- Liste des commandes -->
{#if chargement}
  <div class="space-y-3">
    {#each Array(5) as _}
      <div class="skeleton h-24 rounded-2xl"></div>
    {/each}
  </div>
{:else if commandes.length === 0}
  <div class="bg-white rounded-2xl border border-slate-100 py-20 text-center card-shadow">
    <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
      <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size: 28px;">receipt_long</span>
    </div>
    <p class="text-slate-600 font-semibold">{$t('cabin.orders.no_results')}</p>
    <p class="text-slate-400 text-sm mt-1">
      {filtreStatut ? $t('cabin.orders.no_results_filter') : $t('cabin.orders.no_results_hint')}
    </p>
  </div>
{:else}
  <div class="space-y-3">
    {#each commandes as cmd}
      <div class="bg-white rounded-2xl border border-slate-100 p-5 card-shadow">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <!-- Infos commande -->
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style="background: linear-gradient(135deg, #fff7ed, #fffbeb)"
            >
              <span
                class="material-symbols-outlined icon-filled"
                style="font-size: 22px; color: {cmd.network === 'mtn' ? '#f59e0b' : '#f97316'}"
              >
                {cmd.network === 'mtn' ? 'signal_cellular_alt' : 'signal_cellular_alt'}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-mono text-xs font-bold text-orange-600">
                  #{(cmd.orderCode ?? cmd.order_code ?? cmd.id ?? '').toString().slice(-8)}
                </span>
                <span
                  class="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
                  style="background: {cmd.network === 'mtn' ? '#fef3c7' : '#fff7ed'}; color: {cmd.network === 'mtn' ? '#92400e' : '#9a3f0b'}"
                >
                  {cmd.network ?? '—'}
                </span>
                <Badge statut={cmd.status ?? 'pending'} />
                {#if cmd.delayed}
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <span class="material-symbols-outlined icon-filled" style="font-size:11px">schedule</span>
                    {$t('cabin.orders.delayed_badge')}
                  </span>
                {/if}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div>
                  <p class="text-xs text-slate-400">{$t('cabin.orders.col_client')}</p>
                  <p class="text-sm font-semibold text-slate-800">
                    {cmd.customerName ?? '—'}
                  </p>
                  <p class="text-xs text-slate-400 font-mono mt-0.5">{cmd.customerPhone ?? cmd.customer_phone ?? ''}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400">{$t('cabin.orders.col_recipient')}</p>
                  <p class="text-sm font-semibold text-slate-800 font-mono">{cmd.recipientPhone ?? cmd.recipient_phone ?? '—'}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400">{$t('cabin.orders.col_amount')}</p>
                  <p class="text-sm font-bold text-slate-900">{formaterMontant(cmd.amount)}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-400">{$t('cabin.orders.col_service')}</p>
                  <p class="text-sm font-semibold text-slate-700 capitalize">{cmd.serviceType ?? cmd.service_type ?? '—'}</p>
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-2">
                {$t('cabin.orders.received_at', { date: formaterDate(cmd.timestamp ?? cmd.created_at) })}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 shrink-0">
            {#if cmd.status === 'assigned_to_cabin'}
              <button
                onclick={() => demarrer(cmd.id)}
                disabled={actionEnCours === cmd.id}
                class="btn-primary text-xs px-4 py-2"
              >
                {#if actionEnCours === cmd.id}
                  <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">play_arrow</span>
                {/if}
                {$t('cabin.orders.start')}
              </button>
            {:else if cmd.status === 'in_progress'}
              <button
                onclick={() => completer(cmd.id)}
                disabled={actionEnCours === cmd.id}
                class="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                style="background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.3)"
              >
                {#if actionEnCours === cmd.id}
                  <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size: 14px;">check_circle</span>
                {/if}
                {$t('cabin.orders.complete')}
              </button>
              <button
                onclick={() => retourner(cmd.id)}
                disabled={actionEnCours === cmd.id}
                class="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">undo</span>
                {$t('cabin.orders.return')}
              </button>
              <button
                onclick={() => signalerDelai(cmd.id)}
                disabled={actionEnCours === cmd.id || cmd.delayed}
                class="px-4 py-2 rounded-xl text-amber-700 text-xs font-semibold border border-amber-200 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">schedule</span>
                {$t('cabin.orders.delay')}
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
