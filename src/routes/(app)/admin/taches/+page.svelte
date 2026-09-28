<script lang="ts">
  import { untrack } from 'svelte'
  import api from '$lib/api'
  import { auth } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'

  let taches = $state<any[]>([])
  let meta = $state<any>(null)
  let chargement = $state(true)
  let page = $state(1)
  let filtreStatut = $state('')
  let filtrePriorite = $state('')

  let afficherForm = $state(false)
  let tacheEditee = $state<any>(null)
  let envoi = $state(false)
  let suppressionEnCours = $state('')
  let erreurForm = $state('')

  // Liste des admins (super_admin uniquement)
  let admins = $state<any[]>([])

  const isSuperAdmin = $derived(auth.user?.role === 'super_admin')

  let form = $state({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'todo',
    assignedTo: '',
  })

  const statuts = [
    { val: '', label: 'Tous' },
    { val: 'todo', label: 'À faire' },
    { val: 'in_progress', label: 'En cours' },
    { val: 'done', label: 'Terminé' },
    { val: 'cancelled', label: 'Annulé' },
  ]

  const priorites = [
    { val: '', label: 'Toutes' },
    { val: 'low', label: 'Faible' },
    { val: 'medium', label: 'Moyenne' },
    { val: 'high', label: 'Haute' },
    { val: 'urgent', label: 'Urgente' },
  ]

  const configStatut: Record<string, { label: string; classe: string; icone: string }> = {
    todo:        { label: 'À faire',  classe: 'bg-slate-100 text-slate-600 border-slate-200',       icone: 'radio_button_unchecked' },
    in_progress: { label: 'En cours', classe: 'bg-blue-100 text-blue-700 border-blue-200',          icone: 'pending' },
    done:        { label: 'Terminé',  classe: 'bg-emerald-100 text-emerald-700 border-emerald-200', icone: 'check_circle' },
    cancelled:   { label: 'Annulé',   classe: 'bg-slate-100 text-slate-400 border-slate-200',       icone: 'cancel' },
  }

  const configPriorite: Record<string, { label: string; classe: string }> = {
    low:    { label: 'Faible',  classe: 'bg-slate-100 text-slate-500' },
    medium: { label: 'Moyenne', classe: 'bg-amber-100 text-amber-700' },
    high:   { label: 'Haute',   classe: 'bg-red-100 text-red-700' },
    urgent: { label: 'Urgente', classe: 'bg-red-600 text-white' },
  }

  function formaterDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-CM', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function charger() {
    chargement = true
    try {
      const params: any = { page, per_page: 20 }
      if (filtreStatut) params.status = filtreStatut
      if (filtrePriorite) params.priority = filtrePriorite
      const res = await api.get('/admin/tasks', { params })
      taches = res.data?.data ?? []
      meta = res.data?.meta ?? null
    } catch { toast.erreur('Erreur', 'Impossible de charger les tâches') }
    finally { chargement = false }
  }

  async function chargerAdmins() {
    if (!isSuperAdmin) return
    try {
      const res = await api.get('/admin/team')
      admins = (res.data?.data ?? []).filter((a: any) => a.role !== 'cabin')
    } catch {}
  }

  function ouvrirCreation() {
    tacheEditee = null
    erreurForm = ''
    form = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      priority: 'medium',
      status: 'todo',
      assignedTo: isSuperAdmin ? (auth.user?.id ?? '') : '',
    }
    afficherForm = true
  }

  function ouvrirEdition(t: any) {
    tacheEditee = t
    erreurForm = ''
    form = {
      title: t.title ?? '',
      description: t.description ?? '',
      startDate: t.startDate?.slice(0, 10) ?? '',
      endDate: t.endDate?.slice(0, 10) ?? '',
      priority: t.priority ?? 'medium',
      status: t.status ?? 'todo',
      assignedTo: t.assignedTo ?? '',
    }
    afficherForm = true
  }

  async function sauvegarder(e: Event) {
    e.preventDefault()
    erreurForm = ''
    if (!form.startDate || !form.endDate) {
      erreurForm = 'Les dates de début et d\'échéance sont obligatoires.'
      return
    }
    if (form.endDate < form.startDate) {
      erreurForm = 'L\'échéance doit être postérieure ou égale à la date de début.'
      return
    }
    envoi = true
    try {
      const payload: any = {
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate,
        priority: form.priority,
      }
      if (form.description.trim()) payload.description = form.description.trim()
      if (tacheEditee) payload.status = form.status
      if (isSuperAdmin) payload.assignedTo = form.assignedTo

      if (tacheEditee) {
        await api.put(`/admin/tasks/${tacheEditee.id}`, payload)
        toast.succes('Tâche mise à jour')
      } else {
        await api.post('/admin/tasks', payload)
        toast.succes('Tâche créée')
      }
      afficherForm = false
      await charger()
    } catch (e: any) {
      const erreurs422 = e.response?.data?.errors
      if (e.response?.status === 422 && Array.isArray(erreurs422) && erreurs422.length) {
        erreurForm = erreurs422.map((x: any) => x.message).join(' ')
      } else {
        toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de sauvegarder')
      }
    } finally { envoi = false }
  }

  async function changerStatut(id: string, status: string) {
    try {
      await api.put(`/admin/tasks/${id}`, { status })
      taches = taches.map(t => t.id === id ? { ...t, status } : t)
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de mettre à jour')
    }
  }

  async function supprimer(id: string) {
    suppressionEnCours = id
    try {
      await api.delete(`/admin/tasks/${id}`)
      toast.succes('Tâche supprimée')
      taches = taches.filter(t => t.id !== id)
    } catch (e: any) {
      toast.erreur('Erreur', e.response?.data?.message ?? 'Impossible de supprimer')
    } finally { suppressionEnCours = '' }
  }

  $effect(() => { filtreStatut; filtrePriorite; page; charger() })
  $effect(() => { if (isSuperAdmin) untrack(chargerAdmins) })
</script>

<svelte:head><title>Tâches — TransfertCM Admin</title></svelte:head>

<div class="mb-6 flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 class="font-black text-2xl text-slate-900" style="letter-spacing:-0.02em">Tâches</h2>
    <p class="text-sm text-slate-500 mt-0.5">
      {meta ? `${meta.total ?? taches.length} tâche(s)` : isSuperAdmin ? 'Toutes les tâches' : 'Mes tâches assignées'}
    </p>
  </div>
  <button onclick={ouvrirCreation}
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
    style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
    <span class="material-symbols-outlined icon-filled" style="font-size:16px">add</span>
    Nouvelle tâche
  </button>
</div>

<!-- Filtres -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow p-4 mb-5 flex flex-wrap gap-4">
  <div class="flex gap-1.5 flex-wrap items-center">
    <span class="text-xs font-semibold text-slate-400 mr-1">Statut :</span>
    {#each statuts as s}
      <button onclick={() => { filtreStatut = s.val; page = 1 }}
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
          {filtreStatut === s.val ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
        {s.label}
      </button>
    {/each}
  </div>
  <div class="flex gap-1.5 flex-wrap items-center">
    <span class="text-xs font-semibold text-slate-400 mr-1">Priorité :</span>
    {#each priorites as p}
      <button onclick={() => { filtrePriorite = p.val; page = 1 }}
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
          {filtrePriorite === p.val ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
        {p.label}
      </button>
    {/each}
  </div>
</div>

<!-- Liste -->
<div class="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
  {#if chargement}
    <div class="p-5 space-y-2">{#each Array(6) as _}<div class="skeleton h-20 rounded-xl"></div>{/each}</div>
  {:else if taches.length === 0}
    <div class="py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
        <span class="material-symbols-outlined text-orange-400 icon-filled" style="font-size:28px">task_alt</span>
      </div>
      <p class="text-slate-600 font-semibold">Aucune tâche</p>
      <p class="text-slate-400 text-sm mt-1">
        {isSuperAdmin ? 'Créez une tâche pour commencer' : 'Aucune tâche ne vous est assignée'}
      </p>
    </div>
  {:else}
    <div class="divide-y divide-slate-50">
      {#each taches as t}
        {@const cfgS = configStatut[t.status] ?? configStatut.todo}
        {@const cfgP = configPriorite[t.priority] ?? configPriorite.medium}
        <div class="px-5 py-4 hover:bg-slate-50 transition-all">
          <div class="flex items-start gap-3">
            <!-- Icone statut cliquable -->
            <button
              onclick={() => changerStatut(t.id, t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo')}
              class="mt-0.5 shrink-0 text-slate-400 hover:text-orange-500 transition-colors"
              title="Changer le statut">
              <span class="material-symbols-outlined icon-filled" style="font-size:20px">{cfgS.icone}</span>
            </button>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <p class="text-sm font-bold text-slate-900 {t.status === 'done' || t.status === 'cancelled' ? 'line-through text-slate-400' : ''}">
                  {t.title}
                </p>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full border {cfgS.classe}">{cfgS.label}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full {cfgP.classe}">{cfgP.label}</span>
              </div>
              {#if t.description}
                <p class="text-xs text-slate-500 line-clamp-2 mb-2">{t.description}</p>
              {/if}
              <div class="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                {#if t.startDate}
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>
                    {formaterDate(t.startDate)}
                  </span>
                {/if}
                {#if t.endDate}
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined" style="font-size:12px">event</span>
                    Échéance : {formaterDate(t.endDate)}
                  </span>
                {/if}
                <!-- Assigné à (visible pour super_admin) -->
                {#if isSuperAdmin && t.assignedToName}
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined" style="font-size:12px">person</span>
                    {t.assignedToName}
                  </span>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick={() => ouvrirEdition(t)}
                class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <span class="material-symbols-outlined" style="font-size:16px">edit</span>
              </button>
              {#if isSuperAdmin}
                <button onclick={() => supprimer(t.id)} disabled={suppressionEnCours === t.id}
                  class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 disabled:opacity-40">
                  {#if suppressionEnCours === t.id}
                    <span class="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></span>
                  {:else}
                    <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                  {/if}
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if meta && meta.lastPage > 1}
      <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
        <p class="text-sm text-slate-500">Page {meta.currentPage} sur {meta.lastPage}</p>
        <div class="flex gap-2">
          <button onclick={() => page--} disabled={page <= 1}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            ← Précédent
          </button>
          <button onclick={() => page++} disabled={page >= meta.lastPage}
            class="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Suivant →
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal : Créer / Modifier -->
{#if afficherForm}
  <div class="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
    <div class="bg-white rounded-2xl w-full max-w-lg pointer-events-auto animate-fade-in-up max-h-[90vh] overflow-y-auto"
      style="box-shadow:0 25px 60px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.10)">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 class="font-bold text-slate-900">{tacheEditee ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
        <button onclick={() => afficherForm = false}
          class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <form onsubmit={sauvegarder} class="p-6 space-y-4">

        <div>
          <label for="titre-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Titre *</label>
          <input id="titre-tache" type="text" bind:value={form.title} required
            placeholder="Ex: Vérifier les commandes en attente"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>

        <div>
          <label for="desc-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
          <textarea id="desc-tache" bind:value={form.description} rows="3"
            placeholder="Décrivez la tâche..."
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="debut-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Date début *</label>
            <input id="debut-tache" type="date" bind:value={form.startDate} required
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label for="fin-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Échéance *</label>
            <input id="fin-tache" type="date" bind:value={form.endDate} required min={form.startDate || undefined}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        <div>
          <label for="priorite-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Priorité</label>
          <select id="priorite-tache" bind:value={form.priority}
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>

        {#if tacheEditee}
          <div>
            <label for="statut-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Statut</label>
            <select id="statut-tache" bind:value={form.status}
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              {#each statuts.filter(s => s.val) as s}
                <option value={s.val}>{s.label}</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Assignation : dropdown pour super_admin, affichage du nom pour les autres -->
        {#if isSuperAdmin}
          <div>
            <label for="assigne-tache" class="block text-xs font-semibold text-slate-600 mb-1.5">Assigné à *</label>
            <select id="assigne-tache" bind:value={form.assignedTo} required
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— Choisir un admin —</option>
              {#each admins as a}
                <option value={a.id}>{a.full_name || a.fullName || a.email}</option>
              {/each}
            </select>
          </div>
        {:else}
          <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span class="material-symbols-outlined text-slate-400 icon-filled" style="font-size:16px">person</span>
            <div>
              <p class="text-xs text-slate-400">Assigné à</p>
              <p class="text-sm font-semibold text-slate-700">
                {auth.user?.fullName || auth.user?.email || 'Vous'}
              </p>
            </div>
          </div>
        {/if}

        {#if erreurForm}
          <p class="text-red-500 text-xs">{erreurForm}</p>
        {/if}

        <div class="flex gap-3 pt-1">
          <button type="button" onclick={() => afficherForm = false}
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
            Annuler
          </button>
          <button type="submit" disabled={envoi || !form.title || !form.startDate || !form.endDate || (isSuperAdmin && !form.assignedTo)}
            class="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style="background:linear-gradient(135deg, #007A5E 0%, #00A878 100%)">
            {#if envoi}
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {:else}
              <span class="material-symbols-outlined icon-filled" style="font-size:16px">save</span>
            {/if}
            {tacheEditee ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
