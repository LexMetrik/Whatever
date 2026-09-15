# Code-Inventur 4.8.2026 — Logikschicht · Darstellungsschicht · Pipeline

**Erstellt:** 4.8.2026 — Auftrag David «plane Verbesserung des Codes, denk gross»: drei
parallele read-only Code-Analysen.
**Status:** ERSTRECHERCHE

**Quelle:** Drei parallele read-only Explore-Analysen (Session 4.8.2026, Auftrag
David «plane Verbesserung des Codes, denk gross»), erhoben am Stand
`2c4d97e54` (3.8.2026); Bundle-Zahlen aus `dist/` vom 3.8. 11:22 (älter als
HEAD, Näherungswerte). **Abnahme-Status: entwurf** — Befunde belegt, Bewertung
durch David offen. Bau-Specs der daraus abgeleiteten Schritte:
[FAHRPLAN-CODE-VERBESSERUNG.md](../../archiv/FAHRPLAN-CODE-VERBESSERUNG.md) (archiviert 7.8.2026).

## 1. Gesamtbild

Der Bestand ist strukturell gesund: `strict: true` ohne ein einziges `: any`
in `src/` · kein belegter §3-Schichtverstoss (Datumsarithmetik/Schwellen in
`pages`/`components`: 0 relevante Treffer bei gezielter Suche) · geteilte
Infrastruktur (`datumsUtils`, `fristenEngine`, Feiertage, `format.ts`) wird
importiert, nicht kopiert · 291 Testdateien / ~4'415 Fälle plus kombinatorischer
`check:sweep` · Skript-Landschaft zu ~93 % referenziert, Waisen dokumentiert.
Das Verbesserungspotential liegt in Wachstumsgrenzen und Entdopplung, nicht in
Schlamperei.

## 2. Logikschicht (src/lib · 221 Dateien · 56'637 Z)

- **`fristenEngine.ts` (198 Z): geteilte Fristen-Infrastruktur von 5 Engines,
  aber nur 6 direkte Testfälle / 9 expects** — dünnste Direktabdeckung bei
  grösster Durchschlagskraft (ZPO-, SchKG-, Verjährungs-, Mietfristen). Weitere
  dünne Kandidaten (Z je Fall ≥20): `bggVwvgFristen` (5 Fälle), `erbFristen`,
  `gewaehrleistung`, `streitwert`, `beurkundungZusatzkosten`, `teuerung`.
  Ohne erkennbaren Test-Pfad: `suche/artikelRanking.ts` (164 Z).
- **Aufteilungs-Kandidaten (Misch-Dateien):** `fedlex.ts` 1'017 Z (Konstanten-
  Tabelle / URL-Bau / Gesetzes-Erkennung / Fliesstext-Parser) ·
  `zustaendigkeit.ts` 986 Z (zwei Engines, sauberer Schnitt bei Z 655) ·
  `rechtsprechung/besetzung.ts` 874 Z (Parser ↔ Kanonisierung, Trenner Z 690) ·
  `prozesskosten.ts` 793 Z (6 Rechner + PDF-Bericht) ·
  `rechtsprechung/zitat-extraktion.ts` 844 Z (Regex-Korpus ↔ Extraktoren) ·
  `gruendungsunterlagen.ts` 719 Z (GmbH ↔ AG — nur trennen, nie verschmelzen).
- **Typsicherheits-Aussenkanten:** 9× `as unknown as` an JSON-Importen
  (`src/data/plz|schlichtung|betreibung/*`) — Compiler blind bei Struktur-Drift.
  ~110 Enum-Casts konzentriert in `src/components/forms` (Select-Konvertierung).
  53 Non-Null-Assertions in `src` (Engines nur in Text-Ausgabe-Zweigen).
- **Formatter-Restdublette:** eigene `chf`-Helfer mit abweichender Semantik in
  `gebvKosten.ts:40`, `streitwert.ts:61`, `bgerRechtsweg.ts:166` (nicht
  byte-gleich → Zusammenlegung nur mit Golden-Beweis auf der Ausgabe).
- **Generierte Dateien:** 9'706 Z, davon 90 % reine Buildzeit-Artefakte;
  einziger Bundle-Posten `grundart.generated.ts` (192-KB-Chunk `register`).
  `erfasste-keys.generated.ts` (6'345 Z) + `abk-aliase.generated.ts` liegen
  unter `src/`, werden aber nur von `scripts/` gelesen (Ortszuordnung).
- **Schichtungs-Nebenbefunde:** `startseiteModule.tsx` als deklarierter,
  einziger lib→components-Wertimport · `data/zustaendigkeitKantone.ts` und
  `data/schlichtungsstellen.ts` Wertimporte materieller Regeln (VD-Kaskade)
  in die Datenschicht — Kandidat, der einer Zyklen-Verschärfung im Weg stünde.
- **TODO-Bestand:** 6 Marker, alle datiert/gebunden (4× SEO-Welle 1.12.2026,
  1× Dossier D.2/3 `fristenspiegel/agKuendigung.ts:16`). Kein Schuldenberg.

## 3. Darstellungsschicht (284 Dateien · 48'896 Z)

- **D1 · Wizard-Rahmen ungenutzt:** `VorlagenSeite.tsx` (172 Z) existiert als
  Opt-in-Rahmen, wird von **5 von 29** Vorlagen-Seiten genutzt; 24 rollen
  dieselbe Orchestrierung von Hand (23 Dateien mit wortgleichen Zeilenfolgen;
  ISO-Datums-Regex 15× neu definiert trotz `istIsoDatum()`; DOCX-Gate 51×
  inline trotz `docxAktiv()`).
- **D6 · `VorlageAgGruendung.tsx`:** 55 Einzel-`useState`, manuelle 60-Feld-
  Serialisierung (Z 237–270), Reset per `location.reload()` — obwohl
  `useWizardState` (77 Z) von 24 anderen Seiten genutzt wird. Jedes neue Feld
  heute an 3 Stellen.
- **D2 · Gerichtswahl-Block 6× kopiert** (~25 Z: KlageOrdentlich 83–108,
  Eheschutzgesuch 68–92, Scheidungsklage 72–96, Scheidungsbegehren 96–120,
  KlageVereinfacht, SchlichtungsgesuchBs).
- **D3 · Kantonsvergleichs-Tabelle 4×** (Beurkundung/GrundbuchEintrag/
  NotariatGrundbuch/Prozesskosten, ~35 Z byte-nah).
- **D4 · Permalink-Einlese-Muster 17× wortgleich** + Ergebnis-Fuss-Trio
  (Aktenzeichen · PDF · Link teilen) in 26–28 Dateien → Hook-Kandidat
  `usePermalinkFelder`; ein `src/hooks/` existiert nicht, 12 Hooks verstreut.
- **D5 · 7 handgerollte Auswahlkacheln ohne `aria-pressed`** (Nda, Werkvertrag,
  Auftrag, Konkubinat) neben `SelectionGrid` (26 Nutzer, mit `aria-pressed`).
- **`EntscheidLeser.tsx` 893 Z Monolith** (9 useState / 9 useEffect) — der
  Gesetz-Leser derselben Gattung ist bereits in 28 Dateien zerlegt.
- **Eager-Bundle-Kette:** `Shell→Sidebar→lib/navigation→normtext/register`
  zieht 189 KB roh (18 KB gz) + `startseiteConfig` 87 KB auf **jede** Route;
  Entry gemessen 52.1 KB gz = 87 % des 60-KB-Budgets (Ausgangsstand lt.
  Tor-Kommentar 30 KB). §3-Vorbehalt: Einzelwert, dist älter als HEAD.
- **1'141 hart kodierte `Art.`-Zitate in 107 UI-Dateien** — reine Beschriftung
  (kein Konditional gefunden), aber zweite Norm-Quelle ohne Tor gegen das
  Register.
- **Kleinbefunde:** localStorage-Key `'rsp-fs-idx'` (EntscheidLeser) ohne
  `lexmetrik.`-Präfix → vermutlich vom Einstellungen-Reset nicht erfasst
  (offen) · `lang="en"` bei deutschem Fallback-Text (bewusste Zwischenstufe) ·
  98 rohe `type="checkbox"` neben 199 `<Checkbox>`-Nutzungen.

## 4. Pipeline (scripts/ 240 Dateien · 64 Tore · 7 Workflows)

- **Turso-Sync = härteste Wachstumsschranke:** 32.8 min gesamt, davon 22.3 min
  allein `fts_entscheide_schaufenster` (5'093 Zeilen / 165 MiB bei ~4 Zeilen/s;
  Bandbreiten-Hypothese im Workflow-Kommentar widerlegt). Timeout 90 min ⇒
  Korpus trägt ~3.7× heutige Grösse, dann reisst der wöchentliche Sync —
  kollidiert mit dem geplanten Kantons-Ausbau (`W2·13-KANTONE`, 14 Schritte).
- **Suchindex-Monolith:** `public/such-index/artikel.json` 45.9 MB roh /
  9.5 MB gz, als EIN `fetch()` in den Browser (`suche/artikelVolltext.ts:299`);
  Budget zu 91 % ausgeschöpft; einzige ungeshardete Stelle einer sonst sauber
  gechunkten Datenwelt (Korpus: 156 Norm-Index-Shards, 311 Bezugs-Shards, alle
  gzip-budgetiert). Dazu: das Tor `check:suchindex` läuft **nirgends**.
- **Unverdrahtete Tore:** `check:suchindex`, `check:rss-oc`, `check:confidence`
  laufen in keinem Workflow und keiner Kette; `check:paritaet`/
  `check:datenhaltung` sieht kein PR-CI (nur `turso-sync.yml`, post-merge).
- **`daten-manifest.json`: 5 Tabellen mit 0 Zeilen** (`norm_rangliste`,
  `norm_referenzen`, `entscheide`, `zitat_kanten`, soft-law ausser `dokument`)
  — sha des Leerstrings; `check:turso-frische` hält sie trivial für «frisch».
  **Geklärt 4.8.2026: gewollt** (Ausbaustufe, David im Chat).
- **Prod-Smoke doppelt:** `.github/scripts/prod-smoke.sh` (bash, wöchentlich in
  `normen-monitor.yml`) und `scripts/betrieb/prod-smoke.ts` (TS, 6-stündlich)
  prüfen überlappend Startseite + `/api/suche` + Korpus-JSON — echte Doppelung,
  kein dokumentierter Schnitt.
- **e2e-Shard-Balance:** Befund (Streuung 3–11 min gegen 9 Tage alte Packung)
  war real, ist aber am 4.8.2026 bereits neu gepackt worden (LPT aus Lauf
  30852386612) — erledigt, hier nur als Beleg.
- **Skript-Waisen:** ~7 % (16 Dateien), alle dokumentiert; 5 Nachpflege-
  One-Shots (`*-nachzug`, `remap-sachgebiet`, `rubrum-bereinigen`,
  `sachverhalt-strukturieren`) gehörten nach `scripts/archiv/`.
- **Dependencies:** einzige echt ungenutzte devDependency
  `@vitest/coverage-v8` (kein Import, kein `--coverage`, kein Workflow).
  `linkedom` wirkt per POC-Kommentar tot, hat aber 5 produktive Nutzer —
  **kein** Löschkandidat.

## 5. Offene Fragen

1. ~~`daten-manifest.json`-Nullzeilen~~ **beantwortet 4.8.2026: gewollt**
   (Ausbaustufe, keine Wächter-Lücke — David im Chat).
2. ~~Freigabe `normalisiereTarifText`~~ **beantwortet 4.8.2026: bestätigt**
   und als Konkretisierung in `DESIGN-REGLEMENT-NORMTEXT.md` §1 gehoben.
3. Prod-Smoke-Doppelung: bewusster Schnitt oder konsolidieren?
4. `RESET_PRAEFIXE` in `Einstellungen.tsx` erfasst `'rsp-fs-idx'` nicht? (prüfbar)
5. Bundle-Zahlen auf HEAD neu erheben (dist war 12 h älter; §3-Streuung nötig).

**Pflegebedarf:** Zahlen sind Momentaufnahme des Stands `2c4d97e54`; vor jedem
Bau-Schritt die betroffene Kennzahl neu erheben (insb. Bundle/Budget-Werte).
