# Env-Var-Inventar — Vercel-Projekt `lexmetrik`

> FAHRPLAN-BASIS-AUSBAU §A5 (B-11). Damit ein Rollback/Neuaufbau nicht an einer
> vergessenen Env-Var scheitert: die vollständige Liste dessen, was Prod zur
> Laufzeit erwartet. **Werte gehören nie ins Repo** — nur die Namen und wozu.

## Laufzeit (Vercel → Project → Settings → Environment Variables)

| Name | Nötig für | Fehlt sie → | Gate |
|---|---|---|---|
| `TURSO_DATABASE_URL` | Edge-Suche `api/suche.ts` (HOT-FTS über Turso-HTTP) | ehrlicher **503**, statischer Client-Suchindex bleibt Fallback (§8) — nichts vorgetäuscht | David-Handschritt **G5** (QS-DATA) |
| `TURSO_AUTH_TOKEN`  | dito (Bearer für den Turso-`/v2/pipeline`-Endpunkt) | dito | David-Handschritt **G5** |

**Turso-Kontingent (Gratisplan, Stand 15.9.2026).** Der Plan deckelt die
geschriebenen Zeilen pro Monat; **Lesen ist nie gedeckelt**. Ist der Deckel
erreicht, antwortet Turso auf jedes Schreib-Statement mit HTTP 200 und einem
Pipeline-Fehler «Operation was blocked: SQL write operations are forbidden»
(kein HTTP-Status — belegt durch die Sonde zum Lauf 34948342923, 15.9.2026).
Praktisch heisst «gesperrt» deshalb: **die Suche läuft weiter, sie wird nur
nicht mehr frisch.** Der Sync erkennt diesen Fall, meldet ihn als `::error::`
mit dem Stand, auf dem die Replika stehenbleibt, und endet mit **Exit 3**
(Datenfehler bleiben Exit 1). Zurückgesetzt wird das Kontingent am 1. des
Monats. Zählweise und Messung: `bibliothek/betrieb/turso-schreibkontingent-2026-09-15.md`.
Das Schreib-Token braucht darüber hinaus die CI (`.github/workflows/turso-sync.yml`,
Repo-Secret `TURSO_AUTH_TOKEN`); fehlt es dort, wird der Tageslauf **rot** — er
degradiert nicht still (§8).

Das sind — Stand B-11 — die **einzigen** Laufzeit-Variablen. Der Client ist eine
vollständig statische SPA ohne Backend-Secrets; alle Rechen-/Normdaten sind
Build-Zeit-Artefakte (`public/*`). Bricht `api/suche` ohne diese Vars, ist das
**by design** ein ehrlicher 503, kein Ausfall (FAHRPLAN-DATENHALTUNG §5 E2).

## Build/Deploy

- **Deploy** = Git-Push auf `main` (Vercel-Git-Integration, kein CI-Deploy-Gate).
- **Build-Command / Output**: Projekt-Default (Vite-Build + `scripts/prerender.ts`);
  keine Build-Env-Secrets. Die 7,5-GB-Massendaten laufen bewusst nie im Vercel-Build.

## GitHub Actions (CI + Monitore)

Laufen **kontolos** mit dem Repo (`github.token` genügt für Issue-Schreiben):
`ci.yml`, `normen-monitor.yml`, `prod-smoke.yml`. Die eine Ausnahme ist
`turso-sync.yml`: er braucht das Repo-Secret **`TURSO_AUTH_TOKEN`** (Schreib-Token,
David-Rahmen-Gate 16.7.2026 freigegeben) und wird **rot**, wenn es fehlt — nur so
kann ein verfallenes Secret nicht als «alles grün» durchgehen (§8). *(Bis 15.9.2026
stand hier «keine zusätzlichen Repo-Secrets»; das war schon seit dem 16.7.2026
nicht mehr richtig — nachgetragen, nicht umgeschrieben.)* Kämen später weitere
dazu (z. B. externe-Sonden-Token), werden sie hier eingetragen.

## Zugänge (Werte NICHT hier — Passwort-Nachlass)

| Was | Wo |
|---|---|
| Vercel-Konto / CLI-Token | David; `~/Library/Application Support/com.vercel.cli/auth.json` |
| GitHub-Konto | David |
| Turso-Datenbank | David (Konsole app.turso.tech) |

Notfall-Hinterlegung an eine Zweitperson/Passwort-Nachlass bleibt offener Punkt
(BETRIEB.md §Hinterlegung).
