<script lang="ts">
  import { onMount } from 'svelte'
  import apiCabin from '$lib/api-cabin'
  import { toast } from '$lib/stores/toast.svelte'

  let carteIdentite = $state<any>(null)
  let chargement = $state(true)
  let modalOuverte = $state(false)
  let envoi = $state(false)

  let typeDocument = $state('cni')
  let frontFile = $state<File | null>(null)
  let backFile = $state<File | null>(null)
  let frontPreview = $state<string | null>(null)
  let backPreview = $state<string | null>(null)

  const labelType: Record<string, string> = {
    cni:      "Carte Nationale d'Identité",
    passport: 'Passeport',
    permis:   'Permis de conduire',
    autre:    'Autre document officiel',
  }

  const peutSoumettre = $derived(
    !carteIdentite ||
    !carteIdentite.status ||
    carteIdentite.status === 'rejected' ||
    carteIdentite.status === 'pending'
  )

  async function charger() {
    chargement = true
    try {
      const res = await apiCabin.get('/cabin/profile/id-card')
      carteIdentite = res.data?.data ?? null
    } catch {
      toast.erreur('Erreur', 'Impossible de charger le statut du document')
    } finally {
      chargement = false
    }
  }

  function lireFichier(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function choisirFichier(e: Event, face: 'front' | 'back') {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.erreur('Fichier trop volumineux', 'La taille maximale est 5 Mo')
      return
    }
    const preview = await lireFichier(file)
    if (face === 'front') { frontFile = file; frontPreview = preview }
    else                  { backFile  = file; backPreview  = preview }
  }

  async function soumettre(e: Event) {
    e.preventDefault()
    if (!frontPreview || !backPreview) {
      toast.erreur('Documents manquants', 'Sélectionnez les deux faces du document')
      return
    }
    envoi = true
    try {
      await apiCabin.post('/cabin/profile/id-card', {
        frontImageUrl: frontPreview,
        backImageUrl:  backPreview,
        documentType:  typeDocument,
      })
      toast.succes('Document soumis', 'Vérification sous 24-48h.')
      fermerModal()
      await charger()
    } catch (err: any) {
      toast.erreur('Erreur', err.response?.data?.message ?? 'Impossible de soumettre')
    } finally {
      envoi = false
    }
  }

  function fermerModal() {
    modalOuverte = false
    frontFile = null; backFile = null
    frontPreview = null; backPreview = null
    typeDocument = 'cni'
  }

  onMount(charger)
</script>

<svelte:head><title>Documents — Espace cabine</title></svelte:head>

<!-- En-tête avec bouton toujours accessible -->
<div class="mb-6 flex items-start justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Documents</h2>
    <p class="text-sm text-slate-500 mt-0.5">Pièce d'identité et vérification du compte</p>
  </div>
  {#if !chargement && peutSoumettre}
    <button onclick={() => modalOuverte = true} class="btn-primary">
      <span class="material-symbols-outlined icon-filled" style="font-size:16px">upload_file</span>
      {carteIdentite ? 'Mettre à jour le document' : 'Soumettre un document'}
    </button>
  {/if}
</div>

{#if chargement}
  <div class="skeleton h-48 rounded-2xl"></div>
{:else}

  <!-- Statut de vérification -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden mb-5">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <span class="material-symbols-outlined text-blue-500 icon-filled" style="font-size:18px">verified_user</span>
      </div>
      <h3 class="font-bold text-slate-900">Vérification d'identité</h3>
    </div>

    <div class="p-6">
      {#if !carteIdentite || !carteIdentite.status}
        <!-- Aucun document -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-slate-400" style="font-size:28px">badge</span>
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-800 mb-1">Aucun document soumis</p>
            <p class="text-sm text-slate-500">
              Soumettez votre pièce d'identité pour valider votre compte et accéder à toutes les fonctionnalités.
            </p>
          </div>
        </div>

      {:else if carteIdentite.status === 'approved'}
        <!-- Approuvé -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-emerald-500 icon-filled" style="font-size:28px">verified</span>
          </div>
          <div class="flex-1">
            <p class="font-bold text-emerald-800 mb-1">Identité vérifiée</p>
            <p class="text-sm text-emerald-700">Votre pièce d'identité a été approuvée. Votre compte est entièrement vérifié.</p>
            {#if carteIdentite.submittedAt}
              <p class="text-xs text-slate-400 mt-1.5">
                Soumis le {new Date(carteIdentite.submittedAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            {/if}
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-semibold shrink-0">
            <span class="material-symbols-outlined icon-filled" style="font-size:14px">check_circle</span>
            Approuvé
          </span>
        </div>

      {:else if carteIdentite.status === 'pending'}
        <!-- En attente -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-amber-500 icon-filled" style="font-size:28px">pending</span>
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-800 mb-1">En cours de vérification</p>
            <p class="text-sm text-slate-500">Votre document est en cours d'examen. Ce processus prend généralement 24 à 48h ouvrées.</p>
            {#if carteIdentite.submittedAt}
              <p class="text-xs text-slate-400 mt-1.5">
                Soumis le {new Date(carteIdentite.submittedAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            {/if}
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-semibold shrink-0">
            <span class="material-symbols-outlined icon-filled" style="font-size:14px">schedule</span>
            En attente
          </span>
        </div>

        <!-- Indicateur recto/verso -->
        <div class="flex gap-4 mt-5 pt-5 border-t border-slate-100">
          <div class="flex items-center gap-2 text-sm {carteIdentite.hasFrontImage ? 'text-emerald-600' : 'text-slate-400'}">
            <span class="material-symbols-outlined icon-filled" style="font-size:18px">
              {carteIdentite.hasFrontImage ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            Recto
          </div>
          <div class="flex items-center gap-2 text-sm {carteIdentite.hasBackImage ? 'text-emerald-600' : 'text-slate-400'}">
            <span class="material-symbols-outlined icon-filled" style="font-size:18px">
              {carteIdentite.hasBackImage ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            Verso
          </div>
        </div>

      {:else if carteIdentite.status === 'rejected'}
        <!-- Rejeté -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:28px">cancel</span>
          </div>
          <div class="flex-1">
            <p class="font-bold text-red-800 mb-1">Document rejeté</p>
            <p class="text-sm text-red-700">Votre document n'a pas pu être accepté. Veuillez en soumettre un nouveau.</p>
            {#if carteIdentite.submittedAt}
              <p class="text-xs text-slate-400 mt-1.5">
                Soumis le {new Date(carteIdentite.submittedAt).toLocaleDateString('fr-CM', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            {/if}
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-semibold shrink-0">
            <span class="material-symbols-outlined icon-filled" style="font-size:14px">cancel</span>
            Rejeté
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Informations -->
  <div class="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
    <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
      <span class="material-symbols-outlined text-orange-500 icon-filled" style="font-size:20px">info</span>
      Documents acceptés
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each Object.entries(labelType) as [, nom]}
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size:18px">badge</span>
          <span class="text-sm text-slate-700 font-medium">{nom}</span>
        </div>
      {/each}
    </div>
    <div class="mt-4 flex items-start gap-2 text-xs text-slate-400">
      <span class="material-symbols-outlined shrink-0" style="font-size:14px">info</span>
      Formats acceptés : JPG, PNG, PDF · Taille maximale : 5 Mo par fichier
    </div>
  </div>

{/if}

<!-- Modal : Soumettre un document -->
{#if modalOuverte}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)">

      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 class="font-bold text-slate-900">
            {carteIdentite ? 'Mettre à jour le document' : 'Soumettre un document'}
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Formats : JPG, PNG, PDF · Max 5 Mo</p>
        </div>
        <button onclick={fermerModal}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>

      <form onsubmit={soumettre} class="p-6 space-y-5">

        {#if carteIdentite?.status === 'pending'}
          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <span class="material-symbols-outlined text-amber-500 icon-filled shrink-0 mt-0.5" style="font-size:16px">warning</span>
            <p class="text-xs text-amber-700">
              Un document est déjà en attente de vérification. En soumettant à nouveau, vous remplacez l'ancien.
            </p>
          </div>
        {/if}

        <!-- Type de document -->
        <div>
          <p class="text-xs font-semibold text-slate-600 mb-2">Type de document *</p>
          <div class="grid grid-cols-2 gap-2">
            {#each Object.entries(labelType) as [val, nom]}
              <label class="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all
                {typeDocument === val ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}">
                <input type="radio" bind:group={typeDocument} value={val} class="accent-orange-500 shrink-0" />
                <span class="text-sm font-medium text-slate-700 leading-snug">{nom}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- Recto -->
        <div>
          <p class="text-xs font-semibold text-slate-600 mb-2">Face recto *</p>
          {#if frontPreview}
            <div class="relative rounded-xl overflow-hidden border border-slate-200 mb-2" style="max-height:180px">
              {#if frontFile?.type === 'application/pdf'}
                <div class="flex items-center gap-3 p-4 bg-red-50">
                  <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:26px">picture_as_pdf</span>
                  <div>
                    <p class="text-sm font-semibold text-slate-800">{frontFile.name}</p>
                    <p class="text-xs text-slate-400">{(frontFile.size / 1024).toFixed(0)} Ko</p>
                  </div>
                </div>
              {:else}
                <img src={frontPreview} alt="Recto" class="w-full object-cover" style="max-height:180px" />
              {/if}
              <button type="button" onclick={() => { frontFile = null; frontPreview = null }}
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <span class="material-symbols-outlined" style="font-size:12px">close</span>
              </button>
            </div>
          {/if}
          <label class="flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
            {frontPreview ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}">
            <span class="material-symbols-outlined text-slate-400" style="font-size:24px">add_photo_alternate</span>
            <p class="text-sm font-medium text-slate-600">{frontPreview ? 'Remplacer le recto' : 'Sélectionner le recto'}</p>
            <input type="file" accept="image/*,application/pdf" class="hidden" onchange={(e) => choisirFichier(e, 'front')} />
          </label>
        </div>

        <!-- Verso -->
        <div>
          <p class="text-xs font-semibold text-slate-600 mb-2">Face verso *</p>
          {#if backPreview}
            <div class="relative rounded-xl overflow-hidden border border-slate-200 mb-2" style="max-height:180px">
              {#if backFile?.type === 'application/pdf'}
                <div class="flex items-center gap-3 p-4 bg-red-50">
                  <span class="material-symbols-outlined text-red-500 icon-filled" style="font-size:26px">picture_as_pdf</span>
                  <div>
                    <p class="text-sm font-semibold text-slate-800">{backFile.name}</p>
                    <p class="text-xs text-slate-400">{(backFile.size / 1024).toFixed(0)} Ko</p>
                  </div>
                </div>
              {:else}
                <img src={backPreview} alt="Verso" class="w-full object-cover" style="max-height:180px" />
              {/if}
              <button type="button" onclick={() => { backFile = null; backPreview = null }}
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <span class="material-symbols-outlined" style="font-size:12px">close</span>
              </button>
            </div>
          {/if}
          <label class="flex flex-col items-center gap-2 py-5 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
            {backPreview ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}">
            <span class="material-symbols-outlined text-slate-400" style="font-size:24px">add_photo_alternate</span>
            <p class="text-sm font-medium text-slate-600">{backPreview ? 'Remplacer le verso' : 'Sélectionner le verso'}</p>
            <input type="file" accept="image/*,application/pdf" class="hidden" onchange={(e) => choisirFichier(e, 'back')} />
          </label>
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button" onclick={fermerModal} class="btn-secondary flex-1 justify-center">
            Annuler
          </button>
          <button type="submit" disabled={envoi || !frontPreview || !backPreview}
            class="btn-primary flex-1 justify-center">
            {#if envoi}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Envoi...
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">upload</span>
              Soumettre
            {/if}
          </button>
        </div>

      </form>
    </div>
  </div>
{/if}
