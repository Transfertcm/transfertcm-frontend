<script lang="ts">
  let {
    titre,
    valeur,
    icone,
    couleur = 'orange',
    tendance = '',
    tendanceHausse = true,
    sousTitre = '',
  } = $props<{
    titre: string
    valeur: string | number
    icone: string
    couleur?: 'orange' | 'jaune' | 'vert' | 'rouge' | 'bleu' | 'violet'
    tendance?: string
    tendanceHausse?: boolean
    sousTitre?: string
  }>()

  const mapCouleurs = {
    orange: { bg: 'bg-orange-50',  icone: 'text-orange-500', bordure: 'border-orange-100' },
    jaune:  { bg: 'bg-amber-50',   icone: 'text-amber-500',  bordure: 'border-amber-100' },
    vert:   { bg: 'bg-emerald-50', icone: 'text-emerald-500',bordure: 'border-emerald-100' },
    rouge:  { bg: 'bg-red-50',     icone: 'text-red-500',    bordure: 'border-red-100' },
    bleu:   { bg: 'bg-blue-50',    icone: 'text-blue-500',   bordure: 'border-blue-100' },
    violet: { bg: 'bg-purple-50',  icone: 'text-purple-500', bordure: 'border-purple-100' },
  }

  const c = $derived(mapCouleurs[couleur as keyof typeof mapCouleurs] ?? mapCouleurs.orange)
</script>

<div class="bg-white rounded-xl p-5 border border-slate-100 card-shadow card-shadow-hover">
  <div class="flex items-start justify-between">
    <div class="flex-1 min-w-0">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">{titre}</p>
      <p class="font-bold text-2xl mt-2 leading-none text-slate-900 animate-count-up">{valeur}</p>
      {#if sousTitre}
        <p class="text-xs text-slate-400 mt-1.5">{sousTitre}</p>
      {/if}
      {#if tendance}
        <div class="flex items-center gap-1 mt-2 animate-fade-in" style="animation-delay:.18s">
          <span
            class="material-symbols-outlined icon-filled {tendanceHausse ? 'text-emerald-500' : 'text-red-500'}"
            style="font-size: 14px;"
          >
            {tendanceHausse ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <span class="text-xs font-medium {tendanceHausse ? 'text-emerald-600' : 'text-red-600'}">
            {tendance}
          </span>
        </div>
      {/if}
    </div>
    <div
      class="hidden lg:flex w-11 h-11 rounded-xl {c.bg} border {c.bordure} items-center justify-center shrink-0 ml-3 stat-icon"
    >
      <span class="material-symbols-outlined {c.icone} icon-filled" style="font-size: 22px;">{icone}</span>
    </div>
  </div>
</div>
