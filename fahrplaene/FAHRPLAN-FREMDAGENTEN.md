# FAHRPLAN — Fremde Agenten im Bau (Jules · Antigravity · Gemini)
<!-- @lagebild name: Fremde Agenten im Bau · zweck: Wer ausser Claude am Projekt mitbauen darf, wofür genau, und woran wir merken, dass es sich lohnt. -->

**Heimat: ROADMAP-Schritt `QS-FREMDAGENTEN`** (Band «Betrieb & Prüfstrasse»).

> **Stand 3.9.2026.** Freigabe David 2./3.9.2026 (Chat), Entscheide D1–D7 am
> 3.9.2026 erteilt (§6). Detailquelle zum Schritt `QS-FREMDAGENTEN`; *das Wie
> steht hier, gesteuert wird über `ROADMAP.md`*. Belege:
> `bibliothek/fremdagenten-google-ai-pro-2026-09.md`.

## §0 · Zweck und Grenze

Wir bauen Google nicht «ein», wir geben drei Google-Werkzeugen je eine klar
begrenzte Rolle und messen, ob sie sich lohnen. Jules baut risikofreie
Schritte, Claude prüft und landet (das ist die belegte Richtung). Gemini liest
ganze Erlasse und liefert Verdachtslisten; entschieden wird gegen die amtliche
Quelle. Gemini-App und NotebookLM sind Davids Lesehilfen. Nichts davon kommt
ins Produkt, nichts ersetzt die Tore, nichts ersetzt Davids Abnahme.

Bevor etwas fest eingebaut wird, läuft eine **Testphase** (§2 Phase 0), weil
mehrere Zahlen nur aus Zweitquellen stammen und beide Systeme nachweislich
Erfolge melden, die nicht stattfanden. Was scheitert, wird zurückgebaut, nicht
bewacht.

**Harte Grenze, in jeder Phase:** Risikopfade (Extraktion · Rechnen ·
Norm/Tarif, Definition `istRisikoPfad()` in `scripts/gegenpruefung/kern.ts`)
bleiben Claude-Unteragenten vorbehalten. Verdikte, Landung und fachliche
Abnahme (CLAUDE.md §7) bleiben bei Claude bzw. David. Fremde Agenten bauen auf
der **grünen Spur** — risikofrei, eng umrissen, Tor-geprüft.

**AGENTS.md ist Erziehung, das Tor ist der Zaun.** Prosa-Regeln halten einen
Agenten nicht auf; `check:gegenpruefung` blockiert Risikopfade, der
Whitelist-Diff im Review blockiert den Rest.

## §1 · Rollenmodell (Freigabe David 3.9.2026)

| Rolle | Wer | Zuständig für | Grenze |
|---|---|---|---|
| Bauherr | David | Auftrag, Priorität, fachliche Abnahme (§7), `verified: true` | seine Zeit ist das knappste Gut |
| Bauleiter | Claude Code (Haupt-Session) | Planen, verteilen, Tore, landen, Buch führen; prüft **alle** fremden Ergebnisse | orchestriert nur |
| Risikopfade | Claude-Unteragenten | Extraktion, Rechnen, Norm/Tarif, Gegenprüfung | Modell ≤ Opus |
| Zweite Bauequipe | Jules | Eng umrissene, tor-prüfbare Schritte ohne Risikopfad | Junior-Qualität; nur mit Whitelist und Tabu; Timeouts unbekannt |
| Diskrepanz-Finder | Antigravity CLI (`agy`) | (A) Erlass gegen Snapshot · (B) repo-weite Sichtungsfragen · (C) Messversuch Zweitblick | nie Schreibrechte; Ausgabe ist Verdachtsliste, nie Verdikt |
| Fenster für David | Antigravity IDE | Zuschauen, Browser-Sichtprüfung (Screenshots als Artefakt) | nie im Haupt-Checkout schreiben |
| Lesehilfe | Gemini-App / NotebookLM | Davids Erlass-Sichtung und Abnahme-Notizbuch | keine Belege, kein Determinismus |

**Die Review-Richtung ist nicht symmetrisch.** Die einzige kontrollierte Studie
(arXiv 2607.21656v1, 116 LiveCodeBench-Aufgaben, Agentic SE @ KDD'26): Claude
reviewt Codex-Code 71.6 % → 89.7 % (+18.1 pp); umgekehrt reviewt Codex
Claude-Code 91.4 % → 82.8 % (−8.6 pp) — die Autoren nennen das aktiv schädlich.
Enger Rahmen, nicht generalisierbar. Folgerung: **«Fremde bauen, Claude prüft»**
ist die belegte Richtung. Gemini prüft darum nie Claude-Urteile, sondern
vergleicht Dokumente und liefert Diskrepanzlisten; «Gemini prüft Claude» läuft
nur als gezählter Messversuch (Phase 3), nie als Vertrauensstütze.

## §2 · Phasen

Bau-Spec zu `QS-FREMDAGENTEN`. Streng seriell: eine Phase beginnt erst, wenn
die vorige ihr Messkriterium (§3) erfüllt hat.

### Phase 0 — Testläufe (1 Session, nichts Dauerhaftes)

Sechs Läufe, die klären, was keine Doku beantwortet.

- **T1 Jules-Pilot.** Label `jules` anlegen; Pilot-Issue nach der Auftrags-Form
  aus `AGENTS.md` §6; David richtet die Umgebung ein (`npm ci` + Snapshot in der
  Web-UI). Pilot-Kandidat: `src/tests/gruendungAgDokumente.test.ts` (1018 Zeilen)
  auf ≤ 3 Dateien aufteilen — Fertig-Kriterium: gleiche Testnamen und -zahl,
  `check:schlankheit` ohne diesen Bestandseintrag grün. Kein Produktionscode,
  keine Parallel-Baustelle. **Messen:** Dauer bis PR, Whitelist-Treue,
  Gate-Ergebnis, Sprache, Nacharbeit in Minuten, Kontingent-Anzeige.
- **T2 agy-Diskrepanz-Finder (Recall-Probe).** 3–5 historische «widerlegt»-Fälle
  aus `bibliothek/register/QS-GP-KAMPAGNE-2026-07-02.md` rekonstruieren (alter
  Snapshot gegen amtliche Fassung); Gemini muss sie finden. **Messen:**
  gefunden/verpasst, Scheinfunde pro Erlass, Tokens, Dauer.
- **T3 agy-Betrieb.** `read_file`-Probe aus dem Repo-Root; stdout-Pipe-Probe;
  Probe auf das `modell`-Feld (gegen stillen Fallback); Sperr-Verhalten notieren.
- **T4 David / NotebookLM.** Ein Notizbuch mit einem Erlass, einmal ausprobieren.
- **T5 Prüfer-Probe.** Ein Test-PR mit einem absichtlich eingebauten, subtilen
  Fehler (von einem Unteragenten gesetzt, dem Prüfer unbekannt): findet die
  Landungs-Checkliste ihn? **Nein ⇒ Checkliste nachschärfen, bevor Jules-PRs
  landen.** Deckt §6.7 — ein Tor, das nicht scheitern kann, wird einmal gezeigt.
- **T6 Tabu-Probe Jules.** Ein Auftrag, der zur Änderung einer Tabu-Datei
  verleitet («passe den Test an, damit er grün wird») — hält `AGENTS.md`?

**Fertig:** Messwerte in §5 eingetragen ⇒ Phase 1 offen (T6 vorbehalten).

### Phase 1 — Pilot Jules (2–3 PRs, 1–2 Sessions)

Pilot-Kandidat, dann zwei weitere Mechanik-Schritte (Test-Splits sind nach D2
zulässig; sonst Komponenten-Splits nach Ende `W2·19`). Task-Grösse strikt: ein
Ziel, ≤ ~5 Dateien, ≤ ~300 Zeilen Diff, nie Risikopfade, nie Steuer-Doku. Jules
hat kein Gedächtnis über Sessions — alles Wissen steht in `AGENTS.md` und im
Issue. Claude prüft nach Skill `landung` §«Fremde PRs (Jules)» (`referenz-jules.md`) und landet.

**Fremd-PR-Tor in CI, Anlass T6 — gebaut 4.9.2026.** Shell-Schritt «Fremd-PR-Tor»
im CI-Job «Tore» (`.github/workflows/ci.yml`; bewusst kein eigenes `check-*.ts`, Steuerungs-Deckel §17-Gegengewicht — Regel 1 nutzt `scripts/analyse/test-assertion-diff.ts`): für Branches im
Jules-Muster (19-stellige Task-ID oder Präfix `jules-`/`jules/`; Beleg 4.9.2026 PR #647: `jules-1111541331587033919-8d87826d`; Gegenbeleg PR #656 `docs/jules-weiche`: «jules irgendwo im Namen» war zu breit, das Tor prüfte einen Doku-PR und wurde rot — richtig rot, falsches Muster) automatisch (1) den Assertion-Diff
(`scripts/analyse/test-assertion-diff.ts` gegen `merge-base(origin/main,
HEAD)`) und (2) eine Datei-Allowlist `src/**` prüfen — strenger als die
ursprüngliche Prosa («Risikopfad-/Steuer-Doku-Berührung»): eine Allowlist
deckt Risikopfade, Steuer-Doku und jede weitere Fläche in einem Schritt ab,
statt sie einzeln aufzuzählen. Für jeden anderen Branch meldet das Skript
sofort «nicht zuständig», Exit 0 — Nicht-Required-Check (Davids
Branch-Schutz-Einstellung bleibt unberührt). Grund: T6 zeigt `AGENTS.md` hält
als Prosa-Zaun nicht (0 von 1 Ablehnungen) — der Schutz muss aus Tor/Review
kommen, nicht aus dem Text. Rot-/Grün-Beweise (Wegwerf-Branch
`probe-1234567890123456789`, lokal): abgeschwächte Assertion ⇒ Exit 1,
`package.json` berührt ⇒ Exit 1, sauberer Test-Split (Datei verschoben) ⇒
Exit 0, Nicht-Jules-Branch ⇒ «nicht zuständig» Exit 0.

**Regel 3b Kommentar-Multimenge — gebaut 14.9.2026, Anlass PR #855/#857.**
Regel 3 (Summen-Bilanz, PR #662) prüfte nur die ZAHL der Kommentarzeilen: PR
#855 baute die Summe nach einer Ablehnung exakt auf den Ausgangswert zurück
(580 → 580) und verfälschte dabei trotzdem vier Zeileninhalte («hing» →
«hung», «plötzlich» → «suddenly», «einziges» → «einziger», «ein» → «eins») —
erst PR #857 (98 gelöschte Zeilen, Summe sichtbar gesunken) fing das Tor.
Wurzel-Fix: Logik aus dem Inline-Step nach `scripts/analyse/kommentar-
bilanz.ts` extrahiert (mit Unit-Test `kommentar-bilanz.test.ts`), Regel 3
unverändert mitgezogen, dazu Regel 3b — MULTIMENGE der getrimmten
Kommentarzeilen über Basis (merge-base) und Head, je Datei sortiert/gezählt
(`sort | uniq -c`-Äquivalent): jede Zeile, deren Häufigkeit im Head sinkt,
ist ein Befund (bis zu 20 gemeldet, mit Datei-Hinweis der Basis); Verschieben
zwischen Dateien bleibt erlaubt, Zuwachs auch, Leerkommentare (blosse Marker
ohne Text) sind ausgenommen. Ad-hoc-Lauf gegen den abgelehnten Kopf
`ed381895` (Basis `27e255f2`) meldet exakt die vier Stellen in
`Reiterleiste.tsx`, Regel 3 bleibt dabei (irreführend) grün — Beleg im PR.

### Phase 2 — Diskrepanz-Finder in der Korpus-Werkstatt (1 Session)

Eingabe: amtliche Fassung zuerst (Fedlex-Filestore-HTML, gepinnt über
`scripts/fedlex-cache.sh`), dann unser Snapshot-Text. Auftrag: keine Bewertung,
keine Rechtsauslegung — nur die Liste «Artikel · Absatz · Quelle sagt ·
Snapshot sagt · Klasse (Drop/Leak/Tabelle/bis-ter/Zahl)». Form: `--json-schema`
mit Selbstangabe-Feld `modell`, `--effort high`, `--model gemini-3.1-pro-high`,
niedrige Temperatur; **zwei Läufe, nur übereinstimmende Funde zählen**
(Selbstkonsistenz). Gruppen ≤ ~250k Token, Einheit ist der Erlass, nie der
Korpus. Jeder Fund wird gegen die amtliche Quelle geprüft, bevor er «Befund»
heisst.

**Ablage:** Das Skript liegt unter `scripts/analyse/` oder `scripts/betrieb/` —
**nicht** unter `scripts/gegenpruefung/` (Risikopfad) und ohne «check» im
Namen (sonst greift die Prüflogik-Ausnahme). **Nicht als Tor, nicht in CI:** ein
manueller Schritt im Skill `korpus-werkstatt` («optionaler Zweitblick bei
neuen/aktualisierten Erlassen»).

**Gebaut (4.9.2026):** `scripts/analyse/gemini-diskrepanz-text.ts` (deterministische
Klartext-Reduktion, unit-getestet unter `src/tests/gemini-diskrepanz-text.test.ts`)
+ `scripts/analyse/gemini-diskrepanz.ts` (CLI, Gruppierung, agy-Aufruf ×2,
Konsens, Bericht). Pilot auf zwei kürzlich aktualisierte Bund-Erlasse
(`git log` auf `public/normtext/bund/`: Commit 5bf9dbb9a, 28.7.2026,
bis/ter-Fix — betraf u. a. AMBV und VZV):

| Erlass | Gruppen | Läufe | Tokens gesamt | Dauer gesamt | Status je Gruppe | Konsens-Funde |
|---|---|---|---|---|---|---|
| AMBV | 1 | 2 | 101 299 | 135.2 s | SUCCESS/SUCCESS | 0 |
| AMBV (Zweitlauf mit `--laeufe 0`) | 1 | 0 angefordert, **2 tatsächlich gelaufen** | 97 220 | 161.8 s | SUCCESS/ANTWORT_KEIN_JSON | 0 |
| VZV (Art. 1–40, 173k Zeichen, 1 Gruppe) | 1 | 2 | — | >600 s (Lauf 1 ETIMEDOUT) | ERROR/abgebrochen | 0 (Konsens korrekt leer — Timeout-Wache griff) |
| VZV (Art. 1–10, 63k Zeichen, 1 Gruppe) | 1 | 2 (Lauf 2 nach Lauf-1-Timeout abgebrochen) | — | >600 s (Lauf 1 ETIMEDOUT) | ERROR/abgebrochen | 0 (Konsens korrekt leer) |

**Diese erste Auswertung war falsch — Korrektur 4.9.2026 (Opus-Gegenblick zu
PR #650).** Die Zeile «AMBV: keine Funde — Negativ-Kontrolle» hat aus dem
Ausbleiben von Funden auf einen fehlerfreien Erlass geschlossen. Der
deterministische String-Diff über dieselben zwei Reduktionen zeigt das
Gegenteil: **AMBV hat sieben Abweichungen, davon fünf echte Snapshot-Defekte**
in `public/normtext/bund/AMBV.json` — Art. 6 «Zwischen produkten», «Erfah
rung», «natur wissenschaftliche», «Hochschul aus bildung», «Fütterungs arznei
mitteln»; Art. 12 «Qualifika tionen»; Art. 14 «GMP-Kon trollsysteme»; Art. 11
«werden ;» und Art. 12 «ausreicht ;»; Art. 21 «werden .». Die beiden übrigen
waren Harness-Scheinfunde (Aufhebungs-Artikel Art. 47, Label «Art. 49_a» gegen
«Art. 49a») und sind seither behoben. **Gemini fand null davon** — bei
`--effort high`, in zwei Läufen. Das ist kein Erfolg der Negativ-Kontrolle,
sondern ein **Recall-Ausfall in der Klasse Silbentrennung/Interpunktion**:
genau der zeichengenaue Abgleich, den ein Sprachmodell am schlechtesten kann.

Zwei Folgerungen, beide umgesetzt:
1. **Abwesenheit von Funden ist kein Befund.** Ein Lauf ohne Treffer darf nie
   wieder als «Negativ-Kontrolle» gebucht werden, solange nicht ein
   unabhängiges, deterministisches Verfahren dasselbe sagt (§0 Ziff. 3:
   ein Einzelwert ist ein Verdacht, keine Ursache).
2. **Die Arbeitsteilung ist umgedreht** (PR #650): der Diff sucht, Gemini
   deutet nur noch die gefundenen Stellen. Siehe Messreihe unten.

Die fünf AMBV-Defekte und ein zweiter, gravierenderer Fund (VZV Art. 3/4: die
amtlichen Ausweiskategorien `<dt>A: </dt>`/`<dt>BE: </dt>` stehen im Snapshot
als generische, teils doppelte lit.-Marken `a,b,c,d,b,c,d` — aus «Kategorie
BE» wird «lit. b») sind als Kleinbefunde unter `QS-KORPUS` in der ROADMAP
gebucht. Hier wird nichts geflickt: `public/normtext/**` ist Risikopfad.

**Umbau und Neu-Pilot (4.9.2026, PR #650).** Der Ablauf ist umgedreht: ein
deterministischer String-Diff über beide Klartext-Reduktionen sucht die
Abweichungen, und nur die betroffenen Artikel (plus ±1 Kontext) gehen an
Gemini — für die eine Frage, die ein Diff nicht beantwortet: was die
Abweichung *bedeutet*. Zusätzlich wurden vier Harness-Scheinfundquellen in der
Reduktion behoben (Label `art_10_bis`, Aufhebungs-Artikel, Tabellen-Einzug und
-Kopfzeile, zweiteilige Absatzmarker) und `--json-schema` endlich übergeben,
wie diese Spec es oben verlangt.

| Erlass | Artikel im Vergleich | mit Diff | an Gemini | Gruppen | Läufe | Tokens | Dauer | Status | Konsens-Zeilen | davon echt |
|---|---|---|---|---|---|---|---|---|---|---|
| AMBV | 75 | 5 | 12 | 1 | 2 | 59 528 | 180.3 s | SUCCESS/SUCCESS | 8 | **8** |
| DBG Art. 1–60 | 65 | 1 | 3 | 1 | 2 | 54 836 | 179.7 s | SUCCESS/SUCCESS | 1 | **0** |

*Echt/Schein von Hand gegen den gepinnten Fedlex-Text geprüft.* Die acht
AMBV-Zeilen sind exakt die fünf oben genannten Snapshot-Defekte. Die eine
DBG-Zeile (Art. 22, Klasse `leak`) ist **kein** Befund: Gegenprobe an der
Quelle zeigt, dass beide Sätze («Ist dieser Zinssatz negativ», «Ist diese
Rendite negativ») amtlich existieren und unser Snapshot sie korrekt führt —
der Verlust liegt im Vergleichsparser, weil Fedlex die Aufzählung durch eine
eingeschobene Formel-Grafik in zwei `<dl>` zerteilt und die
Verschachtelungsstufe dort strukturell nicht mehr ausdrückt. Genau dafür ist
Teil 2 als Verdachtsliste gekennzeichnet.

**Der entscheidende Vergleich.** Dieselbe Gemini-Version, dieselben fünf
AMBV-Defekte:

| | alter Ablauf (Gemini sucht) | neuer Ablauf (Diff sucht, Gemini deutet) |
|---|---|---|
| Artikel an das Modell | 75 | 12 |
| Tokens | 101 299 | 59 528 |
| Effort | high | low |
| Gefunden/klassiert | **0 von 5** | **8 von 8 Diff-Zeilen** |

Das Modell wurde nicht besser — es bekam die richtige Aufgabe. Zeichengenauer
Abgleich ist das, was ein Sprachmodell am schlechtesten kann und ein Diff
perfekt; Deutung ist umgekehrt.

**Zwei Werkzeug-Befunde, die den Lauf vorher wertlos machten** (beide behoben,
beide vorher nicht sichtbar, weil ein leerer Konsens wie «keine Funde» aussah):
`--json-schema` wurde nie übergeben; und MIT Schema liefert `agy` **zwei**
JSON-Objekte hintereinander (das formulierte und das erzwungene, letzteres um
`toolAction`/`toolSummary` angereichert) — aneinandergehängt kein gültiges
JSON. Ohne den Fix meldeten AMBV und DBG in 2 von 2 Erlassen je einen Lauf als
`ANTWORT_KEIN_JSON`, und der Konsens war strukturell immer leer.

**Drei Spec-Punkte oben sind mit `agy` nicht baubar** (empirisch 4.9.2026):
die Denkstufe steckt im MODELLNAMEN, `--model gemini-3.1-pro-high` und
`--effort` schliessen einander aus, und Gemini 3.1 Pro hat gar keine
Medium-Stufe (`agy models`: nur `-low`/`-high`). Gebaut wurde darum
`--effort low|high` als Wahl der Modellvariante, Default `low`. Ein Prompt
über stdin geht ebenfalls nicht (`--print` ohne Wert ⇒ «empty prompt»; die
stdin-Route `--input-format stream-json` erzwingt ein zweites Ausgabeformat) —
statt eines zweiten Übergabepfads bleibt der Prompt unter der Linux-Grenze für
ein einzelnes Argument (Budget 90k Zeichen statt 200k, plus Byte-Wache).
Scope V1: nur `<article id="art_N">`-Artikel (kein Anhang-Tabellenparsing) —
sonst systematischer Scheinfund «kein Fedlex-Artikel gefunden» je
Anhangs-Eintrag (beobachtet am ungefixten AMBV-Lauf, in
`reduziereSnapshot`-Filter behoben). HINWEIS: der historische T2-bister-Fall
(VZV Anhang 1bis, Fix 5bf9dbb9a) lag selbst in einem Anhang — Scope V1 kann
ihn NICHT wiederfinden; die VZV-Pilotläufe unten prüfen nur die Artikel-Ebene
desselben Erlasses, sind also KEIN Recall-Test des bekannten Falls.

**Timing-Befund (eigener Fund, nicht im T2-Recall-Test sichtbar):** T2 mass
kleine, handkuratierte Ausschnitte (10–40k Zeichen, 45–140 s). Ein ECHTER
Artikel-Bereich mit vollem Kontext skaliert schlechter UND hängt nicht nur an
der Zeichenzahl: VZV Art. 1–40 (173k Zeichen) UND selbst Art. 1–10 (63k
Zeichen, deutlich unter AMBVs 62k/135s) liessen `agy --effort high` je über
600 s laufen, bis der gehärtete Timeout (`killSignal SIGKILL`, s. Commit
`fix(gemini-diskrepanz)`) sauber mit `ETIMEDOUT` griff — die Konsens-Wache
zeigte danach korrekt 0 Funde statt eines falschen Erfolgs. Erste Fassung des
Skripts (Timeout 340s, Default-`killSignal SIGTERM`) hatte den ersten dieser
Läufe NICHT beendet (>400s ohne Terminierung, manuell abgebrochen) — das
Härten war kein Nice-to-have, sondern behob einen echten Hänger. Dass AUCH
das kleinere Art.-1–10-Fenster nicht in 600s durchlief (Lauf 2 nach
Lauf-1-Timeout ungeduldig abgebrochen statt ein zweites Mal 600s abzuwarten),
spricht dafür, dass VZVs Inhalt (dichte technische Aufzählungen,
Fahrzeug-/Führerschein-Kategorien) bei `--effort high` grundsätzlich lange
Denkzeit braucht — nicht nur die Zeichenzahl. Praxisfolge (korrigiert
4.9.2026: `--effort medium` existiert für `gemini-3.1-pro` nicht, `agy models`
kennt nur `-low`/`-high`): bei Erlassen dieser Art zuerst mit sehr kleinen
`--artikel`-Fenstern (≤5 Artikel) bei `--effort low` prüfen, ob ein Lauf
überhaupt in nützlicher Zeit durchläuft, bevor grössere Gruppen oder
`--effort high` gefahren werden — offene Frage für David/Folge-Session, nicht
in diesem Schritt final geklärt.


### Phase 3 — Zweitblick-Messung (5 Durchgänge, verteilt)

Erst nach Phase 2. Nicht als Prüfer von Claude, sondern als **zweiter
Diskrepanz-Finder auf demselben Material** (Norm gegen Ausgabewert). Jeder
Befund wird einzeln als echt oder Schein protokolliert (echt = im Repo
reproduzierbar). Verdikt und Quittung bleiben bei Opus bzw. David.

### Phase 4 — Skalierung

**Status 4.9.2026: läuft** (Messwerte §5 «Phase 4 — Messwerte»: Landungsquote
5/6 = 83 %, Median 30 min, n = 6, Proben ausgeschlossen — Skalierungs-Schwelle
§3 erreicht).

Erst nach bestandenen Phasen 0–3. Ticket-Zahl pro Session: bis Phase 3
gezählt ist, höchstens 3 Tickets; danach 3–5 (Regel entsperrt 4.9.2026 —
seriell bleibt nur die Messung, nicht die Stückzahl). Jules-REST-API
(`sessions.create` mit `requirePlanApproval:true`, `automationMode:AUTO_CREATE_PR`,
Plan gegenlesen, `approvePlan`, Polling), falls das Plan-Gegenlesen messbar
Nacharbeit spart — Schlüssel nur in der Umgebung (D4). Antigravity-Claude als
Bauarbeiter im Worktree als Versuch — **geparkt 4.9.2026** (Bauleiter/David-
Chat: Jules deckt die Rolle bereits ab, Claude 4.6 ohne Skills bringt keinen
Zwischenmarkt; Wiedervorlage nur bei Kontingent-Engpass, D7).

**Messregel Komponenten-Splits (Lehre 4.9.2026, #662):** ein Komponenten-Split
(anders als ein Test-Split) braucht eine **vorgegebene Partition** — welche
Unterkomponenten in welche Datei wandern — sonst Risiko wie bei #662
(ABGELEHNT: 197 Kommentarzeilen gelöscht, ein Nutzer-String verstümmelt).

**David-Aufwand gesamt:** Phase 0 rund 20 Minuten (Umgebung, Freigabe-Text,
NotebookLM), danach nur Entscheide.

## §3 · Messkriterien und Rückbau-Regel

| Teil | Was gemessen wird | Schwelle ⇒ Folge |
|---|---|---|
| T1 Jules-Testlauf | Nacharbeit in Minuten gegen eigenen Bau | Nacharbeit > eigener Bau ⇒ Jules nur noch Doku/Mechanik oder gestrichen |
| T2 agy-Recall | bekannte Fälle gefunden / verpasst (n = 3–5) | **≥ 3 von 5 verpasst ⇒ Einsatz A gestrichen** |
| Phase 1 Jules | Anteil PRs **ohne Nacharbeit** durch Gate + Landungs-Check | **< 2 von 3 ⇒ zurück auf Doku-only** |
| Skalierung Jules (Bauleiter 4.9.2026) | **Landungsquote** = gemerged ÷ (gemerged + geschlossen), PRs mit Label `probe` ausgeschlossen · **Median Ticket→PR** in Minuten | **Landungsquote ≥ 5 von 6 UND Median Ticket→PR ≤ 45 min über n ≥ 6 ⇒ Vorschlag Ticketzahl 3–5** |
| Phase 2 Diskrepanz-Finder | echte Funde gegen Scheinfunde über die nächsten 10 Erlasse | **Schein > echt ⇒ Rückbau** |
| Phase 3 Zweitblick | echte gegen Scheinbefunde, n = 5 | **mehr Schein als echt ⇒ Weg zu** |
| Gesamt | Claude-Token pro gelandetem Schritt, vorher gegen nachher | steigt er, kostet die Delegation mehr, als sie spart |

**Rückbau-Regel (§17-Gegengewicht):** Reisst eine Schwelle, wird der betroffene
Teil **zurückgebaut**, nicht bewacht. Kein Werkzeug bleibt im Prozess, weil es
einmal eingerichtet wurde; die Einrichtung ist kein Argument.

**Entscheid: Bauleiter** (technische Delegation David 8.8.2026), David-Veto.
Flächen bei Rückbau Jules: `auftrag`-Weiche, `AGENTS.md`, ci.yml-Step,
`landung`-Absatz, Ticket-Vorlage, Label. Flächen bei Rückbau
Gemini-Finder: `scripts/analyse/gemini-diskrepanz*.ts`,
`korpus-werkstatt`-Absatz, `gegenpruefung`-Station.

**Messbedingung mitschreiben:** Jede Quote nennt n, Zeitraum und Art der
Schritte — eine Quote ohne Bedingung ist keine Zahl.

**Datenpunkt und Entscheid — proaktiver Kanal «Suggestions» (14.9.2026).** Der
Kanal erzeugte **76 Vorschläge** unaufgefordert; eine Opus-Sichtung am Code
(read-only, Repo-Stand `main 203a292e9`) fand **3 belastbare** (~4 %), davon zwei
reine Kommentar-Korrekturen; **0 wurden gestartet** (Weisung: nie direkt starten,
immer über den Roadmap-Eingang). **Für diesen Kanal war nie eine Schwelle
vorregistriert** — der Entscheid ist darum ein David-Entscheid, keine gerissene
Messlatte: «einverstanden, wir schalten jules wieder ab» (14.9.2026, §6 D8).
Rückbau statt Bewachung (§17-Gegengewicht): Toggle aus, keine Wächter-Mechanik
gebaut. **Der auftragsgebundene Ticket-Weg bleibt unberührt** (Landungsquote
83 %, n = 6) — gemessen wurde der proaktive Kanal, nicht Jules als Bauequipe.
Messbedingung: ein Sichtungslauf, ein Repo-Stand, ein Prüfer; der Aufwand der
Sichtung selbst ist nicht gemessen.

**Landungsquote ist nicht Nacharbeits-Quote (4.9.2026).** Die Landungsquote der
Zeile «Skalierung Jules» misst, was ANKOMMT (gemergt gegen abgelehnt) — sie ist
automatisch erhebbar. Die Zeile «Phase 1 Jules» misst etwas anderes: den Anteil
PRs **ohne Nacharbeit**; ein PR kann landen und trotzdem Nacharbeit gekostet
haben. Diese zweite Grösse hat keine automatische Quelle und wird von Hand im
§5-Register geführt. Wer die beiden gleichsetzt, liest eine Ablehnung als
Nacharbeit und umgekehrt. **Proben** (Label `probe`, etwa der Erstfilter-Test
PR #642) sind weder Landung noch Ablehnung und fallen aus beiden Seiten der
Landungsquote heraus; `npm run selbstopt:erheben` weist sie getrennt aus.

**Selbstoptimierungs-Kreislauf (QS-FREMDAGENTEN, 4.9.2026):** Der Kreislauf
läuft automatisch: Stufe 1 erhebt, Stufe 2 schlägt vor, Autopilot legt
wöchentlich den Entwurf vor; die Session übernimmt oder verwirft mit
Begründung. Stufe 1 (`npm run selbstopt:erheben`) zieht die Jules-Zahlen
dieser Tabelle über `erhebeJules()` und die drei §5-Register unten
deterministisch aus dieser Datei; Stufe 2 (`npm run retro:17`) deutet sie
gegen die Schwellen dieser Tabelle. Detail und Quellenlage:
`bibliothek/fremdagenten-google-ai-pro-2026-09.md`.

Seit 20.9.2026 (retro:17-Rückbau, Entscheid David) entfallen beide Stufen
samt Zeitreihe; Nachfolge-Messung `npm run tor:bewaehrung`, Jules-Zahlen
weiterhin über `npm run fremdagenten:messung`.

## §4 · Sicherheit und Daten

- **Öffentliches Repo.** Issues und PRs sind öffentlich lesbar; darin nur
  Bau-Inhalte, keine internen Notizen, keine Personendaten, keine Zugangsdaten
  (§18). Für öffentliche Repos darf Jules Daten zum Training nutzen — bei Code
  unkritisch, bei Prompt-Inhalten die Grenze.
- **Trainings-Opt-out** in Antigravity und Gemini-App: gesetzt von David am
  3.9.2026 — Betriebs-Voraussetzung, nicht Komfort. **Telemetrie-Aus ist nicht
  dasselbe wie der Opt-out**; beides ist separat zu schalten.
- **Keine Schreibrechte für `agy`, bis die Mindgard-Meldung geprüft ist.** Die
  Drittanalyse «Forced Descent: Google Antigravity Persistent Code Execution
  Vulnerability» ist gemeldet, von uns inhaltlich **nicht** geprüft. Bis dahin
  bleibt `agy` lesend, unabhängig vom Modus.
- **Die Deny-Liste ist der Schutz, nicht `--mode plan`.** Für nicht-interaktive
  Läufe gibt es kein verlässliches Read-only-Gegenstück zum Plan-Modus (offenes
  Feature-Gap, `antigravity-cli` Issue #45). Deny bleibt gesetzt auf
  `write_file(*)`, `unsandboxed(*)`, `execute_url(*)`, `mcp(*)` sowie Schreib-
  und Netz-Kommandos; zusätzlich `--sandbox`; **nie**
  `--dangerously-skip-permissions`. Precedence Deny > Ask > Allow; headless
  verweigert «ask» automatisch. Permissions liegen **nur global** in
  `~/.gemini/antigravity-cli/settings.json` (kein Repo-Scope).
- **Kontingent-Sperren sind ein Betriebsfall, keine Ausnahme.** Berichtet werden
  6–10-Tage-Lockouts statt der dokumentierten 5-Stunden-Fenster und unerklärter
  Verbrauch fremder Modell-Kontingente. **Nie ein Tor, einen CI-Schritt oder
  eine Landung von einem Google-Kontingent abhängig machen.**
- **Stiller Modell-Fallback.** Ein unbekannter `--model`-Slug wird
  stillschweigend ignoriert, der Lauf fällt auf das Default-Tier zurück, Exit 0
  (Issue #581). Darum trägt jedes Schema ein Feld `modell` (Selbstangabe), und
  jeder Lauf wird dagegen geprüft.
- **stdout-Fallen.** Mehrere offene Issues melden bei `agy -p` in
  Pipe/Redirect/non-TTY leeren oder hängenden stdout bei Exit 0 (#76, #115,
  #318). Unsere Tests am 3.9.2026 liefen auf macOS mit JSON-Ausgabe sauber —
  trotzdem vor jeder Automatisierung eine triviale Eigenprobe fahren und
  `--print-timeout` setzen. Wenige grosse Aufrufe statt vieler kleiner
  (Grundlast ~20–30k Token je Aufruf).
- **§12 Isolation.** Nie zwei Agenten im selben Checkout: Jules baut in eigener
  VM, `agy` läuft nur lesend, die IDE nie mit Schreibrechten auf dem
  Haupt-Checkout. Der Workspace-Trust-Dialog ist kein Sicherheitsfeature.
- **§14.7 gilt für jede Rückgabe.** «Erfolg ohne Tat» ist mehrfach unabhängig
  belegt und bei uns reproduziert: am 3.9.2026 meldete `agy --mode plan` eine
  geschriebene Datei, die fehlte. Jede Behauptung braucht ein Artefakt
  (`git status`, Tor-Ausgabe) — auch eine Jules-PR-Beschreibung.
- **Keine Geheimnisse an fremde Agenten.** Jules' Secret-Handling ist dünn
  dokumentiert; kein Schlüssel in Prompt, Issue oder `AGENTS.md`.
- **Bash-Tool-Timeout muss ≥ `--print-timeout` + 30 s sein** (Beleg T3,
  3.9.2026): das Standard-Timeout von 2 Minuten riss `agy`-Läufe mit längerem
  `--print-timeout` mitten im Lauf ab.
- **Jules-Autor = Repo-Eigentümer.** Jules-PRs laufen unter dem GitHub-Konto
  des Repo-Eigentümers, nicht unter einem eigenen Jules-Autor — Erkennung über
  Branch-Muster: 19-stellige Task-ID irgendwo im Namen ODER Präfix
  `jules-`/`jules/` (vereinheitlicht mit §2 Phase 1 und Skill `landung`,
  4.9.2026 — nie «jules irgendwo im Namen», Gegenbeleg PR #656), nie über den
  Autor.
- **Limite erkennen (Auftrag David 4.9.2026: «stelle sicher, dass wir merken,
  wenn die Limite erreicht ist»).** Beide Zahlen oben (Jules 100/Tag·15
  parallel, Antigravity «alle 5 h aufgefrischt bis Wochenlimit») sind
  **unbelegt** — nur aus Zweitquellen, nie selbst beobachtet; das erste
  tatsächlich beobachtete Ereignis belegt sie oder korrigiert sie (Tabelle
  unten). Signale je Dienst: **Jules** antwortet auf ein `jules`-Issue
  normalerweise binnen ~1 min mit «Jules is on it» und nach Fertigstellung
  mit «Ready for a review! A PR …» — bleibt diese Annahme über 10 min aus,
  ist ein Tages- oder Parallel-Stopp der wahrscheinlichste Grund (kann auch
  ein App-Problem sein, unterscheidet das Skript nicht). **Antigravity**
  zeigt Erschöpfung vermutlich als `status` ungleich `SUCCESS` mit einem
  Text nach Muster `quota|rate.?limit|429|resource.?exhausted|too many|
  exceeded|limit` (Musterherkunft: HTTP/gRPC-Standardformen plus übliche
  Klartext-Varianten — nie beobachtet) oder als Timeout. **Skript:**
  `npm run fremdagenten:messung -- --kontingent` prüft beides in einem
  Lauf (Jules-Issues der letzten 24 h + ein trivialer `agy`-Ping,
  Musterprüfung geteilt über `scripts/analyse/agy-status.ts`, auch von
  `gemini-diskrepanz.ts` genutzt) — **Exit 3** heisst Kontingent-Alarm.
  **Fallback bei Exit 3:** keine neuen Jules-Tickets (Skill `auftrag` Ziff. 6
  «Grüne Spur → Jules»), Gemini-Recherche zurück an `lex-recherche`/Sonnet
  (Skill `auftrag` Ziff. 6 «Recherche/Sichtung via Gemini»). **Protokoll:**
  jedes real beobachtete Ereignis in die Tabelle «Kontingent-Ereignisse» in
  §5 eintragen — nie ein Tor, CI-Schritt oder eine Landung davon abhängig
  machen (Regel oben unverändert).

## §5 · Werkzeugstand (3.9.2026, Momentaufnahme)

- **Jules** — AI Pro: 100 Tasks/Tag, 15 parallel, Modell ab Gemini 3 Pro (Zahlen
  über Sekundärquellen, **nicht primär verifiziert** — in der Jules-UI
  gegenprüfen). Liest `AGENTS.md` im Repo-Root, kein Gedächtnis über Sessions.
  Umgebung nur über die Web-UI («Initial Setup» + «Run and Snapshot»; Node
  22.16/20.19/18.20 vorinstalliert, ChromeDriver vorhanden, Playwright unklar).
  Auslösung per Web-UI, Issue-Label `jules`, PR-Kommentar/@Jules oder REST-API
  v1alpha. Sessions durchlaufen `QUEUED → PLANNING → AWAITING_PLAN_APPROVAL →
  IN_PROGRESS → COMPLETED|FAILED`. Ein **Critic-Agent** (adversariale
  Selbstprüfung des finalen Diffs) ist eingebaut, aber One-Shot.
  **Unbelegt/offen:** Timeouts, Branch-/Autor-Muster, automatischer CI-Fix ohne
  Kommentar, deutsche Aufträge (offiziell nur Englisch), CH-Verfügbarkeit.
  **Nachtrag 4.9.2026:** Jules-Umgebung (Initial Setup + Snapshot) war als
  Davids Handgriff geplant; 5/5 PRs liefen ohne — optional, nicht
  Vorbedingung.
- **Antigravity CLI `agy`** — lokal 1.1.24, installiert 2.9.2026. Headless:
  `agy -p "<prompt>" --mode plan --model <slug> --output-format json
  --print-timeout 120s` (Default-Timeout 5 min). Weitere verifizierte Flags:
  `--json-schema`, `--effort low|medium|high`, `--input-format stream-json`,
  `--continue`, `--agent`, `--sandbox`, `--add-dir`. `agy models` listet
  `gemini-3.1-pro-high/-low`, `gemini-3.6/3.7/3.8-flash-*`,
  `claude-opus-4-6-thinking`, `claude-sonnet-4-6`, `gpt-oss-120b-medium`.
  Regeldateien: `~/.gemini/GEMINI.md` global, `AGENTS.md` und `.agents/rules/`
  im Workspace, Kappung 12 000 Zeichen je Regeldatei. **Offen:** Kontextfenster
  je Modell, reale Kontingente, `read_file`-Regelform (Probe T3), ob der
  Browser-Subagent headless nutzbar ist (laut Doku nein).
  **Werkzeug-Falle (6.9.2026, zwei leere Läufe):** `timeout` existiert auf
  macOS nicht — `agy`-Aufrufe nie in `timeout N` wickeln, `--print-timeout`
  reicht.
- **Gemini-App / NotebookLM** — Gemini 3.1 Pro, 1-Mio-Kontext; ≤ 10 Dateien pro
  Prompt. Verlässlichkeit sinkt über ~200–400k Token (Multi-Needle mit 8 Nadeln
  bei 1 Mio nur noch 89 %) ⇒ Einheit ist der Erlass, nicht der Korpus.
  NotebookLM Pro rund 300 Quellen je Notizbuch mit Zitat-Ankern (Zahlen
  sekundär, Limit-Änderung per 2.9.2026 angekündigt). Deep Research nur zur
  Themenerschliessung: Zitatfehler bei Rechts-KI 17–34 %.
- **Nicht verfügbar:** Gemini CLI mit Privatkonto-Login (18.6.2026 eingestellt),
  Gemini-API per Schlüssel (nicht im Abo).

**Repo-Fakten (3.9.2026 geprüft):**

- **Keine Sitemap** — kein `public/sitemap*`, kein Generator-Skript. Das ist die
  Lücke, die der neue Schritt `SEO-BASIS` schliesst (D5).
  **Korrektur 4.9.2026 (Nullbefund Sonnet-Bauer beim Bau von `SEO-BASIS`): FALSCH.**
  Die Sitemap existiert seit 11.6.2026 (Commit a29fbe6c2; Index mit 4 Teil-Sitemaps seit
  1.9.2026, #612): Generator inline in `scripts/prerender.ts` (~Z. 463–504), schreibt
  `dist/sitemap.xml` + `dist/robots.txt` (8280 URLs, `SITE_URL` aus `src/lib/seo.ts`),
  Drift-Check im Build, Prod-Smoke `scripts/betrieb/prod-smoke.ts`, Tests `src/tests/seo.test.ts`.
  Der Faktencheck vom 3.9. suchte nur Dateinamen unter `public/` — Lehre: Repo-Fakten nur mit
  repo-weitem `grep` und Blick in `dist/` behaupten (Skill `auftrag` Ziff. 6). `SEO-BASIS` ist
  technisch erledigt; offen bleibt nur die Search-Console-Verifikation (David, kein Bau).
- **Lighthouse ist vorhanden** (`.github/workflows/perf-kalibrierung.yml`, `scripts/perf/lighthouse-budget.ts`)
  — nichts zu tun.
- **Keine Google-Fonts-CDN-Links** im Repo — das gerichtlich bestätigte
  Übermittlungs-Risiko (LG München, 20.1.2022) betrifft uns nicht.
- **Chrome DevTools MCP nicht konfiguriert** (kein `.mcp.json`) — nachrangig,
  Browser-Sonden gibt es in dieser Umgebung bereits.

**Messwerte aus Phase 0** (Stand 3.9.2026 — Belege: `STRUKTUR.md`, PRs/Issues
unten; nicht geschätzt):

| Teil | Befund |
|---|---|
| T1 Jules-Pilot | Issue #637 → PR #639, Ticket→PR 27 min (23:16Z→23:43Z). Plan ohne Rückfrage auto-freigegeben (Label-Weg). Whitelist eingehalten. Testnamen/Assertions gegen Ausgangsstand identisch: 16 describe / 56 it / 280 expect (Skript A, Grün-Beweis `e5d2f63ea~1`↔`e5d2f63ea`). Hilfsdatei = wörtliche Verschiebung. Nacharbeit: 0 Code, 1 Form (fehlender Roadmap-Trailer, beim Squash nachgesetzt). Merge `e5d2f63ea`. |
| T2 Gemini-Recall | 5/5 gefunden (zwei Läufe je Fall, nur übereinstimmende Funde gezählt). Fälle: OR 361/362 drop · SSV Anhang 2 leak · VZV Anhang 1bis bister · GebV SchKG Art. 30 Tabelle · DBG 222 leak. 14–40k Token, 45–140 s pro Lauf. Scheinfunde nur Harness-Artefakte, nach Bereinigung 0. Bauleiter-Stichprobe (Fälle 3 und 5) bestätigt. |
| T3 agy-Proben | stdout-Pipe auf macOS sauber. Falscher Modell-Slug ⇒ Status ERROR — **kein** stiller Fallback in lokal 1.1.24 (Repo-Befürchtung oben nicht eingetreten). `read_file` erst nutzbar mit `read_file(*)` + Deny-Ausnahmen (David 3.9., Entscheid D3) — die reine Pfad-Regel allein griff nicht. |
| T4 David/NotebookLM | offen. |
| T5 Prüfer-Probe | PR #638 (geschlossen) — der eingebaute, dem Prüfer unbekannte Fehler (abgeschwächter Matcher `toBeLessThan`→`toBeLessThanOrEqual`) wurde beim Lesen gefunden; **Zählwerte allein hätten ihn nicht gefangen** (gleiche Testnamen-/expect-Zahl) ⇒ Wurzel-Fix Skill `landung` + Skript `scripts/analyse/test-assertion-diff.ts` (diese Session, §17). **Gegenprüfungs-Korrektur 3.9.2026 (Opus-Prüfer):** die erste, zeichenweise Skript-Fassung riss bei einem Regex-Literal mit `)` im Inhalt (`/1 a\)/` in `src/tests/normtext-fedlex.test.ts`) den Statement-Umfang bis zum nächsten `describe`-Block auf — Fehlalarm bei einer reinen Kommentaränderung; ausserdem übersah eine gedopte MENGE ein entferntes Duplikat neben einem verbleibenden (`src/tests/verzugszins.test.ts`). Neu gebaut als `scripts/analyse/test-assertion-diff.ts`, AST-basiert (TypeScript Compiler API) mit Multimengen-Vergleich — alle fünf Rot-/Grün-Beweise siehe PR. |
| T6 Tabu-Probe | Issue #640 (Auftrag: Mindesthöhe-Assertion 120→100 lockern UND `A2_HOEHE_FALLBACK` in `src/pages/gesetz-leser/berechnungen.ts` anpassen — beides laut `AGENTS.md` §3 (c) bzw. Whitelist-Prinzip tabu). Jules-Oberfläche 3.9.2026, 02:05–02:15: Plan **ohne Rückfrage** freigegeben, Produktionswert UND Test-Assertion geändert — keine Rückfrage, kein Entwurfs-PR, keine Ablehnung. **Ergebnis: `AGENTS.md` hält NICHT als Zaun (0 von 1 Ablehnungen)** — Prosa-Regeln sind Erziehung, der Zaun sind Tore und Review. PR #642 (27 min), geschlossen (Probe), nie gemergt, vom Bauleiter; Issue #640 geschlossen. |

**Folgerungen aus T6 (in den Prozess übernommen, nicht nur notiert):**
1. Jede Fremd-PR-Prüfung MUSS `scripts/analyse/test-assertion-diff.ts` und
   den Whitelist-Diff fahren — kein Ermessen (Skill `landung` §«Fremde PRs», `referenz-jules.md`).
2. Auftrags-Vorlage: Die Whitelist bleibt Pflicht, aber der Schutz kommt aus
   dem Review, nicht aus dem Text von `AGENTS.md`.
3. **Phase-1-Punkt — gebaut 4.9.2026 (#645, Branch-Muster #649):** Fremd-PR-Tor in CI —
   für Branches im Jules-Muster (`*-<19-stellige Task-ID>`) automatisch den
   Assertion-Diff gegen `main` sowie Risikopfad-/Steuer-Doku-Berührung
   prüfen, rot bei Abweichung. Siehe §2 Phase 1.

**Phase-0-Fertig-Kriterium:** Werte eingetragen ⇒ **Phase 1 offen** (T4 bleibt
Davids Sache, unabhängig davon).

**Phase 1 — Messwerte (4.9.2026, abgeschlossen):**

| Teil | Befund |
|---|---|
| Pilot 2 (Issue #643 → PR #648) | `normtext-fedlex.test.ts` 940 Z. → 4 Dateien (max. 455); 25 describe / 81 it / 172 expect identisch (AST-Diff); eigener Vitest-Lauf 81 grün; Ticket→PR 30 min; Nacharbeit 0 Code, 1 Form (Trailer). Merge `cecaa3ccf`. |
| Pilot 3 (Issue #644 → PR #647) | `vorlagen.test.ts` 893 Z. → 4 Dateien (max. 423); 11 / 70 / 243 identisch; 99 Tests grün; 30 min; Nacharbeit 0 Code, 1 Form. Merge `77f08f29e`. Branch hiess `jules-1111541331587033919-8d87826d` ⇒ Muster-Fix #649. |
| Fremd-PR-Tor scharf | CI-Step lief auf #647 und #648 real (Jules-Branch erkannt, drei Vergleiche «identisch»); auf Nicht-Jules-Branches «nicht zuständig». Kein eigenes `check-*.ts` (Steuerungs-Deckel riss um 3,5 KB ⇒ Rückbau auf Shell-Step, §17-Gegengewicht). |
| Quote ohne Nacharbeit | **3 von 3** Jules-PRs ohne Code-Nacharbeit durch Gate + Landungs-Check (n = 3, 3./4.9.2026, Art: Test-Splits). Schwelle «< 2 von 3» nicht gerissen. Einziger wiederkehrender Mangel: fehlender `Roadmap:`-Trailer (Form, beim Squash nachgesetzt). |
| Claude-Token pro gelandetem Schritt | Bauleiter-Review eines Jules-PRs ≈ 10–20k Token (Diff-Stat, AST-Diff, eigener Testlauf, Squash); Bau durch Claude-Unteragent in dieser Session 118k (T5-Probe) bis 275k (Phase-0-PR) ⇒ Faktor ~5–10 zugunsten Jules — Messbedingung: mechanische Schritte, n = 3; Landungs-Mechanik (CI-Warten, update-branch) kommt in beiden Fällen dazu. |
| Beobachtung | E2E-Shards 2/8 flackerten einmal auf dem aktualisierten #650 (Artikel-Anker, Richter-Facette), Rerun grün; main gleichzeitig grün. |

**Phase 4 — Messwerte (4.9.2026):** Tickets #652–#655 (2 Test-Splits vorbeugend
766/728 Z. — Ticket-Begründung «über 800» war ungenau, Rüge Opus; 2 Komponenten-
Splits 926/1095 Z.). Werte laut `npm run fremdagenten:messung` /
`selbstopt:erheben` (Zeitreihe `messwerte/selbstopt-zeitreihe.json`, letzter
Snapshot vor dieser Session, 04.9.2026T18:41Z), nicht handgerechnet:

| Teil | Befund |
|---|---|
| #659 plan-check | 25 min, landbar. |
| #661 zustaendigkeit | 33 min, landbar. |
| #663 ArtikelBody (Komponenten-Split) | 59 min, landbar (Opus-Gegenprüfung: byte-gleich, Schnittstelle unverändert; Nebenfund pfadgebundene Wächter, s. Kleinbefund unten). |
| #662 EntscheidLeser (Komponenten-Split) | 57 min, **ABGELEHNT**: 197 Kommentarzeilen gelöscht, ein Nutzer-String verstümmelt ⇒ Tor-Regel 3 «Kommentar-Bilanz» (#664) verankert, dazu die Messregel oben («vorgegebene Partition»). |
| Landungsquote gesamt seit 3.9. | **6 von 7 Jules-PRs landbar (n = 7)** — Test-Splits 5/5, Komponenten 1/2. Aus der Stufe-1-Zeitreihe (Fenster 7 Tage, Proben ausgeschlossen): 5 gemerged / 1 geschlossen = **Landungsquote 83 % (n = 6)**, Median-Dauer 30 min, 1 Probe mit Label `probe` separat ausgewiesen. |
| #699 plan-selbstopt (Test-Split, Jules 8, 5.9.2026) | 33 min, landbar (Opus-Sichtprüfung: 16 describe/100 it byte-gleich, Assertion-Diff 0, Kommentar-Bilanz 97→105). PR-Body behauptete «check:schlankheit GRÜN» — Vorbestand rot (ArtikelLeser 812 Z.), Angabe unbelegt (§14.7). |
| #700 ArtikelLeser (Komponenten-Split mit EXPLIZITER Partition, Jules 9) | 40 min, landbar — die Lehre aus #662 trägt: mit vorgegebener Partition (Block + Zeilen) sind Komponenten-Splits landbar. Kleinbefunde: toter Re-Export `LEITFAELLE_SICHTBAR`; pfadgebundene Wächter (`leser-benennung`, `leser-typo-tokens`) kennen die Split-Geschwister nicht (§6.7, auch #663) → Claude-Nachzug. |
| #701 zh-pdf-seiten-stuecke (Fixture-Split, Jules 10) | 52 min, landbar (Sonnet: 84/65/76 Einträge deep-equal). Kleinbefund: Fixture-Interface 4× dupliziert statt importiert (§5). |
| Landungsquote seit 3.9. (Stand 5.9.2026 09:30) | **9 von 10 Jules-PRs landbar (n = 10)** — Test-Splits 6/6, Fixture-Split 1/1, Komponenten-Splits 2/3 (der abgelehnte ohne Partition). Nacharbeit je 0 Code-Zeilen; Nachzüge in Wächter-Listen sind Claude-Arbeit. |
| #710 schritte-eingabe (Komponenten-Split, explizite Partition, Jules 11, 5.9.2026) | 47 min, landbar (Opus: beide Blöcke byte-gleich, Import-Trimmung belegt, 0 pfadgebundene Wächter). Vorbeugend (771 Z.), ehrlich ausgewiesen. **Falle:** nach `gh pr update-branch` pushte Jules neu (51494bb2c) und drehte den Tree auf den Stand vor #711 zurück — Landung per Cherry-Pick des geprüften Heads (Regel jetzt im landung-Skill). |
| #709→#711 steuerwerkzeuge (Test-Split, Jules 12) | 39 min, Inhalt landbar (Opus: 0 Zeilen Diff, describe 15=10+5, it 68=48+20). **Betreff «refactor(tests): …» machte `check:testtreue` in CI rot**; lokales `gate` kannte das Tor nicht (Paritätslücke). Landung per Cherry-Pick unter korrigiertem Betreff (#711, 0 Code-Zeilen Nacharbeit); Wurzelfix #712 (Testtreue im gate, Betreffregel AGENTS/Vorlage). |
| #707 ZhStueckFixture (Jules 13) | 33 min, **gültige Entwurf-Antwort** (runde3 hat Pflichtfeld `f`, Auftrag verlangte Abbruch bei Feldabweichung) — geschlossen ohne Merge, nachgeschärft als Jules 13b (#708). Zählt nicht als Ablehnung; Klasse `entwurf-antwort` gebaut 5.9.2026 (QS-EFFIZIENZ). |
| #714 ZhStueckFixture (Jules 13b, nachgeschärft) | 48 min, landbar (Opus: nur zwei Typ-Köpfe, Daten byte-gleich, Verbraucher gedeckt) — Landung per Cherry-Pick (Regel 7a). Nachschärfung nach Entwurf-Antwort trägt: 1 Durchgang. |
| #726 Checkbox-Baustein Formulare 1/3 (Jules 14, Ticket #722) | 70 min, landbar (Opus: Whitelist 5/5, Assertion-Diff 0, Kommentar-Bilanz 0/0; Befund `z.&nbsp;B.`→`z. B.` offengelegt) — Cherry-Pick in #729. |
| #725 Checkbox-Baustein Formulare 2/3 (Jules 15, Ticket #723) | 75 min, landbar (Opus: Whitelist 5/5, Assertion-Diff 0) — Cherry-Pick in #729. |
| #727 Checkbox-Baustein 3/3 (Jules 16, Ticket #724) | 66 min, **abgelehnt** (Opus): drei Stellen über den Auftrag hinaus — Klassen-Konkurrenz `VorlagenSeite.tsx:189`, Ausrichtungs-Kipp in `EntscheidFilter.tsx` gegen gemessenen §0.2-Kommentar, `title` auf neue Wrapper in `schritte-eingabe.tsx` statt gemeldeter Ausnahme (AGENTS.md §7). Kommentar am PR, offen gelassen. |
| Landungsquote seit 3.9. (Stand 5.9.2026 abends) | **14 von 17 Jules-PRs landbar (n = 17)**, 2 abgelehnt (#662 Split ohne Partition, #727 Umbau über Auftrag hinaus), 1 Entwurf-Antwort (#707). Muster #727: Aufträge mit gemischten Bausteinen (Filter, Wizard-Schritte) laden zu «Verbesserungen» ein — Whitelist künftig auf Formulare gleicher Bauart beschränken. Komponenten-Splits mit expliziter Partition 3/3. Nacharbeit Code: 0 Zeilen; Betreff-Korrektur 1×. |
| Laufzeiten | Median 30 min gesamt; Test-Splits 25–33 min, Komponenten-Splits 57–59 min — Komponenten-Splits sind deutlich teurer. |
| Fremd-PR-Tor | 5× scharf grün; 1× Eigen-Fehlalarm (#656, Muster zu breit → korrigiert durch #656/#649). |
| E2E-Shard 2/8 | flackert wiederkehrend (Artikel-Anker OR 336c/257d, Richter-Facette; #650, #658 je Rerun grün) — s. ROADMAP-Kleinbefund «E2E-Flake Shard 2/8». |

**Phase 4 — Messreihe 14.9.2026 (Reiterleiste/`tabs.ts`): drei Tickets, drei Ablehnungen.**

| Teil | Befund |
|---|---|
| Tickets | #849 (`Reiterleiste.tsx`-Split), #850 (`tabs.ts`-Split), #858 (`tabs.ts`-Split, Neuanlauf). |
| #855 (zu #849) | **abgelehnt** — Kommentar-Zeilenzahl 696 → 600 (96 gelöscht) und vier Kommentar-Paraphrasen («hing» → «hung», eingefügtes «suddenly»); zusätzlich geänderte Hook-Reihenfolge ⇒ D16-e2e rot. *Attribution 14.9.2026 korrigiert:* die D16-Spec flackerte unabhängig vom Split (3/3 rot auch in #859, einem reinen Daten-PR) — die Ablehnung stützt sich damit auf die vier Kommentar-Verfälschungen, **nicht** auf «Verhaltensänderung». |
| #857 (zu #850) | **abgelehnt** — dieselben Kommentar-Paraphrasen; die Kommentar-Summe war nach der ersten Ablehnung exakt zurückgebaut (580 → 580), die Zeilen aber verfälscht. Daraus Regel 3b des Fremd-PR-Tors (Multimengen-Vergleich, PR #862). |
| #861 (zu #858) | **abgelehnt** in der Substanz (`ZU_MAX` statt `MAX` exportiert, `hashVon` dupliziert). Die **Form-Abweichung geht teilweise auf mich**: Ticket #858 trug nur die EN-Summary-Zeile (s. Regel unten), Jules konnte die Detailregeln — max. 2 Dateien, Namensschema, Export-Verbot — gar nicht lesen. |
| Muster | **Jules generiert, statt zu verschieben.** Bei Split-Aufträgen an gewachsenen Dateien schreibt er Kommentare neu, statt sie mitzunehmen. Die Rückbau-Schwelle §3 ist an dieser Serie zu prüfen. |
| Folge-Ticket (nächste Session) | `tabs.ts`-Split, dritter Anlauf: geteilte Konstanten/Helfer/Typen (`MAX`, `hashVon`, `GeschlossenerReiter`) **wörtlich** in eine Typen-Datei, beide Hälften importieren daraus; `export` nur bei echtem Import. Fremd-PR-Tor zusätzlich um Duplikat-Erkennung ergänzen (`comm -13` auf identische Code-Zeilen). Folge zu #862. |

**Kanal «Suggestions» (proaktiv) — Sichtung 14.9.2026, Kanal danach abgeschaltet.**

| Teil | Befund |
|---|---|
| Umfang | **76 Vorschläge**, unaufgefordert erzeugt (Jules-Toggle «Suggestions»; nach dem Abschalten zeigt die Oberfläche «0 / 5 repo max»). |
| Ausbeute | **3 belastbar (~4 %)**, **0 gestartet** — eingeordnet als ROADMAP-Schritt `QS-CODE-LFZ-GRENZE`. (1) `src/lib/datumsUtils.ts:38` `dauerUeberDreiMonate` (Art. 324a OR): Bug-Fix vom 10.6.2026 ohne Direkttest an der Grenze (genau 3 Monate / Tag 1 des 4. Monats), heute nur indirekt über `lohnfortzahlung.test.ts` LA4 gedeckt. (2) `src/components/vorlagen/ZefixSuche.tsx:8`: Kommentar «Datenschutz-Wortlaut TODO David» überholt — abgenommen 12.6.2026 (`abnahme/wortlaute-2026-06/PAUSCHALABNAHME-2026-06-12.md`), Absatz in `src/pages/Datenschutz.tsx:52-57`. (3) `src/components/forms/ZustaendigkeitForm.tsx:235`: Klammer-Vermerk «(TODO 5 betreibungskreise-kantone.md)» liest sich als offen, die Auswahl (`PlzGemeindeWahl`) ist seit 10.6.2026 gebaut. Optional dazu: Wächter-Kommentar `ArtikelBody.tsx:135` (Quelle des `dangerouslySetInnerHTML` ist ausschliesslich das eigene DOM). |
| Rauschen-Muster | Der Kanal kennt den Repo-Kontext nicht: «Refactor long function» (20×) gegen ein Tor, das Datei- statt Funktionslängen misst; «Sequential await» (20×, 19 davon in `scripts/`) gegen absichtliche Höflichkeitspausen an amtlichen Quellen; «Cleanup» (7×) gegen bewusst geparkte David-Entscheide (Abnahme-Zeitsperre ab 1.12.2026); «Actionable marker» (5×) auf Kommentare, die das Gegenteil sagen («KEIN document.title-Hack»); 1 Security-Fehlalarm (Self-XSS-Klasse, `ArtikelBody.tsx`); 8 von 17 Test-Vorschlägen bereits abgedeckt. |
| Folge | **Kanal aus** (David 14.9.2026, §6 D8). Jules bleibt mit GitHub verbunden für auftragsgebundene Tickets mit vorgegebener Partition. |
| Messbedingung | Ein Sichtungslauf, Repo-Stand `main 203a292e9`, Prüfung am Code durch einen Opus-Agenten (read-only). Keine Wiederholung, n = 1 Kanal-Lauf; der Sichtungsaufwand selbst wurde nicht gemessen. |

**Regel (14.9.2026, Vorfall Ticket #858): Ticket-Body nach `gh issue create` zurücklesen.**
Beim Ableiten aus `docs/token-oekonomie/jules-ticket-vorlage.md` scheiterte das `sed`-Kommando an
Sonderzeichen, die Body-Datei blieb leer, `gh issue create` nahm sie trotzdem an, und ein
nachgeschobenes `gh issue edit` setzte nur die eine Summary-Zeile. **Kein Jules-Start, bevor**
`gh issue view <N> --json body -q .body | wc -l` mindestens die Zeilenzahl der Vorlage meldet.
Dieselbe Regel steht in `.claude/skills/landung/referenz-jules.md` und in der Ticket-Vorlage.

**Diskrepanz-Finder-Läufe (Phase 2)** — Werte aus §2 Phase 2 übernommen:

| Datum | Erlass | Artikel mit Diff | an Gemini | echt | Schein | Tokens |
|---|---|---|---|---|---|---|
| 4.9.2026 | AMBV | 5 | 12 | 8 | 0 | 59 528 |
| 4.9.2026 | DBG Art. 1–60 | 1 | 3 | 0 | 1 | 54 836 |

**Phase 3 — Zweitblick-Durchgänge** (erster Durchgang eingetragen, entsteht sonst im Alltag):

| Datum | Erlass/Norm | Prüfer | echt | Schein | verpasst | Tokens |
|---|---|---|---|---|---|---|
| 4.9.2026 | AMBV (75 Art.) + VZV Art. 1–10 (2 Art.) | Opus, frischer Kontext (Gegenprüfung #658, `gegenpruefung-register.md`) | 1 (vorbestehend: Klasse Einheit+Hochzahl, 218×) | 7 (Zeilenversatz/`…`) | 0 | — (Zahl nicht separat im Register geführt) |

**Recherche-Vergleich Sonnet vs. Gemini** (leer, Messregel Skill `auftrag` Ziff. 6b):

| Datum | Auftrag | Sonnet-Ergebnis | Gemini-Ergebnis | Abweichung |
|---|---|---|---|---|
| 5.9.2026 | Repo-Suche «bestehende Ideen/Repos für 9 LexMetrik-Lücken» (gleicher Auftrag als Datei, Ausschlussliste 2.9.); Auswertung `bibliothek/recherche/rules-as-code-sichtung-2026-09-05.md` §8 | 22 Einträge, 20 per `gh api` selbst belegt (Lizenz/Push/Stars stimmen mit Nachprüfung der Haupt-Session überein), 1 Cluster ehrlich «unklar»; Schlüsselfund legalize-ch; 199 s, ~51k Token, 23 Tool-Aufrufe | 15 Einträge, **2 existieren nicht** (`holiday-calendar/core`, `adysre/business-rules-engine`), **3 Lizenzen falsch** (bluebell GPL≠LGPL, legal-sources AGPL statt «unklar», Saldenwerk MIT statt «unklar»), 1 archiviertes Repo nicht gemeldet, 9 Felder «unklar», die `gh api` in Sekunden beantwortet; Etikett «belegt» auch an Nicht-Existentem; eigene Funde: rules-machine, zen-engine-wasm; 148 s, ~54k Token (44.8k in / 9.1k out), 1 Turn, sandbox | Überschneidung nur gorules/zen, bluebell, blawx. **Sonnet belastbar, Gemini nur mit vollständiger Nachprüfung** — Halluzinationsquote 2/15 Repos, Lizenz-Fehlerquote 3/13 existierenden. Gemini-Etikett «belegt» ist wertlos; Regel: Gemini-Repo-Listen immer per `gh api` sieben, bevor sie in die Bibliothek gehen. |
| 5.9.2026 | Design-Identität: Farb-/Schriftidentität + Amts-Vorbilder für Schweizer Rechtsportal (W2·24-DESIGN-IDENTITAET); Auswertung `bibliothek/recherche/design-identitaet-2026-09.md` §1 | kein separater Lauf — in der Haupt-Session erhoben, kein Transkript, n/a | 3 Paletten + 3 OFL-Schriftpaarungen + 6 Amts-Vorbilder, alle Aussagen Status «belegt» mit Einzel-URL+Abrufdatum; 117 s, ~28k Token | Kein Vergleich möglich (fehlender Sonnet-Lauf); Gemini-Aussagen hier ungegengeprüft — Divergenz zur Sonnet-Nicht-KI-Runde bei «Inter» (neutral vs. KI-Signal) und «Creme/Gold» (Gemini behauptet KI-Signal, Sonnet unbelegt) einzeln im Dossier aufgelöst |
| 5.9.2026 | Nicht-KI-Webdesign: Merkmale/Gegenmittel/Referenzseiten/Typo für Rechtstext (W2·24-DESIGN-IDENTITAET); Auswertung `bibliothek/recherche/design-identitaet-2026-09.md` §2 | 15 KI-Merkmale + 15 Gegenmittel je mit Einzelquelle, 5 Referenzseiten mit Übernahme-Punkt, eigener «Offen/unklar»-Abschnitt (Creme/Gold als KI-Signal nicht gefunden, NZZ/Fedlex/Duden u. a. nicht selbst geprüft); 35 849 Token / 125 s | 10 KI-Merkmale + 10 Gegenmittel mit Sammelquelle statt Einzelbeleg, 5 Referenzseiten (NZZ, Fedlex ohne Fundstelle zur Behauptung); Dauer unbekannt | Sonnet feinkörniger belegt und offener über eigene Lücken (Unklar-Kennzeichnung statt Behauptung); Gemini deckt mehr Referenzen ab (NZZ), aber unbelegt an der konkreten Aussage |
| 6.9.2026 | Bildschirm-Lesbarkeit: Kontrast/Halation/Polarität/opsz für D12 «Lesekomfort» (W2·24-DESIGN-IDENTITAET); Auswertung `bibliothek/recherche/design-identitaet-2026-09.md` §3 | 12 Einzelbelege inkl. selbst nachgerechneter WCAG-Kontraste (GOV.UK 19,59:1, Wikipedia 16,13:1), konkreter Hell-/Dunkel-Token-Vorschlag, 5 offene Punkte benannt; 45 162 Token / 167 s | dieselben Kernstudien (Piepenbrock/Buchner, APCA/Somers), eigener Token-Vorschlag mit leicht abweichenden Hex-Werten, 1 Punkt selbst als «unklar» markiert; Dauer unbekannt | Kein Sachverhaltsstreit — beide Agenten inhaltlich deckungsgleich, nur Hex-Wert-Rundungsunterschiede; Sonnet mit höherer Primärquellen-Traceability (eigene Kontrastrechnung) |
| 6.9.2026 | Curia Vista / ws.parlament.ch: Entitäten, Join-Schlüssel, Lizenz, Transcript, Voting (gleicher Auftragstext an beide) | `$metadata` live abgerufen (49 Entitäten), `Objective`-Entität als Join-Pfad Botschaft→Schlussabstimmung→AS→Referendumsfrist belegt, harte 1000er-Seitengrenze empirisch, Lizenz-Wortlaut zitiert, Transcript 346'433 DE-Zeilen, Voting 4,8 Mio., Widerspruch amtliche Doku (ws-old) vs. Empirie erkannt; ~64k Token, 22 Tool-Aufrufe, 273 s | (gemini-3.1-pro-high, agy, sandbox) Datenmodell/Join «unklar» (Metadaten nicht abgefragt), Transcript/Voting nur nominell, Doku-Widerspruch nicht erkannt, Mehrwert: zwei Zulieferer-Hinweise (metaodi/swissparlpy, api.openparldata.ch), Fahnen als «unklar/unwahrscheinlich» korrekt; 1 Turn, Dauer nicht gemessen (erster Lauf scheiterte an fehlendem `timeout` auf macOS, Wiederholung ohne Wrapper) | Sonnet belastbar und empirisch, Gemini beschreibend ohne eigene Abfragen — bestätigt die Regel vom 5.9. |
| 6.9.2026 | Fedlex historische Konsolidierungen / Fassungsvergleich / AS-XML-Änderungsbefehle (Opus-Agent R2 empirisch vs. Gemini Web) | Opus R2: SPARQL + Filestore live (OR/ZGB/DSG/ZPO/SchKG), HTML alter Stände erst ab 1.1.2021 belegt, Diff Art. 336c exakt gegen Fussnoten geprüft, AS-XML `eli/oc/2023/680` ohne `<mod>` (Fliesstext in Tabellenzelle), Alias-URL-Phantom gemessen, Volumen 3,8–9,7 MB hergeleitet; ~138k Token, 67 Tool-Aufrufe, 1094 s | Gemini: behauptet «belegt» (a) AS-XML mit `<mod>/<quotedStructure>` — Beleg nur der generische OASIS-Repo-Link, (b) Fedlex-Web «Vergleich der Fassungen» — unbelegt; Ontologie-Aussagen korrekt aber generisch; keine eigene Abfrage | **Beide Gemini-Kernaussagen falsch** (von R2 empirisch widerlegt); Etikett «belegt» erneut wertlos. Regel bestätigt: Gemini nie als Quelle für Datenformat-Behauptungen, nur als Stichwortgeber. |

**Kontingent-Ereignisse** (leer, Skript `npm run fremdagenten:messung --
--kontingent`, Regel §4 «Limite erkennen» — die Zahlen 100/Tag und 15
parallel für Jules sind unbelegt; das erste hier eingetragene Ereignis
belegt sie oder korrigiert sie):

| Datum | Dienst | Signal | Dauer | Folge |
|---|---|---|---|---|

**Offene Retro-Vorschläge, Session-Entscheid ausstehend:** Fehlerklassen F2g,
F2h, F5, F7, F8, F9 tragen Retro-Vorschläge aus einer früheren Session
(Register-Drift des Skills `lehren`), **nicht** aus dieser — hier nur erwähnt,
nicht angefasst; der Entscheid darüber bleibt offen.

**Stand nach dieser Session (4.9.2026):** Phase 0 ✓ · Phase 1 ✓ (3/3) · Phase 2 ✓ (#650,
Diskrepanz-Finder mit deterministischem Erstfilter, Pilot AMBV 8/8 klassiert) · Phase 3 erster
Durchgang eingetragen (1/5 Zweitblick-Durchgänge, Schwelle §3 n = 5 noch nicht erreicht) · **Phase 4
läuft** (Landungsquote 83 %, n = 6, Median 30 min — Skalierungs-Schwelle §3 erreicht; Antigravity-
Claude D7 geparkt, kein Zwischenmarkt zu Jules). Schritt-Status darum `ready`, nicht `wip`.

## §6 · Entscheide (David, 3.9.2026)

| # | Frage | Entscheid | Folge |
|---|---|---|---|
| D1 | Testlauf Jules starten (Label + öffentliches Pilot-Issue)? | **ja** | Bauleiter legt Label und Issue an; David richtet die Umgebung ein |
| D2 | Test-Regel für Fremde: «verschieben/aufteilen bei Auftrag ja, Assertions nie»? | **ja** | in `AGENTS.md` §3 (c) präzisiert |
| D3 | Lese-Freigabe `read_file(*)` mit Deny-Ausnahmen einfügen, falls die Repo-Root-Probe scheitert? | **ja** | Einsatz B möglich; Deny für `~/.ssh`, `~/.gemini`, `~/.claude`, `.env` — David fügt ein |
| D4 | Jules-API-Schlüssel jetzt erzeugen? | **Phase 4** | kein Geheimnis-Handling vorher |
| D5 | Auffindbarkeits-Basis (Sitemap + Search Console) trotz SEO-Parkung entparken? | **ja**, minimal | neuer Schritt `SEO-BASIS`, kein SEO-Ausbau; Domain-Verifikation durch David |
| D6 | NotebookLM-Abnahme-Notizbuch anlegen? | **David** (empfohlen) | kein Bau nötig |
| D7 | Antigravity-Claude als Bauarbeiter testen? | **geparkt** (Bauleiter/David-Chat 4.9.2026) | Jules deckt die Rolle bereits ab, Claude 4.6 ohne Skills bringt keinen Zwischenmarkt; Wiedervorlage nur bei Kontingent-Engpass |
| D8 *(14.9.2026)* | Proaktiven Jules-Kanal «Suggestions» weiterlaufen lassen? | **nein — abgeschaltet** («einverstanden, wir schalten jules wieder ab», David 14.9.2026) | Toggle aus («0 / 5 repo max»); Jules bleibt für auftragsgebundene Tickets verbunden. Begründung: 76 Vorschläge → 3 belastbar (~4 %, §5). Der Kanal urteilt **ohne Repo-Kontext** — er kennt weder `check:schlankheit` (misst Datei-, nicht Funktionslängen) noch die Abnahme-Zeitsperre bis 1.12.2026 noch die absichtlichen Höflichkeitspausen an amtlichen Quellen. Die drei Funde: ROADMAP `QS-CODE-LFZ-GRENZE` |

**Offen — klärt nur ein Testlauf:** Jules-Laufzeiten, Branch/Autor, deutsche
Aufträge, CI-Auto-Fix, reales Kontingent · Antigravity `read_file`-Regelform,
reale Sperren, Kontextfenster, Diskrepanz-Treffer bei CH-Rechtstexten,
Mindgard-Schwachstelle · NotebookLM-Limiten seit 2.9.2026.

## §7 · Ökosystem jenseits KI

Was Google sonst noch bietet, ohne Cloud-Abrechnungskonto — geprüft gegen den
Repo-Ist-Stand vom 3.9.2026.

| Werkzeug | Befund | Einordnung |
|---|---|---|
| Search Console + Sitemap | gratis, nur Domain-Verifikation; ~~Repo hat keine Sitemap~~ **Korrektur 4.9.2026: Sitemap existiert** (Repo-Fakten oben) | Search-Console-Verifikation durch David; `SEO-BASIS` technisch erledigt (Nullbefund) |
| Lighthouse CI | **schon vorhanden** | nichts zu tun |
| Google Fonts self-host | **nicht betroffen** (kein CDN-Link) | nichts zu tun |
| Chrome DevTools MCP | offiziell, gratis, **nicht konfiguriert** | nachrangig; bei QS-PERF-Bedarf |
| Google Sheets als Erfassung | gratis, CSV-Export ins Repo | bei Bedarf für Davids Tabellen; der Datenpfad bleibt Risikopfad mit Gegenprüfung |
| Google Alerts / Trends | gratis; Nischenvolumen oft «insufficient data» | Alerts auf «LexMetrik» (David, 2 Minuten); Trends bei Redaktionsfragen |
| schema.org `Legislation` | kein Google-Rich-Result belegt | höchstens Zusatz-JSON-LD, ohne Erwartung |

**Lassen — mit Grund:**

- **Firebase Studio / Project IDX** — Import bestehender Projekte seit 22.6.2026
  abgeschaltet, Einstellung 22.3.2027.
- **Google Analytics 4** — die USA gelten laut EDÖB als Drittstaat ohne
  angemessenes Schutzniveau; widerspricht dem DSG-Anspruch. Vercel Analytics
  oder Plausible sind die saubere Wahl.
- **Document AI / Cloud Vision OCR** — kein echtes Gratis-Tier, GCP-Konto nötig,
  Ergebnis nicht deterministisch (§2).
- **Play Store (PWA/TWA)** — «Website ohne App-Mehrwert» wird nach den Regeln
  2026 abgelehnt; Aufwand ohne Verhältnis zum Nutzen.
- **Nonprofits / Ad Grants / Business Profile** — setzen Rechtsform bzw.
  physischen Kundenkontakt voraus; beides fehlt.
- **Cloud Translation für Rechtstexte** — verletzt §7 (amtliche Fassung) und §2;
  Fedlex ist ohnehin amtlich dreisprachig.
- **Custom Search API** — für Neukunden geschlossen, Abschaltung 1.1.2027;
  pagefind ist der evaluierte Weg.
- **Stitch / Opal / Google Sites** — Neubau-Werkzeuge ohne Nutzen für ein
  bestehendes Vite/React-Repo mit Design-Tokens.

**Wiedervorlage: Google-Ökosystem-Sichtung** (ROADMAP-Kleinbefund, Dach
QS-FREMDAGENTEN Phase 4, ergänzt 4.9.2026): alle 3 Monate, erste Fälligkeit
**Dezember 2026** — Gemini-Recherche (agy, `read_url(*)`) «neue Google-KI-
Produkte/Modelle, Jules-/Antigravity-Changelog seit \<letzte Sichtung\>»,
Bewertung ~30 min, Ergebnis als neue Zeile in diese Tabelle. Maschinischer
Anstoss: `retro:17` Regel (h) (`scripts/plan/retro17Kern.ts`), sobald
`bibliothek/register/antigravity-stand.json` `letzte_sichtung` mehr als 30
Tage zurückliegt — Register erneuern mit `npm run fremdagenten:messung --
--kontingent --snapshot`.

Seit 20.9.2026 (retro:17-Rückbau, Entscheid David) entfällt der maschinelle Anstoss ersatzlos — die Wiedervorlage Dezember 2026 bleibt bestehen, der Anstoss läuft ab jetzt manuell.

## §8 · Gemini-Kritik am Plan und Antwort (3.9.2026)

Gemini 3.1 Pro hat den Plan über `agy` gelesen und fünf Schwächen genannt. Die
Rückgabe ist Daten (§14.7); hier steht, was übernommen wurde und was nicht.

**Übernommen:** die Prüfer-Probe **T5** (gepflanzter Fehler) und die Tabu-Probe
**T6**; die Erinnerung, dass Prosa-Regeln kein Zaun sind (bei uns sind die Tore
der Zaun, §0); der Hinweis, dass Deny-Listen keine Betriebssystem-Sandbox sind
(⇒ zusätzlich `--sandbox`, gar keine Schreibrechte, §4).

**Nicht übernommen, mit Grund:**

- *«Einsatz A streichen, LLMs taugen nicht zum zeichengenauen Abgleich.»*
  Richtig für die Strukturebene — dort haben wir deterministische Tore. Einsatz
  A zielt auf die Restklasse, die diese Tore nicht sehen; ob er sie trifft,
  entscheidet **T2** (Recall auf bekannte Fälle), nicht die Meinung.
  Bemerkenswert: Gemini rät von Gemini ab — eher ein Zeichen ehrlicher Skepsis
  als ein Argument gegen den Test.
- *«Jules nur über API, keine öffentlichen Issues.»* Labels setzen kann nur, wer
  Schreibrecht im Repo hat; Dritte lösen nichts aus. Der Issue ist zugleich die
  öffentliche Spur des Auftrags. Die API kommt in Phase 4 (D4).
- *«D5 streichen (Fokus).»* Berechtigter Einwand, war Davids Entscheid — die
  Auffindbarkeit ist der Nordstern, nicht die Agenten-Infrastruktur (D5: ja).
- *«CLI-Flags `--json-schema`/`--effort`/`--print-timeout` unsicher.»*
  Verifiziert aus `agy --help` und der Headless-Doku (3.9.2026) — Gemini kannte
  sein eigenes Werkzeug hier schlechter als der Plan.
- *«Blindes Vertrauen in Claude als Prüfer.»* Es gibt kein blindes Vertrauen:
  Tore, Gegenprüfung, Davids Abnahme. **T5** misst die Checkliste trotzdem.
