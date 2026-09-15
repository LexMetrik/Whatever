# a33-Lese-Scroll-CLS: Alt-Flake mit Zielkonflikt (Befund 9.8.2026)

**Erstellt:** 9.8.2026 — Vor-Merge-Batterie der Landung W2·19 (S1–S5) fand den Alt-Flake
CLS 0.0504 in `e2e/leser-gliederung-a33.e2e.ts:363`.
**Status:** ERSTRECHERCHE

**Anlass:** Vor-Merge-Batterie der Landung W2·19 (S1–S5): `e2e/leser-gliederung-a33.e2e.ts:363`
(«A9 — Lese-Scroll unter CPU-Drossel: CLS 0») fiel einmal mit CLS 0.0504 (Limit 0.05).

**Quelle mit Stand:** Messreihe Bau-Agent 9.8.2026 im Worktree `feat/w2-19-gliederung`
(HEAD `1b50a0817`); Methode und Rohwerte in den Commit-Bodies `58f70ce83` / `c9d0c2d05`,
Fundort-Kommentar in `src/pages/gesetz-leser/inhalt-hooks.tsx` (Auto-Akkordeon-Zweig).

## Regel (deterministisch formuliert)

- **Was passiert (8/8 Läufen, bitgleich 0.0504):** Beim ersten Artikelwechsel eines
  Lese-Scrolls reisst das Auto-Akkordeon (Auftrag K, David 26.6.2026) den Aktiv-Pfad auf;
  der Gliederungsbaum wächst in EINEM React-Commit um ~20 Zeilen (~780 px) **innerhalb des
  Sichtbands** — die Top-Level-Zeilen darunter («Zweite–Fünfte Abteilung», OR) werden aus dem
  `[data-toc]`-Scroller geklippt. Ein Scroll-Ausgleich hilft nicht: die neuen Zeilen
  entstehen im Sichtband selbst.
- **Warum nur manchmal rot:** Chromium zählt den Shift nur, wenn er ausserhalb des
  500-ms-Fensters nach der letzten Eingabe liegt (`hadRecentInput`). Gemessen: 3× true →
  CLS 0.0195 (grün), 5× false → 0.0699 (rot). Reines Timing-Los.
- **Messbedingung ist Teil der Wahrheit:** kalt (frischer Build, sofort gemessen) 2–4/20
  rot; warm (nach vollem e2e-Durchlauf) 0/40 rot. Eine Flake-Rate ohne genannte
  Warm-/Kalt-Bedingung ist wertlos.

## Provenienz

Nullprobe gegen `main` (Stand vor W2·19, `657880411^`, nur `src/` zurückgesetzt, 20 Läufe):
**4/20 rot — identische Rate und Signatur wie der W2·19-Stand.** Der Mangel ist ein
**Alt-Mangel auf main**, keine Regression dieser Bau-Einheit. Vier Alternativ-Hypothesen
(Wächter-Loch, Mess-Race, Saum, Unmount) einzeln durch Messung widerlegt.

## Geltungsbereich und Ausnahmen

Betrifft nur den Lese-Scroll MIT Auto-Aufklapp im Sichtband (grosse Kodifikationen mit
tiefem Baum, z. B. OR). Isolierte Läufe: stets grün (5/5). Klick-Sprünge, Suche,
Artikel-Wechsel per Baum: nicht betroffen (dort gilt das Input-Fenster).

## Zielkonflikt — wartet auf David

Auftrag K (26.6.2026: Zweig klappt beim Erreichen automatisch auf) und der a33-Kontrakt
(«Lese-Scroll = CLS 0») widersprechen sich in diesem Randfall inhaltlich. Drei Wege, alle
ändern Zugesagtes: **(a)** kein Auto-Aufklapp während des Lese-Scrolls (nur beim Stehen),
**(b)** Aktiv-Pfad schon beim Laden aufklappen, **(c)** Tor-Kontrakt neu fassen
(Aufklapp-Shifts deklariert ausnehmen). Bis zum Entscheid gilt der Fall als deklarierte
Alt-Flake (~10–20 % kalt unter Parallel-Last).

## Pflegebedarf

Nach Davids Entscheid: Fix als eigene Bau-Einheit mit Rot-Beweis; danach diesen Eintrag
aktualisieren (Status → behoben) und die Flake-Beobachtung schliessen. Verwandter
Beobachtungsposten: `verzahnung.e2e.ts:201` (Popover-boundingBox null unter Voll-Last,
gleiche Bauart, 1× gesehen 9.8.2026, isoliert 6/6 grün).

**Nachtrag 9.8.2026 — die Flake-Familie hat drei belegte Mitglieder:**
(1) dieser a33-Fall; (2) `verzahnung.e2e.ts:201` (Popover) — Wurzel `boundingBox()!` ohne
Stabilitäts-Wartung, GEFIXT in `ea1fcedf3` (atomare Poll-Messung; 8 Worker + repeat-each:
vorher 2/3 rot, nachher 15/15 und 52/52 grün); (3) `qsui-hierarchie.e2e.ts` Vorlagen-Block
(«kein Formvorschrift-Badge») — Nullprobe: main 25/84 rot vs. Branch 18/84 (workers=1,
Testdatei byte-identisch, Fläche im Delta unberührt) ⇒ Alt-Flake, offen (Fehlerbuch-Zeile,
braucht eigenes Mandat). Gemeinsames Muster: einmaliges DOM-Lesen ohne Wiederholung, die
Fehlermeldung beschuldigt das Produkt für eine Zeitbedingung. Viertes Mitglied
9.8.2026: `leser-weiterlesen-r4-r8` (R8 j/k, Shard-Kontext, vorbestehend). Und die
Gegen-Lehre aus dem S7-CI-Rot (PR #479): ein e2e-Timeout auf einem LANGSAMEN Runner ist
zuerst ein Verdacht auf ein Geräteklassen-/Produkt-Problem, nicht auf einen Testfehler —
dort verbarg sich hinter der «Flake»-Signatur ein echter Fehler (Artikel-Kontext hing
hinter fünf fachfremden Ladequellen; Fix `c113ea955`). Erst reproduzieren, dann deuten —
in BEIDE Richtungen. Tor-Idee gegen die Familie:
Fehlerbuch-Zeile W2·18 (9.8.2026).

**Abnahme-Status:** einfach belegt (Messreihen mit Rohwerten in den Commit-Bodies);
fachliche Abnahme n/a (Betriebs-/Prozessbefund, kein Rechtsinhalt).
