# FAHRPLAN-DESIGN-WAERME — Farbklima, Wärme, Atmosphäre, Typografie
<!-- @lagebild name: Design & Atmosphäre · zweck: Wärmeres, ruhigeres Erscheinungsbild — Token-Schicht, dann Anwendung. -->

Stand: 11.7.2026 · Auftrag David (wörtlich): «ultracode recherche zu design und plan
erstellen. also hinsichtlich farbe und wärme und so weiter» + «direkt umsetzen wenn
plan vorliegt». ROADMAP-Schritt **W2·11-DESIGN**. Trailer `Roadmap: W2·11-DESIGN`.

Quelle: Ultracode-Recherche 11.7.2026 — 48 Befunde (24 empirische Mess-Befunde am
Live-Stand + 24 Forschungs-Befunde: Anthropic/Claude-System, Flexoki, Radix, Stripe,
iA Writer, OKLCH/Evil Martians, APCA, Lesbarkeits-/Dark-Mode-Literatur), adversarial
durch 3 Kritik-Linsen (reglement-treue · umsetzbarkeit · geschmacks-kohärenz)
gegengeprüft. Kernsatz der Kohärenz-Linse: **Die Forschungs-Schicht IST der Plan,
die Mess-Befunde sind ihre Symptomliste — System vor Symptom**, sonst entstehen zwei
konkurrierende Wärme-Kanäle (Patchwork).

**Achtung Befund-Vintage:** Teile der Messungen datieren vor den Merges vom
10./11.7. (C-1/C-2/C-3 Farb-Wörterbuch, #201). Vor jedem Bau-Schnitt den betroffenen
Ist-Stand am Prod/HEAD **re-verifizieren** (Muster W2·10-UI-NAV) — z. B. die
Currency-Chip-Tonung sage/warn (Befund 7) ist durch C-2 bereits gebaut.

---

> Erledigt-/Stand-Abschnitte vom 14.8.2026 nach `archiv/FAHRPLAN-ERLEDIGT-ABSCHNITTE.md` verschoben (QS-PLAN-EINFACH).

## §5 · ROADMAP-Spec W2·11-DESIGN (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «2 · Bau-Einheiten (Reihenfolge ist harte Abhängigkeit)» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  Farbklima/Wärme/Typografie-Plan aus 48 Ultracode-Befunden + 3 Kritik-Linsen (reglement-treue ·
  umsetzbarkeit · geschmacks-kohärenz). Fünf tragende Entscheide: **E1** Ein Papier, eine Tinte,
  ein Winkel (OKLCH-Rekalibrierung der Neutralen auf Brass-Hue, kein zweiter Wärme-Kanal) ·
  **E2** Brass ist Signal, nicht Klima (warm empfangen, kühl prüfen) · **E3** Zwei Stimmen
  (Serif=Werkstoff/Sans=Werkzeug, Mono-Diät) · **E4** Ein Lese-Register (`--reading-ink`,
  Kontrastfenster) · **E5** Rollen vor Stufen, Messung vor Geschmack (`check:farbwelt`-Tor).
  Bau-Einheiten D-0 Mess-Fundament → D-1 Sofort-Fixes (FS-Bug · Overline-AA · danger-dark-1.4.11 ·
  Lesespalte Regeste/Verdikt · Chevron · Motion-Dedup) → D-2 Rollen-Aliase+§13-Nachträge →
  D-3 oklab-Mix → D-4 Ink-Wärme → D-5 Papier-Treppe → D-6 Dunkel-Paket → D-7 Lese-Register →
  D-8 Wörterbuch-auf-Fläche+Mono-Diät; D-9 = David-Entscheide (Display-Serif · Typo-Rampe ·
  Stripe-L) nur bereitgelegt. Fixpunkte: `--paper` hell/dunkel + C-1/C-2/C-3-Kalibrierung;
  golden byte-gleich; §15 ohne Textur/Font-Zuwachs. **Vor jedem Schnitt Prod-Re-Audit**
  (Befund-Vintage teils vor #201). Verworfen mit Grund (`--paper-warm`, Dark-Brass-Tausch,
  Elevation-Neubau, Sepia-Modus u. a.). Detail: diese Datei.
  Trailer `Roadmap: W2·11-DESIGN`.

### Teilschritt-Spezifikation W2·11-DESIGN (verschoben 31.7.2026)

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026, Nachhalte-Konvention*
*Ausführungs-Protokoll Ziff. 6). Die ROADMAP führt je Teilschritt nur noch Checkbox,*
*`@meta` und einen Einzeiler; der Wortlaut unten ist die massgebliche Fassung.*

**Schnitt-Begründung (Session-Granularität AP-6) — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  **Session-Granularität (AP-6, 31.7.2026):** D-0…D-5 sind gebaut; offen bleiben D-6, D-7 und D-8.
  Die Teilschritte unten folgen der **harten Kette** des Fahrplans (`D-6 → D-7 → D-8`) und der Regel
  «**nie zwei Token-Einheiten in einem PR**»; D-8 ist entlang seiner eigenen Nummerierung 1/2/3
  geschnitten, weil es als einzige Einheit **nicht flip-reversibel** ist (Call-Site-Arbeit, Pilot
  zuerst). Dieser Schritt bleibt das Dach. **Bewusst NICHT als Teilschritt:** die 5 D-9-Posten
  (David-Entscheid-Mappe, Abnahme-Zeitsperre bis 1.12.2026).

**Ursprünglicher Wortlaut der Teilschritt-Bullets — wörtlich:** *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  - [ ] **DESIGN-D6 · Dunkel-Paket: Elevation, Schatten, Scrims (EIN PR)** — surface dunkel heben · warme Schattenbasis · Lichtkante · Scrim-Audit; Token-only, flip-reversibel, `check:farbwelt` + axe dunkel. Detail: diese Datei §2 (D-6). Trailer `Roadmap: W2·11-DESIGN-D6`.
  - [ ] **DESIGN-D7 · Ein Lese-Register (`--reading-ink`, `--lese-fs`/`--lese-lh`)** — Lese-Basis + Entscheid-Stepper als Multiplikatoren, CPL-Messung, Regel in beide Domänen-Reglemente; golden neutral. Detail: diese Datei §2 (D-7). Trailer `Roadmap: W2·11-DESIGN-D7`.
  - [ ] **DESIGN-D8a · Wörterbuch auf die Fläche: slate auf Entscheid-Flächen (D-8.1)** — Entscheid-Leser-Chrome und Rubrik-Label auf die Rollen-Schicht ziehen; Playwright-Screens in die Abnahme-Mappe. Detail: diese Datei §2 (D-8.1). Trailer `Roadmap: W2·11-DESIGN-D8a`.
  - [ ] **DESIGN-D8b · Mono-Diät — Pilot, dann mechanischer Rest (D-8.2)** — ~50 verteilte Fundstellen; **Pilot zuerst** (Startseite + 1 Rechner) mit Vorher/Nachher-Screens, danach der Rest. Nicht flip-reversibel. Detail: diese Datei §2 (D-8.2). Trailer `Roadmap: W2·11-DESIGN-D8b`.
  - [ ] **DESIGN-D8c · Motiv-Katalog (D-8.3)** — `scale-rule`-Motiv an 2–3 Sektions-Orten, Abschluss der Anwendungs-Schicht. Detail: diese Datei §2 (D-8.3). Trailer `Roadmap: W2·11-DESIGN-D8c`.

### Dach-Prosa W2·11-DESIGN im Wortlaut (verschoben 31.7.2026) *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

*Aus `ROADMAP.md` hierher verschoben (QS-TOK-Nachdiät, 31.7.2026); massgebliche Fassung.*

>   Farbklima/Wärme/Typografie-Plan aus 48 Ultracode-Befunden + 3 Kritik-Linsen — Token-Schicht nach
>   §13, Normtext-Körper bleibt farbfrei, golden byte-gleich.
>   **Detail:** diese Datei §5. Trailer `Roadmap: W2·11-DESIGN`.


---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

7 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-DESIGN-WAERME.md`](../archiv/fahrplaene/FAHRPLAN-DESIGN-WAERME.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- 0 · Fixpunkte (unantastbare Anker)
- 1 · Die fünf tragenden Design-Entscheide
- 2 · Bau-Einheiten (Reihenfolge ist harte Abhängigkeit)
- 3 · Verworfen (explizit, mit Grund)
- 4 · Prozess
- §6 · ROADMAP-Spec-Nachzug `W2·11-DESIGN-D8b` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
- §7 · David-Entscheide 29.8.2026 (Design-Qualitäts-Pass Gesetzes-Bereich)
