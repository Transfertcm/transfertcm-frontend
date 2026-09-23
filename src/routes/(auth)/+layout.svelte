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
  <div class="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden bg-slate-50 panneau">

    <!-- Halos de fond -->
    <div class="halo h1"></div>
    <div class="halo h2"></div>

    <!-- Logo -->
    <div class="flex items-center gap-3 relative bloc-logo">
      <img src="/branding/app_icon.svg" alt="" width="40" height="40" class="w-10 h-10 rounded-xl shrink-0" />
      <div>
        <p class="font-black text-slate-900 text-base leading-none" style="letter-spacing:-0.02em">TransfertCM</p>
        <p class="text-xs font-semibold mt-0.5" style="color:#007A5E">Crédit, forfaits et mobile money</p>
      </div>
    </div>

    <!-- Headline + visuel -->
    <div class="relative">
      <h1 class="font-black text-slate-900 leading-[1.05] mb-12 bloc-titre" style="font-size:clamp(2.4rem,4vw,3.4rem); letter-spacing:-0.03em">
        {$t('auth.layout.title')}<br/>
        <span class="text-slate-400 font-light" style="font-size:0.75em">{$t('auth.layout.subtitle')}</span>
      </h1>

      <!-- Cartes flottantes -->
      <div class="relative h-[26rem] cartes">

        <!-- Commande crédit MTN -->
        <div class="absolute left-0 top-6 w-72 bg-white rounded-2xl p-5 border border-slate-100 carte"
          style="box-shadow:0 8px 30px rgba(0,0,0,0.08)">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2.5">
              <img src="/logos/mtn.png" alt="MTN" width="32" height="32" class="w-8 h-8 rounded-lg shrink-0" />
              <div>
                <p class="text-xs font-bold text-slate-800">Crédit MTN</p>
                <p class="text-xs text-slate-400">Aujourd'hui {dateString}, {timeString}</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Complétée</span>
          </div>
          <p class="font-black text-2xl text-slate-900" style="letter-spacing:-0.03em">1 000 XAF</p>
          <p class="text-xs text-slate-400 mt-1">vers +237 6XX XXX XXX</p>
        </div>

        <!-- Forfait Orange en cours -->
        <div class="absolute left-[15.5rem] top-0 w-60 bg-white rounded-2xl p-4 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:3deg">
          <div class="flex items-center gap-2 mb-3">
            <img src="/logos/orange.png" alt="Orange" width="24" height="24" class="w-6 h-6 rounded-full shrink-0" />
            <p class="text-xs font-bold text-slate-800">Forfait Orange</p>
          </div>
          <p class="font-black text-xl text-slate-900">2 500 XAF</p>
          <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full w-3/4 rounded-full jauge" style="background:linear-gradient(90deg,#007A5E,#00A878)"></div>
          </div>
          <p class="text-xs text-slate-400 mt-1.5">En cours de traitement</p>
        </div>

        <!-- Solde du portefeuille -->
        <div class="absolute left-2 top-[11.5rem] w-56 rounded-2xl p-4 carte"
          style="background:linear-gradient(135deg,#007A5E 0%,#00A878 100%); box-shadow:0 10px 30px -8px rgba(0,122,94,.45); --rot:-2deg">
          <p class="text-[11px] text-white/85 font-medium">Solde du portefeuille</p>
          <p class="font-black text-2xl text-white mt-1" style="letter-spacing:-0.04em; font-variant-numeric:tabular-nums">45 200 XAF</p>
          <div class="flex gap-1.5 mt-3 pt-2.5 border-t border-white/20">
            {#each [['add','Recharger'],['swap_horiz','Transférer']] as [ic, lb]}
              <span class="flex-1 flex items-center gap-1 text-[10px] font-semibold text-white/95">
                <span class="material-symbols-outlined" style="font-size:13px">{ic}</span>{lb}
              </span>
            {/each}
          </div>
        </div>

        <!-- Disponibilité -->
        <div class="absolute right-0 top-[7.5rem] bg-white rounded-2xl p-4 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06)">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-symbols-outlined icon-filled text-emerald-500" style="font-size:16px">trending_up</span>
            <p class="text-xs font-bold text-slate-800">{$t('auth.layout.stats.available')}</p>
          </div>
          <p class="font-black text-2xl text-slate-900">24/7</p>
          <p class="text-xs text-slate-400">Disponible</p>
        </div>

        <!-- Commande crédit, numéro personnel -->
        <div class="absolute left-[14rem] top-[10rem] w-60 bg-white rounded-2xl p-3.5 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:2deg">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img src="/logos/mtn.png" alt="MTN" width="18" height="18" class="w-[18px] h-[18px] rounded-full shrink-0" />
              <p class="text-xs font-semibold text-slate-700">Crédit · Mon numéro</p>
            </div>
            <p class="text-sm font-black text-slate-900">500 XAF</p>
          </div>
          <div class="flex items-center gap-1 mt-2">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 pastille"></span>
            <p class="text-[11px] text-slate-400">En cours</p>
          </div>
        </div>

        <!-- Frais de service -->
        <div class="absolute left-0 top-[19.5rem] bg-white rounded-2xl px-4 py-3 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:-3deg">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined icon-filled" style="font-size:15px; color:#007A5E">payments</span>
            <div>
              <p class="text-xs font-bold text-slate-800">20 XAF</p>
              <p class="text-[10px] text-slate-400">Frais par commande</p>
            </div>
          </div>
        </div>

        <!-- Deux réseaux -->
        <div class="absolute left-[11rem] top-[20.5rem] bg-white rounded-2xl px-4 py-3 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:2deg">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Réseaux</p>
          <div class="flex items-center gap-2">
            <img src="/logos/mtn.png" alt="MTN" width="22" height="22" class="w-[22px] h-[22px] rounded-full" />
            <img src="/logos/orange.png" alt="Orange" width="22" height="22" class="w-[22px] h-[22px] rounded-full" />
            <p class="text-xs font-bold text-slate-700 ml-0.5">MTN · Orange</p>
          </div>
        </div>

        <!-- Forfait internet -->
        <div class="absolute right-2 top-[17.5rem] w-52 bg-white rounded-2xl p-3.5 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:-2deg">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined icon-filled" style="font-size:15px; color:#007A5E">wifi</span>
            <p class="text-xs font-bold text-slate-800">Forfait internet</p>
          </div>
          <p class="text-[11px] text-slate-400">Internet, Minuit &amp; Appels</p>
        </div>

        <!-- Notification de commande -->
        <div class="absolute right-1 top-0 w-52 bg-white rounded-2xl p-3.5 border border-slate-100 carte"
          style="box-shadow:0 4px 16px rgba(0,0,0,0.06); --rot:3deg">
          <div class="flex items-start gap-2">
            <span class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined icon-filled text-emerald-500" style="font-size:15px">check_circle</span>
            </span>
            <div class="min-w-0">
              <p class="text-[11px] font-bold text-slate-800 leading-tight">Commande exécutée</p>
              <p class="text-[10px] text-slate-400 mt-0.5">CMD-4821 · il y a 2 min</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer gauche -->
    <p class="text-xs text-slate-400 relative bloc-pied">© {new Date().getFullYear()} TransfertCM · Tous droits réservés</p>
  </div>

  <!-- Panneau droit — formulaire -->
  <div class="flex-1 flex flex-col items-center justify-center px-8 py-12">
    <div class="w-full max-w-[380px]">

      <!-- Logo mobile -->
      <div class="lg:hidden flex items-center gap-3 mb-10">
        <img src="/branding/app_icon.svg" alt="" width="36" height="36" class="w-9 h-9 rounded-xl" />
        <div>
          <p class="font-black text-slate-900 text-base leading-none">TransfertCM</p>
          <p class="text-xs font-semibold mt-0.5" style="color:#007A5E">Crédit, forfaits et mobile money</p>
        </div>
      </div>

      {@render children()}
    </div>
  </div>
</div>

<style>
  /* ---------- Panneau gauche ---------- */
  .panneau{
    background:
      radial-gradient(circle at 15% 12%, rgba(0,168,120,.08), transparent 45%),
      radial-gradient(circle at 85% 85%, rgba(0,122,94,.07), transparent 45%),
      #F8FAFC;
  }
  /* Deux halos qui dérivent lentement : le fond respire sans distraire. */
  .halo{position:absolute; border-radius:50%; pointer-events:none; filter:blur(8px);}
  .halo.h1{
    width:420px; height:420px; right:-130px; top:-120px;
    background:radial-gradient(circle, rgba(0,168,120,.16), transparent 70%);
    animation:derive 17s ease-in-out infinite;
  }
  .halo.h2{
    width:340px; height:340px; left:-120px; bottom:-110px;
    background:radial-gradient(circle, rgba(0,122,94,.13), transparent 70%);
    animation:derive 21s ease-in-out infinite reverse;
  }
  @keyframes derive{
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(24px,-20px) scale(1.14);}
  }

  /* Entrée du panneau : logo, titre, cartes, pied. */
  @keyframes monte{ from{opacity:0; transform:translateY(20px);} to{opacity:1; transform:translateY(0);} }
  .bloc-logo{animation:monte .6s cubic-bezier(.16,1,.3,1) both;}
  .bloc-titre{animation:monte .7s cubic-bezier(.16,1,.3,1) .1s both;}
  .bloc-pied{animation:monte .6s cubic-bezier(.16,1,.3,1) .5s both;}

  /* Chaque carte arrive à sa place puis flotte, avec sa propre rotation. */
  @keyframes entreCarte{
    from{opacity:0; transform:translateY(26px) rotate(var(--rot,0deg)) scale(.94);}
    to{opacity:1; transform:translateY(0) rotate(var(--rot,0deg)) scale(1);}
  }
  @keyframes flotte{
    0%,100%{transform:translateY(0) rotate(var(--rot,0deg));}
    50%{transform:translateY(-11px) rotate(var(--rot,0deg));}
  }
  .carte{
    animation:
      entreCarte .75s cubic-bezier(.16,1,.3,1) var(--delai,.2s) both,
      flotte var(--duree,6s) ease-in-out var(--flot,1s) infinite;
    transition:box-shadow .25s ease;
  }
  /* Durées et décalages volontairement tous différents : sans cela les neuf
     cartes montent et descendent à l'unisson, ce qui fait bloc. */
  .cartes .carte:nth-child(1){--delai:.24s; --duree:6.0s; --flot:0.8s;}
  .cartes .carte:nth-child(2){--delai:.32s; --duree:7.5s; --flot:1.3s;}
  .cartes .carte:nth-child(3){--delai:.40s; --duree:6.6s; --flot:1.9s;}
  .cartes .carte:nth-child(4){--delai:.48s; --duree:8.2s; --flot:1.1s;}
  .cartes .carte:nth-child(5){--delai:.56s; --duree:7.0s; --flot:2.4s;}
  .cartes .carte:nth-child(6){--delai:.64s; --duree:6.3s; --flot:1.6s;}
  .cartes .carte:nth-child(7){--delai:.72s; --duree:7.8s; --flot:2.1s;}
  .cartes .carte:nth-child(8){--delai:.80s; --duree:6.9s; --flot:0.6s;}
  .cartes .carte:nth-child(9){--delai:.88s; --duree:8.5s; --flot:2.7s;}

  /* La carte survolée passe au premier plan et se stabilise. */
  .carte:hover{animation-play-state:paused; z-index:20;}

  /* Pastille « en cours » qui bat. */
  @keyframes bat{ 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:.45; transform:scale(.82);} }
  .pastille{animation:bat 1.8s ease-in-out infinite;}
  .carte:hover{box-shadow:0 16px 40px rgba(0,0,0,.14) !important;}

  /* La jauge de progression se remplit une fois la carte posée. */
  @keyframes remplit{ from{transform:scaleX(0);} to{transform:scaleX(1);} }
  .jauge{transform-origin:left; animation:remplit 1.1s cubic-bezier(.16,1,.3,1) .9s both;}

  @media (prefers-reduced-motion: reduce){
    .halo, .bloc-logo, .bloc-titre, .bloc-pied, .carte, .jauge, .pastille{
      animation:none !important; opacity:1 !important;
    }
    .carte{transform:rotate(var(--rot,0deg)) !important;}
    .jauge{transform:scaleX(1) !important;}
  }
</style>
