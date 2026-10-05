# FAHRPLAN — Optimierungs-Research Juli 2026 (Ablage, Stand 12.7.2026)
<!-- @lagebild name: Betriebs-Optimierung · zweck: Kleinere Betriebs- und Auslieferungs-Verbesserungen. -->

> **Eingefroren 5.10.2026:** Spezifikation, kein Bau-Stand; Fortschritts-Häkchen werden nicht mehr nachgeführt; Entscheidtabellen gelten unverändert.

> **Nur Plan, kein Bau.** Ergebnis des allgemeinen Ultracode-Optimierungs-Research
> (Auftrag David 12.7.2026) nach adversarialer Kritik-Filterung (10 Stichproben
> repo+live verifiziert, 0 Befunde widerlegt, 2 Prämissen veraltet). Detailquelle
> zum ROADMAP-Querschnitt **`QS-OPT`** (§14.1). Bereits abgedeckte Flächen werden
> **nur referenziert, nie dupliziert**: UI-Navigation (W2·10), Design/Wärme (W2·11),
> Code-Hygiene (W2·12), Token-Ökonomie (QS-TOK ✅), Performance (QS-PERF a+b ✅),
> SEO/A11y (FAHRPLAN-SEO-A11Y-GOVERNANCE), Prozesskosten (FAHRPLAN-PROZESSKOSTEN-COCKPIT),
> Currency (QS-CURRENCY/FAHRPLAN-FEDLEX-PORTFOLIO), Katalog-Triage (KATALOG-ROADMAP.md).

**Leitplanken-Bilanz der Kritik:** Alle Werkzeug-/Vorlagen-Befunde stehen unter der
**§0a-Sperre** (`FAHRPLAN-GRUNDLAGEN.md`, «keine neuen Engines») und sind in
`KATALOG-ROADMAP.md` bereits Fall-für-Fall triagiert (Entscheid-Spalte «offen», David
entscheidet einzeln) → O-6. Die SEO-Befunde liegen in der von David geparkten Zone
(«Reines SEO geparkt», ROADMAP-Querschnitt SEO-A11Y) → O-5, mit zwei Betriebs-Ausnahmen
(Soft-404, Case-Redirect → O-1). Unbeaufsichtigte Auto-Merge-Loops und Prod-DB-Secrets
in CI sind eine **neue §9-Qualität** → einmaliges Rahmen-Gate David in O-2.

**Veraltete Prämissen (vor Bau beachten):**
- Der P1-a/b-Rückstand («18 Pins überholt, Regex-Loch») ist **erledigt** (QS-CURRENCY
  Paket 1 ✅, PR #195, `main@21603bf0`, 0 stale). Das Frische-SLA verliert damit den
  akuten Aufhänger (Idee bleibt, Dringlichkeit runter).
- BGE-Bestandeszahlen driften zwischen Befunden (342 Suche / 562 BGer-Korpus / 594+11+2
  nach Sprache) — vor jedem Bau einmal aus `public/rechtsprechung/register.json` festnageln.
- Listeninternes Duplikat aufgelöst: das Vernehmlassungs-Netz-Tor ist Teilmenge des
  Monitor-Tore-Postens (O-1.3).

---

## §0 · Zweck

Detailquelle zu `QS-OPT` — Ablage des allgemeinen Ultracode-Optimierungs-Research
Juli 2026, **nur Plan, kein Bau**. Bereits abgedeckte Flächen werden **nur
referenziert, nie dupliziert**: UI-Navigation (W2·10), Design/Wärme (W2·11),
Code-Hygiene (W2·12), Token-Ökonomie (QS-TOK), Performance (QS-PERF), SEO/A11y,
Prozesskosten, Currency (QS-CURRENCY), Katalog-Triage.

---

## §1 · ROADMAP-Spec QS-OPT (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «O-1» … «O-6» und «Empfohlene Reihenfolge» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.*

  Kritik-gefilterte Ablage des allgemeinen Ultracode-Optimierungs-Research (Auftrag David
  12.7.2026; 0 Befunde widerlegt, 2 Prämissen veraltet). Detailquelle
  **`FAHRPLAN-OPTIMIERUNG-2026-07.md`**: **O-1 Betrieb & Wachhund** (sofort baubar: CSP-Fix
  LiveSuche [Prod-Feature empirisch tot], Prod-Smoke + alle 10 Netz-Tore im Normen-Monitor,
  Soft-404-Rewrite-Ausnahmen, Case-Redirect, LIK-Freshness-Tor, `laden.ts`-Fehler-Cache,
  Zefix/geo-Vertragstests; `/api/fehler` = Mini-Gate Datenschutztext) · **O-2 Frische-Automatik**
  (sofort baubar, Verortung QS-CURRENCY/QS-DATA; **terminkritisch: Batch-Re-Pin vor dem
  1.8.-Berg — 10 Erlasse fällig, check:verfall-Vorlauf läuft**; einmaliges David-Rahmen-Gate
  für unbeaufsichtigte Repair-PRs + Turso-CI-Secret) · **O-3 Prüf-Tore** (Golden-Matrix
  prozesskosten/beurkundung/grundbuch/notariat = grösster Rechen-Blindspot →
  waitForTimeout-Abbau+Flake-Telemetrie → e2e-Sharding → erst dann e2e-Masse) ·
  **O-4 FR/IT-Zugang** (sofort: Alias-Tabelle CO/CC/CP/LP, FR|IT-Chips; klein-Gate David:
  DE-Filter der BGer-Pipeline heben) · **O-5 SEO-Nachträge** (GEPARKT, als §10 in
  `FAHRPLAN-SEO-A11Y-GOVERNANCE.md` einsortiert) · **O-6 Werkzeug-Empirie** (DAVID-GATE §0a,
  als Notiz-Block in `KATALOG-ROADMAP.md` §D verortet). **Nur Plan — kein Bau in diesem Schritt.**
  **■ Folgeaufträge Aufräum-Session 27.7.2026** *(Übergabe; Befunde der Gegenprüfungen zu
  PR #391–#393, Verortung QS-OPT — je eigener Bau-Schritt, Risiko-Pfade ⇒ `QS-GP`)*:
  **(F-a)** Aufgehoben-Marker auf die übrigen Kantone ausweiten — 289 leere Artikel ausserhalb
  BS/GL (AG 5 · AI 15 · AR 12 · BE 1 · BL 56 · FR 15 · GR 2 · LU 8 · NW 15 · OW 39 · SG 62 ·
  SH 2 · SO 28 · TG 23 · VS 1 · ZG 5), gleiche verschärfte Signal-Regel wie PR #392 (amtliches
  Aufhebungssignal, nie blosse Leere) ·
  **(F-b)** Kanton-Currency klären — BS-121.110 trägt veralteten `fassungsToken` (Artefakt
  2024-10-01 ≠ live; §§ 30a/31/32 würden markiert) und BS-861.520 §10 hängt hinter der Fassung
  vom 2.7.2026: es fehlt ein Drift-Tor für Kantons-`fassungsToken` analog `check:fedlex-versionen` ·
  **(F-c)** 3 snapshot-seitige Marginalien-Divergenzen — BS-561.111 §66/§67 (alte
  Entity-Tabelle „ / “) + BS-861.520 §10 (siehe F-b); Sidecar ist die quellentreue Seite
  (Gegenprüfung #393 live belegt) ·
  **(F-d)** NBSP-Faltung in `bereinige()` (adapter-lexwork) UND Sidecar-Pfad: `\s+`-Kollaps
  frisst U+00A0 — Verstoss gegen die Verbatim-Regel (Skill scraping-swiss-official-sources);
  Umfang korpusweit erheben, dann Fix + Regeneration. Beleg SO-614.11 §256bis. ·
  **(F-d-Bund, Nachtrag 28.7.2026)** Die NBSP-Faltung betrifft nicht nur den Kanton-Pfad:
  alle 227 Bund-Snapshots enthalten **null U+00A0** (ChemRRV amtlich allein 2359 `&nbsp;`) —
  Entscheid nötig, ob die Faltung gewollt ist; Umfangserhebung von F-d auf Bund ausweiten. ·
  **(F-f)** Hochgestelltes `bis`/`ter` in **Gliederungs-Überschriften** wird verschluckt —
  zwei rechtlich verschiedene Ziffern tragen dieselbe Nummer (ChemRRV Anh. 2.15 zweimal «6.6»:
  amtlich `6.6` Zahlungen an Dritte und `6.6bis` Rückerstattung; Breite über alle 227
  Bund-Caches: **6 Erlasse, 33 Überschriften** — CHEMRRV 26/27 · IVG 1/17 · ENTG 1/4 ·
  GSCHV 2/2 · LRV 2/2 · AMBV 1/2; Artikel-Ebene korrekt, keine Regression, vor/nach #383
  identisch). Fix ändert Golden ⇒ eigener fachlicher Schritt (§6.3), Risikopfad ⇒ `QS-GP`. ·
  **(F-e)** Vier fail-closed-Auflagen aus GP-Runde 3 zu PR #400 (`check:fedlex-abk-netz`,
  Register 28.7.2026; keine erzeugt ein Falsch-Urteil, am Live-Korpus mit 197 fremden SR
  unerreichbar): `noetigeFremde` 6 → `FUELLUNG+1` heben + Meldung «keine zweite Wertemenge
  konstruierbar» von «Endpoint kappt» trennen (§8) · Doku-Wortlaut «irgendeiner Nachfrage» an
  Code («aussagekräftige») angleichen · `nichtAbsicherbar` maskiert danebenliegende
  Befunde (8 über 4 SR gemeldet, 3 gelistet) — itemisieren · Hauptlauf nutzt feste
  Batch-Komposition ohne Selbstheilung, falls sie je deterministisch kappt.
  **■ Folgeaufträge Verzahnungs-Session 28.7.2026** *(Übergabe; Befunde der 9 GP-Runden zu
  #401 + B4–B6-Bauten; je eigener Schritt, Risiko-Pfade ⇒ `QS-GP`)*:
  **(G-a)** Literatur-Phantome schliessen — `zitierteNormen`-Zweig ungefiltert (158 Paare auf
  main, 4 neu; Beleg MSTG/171c ← zh_obergericht_UE240310) **plus** 39 Fliesstext-
  Bereichszitat-Phantome kantonaler Kanten («Art. 1-456 ZGB» im Kommentar-Titel; Spannen-Regel
  greift nicht) — Literatur-Kontext-Regel auf beide Zweige ausdehnen, Backfill, `QS-GP` ·
  **(G-b)** Bestands-Namensvettern fixen: EPG ← bge_149_I_161 («LEP; BLV 340.01», waadtländisch)
  und IRSG ← bge_150_II_105 («AIMP; BLV 726.91») + BETMG/305bis ← SB.2020.92
  (`artikelSchluesselMitBefund` erzeugt STGB- UND BETMG-Key; BetmG hat keinen 305bis) —
  alle im Code benannt, ändern proNormArtikel ⇒ deklarierter Schritt, `QS-GP` ·
  **(G-c)** `gewicht`-Zitiergraph für kantonal/eidg: Geschäftsnummern-Formen (BES.2026.15,
  E-165/2026, SK.2025.57) in `kanonZitat` aufnehmen, dann gewicht statt null ·
  **(G-d)** Aufräum-Schritt tote V1a-Eingänge: `ArtikelLeser.leitfaelle`/`LeitfallZeile`/
  `leitfaelleFuer` + CSS `data-leitfaelle="aus"` ohne Auslöser (benannt-tot seit #403/#404) ·
  **(G-e)** GFK≠FK-Entscheid David (SR 0.142.30, Aktenlage `bibliothek/recherche/
  fedlex-abkuerzungen-titleshort.md`; mechanisch harmlos, reine Anzeige-/Massgeblichkeitsfrage) ·
  **(G-f)** Klein-UX aus B5/B6: Rand-Klemmung des Ansicht-Menüs bei ~320 px — ursprüngliches
  `LeserAnsichtMenu.tsx` in H5 gelöscht (21.8.2026), Nachfolger `LeserAnsichtV3.tsx` hat
  denselben rechts-verankerten Dropdown (`absolute right-0 top-full … max-w-[calc(100vw-2rem)]`,
  Zeile ~201) — Klemmungsrisiko bei schmalen Viewports damit weiterhin zu prüfen, nicht erledigt ·
  `schaetzeArtikelHoehe` kennt die Kanten-Zeile nicht (OR/41-Lade-CLS ~0.10 Bestand) ·
  KontextPanel lädt weiterhin den norm-index-Shard selbst (Doppel-Lade-Thema für W2·7-VZUI V2) ·
  **(G-g)** Dependabot-Wiedervorlage react-router (Fix erst mit react-router-dom 8.x;
  unstable-RSC-Pfad im Projekt nicht erreichbar, grep-belegt #399).
  Zusätzlich notiert (§8, kein Bau): `erzeugt`-Stempel bedeutet «Inhalt zuletzt geändert»,
  nicht «zuletzt gegen die Quelle geprüft» — bei einem künftigen Kanton-Currency-Tor (F-b)
  sauber trennen.


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-OPTIMIERUNG-2026-07.md`](../archiv/fahrplaene/FAHRPLAN-OPTIMIERUNG-2026-07.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- O-1 · Betrieb & Wachhund — SOFORT BAUBAR
- O-2 · Frische-Automatik — SOFORT BAUBAR, ein einmaliges David-Rahmen-Gate
- O-3 · Prüf-Tore nachziehen — SOFORT BAUBAR (harte Reihenfolge)
- O-4 · FR/IT-Zugang — teilbar (sofort / klein-Gate / geparkt)
- O-5 · SEO-Nachträge — GEPARKT (Verortung FAHRPLAN-SEO-A11Y-GOVERNANCE)
- O-6 · Werkzeuge/Vorlagen-Empirie — DAVID-GATE (Verortung KATALOG-ROADMAP.md)
- Verworfen / bewusst NICHT übernommen
- Empfohlene Reihenfolge (wenn David/Session Kapazität zieht)
- Bau-Status QS-OPT (additiv — nur Fakten, keine Freigaben)
