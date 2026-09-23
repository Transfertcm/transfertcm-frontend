<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  let messages = $state<any[]>([])
  let conversationId = $state<string | null>(null)
  let chargement = $state(true)
  let nouveauMessage = $state('')
  let envoi = $state(false)
  let conteneur = $state<HTMLDivElement | undefined>(undefined)
  let intervalle: ReturnType<typeof setInterval>

  async function charger(silencieux = false) {
    if (!silencieux) chargement = true
    try {
      const res = await apiCabin.get('/cabin/messaging/messages')
      const data = res.data?.data ?? res.data
      messages = data?.messages ?? []
      conversationId = data?.conversationId ?? null
      if (!silencieux) {
        await tick()
        scrollBas()
      }
    } catch {
      if (!silencieux) toast.erreur('Erreur', 'Impossible de charger les messages')
    } finally {
      chargement = false
    }
  }

  function scrollBas() {
    if (conteneur) conteneur.scrollTop = conteneur.scrollHeight
  }

  async function envoyerMessage(e: Event) {
    e.preventDefault()
    const contenu = nouveauMessage.trim()
    if (!contenu || envoi) return

    envoi = true
    nouveauMessage = ''

    // Optimistic update
    const tempMsg = {
      id: `temp_${Date.now()}`,
      content: contenu,
      sender_type: 'cabin',
      created_at: new Date().toISOString(),
      _pending: true,
    }
    messages = [...messages, tempMsg]
    await tick()
    scrollBas()

    try {
      await apiCabin.post('/cabin/messaging/messages', { content: contenu })
      await charger(true)
      await tick()
      scrollBas()
    } catch (err: any) {
      // Annuler le message optimiste
      messages = messages.filter(m => m.id !== tempMsg.id)
      nouveauMessage = contenu
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible d\'envoyer le message')
    } finally {
      envoi = false
    }
  }

  function formaterHeure(d: string) {
    return new Date(d).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
  }

  function formaterDate(d: string) {
    const date = new Date(d)
    const auj = new Date()
    if (date.toDateString() === auj.toDateString()) return "Aujourd'hui"
    return date.toLocaleDateString('fr-CM', { day: 'numeric', month: 'long' })
  }

  function montrerSeparateurDate(index: number) {
    if (index === 0) return true
    const prev = new Date(messages[index - 1].created_at).toDateString()
    const curr = new Date(messages[index].created_at).toDateString()
    return prev !== curr
  }

  onMount(() => {
    charger()
    intervalle = setInterval(() => charger(true), 10000)
  })
  onDestroy(() => clearInterval(intervalle))
</script>

<svelte:head><title>Messagerie — Espace cabine</title></svelte:head>

<div class="mb-5">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Messagerie</h2>
  <p class="text-sm text-slate-500 mt-0.5">Discussion directe avec l'administration</p>
</div>

<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden flex flex-col"
  style="height: calc(100vh - 220px); min-height: 420px;">

  <!-- En-tête -->
  <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
      style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)">A</div>
    <div>
      <p class="font-semibold text-slate-900 text-sm">Administration TransfertCM</p>
      <div class="flex items-center gap-1.5 mt-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <p class="text-xs text-emerald-600 font-medium">Support disponible</p>
      </div>
    </div>
  </div>

  <!-- Zone messages -->
  <div class="flex-1 overflow-y-auto p-5 space-y-1" bind:this={conteneur}>
    {#if chargement}
      <div class="flex justify-center py-10">
        <span class="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
      </div>
    {:else if messages.length === 0}
      <div class="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
        <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-slate-300" style="font-size:28px">chat_bubble_outline</span>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-500">Aucun message pour l'instant</p>
          <p class="text-xs text-slate-400 mt-1">Envoyez votre premier message à l'administration</p>
        </div>
      </div>
    {:else}
      {#each messages as msg, i}
        {#if montrerSeparateurDate(i)}
          <div class="flex items-center gap-3 py-2">
            <div class="flex-1 h-px bg-slate-100"></div>
            <span class="text-xs text-slate-400 font-medium shrink-0">{formaterDate(msg.created_at)}</span>
            <div class="flex-1 h-px bg-slate-100"></div>
          </div>
        {/if}
        <div class="flex {msg.sender_type === 'cabin' ? 'justify-end' : 'justify-start'} mb-1">
          <div class="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm
            {msg.sender_type === 'cabin'
              ? 'text-white rounded-br-sm' + (msg._pending ? ' opacity-70' : '')
              : 'bg-slate-100 text-slate-800 rounded-bl-sm'}"
            style={msg.sender_type === 'cabin' ? 'background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)' : ''}>
            <p class="leading-relaxed break-words">{msg.content}</p>
            <div class="flex items-center justify-end gap-1 mt-1">
              <p class="text-xs {msg.sender_type === 'cabin' ? 'text-white/70' : 'text-slate-400'}">
                {formaterHeure(msg.created_at)}
              </p>
              {#if msg._pending}
                <span class="material-symbols-outlined text-white/50" style="font-size:12px">schedule</span>
              {:else if msg.sender_type === 'cabin'}
                <span class="material-symbols-outlined text-white/70" style="font-size:12px">done_all</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Saisie -->
  <div class="px-4 py-3.5 border-t border-slate-100 bg-white shrink-0">
    <form onsubmit={envoyerMessage} class="flex items-center gap-2.5">
      <input
        type="text"
        bind:value={nouveauMessage}
        placeholder="Écrire un message à l'administration..."
        class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300 transition-colors"
        disabled={envoi}
      />
      <button
        type="submit"
        disabled={!nouveauMessage.trim() || envoi}
        class="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
        style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
      >
        {#if envoi}
          <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        {:else}
          <span class="material-symbols-outlined icon-filled" style="font-size:18px">send</span>
        {/if}
      </button>
    </form>
  </div>
</div>
