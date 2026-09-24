# Kantons-Tier-Karte — empirische Voll-Enumeration aller 26 Kantone

**Erstellt:** 23.6.2026 (Auftrag David «mach weiter mit den Gesetzen, freie Wahl»;
read-only Kantons-Karte zur Planung der 3-Tier-Import-Reihenfolge). ·
**Abrufdatum: 23.6.2026** ·
**Status: ERSTRECHERCHE** (Voll-Enumeration aller 26 Kantone, 0 Fetch-Fehler;
empirisch, ein Durchgang — Abnahme David ausstehend).

**Quelle + Stand:** LexFind-API (`/api/fe/{lang}/fulltext-search`, Entdeckungs-
Schicht, §7/§8 nicht massgebend) — Voll-Enumeration aller 26 Kantone read-only am
**23.6.2026** über `enumeriereKanton` + `tierVerteilung` (scripts/normtext/
lexfind-discovery.ts). `active_only:true`, `lang:de` einheitlich (Romandie:
Tier-Klassifikation ist host-/pfadbasiert und sprachunabhängig; Trefferzahl kann
bei fr/it leicht abweichen). 0 Fetch-Fehler dank Retry-Härtung (`netz-retry.ts`).

**Zweck:** Import-Reihenfolge planen — welche Kantone sind mit dem bestehenden
`adapter-lexwork` (Tier A) ohne neuen Parser erschliessbar, welche brauchen die
noch zu bauende PDF-/PDF-embed-Pipeline.

## Ergebnis (sortiert nach Tier-A-Anteil)

| KT | total | A-struktur | C-embed | unbekannt | Einordnung |
|----|------:|-----------:|--------:|----------:|------------|
| BS | 910 | 910 | – | – | voll Tier A |
| BL | 859 | 859 | – | – | voll Tier A |
| FR | 812 | 811 | – | 1 | Tier A (1 Ausreisser) |
| SG | 731 | 731 | – | – | voll Tier A *(LexWork)* |
| BE | 703 | 703 | – | – | voll Tier A |
| VS | 688 | 688 | – | – | voll Tier A |
| ZG | 668 | 668 | – | – | voll Tier A |
| LU | 629 | 629 | – | – | voll Tier A |
| SO | 532 | 532 | – | – | voll Tier A |
| OW | 517 | 517 | – | – | voll Tier A |
| GL | 481 | 481 | – | – | voll Tier A |
| AG | 471 | 471 | – | – | voll Tier A |
| TG | 460 | 460 | – | – | voll Tier A |
| SH | 430 | 430 | – | – | voll Tier A |
| AI | 420 | 420 | – | – | voll Tier A |
| GR | 419 | 419 | – | – | voll Tier A |
| NW | 401 | 401 | – | – | voll Tier A |
| UR | 377 | 377 | – | – | voll Tier A |
| AR | 331 | 331 | – | – | voll Tier A *(bereits importiert)* |
| ZH | 941 | – | 941 | – | Tier C (zh.ch-zhlex) |
| VD | 900 | – | – | 900 | unbekannt (Host fehlt im Klassifizierer) |
| GE | 862 | – | 862 | – | Tier C (silgeneve.ch) |
| JU | 855 | – | 855 | – | Tier C (rsju.jura.ch) |
| NE | 827 | – | 827 | – | Tier C (rsn.ne.ch) |
| SZ | 424 | – | 424 | – | Tier C (www.sz.ch) |
| TI | 621 | – | – | 621 | unbekannt (Host ≠ m3.ti.ch) |

## Deterministische Folgerungen

1. **19 Kantone sind voll Tier A** (≈ 10'838 Erlasse inkl. AR) — mit dem
   bestehenden `adapter-lexwork` ohne neuen Parser importierbar, gleiche
   bewiesene Pipeline wie AR. **18 davon noch nicht importiert** (≈ 10'507
   Erlasse). Das ist der billige, hochsichere Ausbau-Block.
2. **Import-Reihenfolge-Empfehlung:** nach Volumen/Praxisnähe absteigend
   (BS → BL → FR → SG → BE → VS → ZG → LU → …), batchweise je Kanton ein Lauf,
   Status `entwurf` + Confidence-Quarantäne (§8, keine David-Fachzeit nötig).
   FR-Ausreisser (1 unbekannt) im Lauf prüfen.
3. **Tier C (PDF-embed), 5 Kantone:** ZH 941, GE 862, JU 855, NE 827, SZ 424 —
   Host vom Klassifizierer erkannt, aber die PDF-embed-Import-Pipeline ist noch
   nicht gebaut → Backlog (FAHRPLAN-GESETZE-IMPORT-3TIER Tier C; seit 24.9.2026 `archiv/FAHRPLAN-GESETZE-IMPORT-3TIER.md`).
4. **2 Kantone unbekannt:** **VD 900** (kein Host-Muster im Klassifizierer) und
   **TI 621** (Host ≠ `m3.ti.ch` — vermutlich neuer Host/leere `original_url`).
   Quick-Follow-up: je eine `original_url` prüfen und Host-Muster in
   `PDF_EMBED_HOST` (bzw. Strukturhost) ergänzen — danach fallen sie in B/C.

## Pflegebedarf

Trefferzahlen sind ein Discovery-Schnappschuss (Stand 23.6.2026, `active_only`).
Beim tatsächlichen Import bestimmt die LexWork-`current_version` je Erlass den
Stand + Drift-Token (§7); diese Karte ersetzt das nicht, sie priorisiert nur.

**Abnahme-Status:** Erstrecherche 23.6.2026, empirisch (Voll-Enumeration, 0
Fehler). Ergänzt [lexfind-clex-quellen.md](lexfind-clex-quellen.md).
