<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import api from '$lib/api'
  import apiCabin from '$lib/api-cabin'
  import { auth } from '$lib/stores/auth.svelte'
  import { cabinAuth } from '$lib/stores/cabin-auth.svelte'
  import { toast } from '$lib/stores/toast.svelte'
  import { t, translate } from '$lib/stores/locale'

  type Tab = 'admin' | 'cabin'

  // Dérivé directement depuis l'URL — toujours synchronisé, pas de race condition
  const onglet = $derived<Tab>($page.url.searchParams.get('espace') === 'cabin' ? 'cabin' : 'admin')

  function signalerErreur(err: any) {
    const data = err.response?.data
    if (err.response?.status === 422) {
      data?.errors?.forEach((e: any) => { erreurs[e.field] = e.message })
      return
    }
    if (err.toastAffiche) return
    toast.erreur(translate('toast.error'), data?.message ?? 'Email ou mot de passe incorrect.')
  }

  let email = $state('')
  let motDePasse = $state('')
  let chargement = $state(false)
  let afficherMotDePasse = $state(false)
  let erreurs = $state<Record<string, string>>({})

  onMount(() => {
    auth.init()
    cabinAuth.init()
    if (auth.isAuthenticated()) {
      goto('/admin/tableau-de-bord')
      return
    } else if (cabinAuth.isAuthenticated()) {
      goto('/cabine/tableau-de-bord')
      return
    }
    const authError = sessionStorage.getItem('tcm_auth_error')
    if (authError) {
      sessionStorage.removeItem('tcm_auth_error')
      toast.erreur('Vous avez été déconnecté', authError)
    }
  })

  async function seConnecter(e: Event) {
    e.preventDefault()
    erreurs = {}
    chargement = true
    try {
      if (onglet === 'admin') {
        await connexionAdmin()
      } else {
        await connexionCabin()
      }
    } finally {
      chargement = false
    }
  }

  async function connexionAdmin() {
    try {
      const res = await api.post('/auth/login', { email, password: motDePasse })
      const payload = res.data?.data ?? res.data
      if (!payload?.user || !payload?.token) {
        toast.erreur(translate('toast.error'), translate('auth.login.unexpected_response'))
        return
      }
      const { user, token } = payload
      auth.login(
        {
          id: user.id,
          email: user.email,
          fullName: user.full_name ?? user.fullName ?? null,
          role: user.role ?? 'admin',
          initials: user.initials ?? (user.fullName ?? user.full_name ?? user.email ?? '?').slice(0, 2).toUpperCase(),
        },
        token
      )
      toast.succes(translate('toast.success'), translate('auth.login.welcome'))
      goto('/admin/tableau-de-bord')
    } catch (err: any) {
      signalerErreur(err)
    }
  }

  async function connexionCabin() {
    try {
      const res = await apiCabin.post('/cabin/auth/login', { email, password: motDePasse })
      const payload = res.data?.data ?? res.data
      if (!payload?.user || !payload?.token) {
        toast.erreur(translate('toast.error'), translate('auth.login.unexpected_response'))
        return
      }
      const { user, token } = payload
      cabinAuth.login(
        {
          id: user.id,
          email: user.email,
          cabinName: user.cabin?.name ?? user.cabinName ?? 'Ma Cabine',
          managerName: user.full_name ?? user.fullName ?? null,
          type: user.cabin?.type ?? 'standard',
          status: user.cabin?.status ?? 'active',
          uvBalance: user.cabin?.uv_balance ?? user.cabin?.uvBalance ?? 0,
          dailyOrdersCount: user.cabin?.daily_orders_count ?? 0,
          maxDailyOrders: user.cabin?.max_daily_orders ?? 50,
          mtnNumber: user.cabin?.mtn_number ?? null,
          orangeNumber: user.cabin?.orange_number ?? null,
          city: user.cabin?.city ?? null,
        },
        token
      )
      toast.succes(translate('toast.success'), translate('auth.login.welcome'))
      goto('/cabine/tableau-de-bord')
    } catch (err: any) {
      signalerErreur(err)
    }
  }
</script>

<svelte:head>
  <title>{onglet === 'admin' ? 'Espace Admin' : 'Espace Cabine'} — TransfertCM</title>
</svelte:head>

<!-- Titre -->
<h2 class="font-black text-slate-900 mb-1 animate-fade-in-up" style="font-size:2rem; letter-spacing:-0.03em">
  Se connecter
</h2>
<p class="text-slate-400 text-sm mb-8 animate-fade-in-up" style="animation-delay:.08s">{$t('auth.login.description')}</p>

<form onsubmit={seConnecter} class="space-y-5 stagger">

  <!-- Email -->
  <div>
    <label class="block text-sm font-semibold text-slate-700 mb-2" for="email">
      {$t('auth.login.email_label')}
    </label>
    <input
      id="email"
      type="email"
      bind:value={email}
      placeholder={onglet === 'admin' ? 'admin@transfertcm.com' : 'gerantcabine@gmail.com'}
      required
      autocomplete="email"
      class="w-full px-4 py-3.5 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none
        {erreurs.email
          ? 'border-red-300 bg-red-50 focus:border-red-400'
          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400'}"
    />
    {#if erreurs.email}
      <p class="text-red-500 text-xs mt-1.5">{erreurs.email}</p>
    {/if}
  </div>

  <!-- Mot de passe -->
  <div>
    <label class="block text-sm font-semibold text-slate-700 mb-2" for="motdepasse">
      {$t('auth.login.password_label')}
    </label>
    <div class="relative">
      <input
        id="motdepasse"
        type={afficherMotDePasse ? 'text' : 'password'}
        bind:value={motDePasse}
        placeholder={$t('auth.login.password_placeholder')}
        required
        autocomplete="current-password"
        class="w-full px-4 py-3.5 pr-12 rounded-xl border text-slate-900 text-sm transition-all focus:outline-none
          {erreurs.password
            ? 'border-red-300 bg-red-50 focus:border-red-400'
            : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400'}"
      />
      <button
        type="button"
        onclick={() => afficherMotDePasse = !afficherMotDePasse}
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={$t('auth.login.password_toggle')}
      >
        <span class="material-symbols-outlined" style="font-size:18px">
          {afficherMotDePasse ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
    {#if erreurs.password}
      <p class="text-red-500 text-xs mt-1.5">{erreurs.password}</p>
    {/if}
  </div>

  <!-- Bouton -->
  <button
    type="submit"
    disabled={chargement || !email || !motDePasse}
    class="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-all press-scale disabled:opacity-50 disabled:cursor-not-allowed"
    style="background: {!chargement && email && motDePasse
      ? (onglet === 'admin'
          ? 'linear-gradient(135deg, #007A5E 0%, #00A878 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)')
      : '#e2e8f0'}; color: {!chargement && email && motDePasse ? 'white' : '#94a3b8'};
      box-shadow: {!chargement && email && motDePasse
        ? (onglet === 'admin' ? '0 4px 14px rgba(0,122,94,0.3)' : '0 4px 14px rgba(15,23,42,0.25)')
        : 'none'}"
  >
    {#if chargement}
      <span class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
      {$t('auth.login.loading')}
    {:else}
      Continuer
    {/if}
  </button>

</form>

<!-- Message rassurant -->
<div class="mt-8 pt-6 border-t border-slate-100 text-center">
  <p class="text-xs text-slate-400 leading-relaxed">
    {onglet === 'admin'
      ? 'Vous êtes bien sur l\'espace administrateur TransfertCM. Connectez-vous en toute sécurité.'
      : 'Vous êtes bien sur l\'espace gérant de cabine TransfertCM. Connectez-vous en toute sécurité.'}
  </p>
</div>
