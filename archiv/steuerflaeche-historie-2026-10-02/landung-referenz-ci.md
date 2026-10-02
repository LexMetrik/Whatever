# Steuerflächen-Diät 2.10.2026 — Belege aus `.claude/skills/landung/referenz-ci.md`

Verschoben 2026-10-02 (QS-DOKU-DIAET, Auftrag David «räum die plan-doku auf», Spec `.claude/notizen/2026-10-02-steuerflaeche-diaet-spec.md`). Quelle: `.claude/skills/landung/referenz-ci.md`.
Wortlaut der Passagen unverändert (Byte-Kopie der Spanne); am Ursprungsort bleiben Regel + Zeiger «Archiv §<Label>». Datierte Belege werden hier nie nachgeführt, nur ergänzt (Dispatch-§0 Ziff. 2b).

## §Landungs-Rolle

Stelle: «Anlass der Landungs-Rolle (Schritt 3.1)»

*(Anlass 3./4.8.2026: drei Parallel-Sessions, zwei beanspruchten dieselbe Rolle,
mehrere PRs wurden bei Grün extern gemergt, einer davon vor Abschluss des
laufenden §9-Bug-Checks — gutgegangen, aber nur zufällig.)*

## §Scharfer-Auto-Merge

Stelle: «Scharfer Auto-Merge bei BEHIND (Schritt 3.2)», Körper (überholt seit 19.9.2026)

**Scharfer Auto-Merge ist keine Landung:** bei `mergeStateStatus: BEHIND`
(Branch hinter main, Required «up to date») feuert er NIE von selbst —
nach jeder main-Landung die verbleibenden Auto-Merge-PRs per
`gh pr view <n> --json mergeStateStatus` prüfen und bei BEHIND
`gh pr update-branch` fahren. Realfall #445 (5.8.2026): 16 h scharf,
alle Checks grün, kein Merge — Ursache waren fünf zwischenzeitliche
main-Landungen.

## §cancelled-skipped/1

Stelle: «`cancelled`/`skipped` und die designte Ausnahme», Realfall-Klammer 1

 (Realfall 20.7.2026: 5 stumm
abgebrochene `turso-sync`-Läufe, der Suchindex veraltete unbemerkt.)

## §cancelled-skipped/2

Stelle: «`cancelled`/`skipped` und die designte Ausnahme», Realfall-Klammer 2

 (Realfall 4./5.8.2026: Wächter
meldete GRÜN, während Bau/Tore noch gar nicht liefen — nur der
Verifikations-Zwischenschritt vor dem Merge fing es ab.)

## §Vercel-Tageslimit-bis-16.8

Stelle: «Vercel-Tageslimit», Absätze «Die Wurzel ist seit #445…» und «Stand 16.8.2026»

Die Wurzel ist seit dem #445-Merge (5.8.2026, QS-CI-VERCEL) behoben — der
Ignored Build Step lässt App-fremde Diffs den Vercel-Build gar nicht erst
verbrauchen; ein übersprungener Build meldet den Check als `success` («Canceled
by Ignored Build Step») und ist mergefähig. Das frühere Admin-Bypass-Interim
(«lass vercel aus dem spiel», David 4.8.2026) ist damit GESTRICHEN: Reisst das
Limit trotzdem (App-Diff-Ketten), ist das kein Bypass-Fall mehr, sondern
Warten/Re-Trigger nach Reset — ein leerer Commit auf den Branch genügt als
Vercel-Re-Trigger (er erzeugt keinen Actions-Lauf, schiebt aber den Head;
Realfall 5.8.2026: #445 selbst so gelandet). Unverändert gilt: ein Vercel-Rot
mit echtem Build-Fehler bleibt Rot, und an landeintensiven Tagen frisst jedes
`update-branch` einen App-Deploy — Kette seriell und ohne überflüssige
Zwischen-Pushes fahren.

**Stand 16.8.2026:** Der Vercel-Kontext ist KEIN Required Check mehr
(David, Branch-Schutz-Edit 15.8. nach dem Tageslimit-Stau) und Feature-
Branches bauen keine Previews (vercel.json, #519). Die Klasse «PR wartet auf
Vercel» existiert damit nicht mehr; ein Admin-Bypass hat keinen Anlass. Ein
Vercel-Rot auf `main` (echter Build-Fehler) bleibt Rot — sichtbar über den
Prod-Deploy-Status, nicht über einen PR-Check.

## §Vercel-Tageslimit-17.8

Stelle: «Vercel-Tageslimit», Stand 17.8.2026, Anlass-Satz

Der Ignored Build Step
reichte nicht: Vercel legte trotzdem für JEDEN Push auf JEDEN Branch ein
Deployment an und zählte es ans Tageslimit, auch wenn es sofort «Canceled by
Ignored Build Step» hiess. Am 16.8. abends riss das die 100/Tag und blockierte
Prod 24 h (Vorfall #540).

## §Trailer-PR-Body

Stelle: «Warum der Trailer zusätzlich in den PR-Body gehört (Schritt 9)», gesamter Körper

**Denselben Trailer-Block zusätzlich als eigenen Absatz in den PR-BODY**
(unformatiert, nicht eingerückt, kein Code-Fence; BEIDE Zeilen im SELBEN
Absatz — getrennte Absätze buchten bis 15.8. still nichts, seither macht ein
halber Block den Buchungs-Lauf laut rot; der 🤖-Footer darf danach folgen):
mergt jemand per GitHub-Auto-Merge mit Standard-Squash-Text, geht der
Commit-Trailer verloren — der Workflow liest ihn dann ersatzweise aus dem
PR-Body (Lehre 14.8.2026, PR #491: Auto-Buchung blieb still, Hand-Buchung
nötig). Fällt beides aus: von Hand `plan:set <id> status=…` + committen (done ⇒
Block per Ziff. 6 in die Chronik). Realfall 5.8.2026: `QS-TOK`/
`QS-TOK-AUFRAEUMEN` blieben nach Session-Ende stundenlang `wip`, das Lagebild
zeigte falschen Bau — seither warnt `plan:next` bei wip ohne Bau-Spur, aber die
Warnung ist das Netz, nicht der Prozess.

## §Auslieferung-Anlass

Stelle: «§Auslieferung», Anlass-Satz

Anlass: Vercel legte bei JEDEM Push auf JEDEN Branch ein
Deployment an (auch das sofort «Canceled by Ignored Build Step»); am 16.8.2026
riss das die Free-Grenze von 100/Tag und blockierte Prod 24 h.

## §Realfall-Schritt7

Stelle: «Realfall 15.8.2026 zu Schritt 7 (Verwaltung bündeln)», Körper

~15 Verwaltungs-Pushes (Doku/Plan/Buchung/wip-Marker direkt auf main) rissen
das Vercel-Tageslimit, sechs fertige PRs standen stundenlang: jeder
main-Push kostete damals einen Deploy UND warf jeden offenen Auto-Merge-PR
auf BEHIND (= je ein weiterer Deploy pro Nachzug). Daraus die Regel
«Feature einzeln landen, Verwaltung bündeln» und der Hook-Block für direkte
main-Pushes; der Ausnahmefall «Hand-Buchung nach stiller Auto-Buchung»
gehört ebenfalls in den nächsten Sammel-Push, nicht sofort auf main.

## §Realfall-7b

Stelle: «Realfall 15./16.8.2026 zu Schritt 7b (Ketten-Wächter, F2h)», Körper

Der Landeketten-Wächter mergte Risikopfad-PRs nur bei `mergeStateStatus:
CLEAN`; nach Davids Branch-Schutz-Edit standen sie auf `UNSTABLE`
(nicht-required Vercel-Kontext rot, alle 11 Required grün) — 7 h kein Merge
(17:24→00:33), zwei weitere PRs `DIRTY` (Konflikt), ebenfalls stumm. Erst
Davids Nachfrage brachte es ans Licht.

## §Realfall-Nachkontrolle-1

Stelle: «Realfälle zur Nachkontrolle 1 (Deploy-Zuordnung)», Körper

Realfall 15./16.8.2026: 7 Merges #519–#530 waren auf main, aber nie live
(`git rev-parse --verify` schlug bei fehlendem Objekt fehl) — den Fall fängt
seither der Deploy-Job selbst (Live-Kennungs-Probe, 3 Versuche à 20 s),
zusätzlich der Wächter `pruefeBuildStand` im Prod-Smoke (#531). Historisch:
bis 17.8.2026 baute Vercel per Git-Integration; ein «Canceled by Ignored
Build Step» auf einem Code-Commit war dort ROT. Diese Deploy-Art gibt es
nicht mehr.

## §Merge-Queue-Anlass

Stelle: «§Merge-Queue», Absatz «Anlass»

**Anlass:** Umzug des Repos in die GitHub-Organisation `LexMetrik`
(`LexMetrik/Whatever`, Plan Free, public; der alte Pfad
`davidgraf95-sys/Whatever` leitet weiter, das Remote im gemeinsamen `.git`
ist umgestellt). Public ist Bedingung: privat ≈ 467 $/Monat CI
(`bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md`). Entscheid David
19.9.2026 (Chat, wörtlich): «ja mach so, alles durch die warteschlange» —
kein Admin-Bypass.

## §Merge-Queue-Durchlauf

Stelle: «§Merge-Queue», Absatz «Belegter Durchlauf #922/#917»

**Belegter Durchlauf #922/#917:** eingereiht 14:35Z/14:38Z, beide gelandet
15:05:00Z in EINEM Push-Ereignis (Kopf 9b125ce8e). `merge_group`-Lauf von
#917 = 35449369984: alle vier Required grün, inkl. «Perf-Budget» (läuft im
`merge_group`, auf `pull_request` designt geskippt); Deploy im `merge_group`
geskippt (richtig), ausgeliefert hat der Push-Lauf auf main 35450690297.
`mergeCommit.oid` == Queue-Commit == main-SHA. `--auto`: bei #917 wurde der
PR-Rerun 14:38Z grün ⇒ automatisch eingereiht, kein Nachzug, kein zweiter
PR-Lauf.

## §Merge-Queue-Stapeln

Stelle: «§Merge-Queue», Absatz «Spekulatives Stapeln (#921)»

**Spekulatives Stapeln (#921):** Eintrag 2 wird auf «main + Eintrag 1»
gebaut, Eintrag 3 auf «main + 1 + 2». #921 war für sich MERGEABLE/CLEAN und
stand in der Queue auf UNMERGEABLE, weil ein Vordermann dieselbe Datei
änderte (Steuer-Doku ROADMAP.md, Gegenprüfungs-Register — der union-Treiber
gilt bei GitHub nicht).

## §Merge-Queue-Offen

Stelle: «§Merge-Queue», Liste «Offen, Stand 19.9.2026»

**Offen, Stand 19.9.2026:**
- Risikopfad-PRs scheitern im `merge_group` an «Merge-Schutz»/«Tore» («KEIN
  'Gegenpruefung:'-Verdikt in den Commits», Lauf 35449385978, #921).
  Wurzel-Fix baut die Parallel-Session QS-MONITOR-ROT in
  `scripts/check-merge-schutz.ts` (Zweig
  `fix/qs-monitor-rot-merge-schutz-queue`) — hier NICHT als gelöst führen,
  bis er auf main ist.
- `plan-buchung.yml` liest zuerst `%(trailers)` am Head-Commit (in der Queue
  leer), dann den PR-Body-Fallback (Subject-Endung `(#N)` → `mergeCommit.oid
  == GITHUB_SHA` → Trailer per API). Lesen trägt voraussichtlich; UNGEMESSEN
  ist, ob der Buchungs-PUSH auf main vom Ruleset noch angenommen wird. Aus
  dem Code gefolgert, nicht gemessen: der Workflow liest `git log -1`, bei
  einer Sammel-Landung (mehrere PRs, ein Push-Ereignis) also nur den
  Kopf-Commit. Darum Status im PR-Diff mitführen (Skill Ziff. 9); ob der
  Workflow zurückgebaut wird, ist offener ROADMAP-Punkt. **Abgebaut
  20.9.2026** (QS-CI-MINUTEN): `plan-buchung.yml` und `scripts/plan/
  buchung.ts` sind gelöscht — Messung 19./20.9.2026 zeigte 12 Läufe, 0
  Buchungs-Commits auf main seit der Merge-Queue.
- Kosten: der `diff`-Job setzt im `merge_group` pauschal `art=code` — jeder
  Eintrag fährt das volle Programm, auch Doku-PRs (~20+ min). Umbau auf echte
  Diff-Klassierung im `merge_group` und der «Push-Diät» auf
  «Required-Kontexte stehen am gepushten SHA auf success» läuft parallel
  (nicht gelandet).
- `scripts/landung/landung-kette.sh` ist auf Queue-Betrieb umgestellt
  (Zweig `feat/qs-org-umzug`), gegen die echte Queue UNGETESTET.
- Zwei Queue-Landungen kurz nacheinander (zwei Push-Läufe auf main):
  UNGEMESSEN. `ci.yml` belegt nur die Absicht — `cancel-in-progress` ist auf
  main aus, der Deploy-Job läuft seriell in der Gruppe `prod-deploy`. F13
  (#629) bleibt ungeklärt.

## §Merge-Queue-Rueckbau

Stelle: «§Merge-Queue», Absatz «Rückbau (§17-Gegengewicht), alle 19.9.2026»

**Rückbau (§17-Gegengewicht), alle 19.9.2026:** `autozug`-Job in
`waechter.yml` (BEHIND-Nachzug, QS-MERGE-AUTOZUG; Zweig `feat/qs-org-umzug`) ·
`gh pr update-branch` als Pflicht nach jeder Landung (Ausnahme-Verbot auf
Jules-PRs bleibt, `referenz-jules.md`) · Doku-Sammel-Push per
`LEXMETRIK_MAIN_PUSH=1 git push origin main` · Auflage «`strict: true` darf
nicht fallen» (falsch geworden: `strict` ist aus, geprüft wird der landende
Commit im `merge_group`) · STRUKTUR-Rotation am SessionStart
(`LEXMETRIK_NO_ROTATE=1` in `.claude/settings.json`; fährt neu im Doku-PR der
Session) · Nachkontrolle 0 alter Fassung («kein main-Push vor grünem
Deploy-Job») · Stillstands-Schwelle 25/30 min → 60 min (Check-Timeout; der
belegte Durchlauf dauerte 27–30 min, die alte Schwelle hätte jedes Mal
gefeuert).

## §Session-Ende-Beleg

Stelle: «Session-Ende — Beleg 8.9.2026 und Lehre 18.9.2026», Beleg-Satz

Beleg: Aufräumen 8.9.2026 fand 22 Remote-Branches, 3 Worktrees, 5 Dependabot-PRs
(seit 14.8.), einen fertigen, nie eröffneten Risikopfad-Branch (9 Commits) und
einen Autopilot-Entwurf ohne Entscheid — niemand war zuständig. Regel:
