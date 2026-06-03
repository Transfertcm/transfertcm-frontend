<script lang="ts">
  import Fr from 'svelte-flag-icons/Fr.svelte'
  import Gb from 'svelte-flag-icons/Gb.svelte'
  import It from 'svelte-flag-icons/It.svelte'
  import Es from 'svelte-flag-icons/Es.svelte'
  import Pt from 'svelte-flag-icons/Pt.svelte'
  import { locale, setLocale, supportedLocales, type LocaleCode } from '$lib/stores/locale'

  const flagComponents: Record<string, any> = { fr: Fr, gb: Gb, it: It, es: Es, pt: Pt }

  let ouvert = $state(false)

  function choisir(code: LocaleCode) {
    setLocale(code)
    ouvert = false
  }

  function fermerSiExterieur(e: MouseEvent) {
    const cible = e.target as HTMLElement
    if (!cible.closest('[data-lang-switcher]')) ouvert = false
  }

  const currentLang = $derived(supportedLocales.find(l => l.code === $locale))
  const CurrentFlag = $derived(flagComponents[currentLang?.flag ?? 'fr'])
</script>

<svelte:window onclick={fermerSiExterieur} />

<div class="relative" data-lang-switcher>
  <button
    type="button"
    onclick={() => ouvert = !ouvert}
    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-sm font-medium text-slate-600"
    aria-label="Changer de langue"
  >
    <span class="w-5 h-auto overflow-hidden rounded-sm shrink-0 flex items-center">
      <CurrentFlag size="20" />
    </span>
    <span class="hidden sm:inline uppercase text-xs font-bold tracking-wide">{$locale}</span>
    <span class="material-symbols-outlined text-slate-400" style="font-size: 14px;">
      {ouvert ? 'expand_less' : 'expand_more'}
    </span>
  </button>

  {#if ouvert}
    <div
      class="absolute right-0 top-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden z-50 min-w-[160px]"
      style="box-shadow: 0 8px 24px rgba(0,0,0,0.10)"
    >
      {#each supportedLocales as lang}
        {@const FlagComp = flagComponents[lang.flag]}
        <button
          type="button"
          onclick={() => choisir(lang.code)}
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-all text-left
            {$locale === lang.code ? 'font-bold text-orange-600' : 'text-slate-700 font-medium'}"
        >
          <span class="w-5 h-auto overflow-hidden rounded-sm shrink-0 flex items-center">
            <FlagComp size="20" />
          </span>
          <span>{lang.label}</span>
          {#if $locale === lang.code}
            <span class="ml-auto material-symbols-outlined text-orange-500" style="font-size: 16px;">check</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
