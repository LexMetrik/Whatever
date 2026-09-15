# Gliederungs-Performance-Diagnose 8.8.2026 (Fehlerbuch-Befund David)

**Erstellt:** 8.8.2026 — Fehlerbuch-Befund David, 8.8.2026 abends: «das mit der gliederung
funktioniert immer noch sehr harzig … sie springt komisch».
**Status:** ERSTRECHERCHE

**Anlass:** David, 8.8.2026 abends (Wortlaute): «das mit der gliederung
funktioniert immer noch sehr harzig» · «sie springt komisch und ist nicht
flüssig. gerne sollen auch teile wieder zugehehen wo man sich gerade nicht
befindet» · «ausserdem ist die hervorhebung missglückt. das geht schöner».

**Methode:** Read-only-Diagnose (Opus-Agent, Worktree auf main `12e8fecc4`,
kein Commit): echter Build + Preview, Playwright-Bedienung mit/ohne CPU-Drossel
(4×/6×), PerformanceObserver (Long Tasks, Frames), CDP-Trace/Profiler,
A/B-Proben per Laufzeit-CSS-Injektion; Median aus ≥2 Läufen, Parallel-Last-
Serie verworfen (Messhygiene dokumentiert). OR (2181 Baum-Einträge, 1686
Artikel) gegen BGFA (236) als Kontrolle.

## Kernbefund: Die Gliederung ist Opfer, nicht Täter

| Szenario (OR, Dokument-Scroll 60×1200 px) | Frame med | TBT | Transition-Ereignisse |
|---|---|---|---|
| 1×, Ist, Maus im Text | 33.3 ms (30 fps) | ~0 | **142 208** |
| 1×, Artikel-Transition aus | 16.7 ms (60 fps) | 0 | 537 |
| 4×, Ist | 115 ms | **8 845–9 003 ms** | 142 137 |
| 4×, Transition aus | 49.7 ms | 1 757–1 939 ms | 567 |
| 4×, Maus am Fensterrand | 17.2 ms | **283–297 ms** | **0** |

- **U1 (~78 % der Blockierzeit): Hover-Spotlight der Lesespalte.**
  `ArtikelLeser.tsx:411` trägt an jedem der 1686 `<article>` eine
  `transition duration-200`-Opazitäts-Kette über `group-has(:hover)`; jedes
  Hover-Kippen beim Scrollen startet 1686 gleichzeitige Transitionen (4
  Ereignisse je Element, React-Root-Dispatcher 284 499 Aufrufe/7 s). Herkunft:
  Commit `820db9dc1`, 18.6.2026, Davids Feedback («andere Artikel dimmen»).
- **U2 (~20 %): `:has()`-Invalidierung** über die ganze Lesespalte — Boden erst
  mit `pointer-events:none` erreichbar (300 ms TBT @4×).
- **U3: Baum-Rendering.** 11 075 DOM-Knoten dauerhaft gemountet (grid-0fr
  klappt nur Höhe), ein einziges memo-Bauteil ohne Knoten-Memo, Klickpfad mit
  `flushSync` ⇒ Klick-Latenz @4× 231 ms (BGFA 33 ms).
- **U4: Auto-Zuklappen konstruktiv tot.** `inhalt-hooks.tsx:520` verlangt
  `r.top >= contRect.bottom` (Ast ganz UNTERHALB des Sichtbands) — beim
  Vorwärtslesen liegen verlassene Äste oberhalb ⇒ **0 Zuklapp-Ereignisse in
  jedem Lauf**, Baum wächst monoton 18 → 140 sichtbare Zeilen (+330 % Höhe).
  Davids Wunsch = Wiederherstellung seines Auftrags K vom 26.6.2026; die
  Zähmung stammt aus der A9-CLS-Forensik 19.7.2026 (Befund 3).
- **U5: «springt komisch»** ist Folge von U4: Nudge beim Lesen gesund (39 px
  Median), aber Sprung-Sätze 777 px Median (bis 8 524 px), weil der wachsende
  Baum den aktiven Eintrag aus dem Sichtband schiebt; Verstärker: alle sechs
  Vorfahren tragen `data-toc-aktiv`/`aria-current`.
- **Nebenbefund:** `App.tsx:97` liest `window.scrollY` im ungedrosselten
  Scroll-Listener (erzwungener Layout-Flush 9.9→75.5 ms je Event @1×/4×);
  Nachbar-Effekt (A16) ist bereits rAF-gedrosselt.
- **Widerlegt:** IntersectionObserver-Sturm (1.08 ms/Auswertung) ·
  `content-visibility`-Flip-Flop · B4-N1-Tiefenführung (36 von 142 244
  Ereignissen; Baum-Scroll pur 16.7 ms/1.4 % Jank).
- **Hervorhebung (Ist):** sechs Zeilen gleichzeitig flächig `bg-brass-100`
  (jeder Vorfahre `aria-current="true"` — §8-Falschaussage); im Dunkelmodus
  ~1.3:1-Fläche («Schmutzfleck»).

## Fix-Paket (Umsetzung: Branch feat/w2-17-gliederung, Session 8.8.2026)

F1(a) Artikel-Transition entfernen — Dimm-Effekt (Davids 18.6) bleibt, nur die
Weichheit entfällt; gemessen 30→60 fps, TBT 8.9 s→1.9 s @4×. F2 Zuklappen
wiederherstellen (auch Äste OBERHALB; Höhendifferenz im selben Frame per
scrollTop-Kompensation — CLS 0), Nachlauf 6→2–3 ⇒ konstant ~39 Zeilen. F3
Baum: memoisierte Zeilen, zugeklappte Äste unmounten (11 075→~250 Knoten; der
Baum ist KEIN Normtext — §15-Virtualisierungsverbot betrifft die Lesespalte).
F4 App.tsx:97 auf rAF. F5 Hervorhebung: EINE Positionsmarke (nur tiefster
Knoten mit `aria-current`), Pfad über Tinte, 2-px-Kante in brass-500 statt
Goldfläche (Sidebar-Muster, beide Themes ≥3:1). Aufgeschoben: F1(b)
Scrim-Dimmen (ändert das Mittel von Davids 18.6-Effekt — nur mit David).

**Status: einfach belegt** (Messreihen ≥2 Läufe, <5 % Streuung; Rohdaten/
Screenshots lagen im Diagnose-Worktree-Scratch, Kennzahlen hier vollständig).
**Pflegebedarf:** nach dem Fix-Merge Nachmessung dokumentieren (gleiche
Szenarien); LM-163 (B6) gegen die neue Lage prüfen.
