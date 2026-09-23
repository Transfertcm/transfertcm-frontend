<script lang="ts">
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { flip } from 'svelte/animate'
  import { toast } from '$lib/stores/toast.svelte'

  const icones: Record<string, string> = {
    succes: 'check_circle',
    erreur: 'error',
    avertissement: 'warning',
    info: 'info',
  }

  const couleurs: Record<string, string> = {
    succes: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    erreur: 'bg-red-50 border-red-200 text-red-800',
    avertissement: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const couleursIcone: Record<string, string> = {
    succes: 'text-emerald-500',
    erreur: 'text-red-500',
    avertissement: 'text-amber-500',
    info: 'text-blue-500',
  }
</script>

<div class="fixed top-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] flex flex-col items-end gap-2 pointer-events-none">
  {#each toast.toasts as t (t.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg w-full {couleurs[t.type] ?? couleurs.info}"
      in:fly={{ x: 320, duration: 320, easing: cubicOut }}
      out:fly={{ x: 320, duration: 240, easing: cubicOut }}
      animate:flip={{ duration: 220 }}
      role={t.type === 'erreur' ? 'alert' : 'status'}
    >
      <span class="material-symbols-outlined icon-filled shrink-0 mt-0.5 {couleursIcone[t.type]}" style="font-size: 20px;">
        {icones[t.type] ?? 'info'}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm break-words">{t.titre}</p>
        {#if t.message}
          <p class="text-xs mt-0.5 opacity-80 break-words">{t.message}</p>
        {/if}
      </div>
      <button
        onclick={() => toast.supprimer(t.id)}
        class="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fermer"
      >
        <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
      </button>
    </div>
  {/each}
</div>
