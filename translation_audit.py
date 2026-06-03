import re
import pathlib
from collections import defaultdict
root = pathlib.Path('frontend')
keys = set()
for p in root.rglob('*'):
    if p.suffix in {'.svelte', '.ts'}:
        text = p.read_text(encoding='utf-8')
        for m in re.finditer(r"\$t\(\s*['\"]([^'\"]+)['\"]\s*\)", text):
            keys.add(m.group(1))
text = (root / 'src/lib/stores/locale.ts').read_text(encoding='utf-8')
trans = defaultdict(dict)
lang = None
for line in text.splitlines():
    m = re.match(r"\s*([a-z]{2}):\s*{", line)
    if m:
        lang = m.group(1)
        trans[lang] = {}
        continue
    if lang and re.match(r"\s*}\s*,?\s*$", line):
        lang = None
        continue
    if lang:
        m = re.match(r"\s*(?:['\"]([^'\"]+)['\"]|([A-Za-z0-9_\.]+))\s*:\s*['\"](.+)['\"],?", line)
        if m:
            key = m.group(1) or m.group(2)
            trans[lang][key] = m.group(3)
print('used_keys', len(keys))
for lang in ['fr', 'en', 'es', 'pt']:
    miss = sorted(k for k in keys if k not in trans[lang])
    print(lang, len(miss))
    for k in miss[:100]:
        print('  ', k)
