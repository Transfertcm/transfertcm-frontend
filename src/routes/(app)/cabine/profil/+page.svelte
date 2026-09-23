<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { cabinAuth } from '$lib/stores/cabin-auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

  let profil = $state<any>(null)
  let chargement = $state(true)
  let enregistrement = $state(false)

  let modalContact = $state(false)
  let modalMoMo    = $state(false)
  let modalMdp     = $state(false)

  let formContact = $state({ phone: '', whatsappNumber: '', whatsappOptIn: false })
  let formMoMo    = $state({ mtnNumber: '', orangeNumber: '' })
  let formMdp     = $state({ actuel: '', nouveau: '', confirmation: '' })

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/profile')
      profil = res.data?.data ?? null
      if (profil) {
        formContact.phone          = profil.phone ?? ''
        formContact.whatsappNumber = profil.whatsappNumber ?? ''
        formContact.whatsappOptIn  = profil.whatsappOptIn ?? false
        formMoMo.mtnNumber         = profil.mobileMoney?.mtnNumber ?? ''
        formMoMo.orangeNumber      = profil.mobileMoney?.orangeNumber ?? ''
      }
    } catch {
      toast.erreur('Erreur', 'Impossible de charger le profil')
    } finally {
      chargement = false
    }
  }

  async function sauvegarderContact(e: Event) {
    e.preventDefault()
    enregistrement = true
    try {
      await apiCabin.put('/cabin/profile', {
        phone:          formContact.phone,
        whatsappNumber: formContact.whatsappNumber,
        whatsappOptIn:  formContact.whatsappOptIn,
      })
      toast.succes('Contact mis à jour')
      modalContact = false
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { enregistrement = false }
  }

  async function sauvegarderMoMo(e: Event) {
    e.preventDefault()
    enregistrement = true
    try {
      await apiCabin.put('/cabin/profile/mobile-money', formMoMo)
      toast.succes('Numéros mis à jour')
      cabinAuth.update({ mtnNumber: formMoMo.mtnNumber, orangeNumber: formMoMo.orangeNumber })
      modalMoMo = false
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de sauvegarder')
    } finally { enregistrement = false }
  }

  async function changerMdp(e: Event) {
    e.preventDefault()
    if (formMdp.nouveau !== formMdp.confirmation) {
      toast.erreur('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }
    enregistrement = true
    try {
      await apiCabin.post('/cabin/profile/change-password', {
        currentPassword:        formMdp.actuel,
        newPassword:             formMdp.nouveau,
        newPasswordConfirmation: formMdp.confirmation,
      })
      toast.succes('Mot de passe modifié')
      formMdp = { actuel: '', nouveau: '', confirmation: '' }
      modalMdp = false
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de modifier')
    } finally { enregistrement = false }
  }

  onMount(charger)
</script>

<svelte:head><title>Mon profil — Espace cabine</title></svelte:head>

<div class="mb-6">
  <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Mon profil</h2>
  <p class="text-sm text-slate-500 mt-0.5">Identité et informations du compte</p>
</div>

{#if chargement}
  <div class="space-y-4">
    {#each Array(3) as _}<div class="skeleton h-32 rounded-2xl"></div>{/each}
  </div>
{:else}

  <!-- Identité -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-5 mb-5 flex items-center gap-4">
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
      style="background: linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
      {(profil?.name ?? '?')[0]?.toUpperCase()}
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="font-bold text-lg text-slate-900 truncate">{profil?.name ?? '—'}</h3>
      <p class="text-slate-500 text-sm">{profil?.managerName ?? '—'} · {profil?.city ?? '—'}</p>
      <p class="text-xs text-slate-400 mt-0.5">{profil?.email ?? '—'}</p>
    </div>
    <div class="flex flex-col items-end gap-1.5 shrink-0">
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
        {profil?.type ?? 'basic'}
      </span>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full
        {profil?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
        {profil?.status === 'active' ? 'Actif' : 'Suspendu'}
      </span>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 stagger gap-5">

    <!-- Contact -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">contact_phone</span>
          </div>
          <h3 class="font-bold text-slate-900">Contact</h3>
        </div>
        <button onclick={() => modalContact = true} class="btn-secondary text-xs px-3 py-1.5">
          <span class="material-symbols-outlined icon-filled" style="font-size:14px">edit</span>
          Modifier
        </button>
      </div>
      <div class="p-5 space-y-3">
        {#each [
          { label: 'Téléphone',  val: profil?.phone },
          { label: 'WhatsApp',   val: profil?.whatsappNumber },
          { label: 'Ville',      val: profil?.city },
          { label: 'Localisation', val: profil?.location },
        ] as row}
          <div class="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
            <span class="text-sm text-slate-500">{row.label}</span>
            <span class="text-sm font-semibold text-slate-800">{row.val ?? '—'}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Mobile Money -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:18px">smartphone</span>
          </div>
          <h3 class="font-bold text-slate-900">Mobile Money</h3>
        </div>
        <button onclick={() => modalMoMo = true} class="btn-secondary text-xs px-3 py-1.5">
          <span class="material-symbols-outlined icon-filled" style="font-size:14px">edit</span>
          Modifier
        </button>
      </div>
      <div class="p-5 space-y-3">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
          <div class="flex-1">
            <p class="text-xs font-semibold text-amber-700">MTN Mobile Money</p>
            <p class="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {profil?.mobileMoney?.mtnNumber ?? '—'}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
          <div class="flex-1">
            <p class="text-xs font-semibold text-orange-700">Orange Money</p>
            <p class="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {profil?.mobileMoney?.orangeNumber ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sécurité -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <span class="material-symbols-outlined text-slate-500 icon-filled" style="font-size:18px">lock</span>
          </div>
          <h3 class="font-bold text-slate-900">Sécurité</h3>
        </div>
        <button onclick={() => modalMdp = true} class="btn-secondary text-xs px-3 py-1.5">
          <span class="material-symbols-outlined icon-filled" style="font-size:14px">lock_reset</span>
          Changer
        </button>
      </div>
      <div class="p-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size:18px">password</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-800">Mot de passe</p>
            <p class="text-xs text-slate-400 mt-0.5">••••••••••••</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Accès rapide -->
    <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="text-sm text-slate-400 uppercase tracking-wide font-semibold">Accès rapide</h3>
      </div>
      <div class="p-3 space-y-1">
        {#each [
          { href: '/cabine/abonnement',  icon: 'verified',  label: 'Abonnement',       desc: 'Statut, factures et upgrade' },
          { href: '/cabine/performance', icon: 'analytics', label: 'Performance',       desc: 'Scores et statistiques' },
          { href: '/cabine/parametres',  icon: 'tune',      label: 'Paramètres',        desc: 'USSD et notifications' },
          { href: '/cabine/documents',   icon: 'badge',     label: 'Pièce d\'identité', desc: 'Soumettre ou vérifier' },
          { href: '/cabine/uv',          icon: 'bolt',      label: 'Solde UV',          desc: 'Historique et recharges' },
        ] as link}
          <a href={link.href} class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
            <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:18px">{link.icon}</span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-800">{link.label}</p>
              <p class="text-xs text-slate-400">{link.desc}</p>
            </div>
            <span class="material-symbols-outlined text-slate-300 group-hover:text-slate-500 transition-colors" style="font-size:18px">chevron_right</span>
          </a>
        {/each}
      </div>
    </div>

  </div>
{/if}

<!-- Modal : Contact -->
{#if modalContact}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Modifier le contact</h3>
        <button onclick={() => modalContact = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={sauvegarderContact} class="p-6 space-y-4">
        <div>
          <label for="phone" class="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
          <input id="phone" type="tel" bind:value={formContact.phone} placeholder="6XXXXXXXX"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="whatsapp" class="block text-xs font-semibold text-slate-600 mb-1.5">WhatsApp</label>
          <input id="whatsapp" type="tel" bind:value={formContact.whatsappNumber} placeholder="6XXXXXXXX"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="flex items-center gap-3">
          <input type="checkbox" id="wa-opt" bind:checked={formContact.whatsappOptIn} class="accent-orange-500" />
          <label for="wa-opt" class="text-sm text-slate-700 cursor-pointer">Activer les notifications WhatsApp</label>
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => modalContact = false} class="btn-secondary flex-1 justify-center">Annuler</button>
          <button type="submit" disabled={enregistrement} class="btn-primary flex-1 justify-center">
            {#if enregistrement}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>{/if}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal : Mobile Money -->
{#if modalMoMo}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Numéros Mobile Money</h3>
        <button onclick={() => modalMoMo = false} class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={sauvegarderMoMo} class="p-6 space-y-4">
        <div>
          <label for="mtn" class="block text-xs font-semibold text-slate-600 mb-1.5">
            <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400"></span>MTN Mobile Money</span>
          </label>
          <input id="mtn" type="tel" bind:value={formMoMo.mtnNumber} placeholder="67XXXXXXX"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="orange" class="block text-xs font-semibold text-slate-600 mb-1.5">
            <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-500"></span>Orange Money</span>
          </label>
          <input id="orange" type="tel" bind:value={formMoMo.orangeNumber} placeholder="69XXXXXXX"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => modalMoMo = false} class="btn-secondary flex-1 justify-center">Annuler</button>
          <button type="submit" disabled={enregistrement} class="btn-primary flex-1 justify-center">
            {#if enregistrement}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>{/if}
            Mettre à jour
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal : Mot de passe -->
{#if modalMdp}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-md pointer-events-auto animate-fade-in-up"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-900">Modifier le mot de passe</h3>
        <button onclick={() => { modalMdp = false; formMdp = { actuel: '', nouveau: '', confirmation: '' } }}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={changerMdp} class="p-6 space-y-4">
        <div>
          <label for="mdp-actuel" class="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe actuel</label>
          <input id="mdp-actuel" type="password" bind:value={formMdp.actuel} placeholder="••••••••" required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="mdp-nouveau" class="block text-xs font-semibold text-slate-600 mb-1.5">Nouveau mot de passe</label>
          <input id="mdp-nouveau" type="password" bind:value={formMdp.nouveau} placeholder="Min. 8 caractères" required minlength="8"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div>
          <label for="mdp-confirm" class="block text-xs font-semibold text-slate-600 mb-1.5">Confirmer</label>
          <input id="mdp-confirm" type="password" bind:value={formMdp.confirmation} placeholder="••••••••" required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-400 transition-colors
              {formMdp.confirmation && formMdp.nouveau !== formMdp.confirmation ? 'border-red-300' : ''}" />
          {#if formMdp.confirmation && formMdp.nouveau !== formMdp.confirmation}
            <p class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
          {/if}
        </div>
        <div class="flex gap-3 pt-1">
          <button type="button"
            onclick={() => { modalMdp = false; formMdp = { actuel: '', nouveau: '', confirmation: '' } }}
            class="btn-secondary flex-1 justify-center">Annuler</button>
          <button type="submit"
            disabled={enregistrement || !formMdp.actuel || !formMdp.nouveau || formMdp.nouveau !== formMdp.confirmation}
            class="btn-primary flex-1 justify-center">
            {#if enregistrement}<span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}<span class="material-symbols-outlined icon-filled" style="font-size:16px">lock_reset</span>{/if}
            Modifier
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
