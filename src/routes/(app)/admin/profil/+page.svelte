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
    isSuperAdmin: 'Super administrateur',
    canViewDashboard: 'Tableau de bord',
    canViewOrders: 'Voir les commandes',
    canAssignOrders: 'Assigner les commandes',
    canViewControl: 'Contrôle',
    canViewAllocations: 'Allocations',
    canViewNotifications: 'Notifications',
    canViewUvNotifications: 'Notifications UV',
    canViewSettings: 'Paramètres',
    canManageCabins: 'Gérer les cabines',
    canManageUsers: 'Gérer les utilisateurs',
    canViewSalaries: 'Salaires',
    canViewStatistics: 'Statistiques',
    canAccessUv: 'Unités de valeur (UV)',
    canAccessComplaints: 'Réclamations',
    canAccessCallCenter: 'Centre d\'appels',
    canViewTciMembers: 'Membres TCI',
    canViewGifts: 'Cadeaux',
    canViewReports: 'Voir les rapports',
    canValidateReports: 'Valider les rapports',
    canViewPromoAgents: 'Agents promo',
    canViewClients: 'Clients',
    canViewQuiz: 'Quiz',
    canViewWallets: 'Portefeuilles',
  }

  const permissionsAffichees = $derived(
    profil?.permissions
      ? Object.entries(profil.permissions).filter(([k]) => k in libellesPermissions)
      : []
  )

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
  }

  async function sauvegarderProfil() {
    erreurProfil = ''
    const payload: Record<string, string> = {}
    const prenom = formProfil.firstName.trim()
    const nom = formProfil.lastName.trim()
    const tel = formProfil.phone.replace(/\s+/g, '')
    const avatar = formProfil.avatarUrl.trim()
    if (prenom) {
      if (prenom.length < 2) { erreurProfil = 'Le prénom doit contenir au moins 2 caractères.'; return }
      payload.firstName = prenom
    }
    if (nom) {
      if (nom.length < 2) { erreurProfil = 'Le nom doit contenir au moins 2 caractères.'; return }
      payload.lastName = nom
    }
    if (tel) {
      if (!/^(\+?237)?6\d{8}$/.test(tel)) { erreurProfil = 'Téléphone invalide : format attendu 6XXXXXXXX (préfixe 237 facultatif).'; return }
      payload.phone = tel
    }
    if (avatar) {
      if (!/^https?:\/\/\S+\.\S+/.test(avatar)) { erreurProfil = 'L\'URL de l\'avatar doit commencer par http:// ou https://.'; return }
      payload.avatarUrl = avatar
    }
    actionEnCours = 'profil'
    try {
      await api.put('/account/profile', payload)
      toast.succes('Profil mis à jour')
      await charger()
      if (profil?.fullName) auth.update({ fullName: profil.fullName })
    } catch (e: any) {
      if (e.response?.status === 422) erreurProfil = 'Certaines informations sont invalides. Vérifiez le téléphone et l\'URL de l\'avatar.'
      else toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { actionEnCours = '' }
  }

  async function changerMotDePasse() {
    erreursMdp = {}
    actionEnCours = 'mdp'
    try {
      await api.post('/account/change-password', formMdp)
      toast.succes('Mot de passe modifié')
      formMdp = { currentPassword: '', newPassword: '', newPasswordConfirmation: '' }
    } catch (e: any) {
      if (e.response?.status === 422) {
        e.response.data?.errors?.forEach((err: any) => {
          erreursMdp[err.field] = err.field === 'newPassword'
            ? 'Le mot de passe doit contenir entre 8 et 64 caractères.'
            : err.field === 'newPasswordConfirmation'
              ? 'La confirmation ne correspond pas au nouveau mot de passe.'
              : 'Champ obligatoire.'
        })
      } else {
        toast.erreur('Erreur', e.response?.data?.message ?? e.response?.data?.error ?? 'Impossible de changer le mot de passe')
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
            <h3 class="font-bold text-slate-900">Permissions</h3>
          </div>
          <div class="p-5">
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

    </div>
  </div>
{/if}
