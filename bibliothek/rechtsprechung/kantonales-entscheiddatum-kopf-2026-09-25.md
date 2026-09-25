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
`kantonsEntscheiddatum` (`scripts/normtext/adapter-entscheide.ts`):

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
