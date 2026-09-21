#!/usr/bin/env python3
"""Tokenverbrauch einer Claude-Code-Session aus den lokalen Transkripten (Mutter/Tochter-Messung, D2 21.9.2026).
Aufruf: python3 verbrauch-summe.py <worktree-pfad | projekt-slug> [--session <uuid>]
Zaehlt je Modell: naiv (jede Zeile mit usage, = Methode D1) UND entdoppelt (je message.id einmal; eine Antwort
steht im Transkript je Inhaltsblock auf einer eigenen Zeile mit DEMSELBEN usage-Feld)."""
import json, glob, os, sys, collections
arg = sys.argv[1]
sess = sys.argv[sys.argv.index('--session') + 1] if '--session' in sys.argv else None
slug = arg.replace('/', '-').replace('.', '-') if arg.startswith('/') else arg
root = os.path.expanduser('~/.claude/projects/' + slug)
files = glob.glob(root + '/**/*.jsonl', recursive=True)
K = ('input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens')
naiv = collections.defaultdict(lambda: collections.Counter()); dedup = collections.defaultdict(lambda: collections.Counter())
seen = {}; t0 = t1 = None; nfiles = 0
for f in files:
    hit = False
    for line in open(f, encoding='utf-8', errors='replace'):
        try: o = json.loads(line)
        except Exception: continue
        if sess and o.get('sessionId') != sess: continue
        ts = o.get('timestamp')
        if ts: t0 = min(t0 or ts, ts); t1 = max(t1 or ts, ts)
        m = o.get('message') or {}; u = m.get('usage')
        if not isinstance(u, dict): continue
        hit = True; mod = m.get('model', '?')
        for k in K: naiv[mod][k] += u.get(k) or 0
        naiv[mod]['zeilen'] += 1
        mid = m.get('id') or o.get('uuid')
        alt = seen.get(mid)
        if alt is None:
            alt = seen[mid] = dict.fromkeys(K, 0); dedup[mod]['antworten'] += 1
        for k in K:  # je Antwort das MAXIMUM je Feld (fruehe Zeilen tragen teils erst einen Zwischenstand von output_tokens)
            v = u.get(k) or 0
            if v > alt[k]: dedup[mod][k] += v - alt[k]; alt[k] = v
    nfiles += hit
print(f'slug={slug} dateien={nfiles} zeitraum_utc={t0} .. {t1}')
for name, d, n in (('NAIV (Methode D1)', naiv, 'zeilen'), ('ENTDOPPELT (je message.id)', dedup, 'antworten')):
    print(name)
    tot = collections.Counter()
    for mod, c in sorted(d.items()):
        print(f'  {mod:28s} {n}={c[n]:6d} out={c[K[1]]:>11,d} cache_write={c[K[2]]:>12,d} cache_read={c[K[3]]:>14,d} input={c[K[0]]:>9,d}')
        tot.update(c)
    print(f'  {"SUMME":28s} {n}={tot[n]:6d} out={tot[K[1]]:>11,d} cache_write={tot[K[2]]:>12,d} cache_read={tot[K[3]]:>14,d} input={tot[K[0]]:>9,d}')
