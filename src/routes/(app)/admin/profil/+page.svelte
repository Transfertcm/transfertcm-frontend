<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

  let profil = $state<any>(null)
  let chargement = $state(true)
  let actionEnCours = $state('')

  // Formulaires
  let formProfil = $state({ firstName: '', lastName: '', phone: '', avatarUrl: '' })
  let formMdp = $state({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' })
  let erreursMdp = $state<Record<string, string>>({})
  let afficherMdpActuel = $state(false)
  let afficherNouveauMdp = $state(false)

  let erreurProfil = $state('')

  const libellesRoles: Record<string, string> = {
    super_admin: 'Super Admin', admin: 'Admin', service_client: 'Service client',
    chef_agents_promo: 'Chef agents promo', controleur_cabine: 'Contrôleur cabine',
  }

  const libellesPermissions: Record<string, string> = {
    canViewOrders: 'Voir et créer les commandes',
    canAssignOrders: 'Attribuer les commandes aux cabines',
    canValidatePayments: 'Valider un paiement manuellement',
    canRefundOrders: 'Rembourser une commande',
    canManageCabins: 'Gérer les cabines',
    canManageSubscriptions: 'Gérer les abonnements, factures et rémunérations des cabines',
    canAccessUv: 'Gérer les UV',
    canAccessFraud: 'Gérer l\'anti-fraude',
    canViewPromoAgents: 'Gérer les agents promo',
    canAccessComplaints: 'Traiter les réclamations et le support client',
    canAccessCallCenter: 'Accéder au call center',
    canMessageCabins: 'Échanger avec les cabines',
    canViewReports: 'Gérer les tâches, rapports et budgets',
    canValidateReports: 'Valider les rapports et approuver les budgets',
    canViewSettings: 'Modifier les paramètres, frais et forfaits',
    canViewSalaries: 'Gérer les salaires de toute l\'équipe',
  }

  let sessions = $state<any[]>([])
  let chargementSessions = $state(false)
  let sessionEnCours = $state('')
  let confirmationAutres = $state(false)

  const permissionsAffichees = $derived(
    profil?.permissions
      ? Object.entries(profil.permissions).filter(([k]) => k in libellesPermissions)
      : []
  )

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function messageErreur(e: any, defaut: string) {
    const champs = e.response?.data?.errors
    if (Array.isArray(champs) && champs.length) return champs.map((x: any) => x.message).join(' ')
    return e.response?.data?.message ?? defaut
  }

  function decrireAppareil(ua: string | null) {
    if (!ua) return 'Appareil inconnu'
    const navigateur =
      /Edg\//.test(ua) ? 'Edge'
      : /OPR\/|Opera/.test(ua) ? 'Opera'
      : /Firefox\//.test(ua) ? 'Firefox'
      : /HeadlessChrome/.test(ua) ? 'Chrome (automatisé)'
      : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
      : /Safari\//.test(ua) ? 'Safari'
      : null
    const systeme =
      /iPhone/.test(ua) ? 'iPhone'
      : /iPad/.test(ua) ? 'iPad'
      : /Android/.test(ua) ? 'Android'
      : /Windows/.test(ua) ? 'Windows'
      : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
      : /Linux/.test(ua) ? 'Linux'
      : null
    if (navigateur) return systeme ? `${navigateur} sur ${systeme}` : navigateur
    if (systeme) return systeme
    const outil = ua.split(/[\s/]/)[0]
    return outil ? `Application « ${outil} »` : 'Appareil inconnu'
  }

  function estMobile(ua: string | null) {
    return /iPhone|iPad|Android/.test(ua ?? '')
  }

  function initiales(nom: string | null) {
    if (!nom) return '?'
    return nom.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
  }

  async function charger() {
    chargement = true
    try {
      const res = await api.get('/account/profile')
      profil = res.data?.data ?? null
      sessions = profil?.activeSessions ?? []
      if (profil?.profile) {
        formProfil = {
          firstName: profil.profile.firstName ?? '',
          lastName: profil.profile.lastName ?? '',
          phone: profil.profile.phone ?? '',
          avatarUrl: profil.profile.avatarUrl ?? '',
        }
      }
    } catch { toast.erreur('Erreur', 'Impossible de charger le profil') }
    finally { chargement = false }
    chargerSessions()
  }

  async function chargerSessions() {
    chargementSessions = true
    try {
      const res = await api.get('/account/sessions')
      sessions = res.data?.data ?? []
    } catch {}
    finally { chargementSessions = false }
  }

  async function deconnecterSession(id: string) {
    sessionEnCours = id
    try {
      const res = await api.delete(`/account/sessions/${id}`)
      toast.succes('Appareil déconnecté', res.data?.data?.message)
      await chargerSessions()
    } catch (e: any) {
      if (!e.toastAffiche) toast.erreur('Erreur', messageErreur(e, 'Impossible de déconnecter cet appareil'))
    } finally { sessionEnCours = '' }
  }

  async function deconnecterAutres() {
    sessionEnCours = 'autres'
    try {
      const res = await api.delete('/account/sessions')
      toast.succes('Autres appareils déconnectés', res.data?.data?.message)
      confirmationAutres = false
      await chargerSessions()
    } catch (e: any) {
      if (!e.toastAffiche) toast.erreur('Erreur', messageErreur(e, 'Impossible de déconnecter les autres appareils'))
    } finally { sessionEnCours = '' }
  }

  async function sauvegarderProfil() {
    erreurProfil = ''
    const payload: Record<string, string | null> = {}
    const prenom = formProfil.firstName.trim()
    const nom = formProfil.lastName.trim()
    const tel = formProfil.phone.replace(/\s+/g, '')
    const avatar = formProfil.avatarUrl.trim()
    if (prenom) payload.firstName = prenom
    if (nom) payload.lastName = nom
    if (tel) payload.phone = tel
    else if (profil?.profile?.phone) payload.phone = null
    if (avatar) payload.avatarUrl = avatar
    else if (profil?.profile?.avatarUrl) payload.avatarUrl = null
    actionEnCours = 'profil'
    try {
      await api.put('/account/profile', payload)
      toast.succes('Profil mis à jour')
      await charger()
      if (profil?.fullName) auth.update({ fullName: profil.fullName, avatarUrl: profil.profile?.avatarUrl ?? null })
    } catch (e: any) {
      if (e.response?.status === 422) erreurProfil = messageErreur(e, 'Certaines informations sont invalides.')
      else if (!e.toastAffiche) toast.erreur('Erreur', messageErreur(e, 'Impossible de sauvegarder'))
    } finally { actionEnCours = '' }
  }

  async function changerMotDePasse() {
    erreursMdp = {}
    actionEnCours = 'mdp'
    try {
      const res = await api.post('/account/change-password', formMdp)
      toast.succes('Mot de passe modifié', res.data?.data?.message)
      formMdp = { currentPassword: '', newPassword: '', newPasswordConfirmation: '' }
      await chargerSessions()
    } catch (e: any) {
      if (e.response?.status === 422 && Array.isArray(e.response.data?.errors)) {
        e.response.data.errors.forEach((err: any) => { erreursMdp[err.field] = err.message })
      } else if (e.response?.status === 400 && e.response.data?.message) {
        erreursMdp.currentPassword = e.response.data.message
      } else if (!e.toastAffiche) {
        toast.erreur('Erreur', messageErreur(e, 'Impossible de changer le mot de passe'))
      }
    } finally { actionEnCours = '' }
  }

  onMount(charger)
</script>

<svelte:head><title>Mon profil — TransfertCM Admin</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Mon profil</h2>
  <p class="text-sm text-slate-500 mt-0.5">Gérez vos informations personnelles et votre sécurité</p>
</div>

{#if chargement}
  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">
    <div class="lg:col-span-2 space-y-5">
      <div class="skeleton h-64 rounded-2xl"></div>
      <div class="skeleton h-48 rounded-2xl"></div>
    </div>
    <div class="skeleton h-64 rounded-2xl"></div>
  </div>
{:else if !profil}
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow py-20 text-center">
    <p class="text-slate-600 font-semibold">Profil indisponible</p>
    <button onclick={charger} class="btn-secondary mt-4">Réessayer</button>
  </div>
{:else}
  <div class="grid grid-cols-1 lg:grid-cols-3 stagger gap-5">

    <!-- Colonne principale -->
    <div class="lg:col-span-2 space-y-5">

      <!-- Informations du profil -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">person</span>
          </div>
          <h3 class="font-bold text-slate-900">Informations personnelles</h3>
        </div>
        <div class="p-5 space-y-4">
          <!-- Avatar -->
          <div class="flex items-center gap-4 mb-2">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
              style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
              {initiales(profil.profile?.fullName ?? profil.fullName ?? null)}
            </div>
            <div>
              <p class="font-bold text-slate-900">{profil.profile?.fullName ?? profil.fullName ?? '—'}</p>
              <p class="text-sm text-slate-500">{profil.email}</p>
              <div class="flex gap-1.5 mt-1.5 flex-wrap">
                {#each [...new Set([profil.role, ...(profil.roles ?? [])].filter(Boolean))] as role}
                  <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                    {libellesRoles[role] ?? role}
                  </span>
                {/each}
              </div>
              <p class="text-xs text-slate-400 mt-1.5">
                Membre depuis le {formaterDate(profil.createdAt)}
                {#if profil.profile?.lastLoginAt} · Dernière connexion : {formaterDate(profil.profile.lastLoginAt)}{/if}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="prf-prenom" class="block text-xs font-semibold text-slate-600 mb-1.5">Prénom</label>
              <input id="prf-prenom" type="text" bind:value={formProfil.firstName} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label for="prf-nom" class="block text-xs font-semibold text-slate-600 mb-1.5">Nom</label>
              <input id="prf-nom" type="text" bind:value={formProfil.lastName} class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="prf-phone" class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
              <input id="prf-phone" type="tel" bind:value={formProfil.phone} placeholder="6XXXXXXXX" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label for="prf-avatar" class="block text-xs font-semibold text-slate-600 mb-1.5">URL Avatar</label>
              <input id="prf-avatar" type="url" bind:value={formProfil.avatarUrl} placeholder="https://..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          {#if erreurProfil}
            <p class="text-red-500 text-xs">{erreurProfil}</p>
          {/if}
          <div class="flex justify-end">
            <button onclick={sauvegarderProfil} disabled={actionEnCours === 'profil'} class="btn-primary">
              {#if actionEnCours === 'profil'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>{/if}
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      <!-- Changer mot de passe -->
      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:18px">lock</span>
          </div>
          <h3 class="font-bold text-slate-900">Changer le mot de passe</h3>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label for="mdp-actuel" class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe actuel *</label>
            <div class="relative">
              <input id="mdp-actuel" type={afficherMdpActuel ? 'text' : 'password'} bind:value={formMdp.currentPassword}
                class="w-full px-3 py-2.5 pr-10 rounded-xl border text-sm {erreursMdp.currentPassword ? 'border-red-400' : 'border-slate-200'}" />
              <button type="button" onclick={() => afficherMdpActuel = !afficherMdpActuel}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <span class="material-symbols-outlined" style="font-size:16px">{afficherMdpActuel ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {#if erreursMdp.currentPassword}<p class="text-red-500 text-xs mt-1">{erreursMdp.currentPassword}</p>{/if}
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="mdp-nouveau" class="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau mot de passe *</label>
              <div class="relative">
                <input id="mdp-nouveau" type={afficherNouveauMdp ? 'text' : 'password'} bind:value={formMdp.newPassword}
                  class="w-full px-3 py-2.5 pr-10 rounded-xl border text-sm {erreursMdp.newPassword ? 'border-red-400' : 'border-slate-200'}" />
                <button type="button" onclick={() => afficherNouveauMdp = !afficherNouveauMdp}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span class="material-symbols-outlined" style="font-size:16px">{afficherNouveauMdp ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {#if erreursMdp.newPassword}<p class="text-red-500 text-xs mt-1">{erreursMdp.newPassword}</p>{/if}
            </div>
            <div>
              <label for="mdp-confirm" class="block text-xs font-semibold text-slate-600 mb-1.5">Confirmation *</label>
              <input id="mdp-confirm" type="password" bind:value={formMdp.newPasswordConfirmation}
                class="w-full px-3 py-2.5 rounded-xl border text-sm {erreursMdp.newPasswordConfirmation ? 'border-red-400' : 'border-slate-200'}" />
              {#if erreursMdp.newPasswordConfirmation}<p class="text-red-500 text-xs mt-1">{erreursMdp.newPasswordConfirmation}</p>{/if}
            </div>
          </div>
          <div class="flex justify-end">
            <button onclick={changerMotDePasse}
              disabled={!formMdp.currentPassword || !formMdp.newPassword || !formMdp.newPasswordConfirmation || actionEnCours === 'mdp'}
              class="btn-primary">
              {#if actionEnCours === 'mdp'}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">lock_reset</span>{/if}
              Changer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Colonne latérale -->
    <div class="space-y-5">

      <!-- Permissions -->
      {#if profil.permissions}
        <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">admin_panel_settings</span>
            </div>
            <h3 class="font-bold text-slate-900 flex-1">Permissions</h3>
            {#if profil.permissionsCustomized}
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Personnalisées</span>
            {/if}
          </div>
          <div class="p-5">
            {#if profil.permissionsCustomized}
              <p class="text-xs text-slate-400 mb-3">Vos permissions ont été personnalisées par un super administrateur et diffèrent de celles de votre rôle.</p>
            {/if}
            <div class="grid grid-cols-1 gap-2">
              {#each permissionsAffichees as [key, val]}
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-600">{libellesPermissions[key]}</span>
                  <span class="w-4 h-4 rounded-full flex items-center justify-center {val ? 'bg-emerald-100' : 'bg-slate-100'}">
                    <span class="material-symbols-outlined icon-filled {val ? 'text-emerald-600' : 'text-slate-400'}" style="font-size:12px">
                      {val ? 'check' : 'close'}
                    </span>
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-emerald-600 icon-filled" style="font-size:18px">devices</span>
          </div>
          <h3 class="font-bold text-slate-900">Sessions actives</h3>
        </div>
        <div class="divide-y divide-slate-50">
          {#if chargementSessions && sessions.length === 0}
            <div class="p-5 space-y-2">{#each Array(2) as _}<div class="skeleton h-12 rounded-xl"></div>{/each}</div>
          {:else if sessions.length === 0}
            <p class="p-5 text-sm text-slate-400 text-center">Aucune session active</p>
          {:else}
            {#each sessions as sess (sess.id)}
              <div class="px-5 py-3 flex items-start gap-3">
                <span class="material-symbols-outlined text-slate-400 mt-0.5" style="font-size:18px">
                  {estMobile(sess.userAgent) ? 'smartphone' : 'computer'}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <p class="text-sm font-semibold text-slate-800 truncate" title={sess.userAgent ?? ''}>{decrireAppareil(sess.userAgent)}</p>
                    {#if sess.isCurrent}
                      <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Cet appareil</span>
                    {/if}
                  </div>
                  <p class="text-xs text-slate-400">Connecté le {formaterDate(sess.createdAt)}</p>
                  <p class="text-xs text-slate-400">Dernière activité : {formaterDate(sess.lastUsedAt)}</p>
                </div>
                {#if !sess.isCurrent}
                  <button onclick={() => deconnecterSession(sess.id)} disabled={sessionEnCours !== ''}
                    class="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 shrink-0">
                    {sessionEnCours === sess.id ? '...' : 'Déconnecter'}
                  </button>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
        {#if sessions.some((s) => !s.isCurrent)}
          <div class="px-5 py-4 border-t border-slate-100">
            {#if confirmationAutres}
              <p class="text-xs text-slate-600 mb-2">Tous vos autres appareils seront déconnectés. Cet appareil reste connecté.</p>
              <div class="flex gap-2">
                <button onclick={() => confirmationAutres = false} class="btn-secondary flex-1 justify-center">Annuler</button>
                <button onclick={deconnecterAutres} disabled={sessionEnCours !== ''}
                  class="flex-1 px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                  {sessionEnCours === 'autres' ? '...' : 'Confirmer'}
                </button>
              </div>
            {:else}
              <button onclick={() => confirmationAutres = true}
                class="w-full px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined" style="font-size:16px">logout</span>
                Déconnecter les autres appareils
              </button>
            {/if}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}
