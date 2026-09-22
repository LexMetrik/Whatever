# UX-Audit Gesetzesdarstellung (2026-07) — Beleg-Ordner

Evidenz-Anhang zur Bau-Spec **`FAHRPLAN-GESETZES-UX.md`** (ROADMAP-Schritt
`W2·5d`). Ist-Aufnahme des Gesetz-Lesers + Fedlex-Messwerte + SotA-Patterns +
die Grundarten-Klassifikation, aus der G0 die Register-Felder `grundart`/
`erlassTyp`/`bestimmungsEtikett` seedet.

## Committet (versioniert)

Vollständig, weil load-bearing für Bau + Nachvollzug:

- **`erlass-klassifikation.json`** — die Klassifikation aller 1460 Erlasse in 8
  Grundarten (+ Signale je Erlass, `grenzfaelle`). **Datengrundlage für G0**
  (`scripts/normtext/seed-grundart.mjs` → `src/lib/normtext/grundart.generated.ts`).
- **`klassifiziere-erlasse.mjs`** — das Skript, das die Klassifikation erzeugt
  (Signal-Extraktion + Prioritäts-Kaskade), für Reproduzierbarkeit.
- **`fedlex/measurements.json`, `fedlex/inspect.json`** + `*.mjs` — die
  Fedlex-Messwerte (Typo, Zeilenlänge, Struktur) hinter Abschnitt 2.1 der Spec.
- **`reader/*.mjs`** — die Playwright-Capture-/Mess-Skripte (`measure.mjs` wird
  vom späteren Tor `e2e/leser-lesemass` wiederverwendet, Spec R5).
- **`belege/`** — eine kompakte Referenzbild-Auswahl (je 1 pro Kernbefund,
  verkleinert auf ≤1200 px):
  - `befund-zgb-linien-lexmetrik-desktop.png` — «Barcode/Gleisbett»: bis zu 5
    parallele Guide-Linien bei uns (ZGB Art. 684) → Linien-Sprache-Refactor (D-A).
  - `befund-zgb-lesespalte-lexmetrik-mobil.png` — Mobil-Kernproblem: Lesespalte
    kollabiert auf ~16 ch (Ziel ≥40 ch, D-B/D-D).
  - `befund-zgb-fedlex-desktop.png`, `befund-or-fedlex-struktur-desktop.png` —
    Fedlex als Mindestlatte: «die Struktur schreit, der Rechtstext flüstert».
  - `befund-kanton-uebersicht-desktop.png` — Kantons-Übersicht «sehr
    unübersichtlich» (Abschnitt 4.3).
  - `befund-vmwg-kurzerlass-desktop.png` — FLACHER_KURZERLASS ohne Lesespalte
    (volle Breite ~59 ch, Abschnitt 2.2 ④).

## Lokal verblieben (NICHT committet)

Die vollständigen, unverkleinerten Screenshot-Serien bleiben aus Grössen-Budget
lokal im Arbeitsbaum (Haupt-Repo `docs/ux-audit-2026-07/`) und werden nicht
versioniert — die `belege/`-Auswahl oben genügt als Beweis. Betroffen:

- `reader/` — `*-desktop.png` / `*-mobile.png` für ZGB (684/top/fn/fussnoten-on),
  OR 319, VMWG, LugÜ, Kanton-ZH (je Desktop + Mobil).
- `uebersichten/` — `gesetze-einstieg`, `bund-systematik`, `erlass-OR-toc`,
  `kanton-uebersicht`, `kanton-AR`, `kanton-ZH`, `bund-sachgebiet-expanded`
  (Desktop + Mobil).
- `fedlex/` — `emrk-art1.png`, `or-top.png`, `or-art319.png`, `sr0-top.png`,
  `zgb-top.png`, `zgb-art1.png`, `zgb-art684.png` (Roh-Screenshots; die
  Messwerte daraus stehen committet in `fedlex/measurements.json`).

Regenerierbar über die committeten `*.mjs`-Capture-Skripte gegen die laufende App
bzw. Fedlex.

## Bildschirmfotos ausgelagert (22.9.2026)

Die 549 PNG-Belege dieses Audits (130 MB) liegen seit dem 22.9.2026 nicht mehr im
Repo, sondern im Obsidian-Vault unter
`~/Documents/David/03_Projekte/LexMetrik/archiv-belege/ux-audit-2026-07-screenshots.zip`
(Weisung David 22.9.2026: Belege, die kein Werkzeug liest, nach Obsidian auslagern;
Kriterium in `fahrplaene/FAHRPLAN-WERKBANK-UMBAU.md` §2). Die Text-Befunde, JSON und
Skripte bleiben hier; Bildverweise in den Befund-Dateien zeigen auf die Pfade im Zip.
Git-Historie bis `adef0ae29` trägt die Bilder weiterhin.
