from pathlib import Path

old = 'class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"'
new = 'class="fixed inset-0 z-50 grid place-items-center min-h-screen p-4 pointer-events-none"'
paths = [
    'src/routes/(app)/admin/salaires/+page.svelte',
    'src/routes/(app)/admin/uv/+page.svelte',
    'src/routes/(app)/admin/agents-promo/+page.svelte',
    'src/routes/(app)/admin/fraude/+page.svelte',
    'src/routes/(app)/admin/notifications/+page.svelte',
    'src/routes/(app)/admin/rapports/+page.svelte',
    'src/routes/(app)/admin/commandes/[id]/+page.svelte',
    'src/routes/(app)/admin/reclamations/+page.svelte',
    'src/routes/(app)/admin/parametres/+page.svelte',
    'src/routes/(app)/admin/cabines/[id]/+page.svelte',
    'src/routes/(app)/admin/cabines/+page.svelte',
    'src/lib/components/ui/Modal.svelte',
    'src/routes/(app)/admin/abonnements/+page.svelte',
]

root = Path(__file__).resolve().parents[1]
for rel in paths:
    path = root / rel
    if not path.exists():
        print(f'MISSING {path}')
        continue
    text = path.read_text(encoding='utf-8')
    if old not in text:
        print(f'NO MATCH {path}')
        continue
    path.write_text(text.replace(old, new), encoding='utf-8')
    print(f'UPDATED {path}')
