# BETRIEB.md — Runbook LexMetrik

**Zweck (STRATEGIE-PLATTFORM.md F1.3, Bus-Faktor 1):** Alles, was eine
übernehmende Person zum Weiterbetrieb braucht und was NICHT aus dem Code
hervorgeht. Fachliche Arbeitsweise: `CLAUDE.md` · Stand: `STRUKTUR.md` ·
Vorgehen: `ROADMAP.md` (früher HANDLUNGSPLAN.md) + `STRATEGIE-PLATTFORM.md`.

## Konten & Infrastruktur

| Was | Wo | Zugang |
|---|---|---|
| Produktion | https://lexmetrik.vercel.app (Vercel-Projekt `lexmetrik`; `legal-calc.vercel.app` = 308-Redirect) | Vercel-Konto David; CLI-Token in `~/Library/Application Support/com.vercel.cli/auth.json` |
| Repository | github.com/LexMetrik/Whatever (GitHub-Organisation **LexMetrik**, öffentlich, Plan Free; der alte Pfad `davidgraf95-sys/Whatever` leitet weiter) — **muss öffentlich bleiben**: privat kosten die CI-Minuten rund 467 $/Monat (mit vollem Sparplan noch ~273 $), öffentliche Repos haben sie gratis (`bibliothek/betrieb/ci-minuten-sparplan-2026-09-08.md`, 8.9.2026) | GitHub-Konto David (Org-Inhaber) |
| Domain | **lexmetrik.ch — NOCH NICHT registriert** (Entscheid offen, STRATEGIE F1.1) | — |
| CI | GitHub Actions (`.github/workflows/ci.yml` je Push · `normen-monitor.yml` wöchentlich Mo 05:17 UTC) | läuft kontolos mit dem Repo |
| Zahlung/Backend | existiert nicht (bewusst — vollständig clientseitige SPA) | — |

**Hinterlegung für den Notfall:** Zugänge (GitHub, Vercel, später Registrar)
gehören zusätzlich an eine Zweitperson/Passwort-Nachlass — Stand 7.6.2026
NICHT erledigt, offener Punkt.

## Deploy

1. Tore lokal: `npx tsc -b` · `npm test` · `npm run lint` (volle Ausgabe,
   nie `tail`!) · `npm run build` · `npm run check`.
2. §9: Bug-Check (unabhängige Review-Agents) — die gesamte §9-Sorgfalt
   **vor** dem Merge.
3. Weg 1 (David 3.7.2026): Der **Merge nach `main` IST der Deploy** — Vercel
   liefert `main` automatisch auf Prod aus. Push/PR/Auto-Merge sind stehend
   freigegeben (David 2.7.2026), kein separater `vercel --prod`-Handschritt.
   Danach Live-Verifikation (Asset-Hash der ausgelieferten index.html gegen
   `dist/`). Sonderfall ungemergter Stand: `npx vercel --prod --archive=tgz`.

## Periodische Pflege (maschinell überwacht durch `npm run check:verfall`)

| Rhythmus | Aufgabe | Werkzeug |
|---|---|---|
| alle 6 h (automatisch) | Prod-Smoke: Kernrouten 200+Inhalt, Edge-Suche JSON-503/200, Sitemap, Assets, CSP | GitHub Action `prod-smoke.yml` (`npm run smoke:prod` lokal); rot → **Rollback**: `docs/betrieb/rollback-runbook.md` |
| wöchentlich (automatisch) | Normen-Monitor: Caches + Zitate + neue Konsolidierungen | GitHub Action `normen-monitor.yml`; rot → §7-Verifikation fällig |
| monatlich | LIK-Reihe nach BFS-Publikation | `scripts/lik-reihe-generieren.py` (Anleitung im Skript-Kopf) |
| quartalsweise | Hypothekarischer Referenzzins | referenzzinssatz.admin.ch → `mietvertrag.ts` (`MV_PARAMETER`) |
| jährlich + terminiert | alles Weitere | SSoT: `bibliothek/register/parameter-verfall.md` |

## Regenerier-Anleitungen (reproduzierbar)

- **Fedlex-Caches (nach /tmp):** `npm run check:caches` — Pins (ELI +
  Konsolidierung) stehen IN `scripts/fedlex-cache.sh`; Stände dokumentiert in
  `bibliothek/register/quellen-register.md`. Neu pinnen = fachliche Änderung
  (§7: Anker + tragende Wortlaute neu verifizieren, Register nachführen).
- **Norm-Zitate:** `npm run check:zitate` (braucht die Caches).
- **Neuere Konsolidierungen erkennen:** `npm run check:fedlex-versionen`
  (SPARQL gegen fedlex.data.admin.ch).
- **PLZ→Amt-Daten:** `npx vite-node scripts/plz-generieren.ts`
  (amtliches swisstopo/BFS-Register, Quellen im Skript).
- **BGE-Register:** `npx vite-node scripts/bge-register-generieren.ts`
  (bei neuen Rechtsprechungs-Zitaten mitlaufen lassen).
- **Golden-Protokoll (Refactorings, §6):** `npm run golden` vorher,
  `npm run golden:vergleich` nachher — Stand liegt in `/tmp/lexmetrik-golden.json`
  (lokal, bewusst nicht committet).
- **PDF-Sichtprüfung:** `npx vite-node .scratch/pdf-beispiele.ts` + qlmanage.

## Abnahme-Status (das Nadelöhr)

`verified: true` / Status «geprüft» setzt ein Abnahme-Protokoll in
`abnahme/` voraus (Schema dort; maschinell erzwungen durch
`src/tests/abnahmeGate.test.ts`). Abnahmeberechtigt: David (fachkundige
Person) — Erweiterung des Kreises ist §14-Entwurf in STRATEGIE F5.

## Notfall

- **Rückweg für kaputte Prod-Stände:** `docs/betrieb/rollback-runbook.md`
  (`vercel rollback` / Dashboard-Promote / git-revert). Laufzeit-Env-Vars:
  `docs/betrieb/env-inventar.md`. Externe Uptime-Sonde (optional G6):
  `docs/betrieb/externe-sonde.md`.
- **App offline nehmen:** Vercel-Dashboard → Projekt `lexmetrik` →
  Deployment löschen/überschreiben, oder `npx vercel rollback`.
- **Fachlicher Fehler in einer «geprüft»-Engine:** Status sofort zurück auf
  `entwurf` (startseiteConfig) + Protokoll-Vermerk + Deploy — kein stiller
  Weiterbetrieb (§8).
- **Fedlex-Filestore-Formatwechsel** (Anker brechen plötzlich):
  `norm-zitate-pruefen` schlägt aus; Anker-Abstraktion liegt zentral in
  `src/lib/fedlex.ts` — dort reparieren, nirgends verstreut.
