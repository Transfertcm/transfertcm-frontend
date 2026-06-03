<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'

  let scrollY = $state(0)

  onMount(() => {
    auth.init()
    if (auth.isAuthenticated()) { goto('/admin/tableau-de-bord'); return }

    // Reveal on scroll — optionnel, les éléments sont visibles par défaut
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  })
</script>

<svelte:head>
  <title>TransfertCM — Transfert Mobile Money au Cameroun</title>
  <meta name="description" content="Envoyez du crédit, des forfaits et de l'argent partout au Cameroun via MTN Mobile Money et Orange Money. Rapide, sécurisé, disponible 24h/24." />
</svelte:head>

<svelte:window bind:scrollY />

<div class="font-sans overflow-x-hidden" style="font-family:'Inter',sans-serif">

  <!-- ── NAV ── -->
  <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
    style="background:{scrollY > 40 ? 'rgba(255,255,255,0.95)' : 'transparent'};
           backdrop-filter:{scrollY > 40 ? 'blur(12px)' : 'none'};
           border-bottom:{scrollY > 40 ? '1px solid rgba(0,0,0,0.06)' : 'none'}">
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
          style="background:linear-gradient(135deg,#f97316,#fbbf24)">
          <span class="material-symbols-outlined icon-filled text-white" style="font-size:20px">swap_horiz</span>
        </div>
        <div>
          <p class="font-black text-base leading-none" style="color:{scrollY > 40 ? '#0f172a' : '#fff'}; letter-spacing:-0.02em">TransfertCM</p>
          <p class="text-xs font-medium" style="color:{scrollY > 40 ? '#f97316' : 'rgba(255,255,255,0.8)'}">Mobile Money Cameroun</p>
        </div>
      </a>
      <div class="hidden md:flex items-center gap-8 text-sm font-medium"
        style="color:{scrollY > 40 ? '#475569' : 'rgba(255,255,255,0.85)'}">
        <a href="#services" class="hover:text-orange-500 transition-colors">Services</a>
        <a href="#comment" class="hover:text-orange-500 transition-colors">Comment ça marche</a>
        <a href="#espaces" class="hover:text-orange-500 transition-colors">Accès plateforme</a>
      </div>
      <div class="flex items-center gap-2">
        <a href="/login" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style="color:{scrollY > 40 ? '#475569' : 'rgba(255,255,255,0.9)'}; background:{scrollY > 40 ? '#f1f5f9' : 'rgba(255,255,255,0.15)'}">
          Connexion
        </a>
      </div>
    </div>
  </nav>

  <!-- ── HERO ── -->
  <section class="relative min-h-screen flex items-center overflow-hidden"
    style="background:linear-gradient(135deg,#c2410c 0%,#ea580c 35%,#f97316 65%,#fb923c 100%)">

    <!-- Grille décorative -->
    <div class="absolute inset-0 opacity-10"
      style="background-image: linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 60px 60px"></div>

    <!-- Cercles flottants -->
    <div class="absolute top-20 right-16 w-64 h-64 rounded-full opacity-15 animate-pulse"
      style="background:radial-gradient(circle,#fbbf24,transparent); animation-duration:4s"></div>
    <div class="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-10"
      style="background:radial-gradient(circle,#fff,transparent)"></div>
    <div class="absolute top-1/2 right-1/3 w-32 h-32 rounded-full opacity-10 animate-pulse"
      style="background:radial-gradient(circle,#fbbf24,transparent); animation-duration:6s; animation-delay:2s"></div>

    <!-- Téléphone mockup décoratif -->
    <div class="absolute right-8 lg:right-24 top-1/2 -translate-y-1/2 hidden lg:block opacity-20"
      style="transform:translateY(-50%) rotate(8deg)">
      <div class="w-48 h-80 rounded-3xl border-4 border-white/40 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
        <div class="w-full h-3 rounded-full bg-white/30"></div>
        <div class="w-3/4 h-3 rounded-full bg-white/20"></div>
        <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mt-4">
          <span class="material-symbols-outlined icon-filled text-white" style="font-size:32px">swap_horiz</span>
        </div>
        <div class="w-full h-2 rounded-full bg-white/20"></div>
        <div class="w-2/3 h-2 rounded-full bg-white/15"></div>
        <div class="w-full h-10 rounded-xl bg-white/25 mt-2"></div>
      </div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-20 w-full">
      <div class="max-w-2xl">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3)">
          <span class="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
          <span class="text-xs font-bold text-white/90 uppercase tracking-widest">Disponible 24h/24 · 7j/7</span>
        </div>

        <h1 class="font-black text-white mb-6"
          style="font-size:clamp(2.8rem,8vw,6.5rem); letter-spacing:-0.03em; line-height:0.95">
          Envoyez de<br/>
          l'argent<br/>
          <span style="color:rgba(255,255,255,0.65); font-weight:300; font-style:italic; font-size:0.85em">
            en quelques secondes.
          </span>
        </h1>

        <p class="text-white/80 text-lg lg:text-xl leading-relaxed mb-10 max-w-lg">
          Crédit téléphonique, forfaits internet, transferts d'argent — partout au Cameroun via <strong class="text-white">MTN Mobile Money</strong> et <strong class="text-white">Orange Money</strong>.
        </p>

        <div class="flex flex-wrap gap-4 mb-16">
          <a href="#espaces"
            class="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white font-bold text-base transition-all hover:shadow-2xl hover:scale-[1.02]"
            style="color:#f97316; box-shadow:0 8px 30px rgba(0,0,0,0.2)">
            Accéder à la plateforme
            <span class="material-symbols-outlined icon-filled transition-transform group-hover:translate-x-1" style="font-size:20px">arrow_forward</span>
          </a>
          <a href="#comment"
            class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all hover:bg-white/10"
            style="border:2px solid rgba(255,255,255,0.35)">
            Comment ça marche
          </a>
        </div>

        <!-- Chiffres clés -->
        <div class="grid grid-cols-3 gap-4 max-w-md">
          {#each [
            { val: 'MTN', sub: 'Mobile Money', icone: 'signal_cellular_alt' },
            { val: 'Orange', sub: 'Money', icone: 'signal_cellular_alt' },
            { val: '20 XAF', sub: 'Frais fixes', icone: 'payments' },
          ] as s}
            <div class="p-4 rounded-2xl text-center"
              style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2)">
              <span class="material-symbols-outlined icon-filled text-amber-300 block mb-1" style="font-size:20px">{s.icone}</span>
              <p class="font-black text-white text-lg leading-none">{s.val}</p>
              <p class="text-white/60 text-xs mt-1">{s.sub}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Vague bas -->
    <div class="absolute bottom-0 left-0 right-0">
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0 80L1440 80L1440 20C1200 70 960 0 720 30C480 60 240 10 0 40L0 80Z" fill="white"/>
      </svg>
    </div>
  </section>

  <!-- ── MARQUEE ── -->
  <section class="bg-white py-5 overflow-hidden border-b border-slate-100">
    <div class="flex gap-10 whitespace-nowrap" style="animation:marquee 30s linear infinite">
      {#each Array(3) as _}
        {#each ['Transfert d\'argent', 'Crédit téléphonique', 'Forfaits internet', 'MTN MoMo', 'Orange Money', 'Paiement sécurisé', 'Cameroun', 'Rapide & Fiable'] as item}
          <span class="font-black text-2xl lg:text-4xl tracking-tight" style="color:#f1f5f9; letter-spacing:-0.02em">
            {item} <span style="color:#f97316">·</span>
          </span>
        {/each}
      {/each}
    </div>
  </section>

  <!-- ── SERVICES ── -->
  <section id="services" class="py-24 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color:#f97316">Nos services</p>
        <h2 class="font-black text-slate-900 mb-4" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em">
          Tout ce dont vous avez besoin
        </h2>
        <p class="text-slate-500 text-lg max-w-xl mx-auto">
          Une plateforme complète pour tous vos besoins en mobile money au Cameroun.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each [
          {
            icone: 'send_money',
            titre: 'Transfert d\'argent',
            desc: 'Envoyez de l\'argent instantanément vers n\'importe quel numéro MTN ou Orange au Cameroun. Sécurisé et traçable.',
            couleur: '#f97316',
            bg: '#fff7ed',
            tag: 'Le plus populaire',
          },
          {
            icone: 'signal_cellular_alt',
            titre: 'Crédit téléphonique',
            desc: 'Rechargez votre téléphone ou celui d\'un proche en quelques secondes. Tous les montants disponibles.',
            couleur: '#f59e0b',
            bg: '#fffbeb',
            tag: '',
          },
          {
            icone: 'wifi',
            titre: 'Forfaits internet',
            desc: 'Activez des forfaits data MTN ou Orange pour rester connecté. Large choix de durées et volumes.',
            couleur: '#10b981',
            bg: '#ecfdf5',
            tag: '',
          },
          {
            icone: 'account_balance_wallet',
            titre: 'Dépôt portefeuille',
            desc: 'Alimentez votre portefeuille TransfertCM pour des transactions encore plus rapides.',
            couleur: '#6366f1',
            bg: '#eef2ff',
            tag: '',
          },
          {
            icone: 'security',
            titre: 'Paiement sécurisé',
            desc: 'Chaque transaction est vérifiée et protégée par notre système anti-fraude intégré.',
            couleur: '#0ea5e9',
            bg: '#f0f9ff',
            tag: '',
          },
          {
            icone: 'support_agent',
            titre: 'Support dédié',
            desc: 'Une équipe d\'agents terrain disponibles pour vous accompagner dans chaque transaction.',
            couleur: '#ec4899',
            bg: '#fdf2f8',
            tag: '',
          },
        ] as svc, i}
          <div data-reveal class="group p-7 rounded-3xl border border-slate-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg relative"
            style="transition-delay:{i * 60}ms; background:white">
            {#if svc.tag}
              <span class="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style="background:{svc.couleur}">
                {svc.tag}
              </span>
            {/if}
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300"
              style="background:{svc.bg}">
              <span class="material-symbols-outlined icon-filled" style="font-size:26px; color:{svc.couleur}">{svc.icone}</span>
            </div>
            <h3 class="font-bold text-xl text-slate-900 mb-3" style="letter-spacing:-0.02em">{svc.titre}</h3>
            <p class="text-slate-500 text-sm leading-relaxed">{svc.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── POURQUOI NOUS ── -->
  <section class="py-24 px-6 lg:px-12 relative overflow-hidden"
    style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%)">
    <div class="absolute inset-0 opacity-5"
      style="background-image:radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 80% 50%, #fbbf24 0%, transparent 50%)"></div>

    <div class="max-w-7xl mx-auto relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div data-reveal>
          <p class="text-sm font-bold uppercase tracking-widest mb-4" style="color:#f97316">Pourquoi TransfertCM ?</p>
          <h2 class="font-black text-white mb-6" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em; line-height:1.05">
            La plateforme de confiance pour le mobile money au Cameroun
          </h2>
          <p class="text-slate-400 text-lg leading-relaxed mb-8">
            Nous connectons les clients avec des agents terrain vérifiés pour des transactions rapides, sécurisées et transparentes.
          </p>
          <div class="space-y-4">
            {#each [
              { titre: 'Agents vérifiés', desc: 'Chaque cabine est vérifiée et abonnée à notre plateforme avant d\'opérer.' },
              { titre: 'Frais transparents', desc: 'Seulement 20 XAF de frais fixes par transaction. Pas de surprise.' },
              { titre: 'Traçabilité complète', desc: 'Chaque transaction est enregistrée et consultable à tout moment.' },
            ] as item}
              <div class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style="background:linear-gradient(135deg,#f97316,#fbbf24)">
                  <span class="material-symbols-outlined icon-filled text-white" style="font-size:16px">check</span>
                </div>
                <div>
                  <p class="font-bold text-white">{item.titre}</p>
                  <p class="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Carte stats -->
        <div data-reveal class="grid grid-cols-2 gap-4" style="transition-delay:100ms">
          {#each [
            { val: '20 XAF', label: 'Frais fixes par transaction', icone: 'payments', couleur: '#f97316' },
            { val: '24/7', label: 'Disponibilité du service', icone: 'schedule', couleur: '#fbbf24' },
            { val: 'MTN', label: 'Mobile Money supporté', icone: 'signal_cellular_alt', couleur: '#fbbf24' },
            { val: 'Orange', label: 'Money supporté', icone: 'signal_cellular_alt', couleur: '#f97316' },
          ] as stat}
            <div class="p-6 rounded-2xl" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style="background:{stat.couleur}20">
                <span class="material-symbols-outlined icon-filled" style="font-size:20px; color:{stat.couleur}">{stat.icone}</span>
              </div>
              <p class="font-black text-white text-2xl mb-1" style="letter-spacing:-0.02em">{stat.val}</p>
              <p class="text-slate-400 text-xs leading-snug">{stat.label}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- ── COMMENT ÇA MARCHE ── -->
  <section id="comment" class="py-24 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color:#f97316">Processus</p>
        <h2 class="font-black text-slate-900 mb-4" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em">
          Simple comme bonjour
        </h2>
        <p class="text-slate-500 text-lg max-w-xl mx-auto">
          Trois étapes suffisent pour envoyer de l'argent ou du crédit partout au Cameroun.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <!-- Ligne de connexion desktop -->
        <div class="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5"
          style="background:linear-gradient(90deg,#f97316,#fbbf24)"></div>

        {#each [
          { num: '01', icone: 'smartphone', titre: 'Le client commande', desc: 'Via l\'application mobile, le client choisit le service, le réseau, le montant et le numéro destinataire.', couleur: '#f97316' },
          { num: '02', icone: 'store', titre: 'La cabine exécute', desc: 'Un agent terrain reçoit la commande et effectue l\'opération mobile money en temps réel.', couleur: '#f59e0b' },
          { num: '03', icone: 'check_circle', titre: 'Confirmation instantanée', desc: 'Le client reçoit une confirmation, le paiement est validé et la transaction est enregistrée.', couleur: '#10b981' },
        ] as step, i}
          <div data-reveal class="relative" style="transition-delay:{i * 100}ms">
            <div class="text-center">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10"
                style="background:linear-gradient(135deg,{step.couleur}20,{step.couleur}10); border:2px solid {step.couleur}30">
                <span class="material-symbols-outlined icon-filled" style="font-size:28px; color:{step.couleur}">{step.icone}</span>
              </div>
              <p class="font-black text-6xl mb-4" style="color:{step.couleur}20; letter-spacing:-0.04em">{step.num}</p>
              <h3 class="font-bold text-xl text-slate-900 mb-3" style="letter-spacing:-0.02em">{step.titre}</h3>
              <p class="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── TÉMOIGNAGES ── -->
  <section class="py-24 px-6 lg:px-12 bg-slate-50">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color:#f97316">Témoignages</p>
        <h2 class="font-black text-slate-900 mb-4" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em">
          Ils nous font confiance
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each [
          { nom: 'Marie K.', ville: 'Douala', texte: 'J\'envoie du crédit à ma famille à Yaoundé chaque semaine. TransfertCM c\'est rapide et je sais exactement ce que je paye.', note: 5 },
          { nom: 'Jean-Paul M.', ville: 'Yaoundé', texte: 'En tant que gérant de cabine, la plateforme m\'a permis d\'augmenter mes revenus. Les commandes arrivent directement sur mon téléphone.', note: 5 },
          { nom: 'Fatima B.', ville: 'Bafoussam', texte: 'Très pratique pour les forfaits internet. Le service est disponible même le week-end, c\'est ce que j\'apprécie le plus.', note: 5 },
        ] as t, i}
          <div data-reveal class="bg-white p-7 rounded-3xl border border-slate-100 hover:border-orange-100 transition-all"
            style="transition-delay:{i * 80}ms; box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <!-- Étoiles -->
            <div class="flex gap-1 mb-5">
              {#each Array(t.note) as _}
                <span class="material-symbols-outlined icon-filled" style="font-size:18px; color:#f59e0b">star</span>
              {/each}
            </div>
            <p class="text-slate-700 text-sm leading-relaxed mb-6 italic">"{t.texte}"</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style="background:linear-gradient(135deg,#f97316,#fbbf24)">
                {t.nom[0]}
              </div>
              <div>
                <p class="font-bold text-slate-900 text-sm">{t.nom}</p>
                <p class="text-xs text-slate-400">{t.ville}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── ESPACES ── -->
  <section id="espaces" class="py-24 px-6 lg:px-12 bg-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16" data-reveal>
        <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color:#f97316">Accès plateforme</p>
        <h2 class="font-black text-slate-900 mb-4" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em">
          Choisissez votre espace
        </h2>
        <p class="text-slate-500 text-lg max-w-xl mx-auto">
          Deux espaces dédiés pour les administrateurs et les gérants de cabine.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">

        <!-- Admin -->
        <div data-reveal class="group relative rounded-3xl overflow-hidden"
          style="background:linear-gradient(135deg,#f97316 0%,#ea580c 60%,#c2410c 100%)">
          <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15 -translate-y-1/4 translate-x-1/4"
            style="background:radial-gradient(circle,#fbbf24,transparent)"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 translate-y-1/4 -translate-x-1/4"
            style="background:radial-gradient(circle,#fff,transparent)"></div>

          <div class="relative z-10 p-10">
            <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
              <span class="material-symbols-outlined icon-filled text-white" style="font-size:30px">admin_panel_settings</span>
            </div>
            <p class="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Backoffice</p>
            <h3 class="font-black text-white text-3xl mb-4" style="letter-spacing:-0.03em">Espace Admin</h3>
            <p class="text-white/75 text-sm leading-relaxed mb-8">
              Gérez l'ensemble de la plateforme : commandes, cabines, abonnements, agents promo, rapports et paramètres.
            </p>
            <ul class="space-y-2 mb-8">
              {#each ['Tableau de bord temps réel', 'Gestion commandes & cabines', 'Anti-fraude & sécurité', 'Rapports SGPR & salaires'] as f}
                <li class="flex items-center gap-2.5 text-sm text-white/85">
                  <span class="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined icon-filled text-white" style="font-size:10px">check</span>
                  </span>
                  {f}
                </li>
              {/each}
            </ul>
            <a href="/login?espace=admin"
              class="group/btn inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-white font-bold text-base transition-all hover:shadow-xl hover:scale-[1.02]"
              style="color:#f97316">
              Connexion Admin
              <span class="material-symbols-outlined icon-filled transition-transform group-hover/btn:translate-x-1" style="font-size:20px">arrow_forward</span>
            </a>
          </div>
        </div>

        <!-- Cabine -->
        <div data-reveal class="group relative rounded-3xl overflow-hidden bg-slate-900" style="transition-delay:80ms">
          <div class="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/4 translate-x-1/4"
            style="background:radial-gradient(circle,#f97316,transparent)"></div>

          <div class="relative z-10 p-10">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style="background:linear-gradient(135deg,#f97316,#fbbf24)">
              <span class="material-symbols-outlined icon-filled text-white" style="font-size:30px">store</span>
            </div>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Espace agent</p>
            <h3 class="font-black text-white text-3xl mb-4" style="letter-spacing:-0.03em">Espace Cabine</h3>
            <p class="text-slate-400 text-sm leading-relaxed mb-8">
              Recevez et exécutez les commandes mobile money, gérez votre profil, vos soldes UV et communiquez avec l'administration.
            </p>
            <ul class="space-y-2 mb-8">
              {#each ['Commandes en temps réel', 'Exécution MTN & Orange', 'Gestion solde UV', 'Messagerie admin'] as f}
                <li class="flex items-center gap-2.5 text-sm text-slate-300">
                  <span class="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style="background:linear-gradient(135deg,#f97316,#fbbf24)">
                    <span class="material-symbols-outlined icon-filled text-white" style="font-size:10px">check</span>
                  </span>
                  {f}
                </li>
              {/each}
            </ul>
            <a href="/login?espace=cabin"
              class="group/btn inline-flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02]"
              style="background:linear-gradient(135deg,#f97316,#fbbf24); box-shadow:0 4px 20px rgba(249,115,22,0.4)">
              Connexion Cabine
              <span class="material-symbols-outlined icon-filled transition-transform group-hover/btn:translate-x-1" style="font-size:20px">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── CTA FINAL ── -->
  <section class="py-24 px-6 lg:px-12 relative overflow-hidden"
    style="background:linear-gradient(135deg,#f97316 0%,#fbbf24 100%)">
    <div class="absolute inset-0 opacity-10"
      style="background-image:radial-gradient(circle at 30% 50%, white 0%, transparent 50%)"></div>
    <div class="max-w-3xl mx-auto text-center relative z-10" data-reveal>
      <h2 class="font-black text-white mb-6" style="font-size:clamp(2rem,5vw,3.5rem); letter-spacing:-0.03em">
        Prêt à commencer ?
      </h2>
      <p class="text-white/80 text-lg mb-10">
        Rejoignez TransfertCM et profitez d'un service de mobile money rapide, sécurisé et disponible partout au Cameroun.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <a href="/login?espace=admin"
          class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white font-bold text-base transition-all hover:shadow-2xl hover:scale-[1.02]"
          style="color:#f97316; box-shadow:0 8px 30px rgba(0,0,0,0.15)">
          <span class="material-symbols-outlined icon-filled" style="font-size:20px">admin_panel_settings</span>
          Espace Admin
        </a>
        <a href="/login?espace=cabin"
          class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:bg-white/10"
          style="border:2px solid rgba(255,255,255,0.5)">
          <span class="material-symbols-outlined icon-filled" style="font-size:20px">store</span>
          Espace Cabine
        </a>
      </div>
    </div>
  </section>

  <!-- ── FOOTER ── -->
  <footer style="background:#0f172a" class="px-6 lg:px-12 py-12">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
            style="background:linear-gradient(135deg,#f97316,#fbbf24)">
            <span class="material-symbols-outlined icon-filled text-white" style="font-size:20px">swap_horiz</span>
          </div>
          <div>
            <p class="font-black text-white text-base leading-none" style="letter-spacing:-0.02em">TransfertCM</p>
            <p class="text-xs font-medium mt-0.5" style="color:#475569">Mobile Money Cameroun</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-6 text-sm" style="color:#475569">
          <a href="/login?espace=admin" class="hover:text-orange-400 transition-colors">Espace Admin</a>
          <a href="/login?espace=cabin" class="hover:text-orange-400 transition-colors">Espace Cabine</a>
          <a href="#services" class="hover:text-orange-400 transition-colors">Services</a>
          <a href="#comment" class="hover:text-orange-400 transition-colors">Comment ça marche</a>
        </div>
      </div>
      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style="border-top:1px solid #1e293b">
        <p class="text-xs" style="color:#334155">
          © {new Date().getFullYear()} TransfertCM — Plateforme mobile money au Cameroun
        </p>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs" style="color:#334155">Système opérationnel</span>
        </div>
      </div>
    </div>
  </footer>

</div>

<style>
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-33.33%); }
  }

  /* Les éléments sont visibles par défaut */
  [data-reveal] {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
  }

  /* Si JS est actif, on peut animer l'entrée */
  :global(.js-reveal [data-reveal]) {
    opacity: 0;
    transform: translateY(28px);
  }
  :global([data-reveal].revealed) {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
</style>
