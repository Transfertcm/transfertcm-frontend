<script lang="ts">
  import { t } from '$lib/stores/locale'
  import { onMount } from 'svelte'
  let { children } = $props()

   let dateString = $state<string>('')
  let timeString = $state<string>('')
  
  function updateDateTime() {
    const now = new Date()
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Africa/Douala',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Africa/Douala',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    dateString = now.toLocaleDateString('fr-CM', dateOptions)
    timeString = now.toLocaleTimeString('fr-CM', timeOptions)
  }
  
  onMount(() => {
    updateDateTime()
    const interval = setInterval(updateDateTime, 60000)
    return () => clearInterval(interval)
  })
</script>

<div class="min-h-screen flex bg-white">

  <!-- Panneau gauche — illustration -->
  <div class="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden bg-slate-50">

    <!-- Logo -->
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
      >
        <span class="material-symbols-outlined icon-filled text-white" style="font-size: 20px;">swap_horiz</span>
      </div>
      <div>
        <p class="font-black text-slate-900 text-base leading-none" style="letter-spacing:-0.02em">TransfertCM</p>
        <p class="text-orange-500 text-xs font-semibold mt-0.5">Mobile Money Cameroun</p>
      </div>
    </div>

    <!-- Headline + visuel -->
    <div class="relative">
      <h1 class="font-black text-slate-900 leading-[1.05] mb-12" style="font-size:clamp(2.4rem,4vw,3.4rem); letter-spacing:-0.03em">
        {$t('auth.layout.title')}<br/>
        <span class="text-slate-400 font-light" style="font-size:0.75em">{$t('auth.layout.subtitle')}</span>
      </h1>

      <!-- Cartes flottantes -->
      <div class="relative h-72">

        <!-- Carte principale -->
        <div
          class="absolute left-0 top-4 w-72 bg-white rounded-2xl p-5 border border-slate-100"
          style="box-shadow:0 8px 30px rgba(0,0,0,0.08)"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span class="material-symbols-outlined icon-filled text-amber-500" style="font-size:16px">swap_horiz</span>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-800">Transfert MTN</p>
                <p class="text-xs text-slate-400">Aujourd'hui {dateString}, {timeString}</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Complete</span>
          </div>
          <p class="font-black text-2xl text-slate-900" style="letter-spacing:-0.03em">15 000 XAF</p>
          <p class="text-xs text-slate-400 mt-1">vers +237 6XX XXX XXX</p>
        </div>

        <!-- Carte 2 -->
        <div
          class="absolute left-56 top-0 w-60 bg-white rounded-2xl p-4 border border-slate-100"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); transform:rotate(3deg)"
        >
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 rounded-full bg-orange-500 shrink-0"></div>
            <p class="text-xs font-bold text-slate-800">Orange Money</p>
          </div>
          <p class="font-black text-xl text-slate-900">5 000 XAF</p>
          <div class="mt-2 h-1.5 bg-slate-100 rounded-full"><div class="h-full w-3/4 rounded-full bg-orange-400"></div></div>
          <p class="text-xs text-slate-400 mt-1.5">En cours de traitement</p>
        </div>

        <!-- Carte 3 -->
        <div
          class="absolute left-16 top-44 w-64 bg-white rounded-2xl p-4 border border-slate-100"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); transform:rotate(-2deg)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
              <p class="text-xs font-semibold text-slate-700">MTN Mobile Money</p>
            </div>
            <p class="text-sm font-black text-slate-900">2 500 XAF</p>
          </div>
          <p class="text-xs text-slate-400 mt-2">Cabine Douala Centre #A1F4B</p>
        </div>

        <!-- Badge stat -->
        <div
          class="absolute right-0 top-32 bg-white rounded-2xl p-4 border border-slate-100"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06)"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="material-symbols-outlined icon-filled text-emerald-500" style="font-size:16px">trending_up</span>
            <p class="text-xs font-bold text-slate-800">{$t('auth.layout.stats.available')}</p>
          </div>
          <p class="font-black text-2xl text-slate-900">24/7</p>
          <p class="text-xs text-slate-400">Disponible</p>
        </div>

      </div>
    </div>

    <!-- Footer gauche -->
    <p class="text-xs text-slate-400">© {new Date().getFullYear()} TransfertCM · Tous droits reserves</p>
  </div>

  <!-- Panneau droit — formulaire -->
  <div class="flex-1 flex flex-col items-center justify-center px-8 py-12">
    <div class="w-full max-w-[380px]">

      <!-- Logo mobile -->
      <div class="lg:hidden flex items-center gap-3 mb-10">
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center"
          style="background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%)"
        >
          <span class="material-symbols-outlined icon-filled text-white" style="font-size: 18px;">swap_horiz</span>
        </div>
        <div>
          <p class="font-black text-slate-900 text-base leading-none">TransfertCM</p>
          <p class="text-orange-500 text-xs font-semibold mt-0.5">Mobile Money Cameroun</p>
        </div>
      </div>

      {@render children()}
    </div>
  </div>
</div>
