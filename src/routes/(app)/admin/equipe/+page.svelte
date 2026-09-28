<script lang="ts">
  import { onMount } from 'svelte'
  import api from '$lib/api'
  import { toast } from '$lib/stores/toast.svelte'
  import { auth, type AdminRole } from '$lib/stores/auth.svelte'

  type AdminMember = {
    id: string
    fullName: string | null
    email: string
    role: AdminRole
    isActive: boolean
    initials: string
    createdAt: string
  }

  let equipe = $state<AdminMember[]>([])
  let chargement = $state(true)

  // Modal création
  let modalCreer = $state(false)
  let formCreer = $state({ fullName: '', email: '', password: '', role: 'admin' as AdminRole })
  let envoiCreer = $state(false)
  let erreurCreer = $state('')

  // Modal édition
  let modalEditer = $state(false)
  let adminEnEdition = $state<AdminMember | null>(null)
  let formEditer = $state({ fullName: '', role: 'admin' as AdminRole, isActive: true })
  let envoiEditer = $state(false)

  // Confirmation suppression
  let adminASupprimer = $state<AdminMember | null>(null)
  let suppressionEnCours = $state(false)

  const roles: { value: AdminRole; label: string; couleur: string }[] = [
    { value: 'super_admin',        label: 'Super Admin',       couleur: 'bg-purple-100 text-purple-700' },
    { value: 'admin',              label: 'Admin',             couleur: 'bg-blue-100 text-blue-700' },
    { value: 'service_client',     label: 'Service client',    couleur: 'bg-teal-100 text-teal-700' },
    { value: 'chef_agents_promo',  label: 'Chef agents promo', couleur: 'bg-amber-100 text-amber-700' },
    { value: 'controleur_cabine',  label: 'Contrôleur cabine', couleur: 'bg-orange-100 text-orange-700' },
  ]

  function couleurRole(role: AdminRole) {
    return roles.find(r => r.value === role)?.couleur ?? 'bg-slate-100 text-slate-600'
  }
  function labelRole(role: AdminRole) {
    return roles.find(r => r.value === role)?.label ?? role
  }

  async function charger() {
    chargement = true
    try {
      const res = await api.get('/admin/team')
      equipe = (res.data?.data ?? []).filter((a: AdminMember) => (a.role as string) !== 'cabin')
    } catch {
      toast.erreur('Erreur', 'Impossible de charger l\'équipe')
    } finally {
      chargement = false
    }
  }

  const libellesChamps: Record<string, string> = {
    fullName: 'Nom complet', email: 'Email', password: 'Mot de passe', role: 'Rôle',
  }

  function ouvrirCreation() {
    erreurCreer = ''
    modalCreer = true
  }

  async function creerAdmin() {
    erreurCreer = ''
    if (formCreer.fullName.trim().length < 2) { erreurCreer = 'Le nom complet est obligatoire (2 caractères minimum).'; return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formCreer.email.trim())) { erreurCreer = 'Adresse email invalide.'; return }
    if (formCreer.password.length < 8) { erreurCreer = 'Le mot de passe doit contenir au moins 8 caractères.'; return }
    envoiCreer = true
    try {
      const res = await api.post('/admin/team', { ...formCreer, fullName: formCreer.fullName.trim(), email: formCreer.email.trim() })
      const cree = res.data?.data
      if (!cree?.id) {
        erreurCreer = cree?.error ?? 'Impossible de créer le compte'
        return
      }
      equipe = [...equipe, cree]
      modalCreer = false
      formCreer = { fullName: '', email: '', password: '', role: 'admin' }
      toast.succes('Admin créé', `${cree.fullName} peut maintenant se connecter.`)
    } catch (e: any) {
      const champs = e.response?.data?.errors
      if (e.response?.status === 422 && Array.isArray(champs) && champs.length) {
        erreurCreer = 'Champ(s) invalide(s) : ' + [...new Set(champs.map((x: any) => libellesChamps[x.field] ?? x.field))].join(', ')
      } else {
        erreurCreer = e.response?.data?.message ?? 'Impossible de créer le compte'
      }
    } finally {
      envoiCreer = false
    }
  }

  function ouvrirEdition(admin: AdminMember) {
    adminEnEdition = admin
    formEditer = { fullName: admin.fullName ?? '', role: admin.role, isActive: admin.isActive }
    modalEditer = true
  }

  async function sauvegarderEdition() {
    if (!adminEnEdition) return
    envoiEditer = true
    try {
      const payload: any = {
        fullName: formEditer.fullName,
        role: formEditer.role,
        isActive: formEditer.isActive,
      }
      const res = await api.put(`/admin/team/${adminEnEdition.id}`, payload)
      equipe = equipe.map(a => a.id === adminEnEdition!.id ? { ...a, ...res.data?.data } : a)
      modalEditer = false
      toast.succes('Compte mis à jour')
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de modifier')
    } finally {
      envoiEditer = false
    }
  }

  async function supprimerAdmin() {
    if (!adminASupprimer) return
    suppressionEnCours = true
    try {
      await api.delete(`/admin/team/${adminASupprimer.id}`)
      equipe = equipe.filter(a => a.id !== adminASupprimer!.id)
      toast.succes('Compte supprimé')
      adminASupprimer = null
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de supprimer')
    } finally {
      suppressionEnCours = false
    }
  }

  onMount(charger)
</script>

<svelte:head><title>Équipe — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Équipe backoffice</h2>
    <p class="text-sm text-slate-500 mt-0.5">Gérez les comptes et rôles des administrateurs</p>
  </div>
  <button
    onclick={ouvrirCreation}
    class="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all"
  >
    <span class="material-symbols-outlined" style="font-size:18px">person_add</span>
    Ajouter un admin
  </button>
</div>

<!-- Tableau -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-6 space-y-3">
      {#each Array(4) as _}
        <div class="skeleton h-16 rounded-xl"></div>
      {/each}
    </div>
  {:else if equipe.length === 0}
    <div class="py-16 text-center">
      <span class="material-symbols-outlined text-slate-300 block mb-2" style="font-size:40px">group</span>
      <p class="text-slate-500 font-medium">Aucun admin trouvé</p>
    </div>
  {:else}
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50">
          <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Admin</th>
          <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Rôle</th>
          <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Statut</th>
          <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Créé le</th>
          <th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        {#each equipe as admin}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)"
                >
                  {admin.initials}
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{admin.fullName ?? '—'}</p>
                  <p class="text-xs text-slate-400">{admin.email}</p>
                </div>
                {#if admin.id === auth.user?.id}
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">Vous</span>
                {/if}
              </div>
            </td>
            <td class="px-5 py-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold {couleurRole(admin.role)}">
                {labelRole(admin.role)}
              </span>
            </td>
            <td class="px-5 py-4">
              {#if admin.isActive}
                <span class="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Actif
                </span>
              {:else}
                <span class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  Désactivé
                </span>
              {/if}
            </td>
            <td class="px-5 py-4 text-slate-400 text-xs">
              {new Date(admin.createdAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })}
            </td>
            <td class="px-5 py-4">
              {#if admin.role !== 'super_admin' && admin.id !== auth.user?.id}
                <div class="flex justify-end gap-1">
                  <button
                    onclick={() => ouvrirEdition(admin)}
                    class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    title="Modifier"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                  </button>
                  <button
                    onclick={() => adminASupprimer = admin}
                    class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                  </button>
                </div>
              {:else}
                <div class="flex justify-end">
                  <span class="text-xs text-slate-300">—</span>
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<!-- Encadré explications rôles -->
<div class="mt-6 bg-slate-50 rounded-2xl border border-slate-100 p-5">
  <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Accès par rôle</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {#each [
      { role: 'admin',             label: 'Admin',             desc: 'Accès complet sauf gestion équipe' },
      { role: 'service_client',    label: 'Service client',    desc: 'Support, messagerie, réclamations' },
      { role: 'chef_agents_promo', label: 'Chef agents promo', desc: 'Agents promo uniquement' },
      { role: 'controleur_cabine', label: 'Contrôleur cabine', desc: 'Cabines, commandes, abonnements' },
    ] as item}
      <div class="bg-white rounded-xl border border-slate-100 px-4 py-3">
        <span class="text-xs font-bold px-2 py-0.5 rounded-full {couleurRole(item.role as AdminRole)} mb-1.5 inline-block">
          {item.label}
        </span>
        <p class="text-xs text-slate-500">{item.desc}</p>
      </div>
    {/each}
  </div>
</div>

<!-- Modal créer admin -->
{#if modalCreer}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-black/30">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Créer un compte admin</h3>
        <button onclick={() => modalCreer = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet</label>
          <input bind:value={formCreer.fullName} type="text" placeholder="Jean Dupont"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
          <input bind:value={formCreer.email} type="email" placeholder="jean@transfertcm.com"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe temporaire</label>
          <input bind:value={formCreer.password} type="password" placeholder="Min. 8 caractères"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Rôle</label>
          <select bind:value={formCreer.role}
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300 bg-white">
            {#each roles.filter(r => r.value !== 'super_admin') as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>
        {#if erreurCreer}
          <p class="text-red-500 text-xs">{erreurCreer}</p>
        {/if}
        <div class="flex gap-2 pt-2">
          <button onclick={() => modalCreer = false}
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button onclick={creerAdmin} disabled={envoiCreer}
            class="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if envoiCreer}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              Créer le compte
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal éditer admin -->
{#if modalEditer && adminEnEdition}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-black/30">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Modifier — {adminEnEdition.fullName}</h3>
        <button onclick={() => modalEditer = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet</label>
          <input bind:value={formEditer.fullName} type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Rôle</label>
          <select bind:value={formEditer.role}
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300 bg-white">
            {#each roles.filter(r => r.value !== 'super_admin') as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Statut du compte</label>
          <div class="flex gap-2">
            <button
              onclick={() => formEditer.isActive = true}
              class="flex-1 py-2 rounded-xl border text-sm font-medium transition-all
                {formEditer.isActive ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}">
              Actif
            </button>
            <button
              onclick={() => formEditer.isActive = false}
              class="flex-1 py-2 rounded-xl border text-sm font-medium transition-all
                {!formEditer.isActive ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 text-slate-500'}">
              Désactivé
            </button>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick={() => modalEditer = false}
            class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button onclick={sauvegarderEdition} disabled={envoiEditer}
            class="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {#if envoiEditer}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              Enregistrer
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modal confirmation suppression -->
{#if adminASupprimer}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-black/30">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-red-500" style="font-size:24px">delete</span>
      </div>
      <h3 class="font-bold text-slate-900 mb-1">Supprimer ce compte ?</h3>
      <p class="text-sm text-slate-500 mb-6">
        Le compte de <strong>{adminASupprimer.fullName}</strong> sera supprimé définitivement.
        Cette action est irréversible.
      </p>
      <div class="flex gap-2">
        <button onclick={() => adminASupprimer = null}
          class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button onclick={supprimerAdmin} disabled={suppressionEnCours}
          class="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
          {#if suppressionEnCours}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {:else}
            Supprimer
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
