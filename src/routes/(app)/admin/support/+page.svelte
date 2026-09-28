<script lang="ts">
  import { tick } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'

  let conversations = $state<any[]>([])
  let convActive = $state<any>(null)
  let messages = $state<any[]>([])
  let chargement = $state(true)
  let chargementMessages = $state(false)
  let envoi = $state(false)
  let contenu = $state('')
  let filtreStatut = $state('')
  let resolutionEnCours = $state(false)

  let zoneMessages = $state<HTMLDivElement | undefined>(undefined)

  function formaterHeure(d: string | null) {
    if (!d) return ''
    const date = new Date(d)
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return "À l'instant"
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return date.toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' })
  }

  async function charger() {
    chargement = true
    try {
      const params: any = {}
      if (filtreStatut) params.status = filtreStatut
      const res = await api.get('/support/conversations', { params })
      conversations = Array.isArray(res.data?.data) ? res.data.data : []
    } catch { toast.erreur('Erreur', 'Impossible de charger les conversations') }
    finally { chargement = false }
  }

  async function ouvrirConversation(conv: any) {
    convActive = conv
    chargementMessages = true
    messages = []
    try {
      const res = await api.get(`/support/conversations/${conv.id}/messages`)
      messages = Array.isArray(res.data?.data) ? res.data.data : []
      await tick()
      zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
    } catch { toast.erreur('Erreur', 'Impossible de charger les messages') }
    finally { chargementMessages = false }
  }

  async function envoyerMessage() {
    if (!contenu.trim() || !convActive) return
    envoi = true
    try {
      const conv = convActive
      const res = await api.post(`/support/conversations/${conv.id}/messages`, { content: contenu })
      const envoye = res.data?.data
      contenu = ''
      if (envoye?.id) {
        messages = [...messages, envoye]
      } else {
        const rechargement = await api.get(`/support/conversations/${conv.id}/messages`)
        messages = Array.isArray(rechargement.data?.data) ? rechargement.data.data : messages
      }
      await tick()
      zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? "Impossible d'envoyer")
    } finally { envoi = false }
  }

  async function resoudre() {
    if (!convActive) return
    resolutionEnCours = true
    try {
      await api.patch(`/support/conversations/${convActive.id}/resolve`)
      toast.succes('Conversation résolue')
      convActive = { ...convActive, status: 'resolved' }
      conversations = conversations.map(c => c.id === convActive.id ? { ...c, status: 'resolved' } : c)
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de résoudre')
    } finally { resolutionEnCours = false }
  }

  $effect(() => { filtreStatut; charger() })

  const configStatut: Record<string, { label: string; classe: string }> = {
    open:     { label: 'Ouvert',   classe: 'bg-blue-100 text-blue-700' },
    resolved: { label: 'Résolu',   classe: 'bg-emerald-100 text-emerald-700' },
    archived: { label: 'Archivé',  classe: 'bg-slate-100 text-slate-500' },
  }
</script>

<svelte:head><title>Support client — TransfertCM Admin</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Support client</h2>
  <p class="text-sm text-slate-500 mt-0.5">Chat en direct avec les membres de l'application</p>
</div>

<!-- Filtres statut -->
<div class="flex gap-1.5 mb-4 flex-wrap">
  {#each [['', 'Toutes'], ['open', 'Ouvertes'], ['resolved', 'Résolues']] as [val, label]}
    <button onclick={() => filtreStatut = val}
      class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
        {filtreStatut === val ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">
      {label}
    </button>
  {/each}
</div>

<!-- Layout chat -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden" style="height:calc(100vh - 280px);min-height:500px">
  <div class="flex h-full">

    <!-- Liste conversations -->
    <div class="w-72 shrink-0 border-r border-slate-100 flex flex-col {convActive ? 'hidden lg:flex' : 'flex'}">
      <div class="px-4 py-3 border-b border-slate-100">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Conversations</p>
      </div>
      <div class="flex-1 overflow-y-auto">
        {#if chargement}
          <div class="p-3 space-y-2">{#each Array(5) as _}<div class="skeleton h-16 rounded-xl"></div>{/each}</div>
        {:else if conversations.length === 0}
          <div class="py-12 text-center px-4">
            <span class="material-symbols-outlined text-slate-300 block mb-2" style="font-size:32px">support_agent</span>
            <p class="text-sm text-slate-400">Aucune conversation</p>
          </div>
        {:else}
          {#each conversations as conv}
            {@const cfg = configStatut[conv.status] ?? configStatut.open}
            <button onclick={() => ouvrirConversation(conv)}
              class="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left border-b border-slate-50
                {convActive?.id === conv.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''}">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {String(conv.clientName || conv.clientPhone || '?')[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <p class="text-sm font-semibold text-slate-800 truncate">
                    {conv.clientName || conv.clientPhone || 'Client'}
                  </p>
                  <span class="text-xs px-1.5 py-0.5 rounded-full {cfg.classe} shrink-0">{cfg.label}</span>
                </div>
                {#if conv.lastMessagePreview}
                  <p class="text-xs text-slate-400 truncate">{conv.lastMessagePreview}</p>
                {/if}
                <div class="flex items-center justify-between mt-1">
                  <p class="text-xs text-slate-400">{formaterHeure(conv.lastMessageAt)}</p>
                  {#if (conv.unreadByAdmin ?? 0) > 0}
                    <span class="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {conv.unreadByAdmin}
                    </span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Zone chat -->
    <div class="flex-1 flex flex-col min-w-0">
      {#if convActive}
        <!-- Header conversation -->
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button onclick={() => convActive = null}
              class="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <span class="material-symbols-outlined" style="font-size:18px">arrow_back</span>
            </button>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-sm font-bold">
              {String(convActive.clientName || convActive.clientPhone || '?')[0].toUpperCase()}
            </div>
            <div>
              <p class="font-semibold text-slate-900 text-sm leading-tight">
                {convActive.clientName || 'Client'}
              </p>
              <p class="text-xs text-slate-400 font-mono">{convActive.clientPhone ?? '—'}</p>
            </div>
          </div>
          {#if convActive.status === 'open'}
            <button
              onclick={resoudre}
              disabled={resolutionEnCours}
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-all"
            >
              {#if resolutionEnCours}
                <span class="w-3 h-3 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></span>
              {:else}
                <span class="material-symbols-outlined icon-filled" style="font-size:14px">check_circle</span>
              {/if}
              Résoudre
            </button>
          {:else}
            <span class="text-xs px-2 py-1 rounded-full {(configStatut[convActive.status] ?? configStatut.open).classe}">
              {(configStatut[convActive.status] ?? configStatut.open).label}
            </span>
          {/if}
        </div>

        <!-- Messages -->
        <div bind:this={zoneMessages} class="flex-1 overflow-y-auto p-4 space-y-3">
          {#if chargementMessages}
            <div class="space-y-2">{#each Array(4) as _}<div class="skeleton h-12 rounded-2xl"></div>{/each}</div>
          {:else if messages.length === 0}
            <div class="h-full flex items-center justify-center">
              <div class="text-center">
                <span class="material-symbols-outlined text-slate-300 block mb-2" style="font-size:36px">chat_bubble_outline</span>
                <p class="text-sm text-slate-400">Aucun message</p>
              </div>
            </div>
          {:else}
            {#each messages as msg}
              {@const estAdmin = msg.senderType === 'admin'}
              <div class="flex {estAdmin ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md">
                  {#if !estAdmin}
                    <p class="text-xs text-slate-400 mb-1 ml-1">{convActive.clientName || msg.senderId || 'Client'}</p>
                  {/if}
                  <div class="px-4 py-2.5 rounded-2xl text-sm
                    {estAdmin ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
                    <p>{msg.content}</p>
                    <p class="text-xs mt-1 {estAdmin ? 'text-orange-100' : 'text-slate-400'} text-right">
                      {formaterHeure(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Zone de saisie -->
        <div class="px-4 py-3 border-t border-slate-100">
          {#if convActive.status === 'open'}
            <div class="flex gap-2">
              <input type="text" bind:value={contenu}
                placeholder="Répondre au client..."
                onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), envoyerMessage())}
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
              <button onclick={envoyerMessage} disabled={!contenu.trim() || envoi}
                class="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white disabled:opacity-50 transition-all">
                {#if envoi}
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                {:else}
                  <span class="material-symbols-outlined icon-filled" style="font-size:18px">send</span>
                {/if}
              </button>
            </div>
          {:else}
            <p class="text-center text-sm text-slate-400 py-1">Cette conversation est résolue</p>
          {/if}
        </div>

      {:else}
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:32px">support_agent</span>
            </div>
            <p class="text-slate-600 font-semibold">Sélectionnez une conversation</p>
            <p class="text-slate-400 text-sm mt-1">Choisissez un client à gauche pour répondre</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
