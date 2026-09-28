<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth } from '$lib/stores/auth.svelte'

  let notifications = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)
  let filtreNonLues = $state(false)
  let afficherModalBroadcast = $state(false)
  let broadcast = $state({ type: 'info', title: '', message: '' })
  let envoi = $state(false)
  let nbNonLues = $state(0)

  async function chargerCompteur() {
    try {
      const res = await api.get('/admin/notifications/count')
      nbNonLues = Number(res.data?.data?.count ?? 0)
    } catch {}
  }

  function formaterDate(d: string) {
    if (!d) return '—'
    const date = new Date(d)
    const maintenant = new Date()
    const diff = Math.floor((maintenant.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'À l\'instant'
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
    return date.toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  async function charger() {
    chargement = true
    try {
      const params: any = { page, per_page: 30 }
      if (filtreNonLues) params.is_new = 'true'
      const res = await api.get('/admin/notifications', { params })
      notifications = Array.isArray(res.data?.data) ? res.data.data : []
      meta = res.data?.meta ?? null
    } catch {
      toast.erreur('Erreur', 'Impossible de charger les notifications')
    } finally {
      chargement = false
    }
  }

  async function marquerLu(id: string) {
    try {
      await api.patch(`/admin/notifications/${id}/read`)
      notifications = filtreNonLues
        ? notifications.filter(n => n.id !== id)
        : notifications.map(n => n.id === id ? { ...n, isNew: false } : n)
      nbNonLues = Math.max(0, nbNonLues - 1)
    } catch {
      toast.erreur('Erreur', 'Impossible de marquer comme lue')
    }
  }

  async function toutMarquerLu() {
    try {
      await api.patch('/admin/notifications/read-all')
      notifications = filtreNonLues ? [] : notifications.map(n => ({ ...n, isNew: false }))
      nbNonLues = 0
      toast.succes('Toutes les notifications ont été lues')
    } catch {
      toast.erreur('Erreur', 'Impossible de marquer comme lues')
    }
  }

  const broadcastValide = $derived(broadcast.title.trim().length >= 3 && broadcast.message.trim().length > 0)

  async function envoyerBroadcast() {
    if (!broadcastValide) return
    envoi = true
    try {
      const res = await api.post('/admin/notifications/broadcast', {
        type: broadcast.type,
        title: broadcast.title.trim(),
        message: broadcast.message.trim(),
      })
      toast.succes('Notification envoyée', res.data?.data?.message ?? res.data?.message)
      afficherModalBroadcast = false
      broadcast = { type: 'info', title: '', message: '' }
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.errors?.[0]?.message ?? e.response?.data?.message ?? 'Impossible d\'envoyer')
    } finally {
      envoi = false
    }
  }

  $effect(() => { filtreNonLues; page; charger() })
  onMount(chargerCompteur)
</script>

<svelte:head><title>Notifications — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Notifications</h2>
    <p class="text-sm text-slate-500 mt-0.5">Centre de notifications de la plateforme</p>
  </div>
  <div class="flex gap-2">
    {#if nbNonLues > 0}
      <button onclick={toutMarquerLu} class="btn-secondary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">done_all</span>
        Tout marquer lu
      </button>
    {/if}
    {#if auth.peut('canViewSettings')}
      <button onclick={() => afficherModalBroadcast = true} class="btn-primary">
        <span class="material-symbols-outlined icon-filled" style="font-size:16px">campaign</span>
        Diffuser
      </button>
    {/if}
  </div>
</div>

<!-- Filtre -->
<div class="flex items-center gap-3 mb-5">
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" bind:checked={filtreNonLues} onchange={() => page = 1} class="w-4 h-4 accent-orange-500 rounded" />
    <span class="text-sm font-medium text-slate-700">Non lues seulement</span>
  </label>
  {#if nbNonLues > 0}
    <span class="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">{nbNonLues}</span>
  {/if}
</div>

<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-3">
      {#each Array(8) as _}
        <div class="skeleton h-16 rounded-xl"></div>
      {/each}
    </div>
  {:else if notifications.length === 0}
    <div class="py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">notifications_none</span>
      </div>
      <p class="text-slate-600 font-semibold">Aucune notification</p>
    </div>
  {:else}
    <div class="divide-y divide-slate-50">
      {#each notifications as notif}
        <div
          class="flex items-start gap-4 px-5 py-4 transition-all {notif.isNew ? 'bg-orange-50/40' : 'hover:bg-slate-50'}"
        >
          <div class="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">
              {String(notif.type ?? '').includes('order') ? 'receipt_long' : String(notif.type ?? '').includes('payment') ? 'payments' : 'notifications'}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800">{notif.title ?? notif.message ?? 'Notification'}</p>
            {#if notif.title && notif.message}
              <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
            {/if}
            <p class="text-xs text-slate-400 mt-1">{formaterDate(notif.createdAt)}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            {#if notif.isNew}
              <div class="w-2 h-2 rounded-full bg-orange-500"></div>
              <button
                onclick={() => marquerLu(notif.id)}
                class="text-xs text-slate-400 hover:text-orange-500 font-medium"
              >
                Lire
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">Page {meta.currentPage} sur {meta.lastPage}</p>
        <div class="flex gap-2">
          <button onclick={() => page--} disabled={page <= 1} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Précédent</button>
          <button onclick={() => page++} disabled={page >= meta.lastPage} class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal broadcast -->
{#if afficherModalBroadcast && auth.peut('canViewSettings')}
  <div class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up" style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Diffuser une notification</h3>
        <button onclick={() => afficherModalBroadcast = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Cette notification sera envoyée à toutes les cabines actives.
        </p>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
          <select bind:value={broadcast.type} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="info">Information</option>
            <option value="warning">Avertissement</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Titre *</label>
          <input type="text" bind:value={broadcast.title} placeholder="Titre de la notification" minlength="3" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
          {#if broadcast.title.trim().length > 0 && broadcast.title.trim().length < 3}
            <p class="text-xs text-red-600 mt-1">Le titre doit contenir au moins 3 caractères</p>
          {/if}
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
          <textarea bind:value={broadcast.message} rows="3" placeholder="Contenu du message..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button onclick={() => afficherModalBroadcast = false} class="btn-secondary flex-1">Annuler</button>
          <button onclick={envoyerBroadcast} disabled={!broadcastValide || envoi} class="btn-primary flex-1 justify-center">
            {#if envoi}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">send</span>
              Envoyer
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

