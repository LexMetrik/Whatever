# Fixkosten-Audit Konnektoren/Skills — Verifikations-Notiz (QS-TOK P4 · T10)

> **Heimat:** `FAHRPLAN-TOKEN-OEKONOMIE.md` §6 (T10). DoD = **Verifikations-Notiz**;
> die Deaktivierung selbst ist **Account-Ebene** und braucht ein **separates Go von David**
> (§8 Ziff. 4). Diese Notiz erfüllt die 10-Min-Machbarkeits-Verifikation, ohne etwas zu ändern.

## Befund (verifiziert 10.7.2026)

1. **Keine projektseitige MCP-Konfiguration vorhanden.** Es gibt **kein** `.mcp.json` /
   `.claude/mcp.json` im Repo. Die ~250 deferred Tool-NAMEN (Alpha Vantage, Gmail, Google
   Calendar/Drive, Microsoft 365, Moody's, Morningstar, MT Newswires, Wolfram, atlan,
   computer-use, claude-in-chrome, vercel-Plugin …) stammen **allesamt aus Davids
   claude.ai-Konto-Konnektoren**, nicht aus dem Projekt. Einzige projekt-referenzierte MCP-Zeile:
   `mcp__Claude_Preview__preview_screenshot` (eine Permission in `.claude/settings.json`, kein
   Server-Def).

2. **Schemas sind bereits deferred** (Tool-Search-Setup): geladen werden nur die **Namen**, die
   vollen Parameter-Schemas erst on-demand. Die reale Fixlast je Agent ist damit **~4–7k Tok**
   (primär **Fensterplatz**, der Präfix ist gecacht) — **nicht** die anekdotischen „−85 % /
   55–134k" aus dem Ausgangsbericht (K-Korrektur der Spec bestätigt).

3. **Kein projektseitiger Hebel zur selektiven Deaktivierung.** Weil die Konnektoren
   konto-/claude.ai-weit hängen (Davids Alltag über alle Projekte/Chats), lässt sich „für
   Bau-Profile deaktivieren" **nicht** aus dem Repo heraus tun, ohne Davids tägliche Nutzung
   anzufassen. Genau der von der Spec markierte Konflikt.

## Empfehlung

- **Keine Repo-Aktion.** Die Namensliste projektseitig „kleiner machen" ist hier **nicht machbar**
  (kein projektseitiger Konnektor, den man abschalten könnte).
- **Falls David die Fixlast senken will** (optional, sein Go, Konto-Ebene): pro-Projekt nur die
  im Bau tatsächlich gebrauchten Konnektoren aktiv lassen. **Nie abschalten:** `context7`
  (Framework-Doku live nachschlagen — die Begründung lautete hier bis 25.7.2026 «CLAUDE.md §16»;
  diese Regel ist seither **gestrichen und die Nummer gesperrt**, die Praxis selbst bleibt),
  `claude-in-chrome`/Playwright (Reader-Verifikation, T18), `vercel`-Deploy
  (§9). **Referenz-Plugins** (SEO/a11y/legal-builder-hub) nie löschen — sie sind Nachschlage-Referenz.
- Der grössere, projektseitig **erreichbare** Hebel liegt ohnehin nicht bei den Fixkosten, sondern
  bei den in P1–P4 gebauten Massnahmen (Doku-Diät, Slice, Sonde, Dispatch, Map, Log-Diät).

**Fazit:** T10-Machbarkeit = **negativ auf Projekt-Ebene** (Account-gebunden); dokumentiert,
nicht ausgeführt. Kein Namenslisten-Delta im Repo möglich.

## Verifikation 5.8.2026

Zweiter, unabhängiger Verifikationslauf (QS-TOK-Rest-Abschluss, Orchestrierungs-Session) —
bestätigt den Befund vom 10.7.2026 mit direkter Quellenprüfung statt Ableitung:

1. **Keine projektseitige MCP-Konfiguration.** `.mcp.json` existiert im Repo-Root nicht
   (`ls .mcp.json` → *No such file or directory*).
2. **Keine Deaktivierungs-Felder in den Projekt-Settings.** `.claude/settings.json` und
   `.claude/settings.local.json` enthalten ausschliesslich `permissions.allow` — kein Feld
   zur selektiven Konnektor-Deaktivierung.
3. **Amtliche Doku bestätigt: die Felder existieren nur für Projekt-MCP-Server.** Geprüft
   gegen `docs.anthropic.com/en/docs/claude-code/mcp` und
   `docs.anthropic.com/en/docs/claude-code/settings` (Stand 5.8.2026): `enabledMcpServers`/
   `disabledMcpServers` steuern ausschliesslich Server, die in `.mcp.json` deklariert sind.
   Für Account-Konnektoren (claude.ai-Ebene) gibt es dort kein projektseitiges Äquivalent.

**Verdikt unverändert:** selektive Deaktivierung bleibt Account-Ebene = David-Entscheid.
T10 ist damit repo-seitig mit diesem Negativ-Befund **abgeschlossen**, kein weiterer
Bau-Bedarf.
