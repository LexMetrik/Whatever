# PERF-LESER — «Brauchen Gesetze länger zum Laden als früher?»

Frage David, 6.9.2026, wörtlich: «kann es sein, dass gesetze länger brauchen zum
laden als früher?»

**Antwort in einem Satz: Nein — nicht messbar langsamer als main. Aber beide
Stände sind langsam: die OR-Seite blockiert die Bedienung nach dem ersten Bild
rund zehn Sekunden (CPU×4). Diese Runde nimmt davon ein Stück weg, ohne eine
Zeile Ausgabe zu verändern.**

---

## 1 Messaufbau

- **ALT** = `origin/main` @ `74f694a79` (Worktree `w2-24-perf-alt`)
- **NEU-vorher** = `feat/w2-24-perf` @ `e1dff388d` (= Zweigpunkt von
  `feat/w2-24-design-identitaet`)
- **NEU-nachher** = derselbe Stand mit dem Z1-Schnellpfad dieser Runde
- Beide **Produktions-Build** (`npm run build`) + `vite preview`, nie Dev-Server.
- Playwright/Chromium, Viewport **1280×800**, CDP `Emulation.setCPUThrottlingRate(4)`,
  Netz ungedrosselt, jeder Lauf **kalt** (frischer Kontext + `Network.setCacheDisabled`).
- Sonde: `scripts/perf/leser-lcp.ts` (`npm run perf:leser-lcp`). Kadenz: **kein
  Scrollen**, reines Laden bis 1.5 s ohne Long Task (Mess-Hygiene Ziff. 1 im
  Skill `perf`: die Kadenz gehört in die Kopfzeile).
- **Verschränkt gemessen**: beide Stände laufen als zwei Preview-Server im
  SELBEN Playwright-Lauf abwechselnd, Lauf für Lauf. Maschinen-Drift trifft
  damit beide Stände gleich (Dispatch-§0 Ziff. 3b).
- Es lief nichts daneben — keine e2e-Suite, kein zweiter Build (Skill `perf`,
  Bauregel «Sonden nie neben der e2e-Suite»).

### TBT-Messfalle (Vorbefund korrigiert)

Die Vor-Runde meldete «TBT durchgehend 0 — Messung defekt». Ursache: ein
`PerformanceObserver` auf `longtask` liefert nur Einträge, wenn er **vor** dem
ersten Seitenskript registriert ist **und** `buffered: true` trägt. Die Sonde
setzt ihn darum per `page.addInitScript`. Seither trägt die Zahl.

---

## 2 Der Befund: kein Rückschritt gegenüber main — aber ein zehn Sekunden langer Block

Verschränkt, n=5 je Stand, Median [Min–Max]:

| Route | Kennzahl | ALT (main) | NEU-vorher |
|---|---|---:|---:|
| `/gesetze/bund/OR` | LCP | 580 [240–2104] | 432 [260–2180] |
| `/gesetze/bund/OR` | **TBT** | 13 511 [13 062–13 657] | 15 183 [13 725–16 335] |
| `/gesetze/bund/OR` | längster Task | 11 679 [10 965–11 725] | 13 396 [12 069–13 810] |
| `/gesetze/bund/OR` | CLS | 0.067 | 0.0469 |
| `/gesetze/bund/ZGB#art-457` | LCP | 344 [292–1780] | 796 [476–964] |
| `/gesetze/bund/ZGB#art-457` | **TBT** | 11 611 [8 675–13 180] | 11 654 [11 143–14 988] |
| `/gesetze/bund/ZGB#art-457` | längster Task | 9 828 [7 334–11 479] | 11 117 [9 826–13 237] |

**Lesart.** Der LCP («wann steht das erste grosse Bild») liegt in BEIDEN Ständen
unter einer Sekunde — er ist kein Problem und kein Rückschritt. Der Unterschied
im TBT (OR: +12 %) liegt an der Streuungsgrenze: die Spannweiten überlappen
beinahe, und auf ZGB ist der Median gleich. Nach Dispatch-§0 Ziff. 3b ist das
**die Messung, nicht das Feature**.

### Warum die Vor-Runde «LCP 432 ms → 14 808 ms» gemessen hat

Nicht reproduzierbar — weder auf 390×844 noch auf 1280×800, weder kalt noch
warm. Die dortigen Läufe fanden neben laufenden Builds/Preview-Servern statt
(Spannweite 8 384–15 340 ms auf einem Stand, der isoliert 260–2 180 ms zeigt).
Genau davor warnt die Bauregel «Sonden nie neben der e2e-Suite» (Skill `perf`).
Der Befund «Reihenfolgen-Verschiebung des H1-Paints» hängt an jener Zahl und
fällt mit ihr; die **Kosten-Aussage** der Vor-Runde stimmt dagegen und wird
unten bestätigt.

**Was wirklich weh tut, in beiden Ständen:** ein einzelner Task von rund
**10–13 Sekunden** unter CPU×4. Die Seite ist gemalt, aber tot — kein Scrollen,
kein Klick, kein Suchfeld. Das ist die Erfahrung, die David beschreibt.

---

## 3 Ursache, mit Datei und Zeile

CPU-Profil (CDP `Profiler`, Sampling 200 µs, CPU×4, `/gesetze/bund/OR`), ALT und
NEU-vorher zeigen dasselbe Bild — der Chunk `fedlex-*.js` trägt den Block:

```
ALT (main)              NEU-vorher
2174 ms  Te             2243 ms  Te      ← Z1-Erlass-Scan
1885 ms  Q               828 ms  Q       ← artikelnPluralVerweise
 985 ms  G              2239 ms  G       ← fremdRoutingFormB
 843 ms  n (LeserRahmenV3)  608 ms  n
```

Die grösste Einzelposition ist der **Z1-Erlass-Scan** in
`src/lib/fedlex/spannen.ts` → `erlassVerweiseImText`, Muster `Z1_ERLASS`.

**Warum er so teuer ist.** `Z1_ERLASS` toleriert zwischen JE ZWEI Buchstaben
eines Gesetzesnamens einen weichen Trennstrich (U+00AD) — `escSoft` in
`src/lib/fedlex/erkennung.ts:64`. Fedlex-HTML trägt solche Trennstellen in
langen Wörtern. Der Preis: 86 Genitiv-Namen und 113 Titel-Fragmente werden zu
einem Muster von **20 992 Zeichen**, das an jeder Position jedes Fliesstexts
durchprobiert wird.

Mikro-Messung (node, ungedrosselt, OR-Snapshot: 18 957 Texte / 1 077 491 Zeichen,
Median aus 3 Läufen, nichts daneben laufend):

| Funktion | vorher | nachher |
|---|---:|---:|
| `normVerweiseImText` (gesamt) | 1 169 ms | **206 ms** |
| davon `erlassVerweiseImText` (Z1) | 988 ms | **159 ms** |
| davon `NORM_IM_TEXT`-Scan | 78 ms | 25 ms |
| davon `ausgeschriebeneVerweiseImText` | 11 ms | 4 ms |
| nacktes `matchAll` Z1 mit Weichtrenn-Toleranz | 1 503 ms | — |
| nacktes `matchAll` Z1 ohne Toleranz | 310 ms | — |

---

## 4 Der Fix: gleicher Treffer, ein Fünftel der Kosten

`erlassVerweiseImText` wählt das Muster jetzt je Text:

- Text enthält **kein** U+00AD → hartes Muster (`Z1_ERLASS_HART`, 9 632 Zeichen);
- Text enthält U+00AD → unverändert `Z1_ERLASS`.

**Das ist keine Heuristik, sondern eine Identität.** `X­?Y` und `XY` matchen auf
einem Text ohne U+00AD zeichengenau dieselben Stellen: ein optionales Zeichen,
das in der Eingabe nirgends vorkommt, kann nur die leere Alternative nehmen.

### Nachweis (nicht behauptet, gefahren)

Volle Korpus-Runde über **beide** Snapshot-Korpora, beide Muster, Vergleich von
Offset, Treffertext und allen vier Gruppen:

```
Dateien 1566 · Texte 806 534 · Zeichen 47 725 022 · Texte mit U+00AD 0
Texte mit Z1-Treffer 3197 · DIVERGENZEN 0
```

Bemerkenswert: **kein einziger** Text im ausgelieferten Korpus trägt heute einen
weichen Trennstrich. Die Toleranz bleibt trotzdem stehen (Chesterton) — sie
kostet ab jetzt nur noch dort, wo sie gebraucht wird.

### Wächter samt Rot-Probe (§6.7)

`src/lib/fedlex/spannen-weichtrenn.test.ts`

1. beide Muster über einen Bund- und einen Kanton-Snapshot, Treffer byte-gleich;
2. Rot-Probe A: auf `«… des Zivilgesetzbu<U+00AD>ches.»` trifft NUR das weiche Muster;
3. Rot-Probe B: `erlassVerweiseImText` liefert für denselben Text weiterhin `ZGB`.

Einmal rot gezeigt: mit ausgebauter Fallunterscheidung (`matchAll(Z1_ERLASS_HART)`
für alle Texte) scheitert Probe B —
`AssertionError: expected [] to deeply equal [ 'ZGB' ]`. Der Wächter kann also
scheitern; danach zurückgebaut und wieder grün.

---

## 5 Wirkung (verschränkt, n=5 je Stand, Median [Min–Max])

| Route | Kennzahl | NEU-vorher | NEU-nachher | Δ |
|---|---|---:|---:|---:|
| `/gesetze/bund/OR` | LCP | 684 [388–2416] | 668 [124–2284] | gleich |
| `/gesetze/bund/OR` | **TBT** | 12 323 [10 005–13 611] | **10 154** [8 724–11 742] | **−18 %** |
| `/gesetze/bund/OR` | längster Task | 9 921 [8 906–12 317] | **8 555** [7 020–9 839] | −14 % |
| `/gesetze/bund/OR` | CLS | 0.0469 | 0.0469 | unverändert |
| `/gesetze/bund/OR#art-336_c` | LCP | 364 [152–1036] | 148 [120–412] | besser |
| `/gesetze/bund/OR#art-336_c` | **TBT** | 9 870 [7 217–11 498] | **8 560** [5 715–9 414] | −13 % |
| `/gesetze/bund/OR#art-336_c` | CLS | 0.0557 | 0.0557 | unverändert |
| `/gesetze/bund/ZGB#art-457` | **TBT** | 9 548 [8 750–11 705] | **8 330** [7 878–9 777] | −13 % |
| `/gesetze/bund/ZGB#art-457` | CLS | 0.0909 | 0.0909 | unverändert |
| `/gesetze` (Übersicht) | TBT | 291 [114–498] | 309 [111–413] | gleich (Rauschen) |
| `/gesetze/kanton/BS-152.110` | **TBT** | 1 711 [1 405–1 885] | **626** [574–753] | **−63 %** |
| `/gesetze/kanton/BS-152.110` | längster Task | 1 433 [1 147–1 602] | **343** [322–446] | **−76 %** |

Kantonale Erlasse gewinnen am meisten: dort ist der Z1-Scan der ganze Block.

Zwei ehrliche Einschränkungen:
- Die LCP-Spalten streuen stark (Einzelläufe 120–2 400 ms). LCP ist auf diesen
  Seiten **keine** tragfähige Vergleichsgrösse; die Aussage steht auf TBT und
  längstem Task, deren Spannweiten sauber trennen.
- `/gesetze/kanton/BS-152.110` LCP-Median 624 → 1 472 ms sieht wie ein
  Rückschritt aus, ist aber ein einzelner Ausreisser bei n=5
  (Spannen 140–736 gegen 136–1672, beide mit Läufen um 140 ms). Kein Befund.

---

## 6 Logikverlust-Bewertung (§15, Skill `perf`)

| Treue-Art | Bewertung |
|---|---|
| Inhalts-Treue | **kein Verlust** — kein Text, keine Tabelle, keine Fussnote berührt |
| Rechtsregel-Treue | **kein Verlust** — kein Rechner, kein Wert berührt |
| Funktions-Treue | **kein Verlust** — die Verweis-Erkennung liefert dieselben Spannen (Korpus-Runde: 0 Divergenzen auf 806 534 Texten); Ctrl+F, Anker, Print, Scroll-Spy, Pane unberührt |
| Golden-Byte-Gleichheit | **erhalten** — `check:golden-normtext` und `golden:vergleich` grün |

Nichts wird verschoben, nichts wird nachgeladen, nichts wird gekürzt: dieselbe
Arbeit, in einem billigeren Muster. Die Bauregel 3 («Defer ändert nur das Wann»)
ist gar nicht berührt, weil hier nichts deferred wird.

---

## 7 Was offen bleibt

Nach dem Fix bleiben auf `/gesetze/bund/OR` rund **8.5 s** längster Task. Das
Profil zeigt als grösste Posten:

| Position | Fundstelle | @CPU×4 |
|---|---|---:|
| `fremdRoutingFormB` | `src/lib/fedlex/parser.ts:135` (`FREMD_FORM_B`), Aufruf `src/components/NormText.tsx:540` | ~2.3 s |
| `artikelnPluralVerweise` | `src/lib/fedlex/parser.ts`, Aufruf `src/components/NormText.tsx:413` | ~2.4 s |
| Leser-Rahmen-Render | `LeserRahmenV3`-Chunk | ~1.3 s |

Auffällig und noch ungeklärt: dieselben zwei Funktionen kosten auf dem
OR-Snapshot in node nur **1.1 ms** bzw. **18.7 ms**. Die Lücke zum Browser
(Faktor > 100) heisst, dass sie im Render **vielfach** über denselben Text
laufen — je Textfragment neu, statt einmal je Text. Das ist der nächste
Wurzel-Fix (Memoisierung je Textreferenz nach Bauregel 4, WeakMap statt
globalem Key) und gehört in einen eigenen, gegengeprüften Schritt: er berührt
dieselbe Risiko-Fläche (`src/lib/fedlex/**`) und die Render-Schicht, die in
dieser Runde parallel umgebaut wurde.

### Nachtrag 15.9.2026 (W2·24-PERF-REST): Ursache halb bestätigt, Fix-Vorschlag falsifiziert

Der Absatz oben bleibt stehen, wie er am 6.9.2026 gemessen wurde. Die
Nachmessung ergänzt ihn, sie korrigiert ihn nicht (§0 Ziff. 2b).

**Aufbau.** `/gesetze/bund/OR`, Produktions-Build + `vite preview`, 1280×800,
CPU×4, Netz ungedrosselt, jeder Lauf kalt. Kadenz: **reines Laden, KEIN
Scrollen**, bis `[data-v3-ansicht]` UND `article[id^="art-"]` im DOM stehen und
danach 1500 ms ohne Long Task. Zwei Stände laufen **verschränkt** als zwei
Preview-Server im selben Playwright-Lauf, Runde für Runde (Vorbild Ziff. 1) —
nötig, weil zwei getrennte Reihen desselben Stands um 22 % auseinanderlagen
(`bedienbar` 5 083 vs. 6 214 ms Median). Aufruf-Zahlen kommen aus CDP
`Profiler.startPreciseCoverage({callCount, detailed})`, sind also **gezählt**;
Self-Time aus `Profiler` (Sampling 200 µs). Es lief nichts daneben.

**Was stimmt.** Die beiden Funktionen laufen tatsächlich mehrfach über denselben
Text. Gezählt auf OR: `artikelnPluralVerweise` **16 420** Aufrufe,
`fremdRoutingFormB` **1 125** — bei nur **4 850** nichtleeren Snapshot-Texten.
Die Aufteilung nach dem Marker zeigt die Struktur: 11 515 bzw. 802 bis
«bedienbar», 4 905 bzw. 323 **danach**. Es sind also zwei Render-Durchgänge über
je rund 11 400 **Fragmente** (`restMitIntern` 11 435 + 4 869) — nicht über 4 850
Texte. Inhaltlich verschieden sind davon nur 4 831 bzw. 314; der Rest sind
Wiederholungen, überwiegend kurze Zwischenstücke.

**Was nicht stimmt: die Kosten-Zuschreibung.** Ein Memo je (Ebene, Erlass, Text)
in `NormText` senkt die Aufrufe deterministisch auf 4 831 bzw. 314 (−71 %/−72 %,
in jedem Lauf identisch) — und bewegt **keine einzige Zeitkennzahl**:

| Kennzahl (Median [Min–Max], n=4 je Stand, verschränkt) | ohne Memo | mit Memo |
|---|--:|--:|
| `artikelnPluralVerweise` Aufrufe | 16 420 [16 420–16 420] | 4 831 [4 831–4 831] |
| `fremdRoutingFormB` Aufrufe | 1 125 [1 125–1 125] | 314 [314–314] |
| `bedienbar` (ms) | 5 040 [4 870–5 278] | 5 004 [4 959–5 105] |
| TBT (ms) | 5 717 [5 523–5 839] | 5 665 [5 611–5 825] |
| längster Task (ms) | 4 176 [4 035–4 202] | 4 141 [4 120–4 266] |

**Nullprobe des Messgeräts** (dritter Stand, Wegwerf-Build: beide Linker liefern
`[]` bzw. `null`) — verschränkt gegen denselben Vorher-Stand, n=4:

| Kennzahl | Linker AN | Linker AUS |
|---|--:|--:|
| `artikelnPluralVerweise` Self-Time (ms) | 912 [835–938] | 1 [0–1] |
| `bedienbar` (ms) | 4 954 [4 768–4 961] | **3 578 [3 510–3 637]** |
| TBT (ms) | 5 614 [5 432–5 632] | 4 208 [4 172–4 276] |
| längster Task (ms) | 4 112 [3 944–4 137] | 2 731 [2 681–2 800] |

Die Spannweiten sind **disjunkt**: die beiden Linker kosten real rund **1.4 s**
@CPU×4, und das Messgerät sieht sie. Es sieht nur die *Wiederholung* nicht —
weil sie nichts kostet. Die 1.4 s stecken im EINEN Durchgang über die langen
Texte; die Wiederholungs-Aufrufe treffen überwiegend kurze Fragmente und laufen
zudem auf warmem JIT.

*(Die in derselben Reihe ausgewiesene Self-Time von `fremdRoutingFormB` ist
NICHT belastbar — sie zeigt im Nullproben-Stand 455 ms bei 7 Aufrufen und ist
damit in sich widersprüchlich, vermutlich eine Offset-Fehlzuordnung des
Sampling-Profils. Die Aussage oben stützt sich allein auf die gezählten Aufrufe
und die Wanduhr-Kennzahlen.)*

**Folge.** Der Fix-Vorschlag «Memoisierung je Textreferenz» aus diesem Abschnitt
ist damit **falsifiziert** — gebaut, verhaltensneutral bewiesen (golden
byte-gleich, 36 276 Verweis-Stellen im Inventar unverändert) und wieder
zurückgebaut, weil er Aufrufe spart und keine Zeit (§17-Gegengewicht: was nichts
bewirkt, wird gestrichen statt bewacht). Der Rückbau-Commit trägt den Bau in der
Historie, ein Cherry-Pick bleibt möglich.

Der offene Hebel ist derselbe wie beim Z1-Erlass-Scan in Ziff. 4: **die Kosten je
Text**, nicht ihre Anzahl. Zu prüfen wären die Muster-Kosten von
`PLURAL_OEFFNER`/`P_SIGNAL_RE` und `FREMD_FORM_B` (Riesen-Alternationen aus
`NORM_NAMEN_ESC`/`GENITIV_NAMEN_ESC`/`TITEL_FRAGMENTE_ESC`) — mit demselben
Beweis-Regime wie dort: Identitäts-Argument, volle Korpus-Gegenprobe über beide
Muster, Wächter mit Rot-Probe. Das berührt Regex-Semantik auf dem Risikopfad
`src/lib/fedlex` und gehört in einen eigenen, gegengeprüften Schritt.

Ebenfalls offen: `CLS 0.0469–0.0909` auf den Leserseiten in **beiden** Ständen —
die Vor-Runde hatte «CLS 0 in allen Szenarien» gemessen; unter dieser
Mess-Kadenz (Viewport 1280×800, kein Scrollen) ist es nicht 0. Kein
Rückschritt gegenüber main (ALT 0.067 gegen NEU 0.0469 auf OR), aber der
`leser-kopf-cls-s3`-Wächter misst eine andere Lage als diese Sonde.

---

## 8 Abweichung vom Auftrag (offengelegt, §7)

Der Auftrag verlangte einen e2e-Wächter `e2e/leser-lcp.e2e.ts` **mit
LCP-Schwelle**. Gebaut ist er nicht — begründet:

- Der LCP ist auf diesen Seiten **nicht** das Problem (er liegt vor und nach dem
  Fix unter einer Sekunde) und streut je Einzellauf um den Faktor 20.
- Eine Uhr-Schwelle darauf wäre ein Tor, das nur streut — genau das, wovor §6.7
  und `scripts/perf/leser-tempo.ts` («BEWUSST KEIN TOR») warnen.
- Die Schwelle für den Ausgang trägt bereits `check:perf-lighthouse`
  (OR-TBT-Budget 6 500 ms, normiert); der Fix arbeitet darauf hin.
- Gegen das Zurückfallen des Fixes schützt statt einer Uhr der deterministische
  Wächter `spannen-weichtrenn.test.ts` — einmal rot gezeigt (Ziff. 4).


## §9 · Gegenprüfung 6.9.2026 (Opus, Linsen 1–7): bestanden mit 3 Doku-Auflagen — eingebaut

Auflage 1: Korpuszahl 1 566 (nicht 1 569) in spannen.ts/Test. Auflage 2: toter Verweis auf `e2e/leser-lcp.e2e.ts` in `scripts/perf/leser-lcp.ts` ersetzt. Auflage 3: Vorbefund als nicht reproduzierbar ergänzt. Drift-Beleg des Prüfers (L6): derselbe Stand mass in §2 TBT 15 183 und in §5 12 323 — 23 % Sitzungs-Drift; die −18 %-Aussage liegt in dieser Driftbreite, tragend sind BS-152.110 (1 405–1 885 → 574–753, disjunkt) und die node-Mikromessung 988 → 159 ms. Prüfer-Beweis: Muster differieren um 5 680 optionale U+00AD, gestrippt byte-gleich; 448 Gegenbeispiele + 483 Dateien/455 760 Texte ALT vs. NEU 0 Divergenzen.
