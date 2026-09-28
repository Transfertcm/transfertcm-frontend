<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import Modal from '$lib/components/ui/Modal.svelte'

  type Onglet = 'cabines' | 'admins' | 'groupe'
  const peutCabines = $derived(auth.peut('canMessageCabins'))
  let onglet = $state<Onglet>(auth.peut('canMessageCabins') ? 'cabines' : 'admins')
  const onglets = $derived(
    ([['cabines', 'store', 'Cabines'], ['admins', 'admin_panel_settings', 'Admins'], ['groupe', 'groups', 'Groupe']] as const)
      .filter(([val]) => val !== 'cabines' || peutCabines)
  )

  // Conversations cabines
  let convCabines = $state<any[]>([])
  let convAdmins = $state<any[]>([])
  let messagesGroupe = $state<any[]>([])

  // Conversation active
  let convActive = $state<any>(null)
  let messages = $state<any[]>([])
  let chargementMessages = $state(false)

  let chargement = $state(true)
  let envoi = $state(false)
  let contenu = $state('')
  let contenueGroupe = $state('')
  let envoiGroupe = $state(false)

  let afficherNouvelle = $state(false)
  let annuaire = $state<any[]>([])
  let chargementAnnuaire = $state(false)
  let demarrage = $state('')

  let zoneMessages = $state<HTMLDivElement | undefined>(undefined)
  let intervalle: ReturnType<typeof setInterval> | undefined

  function estMonId(id: unknown) {
    return id != null && String(id) === String(auth.user?.id ?? '')
  }

  function nomConversation(conv: any) {
    if (onglet === 'cabines') return conv.cabinName ?? `Conv. #${String(conv.id ?? '').slice(-6)}`
    const autre = conv.otherParticipantName ?? (estMonId(conv.user1Id) ? conv.user2Name : conv.user1Name)
    return autre ?? `Conv. #${String(conv.id ?? '').slice(-6)}`
  }

  function listeDepuis(res: any) {
    const d = res.data?.data
    return Array.isArray(d) ? d : []
  }

  function formaterHeure(d: string | null) {
    if (!d) return ''
    const date = new Date(d)
    const maintenant = new Date()
    const diff = Math.floor((maintenant.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'À l\'instant'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return date.toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-CM', { day: 'numeric', month: 'short' })
  }

  async function chargerConvCabines() {
    chargement = true
    try {
      const res = await api.get('/admin/messaging/cabin-conversations')
      convCabines = listeDepuis(res)
    } catch { toast.erreur('Erreur', 'Impossible de charger les conversations') }
    finally { chargement = false }
  }

  async function chargerConvAdmins() {
    chargement = true
    try {
      const res = await api.get('/admin/messaging/conversations')
      convAdmins = listeDepuis(res)
    } catch { toast.erreur('Erreur', 'Impossible de charger les conversations') }
    finally { chargement = false }
  }

  async function chargerGroupe(silencieux = false) {
    if (!silencieux) chargement = true
    try {
      const res = await api.get('/admin/messaging/group')
      messagesGroupe = listeDepuis(res).reverse()
    } catch { if (!silencieux) toast.erreur('Erreur', 'Impossible de charger le groupe') }
    finally { if (!silencieux) chargement = false }
  }

  function endpointMessages(conv: any) {
    return onglet === 'cabines'
      ? `/admin/messaging/cabin-conversations/${conv.id}/messages`
      : `/admin/messaging/conversations/${conv.id}/messages`
  }

  async function rafraichirMessages() {
    if (onglet === 'groupe') {
      if (!envoiGroupe) await chargerGroupe(true)
      return
    }
    const conv = convActive
    if (!conv || chargementMessages || envoi) return
    try {
      const res = await api.get(endpointMessages(conv))
      if (convActive?.id !== conv.id) return
      const nouveaux = listeDepuis(res)
      const avaitNouveaux = nouveaux.length !== messages.length
      messages = nouveaux
      if (avaitNouveaux) {
        await tick()
        zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
      }
    } catch {}
  }

  async function ouvrirConversation(conv: any) {
    convActive = conv
    chargementMessages = true
    messages = []
    try {
      const res = await api.get(endpointMessages(conv))
      messages = listeDepuis(res)
      if (onglet === 'cabines') convCabines = convCabines.map(c => c.id === conv.id ? { ...c, unreadCountAdmin: 0 } : c)
      await tick()
      zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
    } catch { toast.erreur('Erreur', 'Impossible de charger les messages') }
    finally { chargementMessages = false }
  }

  async function envoyerMessage() {
    if (!contenu.trim() || !convActive) return
    envoi = true
    try {
      const res = await api.post(endpointMessages(convActive), { content: contenu })
      const envoye = res.data?.data
      contenu = ''
      if (envoye?.id) messages = [...messages, envoye]
      else await rafraichirMessages()
      await tick()
      zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.errors?.[0]?.message ?? e.response?.data?.message ?? 'Impossible d\'envoyer')
    } finally { envoi = false }
  }

  async function envoyerMessageGroupe() {
    if (!contenueGroupe.trim()) return
    envoiGroupe = true
    try {
      const res = await api.post('/admin/messaging/group', { content: contenueGroupe })
      const envoye = res.data?.data
      contenueGroupe = ''
      if (envoye?.id) messagesGroupe = [...messagesGroupe, envoye]
      else await chargerGroupe(true)
      await tick()
      zoneMessages?.scrollTo({ top: zoneMessages.scrollHeight, behavior: 'smooth' })
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.errors?.[0]?.message ?? e.response?.data?.message ?? 'Impossible d\'envoyer')
    } finally { envoiGroupe = false }
  }

  const libellesRoles: Record<string, string> = {
    super_admin: 'Super admin',
    admin: 'Admin',
    service_client: 'Service client',
    chef_agents_promo: 'Chef agents promo',
    controleur_cabine: 'Contrôleur cabine',
  }

  async function ouvrirNouvelle() {
    afficherNouvelle = true
    if (annuaire.length) return
    chargementAnnuaire = true
    try {
      const res = await api.get('/admin/directory')
      annuaire = listeDepuis(res).filter((a: any) => !estMonId(a.id))
    } catch { toast.erreur('Erreur', 'Impossible de charger la liste des admins') }
    finally { chargementAnnuaire = false }
  }

  async function demarrerConversation(admin: any) {
    demarrage = admin.id
    try {
      const res = await api.post('/admin/messaging/conversations', { userId: admin.id })
      const conv = res.data?.data
      if (!conv?.id) return
      const existante = convAdmins.find((c) => c.id === conv.id)
      if (!existante) convAdmins = [conv, ...convAdmins]
      afficherNouvelle = false
      await ouvrirConversation(existante ?? conv)
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de démarrer la conversation')
    } finally { demarrage = '' }
  }

  function surChangementOnglet(o: Onglet) {
    onglet = o
    convActive = null
    messages = []
  }

  $effect(() => {
    if (onglet === 'cabines' && !peutCabines) {
      onglet = 'admins'
      return
    }
    if (onglet === 'cabines') chargerConvCabines()
    else if (onglet === 'admins') chargerConvAdmins()
    else chargerGroupe()
  })

  onMount(() => {
    intervalle = setInterval(rafraichirMessages, 20000)
  })

  onDestroy(() => clearInterval(intervalle))
</script>

<svelte:head><title>Messagerie — TransfertCM Admin</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Messagerie</h2>
  <p class="text-sm text-slate-500 mt-0.5">{peutCabines ? 'Communication interne et avec les cabines' : 'Communication interne'}</p>
</div>

<!-- Onglets -->
<div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
  {#each onglets as [val, icone, label]}
    <button onclick={() => surChangementOnglet(val as Onglet)}
      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
        {onglet === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">{icone}</span>
      {label}
    </button>
  {/each}
</div>

<!-- Layout messagerie -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden" style="height: calc(100vh - 280px); min-height: 500px;">
  <div class="flex h-full">

    <!-- Liste conversations -->
    <div class="w-72 shrink-0 border-r border-slate-100 flex flex-col {convActive ? 'hidden lg:flex' : 'flex'}">
      <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {onglet === 'cabines' ? 'Conversations cabines' : onglet === 'admins' ? 'Conversations admins' : 'Canal groupe'}
        </p>
        {#if onglet === 'admins'}
          <button onclick={ouvrirNouvelle} title="Nouvelle conversation" aria-label="Nouvelle conversation"
            class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50 whitespace-nowrap shrink-0">
            <span class="material-symbols-outlined" style="font-size:16px">add</span>
            Nouvelle
          </button>
        {/if}
      </div>

      {#if onglet === 'groupe'}
        <!-- Groupe : pas de liste, juste le chat -->
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:22px">groups</span>
            </div>
            <p class="text-sm font-semibold text-slate-700">Canal groupe</p>
            <p class="text-xs text-slate-400 mt-1">Tous les admins</p>
          </div>
        </div>
      {:else}
        <div class="flex-1 overflow-y-auto">
          {#if chargement}
            <div class="p-3 space-y-2">
              {#each Array(5) as _}<div class="skeleton h-14 rounded-xl"></div>{/each}
            </div>
          {:else}
            {@const liste = onglet === 'cabines' ? convCabines : convAdmins}
            {#if liste.length === 0}
              <div class="py-12 text-center px-4">
                <span class="material-symbols-outlined text-slate-300" style="font-size:32px">chat_bubble_outline</span>
                <p class="text-sm text-slate-400 mt-2">Aucune conversation</p>
              </div>
            {:else}
              {#each liste as conv}
                <button onclick={() => ouvrirConversation(conv)}
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left border-b border-slate-50
                    {convActive?.id === conv.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''}">
                  <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">
                      {onglet === 'cabines' ? 'store' : 'person'}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">
                      {nomConversation(conv)}
                    </p>
                    {#if conv.lastMessagePreview}
                      <p class="text-xs text-slate-400 truncate">{conv.lastMessagePreview}</p>
                    {/if}
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="text-xs text-slate-400">{formaterHeure(conv.lastMessageAt)}</p>
                    {#if (conv.unreadCountAdmin ?? 0) > 0}
                      <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold mt-1">
                        {conv.unreadCountAdmin}
                      </span>
                    {/if}
                  </div>
                </button>
              {/each}
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <!-- Zone de chat -->
    <div class="flex-1 flex flex-col min-w-0">
      {#if onglet === 'groupe'}
        <!-- Chat groupe -->
        <div class="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">groups</span>
          </div>
          <p class="font-semibold text-slate-900 text-sm">Canal groupe — Tous les admins</p>
        </div>
        <div bind:this={zoneMessages} class="flex-1 overflow-y-auto p-4 space-y-3">
          {#if chargement}
            <div class="space-y-2">{#each Array(5) as _}<div class="skeleton h-10 rounded-xl"></div>{/each}</div>
          {:else if messagesGroupe.length === 0}
            <div class="h-full flex items-center justify-center text-slate-400">
              <p class="text-sm">Aucun message dans le groupe</p>
            </div>
          {:else}
            {#each messagesGroupe as msg}
              {@const estMoi = estMonId(msg.senderId)}
              <div class="flex {estMoi ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm
                  {estMoi ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
                  {#if !estMoi}
                    <p class="text-xs font-semibold mb-1 {estMoi ? 'text-orange-100' : 'text-orange-600'}">{msg.senderName ?? 'Admin'}</p>
                  {/if}
                  <p>{msg.content}</p>
                  <p class="text-xs mt-1 {estMoi ? 'text-orange-100' : 'text-slate-400'} text-right">{formaterHeure(msg.createdAt)}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
        <div class="px-4 py-3 border-t border-slate-100">
          <div class="flex gap-2">
            <input type="text" bind:value={contenueGroupe} placeholder="Message au groupe..."
              onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), envoyerMessageGroupe())}
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <button onclick={envoyerMessageGroupe} disabled={!contenueGroupe.trim() || envoiGroupe}
              class="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white disabled:opacity-50 transition-all">
              {#if envoiGroupe}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}<span class="material-symbols-outlined icon-filled" style="font-size:18px">send</span>{/if}
            </button>
          </div>
        </div>

      {:else if convActive}
        <!-- Chat conversation -->
        <div class="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          {#if convActive}
            <button onclick={() => convActive = null} class="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <span class="material-symbols-outlined" style="font-size:18px">arrow_back</span>
            </button>
          {/if}
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">
              {onglet === 'cabines' ? 'store' : 'person'}
            </span>
          </div>
          <p class="font-semibold text-slate-900 text-sm">
            {nomConversation(convActive)}
          </p>
        </div>
        <div bind:this={zoneMessages} class="flex-1 overflow-y-auto p-4 space-y-3">
          {#if chargementMessages}
            <div class="space-y-2">{#each Array(5) as _}<div class="skeleton h-10 rounded-xl"></div>{/each}</div>
          {:else if messages.length === 0}
            <div class="h-full flex items-center justify-center text-slate-400">
              <p class="text-sm">Aucun message</p>
            </div>
          {:else}
            {#each messages as msg}
              {@const estAdmin = onglet === 'cabines' ? msg.senderType === 'admin' : estMonId(msg.senderId)}
              <div class="flex {estAdmin ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm
                  {estAdmin ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
                  <p>{msg.content}</p>
                  <p class="text-xs mt-1 {estAdmin ? 'text-orange-100' : 'text-slate-400'} text-right">{formaterHeure(msg.createdAt)}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
        <div class="px-4 py-3 border-t border-slate-100">
          <div class="flex gap-2">
            <input type="text" bind:value={contenu} placeholder="Écrire un message..."
              onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), envoyerMessage())}
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <button onclick={envoyerMessage} disabled={!contenu.trim() || envoi}
              class="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white disabled:opacity-50 transition-all">
              {#if envoi}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}<span class="material-symbols-outlined icon-filled" style="font-size:18px">send</span>{/if}
            </button>
          </div>
        </div>

      {:else}
        <!-- Placeholder -->
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:32px">chat_bubble</span>
            </div>
            <p class="text-slate-600 font-semibold">Sélectionnez une conversation</p>
            <p class="text-slate-400 text-sm mt-1">Choisissez une conversation dans la liste</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<Modal bind:ouvert={afficherNouvelle} titre="Nouvelle conversation" largeur="sm">
  <div class="p-4">
    {#if chargementAnnuaire}
      <div class="space-y-2">{#each Array(4) as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
    {:else if annuaire.length === 0}
      <p class="py-8 text-center text-sm text-slate-400">Aucun autre admin disponible</p>
    {:else}
      <div class="max-h-96 overflow-y-auto divide-y divide-slate-50">
        {#each annuaire as a}
          <button onclick={() => demarrerConversation(a)} disabled={!!demarrage}
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-left disabled:opacity-50">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">person</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{a.fullName}</p>
              <p class="text-xs text-slate-400">{libellesRoles[a.role] ?? 'Admin'}</p>
            </div>
            {#if demarrage === a.id}
              <span class="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</Modal>
