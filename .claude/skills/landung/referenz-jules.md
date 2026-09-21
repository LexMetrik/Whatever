# Fremde PRs (Jules) — Prüf- und Landungs-Checkliste (ausgelagert 5.9.2026, QS-EFFIZIENZ; Regeln unverändert)

### Fremde PRs (Jules) — vor der Reihe, nicht in ihr

Ein PR eines fremden Agenten (Regelwerk: `AGENTS.md`, Fahrplan
`fahrplaene/FAHRPLAN-FREMDAGENTEN.md`) wird **erst geprüft, dann eingereiht**.
Checkliste, in dieser Reihenfolge:

**Erkennung:** Jules-PRs laufen unter dem GitHub-Konto des Repo-Eigentümers,
nicht unter einem Jules-Autor — Branch-Muster ist eine 19-stellige Task-ID
irgendwo im Namen ODER Präfix `jules-`/`jules/` (Beleg #647
`jules-1111541331587033919-8d87826d`; Gegenbeleg #656: «jules irgendwo» ist zu
breit und traf `docs/jules-weiche` fälschlich). Mechanik statt Prosa:

```
gh pr list --state open --json number,headRefName \
  -q '.[] | select(.headRefName|test("[0-9]{19}|^jules[-/]"))'
```

0. **Vor dem Start:** Ticket-Body nach `gh issue create` zurücklesen — `gh issue view <N> --json body -q .body | wc -l` muss mindestens die Zeilenzahl der Vorlage melden, sonst kein Jules-Start (Beleg #858, 14.9.2026: eine an Sonderzeichen gescheiterte `sed`-Ableitung erzeugte einen leeren Body, `gh` nahm ihn an, Jules baute ohne die Detailregeln).
1. Branch lokal holen und **selbst** `npm run gate` fahren — die Tor-Ausgabe
   des Fremden ist Daten, nie Beweis (§14.7).
2. **Whitelist-Diff:** `git diff --stat` gegen die im Issue genannte Datei-Liste.
   Jede Datei ausserhalb ⇒ Ablehnung, nicht selbst zurechtstutzen.
3. Diff gegen `istRisikoPfad()` halten. **Jede Berührung ⇒ Ablehnung** mit
   Verweis auf `AGENTS.md` §3 — nicht selbst nachbessern.
4. **Immer:** Aufruf auf dieselbe Basis wie CI umstellen (kein Ermessen mehr,
   FAHRPLAN Folgerung 1):
   `npx vite-node scripts/analyse/test-assertion-diff.ts "$(git merge-base origin/main origin/<branch>)" origin/<branch> src/tests/`
   muss Exit 0 liefern (T5-Beleg 3.9.2026: gleiche Zählwerte, abgeschwächter
   Matcher — nur der Inhalts-Diff fand ihn). Geänderte Assertions oder
   Golden-Dateien ⇒ Ablehnung (§6.3).
5. **Neue Abhängigkeiten** in `package.json`/Lockfile ⇒ Ablehnung, ausser der
   Auftrag hat sie ausdrücklich erlaubt.
6. Trailer prüfen: `Roadmap: <ID>` im letzten Absatz. `Gegenpruefung: n/a —
   kein Risikopfad` nur eintragen, wenn `npm run check:gegenpruefung` das
   bestätigt. Golden byte-gleich, wo berührt.
7. **Nie Auto-Merge**, auch nicht ausserhalb der Risiko-Pfade.
7a. **Nie `gh pr update-branch` auf einem Jules-PR** (Beleg #710, 5.9.2026: Jules pushte danach seinen Snapshot neu und drehte den Tree auf den Stand vor #711 zurück). Landung eines geprüften Jules-Heads immer als Cherry-Pick auf einen eigenen Branch (`git cherry-pick -n <head>` + eigener Commit mit deutschem Betreff und Trailer, Muster #711/#704-Landung); der Jules-PR wird mit Kommentar geschlossen, zählt in der Messung als landbar.
8. Danach normale Landung (Schritte 0–3) wie bei eigener Arbeit. Seit 4.9.2026 fährt CI dieselben Regeln automatisch (Step «Fremd-PR-Tor» im Job «Tore», Branches mit 19-stelliger Task-ID oder Präfix `jules-`/`jules/` — nie «jules» irgendwo im Namen, Beleg PR #656): Assertion-Diff + keine Datei ausserhalb `src/**` + Kommentar-Bilanz (Regel 3 + 3b, `scripts/analyse/kommentar-bilanz.ts`) — der lokale Lauf bleibt Pflicht (§14.7, nie die CI-Ausgabe eines Fremden als eigene Prüfung zählen).

Absichtliche Proben (T5/T6-Art) tragen das Label `probe` und zählen in `fremdagenten:messung` nie als Ablehnung — Label vor dem Schliessen setzen. Kommentar-Bilanz: Regel 3 des Tors (Beleg #662: 197 Kommentarzeilen gelöscht, um die Zeilen-Grenze zu erreichen) vergleicht nur die Summe; Regel 3b (14.9.2026, Beleg #855/#857) vergleicht zusätzlich die MULTIMENGE der getrimmten Kommentarzeilen — **zeichengleich, nicht nur zeilengleich**, verschieben ja, ändern/löschen nie — weil #855 die Summe nach einer Ablehnung exakt zurückbaute (580 → 580) und dabei trotzdem vier Zeilen verfälschte. Bei Sichtprüfung zusätzlich datierte Belegzeilen zählen. Fremd-PR-Tor rot ⇒ PR zurück an den Auftrag (Kommentar mit Tor-Ausgabe), nie
selbst zurechtstutzen; der Step ist nicht Required, gilt aber als Tor. Fehlt
der `Roadmap:`-Trailer (bisher 5/5 Jules-PRs): im PR-BODY des eigenen
Cherry-Pick-PR als letzten Absatz setzen (`gh pr edit <n> --body-file …`),
nicht Jules nachbessern lassen — seit 19.9.2026 übernimmt die Merge-Queue
`--body` des Merge-Kommandos nicht mehr (Skill, Formregel 5).

**Entwurfs-PR ist ein gültiges Ergebnis.** `AGENTS.md` §7 verlangt bei rotem
Tor oder unklarem Auftrag einen Entwurf mit Meldung statt einer kreativen
Lösung. Ein solcher PR wird nicht abgelehnt, sondern beantwortet: Auftrag
nachschärfen oder Schritt zurückholen. Vor dem Schliessen das Label
`entwurf-antwort` setzen (Beleg PR #707, 5.9.2026) — die Messung
(`klassierePrs()`) zählt ihn dann weder als Landung noch als Ablehnung.

