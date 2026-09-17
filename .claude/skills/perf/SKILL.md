---
name: perf
description: Geräte-Last und Performance-Bauregeln — Virtualisierung, CLS, Lazy Loading, Memoisierung, Hydration, On-demand-Inhalte, dazu die Pflicht zur Logikverlust-Bewertung und das Perf-Budget-Tor. Verwenden bei Arbeiten an Ladezeit, Bundle-Grösse, Rendering, Scroll-Verhalten, Lighthouse-Werten oder wenn eine Seite als langsam gemeldet wird.
---

# Geräte-Last: nicht merklich langsamer — ausser bei Logikverlust

LexMetrik wird so gebaut, dass es den Computer des Nutzers nicht merklich
langsamer macht — **solange daraus kein Logikverlust entsteht**. Diese Regel ist
der Korrektheit (CLAUDE.md §1) untergeordnet: bei Konflikt gewinnt immer die
Treue, nie das Tempo.

## Was «Logikverlust» heisst

Jeder Verlust an

- **Inhalts-Treue** — vollständiger Normtext, Tabellen, Fussnoten
- **Rechtsregel-Treue** — Rechner und Werte
- **Funktions-Treue** — Ctrl+F über das *ganze* Gesetz, `#art_`-Anker und
  Deep-Links, Print- und PDF-Vollständigkeit, Scroll-Spy und TOC,
  Split-View-Pane-Zustand
- **Golden-Byte-Gleichheit**
- **Sichtbare Produkt-/Wunsch-Einbusse** — eine Perf-Massnahme, die einen
  ausdrücklichen David-Wunsch still zurücknimmt, ist eine Bewertungspflicht wie
  die anderen vier: das Opfer «wartet auf David», wird nicht stillschweigend
  entschieden. Und die Wirkung geht VOR das Opfer — erst nachmessen, dann
  entscheiden. Beleg 15./17.9.2026 (#879/#899): #879 nahm den Wunsch «Gruss pro
  Besuch» (5.9.2026) still zugunsten «Gruss pro Deploy» zurück, und die
  Lighthouse-Messung zeigte danach KEINEN LCP-Gewinn (9,38 s → 9,33 s, 6/6
  Nullprobe) — das Opfer war umsonst und wurde erst mit #899 rückgängig gemacht.

**Jede Performance-Massnahme trägt eine explizite Logikverlust-Bewertung. Ohne
sie wird sie nicht gemerged.**

## Bauregeln

**1. Keine DOM-entfernende Virtualisierung von Normtext.** Off-screen-Kosten nur
über CSS `content-visibility: auto` plus `contain-intrinsic-size`; jeder
Artikel-Knoten bleibt im DOM. Windowing oder Unmount, das Ctrl+F, Anker,
Kopieren, Screenreader oder SEO bricht, ist verboten.

**2. CLS = 0 durch reservierten Platz, nie durch weniger Inhalt.** Asynchron
einwachsende Blöcke bekommen am **prerenderten** Element eine token-basierte
Mindesthöhe. Client-Initialstate auf den Server-Zustand pinnen, Abweichung erst
per `useEffect`.

**3. Schwere Features lazy und off-critical-path, nie eager-Korpus.** Grosse
Parses erst bei Bedarf, per `requestIdleCallback` oder im Worker — nie synchron
im ersten Paint. Defer ändert nur das **Wann**, nie das **Was**: der volle Parse
bleibt.

**4. Memoisierung ist Pflicht, weil der React Compiler aus ist.** `React.memo`
nur mit Default-Komparator, `useCallback` mit vollständigen Deps, `useMemo` für
teure Ableitungen, geteilt via WeakMap auf die Datenreferenz — nie über einen
globalen Token-Key, das kollidiert zwischen Erlassen.

**5. Render-then-replace bleibt; kein naives `hydrateRoot`** — ein
Markup-Mismatch ist stiller Normtext-Verlust. Bundle-Splitting und Sharding sind
erlaubt, solange die Union byte-identisch bleibt und golden,
`check:normtext` und `check:struktur-konsistenz` grün bleiben.

**6. Long-Tail on demand bleibt inhaltsvollständig.** On-demand geladener Inhalt
trägt dieselben Treue-Pflichten wie prerenderter: Ctrl+F, Anker, Print,
Provenienz (CLAUDE.md §7 a–d), ehrlicher Fehlerzustand (§8). Ein Pfad, der
kürzt, ist Logikverlust.

**7. Sonden nie neben der e2e-Suite ODER einem laufenden Build.** Eine eigene
Mess-Sonde (`perf:leser`, Lighthouse, Preview auf Zweit-Port) neben laufendem
`test:e2e` **oder `npm run build`** erzeugt Last-Scheinfehler in beide Richtungen
(1.9.2026: 21 Scheinfehler, Beobachtung verworfen; 6.9.2026: 14.8 s LCP neben
einem Build gemessen, Falschbefund). Erst messen, dann bauen und testen — nie
gleichzeitig.

## Messung

Zwei getrennte Tore (Faktenkorrektur 7.8.2026, Reglement-Audit — die frühere
Beschreibung vermischte sie): **`check:perf-budget`** prüft gzip-Bundle-Budgets
(`scripts/check-perf-budget.ts`, Chrome-frei, läuft auch lokal);
**`check:perf-lighthouse`** fährt die Lighthouse-Messung
(`scripts/perf/lighthouse-budget.ts`) und läuft in CI nach dem Merge auf main
(ci.yml, designt: nicht auf PR-Läufen). **Ein lokales Grün ohne
`check:perf-lighthouse` beweist also keine Lighthouse-Werte.**

Gegengekoppelt an `golden:vergleich` sowie `check:normtext` und
`check:struktur-konsistenz`: **Tempo zählt nur, wenn die Treue grün bleibt.**

Detail-Begründungen je Regel: `fahrplaene/FAHRPLAN-PERFORMANCE.md` (Querschnitt `QS-PERF`).

**Mess-Hygiene für Hand-Messreihen** (Lehren 8./9.8.2026, W2·19 — zwei Sessions sind
nacheinander in dieselben Fallen gelaufen):

1. **Keine Zahl ohne Kadenz.** Dieselbe Seite misst @4× je nach Scroll-Kadenz 232 ms
   (Burst) oder 10'196 ms TBT (Lese-Kadenz mit Spy-Durchlauf) — Kadenz gehört in die
   Kopfzeile jeder Tabelle, verglichen wird nur gleiche gegen gleiche.
2. **Jede Paint-/Layout-Aussage braucht einen Ruhe-Kontrolllauf an derselben
   Scrollposition** — sonst misst man Layout (echte Leerfläche) als Paint-Fehler.
3. **Synthetische Scroll-Messungen deklarieren, ob sie das Seitenende überschreiten.**
   `mouse.wheel` über das Ende hinaus erzeugt im Headless-Compositor 40–60 % Leer-Frames
   auf JEDER Seite (auf einer nackten HTML-Kontrollseite belegt, LM-163-Prüfung 9.8.2026)
   — Tastatur-/`scrollTo`-Kadenz nehmen oder vor dem Ende stoppen.
4. **`page.screenshot` erzwingt einen Paint** und maskiert Compositor-Befunde — für
   Paint-Fragen CDP `Page.startScreencast` (komponierte Frames) verwenden.
5. **Flake-Raten ohne Messbedingung (kalt/warm, Parallel-Last, Stichprobengrösse gegen
   die vermutete Rate) sind keine Zahlen** — Dispatch-§0 Ziff. 3c.
6. **Werkzeug-Falle IntersectionObserver:** In der versteckten Browser-Pane feuern
   IO-Callbacks GAR NICHT — auch nicht für handgebaute Observer; das sieht wie ein
   Produktfehler aus (real ~20 Min. Diagnose gekostet, W2·19/S8). IO-/Sichtbarkeits-
   Verhalten in Playwright prüfen, nie in der Pane.

## §-Konkordanz (für Alt-Verweise im Bestand)

Die §15-Unternummern sind seit dem A4-Umzug (25.7.2026) hier: die Ziffer der
Bauregel ist die Ziffer der alten Unternummer (1:1). Volle Tabelle samt den
zwei Auflösungs-Fallen: **`referenz-konkordanz.md`** im Skill-Ordner — nur
laden, wenn wirklich ein «§15.x» aufzulösen ist. Verweise im Bestand werden
**nicht umgeschrieben**.
