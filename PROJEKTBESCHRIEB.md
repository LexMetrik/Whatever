# LexMetrik — Projektbeschrieb

**Stand:** 21. Juli 2026 · **Produktion:** https://lexmetrik.vercel.app ·
**Repo:** github.com/davidgraf95-sys/LexMetrik · Marke: **LexMetrik** (grosses M)

Dieses Dokument beschreibt das Projekt als Ganzes: Idee, Prinzipien,
Architektur, Inventar, Qualitätssicherung und Pflege. Es ergänzt
`CLAUDE.md` (verbindliche Arbeitsprinzipien §1–§16), `STRUKTUR.md`
(laufend gepflegter technischer Stand, Session-Karten), `ROADMAP.md`
(DER eine Handlungsplan mit Bau-Reihenfolge), `FAHRPLAN-GESAMTAUFBAU.md`
(chronologische Ordnung: 7 Phasen bis zum Nordstern, Juli 2026 → ab Mitte
2027), `KATALOG-ROADMAP.md` (Praxis-Abdeckungskarte) und die
`bibliothek/` (recherchierte Grundlagen mit Quellen-Registern).

---

## 1. Was ist LexMetrik?

LexMetrik ist eine Schweizer Web-Anwendung mit dem Leitbild
**«Schweizer Taschenmesser für Juristen»**: DIE EINE Anlaufplattform für
alle Rechtsanwender (Kanzlei, Gericht, Behörden, Steuerbehörden,
Notariate, Treuhänder, Studierende), um das Schweizer Recht zu
konsultieren und damit zu arbeiten — ausschliesslich auf Basis
**amtlicher, urheberrechtsfreier Quellen** (Art. 5 URG, keine
Kommentare).

**Endziel (David 15.9.2026):** alles, was die Schweiz an amtlichen
Behördeninformationen hat, kennen, am einzelnen Artikel verknüpfen und
besser verlinken als die Quellen selbst — **Nachweisdatenbank statt
Volltextsammlung** (16.8.2026). Kopiert wird nur, was am Artikel etwas
zeigt, das der Link nicht kann (Zitat unter §7), und im eigenen Leser
gehalten wird nur, was er besser darstellt als die Quelle (heute die
Gesetze). Regel: `ROADMAP.md` Leitprinzip 8. Vier «Klingen»:

1. **Konsultieren** — Gesetze des Bundes und der Kantone (`/gesetze`)
   mit amtlicher Gliederung, Marginalien, Fussnoten, Fassungs-Timeline
   («gilt seit»-Badge) und Serif-Lesesicht; Rechtsprechung
   (`/rechtsprechung`) mit Entscheid-Leser, Regesten und klickbarer
   Gerichtsbesetzung; Materialien (`/materialien`: Botschaften,
   Vernehmlassungen, AS-Änderungshistorie) und Staatsverträge
   (`/international`). Split-View verzahnt Norm, Entscheid und Werkzeug
   nebeneinander.
2. **Rechnen** — deterministische Engines berechnen Fristen, Beträge,
   Quoten und Zuständigkeiten nach festen, offengelegten Rechenregeln —
   jeder Schritt mit Norm-Verweis, exportierbar als PDF-Rechenbericht,
   teils mit Kalender-/Zeitstrahl-Visualisierung, .ics-Export, Permalink
   und kopierfertigem Begründungs-Absatz «Für die Rechtsschrift».
3. **Vorlagen** — geführte Wizards setzen Dokumente aus **festen,
   juristisch vorformulierten Bausteinen** zusammen — mit harten
   Schranken für zwingendes Recht (Gates), Bausteinprotokoll,
   werkgetreuer Live-Vorschau und Export als PDF/DOCX (soweit die
   Formvorschrift es erlaubt).
4. **Finden** — eine deterministisch gerankte Suche (`/suche`) über
   Werkzeuge, Normen und Entscheide als Hauptzugang; dazu die
   Verzahnungs-Schicht (Norm↔Werkzeug-Brücke, Norm↔Entscheid↔Material
   als Burggraben-Graph).

**Das zentrale Produktversprechen: deterministisch gerechnet statt
KI-geschätzt.** LexMetrik nutzt kein Sprachmodell und keine
Wahrscheinlichkeiten in der Ausgabe. Gleiche Eingaben ergeben immer
dasselbe Ergebnis; jeder Rechenschritt und jeder Baustein ist
offengelegt und jede fest verdrahtete Norm artikelgenau auf den
konsolidierten Gesetzestext (Fedlex) verlinkt. Was sich nicht
regelbasiert abbilden lässt (Ermessen, Würdigung, Schätzung), wird
bewusst **nicht** angeboten. Massgeblich ist immer die amtliche
Fassung — gespeicherte Normtexte sind Snapshots mit Stand, Quelle-URL,
Live-Link und automatischer Drift-Erkennung (CLAUDE.md §7).

**EINE Hauptseite (`/`) für alle Zielgruppen** (Free/Pro-Zweiteilung
aufgehoben, 7.6.2026; Startseite V3 umgesetzt): Kachel-Katalog nach
juristischen Obergruppen, Suche als Hauptzugang, «Häufig
gebraucht»-Zeile, «Zuletzt verwendet» rein lokal. `/pro` und
`/fachpersonen` sind dauerhafte Redirects. Monetarisierung undefiniert
(STRATEGIE-PLATTFORM, Gate G1).

---

## 2. Prinzipien (Kurzfassung — verbindlich in CLAUDE.md §1–§16)

1. **Fachliche Korrektheit vor allem** (§1) — lieber Duplikat als eine
   Abstraktion, die zwei rechtlich verschiedene Fälle gleich behandelt.
2. **Determinismus ohne Ausnahme** (§2) — kein LLM, kein `Date.now()` in
   der Rechenlogik; nicht Regelbasiertes bleibt im Backlog.
3. **Schichtentrennung** (§3) — Rechtslogik nur in `src/lib/`,
   Darstellung nur in `src/pages/`/`src/components/`.
4. **Eine Engine pro Rechtsgebiet** (§4) — Verschmelzung nur
   Golden-gegated und regime-treu; geteilt wird nur fachneutrale
   Infrastruktur.
5. **Single Source of Truth** (§5) — Katalog, Vorlagen-Schemas,
   Formatvorlagen, Behörden-Stammdaten je genau einmal; für die
   Korpus-Inhalte ist das DB-Artefakt (`daten/*.db`) die EINE Quelle,
   `public/*.json` und Prerender sind byte-gleiche Projektionen daraus.
6. **Refactorings beweisen ihre Neutralität** (§6) — Golden-Output-
   Protokoll (byte-Vergleich, über 200 eingefrorene Fälle) + volle
   Test-/Lint-/Build-Läufe (`npm run gate`); Tests werden bei
   Refactorings nicht angepasst; Tore müssen scheitern können
   (Sabotage-Probe).
7. **Normen verifizieren, nicht vertrauen** (§7) — jeder Anker empirisch
   gegen Fedlex geprüft; Quell-Wahl empirisch (höchste verfügbare
   Struktur), Wechsel nur per Messung.
8. **Ehrlichkeit** (§8) — Status entwurf/geprüft/geplant zeigt den
   echten Prüfstand; «geprüft»/`verified: true` setzen Davids fachliche
   Abnahme voraus (Jurist, Anwaltsprüfung BS) — **aktuell trägt nichts
   diesen Status**. Formvorschriften bestimmen die Exportformate.
9. **Deploy-Disziplin** (§9) — Merge nach `main` = Live-Gang (Vercel
   Auto-Deploy); §9-Sorgfalt vor dem Merge; auf Risiko-Pfaden Merge nur
   nach adversarialer Gegenprüfung (`check:gegenpruefung`,
   `check:merge-schutz`).
10. **Design folgt dem Dach-Reglement** (§13) — `DESIGN-REGLEMENT.md`
    plus Domänen-Reglemente (Rechner, Rechtsprechung, Vorlagen,
    Normtext); Tokens statt Magic-Numbers, Verdikt zuerst, jeder
    Rechtswert mit Norm + Link + Stand.
11. **Ein Eingang für Aufträge** (§14) — `ROADMAP.md` ist der eine
    Handlungsplan; Fahrpläne sind Detailquellen, nie zweiter Einstieg;
    Trailer-Konvention `Roadmap: <ID>`; Kontext-Hygiene und
    Vertrauensgrenze für Agenten-Arbeit.
12. **Geräte-Last** (§15) — nicht merklich langsamer, ausser es drohte
    Logikverlust; Treue schlägt Tempo (`check:perf-budget` in CI).

---

## 3. Architektur

**Stack:** React 19 + TypeScript (strict) + Vite 8 + Tailwind 3 ·
Vitest (257 Testdateien) · Playwright-E2E (48 Specs, CI-Shards) ·
jsPDF (PDF), docx (DOCX) · Vercel (statisches Hosting, 63
Prerender-Routen).

**Datenhaltung in zwei Welten:**

- **Fall-/Nutzereingaben:** vollständig clientseitig, kein Backend,
  keine Datenübertragung (Berufsgeheimnis-Prinzip; «Zuletzt
  verwendet»/Sitzungen nur in localStorage).
- **Korpus-Daten** (Normtexte, Rechtsprechung, Materialien): kanonisch
  in `daten/` als SQLite-Artefakte (normtext.db ~187 MB ·
  rechtsprechung.db ~466 MB · soft-law.db), gespiegelt als HOT-Daten
  auf Turso (Ist: 1'458 Erlasse / 55'822 Artikel / 5'093 Entscheide);
  ausgeliefert als deterministische, byte-gleiche Projektionen nach
  `public/` (Paritäts-Tor) und prerenderte Seiten. Quellen: Fedlex
  (Bund, gepinnte Konsolidierungen), LexWork-API (Kantone),
  OpenCaseLaw/CC0-Korpora (Rechtsprechung; BGer-Massenkorpus 195'342
  Entscheide in der E3-Pipeline). Details: `FAHRPLAN-DATENHALTUNG.md`.

**Routen:** `/` · `/rechner(/:slug)` · `/vorlagen` ·
`/gesetze(/:ebene/:key)` · `/rechtsprechung(/:key)` ·
`/materialien(/:key)` · `/international` · `/suche` · `/abdeckung` ·
`/methodik` · `/ueber` · `/kontakt` · `/datenschutz` · `/einstellungen`.

**Code-Gliederung** (Auszug; Ist siehe `STRUKTUR.md`):

```
src/
├── lib/            Rechtslogik + Datenschichten (~96 Module), u. a.:
│   ├── Fristen (allgemein/ZPO/SchKG/Erb/Straf) · verzugszins ·
│   │   verjaehrung · teuerung (LIK) · sperrfristen · kuendigungsfrist ·
│   │   lohnfortzahlung · mietrecht · erbteilung · gewaehrleistung
│   ├── zustaendigkeit (Zivil/SchKG/Straf) · prozesskosten (26 Kt.) ·
│   │   bgerRechtsweg · beurkundung
│   ├── normtext/ · rechtsprechung/ · materialien/ · fristenspiegel/
│   ├── fedlex.ts (Norm-Anker-Registry) · konventionen.ts (Zitier-SSoT)
│   ├── startseiteConfig.ts (Katalog-SSoT) · katalogSuche.ts
│   ├── format.ts (Formatter-Heimat) · pdf/ (Rechenbericht)
│   └── vorlagen/   engine.ts (assemble) · formatvorlagen.ts ·
│                   behoerden.ts · ~40 Schemas · vorlagenPdf/Docx
├── data/           Stammdaten (Feiertage/Computus 26 Kt., LIK-Reihe,
│                   Behörden-Registries, Rechtsprechungs-Register)
├── components/     Darstellung (App-Shell mit Seitenleiste, Split-View,
│                   Wizard, Forms, Visuals, ui/)
└── pages/          ~77 Routen-Seiten (GesetzLeser, EntscheidLeser,
                    MaterialLeser, Suche, Rechner-, Vorlagen-Seiten)
scripts/            ~75 Werkzeuge: gate.sh · prerender ·
                    normtext-snapshot · golden-outputs · logik-sweep ·
                    datenhaltung/ (Turso-Sync) · ~40 check:*-Tore
daten/              SQLite-SSoT (Korpus) · public/ Projektionen
e2e/                48 Playwright-Specs
```

**Formatvorlagen & Form-Gates:** Dokumenttypen mit fixer Typografie;
`AusgabeArt` steuert hart, was exportiert werden darf (eigenhändiges
Testament → nur Abschreibe-Mustertext; notarielle Formen →
Wasserzeichen-Entwurf).

**Formulierungsstandard** (`konventionen.ts` + Linter über die echte
Textausgabe): ausgeschriebene Normzitate mit «lit.», BGE/BGer-Formate,
CHF-Apostroph, «5 %», Guillemets, ss statt ß, Halbgeviert.

---

## 4. Inventar (Stand 21.7.2026)

**Katalog:** 134 Karten im Code (Rechner + Vorlagen); Status-Verteilung
ca. 66 × `entwurf` · 86 × `geplant` (inkl. Szenarien-Substati) ·
**0 × `geprüft`**. Massgeblicher Zähler: `npm run report:inventur`;
Soll-Inventar: `KATALOG-ROADMAP.md` (Praxis-Abdeckungskarte).

**Rechner-Schwerpunkte (gebaut, Status entwurf):** kombinierter
Fristenrechner (Allgemein/ZPO/SchKG) · ZPO-/SchKG-/Erbrechts-/
Straf-Fristen · Verzugszins · LIK-Teuerung (Indexmiete, Unterhalt,
Wertsicherung) · Zuständigkeit in drei Rechtswegen (Zivil mit
Rechtsmittel-Fahrplan, Betreibung mit PLZ→Amt, Straf) · Prozesskosten
alle 26 Kantone (Art. 95/96 ZPO, inkl. BGer-Instanz) ·
Betreibungskosten (GebV SchKG) · Sperr-/Kündigungsfristen (Art.
335c/336c OR) · Lohnfortzahlung · Mietrecht-Fristen · Verjährung ·
Gewährleistung · Erbteilung/Pflichtteile · BGer-Rechtsweg.

**Vorlagen (gebaut, Status entwurf):** Testament · Patientenverfügung ·
Vorsorgeauftrag · Vollmacht · Arbeitsvertrag · Mietvertrag (inkl.
Untermiete) · Kündigungs-Familie (AN/AG/Mieter; Vermieter als
Checkliste ohne Export) · Schlichtungsgesuch (alle Kantone) · Klage im
vereinfachten Verfahren (BS-Pilot); weitere Schemas in Arbeit (u. a.
Klage ordentlich, NDA, Gründung AG/GmbH — Status je Schema in der
Registry).

**Rechtssammlung:** Bund über gepinnte Fedlex-Konsolidierungen
(Vollabdeckung je Erlass), Kantone via LexWork (73 Erlasse mit
amtlicher Gliederung; Kanton-Ausbau = aktueller 26×-Slot W3·12);
Fedlex-Portfolio: Botschaften, Vernehmlassungen, Staatsverträge,
AS-Änderungshistorie mit Fassungs-Timeline.

**Rechtsprechung:** amtliche BGE-Bände (404 amtliche BGE nachgezogen)
plus Entscheid-Korpus (5'093 Entscheide HOT; Besetzung extrahiert:
4'961 Entscheide, 19'467 Richter-Nennungen zugeordnet, Rubrum
klickbar); Regesten-Extraktion adversarial gegengeprüft;
BGer-Massenkorpus (191'304 Entscheide 1986–2026, CC0) in Etappen E3 ff.
(Serving blockiert bis VPS-Entscheid).

**Praxis-Querschnitte auf den Rechnern:** .ics-Export mit
Vorfrist-Alarm · Aktenzeichen im PDF-Rechenbericht · Permalink ·
Begründungs-Absatz «Für die Rechtsschrift» · Prefill-Brücken
(Rechtsmittel-Fahrplan → ZPO-Rechner, Zuständigkeit →
Schlichtungsgesuch, Wizard → Klage) · Norm↔Werkzeug-Brücke im
Gesetz-Leser.

---

## 5. Qualitätssicherung

- **Vitest** (257 Testdateien): Akzeptanztests je Engine/Vorlage,
  Registry-Invarianten, Konventions-Linter, Suchbegriff-Goldliste,
  Trennungs-Querschnitt der Fristen-Engines.
- **Golden-Output-Protokoll**: über 200 eingefrorene Fälle über
  Engines, Vorlagen und Normtext-Snapshots; `golden:vergleich` beweist
  Verhaltensneutralität byte-genau vor jedem Refactoring (§6 — Pflicht).
- **Gate-Kette** (`npm run gate` / `gate:schnell`): tsc STRICT · Tests ·
  Lint · Build · Golden · rund 40 `check:*`-Tore, u. a. `check:normtext`
  (+ `-netz`-Drift gegen Fedlex/LexWork), `check:entscheide`,
  `check:besetzung`, Paritäts-Tor DB↔Projektion,
  `check:fedlex-versionen`, `check:turso-frische`, `report:inventur`,
  `check:farbwelt`.
- **Adversariale Gegenprüfung** (QS-GP): auf Risiko-Pfaden (Extraktion /
  Rechnen / Norm-Tarif) blockiert `check:gegenpruefung` das Gate bis zum
  `bestanden`-Nachweis; `check:merge-schutz` sperrt Auto-Merge ohne
  Verdikt.
- **E2E & Performance**: 48 Playwright-Specs (CI-Shards);
  `check:perf-budget` (Lighthouse-CI, nur in CI) — Tempo zählt nur bei
  grüner Treue (§15). CI-Wächter `check:ci-laeufe` meldet graue Läufe.
- **Logik-Sweep**: Invarianten über 14'448 Eingabe-Kombinationen der
  Zuständigkeits-Engines.
- **Bibliothek** (`bibliothek/`, §11): jede Recherche als geordnetes
  Dossier mit amtlichen Quellen, Abrufdatum und ehrlichem
  Abnahme-Status; Verfalls- und Rechtsprechungs-Register.

**Bewusst offene Punkte** (Davids Entscheid bzw. DAVID-GATEs):
Wort-für-Wort-Abnahme aller Vorlagen («geprüft»-Hebung, Abnahme-Welle
ab Feb. 2027 geplant) · VPS-Bestellung für Massenkorpus-Serving ·
Lizenzfrage Live-Rechtsprechung · `check:merge-schutz` als Required
Check in den Branch-Regeln · kantonale Verifikationen ausserhalb BS.

---

## 6. Betrieb & Pflege

- **Deploy** (Weg 1, David 3.7.2026): Merge nach `main` = Auto-Prod-
  Deploy via Vercel (Projekt lexmetrik); Push/PR/Auto-Merge stehend
  freigegeben, §9-Sorgfalt vor dem Merge; Auto-Merge auf Risiko-Pfaden
  gesperrt.
- **Arbeitsweise**: PR-Workflow auf geschütztem `main` (Stand:
  PR #317); Parallel-Sessions nur in git-Worktrees
  (`~/Developer/lm-*`, §12); serielle Landung (Skill `landung`);
  Merge-Treiber-Politik für Register und generierte Projektionen;
  Session-Karten-Pflicht in `STRUKTUR.md` (Rotation nach
  `archiv/STRUKTUR-SESSIONKARTEN.md`).
- **Plan-Steuerung**: `npm run plan:next` (oberster offener Schritt) ·
  `npm run fahrplan` (Detail-Slice) · Erledigtes wird abgehakt — der
  Plan wird in beide Richtungen gepflegt (§14).
- **Daten-Pflege**: LIK-Reihe monatlich nach BFS-Publikation ·
  Referenzzinssatz, Feiertage, Behördenadressen periodisch ·
  Fedlex-Konsolidierungsstände und LexWork-`version_uid` über
  Drift-Tore · Turso-HOT-Budget beobachten (Ist ~652 MiB von
  1'024 MiB).
- **Kontext-/Token-Ökonomie**: Skills in `.claude/skills/` (abnahme,
  bauschritt, korpus-werkstatt, landung, lehren, gegenpruefung),
  Hooks in `.claude/hooks/` (tor-schutz, lese-schutz,
  struktur-aktuell/-rotieren), Dispatch-Template für Sub-Agenten
  (`docs/token-oekonomie/dispatch-template.md`).
