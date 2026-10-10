---
name: refactoring
description: Verwenden bei jedem Struktur-Umbau ohne Verhaltensänderung und bei Performance-Arbeit — Trigger «Refactoring», «Umbau», «grosse Datei aufteilen», «Entdopplung», «Engine-Verschmelzung», «Code-Splitting», «Lazy Loading», «Performance», «Lighthouse», «Bundle», «Ladezeit», «langsam», «neues check:*-Tor». Golden-Beweis, Reihenfolge der Tore, Datei-Schlankheit (§6), Geräte-Last mit Logikverlust-Bewertung (§15), Tor-Bedingungen.
---

# Refactoring und Performance — verhaltensneutral und bewiesen

Konkordanz: §6.1/6.2 → Ziff. 1 · §6.3 → 2 · §6.4 → 5 · §6.5 → 6 · §6.6 → 4 ·
§6.7 → 7 · §15.1–15.6 → Bauregel 1–6 in Ziff. 5.

## 1. Ablauf

1. **Vorher grün:** CI-Lauf grün (Lauf-ID); lokal nur gezielte Tests, volle
   Ausgabe, nie `tail -1`.
2. **Golden festhalten**, wo Texte oder Dokumente entstehen (assemble,
   PDF-Modell, Warnungen) — vor dem Umbau.
3. **Umbauen.**
4. **Nachher beweisen:** `npm run golden:vergleich` byte-gleich, CI grün. Vor
   jedem Kontrolllauf, der Code austauscht (Checkout, stash, Zweigwechsel),
   muss `git status --short` leer sein — sonst überschreibt er uncommittete
   Arbeit. Vorher/Nachher nie per `git checkout <sha> -- <datei>`, sondern
   WIP-Commit oder `git show <sha>:<pfad> > <tmp>`.

## 2. Die zwei nicht verhandelbaren Sätze (§6.3)

- **Tests werden bei Refactorings nicht angepasst.** Muss einer geändert
  werden, ist es eine fachliche Änderung: eigener, deklarierter Schritt.
- **Kein `npm run golden`, um eine Abweichung zu reparieren** — das zerstört
  das Orakel.

Ein Test fällt nur mit dem Code, den er prüft: vor dem Mitlöschen die Importe
lesen; zeigt einer auf ein Modul, das bleibt, bleibt der Test.

## 3. Verschmelzen

Engine-Verschmelzung nur mit Golden byte-gleich UND Regime-Treue: verschiedene
Rechtsregimes bleiben als interne Verzweigung erkennbar, nie zu einer Regel
kollabiert. Risikoärmste zuerst (geteilte Infrastruktur); materielle
Rechtsregeln nie teilen (§4). Aufteilen ist immer erlaubt.

## 4. Datei-Schlankheit (§6.6)

Darstellungs- oder Datenschicht-Datei (`src/pages/`, `src/components/`,
Vorlagen-Schemas, Config, Datentabellen) über ~800 Zeilen ⇒ Split in
Geschwister plus Fassade (`export * from './geschwister'`), Importpfade
unverändert, Beweis Byte-Identität des Outputs. **Split einer Risiko-Datei:**
neue Pfade gegen `istRisikoPfad()` (`scripts/gegenpruefung/kern.ts`) belegen —
sonst verliert ausgelagerte Engine-Logik still die Risiko-Klassifikation;
fehlender Ordner-Zweig gehört in denselben PR. Geteilte Infrastruktur statt
Kopie (`lib/format.ts`, `datumsUtils.ts`); Abweichung nur fachlich begründet
am Fundort.

## 5. Performance und Geräte-Last (§6.4, §15)

Nicht merklich langsamer — **solange kein Logikverlust entsteht**; bei
Konflikt gewinnt die Treue. Lazy Loading und Splitting ändern nur das
**Wann**, nie Inhalt oder Reihenfolge der Logik. Logikverlust = Verlust an
Inhalts-Treue (Normtext, Tabellen, Fussnoten), Rechtsregel-Treue,
Funktions-Treue (Ctrl+F übers ganze Gesetz, `#art_`-Anker, Deep-Links,
Druck/PDF, Scroll-Spy, TOC, Split-View-Zustand), Golden-Gleichheit oder
sichtbare Einbusse eines ausdrücklichen David-Wunsches (das Opfer «wartet auf
David», Wirkung vorher messen). **Jede Perf-Massnahme trägt eine explizite
Logikverlust-Bewertung, sonst kein Merge.**

1. Keine DOM-entfernende Virtualisierung von Normtext — nur
   `content-visibility: auto` + `contain-intrinsic-size`; jeder Artikel bleibt
   im DOM.
2. CLS = 0 durch reservierten Platz (token-basierte Mindesthöhe am
   prerenderten Element), nie durch weniger Inhalt; Client-Initialstate auf
   den Server-Zustand pinnen, Abweichung per `useEffect`.
3. Schwere Features lazy und off-critical-path (`requestIdleCallback`,
   Worker); der volle Parse bleibt.
4. Memoisierung ist Pflicht (React Compiler aus): `React.memo` mit
   Default-Komparator, vollständige Deps, `useMemo` via WeakMap auf die
   Datenreferenz, nie globaler Token-Key. Falle
   `react-hooks/preserve-manual-memoization`: `ref.current`-Helfer auf
   Modulebene, in die Deps nur Primitive und die Ref.
5. Render-then-replace bleibt, kein naives `hydrateRoot` (Mismatch = stiller
   Normtext-Verlust); JSX-Textsegmente für SSR als EIN Template-Literal.
   Splitting/Sharding nur bei byte-identischer Union.
6. On-demand-Inhalt trägt dieselben Treue-Pflichten (Ctrl+F, Anker, Druck,
   Provenienz §7, ehrlicher Fehlerzustand §8).
7. Mess-Sonden nie neben e2e-Suite oder Build (Last-Scheinfehler).

**Messung:** `check:perf-budget` = gzip-Bundle-Budgets (lokal lauffähig,
Pflicht vor Merge); `check:perf-lighthouse` läuft nachts gegen main — lokales
Grün belegt keine Lighthouse-Werte. Tempo zählt nur, wenn `golden:vergleich`,
`check:normtext` und `check:struktur-konsistenz` grün bleiben. Hand-Messreihen:
Scroll-Kadenz in die Tabelle; Paint-Aussagen mit Ruhe-Kontrolllauf;
synthetisches Scrollen über das Seitenende erzeugt Leer-Frames;
`page.screenshot` erzwingt einen Paint und maskiert Compositor-Befunde (CDP
`Page.startScreencast` nehmen); IntersectionObserver feuert in der versteckten
Pane nicht (Playwright nehmen); macOS-Geometrie ≠ Linux-Runner (Fallback-Fonts);
Flake-Raten nur mit Messbedingung und Stichprobengrösse.

## 6. Diagnose sparsam (§6.5)

Rotes vitest: nur die rote Datei (`npx vitest run src/tests/<datei>`).
Golden-Abweichung: `npm run golden:diff -- <id>`. `golden/*.json`, `dist/`,
`package-lock.json` nicht lesen.

## 7. Wann ein Tor ein Tor ist (§6.7)

Alle vier Bedingungen:
- **(a) Unabhängige Referenz** — andere Datenbasis, nie die eigene Ladung
  desselben Laufs.
- **(b) Kein stilles Grün** — fehlende Voraussetzung ⇒ rot oder explizit `SKIP`.
- **(c) Nicht-Laufen sichtbar** — `cancelled`/`skipped` zählen als rot
  (`check:ci-laeufe` über jeden `schedule:`-Workflow).
- **(d) Identitäts-Treffer mit Wortgrenze**, nie Substring.

Wer ein Tor baut, zeigt es einmal rot UND einmal grün; bei UND-Bedingungen die
Ist-Kennzahl jeder Teilbedingung. Neue Sperre vorher gegen den unveränderten
Bestand und die echte CI-Umgebung laufen lassen. Klasse: **K1** (Rechtsinhalt,
Datentreue) → `gate`; **K2** (Konsistenz, Stil) → nur CI.
**Nachwachs-Sperre:** ein neues Tor nur mit Streichung eines bestehenden,
ausser es fängt einen datierten Fehler in Rechtsdaten oder Rechtslogik.
