# LexMetrik — Architekturkarte

Nachschlagewerk, keine Pflichtlektüre. Regeln: `CLAUDE.md`. Stand und nächster
Schritt: `ROADMAP.md`. Funktionsinventar: `docs/INVENTAR-FUNKTIONEN.md`.

## Ordner

| Ordner | Zweck | Einstieg |
|---|---|---|
| `src/lib/` | Engines und Rechtslogik, rein und deterministisch (§2); je Rechtsgebiet eine Engine (§4) | `startseiteConfig.ts` (Katalog, §5), `fristenEngine.ts`, `vorlagen/`, `tarif/`, `normtext/`, `rechtsprechung/`, `fedlex/` |
| `src/pages/`, `src/components/` | Darstellung (React); keine Rechtslogik (§3) | `App.tsx`, `RouteSwitch.tsx`, `routesManifest.ts` |
| `src/data/` | Behörden- und Schwellen-Stammdaten, je genau einmal (§5) | `betreibungsaemter.ts`, `handelsgerichte.ts` |
| `src/tests/` | Vitest-Suite (Engines, Komponenten, Design-Tore `design-*`) | `npm test` |
| `e2e/` | Playwright gegen den gebauten Stand | `playwright.config.ts` |
| `golden/` | Golden-Outputs für den Byte-Gleichheits-Beweis (§6) | `lexmetrik-golden.json`, `normtext-snapshot.json` |
| `public/` | ausgelieferte Korpus-Projektionen: `normtext/`, `rechtsprechung/`, `materialien/`, `verzahnung/`, `feed/` | — |
| `api/` | Server-Funktionen (Vercel): Volltextsuche, Fehlermeldung | `suche.ts` |
| `scripts/` | Werkzeuge: Extraktion, Generatoren, Tore, CI-Hilfen | `gate.sh`, `run-parallel.ts` |
| `scripts/normtext/`, `scripts/rechtsprechung/`, `scripts/materialien/` | Korpus-Extraktion je Quelle (Adapter, Generatoren, `check-*`) | Skill `korpus-werkstatt` |
| `scripts/datenhaltung/` | DB-Artefakte bauen, ingestieren, nach Turso spiegeln | `build.ts`, `ingest.ts` |
| `scripts/gegenpruefung/` | Risiko-Pfad-Erkennung und PR-Schutz | `kern.ts` (`istRisikoPfad`) |
| `daten/` | gitignorte DB-Artefakte (`normtext.db`, `rechtsprechung.db`, `soft-law.db`) plus kleine committete Rohdaten | — |
| `bibliothek/` | Norm-Belege, Fixtures, Quellen-Register (§11) | `INDEX.md` |
| `abnahme/` | Abnahme-Protokolle für die fachliche Prüfung durch David | `SCHEMA.md`, `VORLAGE.md` |
| `design/` | Design-Tokens (Quelle für `tailwind.tokens.generated.js`) | `tokens.json`; Regeln `DESIGN-REGLEMENT.md` |
| `fahrplaene/` | eingefrorene Spezifikationen je Baufeld | `npm run fahrplan -- <datei> <§>` |
| `plan/` | `ENTSCHEIDE.md` (datierte Entscheide), `FEHLERBESTAND.md` (einzige Fehlerliste) | — |
| `messwerte/` | maschinell geschriebene Messdateien der Tore | — |
| `.github/workflows/` | CI (`ci.yml`) und geplante Läufe (Fedlex-Frische, Rechtsprechungs-Wochenlauf, Normen-Monitor, Turso-Sync, Perf-Nacht) | `ci.yml` |
| `.claude/` | Skills, Agenten, pfad-gescopte Regeln (`rules/`), Hooks | — |

## Schichten

1. **Engines** (`src/lib/`): reine Funktionen, keine DOM-, Netz- oder Uhr-Zugriffe
   in der Rechenlogik. Vorlagen-Schemas in `src/lib/vorlagen/` sind die eine
   Inhaltsquelle; PDF (`src/lib/pdf/`) und DOCX rendern aus demselben
   Assemble-Ergebnis.
2. **Darstellung** (`src/pages/`, `src/components/`): liest Engine-Ergebnisse,
   rechnet nicht selbst. Regel: `.claude/rules/schichtentrennung.md`.
3. **Werkzeuge** (`scripts/`): erzeugen Korpus-Daten und prüfen; laufen nie im
   Browser.
4. **Tore**: `check:*`-Skripte in `package.json`, gebündelt in drei Familien
   (unten).

## Datenfluss Korpus

Amtliche Quelle (Fedlex, kantonale Quellen, Gerichte) → Adapter in
`scripts/normtext/` bzw. `scripts/rechtsprechung/` → Eintrag-Dateien unter
`public/normtext/` und `public/rechtsprechung/` → `scripts/datenhaltung/ingest.ts`
befüllt `daten/*.db` → Turso-Replika für die Server-Suche (`api/suche.ts`).
Der Build (`npm run build`: `tsc -b`, Suchindex, Feed, `vite build`,
`scripts/prerender.ts`) prerendert die Routen aus `src/lib/seo.ts` gegen die
JSON-Projektionen.

Soll nach §5: das DB-Artefakt ist die eine Quelle, `public/*.json` und die
prerenderten Seiten sind Projektionen daraus. Ist: `ingest.ts` liest die
committeten JSON-Dateien in die DB; die Umkehr ist offen (ROADMAP EINGANG,
Zeile «§5-Text vs. Ist»).

Gespeicherter Gesetzestext trägt Stand, Quelle-URL, Live-Link und
Drift-Erkennung (§7 Zitat-Ausnahme); Drift prüfen `check:netz` und die
geplanten Läufe.

## Tests, Golden, E2E

- **Vitest** (`src/tests/`, daneben `*.test.ts` in `scripts/`): `npm test`;
  gezielt `npx vitest run <muster>`.
- **Golden** (`golden/`): `npm run golden:vergleich` beweist Byte-Gleichheit
  der Rechner-Ausgaben, `check:golden-normtext` die der Normtext-Snapshots.
  Ein Refactoring ändert sie nie (§6).
- **E2E** (`e2e/*.e2e.ts`): `npm run test:e2e`; in CI in Shards
  (`scripts/e2e-shard-gruppen.mjs`). Schwere Läufe nur in CI.
- **Logik-Sweep** (`scripts/logik-sweep.ts`): Kombinations-Durchlauf der
  Engines.

## Tor-Familien

- **`check:seriell`** — die Offline-Prüfkette (Design-Tokens, Farbwelt,
  SEO-Index, Normtext-Invarianten, Entscheide, Materialien, Golden-Normtext,
  Gegenprüfung, Datenhaltungs-Parität u. a.);
  `npm run check` fährt dieselben Sub-Checks parallel (`scripts/run-parallel.ts`).
- **`check:netz`** — Prüfungen gegen amtliche Quellen im Netz (Caches, Zitate,
  Fedlex-Versionen, Normtext-, Tarif- und Materialien-Drift);
  `scripts/run-netz-alle.ts`. Läuft nicht in jedem PR, sondern geplant.
- **`gate.sh`** — `npm run gate` (volle Kette: tsc, Vitest, Golden, Lint,
  `check`, Fachänderungs-Tor, ZH-Artefakt-Proben) bzw. `gate:schnell` (tsc, Vitest, Golden); leise bei Grün, bei Rot
  ein Kondensat, Volllog unter `.gate/`.
- **CI** (`ci.yml`) fährt die Tore je PR-Art; Merge nach `main` ist der Deploy
  (Skill `landung`). Risiko-Pfade (`istRisikoPfad`) verlangen eine
  Gegenprüfung (Skill `gegenpruefung`).
- **`check:deckel`** — Wort-Gesamtdeckel über alle Nicht-Produkt-Ordner,
  Grenze in `messwerte/deckel.json`, sinkt nur.
