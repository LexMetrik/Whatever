# FAHRPLAN — Prozesskosten-Cockpit (Vertiefung & Ausbau)
<!-- @lagebild name: Prozesskosten-Cockpit · zweck: Der Haupt-Rechner: Restbau plus Verzahnung Frist und Kosten. -->

**Heimat: ROADMAP-Schritte `W1·4` und `W1·5-PRAXIS`.**
*24.9.2026: `W1·5-PRAXIS` ist in `W3-AUSBAU` aufgegangen — Posten dort (ROADMAP-CHRONIK.md, Fusionen 2026-09-24).*

## §0 · Zweck und Disziplin

Detailquelle zu `W1·4`/`W1·5-PRAXIS` — den Prozesskostenrechner (P1-Hauptmoat) zum
Kostenrisiko-Cockpit über die volle Matrix vertiefen. Jede Etappe: §7 (amtlich
verifiziert, mit Link) · §2/§8 (Ermessen = Spanne + Kriterien, kein erfundener
Punktwert) · §6 (Gate grün, golden) · §9 (Bug-Check + Deploy nur auf Davids
frisches Ja). Engine bleibt dünner Lader; keine Rechtslogik in der UI (§3).

**Anlass:** Direktive David (14.6.2026) — den Prozesskostenrechner (P1-Hauptmoat,
bereits live auf lexmetrik.vercel.app) „insgesamt noch viel vertiefen und
umfangreicher gestalten". Ziel: das umfassendste, amtlich belegte und
deterministische Prozesskosten-Werkzeug für die Schweizer Kanzlei — kein
Tarif-Lookup, sondern ein **Kostenrisiko-Cockpit** über die volle Matrix.

**Disziplin:** jede Etappe §7 (amtlich verifiziert, mit Link) · §2/§8 (Ermessen
= Spanne + Kriterien, kein erfundener Punktwert) · §6 (Gate grün, golden) · §9
(Bug-Check + Deploy nur auf Davids frisches Ja). Engine bleibt dünner Lader über
`lib/tarif/staffel` + kantonaler Datenschicht; keine Rechtslogik in der UI (§3).

## §1 · ROADMAP-Spec W1·5-PRAXIS (wörtlich verschoben 31.7.2026)

> **→ Bau-Spec: «§Verzahnung — Frist × Kosten als Praxis-Workflow» dieser Datei.** Dieser § ist die *wörtlich hierher verschobene ROADMAP-Prosa* (Wortlaut-Heimat), nicht die Bau-Spezifikation — wer nur ihn slict, baut ohne die verbindlichen Einheiten, Entscheide und Querschnitt-Regeln.

*Wörtlich aus `ROADMAP.md` (QS-TOK/ROADMAP-Diät B4, 31.7.2026); dort bleiben Checkbox, `@meta`, Einzeiler, Pointer. Steuert nicht — Spec-Heimat.* *Wörtlich bis auf die Selbstverweise, die am 31.7.2026 auf «diese Datei» neutralisiert wurden (Endprüfung Fix-Runde 1; Fund R2-18).*

  Die heute isoliert nebeneinander stehenden Rechner zu **einem Praxis-Workflow verketten**:
  Streitwert-Ergebnis → Gerichtskosten + Parteientschädigung; Rechtsmittelfrist ab Entscheiddatum ×
  Kanton × Gerichtsferien → in denselben Kostenfluss und in den `.ics`-Export. **Baut vollständig auf
  Gebautem:** `prozesskosten.ts` (Art. 95 ZPO, alle 26 Kantone), `streitwert.ts`, `staffel.ts`,
  `zpoFeiertage.ts`/`schkgFeiertage.ts` (Computus + 26-Kantone-Feiertagsmatrix, BJ-verifiziert),
  `fristenEngine.ts` + Fachlader, `rechnerPermalinks.ts`/`permalink.ts` (Prefill), `icsExport.ts`.
  **Feasibility 🟢 aus-Bestand — ehrlich:** es fehlt **nur eine dünne UI-Orchestrierungs-/Prefill-Schicht**
  (Ergebnis-Übergabe zwischen Rechnern), **kein neues Rechenfundament**; keine offene technische Frage.
  **Nicht zu verwechseln mit `W1·4`** (Prozesskosten-Cockpit, `parked` auf `wbqdyap3x`): W1·4 betrifft
  Cockpit-Interna und Reduktionsfaktoren und ist blockiert — W1·5-PRAXIS ist die cross-Rechner-
  Verzahnungsschicht darüber und **unblockiert**; kein Parallel-Schritt zur selben Bau-Fläche (§14.3).
  Offen ist allein die Formfrage (eigene «Kosten-Cockpit»-Fläche vs. Prefill-Deep-Links) — Entscheid
  beim Bau, kein Blocker. Detail: diese Datei §Verzahnung. **DoD:** §6-/§9-Tore
  grün · **golden byte-gleich** (Engines bleiben unberührt) · `check:gegenpruefung` nur, falls doch ein
  Risiko-Glob berührt wird — sauberes Chaining vermeidet das. Trailer `Roadmap: W1·5-PRAXIS`.

---


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

5 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md`](../archiv/fahrplaene/FAHRPLAN-PROZESSKOSTEN-COCKPIT.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- Die Zielmatrix
- Etappen
- Reihenfolge
- §Verzahnung — Frist × Kosten als Praxis-Workflow (`W1·5-PRAXIS`, Ideen-Intake 20.7.2026)
- §2 · ROADMAP-Spec-Nachzug `W1·4` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)
