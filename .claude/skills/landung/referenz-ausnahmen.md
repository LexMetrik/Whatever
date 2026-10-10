# Landung — Referenz: Ausnahmefall und Ausreden

## Einzige Ausnahme — manueller Deploy

Nur wenn David ihn AUSDRÜCKLICH anordnet ODER der Deploy-Job für den
Merge-Commit nachweislich nicht läuft. Dann: `git fetch`, Stand == `origin/main`
belegen, aus sauberem Worktree deployen (`git worktree add
/tmp/lexmetrik-deploy origin/main` · `cp -R .vercel /tmp/lexmetrik-deploy/` ·
`npm ci && npx vercel --prod` · Worktree entfernen), nie aus dem
Arbeitsverzeichnis.

**Buchstabe = Geist:** jeder zweite Prod-Pfad, der «technisch kein
`vercel --prod`» ist (`vercel deploy --prebuilt`, `vercel promote`,
Dashboard-Promote oder -Redeploy, MCP-`deploy_to_vercel`), ist derselbe
verbotene racende Doppel-Deploy.

## Ausreden

| Ausrede | Realität |
|---|---|
| «Eine ältere §9-Fassung erlaubt `npx vercel --prod`.» | Altstand; Merge = Deploy ist der einzige Pfad. |
| «Gegenprüfung lief, Trailer gesetzt — `--auto` kann scharf.» | Auf Risiko-Pfaden ist `--auto` gesperrt; Trailer ohne Registerzuwachs ist Behauptung. |
| «Ein zusätzlicher Deploy schadet nicht.» | Doppel-Deploy = Race; der langsamere Build überschreibt den richtigen. |
| «CI grün ersetzt Schritte 0–2.» | Voraussetzung, nicht Ersatz. |
| «Nur ein Flake rot — mergen und nachbessern.» | Rot = Stopp. |
