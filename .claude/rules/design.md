---
paths:
  - "src/pages/**"
  - "src/components/**"
  - "src/index.css"
---
# §13 Design → `DESIGN-REGLEMENT.md`

Jede sichtbare Änderung folgt `DESIGN-REGLEMENT.md`: Teil I ist das Dach, Teil II
konkretisiert je Domäne (§N/§R/§J/§V). Bei Konflikt gewinnt das speziellere
innerhalb seiner Domäne, sonst das Dach. Der hier tragende Satz —
**jeder Rechtswert mit Norm, Link und Stand** (D1) — ist mit §7 verzahnt.
Design-Werte kommen nur aus `design/tokens.json` (Projektion per
`npm run gen:tokens`, Wächter `check:tokens-drift`), nie als Ad-hoc-Wert.

## Handschrift «Sammlung» — Detail in §F0

1. Literata liest, Archivo bedient, Mono nur Rechenweg/Code (Zahlen `tabular-nums`) → F0.4; Titel → F0.11
2. Papier/Tinte chromafrei-nah, Leiter `well<paper<surface<paper-raised` → F0.1
3. Reinweiss existiert genau einmal: `--paper-raised`, die schwebende Ebene → §G d
4. Registerfarben `--reg-g/r/m/w` Strich/Kante/Marke; Fläche nur `--reg-*-flaeche`, Tinte darauf → F0.2
5. Status bleibt `sage/slate/warn/danger`, keine Ad-hoc-Farbe → B3
6. `--accent-*`/`--brass-*` sind **neutral = Tinte**; der Klassenname lügt, die Werte gelten → F0.3
7. Radien 4 · 8 · 10 · 14 (Marke · Knopf/Zeile · Karte/Schwebefläche · Fläche/Kachel), Pille `rounded-full`; gerade bleiben Linien, Registerstriche, Tabellen, Normtext; ein Schatten, nur `.lc-schwebeflaeche` → F0.5
8. Trennung über Linien: 1 px `--rule-soft`, 2 px `--rule` — nicht über Kästen → F0.6
9. Etiketten ohne Versalien und ohne Sperrsatz (Regel sitzt an `.lc-overline`) → F0.7
10. Inline-Links unterstrichen; Navigation/Listen/Chips dürfen ohne, sagen es im Markup → F0.8
11. Menü = Liste mit Linien + Zustandswort + Fokus-Strich; Feld = Unterstrich, Panel setzt es fort → F0.9
12. Sprache: keine Slogans, keine Nutzenversprechen — Bezeichnungen, Zahlen mit Scope, Verben → §A6

Normtext hat eigene Regeln: `DESIGN-REGLEMENT.md` §N-4b (Linien-Kanon,
Lese-Typografie) und §N-4b-B (Farb-Wörterbuch) — §N-4b-B ist **gegatet**,
`check:farbwelt` vergleicht seine Zahlen gegen die Messung. Aufgehobene Regeln
(Brass als Marke, Wärme-Dramaturgie, Geist/Source Serif 4, Versal-Overlines,
«Kanten statt Kissen», abgelöst durch F0.5 «Rundung mit Mass»): je eine Zeile
in der §-Konkordanz (F0.10).
