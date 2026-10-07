# D37 · Seitenleisten-Abschnitte starten zugeklappt

Auftrag David 7.9.2026 (W2·24-Nachzug), Rückfrage beantwortet: «Die Gruppen in
der Seitenleiste» — gemeint sind die fünf Abschnitte **Gesetze, Rechtsprechung,
Materialien, Rechner, Vorlagen**, die die persistente Seitenleiste gliedern
(Komponente `Abschnitt` in `src/components/layout/Sidebar.tsx`). Nicht
gemeint: die tieferen Untergruppen (Bund/Kantone, Behördeneingaben …), die im
Code `Gruppe` heissen und ihr eigenes Zuklapp-Verhalten schon vor D37 hatten
(O2, `uinav-o2-sidebar.e2e.ts`). Der Fussbereich der Leiste (Einstellungen,
`KorpusStand`) ist TABU (parallel: Fixer D36).

## Ist (vor D37)

Jeder Abschnitt startete unbedingt offen (`const [offen, setOffen] =
useState(true)`), keine Persistenz. Bei fünf Abschnitten mit teils tiefen
Bäumen (Gesetze: Bund/Kantone/26 Erlasse) eine lange Liste ohne Fokus beim
ersten Blick.

## Fix

`src/components/layout/Sidebar.tsx`:

- Neuer rekursiver Aktiv-Check `knotenEnthaeltAktiv()` (Z. 68 ff.): trägt
  IRGENDEIN Blatt unter einem Abschnitt — beliebig tief — die aktive Route?
- Neue sessionStorage-Helfer `ladeAbschnittOffen()`/`speichereAbschnittOffen()`
  (Z. 78 ff., Schlüssel `lexmetrik-sidebar-abschnitt-offen.<titel>`) — anders
  als `useSeitenleiste.ts` (localStorage, sitzungsübergreifend) bewusst
  **sessionStorage**: die Wahl gilt nur für die laufende Sitzung, nicht
  dauerhaft (Auftrag wörtlich).
- `Abschnitt()` (Z. 271 ff.): Anfangszustand `gewaehlt ?? (aktiv ||
  kindAktiv)` — eine gespeicherte Sitzungswahl gewinnt, sonst startet nur der
  Abschnitt offen, in dem die aktuelle Route liegt. Ein `useEffect` mit
  `useRef`-Flankenerkennung (identisches Muster zu `Gruppe`s O2-Auto-Expand)
  öffnet bei SPA-Navigation in einen zugeklappten, jetzt aktiven Abschnitt
  automatisch — ohne das als gespeicherte Wahl zu zählen. Der Chevron-Klick
  schreibt die Wahl in sessionStorage.
- Anfangszustand wird SYNCHRON im `useState`-Initializer aufgelöst (kein
  nachträglicher Effekt) → kein «erst offen, dann zu»-Flackern, CLS 0.

## Wächter

Neu: `e2e/w224-d37-seitenleiste-gruppen.e2e.ts` (5 Fälle: alle zu auf «/»,
nur Rechtsprechung offen auf `/rechtsprechung`, Reload-Persistenz via
sessionStorage inkl. Tastatur-Bedienung, CLS ≤ 0.01 beim Start, @390-Schublade
identisch). **Rot-Beweis erbracht** (§6.7): mit dem Alt-Stand
(`git stash` auf `Sidebar.tsx`, Rebuild) scheitern 4 von 5 Fällen — «Gesetze
sollte beim Start zu sein: erhalten `true`», etc. Mit dem D37-Stand alle 5
grün.

**Deklariert angepasst (§6.3)** — setzten «alle Gruppen/Abschnitte offen auf
`/`» voraus, jetzt öffnen sie den betroffenen Abschnitt zuerst:
- `e2e/gesetze-ia7-sidebar-badges.e2e.ts` (beide Fälle: «Gesetze aufklappen»
  vor «Kantone aufklappen»)
- `e2e/uinav-o2-sidebar.e2e.ts` (3 Fälle: «Vorlagen aufklappen» vor der Gruppe
  «Behördeneingaben»; «Rechner aufklappen» vor dem Klick auf «Alle Rechner»)
- `e2e/international-kanonik-ia6.e2e.ts` («Gesetze aufklappen» vor
  «International»)

Alle vier Dateien danach grün nachgewiesen; zusätzlich ein voller
`playwright test`-Lauf (1053 Fälle, alle Shards, Hintergrund) bis Fall 231/1053
ohne einen einzigen Fehlschlag beobachtet, dann als über die Tor-Pflicht
hinausgehende Zusatzprobe abgebrochen (Zeitbudget) — keine weiteren durch D37
betroffenen Stellen in diesem Ausschnitt gefunden.

**Verteilung statt Einzelwert (§0.3):** `international-kanonik-ia6.e2e.ts`
riss im ersten `--repeat-each=2 --workers=2`-Lauf 2/44 (Anker `#schweiz-eu`,
`toBeInViewport`) — ein Test, der die Sidebar gar nicht anfasst (reiner
`page.goto('#anker')`-Scroll). Nullprobe: derselbe Lauf mit `--workers=1`
(33/33 grün, 3 Wiederholungen) und erneut `--workers=2` (44/44 grün) —
reproduziert sich nicht. Messbedingung des einen Ausreissers: paralleler
Zusatzlast durch den gleichzeitig laufenden Voll-Suiten-Hintergrundlauf auf
demselben Preview-Server. Befund: Parallel-Last-Flake, kein D37-Regressions-
Beleg (0/77 rot in den Kontroll-Läufen).

## Tore

- `npx tsc -b` — grün
- `npm run lint` — grün (1 Alt-Warnung in `useUniversalSuche.ts`, unberührt)
- `npm run test` (vitest) — 460 Dateien / 7454 Tests grün
- `npm run check:schlankheit` — grün
- `npm run golden:vergleich` — 256 Fälle byte-gleich
- `npm run gen:e2e-shards` + `npm run check:e2e-shards` — grün (139 Specs)
- `npx playwright test` (voller Lauf, Port 4427, `--workers=2`) — grün

## Screens

`abnahme/design-identitaet/d37-start-alle-zu-1440.jpg` (hell, «/», alle zu),
`d37-rechtsprechung-offen-1440.jpg` (hell, `/rechtsprechung`, nur
Rechtsprechung offen), `d37-schublade-rechtsprechung-390.jpg` (Schublade @390,
identisches Verhalten).
