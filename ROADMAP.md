# LexMetrik — Bauplan

> **Zweck:** die eine Datei, aus der jede Session liest, wohin das Projekt geht (ZIEL), was gerade
> gebaut wird (JETZT) und was ansteht (EINGANG). Das *Wie* je Thema steht in `fahrplaene/` (eingefroren
> als Spezifikation, Slice per `npm run fahrplan -- <datei> <§>`), Einzelbefunde in `plan/posten/`.
>
> **Provenienz:** Modell seit 5.10.2026, Entscheid David (U1–U8 der Umstiegsvorlage wie empfohlen;
> Vault `03_Projekte/LexMetrik/inventar-optimierung-2026-10-04/umstieg-schlanker-plan-2026-10-05.md`).
> Alt-Fassung wörtlich: [`archiv/ROADMAP-bis-2026-10-05.md`](archiv/ROADMAP-bis-2026-10-05.md).
> *U1–U8* = Entscheidpunkte dieser Vorlage, «(a)» = die von David gewählte Option; *FB* = deren Anhang
> «Fehlerbestand» (gleicher Ordner), Zeilen-IDs wie B-76 gelten nur dort.
> **Grenze des Entscheids:** Vorlage §8 «Sofort» ist nicht freigegeben (dortige Punkte stehen nur als
> EINGANG-Zeilen); Budget-/Kostenentscheide und Merkzettel mit Davids Frage oder Abnahme nur auf sein Wort.

**Regeln**

1. **Form:** ZIEL · JETZT (höchstens 5 Vorhaben) · EINGANG (höchstens 30 Zeilen) · «Zurückgestellt
   und ruhende Fragen». Datei ≤ 15 KB (Warnung des Grössenwächters, kein Tor).
2. **Reihenfolge:** S (Sicherheit/Betrieb mit Frist < 30 Tage oder Betriebsausfall) > R (falscher
   Rechtsinhalt) > N (sichtbarer Fehler) > F (Fortschritt); ein JETZT-Platz gehört immer Phase 1.
3. **EINGANG:** eine Zeile je Sache, ≤ 200 Zeichen, Format
   `- <Klasse> · <Herkunft TT.MM.> · <Klartext> — <Ort>`; Klassen S, R, N, F (Fortschritt Phase 1),
   I (Idee/Auftrag). Erledigt = Zeile im erledigenden PR löschen. Über 30 Zeilen fällt die älteste
   Zeile ohne R, ohne Go und ohne Herkunft «David» weg (git behält sie).

Der letzte PR eines Vorhabens streicht es aus JETZT, legt erledigte Merkzettel nach `archiv/posten/`
und rückt nach Regel 2 nach (Meldung an David: Skill `bauschritt`). *Merkzettel* =
Dateien in `plan/posten/`, Gruppen über das Feld `dach:` (`grep -l '^dach: <DACH>' plan/posten/*.md`).

---

## ZIEL

**Nordstern (David 7.8.2026):** «In einem Jahr eine wirklich tolle und funktionierende Webseite, die
von allen Juristen und Rechtsanwendern gerne und häufig genutzt wird.» Seit 22.9.2026: **Produkt vor
Prozess.** Nur amtliche und urheberrechtsfreie Quellen, Korrektheit vor allem (CLAUDE.md §1, §7); vor
jeder Leser-Funktion: «Was bekommt ein Jurist hier, das Fedlex nicht bietet?»

**Phasen (Mandat 14.9.2026, «grundsätzlich würde ich zuerst mit dem bund beginnen»):**
1 · Bund fertig (läuft) · 2 · Kantone, erst nach gelandeter Phase 1 (U4 (a)) · 3 · Mehr als Fedlex,
erst nach gelandeter Phase 2.

**Phase 1 ist fertig, wenn** ein Schweizer Jurist **jedes** Bundesgesetz bei uns **vollständig**
(nichts fehlt, was amtlich dazugehört), **strukturgleich** (Gliederung, Randtitel, Fussnoten,
Schlusstitel, Anhänge, Tabellen an ihrem Platz) und **schneller als auf Fedlex** liest.
*Herkunft:* Satz der Session vom 14.9. in `fahrplaene/FAHRPLAN-BUND-FERTIG.md` §0, von David mit
«passt so, lande den plan» freigegeben; unverändert.

**Nicht jetzt:** Kantone-Ausbau, Phase 3, Design-Feinschliff, Reichweite/Domain (David 21.9.).
«Geprüft» setzt nur David.

**Messung Phase 1** — U2 (a): je Merkmal ein Messlauf, kein Tor; U3 (a): «jedes Bundesgesetz» = alle
~5100 SR-Erlasse.

| Merkmal | Messung je Lieferung von ≤ 500 Erlassen (Messlauf, kein Tor) | erfüllt, wenn | heute (5.10.2026) |
|---|---|---|---|
| jedes | Fedlex-Abfrage: geltende Erlasse mit deutscher Fassung, die bei uns fehlen | 0 | 231 Snapshot-Dateien (`ls public/normtext/bund/*.json \| wc -l`); Fahrplan nennt 238 gepinnte Erlasse, Differenz 7 ungeklärt; Ziel ~5100 (Schätzung) |
| vollständig | offene R-Fehler zu Textverlust, «aufgehoben», «Gilt seit» + Stichprobe ≥ 10 Erlasse Artikel für Artikel gegen Fedlex | 0, Stichprobe ohne Abweichung | 83 R-Zeilen im Fehlerbestand Bereich 1 (nicht alle betreffen diese Merkmale) |
| strukturgleich | je Erlass Zählung Gliederung, Randtitel, Fussnoten, Schlusstitel, Anhänge, Tabellen bei uns und bei Fedlex | 0 Abweichungen | nicht gemessen |
| schneller | Zeit bis zum ersten lesbaren Artikel, gleiches Gerät/Netz, Fedlex daneben: OR, ZGB, grosse Verordnung | alle drei schneller | nicht gemessen (laut Merkzettel OR 3,5 s oder 11,3 s) |

---

## JETZT

Kürzel = Präfix des Arbeitszweigs und Wert des Commit-Trailers `Roadmap:`. *FB* = Fehlerbestand im
Vault, `03_Projekte/LexMetrik/inventar-optimierung-2026-10-04/fehlerbestand-2026-10-05.md` (Zeilen-IDs
nur dort gültig; Angaben aus Merkzetteln, vor der Behebung gegen die amtliche Quelle prüfen, §7).

1. **Normen-Monitor wieder grün** (`MONITOR`) · S · Gegenprüfung ja
   *Herkunft:* rot seit 29.6. mit Unterbrüchen; Alarm #956 (ESKALATION, seit 21.9.).
   *Fertig, wenn* der Monitor-Lauf grün ist und #956 geschlossen.
   *Ort:* Dach `QS-MONITOR-ROT`; `fahrplaene/FAHRPLAN-OFFENE-BEFUNDE.md`.
2. **«Gilt seit» stimmt im Kern-Bund** (`GILTSEIT`) · R + Phase 1 · Gegenprüfung ja
   *Herkunft:* Mandat 14.9.; Entscheid David 4.10. «A, und C als eigenen Roadmap-Schritt anlegen»
   (#1305, 74b366602).
   *Fertig, wenn* ZGB 299, 300, 307 das amtliche Datum zeigen (Norm, Link, Stand), nicht leer und
   nicht 1978; StGB 52, SVG 89a, OR 631 richtig.
   *Ort:* Dach `W2·32-GENERALANWEISUNGEN`, `W2·27-BUND-FERTIG`; FB B-76, B-40, B-42, B-68.
3. **Bundestext vollständig** (`BUNDTEXT`) · R + Phase 1 · Gegenprüfung ja
   *Herkunft:* Herz-und-Nieren-Prüfung 24.9. (HN-05, Teile 2–4 offen).
   *Fertig, wenn* verworfene Absätze, Listen, Zwischentitel (69 Segmente in 24 Artikeln: StHG, VZV,
   OHG, BV, ZGB, DBG u. a.) im Leser stehen; AHVG-Anhang korrekt (vor Bau reproduzieren: Sonden
   widersprechen sich).
   *Ort:* Merkzettel `2026-09-25-hn-05-gesetzestext-vollstaendig-…`, Dach `W2·27-BUND-FERTIG`;
   FB B-16, B-21.
4. **Rechtslogik ohne falsche Ergebnisse** (`RECHTSLOGIK`) · R · **ausserhalb des Mandats** (U5 (a))
   · Gegenprüfung ja
   *Herkunft:* **Go David 23./24.9.** («einverstanden» zum Urner Tarif; «a» = Rechtslogik parallel in
   eigener Session; «Alle nach Empfehlung»).
   *Fertig, wenn* erst Tarife: Urner Verbandstarif rechnet nicht mehr, Grundpfand/Notariat/
   Gerichtskosten/MWST gegen amtliche Tarife belegt; dann Vorlagen: keine Werte aus abgewählten
   Formularzweigen, Klagefrist, PartG-, Werkvertragsfrist richtig — getrennte PRs.
   *Ort:* Dach `W2·30-RL-W2B`, `W2·30-RL-W2C`, `W2·30-RL-W3`, `QS-CODE-PROP`;
   `fahrplaene/FAHRPLAN-RECHTSLOGIK.md` (§4 Entscheide W-01…W-22); FB RV-17 bis RV-24, RV-06, RV-30,
   RV-31, RV-77.
5. **Urteilsdaten richtig zitiert** (`URTEILE`) · R · im Mandat 14.9. · Gegenprüfung nein (David
   25.9.: Urteilsdaten noch kein Risikopfad)
   *Herkunft:* Gegenprüfungen 24./25.9. und #1295.
   *Fertig, wenn* kein «Art. … BGE»-Phantomzitat mehr; Bündner Aktenzeichen und Gerichtsname amtlich;
   Vorinstanz im BGE-Kopf im Nominativ.
   *Ort:* Dach `QS-KORPUS`; FB U-04, U-16, U-24, U-03.

*Gewichen (U5 (a), offen gelegt):* die Tabellen im Bundestext (`W2·5l`, bisher Platz 3 der alten
Reihenfolge) — erste F-Zeile im EINGANG.

---

## EINGANG

```
- S · 5.10. · e2e/w224-r11-reiterleiste.e2e.ts «auch inaktive Reiter tragen ihre Registerfarbe»: 1. Versuch deterministisch rot (8/8), Ausnahmeliste zurückgebaut (QS-CI-ZEIT E2) — Wurzel beheben; FB S-24
- S · 5.10. · Läufer-Kontingent nach QS-CI-ZEIT beobachten (+3–4 Jobs je Lauf; Stau 2,8 min im Messlauf 37334185073) — Dach QS-CI-ZEIT
- S · 5.10. · tor-paritaet: (1) Sonde ignoriert Job-if (z. B. event_name != 'pull_request'), Tor in PR-gesperrtem Job zählt als PR-gedeckt; (2) check:perf-lighthouse gilt durch perf-kalibrierung.yml (--messen, ohne Assertion) als gedeckt — perf-nacht.yml könnte die Prüfung still verlieren (GP #1323) — Dach QS-CI-ZEIT
- S · Frist 20.10. · Such-DB (Turso) ~26.10. wieder erschöpft; Entscheid David 15.9. «nicht zahlen» beachten — FB S-10
- S · Frist ~Nov. · Rechtsprechungs-Register bei 91 % des Daten-Budgets, aufteilen — Dach QS-PERF; FB S-26
- S · 5.10. · Deploy nutzt npx vercel@latest; Such-API gibt Fehlertexte an Anonyme, DB-Fehler als «0 Treffer» — FB S-18
- S · Frist 20.10. · AUTOMERGE_TOKEN (lexmetrik-automerge-2026-09) läuft ab: David erneuert, setzt Repo-Secret neu — FB S-14
- S · 4.10. · Merge-Treiber regen behält eigenes daten-manifest.json ⇒ Hand-Regeneration je Daten-PR — Merkzettel 2026-10-04-merge-treiber-regen-…
- F · Mandat 14.9. · Tabellen im Bundestext (W2·5l, bisher Platz 3 der Reihenfolge) — fahrplaene/FAHRPLAN-NORMTEXT-DARSTELLUNG.md; Dach W2·5l-NORMTEXT-B2
- R · Go David 24.9. · Verweise: 371 falsche Selbstlinks + Verweisziele (HN-09), danach Normverweis öffnet eigenen Leser (HN-D1 «ja unbedingt») — FB V-06
- F · Mandat 14.9. · Bund vollständig: Lieferungen à ≤ 500 Erlasse — fahrplaene/FAHRPLAN-FEDLEX-PORTFOLIO.md §21
- F · Mandat 14.9. · OR/ZGB schneller als Fedlex — fahrplaene/FAHRPLAN-PERFORMANCE.md; Dach QS-PERF
- N · Go David 24.9. · Rest «eine Titel- und Abschnittsordnung» (HN-D2 gebaut #1190/#1197): Band-Rezept, Titelschrift — Dach W2·29-WERKBANK-NACHLAUF
- N · Go David 19.9. · Merkliste bauen (Reiterleisten-Abgleich) — Merkzettel 2026-09-18-reiterleisten-abgleich-merkliste-bauen
- N · Go David 8.8. · Kalender-Export: Termine als «frei» markieren — Merkzettel 2026-09-24-kalender-export-termine-als-frei-…
- N · Entscheid David 1.10. (a) · Deaktiviert-/Hover-Varianten vereinheitlichen — Merkzettel 2026-10-01-deaktiviert-hover-varianten-angleichen
- I · Entscheid David 2.10. · Rest-Rückbau tote Rechtsprechungs-Zeilen (revisionFuer gebaut #1276; Reste vor Bau reproduzieren) — Merkzettel 2026-10-02-rest-rueckbau-tote-rechtsprechungs-zeilen-…
- I · Freigabe David 22.9./Entscheid 1.10. (a) · einmalige Streich-Runde nie fündiger Tore (+ Sperrklinke 21.9.) — Dach QS-TORE-DIAET
- I · Auftrag David 3.10. · Regelsätze von eingewobenen Belegen entflechten — Merkzettel 2026-10-03-regelsaetze-mit-eingewobenen-belegen-…
- R · Sammel · übriger Bundestext — FB Bereich 1
- R · Sammel · übrige Urteilsdaten — FB Bereich 3; Dach QS-KORPUS
- R · Sammel · übrige Rechner und Vorlagen — FB Bereich 5; Dach W2·30-RL-*
- R · Sammel · Kantonstext — ruht bis Phase 2 (U4 (a)) — FB Bereich 2; Dach W2·13-KANTONE-DATEN
- R · David 21.9. · Impressum/Datenschutz/Nutzungsbedingungen — erst vor dem Live-Gang — Dach SEO-A11Y; FB S-01
- N · Sammel · Oberfläche und übrige Verweise — FB Bereiche 6 und 4
- I · 5.10. · Rückbau nach Umstieg: flaechenZeile (scripts/plan), trendZeile (steuerflaecheKern.ts), Rotation struktur-rotieren.py — cowork-Rest ci.yml:70
- I · 5.10. · Termin 8.10.: CI-Sparplan nachmessen (Ausgangswert 61 381 min/30 Tage, gleiche Methode) — Skill landung, «Nachmessung Sparplan»
- S · Sammel · Sicherheit/Betrieb übrige — FB Bereich 7
- S · Sammel · bekannte Prüf-Lücken auf Rechtsdaten, Gruppe «latent» — kein Bauauftrag — FB Teil C
- I · Sammel · Merkzettel mit Entscheid oder Frage Davids, ruhend — nicht nachfragen — FB Teil B
```

---

## Zurückgestellt und ruhende Fragen

*Nicht nachfragen, nicht erinnern.* Wortlaut der Sperren und Fragen: Alt-Fassung
[`archiv/ROADMAP-bis-2026-10-05.md`](archiv/ROADMAP-bis-2026-10-05.md), Blöcke `@blockers` und
`@david-fragen`.

**Zurückgestellt**

- **VPS** (`vps-bestellung-david`): Bestellung erst nach Phase 2 (Entscheid David 14.9.2026); bis
  dahin nur der Nicht-VPS-Teil von Suche/Datenhaltung. Dossier
  `bibliothek/betrieb/vps-bestell-dossier-2026-07-17.md`.
- **Richter-Analytik** (`richter-analytik-gate`, W3·15-RICHTER): RANKING und PROGNOSE gesperrt
  (David 22.9.2026: «bleibt gesperrt»); Filtern, Facette und Verlinkung sind frei und gebaut
  (#309/#311). Heikel: Standesrecht, Persönlichkeitsschutz, richterliche Unabhängigkeit.
- **Zielbild-Rückstellung 1.9.2026** (`zielbild-gesetzesleser`): Rechner-/Vorlagen-Ausbau,
  Design-Wärme, FINMA u. a. ruhen, bis Phasen 1–2 gelandet sind oder David einen Schritt vorzieht
  (FINMA: vorziehen, wenn ein externer Termin drängt). Reine Reihenfolge, kein Bau-Blocker.
- **BS-Lizenzanfrage** (`david-bs-lizenz-schluessel`, R12a): Anfrage nur noch optional (Recherche
  22.9.2026: Lizenz via data.bs.ch CC BY 4.0 weitgehend geklärt; Rest: Fussnoten/Änderungstabellen,
  undokumentierter Endpunkt); ob die Sperre fällt, entscheidet David.

**Ruhende Fragen an David**

- `aufgehobene-normen-schalter` — Leser-Schalter «aufgehobene Normen ausblenden» bauen oder bewusst
  streichen (Ausblenden verschweigt eine Lücke, §8)? · FAHRPLAN-ARCHIV-RESTPUNKTE §20
- `dienstjahr-stichtag` — Dienstjahr-Stichtag der Kündigungsfrist: Zugang der Kündigung (heute)
  oder Ende des Arbeitsverhältnisses? · archiv/HANDLUNGSPLAN.md Z. 211 (7.6.2026)
- `sperrtage-anzeige` — Konvention für die Anzeige der Sperrtage im Rechner? · archiv/HANDLUNGSPLAN.md
  Z. 212
- `export-antworten` — Verzugszins-Hinweis kürzen? DOCX-Standardannahmen? Bausteinprotokoll
  mitgeben? · archiv/HANDLUNGSPLAN.md Z. 213
- `gebv-schkg-rundung` — GebV SchKG 2 ‰/5 ‰: Hauskonvention 0.01 oder amtlich 0.05 (die GebV nennt
  keine Regel)? · archiv/HANDLUNGSPLAN.md Z. 217; verwandt W-22 (FAHRPLAN-RECHTSLOGIK §4)
- **Auto-Merge beim Fedlex-Abgleich** (altes E9, Vorschlag 4.10.) — Freigabe 16.7. «Ja, voll
  freigeben» widerspricht der Grenze «Gesetzesdaten nie automatisch mergen»: abschalten, nur reine
  Abrufstand-Nachführung automatisch, oder so lassen?

---

## Prüfung nach vier Wochen (ab Anfang November 2026)

- `ls plan/posten/*.md | wc -l` — schrumpft (Start 472 nach L3); mindestens zwei JETZT-Vorhaben
  sichtbar fertig.
- `wc -c ROADMAP.md` — unter 15 KB.
- `npm run prozess:kennzahlen` — Prozessanteil der Commits unter 30 % (25.9.: 207/582 = 35,6 % nach
  alter Betreff-Regel; nach Pfad-Regel seit 5.10. 200/546 = 36,6 %, 5.10. 193/635 = 30,4 %; Fenster 30 Tage, eine Ablesung am 20.10. zeigt noch überwiegend die Zeit vor dem Umstieg).
- `grep -n 'Go David' ROADMAP.md` — keine Marke älter als 14 Tage ohne Grund im Abschlussbericht.
