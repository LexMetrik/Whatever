# FAHRPLAN — UI-Befundliste extern (210 Befunde, Cowork 29.7.2026)
<!-- @lagebild name: Feinschliff-Befundliste · zweck: Abarbeitung der 210 Befunde einer externen Sichtprüfung (29.7.2026) in Paket-Kette. -->

**Heimat: ROADMAP-Schritt `W2·17-UI-BEFUNDE`** · Stand 31.7.2026 (Anlage AP-9, QS-TOK-Aufräumwelle).

Wortlaut aller 210 Befunde: [`docs/ui-befunde-2026-07/BEFUNDLISTE-COWORK-2026-07-29.md`](../docs/ui-befunde-2026-07/BEFUNDLISTE-COWORK-2026-07-29.md).
Hier steht **nur die Steuerung** — kein Volltext, keine zweite Wahrheit (§5).

---

## §0 · Quer-Lektionen (vor JEDEM Batch lesen)

**§0.1 Vintage-Regel.** Die Sichtprüfung stammt vom **29.7.2026**; seither ist gebaut worden
(u. a. W2·7-BEZUG B7 am 29.7.). **Vor jedem Batch werden die betroffenen Befunde am
Prod-Stand reproduziert** — genau nach der Spalte «Prüfen», die zugleich das Fertig-Kriterium
ist. Was sich nicht mehr reproduzieren lässt, wird als **«erledigt (überholt)»** geschlossen,
mit einer Zeile, warum. Nie blind bauen: ein Fix ohne vorher gesehenen Fehlschlag ist kein Fix.

**§0.2 Referenz-Pflicht.** Jeder Befund mit Dedup-Marker trägt eine `dedup_referenz`. Die wird
**vor** dem Bau gelesen. Wo der Bestand einen Entscheid dokumentiert hat (gebaut, verworfen,
aufgeschoben mit Grund), wird dieser Entscheid **nicht still gekippt** — entweder er trägt,
oder er wird ausdrücklich und begründet geändert (§14).

> **Anker-Form (Nachtrag 31.7.2026, Endprüfungs-Funde 16/17).** Eine **blosse Zeilenangabe
> ist kein gültiger Anker.** Sieben Referenzen waren schon zwei Commits nach dem Schreiben der
> Befundliste auf den Nachbarabsatz gerutscht (Kopfzeilen-Einschübe aus AP-7 und der
> Nachdiät), eine (LM-124) traf von Anfang an die falsche Stelle. Jede `dedup_referenz` nennt
> darum einen **§-, Überschriften- oder `@meta`-Anker**; eine Zeilenangabe darf nur
> *zusätzlich* danebenstehen und ist nie der Anker selbst.
>
> **Geltungsbereich — ehrlich begrenzt (Nachtrag 31.7.2026, Endprüfungs-Fund R2-21).** Die
> Regel gilt **ab sofort für jeden neuen Eintrag**. Der **Altbestand** ist NICHT vollständig
> umgestellt: in dieser Datei stehen weiterhin Referenzen mit blosser `Z.`-Angabe (u. a.
> LM-025, LM-095, LM-098). Umgestellt wurden bisher die sieben nachweislich verrutschten plus
> LM-124 und LM-096. **Auflage für den Altbestand:** jede noch vorhandene Zeilenangabe trägt
> beim nächsten Anfassen zusätzlich den §-/Überschriften-Kontext, und zwar im Batch, der den
> Befund baut (`B1`…`B20`) — nicht in einem eigenen Durchgang. Bis dahin ist die Regel eine
> **Vorwärts-Regel**, keine erfüllte Bestands-Aussage (§8: nicht mehr behaupten, als gedeckt ist).

**§0.3 Risiko-Trennung.** Der grösste Teil ist reine Darstellung (§3) und läuft ohne
Gegenprüfung. Drei Klassen laufen anders: **Such-/Query-Logik** (Relevanz, Ranking,
Substring-Treffer) — nie «UI-Fix», sondern eigener Nachweis; **§1-nahe Logik** (Eingabe-Parsing,
Formate, die in eine Engine laufen); **Risiko-Pfade** nach `istRisikoPfad()` →
`npm run check:gegenpruefung`. Die Risiko-Klasse steht in der Fussnote jedes Batches.

**§0.4 Werkzeug-Falle Scroll-Prüfung (B7-Lehre, 8.8.2026).** Programmatisches
Scrollen (`window.scrollBy`, CDP-Scroll) feuert KEINE echten Browser-Events —
wer Scroll-VERHALTEN (Menü-Schliessen, Listener) prüft, muss echte
`wheel`/`touchmove`-Eingaben senden (Playwright `mouse.wheel`), sonst täuscht
die Probe. Kostete in B7 eine Fehlrunde an LM-009.

**§0.5 SSoT.** Wortlaut ausschliesslich in `docs/ui-befunde-2026-07/`. Der Fortschritt
ausschliesslich hier (Checkboxen) und in `ROADMAP.md` (`@meta status`). Kein Feld doppelt.

---

## §7 · B6 — Fehler-, Leer- und Ladezustände (K-15)

**14 Befunde** · Blocker 1 · Hoch 9 · Mittel 2 · Detail 2 · `W2·17-UI-BEFUNDE-B6`

- *12 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§7 · B6 — Fehler-, Leer- und Ladezustände (K-15)» (verschoben 24.9.2026).*
- [x] **LM-163** · Hoch · Beim Scrollen erscheint ein vollständig leeres Fenster, das erst nach kurzer … — **Verdacht widerlegt, nicht reproduzierbar** (Nachprüfung 9.8.2026, W2·19-DoD): 1'469 einzeln ausgewertete Screencast-Frames, davon 1'042 auf Leser-Flächen (OR/ZPO, 1×/4×, hell/dunkel) — **0 Leer-Frames**; die frühere B6-«Live-Repro» war ein Werkzeug-Artefakt (mouse.wheel ÜBER das Seitenende erzeugt headless 40–60 % Leer-Frames auf JEDER Seite, auch auf einer nackten HTML-Kontrollseite ohne LexMetrik-Code; Tastatur-Kadenz auf derselben Seite: 0 %). Der content-visibility-Verdacht (GESETZES-UX §10.9) ist damit zurückgezogen; Mess-Hygiene-Regeln daraus → Skill `perf` §Messung. OFFEN bleibt: (a) headed GPU-Compositing/Trackpad-Momentum (headless nicht prüfbar — Davids Beobachtungsbedingung), (b) plausible Alternativ-Erklärung: ECHTE ~370-px-Leerfläche am Ende der Liste `/gesetze?ebene=bund` (Footer klebt nicht am Boden) füllt beim Scroll ans Ende den halben Bildschirm — risikoarm prüf-/behebbar (Fehlerbuch-Zeile W2·18). Status: offene Beobachtung — falls David es wieder sieht: Seite, Scrollrichtung und ob am Seitenende notieren. **Prod-Nachprüfung 4.9.2026 (B19+B6+B7-Batch, §0.1):** Hypothese (a) unverändert nicht prüfbar (headless), (b) am Prod-Stand (`lexmetrik.vercel.app/gesetze?ebene=bund`, 1440 px, echter `mouse.wheel` bis ans Dokumentende) **bestätigt reproduzierbar**: `scrollHeight − (scrollY + innerHeight) = 0` (Dokument korrekt zu Ende gescrollt), aber die Haupt-Spalte endet bereits rund 367 px vor dem Fusszeilen-Beginn — die Sidebar-Navigation ist länger als die Listen-Spalte, dazwischen bleibt reine Leerfläche stehen, GENAU die vom 9.8.-Befund vorhergesagte Grössenordnung. Nicht in diesem Batch behoben (B19+B6+B7, «reines UI» Detail-Fläche): die Ursache liegt im zweispaltigen Seitengerüst (Sidebar/Hauptspalte-Höhenausgleich), voraussichtlich dieselbe Fläche wie `W2·17-UI-BEFUNDE-B14+B16` (Seitengerüst/Inhaltsbreite, PR #670, zum Zeitpunkt dieser Prüfung offen) — Landung bitte auf Überschneidung prüfen, sonst eigener Fehlerbuch-Posten W2·18. **ERGÄNZUNG 23.9.2026 (W2·29-WERKBANK-LESER S5): im Gesetzes-Leser gegenstandslos, Rest bleibt offen.** Für die Leser-Flächen ist der Befund seit 9.8.2026 widerlegt (0 Leer-Frames in 1'042 Leser-Frames, s. o.); der Werkbank-Umbau des Lesers (S0–S5) hat daran nichts geändert, was eine Neumessung verlangte. Offen sind nur (a) headed GPU/Trackpad (headless nicht prüfbar) und (b) die ~367-px-Leerfläche der KATALOG-Seite `/gesetze?ebene=bund` (Seitengerüst Sidebar/Hauptspalte) — (b) gehört zur Rubrik `W2·29-WERKBANK-KATALOGE`, nicht zum Leser. **Umgehängt 25.9.2026 (REST S5c):** Leser-Teil gegenstandslos (s. o.); Katalog-Rest (b) als Posten `plan/posten/2026-09-25-lm-163-rest-367px-leerflaeche-am-ende-von-gesetze-ebene-bund.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.
- [x] **LM-166** · Hoch · Sachgebiete ohne Treffer verschwinden ersatzlos aus der Liste: ungefiltert stehen sechs … [Verdacht → FAHRPLAN-UI-NAVIGATION.md §6 J3 (Sachgebiets-Pipeline, Risiko-Pfad QS-GP) + §2 S5-Etappe 2 (Fac…] — **übersprungen** (B6-Bau-Session, Risiko-Pfad-Fläche `istRisikoPfad`/QS-GP, per Bau-Auftrag ausgenommen). **Erledigt (überholt), REST S5c 25.9.2026:** die zugrunde liegende Sachgebiets-Pipeline (J3) wurde am 29.8.2026 unter Gegenprüfung gebaut (`archiv/fahrplaene/FAHRPLAN-UI-NAVIGATION.md` §6 J3, ✅ gebaut) — vor Wiederaufnahme am gebauten Stand neu verifizieren.

**Code-Flächen (grob, aus den Routen):** `src/components/fehlermeldung.ts`, `src/components/ErrorBoundary.tsx`, `src/components/suche/SucheLeerzustand.tsx`, `src/pages/NotFound.tsx`.
**Risiko-Klasse:** reines UI — Text der Zustände ist §8-relevant (Ehrlichkeit, keine Beschönigung).
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §8 · B7 — Overlays und Menüfenster (K-02)

**8 Befunde** · Blocker 1 · Hoch 3 · Mittel 4 · Detail 0 · `W2·17-UI-BEFUNDE-B7`

- *7 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§8 · B7 — Overlays und Menüfenster (K-02)» (verschoben 24.9.2026).*
- [x] **LM-016** · Mittel · **zurückgestellt, nicht gebaut** — Root-Cause ist strukturell, nicht im Sprachmenü: die Topbar-Icon-Zeile endet (bei 1440 px) rund 126 px vor dem rechten Rand der `.max-w-content`-gekapselten Brotkrumleiste darunter, darum bleibt deren ✕ neben dem korrekt am Trigger verankerten Panel sichtbar. Eine Menü-Breite/-Position, die das kaschiert, wäre eine fragile Magic-Number-Lösung; der eigentliche Fix (Topbar-Icon-Zeile an `max-w-content` ausrichten) berührt die Topbar auf JEDER Route mit Brotkrumleiste — braucht einen eigenen, bewusst entschiedenen Schritt statt eines Bauteils in diesem Batch. **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-016-topbar-icon-zeile-126px-vor-dem-rechten-rand-der-max.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.

**Code-Flächen (grob, aus den Routen):** `src/components/layout/HeaderSuche.tsx`, `src/components/layout/ReiterUebersicht.tsx`, `src/components/layout/VerlaufUebersicht.tsx`, `src/components/suche`.
**Risiko-Klasse:** reines UI (Verankerung, Fokus, Schliessverhalten).
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §9 · B8 — Menüinhalt, Zustandsanzeige und Scrollbereiche (K-03 + K-07)

**10 Befunde** · Blocker 1 · Hoch 3 · Mittel 4 · Detail 2 · `W2·17-UI-BEFUNDE-B8`

- *10 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§9 · B8 — Menüinhalt, Zustandsanzeige und Scrollbereiche (K-03 + K-07)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/layout`, `src/components/forms`, `src/index.css`.
**Risiko-Klasse:** reines UI — Zählwerte in Menüs müssen der Datenlage entsprechen (§8).
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §10 · B9 — Textsatz und Umbruch (K-12)

**12 Befunde** · Blocker 1 · Hoch 2 · Mittel 4 · Detail 5 · `W2·17-UI-BEFUNDE-B9`

> **Stand 5.9.2026:** die beiden am 4.9.2026 zurueckgestellten Daten-Befunde LM-127 und LM-132
> sind als EIN Datenschritt gebaut (korpusweiter Sweep ueber `rubrum.besetzung`, wie die Dedup-Notiz
> verlangte). Damit ist B9 vollstaendig abgearbeitet.

- *12 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§10 · B9 — Textsatz und Umbruch (K-12)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/typografie.tsx`, `src/index.css`, `src/components/NormText.tsx`.
**Risiko-Klasse:** reines UI — Umbruch in Normtext darf den Wortlaut nicht verändern (§7).
**Tatsächlich angefasst (B9, 4.9.2026):** `src/components/vorlagen/wizard.tsx` · `src/components/ui/SelectionGrid.tsx` · `src/components/layout/HeaderSuche.tsx` · `src/components/kontext/KontextPanel.tsx` — `src/index.css` blieb unberührt. Die Vorab-Schätzung («typografie.tsx», «NormText.tsx») traf keine der elf Fundstellen; die Zeile bleibt als das stehen, was sie ist — eine Schätzung aus den Routen (§8).
**Normtext-Auflage erfüllt:** kein Umbruch-Fix fasste Normtext an. `golden:vergleich` 256 Fälle byte-gleich; der einzige Eingriff an einem zitierten Text (LM-129) verschob den Regeste-Auszug in einen eigenen Block, ohne `absicherWortgrenze` oder den Wortlaut zu ändern.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §11 · B10 — Aktions-Anker, Symbolknöpfe und Trefferflächen (K-09b)

**7 Befunde** · Blocker 1 · Hoch 1 · Mittel 5 · Detail 0 · `W2·17-UI-BEFUNDE-B10`

**Stand 4.9.2026 (Batch `b10-b17-knoepfe`, gemeinsam mit §18/B17 gebaut):** 7/7 geschlossen —
5 gebaut, 2 als überholt geschlossen (LM-096, LM-098). Jeder Befund vorher am Prod-Stand bzw. am
lokalen Preview von `origin/main` reproduziert (§0.1) und nachher am Batch-Preview per Playwright
nachgemessen; echte `mouse.wheel`-Eingaben statt programmatischem Scrollen (§0.4).

- *7 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§11 · B10 — Aktions-Anker, Symbolknöpfe und Trefferflächen (K-09b)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/ui`, `src/pages/gesetz-leser`, `src/components/rechtsprechung`.
**Risiko-Klasse:** reines UI.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §12 · B11 — Karten (K-04)

**13 Befunde** · Blocker 0 · Hoch 4 · Mittel 7 · Detail 2 · `W2·17-UI-BEFUNDE-B11`

- *12 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§12 · B11 — Karten (K-04)» (verschoben 24.9.2026).*
- [x] **LM-032** · Mittel · In Ergebniskartenreihen fehlt einzelnen Karten die dritte Zeile (Normzeile); unter dem … [Verdacht → FAHRPLAN-ARCHIV-RESTPUNKTE.md §20/A3; Code src/components/vorlagen/ui.tsx:210–220 (EckdatenKach…] — **zurückgestellt** (B11-Karten, 4.9.2026). Reproduziert auf `/rechner/verjaehrung` (1440 px): in einer Reihe gleich hoher Kacheln (102 px) trägt die erste drei Zeilen (y 17/38/69), die zweite und dritte nur zwei. Die fehlende dritte Zeile ist aber die NORM-Zeile — Rechtsinhalt mit Beleg (§3/§7), keine Darstellungsgrösse; sie je Kachel zu erfinden wäre fachliche Autorschaft. Der im Befund angebotene Ersatz «—» scheidet aus: LM-039 desselben Batches verwirft genau diesen Strich. Bleibt der reine Höhen-Anteil — und der ist der offene A3-Entscheid («Kacheln einer Reihe gleich hoch», David-Abnahme seit 26.6.2026, FAHRPLAN-ARCHIV-RESTPUNKTE §20, Anker «UX-PUNKTELISTE A3»), der nicht still gekippt wird (§0.2). Wiedervorlage: mit der A3-Abnahme, dann als fachlicher Schritt «Normzeile je Eckdaten-Kachel». **Umgehängt 25.9.2026 (REST S5c):** A3-Höhenteil seit RECHNER R2 (24.9.) gegenstandslos; fachlicher Rest als Posten `plan/posten/2026-09-25-lm-032-normzeile-der-eckdaten-kacheln-fehlt-fachlich-verjaeh.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.

**Code-Flächen (grob, aus den Routen):** `src/components/Katalog.tsx`, `src/components/start`, `src/components/ui`.
**Risiko-Klasse:** reines UI.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §13 · B12 — Eingabe- und Auswahlfelder — Blocker bis Mittel (K-08a)

**11 Befunde** · Blocker 0 · Hoch 4 · Mittel 7 · Detail 0 · `W2·17-UI-BEFUNDE-B12`

- [x] **LM-066** · Hoch · Bedienelemente derselben Zeile sind unterschiedlich hoch: Segmentschalter 39 px neben Datumsfeld … [Verdacht → FAHRPLAN-ARCHIV-RESTPUNKTE.md §20 (UX-PUNKTELISTE A3, Betreibungskosten-Kacheln items-start sta…] — **zurückgestellt** (B12, 4.9.2026). REPRODUZIERT am gebauten Stand (`/rechner/gewaehrleistung` @1440, Zeile «Art des Mangels» / «Rüge erhoben am», beide `top: 767`): Segmentschalter **36 px** neben DatumsFeld **50 px**. Gebaut wird trotzdem nicht, und zwar aus dem Grund, den die Dedup-Notiz vorhergesagt hat: die Höhenspreizung sitzt in den Komponentenklassen selbst (`.lc-input` 50 px aus `padding: 12px 14px`, `.lc-btn` 44 px, `.lc-btn-sm`/`.lc-input-sm`/`Tabs` 36 px), nicht an dieser Call-Site. Ein `h-[50px]` am einen Aufruf wäre eine Magic Number, die die Wurzel nicht heilt; `Tabs` app-weit auf Feldhöhe zu setzen (`HOEHE` in `components/ui/Tabs.tsx`, `groesse` kennt nur `s`/`m`/`zweizeilig`) trifft jede Werkzeugleiste der App. **Genau diese Vereinheitlichung ist die seit 26.6.2026 offene David-Abnahme A3** (`FAHRPLAN-ARCHIV-RESTPUNKTE.md` §20, UX-PUNKTELISTE A3 «Zeilen-Ausrichtung/Höhen in Rechner-Formularen») — sie wird hier nicht still vorweggenommen (§0.2). **Entschieden, REST S5c 25.9.2026:** David-Entscheid 25.9.2026 — belassen (kein Bau; Posten `archiv/posten/2026-09-23-w2-9-a-kachel-hoehen-gebvkostenform-tsx-97-samt-lm-032-066-0.md`, `archiv/posten/2026-09-25-lm-066-bedienhoehen-tabs-36-px-vs-lc-input-50-px.md`).
- *9 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§13 · B12 — Eingabe- und Auswahlfelder — Blocker bis Mittel (K-08a)» (verschoben 24.9.2026).*
- [x] **LM-075** · Mittel · Die beiden Datumsfelder sind Browser-Standardfelder und fallen aus dem übrigen Formularbild: … [neu] — **zurückgestellt: dokumentierter Entscheid, nicht still gekippt (§0.2)**. Der Befund reproduziert (zwei `<input type="date" lang="de-CH" class="lc-input h-9 py-0">`, 190 × 36 px, mit Browser-Kalendersymbol). Genau diese zwei Felder sind aber seit **R3-α, 31.8.2026** eine benannte Ausnahme mit Begründung am Fundort (`EntscheidFilter.tsx`, Kommentar «R2-E/F1-1-AUSNAHME … Filter, kein fristauslösendes Feld») und einem Wächter, der die Begründung dort wörtlich nachliest (`src/tests/eingabe-bausteine-r2e.test.tsx`, `AUSNAHMEN`). Die im Befund verlangte Heilung ist der Umstieg auf `DatumsFeld` — das kippte den Entscheid UND fiele unter die Batch-Grenze «Eingabe-Parsing / Datumsformat-Interpretation ist §1-nah». Entscheid-Frage an David, keine Bau-Aufgabe. **Umgehängt 25.9.2026 (REST S5c):** Entscheid-Frage an David als Posten `plan/posten/2026-09-25-lm-075-lm-117-native-datumsfelder-entscheidfilter-rechtsprec.md` (mit LM-117) unter `W2·29-WERKBANK-NACHLAUF` umgebucht.

**Code-Flächen (grob, aus den Routen):** `src/components/forms`, `src/components/DatumsFeld.tsx`, `src/components/BetragsFeld.tsx`, `src/components/ui`.
**Risiko-Klasse:** gemischt — Datums-/Zahlenfelder speisen Rechen-Engines: Eingabe-Parsing ist §1-nah.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §14 · B13 — Zahlen-, Datums- und Zählformate (K-11)

**12 Befunde** · Blocker 0 · Hoch 3 · Mittel 5 · Detail 4 · `W2·17-UI-BEFUNDE-B13`

- *8 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§14 · B13 — Zahlen-, Datums- und Zählformate (K-11)» (verschoben 24.9.2026).*
- [x] **LM-109** · Hoch · Die Zahlen der drei Filterzeilen folgen nach dem Filtern verschiedenen Regeln: … [Verdacht → DESIGN-REGLEMENT-RECHTSPRECHUNG.md Z.184 R15 (Facetten mit Trefferzahl) + dokumentierter Code-Entscheid `src/components/rechtsprechung/EntscheidFilter.tsx`, Kommentarblock «Gemeinwesen-Achse (Auftrag 4)» / «cross-gefilterte Zähler … je Achse OHNE die eigene Achse» — §0.2-Anker-Nachzug: die frühere Zeilenangabe `:71-78` steht heute auf `:60-64` (`gwBasis`/`sprBasis`)] — **zurückgestellt, nicht gebaut** (B13, 4./5.9.2026). Beobachtung am gebauten Stand bestätigt. Der Erwartungssatz («alle Facettenzahlen einer Ansicht auf derselben Grundmenge») **kippt die dokumentierte Cross-Facetten-Konvention** — jede Achse zeigt, was ein Klick BRÄCHTE, darum blendet `gwBasis` ebene/kanton und `sprBasis` die Sprache aus. Das ist eine Entscheid-/Design-Frage, kein Bugfix (§0.2), und die Zählweise selbst ist Filter-/Query-Logik (§0.3, «nie ‹UI-Fix›»). Verbleibender echter Kern laut Dedup-Notiz — die Ungleichbehandlung ist für Nutzer nicht erklärt — bleibt offen und wäre ein eigener, bewusst entschiedener Schritt. **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-109-facettenzahlen-der-drei-filterzeilen-folgen-verschied.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.
- [x] **LM-110** · Hoch · Alle drei verbliebenen Chips zeigen dieselbe Zahl: «Alle 140 · Kantone … [Verdacht → W2·7-BEZUG B7 (c), Commit 5a10f8150 / PR #406: «Ein Schalter, der in 98,5 % der Fälle nichts be…] — **zurückgestellt, nicht gebaut** (B13, 4./5.9.2026). Der Muster-Teil des Dedup-Entscheids ist bereits da (Zahl am Schalter, gedämpft statt `disabled`); was fehlt, ist die Erkennung «ALLE Optionen dieser Achse liefern dasselbe Ergebnis». Die sitzt im Prune-Prädikat von `EntscheidFilter.tsx` (heute `o.id === 'alle' || o.n > 0 || o.aktiv`) und ist damit Filter-/Query-Logik, nicht Formatierung — §0.3-Klasse, ausserhalb des B13-Auftrags (Zahlen-/Datums-/ZählFORMATE). **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-110-prune-praedikat-der-filterchips-erkennt-nicht-wenn-al.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.
- [x] **LM-114** · Mittel · Dieselbe Etikette bedeutet Verschiedenes: Bei der DSGVO steht «Stand 27.04.2016» — … [neu] — **reproduziert, aber zurückgestellt** (B13, 4./5.9.2026). Rot bestätigt am gebauten Stand (`/gesetze?ebene=international` @1440): CISG «Stand 22.05.2026» (Nachführungsstand) neben DSGVO «Stand 27.04.2016» (Erlassdatum der Verordnung) — dieselbe Etikette, zwei Bedeutungen (§8). **Nicht in der Darstellungsschicht lösbar:** der Unterschied lebt in `src/lib/normtext/international-extern.ts`, wo bei den EU-Verordnungen `stand` = Erlassdatum gesetzt wird; die Karte kennt kein Merkmal, das EU-Verordnung von Staatsvertrag trennt (beide `ebene=international`, «nur Live-Link» trägt auch die EMRK). Ein Fix hiesse entweder Rechtsdaten ändern (§7) oder ein neues Feld in der Datenschicht anlegen (§5) — beides ausserhalb des B13-TABU und Sache der International-Kanonik (IA-6). **ERGÄNZUNG 23.9.2026 (W2·29-WERKBANK-LESER S5): im Gesetzes-Leser gegenstandslos, Rest bleibt offen.** Der Befund steht an der Katalog-Karte `/gesetze?ebene=international` und in der Datenschicht (`src/lib/normtext/international-extern.ts`, `stand` = Erlassdatum bei EU-Verordnungen) — beides nicht Leser-Hülle. Die Etiketten-Frage entscheidet sich an der Datenschicht (IA-6) bzw. in `W2·29-WERKBANK-KATALOGE`. **Umgehängt 25.9.2026 (REST S5c):** Leser-Teil gegenstandslos (s. o.); Datenschicht-Rest als Posten `plan/posten/2026-09-25-lm-114-rest-etikette-stand-bedeutet-bei-eu-verordnungen-erla.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.
- [x] **LM-117** · Detail · Der Platzhalter lautet hier «tt.mm.jjjj» in Kleinbuchstaben, in den Rechnern «TT.MM.JJJJ» … [neu] — **reproduziert, aber zurückgestellt** (B13, 4./5.9.2026). Bestätigt: `/rechtsprechung` trägt zwei native `<input type="date">` (dazu die von/bis-Felder in `verzahnung/BezugZeitWahl.tsx`), «tt.mm.jjjj» ist der Browser-Platzhalter und **kein App-Text**; die Rechner nutzen das eigene `DatumsFeld` mit «TT.MM.JJJJ». Der Fix ist kein Format-, sondern ein **Bauteil-Tausch** (natives Feld → `DatumsFeld`) und berührt Eingabe-Parsing (§0.3, §1-nah). Es ist zudem **dieselbe Wurzel** wie LM-073/074/075 im Parallel-Batch **B12** («natives Browserfeld», «Anzeige folgt der Browsersprache») — dort gehört der Entscheid hin, statt ihn zweimal zu bauen. **Umgehängt 25.9.2026 (REST S5c):** mit LM-075 zusammen als EIN Posten `plan/posten/2026-09-25-lm-075-lm-117-native-datumsfelder-entscheidfilter-rechtsprec.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht (dieselbe Wurzel, nicht zweimal geführt).

**CI-Nachzug (5.9.2026, PR #676, Shard 2/8 rot):** `e2e/rechtsprechung-richter.e2e.ts:45/72`
timeouteten am geteilten Helfer `trefferZahl()` (Regex `^\d+\s+Entscheide?$`). Ursache
verifiziert per Codepunkt-Ausgabe (Playwright/Chromium, `/rechtsprechung` @dist): der
Zähler zeigt jetzt wie mit LM-119/121 beabsichtigt tausendergruppiert — «5'093
Entscheide» (0x35,0x27,0x30,0x39,0x33) —, der GERADE Apostroph U+0027 bricht `\d+`. Die
Format-Änderung ist der deklarierte Fachschritt dieses Batches (LM-108/116/119,
`zahlGruppiert()`); angepasst wurde darum nur die **Test-Infrastruktur**: die Regex
akzeptiert jetzt Ziffern plus Gruppentrenner (`'`, `’`, U+00A0, U+202F) vor dem
Leerzeichen, `e2e/rechtsprechung-richter.e2e.ts` (`trefferZahl()`) und
`e2e/rechtsprechung-besetzung-links.e2e.ts` (Inline-Vorkommen, gleiche Wurzel) — keine
Assertion geändert. Repo-weit geprüft (`grep -rn "Entscheide?\$\|Erlasse?\$" e2e/
src/tests/`): keine weiteren Treffer. Nachher: alle 34 Tests aus
`rechtsprechung-richter.e2e.ts` + `rechtsprechung.e2e.ts` +
`rechtsprechung-besetzung-links.e2e.ts` grün gegen dist, `tsc -b` clean, `lint` 0 Fehler,
`npm run gate` (voll) GRÜN.

**Code-Flächen (grob, aus den Routen):** `src/components/locale.tsx`, `src/components/ErgebnisAnzeige.tsx`, `src/components/forms`.
**Risiko-Klasse:** gemischt — Formatierung ist Darstellung, aber jede Zahl stammt aus einer Engine (§3).
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §15 · B14 — Brotkrume, Kopfzeilen und Seitenmeta (K-19a)

**8 Befunde** · Blocker 0 · Hoch 3 · Mittel 1 · Detail 4 · `W2·17-UI-BEFUNDE-B14`

- *5 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§15 · B14 — Brotkrume, Kopfzeilen und Seitenmeta (K-19a)» (verschoben 24.9.2026).*
- [x] **LM-184** · Hoch · Der Zähler in der Kopfleiste steigt beim Öffnen eines Entscheids von … [Verdacht → FAHRPLAN-UI-NAVIGATION.md §1/N0d·O3 (Z. 96–97, «Toast/Fly-to zum Reiter-Tracker + Tooltip ‹Reit…] — **zurückgestellt** (B14, 4.9.2026): der Befund zielt laut Dedup-Notiz auf die ZÄHL-SEMANTIK, und die liegt in `TabTracker.tsx` (`INHALT_ITEM`-Regex) — Zustands- und Navigationslogik, nicht Darstellung (§3). Die Erwartung «wächst nur durch Handlungen, die der Nutzer als solche erkennt» kehrt die heutige Automatik um (jede geöffnete Detailseite legt einen Reiter an); das ist ein Verhaltensumbau mit Testfläche, kein Batch-B14-Fix. Der Entdeckbarkeits-Teil ist bereits gebaut (N0d·O3). **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-184-reiter-zaehler-waechst-automatisch-bei-jeder-geoeffne.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.
- [x] **LM-197** · Detail · Auf einer Seite stehen «‹ Zur Übersicht», «↗ massgebliche Fassung», «↗ … [Verdacht → FAHRPLAN-UI-QUALITAET.md §3 (Muster-Konsistenz: «Chip- und Badge-Grammatik», Bau in W2·10-UI-NA…] — **zurückgestellt** (B14, 4.9.2026): der Befund verlangt einen ZEICHEN-KANON (‹ ↗ → ✕ …) und damit eine Reglement-Zeile plus einen Sweep quer durch Entscheid-Leser, Fusszeile und Krumenleiste — Flächen, an denen in derselben Nacht die Batches B9 (Textsatz) und B11 (Karten) bauen. Ein Kanon, der ohne diese Nachbarn festgelegt wird, würde entweder halb umgesetzt oder überschrieben. Zudem sind Bestands-Entscheide zu wahren (⧉ ist per A27/VZUI als Chip-Dekor bzw. Pane-Aktion belegt). Gehört in einen eigenen Muster-Schritt nach B9/B11 (Anker: FAHRPLAN-UI-QUALITAET.md §3 «Chip- und Badge-Grammatik»; DESIGN-REGLEMENT.md Abschnitt «Icons/Symbole nur zusätzlich zum Text», bisher als Z. 107 geführt — §0.2-Anker-Nachzug). **ERGÄNZUNG 23.9.2026 (W2·29-WERKBANK-LESER S2): im Gesetzes-Leser gegenstandslos, Rest bleibt offen.** Kopf, Titelblatt und Übersicht des Gesetzes-Lesers folgen dem Kanon bereits: der amtliche Link heisst überall «Amtliche Fassung ↗» aus EINEM Baustein (`ui/QuellLink`, Ä110/B-1), «↗» folgt dem Ziel, «⬇»/«⧉» gehen voran (`v3/UebersichtBox`, Ä110-Rest); die Früh-Ansichten (pdf-embed, nur-live-link) tragen seit S2 dieselbe Übersicht. Die im Befund zitierten «‹ Zur Übersicht»/«↗ massgebliche Fassung» stehen im Entscheid-Leser (`MassgeblicheFassung`) — dieser Teil gehört zur Rubrik RECHTSPRECHUNG der Werkbank-Kette, nicht zu S2. **Erledigt (überholt), REST S5c 25.9.2026:** Grep bestätigt den Ä110-Kanon jetzt auch im Entscheid-Leser — «↗ massgebliche Fassung» kommt aus dem geteilten `ui/QuellLink` (`EntscheidKopfTeile.tsx:5/114`), der Rücksprung am Dokumentende trägt seit D-6 (31.8.2026) das Haus-Zeichen «←» statt «‹» (`EntscheidLeser.tsx:1106`, Kommentar Z. 1101–1103). Beide im Befund zitierten Stellen sind damit kanonisch.
- [x] **LM-198** · Detail · Das Sprungziel heisst «b-BJ», der Abschnitt trägt die Überschrift «EHRA» mit … [neu] — **zurückgestellt** (B14, 4.9.2026): reproduziert am Preview (Anker `b-BJ`, Überschrift «EHRA»; die acht übrigen Abschnitte stimmen). Nicht in der Darstellungsschicht lösbar: die Marke kommt aus `b.id` und wird an genau derselben Stelle vom Register-Menü erzeugt (`lib/navigation.ts` → `/materialien#b-<id>`), gegen das `src/tests/materialien-register.test.ts` prüft. Beide Wege sind im Batch gesperrt — den Behörden-Key `BJ` in `lib/materialien/register.ts`/`typen.ts` umzubenennen berührt Korpus-Daten und alle `liveLink`-Aufrufe, die Testerwartung anzupassen verstösst gegen §6.3. Gehört in einen eigenen Schritt mit Datenänderung (der fachlich korrekte Key ist «BJ» = Bundesamt für Justiz, das sichtbare Kürzel «EHRA» das Amt darin — die Frage ist, welcher von beiden die Sprungmarke tragen soll). **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-198-sprungziel-behoerden-key-bj-vs-sichtbares-kuerzel-ehr.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht.

**Code-Flächen (grob, aus den Routen):** `src/components/layout/InhaltsKopf.tsx`, `src/components/RouteMeta.tsx`, `src/pages/Materialien.tsx`.
**Risiko-Klasse:** reines UI/SEO-Meta.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §16 · B15 — Umschalter, Tabs und Akkordeons (K-06)

**9 Befunde** · Blocker 0 · Hoch 2 · Mittel 6 · Detail 1 · `W2·17-UI-BEFUNDE-B15`

- *9 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§16 · B15 — Umschalter, Tabs und Akkordeons (K-06)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/ui`, `src/components/layout/TabPanel.tsx`, `src/components/forms`.
**Risiko-Klasse:** reines UI.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §17 · B16 — Seitengerüst und Inhaltsbreite (K-13)

**8 Befunde** · Blocker 0 · Hoch 2 · Mittel 3 · Detail 3 · `W2·17-UI-BEFUNDE-B16`

- *8 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§17 · B16 — Seitengerüst und Inhaltsbreite (K-13)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/layout/Shell.tsx`, `src/components/layout/Footer.tsx`, `src/index.css`.
**Risiko-Klasse:** reines UI.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §18 · B17 — Schaltflächen — Varianten, Gewichtung, Deaktiviert-Zustand (K-09a)

**8 Befunde** · Blocker 0 · Hoch 1 · Mittel 6 · Detail 1 · `W2·17-UI-BEFUNDE-B17`

**Stand 4.9.2026 (Batch `b10-b17-knoepfe`, gemeinsam mit §11/B10 gebaut):** 7/8 geschlossen —
6 gebaut, 1 als überholt geschlossen (LM-097), **1 zurückgestellt** (LM-087: reproduziert, aber der
Befund selbst bindet den Bau an eine Gate-Verschärfung ausserhalb der Bau-Fläche dieses Batches).
Der Deaktiviert-Zustand ist als Token gebaut und ändert keine Bedienlogik (§3): `disabled` setzt
unverändert der Aufrufer, `golden:vergleich` byte-gleich (256 Fälle).

- *7 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§18 · B17 — Schaltflächen — Varianten, Gewichtung, Deaktiviert-Zustand (K-09a)» (verschoben 24.9.2026).*
- [x] **LM-087** · Mittel · 34 verschiedene Button-Varianten aus Höhe · Radius · Schriftgrad · Schnitt … [Verdacht → FAHRPLAN-UI-QUALITAET.md §3 (Muster-Konsistenz) + §4 Ziff. 1/3 (Gate-Verschärfung); DESIGN-REGL…]
  · **zurückgestellt** 4.9.2026 — *reproduziert, aber nicht in diesem Batch baubar.* Nachgemessen über
    8 Routen (1440 px): 45 Varianten aus Höhe·Radius·Schriftgrad·Schnitt, Höhen von 1 bis 81 px — die
    Streuung des Befunds besteht. Der Befund selbst schreibt die Bedingung vor: «Bau nur zusammen mit der
    Gate-Verschärfung, sonst wächst die Streuung nach» (E1-Schranke, FAHRPLAN-UI-QUALITAET §4 Ziff. 1/3).
    Ein solches Tor lebt in `scripts/` + `package.json` und liegt damit ausserhalb der Bau-Fläche dieses
    Batches (nur `src/**`, `public/**`, dieser Fahrplan). Beigetragen hat der Batch die Konvergenz von
    sechs Fundstellen auf die geteilte Knopf-Familie (LM-085/088/094/099); die Zählung liegt danach bei 46,
    weil `.lc-btn-mini` als benannte Familien-Variante hinzukommt — das belegt den Befund eher, als es ihn
    entkräftet: ohne Tor gewinnt keine Aufräumrunde gegen den Nachwuchs. **Umgehängt 25.9.2026 (REST S5c):** als Posten `plan/posten/2026-09-25-lm-087-45-button-varianten-bau-nur-zusammen-mit-einer-gate-v.md` unter `W2·29-WERKBANK-NACHLAUF` umgebucht (Voraussetzung Gate-Verschärfung weiterhin offen — `W2·19-DESIGN-KONSISTENZ` Stand 25.9. NICHT done, trägt 8 offene Posten).

**Code-Flächen (grob, aus den Routen):** `src/components/ui`, `src/index.css`, `src/components/vorlagen`.
**Risiko-Klasse:** reines UI — der Deaktiviert-Zustand darf keine Bedienlogik verändern.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §19 · B18 — Listen, Suche und Relevanz (K-19b)

**8 Befunde** · Blocker 0 · Hoch 1 · Mittel 7 · Detail 0 · `W2·17-UI-BEFUNDE-B18`

- *9 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§19 · B18 — Listen, Suche und Relevanz (K-19b)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/pages/Gesetze.tsx`, `src/components/suche`, `src/lib/suche`.
**Risiko-Klasse:** RISIKO — Such-/Ranking-Logik (LM-187 Substring-Treffer) ist keine reine UI: `check:gegenpruefung` + `eval:suche`.
**B18-Logik (offen, Gegenprüfung Pflicht).** Aus B18 zurückgestellt, weil die Lösung nicht
Darstellung ist, sondern Treffer-Auswahl bzw. Hervorhebungs-Logik berührt — Bau nur mit eigenem
Nachweis (§0.3), `check:gegenpruefung` und `eval:suche` als Vorher/Nachher-Messung:


**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §20 · B19 — Eingabe- und Auswahlfelder — Detail (K-08b)

**7 Befunde** · Blocker 0 · Hoch 0 · Mittel 0 · Detail 7 · `W2·17-UI-BEFUNDE-B19`

- *7 erledigte Einträge dieses Abschnitts wörtlich in [`archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md`](../archiv/FAHRPLAN-UI-BEFUNDE-erledigt.md), Abschnitt «§20 · B19 — Eingabe- und Auswahlfelder — Detail (K-08b)» (verschoben 24.9.2026).*

**Code-Flächen (grob, aus den Routen):** `src/components/forms`, `src/components/ui`.
**Risiko-Klasse:** reines UI.
**Prod-Re-Audit-Pflicht:** ja — vor Baubeginn alle Befunde dieses Batches am Prod-Stand
reproduzieren (§0.1); nicht Reproduzierbares als «erledigt (überholt)» schliessen.

## §24 · ROADMAP-Spec-Nachzug `W2·17-UI-BEFUNDE` (wörtlich verschoben 4.8.2026, ROADMAP-Diät Welle 3)

*Herkunft: `ROADMAP.md`, Welle 2, Schritt `W2·17-UI-BEFUNDE` — AP-11 rückwirkend angewandt
(ROADMAP-Diät Welle 3, 4.8.2026). In der ROADMAP bleiben Titel, `@meta`, das Triage-Ergebnis, die
Queue-Regel, die Batch-Einzeiler B3…B19 und der Pointer auf §1. Steuert nicht — Spec-Heimat.
**Davids Freigabe-Wortlaut ist unverändert übernommen.***

> **Freigabe David 3.8.2026:** Kette B3→B19 läuft wie geplant seriell; stehende Erlaubnis, ein
> blockiertes Glied zu überspringen und zu melden (Übersprungenes bleibt offen, Kette läuft weiter).

### §24.1 `W2·17-UI-BEFUNDE-B4` — Grenz-Auflage im Wortlaut *(→ Bau-Spec: §5 dieser Datei)*

*Herkunft: `ROADMAP.md` (verschoben 4.8.2026, ROADMAP-Diät Welle 3); dort bleibt der Grenz-Hinweis
in Kurzform.*

> **Grenze:** hier werden nur die 12 extern erhobenen Einzelbefunde abgearbeitet — der flächige UX-Pass derselben Seite ist `W2·5h-GESETZ-UI`, die Darstellungs-Vorschriften sind `W2·5d`. Kollisions-Precheck gegen beide vor dem Bau.


---

## Archivierte Abschnitte *(Plan-Neuschnitt 29.8.2026)*

9 Abschnitt(e) dieser Datei sind wörtlich nach
[`archiv/fahrplaene/FAHRPLAN-UI-BEFUNDE.md`](../archiv/fahrplaene/FAHRPLAN-UI-BEFUNDE.md) ausgelagert — sie tragen keine offene
ROADMAP-Bindung mehr. Titel:

- §1 · Triage-Ergebnis 31.7.2026
- §2 · B1 — Chips, Badges und Normzitate (K-05 + K-10)
- §3 · B2 — Verlauf und Zustand in der URL (K-20)
- §4 · B3 — Klebende Leisten (K-01)
- §5 · B4 — Leseansicht Gesetz (K-14)
- §6 · B5 — Druck, Farbschema, Reiter- und Split-Ansicht (K-16 + K-17 + K-18)
- §21 · B20 — Prüf-Batch — «bereits gebaut» am Prod-Stand nachmessen (alle Bauteile)
- §22 · Fortschritts-Regel
- §23 · N1 — LM-044-Nachzug: Chip-Grammatik `lc-chip-zeile` ausrollen
