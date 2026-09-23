<script lang="ts">
  import { onMount } from 'svelte'

  const NAV_LINKS = [
    { href: '#services', label: 'Services' },
    { href: '#comment-ca-marche', label: 'Comment ça marche' },
    { href: '#portefeuille', label: 'Portefeuille' },
    { href: '#tarifs', label: 'Tarifs' },
    { href: '#faq', label: 'Questions fréquentes' },
  ]

  const SERVICES = [
    { icone: 'smartphone', titre: 'Crédit', hint: 'Airtime MTN ou Orange', desc: 'Achetez des unités pour votre numéro ou celui d\'un proche, de 150 à 5 000 XAF.' },
    { icone: 'wifi', titre: 'Forfait', hint: 'Internet, Minuit & Appels', desc: 'Activez un forfait data, minuit ou appels sur les deux réseaux du pays.' },
    { icone: 'send', titre: 'Transfert', hint: 'Envoyer de l\'argent', desc: 'Envoyez de l\'argent vers un numéro MTN Mobile Money ou Orange Money.' },
  ]

  const ETAPES = [
    { titre: 'Vous rechargez votre portefeuille', desc: 'Alimentez votre solde TransfertCM par MTN MoMo ou Orange Money, une seule fois.' },
    { titre: 'Vous choisissez', desc: 'Crédit, forfait ou transfert, l\'opérateur, puis le montant.' },
    { titre: 'Vous indiquez pour qui', desc: 'Votre propre numéro ou celui d\'un proche : l\'application détecte l\'opérateur.' },
    { titre: 'Les unités arrivent', desc: 'Un agent partenaire exécute la commande et vous recevez la confirmation.' },
  ]

  const FAQ = [
    { q: 'Comment j\'achète mes unités ?', r: 'Vous rechargez d\'abord votre portefeuille TransfertCM par MTN MoMo ou Orange Money. Ensuite, chaque achat de crédit ou de forfait est débité de ce solde, sans ressaisir vos identifiants de paiement.' },
    { q: 'Je peux acheter pour quelqu\'un d\'autre ?', r: 'Oui. Au moment de la commande, vous choisissez « Mon numéro » ou « Autre numéro ». L\'application reconnaît automatiquement l\'opérateur du numéro saisi.' },
    { q: 'Combien coûte une commande ?', r: 'Les frais de service sont fixes et annoncés avant la validation : 20 XAF par commande, quel que soit le montant.' },
    { q: 'Quels réseaux sont pris en charge ?', r: 'MTN MoMo et Orange Money, pour le crédit, les forfaits et les transferts, partout au Cameroun.' },
    { q: 'Que se passe-t-il si une commande échoue ?', r: 'Le montant est recrédité sur votre portefeuille. Le support reste joignable depuis l\'application.' },
  ]

  const CHIFFRES = [
    { val: '20 XAF', label: 'Frais fixes par transaction' },
    { val: '150 XAF', label: 'Montant minimum d\'achat' },
    { val: '24/7', label: 'Service disponible' },
    { val: '2', label: 'Réseaux couverts' },
  ]

  let scrolled = $state(false)
  let active = $state('')
  let faqOuverte = $state<number | null>(0)

  onMount(() => {
    document.documentElement.classList.add('js')

    const onScroll = () => (scrolled = window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.08 },
    )
    document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))

    const ids = NAV_LINKS.map((l) => l.href.slice(1))
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) active = '#' + e.target.id }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el) })

    return () => {
      document.documentElement.classList.remove('js')
      window.removeEventListener('scroll', onScroll)
      reveal.disconnect()
      spy.disconnect()
    }
  })
</script>

<svelte:head>
  <title>TransfertCM — Crédit, forfaits et mobile money</title>
  <meta name="description" content="Rechargez votre ligne MTN ou Orange, pour vous ou pour vos proches, à toute heure et depuis votre téléphone. Crédit, forfaits et mobile money au Cameroun." />
</svelte:head>

<div class="site">
  <header class:scrolled>
    <div class="wrap nav">
      <a href="#top" class="brand">
        <img src="/branding/app_icon.svg" alt="" width="34" height="34" />
        <span>TransfertCM</span>
      </a>
      <nav class="nav-links">
        {#each NAV_LINKS as link}
          <a href={link.href} class:on={active === link.href}>{link.label}</a>
        {/each}
      </nav>
      <div class="nav-cta">
        <a href="#telecharger" class="btn btn-primary">
          <span class="cta-long">Télécharger l'application</span>
        </a>
      </div>
    </div>
  </header>

  <main id="top">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-blob b1"></div>
      <div class="hero-blob b2"></div>
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <div class="eyebrow"><span class="dot"></span>Crédit, forfaits et mobile money</div>
          <h1>Crédit et forfaits, <em>en un instant.</em></h1>
          <p class="lead">
            Rechargez votre ligne MTN ou Orange, pour vous ou pour vos proches,
            à toute heure et depuis votre téléphone.
          </p>
          <div class="hero-ctas">
            <a href="#telecharger" class="btn btn-primary">Télécharger l'application</a>
            <a href="#comment-ca-marche" class="btn btn-ghost">Comment ça marche</a>
          </div>
          <div class="hero-stores">
            <a href="#top" class="store-badge sm" aria-label="Disponible sur Google Play">
              <img src="/logos/play-store.svg" alt="Disponible sur Google Play" width="139" height="44" />
            </a>
            <a href="#top" class="store-badge sm" aria-label="Télécharger dans l'App Store">
              <img src="/logos/app-store.svg" alt="Télécharger dans l'App Store" width="139" height="44" />
            </a>
          </div>
          <div class="hero-microtrust">
            <span><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#00A878" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>20 XAF de frais par commande</span>
            <span><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#00A878" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Crédit dès 150 XAF</span>
          </div>
        </div>

        <div class="hero-shot-wrap">
          <div class="phone">
            <div class="phone-island"></div>
            <div class="phone-screen">
              <!-- En-tête sombre : l'AppInkHeader de l'app, la carte solde déborde dessus. -->
              <div class="pv-ink">
                <div class="pv-greet">
                  <div>
                    <p class="pv-role">Bonsoir</p>
                    <p class="pv-name">Awa</p>
                  </div>
                  <span class="pv-me">AW</span>
                </div>
                <div class="pv-balance">
                  <p class="pv-balance-label">Solde du portefeuille</p>
                  <p class="pv-balance-amount">45 200 XAF</p>
                  <div class="pv-actions">
                    <span><i class="material-symbols-outlined">send</i>Envoyer</span>
                    <span><i class="material-symbols-outlined">add</i>Recharger</span>
                    <span><i class="material-symbols-outlined">swap_horiz</i>Transférer</span>
                    <span><i class="material-symbols-outlined">event_repeat</i>Programmer</span>
                  </div>
                </div>
              </div>

              <div class="pv-body">
                <p class="pv-section">Raccourcis</p>
                <div class="pv-quick">
                  <span><i class="material-symbols-outlined" style="color:#3B82F6">receipt_long</i>Commandes</span>
                  <span><i class="material-symbols-outlined" style="color:#007A5E">group</i>Contacts</span>
                  <span><i class="material-symbols-outlined" style="color:#F59E0B">headset_mic</i>Support</span>
                  <span><i class="material-symbols-outlined" style="color:#10B981">redeem</i>Parrainage</span>
                </div>

                <div class="pv-section-row">
                  <p class="pv-section">Dernières commandes</p>
                  <span class="pv-seeall">Tout voir</span>
                </div>
                {#each [
                  { logo: '/logos/mtn.png', code: 'CMD-4821', montant: '1 000 XAF', type: 'Crédit', statut: 'Complétée', ok: true },
                  { logo: '/logos/orange.png', code: 'CMD-4820', montant: '2 500 XAF', type: 'Forfait', statut: 'En cours', ok: false },
                ] as o}
                  <div class="pv-row">
                    <span class="pv-avatar"><img src={o.logo} alt="" width="22" height="22" /></span>
                    <span class="pv-meta">
                      <b>{o.code}</b>
                      <i>{o.montant} · {o.type}</i>
                    </span>
                    <span class="pv-badge" class:pending={!o.ok}>{o.statut}</span>
                  </div>
                {/each}
              </div>

              <!-- Barre d'onglets : 5 emplacements, le centre en pastille. -->
              <div class="pv-nav">
                <span class="on"><i class="material-symbols-outlined">home</i>Accueil</span>
                <span><i class="material-symbols-outlined">receipt_long</i>Commandes</span>
                <span class="pv-nav-center"><i class="material-symbols-outlined">add</i></span>
                <span><i class="material-symbols-outlined">account_balance_wallet</i>Portefeuille</span>
                <span><i class="material-symbols-outlined">person</i>Profil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUST STRIP -->
    <div class="trust-strip">
      <div class="wrap trust-row">
        <span class="tlabel">Compatible avec</span>
        <div class="pay-logos">
          <span class="pay-chip"><img src="/logos/mtn.png" alt="MTN" width="26" height="26" />MTN Mobile Money</span>
          <span class="pay-chip"><img src="/logos/orange.png" alt="Orange" width="26" height="26" />Orange Money</span>
        </div>
      </div>
    </div>

    <!-- SERVICES -->
    <section class="services" id="services">
      <div class="wrap">
        <div class="section-head reveal">
          <div class="section-eyebrow">Que souhaitez-vous ?</div>
          <h2>Tout ce que vous achetiez en cabine, depuis votre téléphone</h2>
          <p>Trois services, un seul portefeuille, les deux réseaux du pays.</p>
        </div>
        <div class="card-grid reveal">
          {#each SERVICES as s}
            <article class="card">
              <div class="card-icon"><i class="material-symbols-outlined">{s.icone}</i></div>
              <h3>{s.titre}</h3>
              <p class="card-hint">{s.hint}</p>
              <p>{s.desc}</p>
            </article>
          {/each}
        </div>
      </div>
    </section>

    <!-- COMMENT ÇA MARCHE -->
    <section class="how" id="comment-ca-marche">
      <div class="wrap">
        <div class="section-head reveal">
          <div class="section-eyebrow">Le parcours</div>
          <h2>Du portefeuille aux unités reçues</h2>
          <p>Quatre étapes, sans détour, avec un agent partenaire qui exécute près de chez vous.</p>
        </div>
        <div class="how-track reveal">
          <div class="how-line"></div>
          <div class="how-grid">
            {#each ETAPES as e, i}
              <div class="how-card">
                <div class="how-num">{i + 1}</div>
                <h3>{e.titre}</h3>
                <p>{e.desc}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- CHIFFRES -->
    <section class="stats">
      <div class="wrap stat-grid reveal">
        {#each CHIFFRES as c}
          <div class="stat">
            <p class="stat-val">{c.val}</p>
            <p class="stat-label">{c.label}</p>
          </div>
        {/each}
      </div>
    </section>


    <!-- PORTEFEUILLE -->
    <section class="wallet" id="portefeuille">
      <div class="wrap wallet-grid">
        <div class="wallet-copy reveal">
          <div class="section-eyebrow">Portefeuille</div>
          <h2>Votre mobile money, sans détour</h2>
          <p class="wallet-lead">
            Déposez, envoyez et retirez votre argent. Suivez chaque opération
            depuis un historique clair et à jour.
          </p>
          <ul class="wallet-list">
            <li><i class="material-symbols-outlined">add_circle</i><span><b>Recharger</b>Alimentez votre solde par MTN MoMo ou Orange Money.</span></li>
            <li><i class="material-symbols-outlined">swap_horiz</i><span><b>Transférer</b>Envoyez de l'argent à un autre membre TransfertCM.</span></li>
            <li><i class="material-symbols-outlined">event_repeat</i><span><b>Programmer</b>Planifiez des recharges récurrentes, quotidiennes ou mensuelles.</span></li>
            <li><i class="material-symbols-outlined">shield</i><span><b>Protéger</b>Un code PIN et la biométrie gardent votre compte.</span></li>
          </ul>
        </div>
        <div class="wallet-visual reveal">
          <div class="wv-card">
            <p class="wv-label">Solde disponible</p>
            <p class="wv-amount">45 200 XAF</p>
          </div>
          <div class="wv-tx">
            <p class="wv-tx-title">Transactions récentes</p>
            {#each [
              { i: 'add_circle', t: 'Dépôt', m: '+ 20 000 XAF', up: true },
              { i: 'smartphone', t: 'Paiement', m: '− 1 020 XAF', up: false },
              { i: 'swap_horiz', t: 'Transfert envoyé', m: '− 5 000 XAF', up: false },
            ] as t}
              <div class="wv-line">
                <i class="material-symbols-outlined" class:up={t.up}>{t.i}</i>
                <span>{t.t}</span>
                <b class:up={t.up}>{t.m}</b>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- TARIFS -->
    <section class="pricing" id="tarifs">
      <div class="wrap">
        <div class="section-head reveal">
          <div class="section-eyebrow">Tarifs</div>
          <h2>Un tarif unique, annoncé avant de payer</h2>
          <p>Pas de commission proportionnelle, pas de frais cachés.</p>
        </div>
        <div class="price-card reveal">
          <div class="price-main">
            <p class="price-amount">20 <span>XAF</span></p>
            <p class="price-unit">de frais par commande, quel que soit le montant</p>
          </div>
          <ul class="price-list">
            <li><i class="material-symbols-outlined">check_circle</i>Crédit et forfaits MTN et Orange</li>
            <li><i class="material-symbols-outlined">check_circle</i>Achat pour votre numéro ou celui d'un proche</li>
            <li><i class="material-symbols-outlined">check_circle</i>Reçu détaillé pour chaque commande</li>
            <li><i class="material-symbols-outlined">check_circle</i>Montant recrédité si la commande échoue</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq" id="faq">
      <div class="wrap">
        <div class="section-head reveal">
          <div class="section-eyebrow">Questions fréquentes</div>
          <h2>Ce qu'il faut savoir avant de commencer</h2>
        </div>
        <div class="faq-list reveal">
          {#each FAQ as item, i}
            <div class="faq-item" class:open={faqOuverte === i}>
              <button type="button" onclick={() => (faqOuverte = faqOuverte === i ? null : i)} aria-expanded={faqOuverte === i}>
                <span>{item.q}</span>
                <i class="material-symbols-outlined">expand_more</i>
              </button>
              {#if faqOuverte === i}
                <p>{item.r}</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="final-cta" id="telecharger">
      <div class="wrap">
        <h2 class="reveal">Prêt à recharger votre première ligne ?</h2>
        <p class="reveal">Téléchargez TransfertCM et créez votre compte en quelques minutes.</p>
        <div class="final-ctas reveal">
          <a href="#top" class="store-badge" aria-label="Disponible sur Google Play">
            <img src="/logos/play-store.svg" alt="Disponible sur Google Play" width="139" height="44" />
          </a>
          <a href="#top" class="store-badge" aria-label="Télécharger dans l'App Store">
            <img src="/logos/app-store.svg" alt="Télécharger dans l'App Store" width="139" height="44" />
          </a>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <div class="foot-top">
        <div class="foot-brand">
          <a href="#top" class="brand">
            <img src="/branding/app_icon.svg" alt="" width="34" height="34" />
            <span>TransfertCM</span>
          </a>
          <p>Crédit, forfaits et mobile money au Cameroun, sur MTN MoMo et Orange Money.</p>
        </div>
        <div class="foot-cols">
          <div class="foot-col">
            <h4>Services</h4>
            <ul>
              <li><a href="#services">Crédit (airtime)</a></li>
              <li><a href="#services">Forfaits internet</a></li>
              <li><a href="#services">Transfert d'argent</a></li>
              <li><a href="#tarifs">Tarifs</a></li>
            </ul>
          </div>
          <div class="foot-col">
            <h4>À propos</h4>
            <ul>
              <li><a href="#comment-ca-marche">Comment ça marche</a></li>
              <li><a href="#portefeuille">Portefeuille</a></li>
              <li><a href="#faq">Questions fréquentes</a></li>
              <li><a href="/about">Qui sommes-nous</a></li>
            </ul>
          </div>
          <div class="foot-col">
            <h4>Assistance</h4>
            <ul>
              <li><a href="#faq">Aide</a></li>
              <li><a href="#telecharger">Télécharger l'application</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© {new Date().getFullYear()} TransfertCM. Tous droits réservés.</span>
        <span>Douala, Cameroun</span>
      </div>
    </div>
  </footer>
</div>

<style>
  .site{
    --ink:#0B1220;
    --ink-soft:#162032;
    --green-deep:#00513E;
    --green:#007A5E;
    --green-bright:#00A878;
    --mint:#E6F4F0;
    --paper:#FFFFFF;
    --bg:#F8FAFC;
    --border:#E2E8F0;
    --text:#0F172A;
    --text-soft:#64748B;
    --text-hint:#94A3B8;
    --mtn:#F59E0B;
    --orange:#F97316;

    --font-body:'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

    font-family:var(--font-body);
    color:var(--text);
    background:var(--paper);
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }

  :global(html:has(.site)){scroll-behavior:smooth;}
  :global(html:has(.site)) :global([id]){scroll-margin-top:96px;}
  @media (prefers-reduced-motion: reduce){
    :global(html:has(.site)){scroll-behavior:auto;}
  }

  .site :global(*),
  .site :global(*::before),
  .site :global(*::after){box-sizing:border-box;}
  .site :global(h1), .site :global(h2), .site :global(h3), .site :global(h4),
  .site :global(p), .site :global(ul), .site :global(li){margin:0; padding:0;}
  .site :global(h1), .site :global(h2), .site :global(h3), .site :global(h4){
    font-family:inherit; color:inherit; font-weight:inherit; font-size:inherit;
  }
  .site :global(button){font-family:inherit;}
  .site :global(img){display:block; max-width:100%;}
  .site :global(a){text-decoration:none; color:inherit;}
  .site :global(ul){list-style:none;}
  .wrap{max-width:1180px; margin:0 auto; padding:0 32px;}
  @media (max-width:640px){ .wrap{padding:0 20px;} }

  /* ---------- Reveal ---------- */
  .reveal{transition:opacity .7s ease, transform .7s ease;}
  :global(html.js) .reveal:not(:global(.in)){opacity:0; transform:translateY(24px);}
  @media (prefers-reduced-motion: reduce){
    .reveal{opacity:1 !important; transform:none !important; transition:none;}
  }

  /* ---------- Boutons ---------- */
  .btn{
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    font-weight:700; font-size:15px; padding:15px 26px; border-radius:100px;
    border:none; cursor:pointer; white-space:nowrap;
    transition:transform .18s ease, box-shadow .18s ease, filter .18s ease, background .18s ease;
  }
  .btn:focus-visible{outline:3px solid var(--green-bright); outline-offset:3px;}
  .btn:hover{transform:translateY(-2px);}
  .btn-primary{background:var(--green-bright); color:#fff; box-shadow:0 12px 28px -10px rgba(0,168,120,.55);}
  .btn-primary:hover{filter:brightness(1.05);}
  .btn-ghost{background:rgba(255,255,255,.1); color:#fff; border:1.5px solid rgba(255,255,255,.35);}
  .btn-ghost:hover{background:rgba(255,255,255,.18);}
  .btn-light{background:#fff; color:var(--green);}
  .btn-ghost-dark{background:rgba(255,255,255,.12); color:#fff; border:1.5px solid rgba(255,255,255,.4);}
  .btn-ghost-dark:hover{background:rgba(255,255,255,.2);}

  /* ---------- Nav ---------- */
  header{
    position:fixed; top:0; left:0; right:0; z-index:100;
    background:rgba(0,81,62,.45); backdrop-filter:blur(10px);
    border-bottom:1px solid rgba(255,255,255,.05);
    transition:background .32s ease, backdrop-filter .32s ease, border-color .32s ease, box-shadow .32s ease;
  }
  header.scrolled{
    background:rgba(0,65,50,.92); backdrop-filter:blur(18px);
    border-bottom-color:rgba(255,255,255,.1);
    box-shadow:0 12px 34px -20px rgba(0,0,0,.6);
  }
  .nav{display:flex; align-items:center; justify-content:space-between; height:78px; transition:height .32s ease;}
  header.scrolled .nav{height:64px;}
  .brand{display:flex; align-items:center; gap:10px;}
  .brand img{width:34px; height:34px; border-radius:9px; transition:width .32s ease, height .32s ease;}
  header.scrolled .brand img{width:30px; height:30px;}
  .brand span{font-weight:700; font-size:20px; color:#fff; letter-spacing:-.2px;}
  .nav-links{display:flex; align-items:center; gap:30px;}
  .nav-links a{
    position:relative; color:rgba(255,255,255,.82); font-size:14.5px; font-weight:500;
    padding:6px 0; transition:color .22s ease;
  }
  .nav-links a::after{
    content:""; position:absolute; left:0; right:0; bottom:0; height:2px; border-radius:2px;
    background:var(--green-bright); transform:scaleX(0); transform-origin:center;
    transition:transform .28s cubic-bezier(.4,0,.2,1);
  }
  .nav-links a:hover{color:#fff;}
  .nav-links a:hover::after{transform:scaleX(.55);}
  .nav-links a.on{color:#fff;}
  .nav-links a.on::after{transform:scaleX(1);}
  .nav-cta{display:flex; align-items:center; gap:12px;}
  .nav .btn{padding:11px 20px; font-size:13.5px;}
  @media (max-width:980px){ .nav-links{display:none;} }
  @media (max-width:620px){
    .nav{height:66px; gap:12px;}
    .brand span{font-size:18px;}
    .brand img{width:30px; height:30px;}
    .nav .btn{padding:10px 15px; font-size:12.5px;}
  }
  @media (max-width:560px){ .cta-long{display:none;} }

  /* ---------- Hero ---------- */
  .hero{
    position:relative; overflow:hidden; color:#fff; padding:168px 0 96px;
    background:radial-gradient(circle at 14% 8%, #00A878 0%, var(--green) 45%, var(--green-deep) 100%);
  }
  .hero-blob{position:absolute; border-radius:50%; filter:blur(2px); pointer-events:none;}
  .hero-blob.b1{width:520px; height:520px; right:-160px; top:-180px; background:radial-gradient(circle, rgba(0,168,120,.55), transparent 70%);}
  .hero-blob.b2{width:420px; height:420px; left:-140px; bottom:-200px; background:radial-gradient(circle, rgba(230,244,240,.22), transparent 70%);}
  .hero-grid{display:grid; grid-template-columns:1fr 1.1fr; gap:56px; align-items:center; position:relative; z-index:2;}
  .hero-grid > *{min-width:0;}
  .eyebrow{
    display:inline-flex; align-items:center; gap:8px;
    font-size:12.5px; font-weight:700; letter-spacing:1.6px; text-transform:uppercase;
    color:#fff; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.3);
    padding:8px 16px; border-radius:100px; margin-bottom:24px;
  }
  .eyebrow .dot{width:6px; height:6px; border-radius:50%; background:#fff;}
  .hero h1{font-weight:700; font-size:clamp(34px,5vw,58px); line-height:1.08; letter-spacing:-.5px; margin-bottom:22px;}
  .hero h1 em{font-style:normal; color:#8FE8CE;}
  .hero .lead{font-size:18px; line-height:1.65; color:rgba(255,255,255,.85); max-width:520px; margin-bottom:34px;}
  .hero-ctas{display:flex; gap:14px; flex-wrap:wrap; margin-bottom:30px;}
  .hero-microtrust{display:flex; gap:22px; flex-wrap:wrap; font-size:13.5px; color:rgba(255,255,255,.7);}
  .hero-microtrust span{display:flex; align-items:center; gap:7px;}
  .hero-microtrust svg{width:15px; height:15px; flex:none;}
  @media (max-width:940px){
    .hero{padding:132px 0 72px;}
    .hero-grid{grid-template-columns:1fr; text-align:center;}
    .hero-copy{order:1;}
    .hero-shot-wrap{order:2;}
    .hero .lead{margin-left:auto; margin-right:auto;}
    .hero-ctas, .hero-microtrust{justify-content:center;}
  }

  /* ---------- Maquette téléphone — iPhone 16 Pro Max (440x956pt, ratio 2.173) ---------- */
  .hero-shot-wrap{position:relative; display:flex; justify-content:center; perspective:1600px;}
  .phone{
    position:relative; width:320px; height:695px; max-width:100%;
    background:linear-gradient(150deg, #3A4354 0%, #0B1220 28%, #0B1220 72%, #2C3547 100%);
    border-radius:62px; padding:11px;
    box-shadow:0 50px 90px -24px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.09);
    animation:phone-float 7s ease-in-out infinite;
  }
  /* Tranche de titane : un liseré clair juste à l'intérieur du châssis. */
  .phone::after{
    content:""; position:absolute; inset:5px; border-radius:57px;
    border:1px solid rgba(255,255,255,.14); pointer-events:none;
  }
  @keyframes phone-float{
    0%, 100%{transform:translateY(0) rotate(-1deg);}
    50%{transform:translateY(-14px) rotate(-1deg);}
  }
  .phone-island{
    position:absolute; top:24px; left:50%; transform:translateX(-50%);
    width:108px; height:31px; border-radius:100px; background:#000; z-index:3;
  }
  .phone-screen{
    position:relative; height:100%; background:var(--bg); border-radius:52px;
    overflow:hidden; display:flex; flex-direction:column;
  }

  /* En-tête sombre — AppInkHeader : aplat ink, coins bas à 24px. */
  .pv-ink{
    background:var(--ink); border-radius:0 0 24px 24px;
    padding:58px 14px 0; flex:none;
  }
  .pv-greet{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px;}
  .pv-role{font-size:11px; color:#94A3B8;}
  .pv-name{font-size:19px; font-weight:700; letter-spacing:-.4px; color:#F8FAFC; line-height:1.2;}
  .pv-me{
    width:34px; height:34px; border-radius:50%; flex:none;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:700; color:#fff;
    background:rgba(255,255,255,.25); border:1.5px solid rgba(255,255,255,.5);
  }
  /* La carte solde déborde de l'en-tête sur le fond clair. */
  .pv-balance{
    background:linear-gradient(135deg, var(--green) 0%, var(--green-bright) 100%);
    border-radius:20px; padding:15px 15px 10px; color:#fff;
    box-shadow:0 8px 24px rgba(15,23,42,.14); margin-bottom:-26px;
  }
  .pv-balance-label{font-size:10.5px; color:rgba(255,255,255,.9);}
  .pv-balance-amount{font-size:23px; font-weight:700; letter-spacing:-.8px; font-variant-numeric:tabular-nums; margin-top:5px;}
  .pv-actions{display:flex; gap:3px; margin-top:11px; padding-top:9px; border-top:1px solid rgba(255,255,255,.18);}
  .pv-actions span{flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:8px; font-weight:600;}
  .pv-actions i{
    font-size:14px; width:26px; height:26px; border-radius:50%;
    background:rgba(255,255,255,.18); display:flex; align-items:center; justify-content:center;
  }

  .pv-body{flex:1; padding:38px 14px 0; overflow:hidden;}
  .pv-section{font-size:9.5px; font-weight:600; letter-spacing:.6px; text-transform:uppercase; color:var(--text-hint); margin-bottom:8px;}
  .pv-section-row{display:flex; align-items:baseline; justify-content:space-between; margin-top:16px;}
  .pv-seeall{font-size:9.5px; font-weight:600; color:var(--green);}

  /* Raccourcis — 4 cartes égales, icône puis libellé. */
  .pv-quick{display:flex; gap:7px;}
  .pv-quick span{
    flex:1; background:var(--paper); border:1px solid var(--border); border-radius:14px;
    padding:11px 2px; display:flex; flex-direction:column; align-items:center; gap:5px;
    font-size:7.5px; font-weight:600; color:var(--text); text-align:center;
    box-shadow:0 2px 16px rgba(15,23,42,.04);
  }
  .pv-quick i{font-size:16px;}

  .pv-row{
    display:flex; align-items:center; gap:9px; background:var(--paper);
    border:1px solid var(--border); border-radius:14px; padding:9px; margin-bottom:7px;
    box-shadow:0 2px 16px rgba(15,23,42,.04);
  }
  .pv-avatar{
    width:32px; height:32px; border-radius:9px; flex:none; background:var(--bg);
    display:flex; align-items:center; justify-content:center;
  }
  .pv-avatar img{width:22px; height:22px; border-radius:50%;}
  .pv-meta{flex:1; display:flex; flex-direction:column; gap:2px; min-width:0;}
  .pv-meta b{font-size:11.5px; font-weight:600; color:var(--text);}
  .pv-meta i{font-size:9.5px; font-style:normal; color:var(--text-soft);}
  .pv-badge{
    font-size:8px; font-weight:700; padding:4px 7px; border-radius:18px; flex:none;
    color:#10B981; background:rgba(16,185,129,.08);
  }
  .pv-badge.pending{color:#3B82F6; background:rgba(59,130,246,.08);}

  /* Barre d'onglets — AppNavBar : 5 slots, bouton central en pastille. */
  .pv-nav{
    flex:none; display:flex; align-items:center; background:var(--paper);
    border-top:1px solid var(--border); padding:8px 6px 14px;
    box-shadow:0 -8px 24px rgba(15,23,42,.06);
  }
  .pv-nav span{
    flex:1; display:flex; flex-direction:column; align-items:center; gap:3px;
    font-size:7px; font-weight:500; color:var(--text-hint);
  }
  .pv-nav span i{font-size:17px;}
  .pv-nav span.on{color:var(--green); font-weight:600;}
  .pv-nav-center{
    width:40px; height:40px; border-radius:50%; flex:none !important;
    background:linear-gradient(135deg, var(--green) 0%, var(--green-bright) 100%);
    color:#fff !important; justify-content:center;
    box-shadow:0 8px 24px -6px rgba(0,122,94,.55);
  }
  .pv-nav-center i{font-size:20px !important;}

  /* ---------- Badges de store ---------- */
  .store-badge{
    display:inline-flex; align-items:center; justify-content:center;
    background:#fff; border-radius:12px; padding:9px 16px;
    box-shadow:0 10px 24px -12px rgba(0,0,0,.45);
    transition:transform .2s ease, box-shadow .2s ease;
  }
  .store-badge:hover{transform:translateY(-2px); box-shadow:0 14px 30px -12px rgba(0,0,0,.5);}
  .store-badge:focus-visible{outline:3px solid var(--green-bright); outline-offset:3px;}
  .store-badge img{height:30px; width:auto;}
  .store-badge.sm{padding:7px 13px; border-radius:10px;}
  .store-badge.sm img{height:25px;}
  .hero-stores{display:flex; gap:12px; flex-wrap:wrap; margin-bottom:30px;}
  @media (max-width:940px){ .hero-stores{justify-content:center;} }

  /* ---------- Bandeau de confiance ---------- */
  .trust-strip{background:var(--paper); border-bottom:1px solid var(--border); padding:22px 0;}
  .trust-row{display:flex; align-items:center; justify-content:center; gap:24px; flex-wrap:wrap;}
  .tlabel{font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--text-hint);}
  .pay-logos{display:flex; gap:12px; flex-wrap:wrap;}
  .pay-chip{
    display:inline-flex; align-items:center; gap:10px; padding:8px 18px 8px 10px; border-radius:100px;
    font-size:13px; font-weight:600; border:1px solid var(--border); color:var(--text-soft);
    background:var(--paper); transition:transform .2s ease, box-shadow .2s ease;
  }
  .pay-chip:hover{transform:translateY(-2px); box-shadow:0 8px 20px -10px rgba(15,23,42,.25);}
  .pay-chip img{width:26px; height:26px; border-radius:50%; flex:none;}

  /* ---------- Têtes de section ---------- */
  .section-head{max-width:680px; margin:0 auto 48px; text-align:center;}
  .section-eyebrow{
    display:inline-block; font-size:12.5px; font-weight:700; letter-spacing:1.6px;
    text-transform:uppercase; color:var(--green); background:var(--mint);
    padding:7px 15px; border-radius:100px; margin-bottom:16px;
  }
  .section-head h2{font-size:clamp(26px,3.4vw,38px); font-weight:700; line-height:1.2; letter-spacing:-.6px;}
  .section-head p{margin-top:14px; font-size:16px; line-height:1.6; color:var(--text-soft);}

  /* ---------- Services ---------- */
  .services{background:var(--bg); padding:88px 0;}
  .card-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:20px;}
  @media (max-width:940px){ .card-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:560px){ .card-grid{grid-template-columns:1fr;} }
  .card{
    background:var(--paper); border:1px solid var(--border); border-radius:18px; padding:24px;
    box-shadow:0 2px 16px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06);
    transition:transform .22s ease, box-shadow .22s ease;
  }
  .card:hover{transform:translateY(-3px); box-shadow:0 12px 30px -12px rgba(0,122,94,.22);}
  .card-icon{
    width:48px; height:48px; border-radius:14px; background:var(--mint); color:var(--green);
    display:flex; align-items:center; justify-content:center; margin-bottom:16px;
  }
  .card-icon i{font-size:24px;}
  .card h3{font-size:16px; font-weight:700; letter-spacing:-.2px; margin-bottom:3px;}
  .card-hint{font-size:12px !important; font-weight:600; color:var(--green) !important; margin-bottom:8px;}
  .card p{font-size:13.5px; line-height:1.6; color:var(--text-soft);}

  /* ---------- Comment ça marche ---------- */
  .how{background:var(--paper); padding:88px 0;}
  .how-track{position:relative;}
  .how-line{position:absolute; top:26px; left:8%; right:8%; height:2px; background:var(--border);}
  @media (max-width:940px){ .how-line{display:none;} }
  .how-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:24px; position:relative;}
  @media (max-width:940px){ .how-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:560px){ .how-grid{grid-template-columns:1fr;} }
  .how-num{
    width:52px; height:52px; border-radius:50%; margin:0 auto 16px;
    background:linear-gradient(135deg, var(--green) 0%, var(--green-bright) 100%);
    color:#fff; font-size:19px; font-weight:700;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 20px -8px rgba(0,122,94,.5); position:relative; z-index:2;
  }
  .how-card{text-align:center;}
  .how-card h3{font-size:15.5px; font-weight:700; margin-bottom:8px; letter-spacing:-.2px;}
  .how-card p{font-size:13.5px; line-height:1.6; color:var(--text-soft);}

  /* ---------- Chiffres ---------- */
  .stats{background:var(--ink); padding:56px 0; color:#fff;}
  .stat-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:24px; text-align:center;}
  @media (max-width:640px){ .stat-grid{grid-template-columns:repeat(2,1fr); gap:32px 16px;} }
  .stat-val{font-size:clamp(24px,3vw,34px); font-weight:700; letter-spacing:-.8px; font-variant-numeric:tabular-nums; color:#8FE8CE;}
  .stat-label{margin-top:6px; font-size:12.5px; color:rgba(255,255,255,.65); line-height:1.4;}


  /* ---------- Portefeuille ---------- */
  .wallet{background:var(--paper); padding:88px 0;}
  .wallet-grid{display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center;}
  .wallet-grid > *{min-width:0;}
  @media (max-width:940px){ .wallet-grid{grid-template-columns:1fr; gap:40px;} }
  .wallet-copy h2{font-size:clamp(26px,3.4vw,38px); font-weight:700; line-height:1.2; letter-spacing:-.6px;}
  .wallet-lead{margin-top:14px; font-size:16px; line-height:1.6; color:var(--text-soft);}
  .wallet-list{margin-top:26px; display:flex; flex-direction:column; gap:18px;}
  .wallet-list li{display:flex; align-items:flex-start; gap:14px;}
  .wallet-list i{
    font-size:20px; color:var(--green); background:var(--mint);
    width:40px; height:40px; border-radius:12px; flex:none;
    display:flex; align-items:center; justify-content:center;
  }
  .wallet-list span{display:flex; flex-direction:column; gap:3px; font-size:13.5px; line-height:1.55; color:var(--text-soft);}
  .wallet-list b{font-size:15px; font-weight:700; color:var(--text);}

  .wallet-visual{display:flex; flex-direction:column; gap:14px;}
  .wv-card{
    background:linear-gradient(135deg, var(--green) 0%, var(--green-bright) 100%);
    border-radius:24px; padding:26px; color:#fff; box-shadow:0 8px 24px rgba(15,23,42,.1);
  }
  .wv-label{font-size:13px; color:rgba(255,255,255,.9);}
  .wv-amount{font-size:34px; font-weight:700; letter-spacing:-1.2px; font-variant-numeric:tabular-nums; margin-top:8px;}
  .wv-tx{background:var(--paper); border:1px solid var(--border); border-radius:18px; padding:20px;}
  .wv-tx-title{font-size:11px; font-weight:600; letter-spacing:.6px; text-transform:uppercase; color:var(--text-hint); margin-bottom:14px;}
  .wv-line{display:flex; align-items:center; gap:12px; padding:9px 0; font-size:14px;}
  .wv-line + .wv-line{border-top:1px solid var(--border);}
  .wv-line i{
    font-size:17px; width:32px; height:32px; border-radius:10px; flex:none;
    display:flex; align-items:center; justify-content:center;
    color:var(--text-soft); background:var(--bg);
  }
  .wv-line i.up{color:#10B981; background:rgba(16,185,129,.1);}
  .wv-line span{flex:1; color:var(--text);}
  .wv-line b{font-weight:600; font-variant-numeric:tabular-nums; color:var(--text);}
  .wv-line b.up{color:#10B981;}

  /* ---------- Tarifs ---------- */
  .pricing{background:var(--bg); padding:88px 0;}
  .price-card{
    max-width:720px; margin:0 auto; background:var(--paper); border:1px solid var(--border);
    border-radius:24px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,.06);
    display:grid; grid-template-columns:1fr 1.2fr;
  }
  @media (max-width:640px){ .price-card{grid-template-columns:1fr;} }
  .price-main{
    background:linear-gradient(135deg, var(--green) 0%, var(--green-bright) 100%);
    color:#fff; padding:36px 28px; display:flex; flex-direction:column; justify-content:center;
  }
  .price-amount{font-size:46px; font-weight:700; letter-spacing:-1.5px; line-height:1;}
  .price-amount span{font-size:20px; font-weight:600; letter-spacing:0;}
  .price-unit{margin-top:10px; font-size:13px; line-height:1.5; color:rgba(255,255,255,.88);}
  .price-list{padding:28px; display:flex; flex-direction:column; gap:14px;}
  .price-list li{display:flex; align-items:flex-start; gap:10px; font-size:14px; line-height:1.5; color:var(--text);}
  .price-list i{font-size:19px; color:var(--green-bright); flex:none;}

  /* ---------- FAQ ---------- */
  .faq{background:var(--paper); padding:88px 0;}
  .faq-list{max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:12px;}
  .faq-item{border:1px solid var(--border); border-radius:14px; overflow:hidden; transition:border-color .2s ease;}
  .faq-item.open{border-color:var(--green-bright);}
  .faq-item button{
    width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px;
    background:none; border:none; cursor:pointer; text-align:left;
    padding:18px 20px; font-size:15px; font-weight:600; color:var(--text);
  }
  .faq-item button i{font-size:22px; color:var(--text-hint); transition:transform .25s ease; flex:none;}
  .faq-item.open button i{transform:rotate(180deg); color:var(--green);}
  .faq-item p{padding:0 20px 18px; font-size:14px; line-height:1.65; color:var(--text-soft);}

  /* ---------- CTA final ---------- */
  .final-cta{
    background:radial-gradient(circle at 20% 20%, #00A878 0%, var(--green) 45%, var(--green-deep) 100%);
    color:#fff; padding:88px 0; text-align:center;
  }
  .final-cta h2{font-size:clamp(26px,3.4vw,38px); font-weight:700; letter-spacing:-.6px; line-height:1.2;}
  .final-cta p{margin-top:14px; font-size:16px; color:rgba(255,255,255,.85);}
  .final-ctas{display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-top:30px;}

  /* ---------- Footer ---------- */
  footer{background:var(--ink); color:rgba(255,255,255,.65); padding:56px 0 28px;}
  .foot-top{display:flex; justify-content:space-between; flex-wrap:wrap; gap:36px; padding-bottom:36px; border-bottom:1px solid rgba(255,255,255,.1);}
  .foot-brand .brand span{color:#fff;}
  .foot-brand p{font-size:13.5px; margin-top:12px; max-width:280px; line-height:1.6;}
  .foot-cols{display:flex; gap:56px; flex-wrap:wrap;}
  .foot-col h4{font-size:12.5px; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,.42); margin-bottom:14px;}
  .foot-col li{margin-bottom:10px; font-size:13.5px;}
  .foot-col a:hover{color:#fff;}
  .foot-bottom{display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:24px; font-size:12.5px;}


  /* ---------- Animations ---------- */
  /* Entrée du héros : chaque bloc suit le précédent. */
  @keyframes rise{ from{opacity:0; transform:translateY(22px);} to{opacity:1; transform:translateY(0);} }
  @keyframes rise-phone{ from{opacity:0; transform:translateY(40px) scale(.96);} to{opacity:1; transform:translateY(0) scale(1);} }
  .hero-copy > *{animation:rise .75s cubic-bezier(.16,1,.3,1) both;}
  .hero-copy > .eyebrow{animation-delay:.05s;}
  .hero-copy > h1{animation-delay:.15s;}
  .hero-copy > .lead{animation-delay:.25s;}
  .hero-copy > .hero-ctas{animation-delay:.35s;}
  .hero-copy > .hero-stores{animation-delay:.42s;}
  .hero-copy > .hero-microtrust{animation-delay:.5s;}
  .hero-shot-wrap{animation:rise-phone 1s cubic-bezier(.16,1,.3,1) .3s both;}

  /* Halos du héros : une respiration lente, décalée entre les deux. */
  @keyframes drift{
    0%, 100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(26px,-22px) scale(1.12);}
  }
  .hero-blob.b1{animation:drift 15s ease-in-out infinite;}
  .hero-blob.b2{animation:drift 19s ease-in-out infinite reverse;}

  /* Contenu de la maquette : la liste se remplit après l'arrivée du téléphone. */
  .pv-greet, .pv-balance, .pv-quick, .pv-section-row, .pv-row, .pv-nav{
    animation:rise .6s cubic-bezier(.16,1,.3,1) both;
  }
  .pv-greet{animation-delay:.72s;}
  .pv-balance{animation-delay:.82s;}
  .pv-body > .pv-section{animation:rise .6s cubic-bezier(.16,1,.3,1) .92s both;}
  .pv-quick{animation-delay:.98s;}
  .pv-section-row{animation-delay:1.08s;}
  .pv-row:nth-of-type(1){animation-delay:1.16s;}
  .pv-row:nth-of-type(2){animation-delay:1.24s;}
  .pv-nav{animation-delay:1.3s;}

  /* Cascade des cartes révélées au défilement. */
  .card-grid.in .card, .how-grid .how-card, .stat-grid.in .stat{
    animation:rise .65s cubic-bezier(.16,1,.3,1) both;
  }
  .card-grid.in .card:nth-child(1), .stat-grid.in .stat:nth-child(1){animation-delay:.04s;}
  .card-grid.in .card:nth-child(2), .stat-grid.in .stat:nth-child(2){animation-delay:.12s;}
  .card-grid.in .card:nth-child(3), .stat-grid.in .stat:nth-child(3){animation-delay:.2s;}
  .card-grid.in .card:nth-child(4), .stat-grid.in .stat:nth-child(4){animation-delay:.28s;}
  .how-track.in .how-card:nth-child(1){animation-delay:.04s;}
  .how-track.in .how-card:nth-child(2){animation-delay:.14s;}
  .how-track.in .how-card:nth-child(3){animation-delay:.24s;}
  .how-track.in .how-card:nth-child(4){animation-delay:.34s;}
  :global(html.js) .how-track:not(:global(.in)) .how-card{opacity:0;}

  /* La ligne du parcours se trace quand la section entre à l'écran. */
  .how-line{transform:scaleX(0); transform-origin:left;}
  .how-track.in .how-line{transform:scaleX(1); transition:transform 1.1s cubic-bezier(.16,1,.3,1) .1s;}

  /* Le pictogramme de service accuse le survol. */
  .card-icon{transition:transform .28s cubic-bezier(.34,1.56,.64,1), background .22s ease;}
  .card:hover .card-icon{transform:scale(1.09) rotate(-4deg); background:#CFEAE1;}

  /* La réponse de la FAQ se déplie au lieu d'apparaître d'un coup. */
  @keyframes unfold{ from{opacity:0; transform:translateY(-6px);} to{opacity:1; transform:translateY(0);} }
  .faq-item p{animation:unfold .3s ease both;}

  @media (prefers-reduced-motion: reduce){
    .hero-copy > *, .hero-shot-wrap, .phone,
    .pv-greet, .pv-balance, .pv-quick, .pv-section-row, .pv-row, .pv-nav, .pv-body > .pv-section,
    .hero-blob, .card-grid.in .card, .how-grid .how-card, .stat-grid.in .stat,
    .faq-item p{animation:none !important; opacity:1 !important; transform:none !important;}
    .how-line{transform:scaleX(1);}
    :global(html.js) .how-track:not(:global(.in)) .how-card{opacity:1;}
  }


  /* ---------- Animations complémentaires ---------- */
  /* Le solde et les chiffres montent d'un cran à l'apparition. */
  @keyframes count{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
  .stat-grid.in .stat-val{animation:count .6s cubic-bezier(.16,1,.3,1) both;}
  .stat-grid.in .stat:nth-child(1) .stat-val{animation-delay:.1s;}
  .stat-grid.in .stat:nth-child(2) .stat-val{animation-delay:.18s;}
  .stat-grid.in .stat:nth-child(3) .stat-val{animation-delay:.26s;}
  .stat-grid.in .stat:nth-child(4) .stat-val{animation-delay:.34s;}

  /* Les puces de la section portefeuille arrivent en cascade. */
  .wallet-copy.in .wallet-list li{animation:rise .55s cubic-bezier(.16,1,.3,1) both;}
  .wallet-copy.in .wallet-list li:nth-child(1){animation-delay:.1s;}
  .wallet-copy.in .wallet-list li:nth-child(2){animation-delay:.18s;}
  .wallet-copy.in .wallet-list li:nth-child(3){animation-delay:.26s;}
  .wallet-copy.in .wallet-list li:nth-child(4){animation-delay:.34s;}
  .wallet-list i{transition:transform .28s cubic-bezier(.34,1.56,.64,1), background .2s ease;}
  .wallet-list li:hover i{transform:scale(1.12) rotate(-5deg); background:#CFEAE1;}

  /* La carte solde du portefeuille flotte doucement. */
  .wv-card{animation:floatCard 6s ease-in-out infinite;}
  @keyframes floatCard{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
  .wallet-visual.in .wv-line{animation:slideIn .5s cubic-bezier(.16,1,.3,1) both;}
  @keyframes slideIn{ from{opacity:0; transform:translateX(-10px);} to{opacity:1; transform:translateX(0);} }
  .wallet-visual.in .wv-line:nth-child(2){animation-delay:.16s;}
  .wallet-visual.in .wv-line:nth-child(3){animation-delay:.24s;}
  .wallet-visual.in .wv-line:nth-child(4){animation-delay:.32s;}

  /* Les lignes de tarif se dévoilent une à une. */
  .price-card.in .price-list li{animation:rise .5s cubic-bezier(.16,1,.3,1) both;}
  .price-card.in .price-list li:nth-child(1){animation-delay:.12s;}
  .price-card.in .price-list li:nth-child(2){animation-delay:.2s;}
  .price-card.in .price-list li:nth-child(3){animation-delay:.28s;}
  .price-card.in .price-list li:nth-child(4){animation-delay:.36s;}
  .price-amount{animation:count .7s cubic-bezier(.16,1,.3,1) both;}

  /* La FAQ se décale légèrement au survol. */
  .faq-item{transition:border-color .2s ease, transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease;}
  .faq-item:hover{transform:translateX(3px); box-shadow:0 6px 18px -12px rgba(15,23,42,.35);}

  /* Les éléments du pied de page s'éclairent au survol. */
  .foot-col a{transition:color .2s ease, transform .2s ease; display:inline-block;}
  .foot-col a:hover{transform:translateX(3px);}

  /* Le numéro d'étape accuse le survol de sa carte. */
  .how-num{transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;}
  .how-card:hover .how-num{transform:scale(1.1) translateY(-3px); box-shadow:0 14px 28px -10px rgba(0,122,94,.6);}

  /* Les puces de confiance du héros arrivent après le reste. */
  .hero-microtrust span{transition:transform .2s ease;}
  .hero-microtrust span:hover{transform:translateY(-2px);}

  /* Le bouton principal pulse discrètement une fois installé. */
  @keyframes ctaGlow{
    0%,100%{box-shadow:0 12px 28px -10px rgba(0,168,120,.55);}
    50%{box-shadow:0 12px 34px -8px rgba(0,168,120,.8);}
  }
  .hero-ctas .btn-primary{animation:ctaGlow 3.2s ease-in-out 1.4s infinite;}

  @media (prefers-reduced-motion: reduce){
    .stat-grid.in .stat-val, .wallet-copy.in .wallet-list li, .wv-card,
    .wallet-visual.in .wv-line, .price-card.in .price-list li, .price-amount,
    .hero-ctas .btn-primary{animation:none !important; opacity:1 !important; transform:none !important;}
  }

  .site :global(::selection){background:var(--green-bright); color:#fff;}
</style>
