# Steuerflächen-Diät 2.10.2026 — Belege aus `.claude/rules/webseiten-pruefung.md`

Verschoben 2026-10-02 (QS-DOKU-DIAET, Auftrag David «räum die plan-doku auf», Spec `.claude/notizen/2026-10-02-steuerflaeche-diaet-spec.md`). Quelle: `.claude/rules/webseiten-pruefung.md`.
Wortlaut der Passagen unverändert (Byte-Kopie der Spanne); am Ursprungsort bleiben Regel + Zeiger «Archiv §<Label>». Datierte Belege werden hier nie nachgeführt, nur ergänzt (Dispatch-§0 Ziff. 2b).

## §Pane-Anlass

Stelle: Abschnitt «Was der Browser-Pane NICHT messen kann», Absatz «Anlass»

**Anlass:** Eine Pane-Messung meldete die Standort-Marke der Gliederung als in
Produktion tot (`[data-toc-aktiv]` = 0 über 28'000 px, auch auf der Live-Seite).
Der echte Defekt lag woanders (verhungerte Entprellung, `inhalt-hooks.tsx`), und
drei der vier daraus abgeleiteten Ursachen-Verdachte waren falsch.

## §Zustandsfolge

Stelle: Abschnitt «Drittens — Zustand ist eine Folge», Beleg #924

Beleg 19.9.2026 (#924):
`gliederung-sichtbarkeit.test.ts` war 12/12 grün, während Tieflink → Auto-Zu →
Zurückscrollen eine reine Artikelliste öffnete (`art@` blieb beim Zuklappen
stehen, 4'580 Fälle), gefunden erst im Code-Zweitblick.
