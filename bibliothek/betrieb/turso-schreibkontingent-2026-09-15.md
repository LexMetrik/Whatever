# Turso-Schreibkontingent — Zählweise, Messung, Wurzel-Fix (15.9.2026)

**Erstellt:** 15.9.2026 — Anlass: Mail Turso «Writes Blocked» (Organisation
`ravedave`, Gratisplan). Messung und Bau durch einen Opus-Unteragenten im
Rahmen des ROADMAP-Schritts `QS-TURSO-SCHREIBVOLUMEN`
(Spec: `fahrplaene/FAHRPLAN-DATENHALTUNG.md` §17).
**Status:** ERSTRECHERCHE + Bau — Zahlen lokal reproduzierbar gemessen, die
Wirkung in der Turso-Konsole ist noch **nicht** nachgemessen (Nachmessung im
Oktober durch David, kein Gate).

---

## 1 Was «gesperrt» heisst — und was nicht

Der Gratisplan deckelt die **geschriebenen Zeilen pro Monat**. Lesen ist nicht
gedeckelt und war nie gesperrt: `api/suche` lieferte am 15.9.2026 HTTP 200 mit
Treffern, während jeder Schreibversuch scheiterte.

Die Sperre kommt **nicht** als HTTP-Status. Belegt durch die Sonde zum CI-Lauf
`34948342923` (15.9.2026): HTTP **200**, und je Statement ein Pipeline-Fehler
mit dem Text

> Operation was blocked: SQL write operations are forbidden (writes are blocked,
> do you need to upgrade your plan?)

Wer nur auf den Status schaut, sieht also einen erfolgreichen Request. Genau
darum erkennt `scripts/datenhaltung/turso-skip.ts` diesen Wortlaut und der Sync
endet mit einer eigenen `::error::`-Meldung und **Exit 3** (Datenfehler bleiben
Exit 1). Reset des Kontingents: am **1. des Monats**.

**Zählweise.** Turso zählt bei indexierten Tabellen **jede betroffene
Index-Zeile zusätzlich** zur Tabellenzeile (turso.tech/pricing, FAQ «rows
written», Abruf 15.9.2026). Alle Zahlen unten sind **Tabellenzeilen** — die
Turso-Rechnung liegt also höher. Für den Vorher/Nachher-**Faktor** ist das ohne
Belang, weil der Aufschlag auf beiden Seiten gleich wirkt.

## 2 Vorher: wo das Kontingent hinging

Gemessen am lokalen HOT-Artefakt (`npm run datenhaltung:build`, Stand
`daten-manifest.json` vom 14.9.2026), reproduziert die gemeldete Gesamtzahl des
CI-Laufs vom 14.9.2026 16:10 UTC **exakt**:

| Was der Sync schrieb | Zeilen |
|---|---:|
| `erlasse` | 1 570 |
| `erlass_fassungen` | 1 570 |
| `artikel` | 60 508 |
| **Basis-Tabellen zusammen** | **63 648** |
| `fts_artikel` Schatten (`_config` 1 · `_data` 4 367 · `_idx` 3 032 · `_docsize` 60 508) | 67 908 |
| `fts_entscheide_schaufenster` Schatten (`_config` 1 · `_data` 16 981 · `_idx` 12 341 · `_docsize` 5 093 · `_content` 5 093) | 39 509 |
| **Voll-Rebuild gesamt** | **171 065** |

Und er lief **bei jedem Push auf `main`**, der Daten- oder Schema-Pfade berührte:
**39 Läufe vom 1.–14.9.2026 = 6 671 535 Zeilen in 14 Tagen** (≈ 477 000/Tag).

Der entscheidende Befund dabei: gemessen an den Commits derselben 14 Tage gab es
nur **7 Tage mit einer Korpus-Änderung** (`public/normtext`,
`public/rechtsprechung`, `daten-manifest.json`), davon **2** mit einer Änderung
an der Rechtsprechung. Die 39 Läufe schrieben also 39-mal denselben Inhalt,
wovon 7-mal überhaupt etwas neu war.

## 3 Nachher: die zwei Hebel

1. **Bündeln.** Der Push-Trigger entfällt; es läuft ein Tageslauf (cron 05:17
   UTC) plus `workflow_dispatch`. Höchstens **1 Rebuild je Kalendertag** statt
   2,8 (39/14).
2. **Tabellen-Skip.** Je Tabelle liegt eine Signatur in `sync_meta`
   (`sig_<tabelle>` = sha256 über Ziel-DDL + Inhalt; Basis aus dem committeten
   `daten-manifest.json`, FTS aus den lokalen Schatten-Tabellen). Übersprungen
   wird nur bei **gleicher Signatur UND passender Remote-Zeilenzahl**. Ein Tag
   ohne Korpus-Änderung schreibt damit nur noch die **12 Marken** (`manifest_sha`,
   `stand`, 5× `zeilen_*`, 5× `sig_*`) — per UPSERT, nicht mehr «alles löschen
   und neu schreiben».

**Dieselben 14 Tage, dieselben Daten, mit dem neuen Verhalten gerechnet:**

| Tagesart | Anzahl | Zeilen je Tag | Summe |
|---|---:|---:|---:|
| ohne Korpus-Änderung | 7 | 12 | 84 |
| nur Normtext geändert (Entscheid-FTS bleibt stehen) | 5 | 131 568 | 657 840 |
| Normtext **und** Rechtsprechung geändert | 2 | 171 077 | 342 154 |
| **gesamt** | **14** | | **1 000 078** |

**6 671 535 → 1 000 078 Zeilen = Faktor 6,7.**

**Ehrlich benannt (§8): das Ziel «≥ 10× kleiner» aus §17 ist damit rechnerisch
NICHT erreicht** — bei der Kadenz des Septembers (Bund-Offensive, 7 Änderungstage
in 14). Das Erfolgsmass des Schritts ist erfüllt («≤ 1 Voll-Rebuild je
Korpus-Änderungstag statt je Push; an Tagen ohne Änderung nur Marken, < 20
Zeilen»), der Faktor hängt aber an der Zahl der Änderungstage:

> Zeilen je 30-Tage-Monat ≈ *k* × 131 568 (+ 39 509 an Rechtsprechungs-Tagen)
> + 30 × 12, wobei *k* = Korpus-Änderungstage.

Bei *k* = 15 sind es 5,4×, bei *k* = 7 rund 11×, bei *k* = 3 rund 24×. Wer den
Faktor unabhängig von *k* machen will, braucht **Delta-Sync innerhalb einer
Tabelle** — das ist bewusst **nicht** Teil dieses Schritts (Weiche C,
FAHRPLAN-DATENHALTUNG §10(7)): ein Voll-Rebuild je geänderter Tabelle bleibt,
weil er determinismus-beweisbar ist und kein Delta-Drift entstehen kann.

## 4 Was dabei NICHT weicher wurde

- **Prüfung 0 (SCHEMA)** von `check:turso-frische` kann der Skip nicht umgehen:
  die Ziel-DDL geht in die Signatur ein. DDL-Drift ⇒ andere Signatur ⇒
  Neuaufbau. (Der Fall ist real: `fts_artikel` bekam am 31.8.2026 sechs Spalten
  statt einer; gegen die alte Form antwortet `api/suche` mit 502 auf jede
  Artikel-Query.)
- **Prüfung 4 (ALTER)** trägt weiter, weil auch ein Vollskip die `stand`-Marke
  schreibt.
- **Die rowid-Kopplung** `fts_artikel.rowid == artikel.rowid` wird beim Teilbau
  bewiesen, nicht angenommen: wird `fts_artikel` gebaut und `artikel`
  übersprungen, laufen Zeilengleichheit aller drei Basis-Tabellen plus sieben
  über die ganze Spannweite gestreute rowid-Proben (Gegenprüfungs-Befund B1).
  Bis zum 15.9.2026 hing dieser Riegel am Handschalter `--nur-fts`; **der
  Handschalter ist entfallen** (der Skip leistet dasselbe automatisch und
  signatur-belegt), **der Riegel nicht** — er hängt jetzt am realen Risikofall.
- **Eine leere Remote-Tabelle wird nie übersprungen**, auch wenn das Soll 0
  wäre: der halb-gedroppte Zustand vom 19.7.2026 (`artikel` 16 400 von 55 822)
  ist genau das, was eine reine «nicht leer»-Prüfung passieren liess.

## 5 Preis und Pflegebedarf

- **Preis (§8):** ein gelandeter Korpus-Stand ist bis zum nächsten Tageslauf in
  der **Suche** noch nicht sichtbar. Die Seiten selbst sind sofort aktuell — sie
  kommen aus den prerenderten Projektionen, nicht aus der Replika. Wer nicht
  warten will, stösst den Workflow `Turso-Serving-Sync` per `workflow_dispatch`
  an. `check:turso-frische` fällt erst nach `MAX_ALTER_TAGE` (7) über das Alter;
  ein Tag Verzug ist kein Rot.
- **Pflegebedarf: entfällt mit dem VPS.** Sobald die Serving-DB auf dem eigenen
  Server liegt (FAHRPLAN-DATENHALTUNG §13/§14, netcup RS 4000 G12), gibt es kein
  Zeilenkontingent mehr. Skip-Plan und Sperr-Erkennung schaden dort nicht, sie
  werden nur belanglos.
- **Nicht getan** (Entscheid David 15.9.2026): kein Plan-Upgrade, keine Overages.
- **Offen:** die Nachmessung in der Turso-Konsole im Oktober. Die Zahlen oben
  sind gerechnet, nicht an der Abrechnung abgelesen.
