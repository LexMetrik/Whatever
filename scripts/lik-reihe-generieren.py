#!/usr/bin/env python3
"""Generiert src/data/likReihe.ts aus der amtlichen BFS-Indexierungstabelle.

Monatlicher Pflege-Lauf — seit 5.10.2026 AUTOMATISCH (MONITOR, Auftrag David
«automatik-kandidaten»): .github/workflows/lik-nachzug.yml ruft scripts/lik/nachzug.sh;
das Skript ermittelt die Asset-ID, laedt die XLSX, ruft diesen Generator, prueft
«nur Anfuegung» und zieht die Export-Ratsche nach. Von Hand (gleiche Schritte):
  1) curl -sL https://www.bfs.admin.ch/asset/de/cc-d-05.02.08 -o <tmp>/lik-asset.html
  2) Asset-ID der DAM-URL «dam-api.bfs.admin.ch/hub/api/dam/assets/<ID>/master» ablesen,
     XLSX laden: curl -sL <dam-api…/master> -o <tmp>/lik.xlsx
  3) python3 scripts/lik-reihe-generieren.py <tmp>/lik.xlsx <Abrufdatum T.M.JJJJ> <Asset-ID>
  4) Danach die eingefrorene Export-Zeile des Teuerungsrechners nachziehen (sie traegt den
     letzten LIK-Monat und den PDF-sha; ohne Nachzug ist rechner-export-ratsche rot):
     RECHNER_EXPORT_SCHREIBEN=1 npx vitest run src/tests/rechner-export-ratsche.test.tsx
     (Beleg 5.10.2026: Nachfuehrung 2026-07 -> 2026-09 bewegte genau diese Zeile.)

Asset-ID (argv[3] oder Env LIK_ASSET_ID): sie wechselt je BFS-Publikation und steht darum
nicht in diesem Skript. Fehlt sie, wird die ID aus dem Kopf der bestehenden
src/data/likReihe.ts uebernommen (unveraenderter Nachlauf derselben Publikation).

Quelle: BFS «Landesindex der Konsumentenpreise, Indexierungstabelle»
(cc-d-05.02.08), Lizenz OPEN-BY (Quellenangabe Pflicht).
Hinterlegt werden die GERUNDETEN Originalbasen-Reihen ab Basis Sep. 1966
(BFS-Empfehlung für Indexierungszwecke; Verhältnis ist basisinvariant)."""
import os, re, sys, datetime, openpyxl

pfad = sys.argv[1] if len(sys.argv) > 1 else '/tmp/lik.xlsx'
# Abrufdatum (§7: Stand gehoert ans Artefakt). Default = Laufdatum, per argv[2]
# ueberschreibbar (Format T.M.JJJJ), damit ein Nachlauf das echte Abrufdatum traegt.
_h = datetime.date.today()
abrufdatum = sys.argv[2] if len(sys.argv) > 2 else f'{_h.day}.{_h.month}.{_h.year}'
ZIEL = 'src/data/likReihe.ts'
asset_id = sys.argv[3] if len(sys.argv) > 3 else os.environ.get('LIK_ASSET_ID', '')
if not asset_id and os.path.exists(ZIEL):
    _m = re.search(r'dam/assets/(\d+)/master', open(ZIEL).read())
    asset_id = _m.group(1) if _m else ''
if not re.fullmatch(r'\d+', asset_id):
    sys.exit(f'Asset-ID fehlt oder ungueltig ({asset_id!r}) — argv[3] oder LIK_ASSET_ID setzen.')
wb = openpyxl.load_workbook(pfad, read_only=True, data_only=True)
ws = wb['Index_m']
BASEN = ['1966-09','1977-09','1982-12','1993-05','2000-05','2005-12','2010-12','2015-12','2020-12','2025-12']
SPALTE = {b: i for i, b in enumerate(['1914-06','1939-08'] + BASEN, start=1)}
reihen = {b: {} for b in BASEN}
letzter = None
for r in ws.iter_rows(min_row=5, values_only=True):
    d = r[0]
    if not isinstance(d, datetime.datetime):
        continue
    key = f'{d.year}-{d.month:02d}'
    for b in BASEN:
        v = r[SPALTE[b]]
        if v in (None, ''):
            continue
        reihen[b][key] = round(float(v), 1)
        letzter = max(letzter or key, key)

zeilen = [
    '// ─── LIK-Monatsreihen (amtlich, generiert — NICHT von Hand editieren) ──────',
    '//',
    '// Quelle: Bundesamt für Statistik (BFS), Landesindex der Konsumentenpreise,',
    '// Indexierungstabelle cc-d-05.02.08 (Originalbasen, gerundet auf eine',
    '// Dezimalstelle — BFS-Empfehlung für Indexierungszwecke). Lizenz OPEN-BY,',
    '// Quellenangabe Pflicht. Regeneration: scripts/lik-reihe-generieren.py',
    '//',
    '// Amtliche Quelle (Live-Fassung, massgeblich — nie dieses Artefakt):',
    '//   Asset-Seite: https://www.bfs.admin.ch/asset/de/cc-d-05.02.08',
    f'//   XLSX-Master: https://dam-api.bfs.admin.ch/hub/api/dam/assets/{asset_id}/master',
    '//   (Asset-ID wechselt je BFS-Publikation; die alte ID 36773872 liefert nur den Stand 30.7.2026 —',
    '//    die aktuelle ID steht jeweils auf der Asset-Seite, Pflege-Lauf Schritt 2.)',
    f'// Abgerufen: {abrufdatum}. Frische-Tor: npm run check:lik-frische.',
    '//',
    f"export const LIK_LETZTER_MONAT = '{letzter}';",
    f"export const LIK_STAND = 'BFS-Indexierungstabelle bis {letzter} (abgerufen {abrufdatum})';",
    "export const LIK_QUELLE = 'Bundesamt für Statistik (BFS), Landesindex der Konsumentenpreise';",
    '',
    '// Je Originalbasis (Basismonat = 100) die Monatswerte ab Basismonat.',
    'export const LIK_REIHEN: Record<string, Record<string, number>> = {',
]
for b in BASEN:
    eintraege = ', '.join(f"'{k}': {v}" for k, v in sorted(reihen[b].items()))
    zeilen.append(f"  '{b}': {{ {eintraege} }},")
zeilen.append('};')
zeilen.append('')
open(ZIEL, 'w').write('\n'.join(zeilen))
print(f'geschrieben: {ZIEL} — {sum(len(v) for v in reihen.values())} Werte, letzter Monat {letzter}')
