# Kantonales Entscheiddatum — amtlicher Urteilskopf statt OCL `decision_date` (25.9.2026)

**Anlass:** Stichproben-Nachzug #1117 (25.9.2026) — 20 von 24 kantonalen Bestandsurteilen
zeigten ein falsches Entscheiddatum. **Entscheid David 25.9.2026 (Chat, «Variante A»):**
Korrektur aus dem amtlichen Urteilskopf. Roadmap: QS-KORPUS.

## Quelle und Stand

- OCL `https://mcp.opencaselaw.ch/api/decisions/{id}?fields=full` (Feld `full_text`,
  Anfang = Urteilskopf), abgerufen 25.9.2026.
- Amtliche Gegenprobe je Urteil (Identität Aktenzeichen + Kopfdatum, 25.9.2026):
  AG `decwork.ag.ch/api/main/v1/de/decrees_pdf/<n>`, BE `vg-urteile.apps.be.ch` (Tribuna),
  GR `entscheidsuche.gr.ch` (Tribuna), SG `publikationen.sg.ch` (PDF: S. 1 Deckblatt,
  ab S. 2 Entscheid), ZH `gerichte-zh.ch/fileadmin/user_upload/entscheide/oeffentlich/<Az>-O<n>.pdf`,
  BS `rechtsprechung.gerichte.bs.ch` (FindInfoWeb).

## Befund (Messung 25.9.2026, 42 kantonale OCL-Snapshots)

| Gericht | falsch | OCL `decision_date` ist … | Abweichung |
|---|---|---|---|
| gr_gerichte | 6/6 | Mitteilungs-/Publikationsdatum (Kopf: «Urteil vom … mitgeteilt am …») | +6 … +62 Tage |
| be_verwaltungsgericht | 5/12 (alle aus Abruf 26.6.) | späteres Datum | +23 … +29 Tage |
| sg_gerichte | 6/6 | Datum des nachfolgenden BGer-Urteils (B-Fälle) bzw. Plattform-Metadatum | −31 … +348 Tage |
| ag_gerichte | 5/6 | verschoben | −2 … +61 Tage |
| zh_obergericht | 0/12 | korrekt | — |

SG-Besonderheiten: (a) OCL führt bei den B-Fällen nur das **Publikations-Deckblatt**
(«St.Gallen Verwaltungsgericht 08.01.2025 B 2023/225 …» + Regeste + BGer-Nachgang
«wurde mit Urteil vom 22. Dezember 2025 abgewiesen») — der eigentliche Kopf steht erst im
amtlichen PDF ab S. 2. (b) Das Plattform-Feld «Entscheiddatum:» weicht zweimal vom Kopf des
Entscheids selbst ab: **BV 2024/21** Feld 04.07.2025 ↔ Kopf «Entscheid vom 4. August 2025»
(auch die Regeste nennt 4. August), **UV 2025/14** Feld/Kopfzeile 23.10.2025 ↔ Kopf «Entscheid
vom 21. Oktober 2025». Übernommen ist der Kopf. GR-neu (#1117): SBK 26 88 OCL 2026-09-20, Kopf
21.9.2026 (OCL-Rohwert, kein Zeitzonenfehler).

Bund (Stichprobe bger 5 / bvger 5 / bstger 3 mit Kopf, 25.9.2026): 13/13 `decision_date` =
Kopfdatum ⇒ Bund-Pfad unverändert.

BS (eigener Import, nicht OCL): Kopf «ENTSCHEID vom 5. Mai 2023» = Metadaten «Entscheiddatum:
05.05.2023» (AK.2022.32); die BS-Regel (`kopfDatum`, `scripts/rechtsprechung/bs-parse.ts`)
bleibt unberührt.

## Regel (deterministisch, §2)

`kopfEntscheiddatum` (`scripts/normtext/entscheid-kopfdatum.ts`), angewandt nur kantonal über
`kantonsEntscheiddatum` (`scripts/normtext/entscheid-kantonsdatum.ts`, angewandt in `mappeEntscheidOCL`):

1. Kopf-Bereich = erste 1500 Zeichen bis vor den ersten Stopp-Marker (in Sachen · betreffend ·
   Gegenstand · Parteien · Besetzung · Beteiligte · Sachverhalt · Erwägungen · Anfechtungsobj.).
2. Eigener Titel (geschlossene Liste: Urteil, Entscheid, Beschluss, Verfügung, Beschluss und
   Urteil, Urteil des Einzelrichters …, Versalformen) + «vom T. Monat JJJJ»; nicht nach
   Zitat-Vorwort («mit», «durch», «(» …) — schlägt die Plattform-Angaben.
3. Sonst Plattform: Feld «Entscheiddatum: TT.MM.JJJJ» oder SG-Kopfzeile «TT.MM.JJJJ <eigenes Az>»;
   widersprechen sie sich ⇒ `widerspruch` (kein Datum geraten).
4. OCL-Volltext ohne eigenen Titel ⇒ Kopf der Seiten 1–3 des amtlichen PDF (`pdf_url`/`source_url`).
5. Rückfall: OCL `decision_date` (im Lauf 25.9.2026: 0 Fälle).

Bestand: `npm run entscheide -- --datum=$(date +%F) --kopfdatum-refresh` (Netz; setzt nur
`datum` + `zitierung`; Identitäts-Tor court + Aktenzeichen; Abbruch ohne Schreiben, wenn ein
Snapshot nicht auflösbar ist).

## Geltung / Ausnahmen

Nur kantonale OCL-Gerichte (canton ≠ CH). Nicht erfasst: fr./it. Kopfformen (im kantonalen
Bestand 25.9.2026 nicht vorhanden → Rückfall). Kein Provenienz-Feld im Snapshot (Schema-Ausbau
bewusst vermieden) — Herkunft je Urteil steht im Log des Refresh-Laufs.

## Pflegebedarf

Neue Kantone/Gerichte: Kopfform an echten Köpfen prüfen und in
`src/tests/fixtures/entscheid-kopfdatum-auszuege.json` ergänzen. SG-Plattform-Abweichungen
(BV 2024/21, UV 2025/14) sind Quellbefunde, keine Code-Frage.

**Abnahme-Status:** maschinell verifiziert (42/42 gegen amtliches PDF/HTML), `verifiziert:false`,
fachliche Abnahme David offen.

## Ergänzung 4.10.2026 — Basel-Stadt, Hinweis-Feld `datumPortal` (QS-KORPUS)

Der Satz oben «BS … Kopf = Metadaten … die BS-Regel bleibt unberührt» (Stand 25.9.2026, Einzelprobe
AK.2022.32) ist **widerlegt** und bleibt als damaliger Beleg stehen. Anlass: Gegenprüfung (Opus) von
PR #1295, Abruf `rechtsprechung.gerichte.bs.ch` 4.10.2026: Portal-Metadatum «Entscheiddatum» ≠ Datum im
Urteilskopf («ENTSCHEID/URTEIL vom …») bei AUS.2026.85, BES.2025.105, BES.2025.117, VD.2025.146 und im
Bestand bei AUS.2022.46 (Urteilstext bestätigt den Kopf), AUS.2022.57, BES.2023.14, BEZ.2025.33.
**Entscheid David 4.10.2026 (Chat):** Variante A auch für Basel, Bestand berichtigen, «jeweils hinweis wenn
es abweicht».

- **Regel BS** (`waehleBsDatum`, `scripts/rechtsprechung/bs-parse.ts`): Kopf-Datum gewinnt; Rückfall
  Portal-Metadatum, dann der ehrliche Platzhalter (`datumUnbekannt`). Plausibilitäts-Wächter: Kopf-Datum vor
  dem GN-Jahr, nach der Erstpublikation, in der Zukunft oder mehr als 60 Tage vom Portal-Datum entfernt wird
  **nicht übernommen**, sondern als Verdacht ausgewiesen.
- **Bestand:** 3954 Rohdokumente neu geholt (Abruf 4.10.2026) und mit derselben Regel gelesen — **257
  Daten geändert** (6,5 %; Abstand −57 … +52 Tage), 31 Verdachtsfälle bleiben beim Portal-Datum, 0 nicht
  angefasst. Jede Änderung mit Kopf-Fundstelle und Portal-Link:
  [bs-datum-kopf-2026-10-04.md](bs-datum-kopf-2026-10-04.md) (generiert, `npm run entscheide:bs --
  --datum-kopf-berichtigung`; Rohdokumente zuvor per `--fetch-only`). Die frühere Stichprobe 4/31 ≈ 13 %
  überschätzte die Rate; massgeblich ist die Vollmessung. Ids bleiben stabil (ein docketSafe-Suffix trägt
  weiter das Portal-Datum).
- **Hinweis-Feld `datumPortal`** (optional im Snapshot): das Datum der Angabequelle, wo es vom Kopf abweicht
  (BS: Gerichtsportal; kantonale OCL-Gerichte: OCL `decision_date`). Der Entscheid-Kopf und der Lesemodus
  zeigen «Datum laut Urteilskopf; das Gerichtsportal / OpenCaseLaw nennt den …». Für die OCL-Kantone aus
  demselben Mapper (`mappeEntscheidOCL`), Bestand per `--kopfdatum-refresh`: 35 von 90 Snapshots tragen den
  Hinweis, kein Datum geändert, ZH ohne Abweichung.
- **Stichprobe/Tore:** die Wochenlauf-Stichprobe (`pruefeBs`) und das Tor `check:bs-entscheide` prüfen
  gegen dieselbe Regel (Kopf; Portal = `datumPortal ?? datum`), nicht mehr gegen das Portal-Feld allein (§6.7).
- **Abnahme-Status:** maschinell verifiziert (Identitäts-Gegenleser 257/257 gegen den Rohtext), `verifiziert:false`,
  fachliche Abnahme David offen.
