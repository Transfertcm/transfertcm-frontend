<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import Toast from '$lib/components/ui/Toast.svelte'
  import { chargerClarity } from '$lib/clarity'
  let { children } = $props()

  onMount(chargerClarity)
</script>

{@render children()}
<Toast />
