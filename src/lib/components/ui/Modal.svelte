<script lang="ts">
  import { tick } from 'svelte'

  let {
    ouvert = $bindable(false),
    titre = '',
    largeur = 'md',
    children,
  }: {
    ouvert: boolean
    titre?: string
    largeur?: 'sm' | 'md' | 'lg' | 'xl'
    children?: any
  } = $props()

  const largeurs = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  function fermer() { ouvert = false }

  function surTouche(e: KeyboardEvent) {
    if (e.key === 'Escape') fermer()
  }
</script>

<svelte:window onkeydown={surTouche} />

{#if ouvert}
  <!-- Conteneur centré sans fond sombre -->
  <div
    class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none"
    role="dialog"
    aria-modal="true"
    aria-label={titre}
  >
    <div
      class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full {largeurs[largeur]} pointer-events-auto animate-fade-in-up max-h-[90vh] flex flex-col"
      style="box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10);"
    >
      {#if titre}
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 class="font-bold text-slate-900">{titre}</h3>
          <button
            onclick={fermer}
            class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Fermer"
          >
            <span class="material-symbols-outlined" style="font-size:18px">close</span>
          </button>
        </div>
      {/if}
      <div class="overflow-y-auto flex-1">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

