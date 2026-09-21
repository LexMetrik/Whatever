# Pflegetermin 1.10.2026 — amtliche SPARQL-Gegenprobe der 18 fälligen Bund-Erlasse

**Gegenstand.** `bibliothek/register/parameter-verfall.md` (AUTO-Block, Zeilen
68–85) führt 18 Bund-Erlasse mit «Nächste Prüfung» = 1.10.2026. Diese Gegenprobe
fragt für alle 18 den Fedlex-SPARQL-Endpunkt direkt ab, statt dem Register zu
vertrauen (§7).

**Status: Momentaufnahme 2026-09-20, nicht fachlich abgenommen (§7).** Herkunft:
`.claude/notizen/2026-09-20-recherche-pflegetermin-1010.md` (Recherche
lex-recherche sonnet, QS-MONITOR-ROT); hier unverändert aus der Notiz
übernommen, Werte nicht neu erhoben.

## Quelle mit Stand

Endpunkt `https://fedlex.data.admin.ch/sparqlendpoint`, Prädikat
`jolux:dateApplicability` (Prefix
`http://data.legilux.public.lu/resource/ontology/jolux#`) — dieselbe Abfrageform
wie `scripts/fedlex-sparql.ts`/`fedlex-wiedervorlage-generieren.ts:135-141`.
POST + `Accept: application/sparql-results+json`; Response-Content-Type war
`json` (keine HTML-Shell — die aus `scraping-swiss-official-sources` bekannte
Falle wurde geprüft und nicht angetroffen). **Abrufdatum aller 18 Abfragen:
2026-09-20.**

## Ergebnis-Tabelle (18 zum 1.10.2026 fällige Erlasse)

| Erlass (SR) | Abstract-ELI | geltend (≤ Abrufdatum) | nächste (> Abrufdatum) | Register-Abgleich |
|---|---|---|---|---|
| OR (220) | `eli/cc/27/317_321_377` | 2026-01-01 | **2026-10-01** | gepinnt 1.1.2026, nächste 1.10.2026 — belegt |
| StGB (311.0) | `eli/cc/54/757_781_799` | 2026-06-12 | **2026-10-01** | gepinnt 12.6.2026, nächste 1.10.2026 — belegt |
| BankG (952.0) | `eli/cc/51/117_121_129` | 2024-01-01 | **2026-10-01** | gepinnt 1.1.2024, nächste 1.10.2026 — belegt |
| GwG (955.0) | `eli/cc/1998/892_892_892` | 2024-03-01 | **2026-10-01** | gepinnt 1.3.2024, nächste 1.10.2026 — belegt |
| VRV (741.11) | `eli/cc/1962/1364_1409_1420` | 2026-07-01 | **2026-10-01** (weiteres künftiges Datum 2031-01-01) | gepinnt 1.7.2026, nächste 1.10.2026 (korrigiert von 1.1.2031 in #909) — belegt, bestätigt die #909-Korrektur |
| VTS (741.41) | `eli/cc/1995/4425_4425_4425` | 2026-07-01 | **2026-10-01** (weitere: 2028-02-01, 2031-01-01) | gepinnt 1.7.2026, nächste 1.10.2026 — belegt |
| VZAE (142.201) | `eli/cc/2007/759` | 2026-06-12 | **2026-10-01** | gepinnt 12.6.2026, nächste 1.10.2026 — belegt |
| VEV (142.204) | `eli/cc/2018/493` | 2026-06-12 | **2026-10-01** | gepinnt 12.6.2026, nächste 1.10.2026 — belegt |
| BBV (412.101) | `eli/cc/2003/748` | 2025-03-01 | **2026-10-01** (weiteres 2026-11-01) | gepinnt 1.3.2025, nächste 1.10.2026 — belegt (widerlegt Commit-Text «1.11.2026») |
| ZEMIS-V (142.513) | `eli/cc/2006/303` | 2026-08-01 | **2026-10-01** | gepinnt 1.8.2026, nächste 1.10.2026 — belegt |
| RVOV (172.010.1) | `eli/cc/1999/170` | 2026-03-01 | **2026-10-01** | gepinnt 1.3.2026, nächste 1.10.2026 — belegt |
| HRegV (221.411) | `eli/cc/2007/686` | 2025-01-01 | **2026-10-01** | gepinnt 1.1.2025, nächste 1.10.2026 — belegt |
| BBG (412.10) | `eli/cc/2003/674` | 2025-03-01 | **2026-10-01** | gepinnt 1.3.2025, nächste 1.10.2026 — belegt |
| SSV (741.21) | `eli/cc/1979/1961_1961_1961` | 2026-07-01 | **2026-10-01** | gepinnt 1.7.2026, nächste 1.10.2026 — belegt |
| FIDLEG (950.1) | `eli/cc/2019/758` | 2024-03-01 | **2026-10-01** | gepinnt 1.3.2024, nächste 1.10.2026 — belegt |
| KAG (951.31) | `eli/cc/2006/822` | 2024-03-01 | **2026-10-01** | gepinnt 1.3.2024, nächste 1.10.2026 — belegt |
| FINIG (954.1) | `eli/cc/2018/801` | 2024-03-01 | **2026-10-01** | gepinnt 1.3.2024, nächste 1.10.2026 — belegt |
| BEG (957.1) | `eli/cc/2009/450` | 2023-01-01 | **2026-10-01** | gepinnt 1.1.2023, nächste 1.10.2026 — belegt |

**Ergebnis laut Notiz:** alle 18 Register-Zeilen sind aktuell (`geltend == gepinnt`
für jede Zeile), und alle 18 haben tatsächlich eine Fedlex-Konsolidierung mit
`dateApplicability = 2026-10-01`. Register und Live-Quelle stimmen überein —
kein Drift gefunden. Zwei Erlasse (VRV, BBV) tragen zusätzlich eine weitere
künftige Fassung NACH dem 1.10.2026 (VRV: 2031-01-01; BBV: 2026-11-01) — die
1.10.-Nachführung muss danach eine neue Wiedervorlage-Zeile für diese
Folge-Fassung erzeugen (automatisch über `gen:fedlex-wiedervorlage`, im
PR-Review erwartbar).

## Register-Abgleich 21.9.2026 (eigene Nachprüfung dieser Triage-Session)

`bibliothek/register/parameter-verfall.md:68–85` trägt HEUTE (21.9.2026)
weiterhin genau **18** Zeilen mit «1.10.2026», dieselben 18 SR-Nummern wie oben
(142.201/142.204/142.513/172.010.1/220/221.411/311.0/412.10/412.101/741.11/
741.21/741.41/950.1/951.31/952.0/954.1/955.0/957.1) — **keine Abweichung**
zwischen der Notiz vom 20.9. und dem heutigen Registerstand (Anzahl + SR-Nummern
geprüft, nicht nur angenommen).

## Mechanik-Hinweis (aus der Notiz, Abschnitt 2/5)

`check:verfall` (`scripts/verfall-pruefen.ts`) und `check:fedlex-versionen`
(`scripts/fedlex-versionen-pruefen.ts`) sind **wanduhr-abhängig** (`new Date()`)
und bewusst NICHT im PR-Gate von `ci.yml` — ein solches Tor hätte sonst am
Stichtag alle offenen PRs rot gefärbt. Die automatische Nachführung hängt
strukturell an `fedlex-frische.yml` (Cron Montag 04:43 UTC); die erste
automatische Rot-Meldung, die einen der 18 Erlasse als «überholt» erkennen
würde, kommt laut Notiz **frühestens Montag 5.10.2026, 04:43/07:17 UTC** —
NICHT am 1.10. selbst (kein Montag). Zum Abrufzeitpunkt der Notiz (20.9.2026)
war die Automatik zusätzlich durch einen defekten Organisations-Token blockiert
(`AUTOMERGE_TOKEN`, PAT ohne Zugriff nach dem Org-Umzug) — Standabhängig, hier
nicht neu geprüft.

## Verweis

Bau-/Beobachtungsschritt: [`plan/posten/2026-09-20-pflegetermin-1-10-2026.md`](../../plan/posten/2026-09-20-pflegetermin-1-10-2026.md).
