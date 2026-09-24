# FAHRPLAN — Kantonale Gesetze: 3-Tier-Import + Confidence-Quarantäne
<!-- @lagebild name: Kanton-Gesetze-Bündel · zweck: Breitenimport kantonaler Gesetze (26×-Slot, seriell). -->

> **Archiviert 24.9.2026** (verify-then-archive, `QS-DOKU-DIAET`): `W3·12` ist in `W2·13-KANTONE-DATEN`
> aufgegangen (Posten «Kantons-Massenimport …» dort; ROADMAP-CHRONIK.md, Fusionen 2026-09-24). Restpunkte sind noch zu
> extrahieren; die 26×-Slot-Prosa unten ist seit dem Plan-Neuschnitt 29.8.2026 überholt.

**Heimat: ROADMAP-Schritt `W3·12`.**

## §0 · Zweck

Detailquelle zu `W3·12` — alle kantonalen Gesetze sauber + klickbar abbilden, ohne
jedes Gesetz einzeln prüfen zu müssen. Datei-spezifisch: Auto-akzeptierte Imports
bleiben Status «entwurf», **nie** «geprüft»/«verified» ohne Davids Abnahme (§7/§8);
passt zur Abnahme-Zeitsperre bis 1.12.2026 (`FAHRPLAN-LERNPHASE-2026.md`).

**Auftrag David (22./23.6.2026):** alle kantonalen Gesetze sauber + klickbar auf
LexMetrik abbilden, OHNE jedes Gesetz einzeln prüfen zu müssen — besser als reines
PDF (klickbare Normen, Querverweise, mobil).

**Nordstern-Verankerung:** Breite (alle Kantone) ohne Davids Fach-Abnahme pro
Erlass → passt zur Abnahme-Zeitsperre bis 1.12.2026 (FAHRPLAN-LERNPHASE-2026.md
Strang A/B: Status-Marker + Verifikations-Infrastruktur, kein «geprüft» ohne David).

---

## §6 · ROADMAP-Spec W3·12 (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «3. Nächste Phasen» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  **SLOT-ÜBERGABE 20.7.2026: dieser Schritt hält jetzt den 26×-Slot.** E3 (`W2·6-DATA`) hatte ihn seit
  3.7.2026 belegt, war aber am selben Tag fertig — der Slot wurde 17 Tage lang nur nicht zurückgegeben und
  hat W3·12 grundlos geparkt gehalten. Übergabe folgt der `@slot-kette` und Davids Reihenfolge-Entscheid
  2.7.2026 («E3 zuerst, W3·12 danach»); Blocker `26x-slot` damit aufgelöst, Status `parked` → `ready`.
  **Achtung Umfang (§8, keine Schönung):** «ready» heisst hier *slot-frei und startbar*, nicht *klein*.
  Dies ist ein 26×-Massenimport; er steht bewusst weit unten in Welle 3 und läuft **nicht** an Davids
  laufender Queue vorbei. Vor dem Start gilt Leitprinzip 4 (nie zwei 26×-Assets parallel).
  §14-gebündelt (Phase 0): führende Detailquelle
  `FAHRPLAN-GESETZE-IMPORT-3TIER.md`; **BS-Sofortfixes S1–S13** = `archiv/FAHRPLAN-BS-VORBILDKANTON.md`
  (**S1–S13 sind gebaut** — die Datei trägt hier nur noch die Leitplanke «korpusweiter Adapter-Hebel
  VOR jedem Bulk», keine offene Arbeitsliste); Volltext-Kanton = `archiv/FAHRPLAN-RECHTSSAMMLUNG.md` (P6).
  BS-Pilot; Kantonale-Entscheide-Import hart **nachgelagert**, nie gleichzeitig. *Werkzeug-Funde (Audit 1):
  LexWork-Adapter auf dieselbe DOM-Parser-Infra wie der linkedom-POC heben (strikt NACH dessen Bestehen, B5);
  `pdfplumber` (Python) NUR als nicht-lasttragendes Gegenprüf-Skript, falls die TS-PDF-Extraktion
  (pdfjs-Koordinaten) belegt versagt (B3) — kein Sprachwechsel am Produktpfad.*
  **Zubringer (12.7.2026):** `FAHRPLAN-KANTONE.md §K-G5` liefert Priorisierung
  (ZH→BE→VD→AG→SG→LU→GE), Kern-Erlass-Inventarquelle und §7-Quell-Menü-Auflagen
  (kein Headless, lexfind nur Fakten-Signal) — dort einhängen, kein Parallel-Schritt.


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

6 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-GESETZE-IMPORT-3TIER.md`](../archiv/fahrplaene/FAHRPLAN-GESETZE-IMPORT-3TIER.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0. Ehrliches Verdikt zuerst (§8)
- 1. Architektur: Entdeckung ⟂ Anzeige (der LexFind-Trick)
- 2. Stand dieser Session (Branch `feat/gesetze-import-3tier`)
- 3. Nächste Phasen
- 4. Deine Idee «PDF-Vergleich → Markdown»
- 5. Anschluss an den Datenquellen-Denk-Brief
