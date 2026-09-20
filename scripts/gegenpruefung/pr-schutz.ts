// scripts/gegenpruefung/pr-schutz.ts — Merge-Schutz simuliert die Queue-
// Squash-Nachricht aus PR-TITEL+PR-BODY (§17, QS-CI-MINUTEN, Befund Session
// Gliederung 19./20.9.2026): alle 3 roten `merge_group`-Läufe seit Einführung
// der Merge-Queue (35449385978, 35451221267, 35458509735; PRs #921, #923)
// fielen an derselben Lücke — `check-merge-schutz.ts` zählt die ZWEIG-Commits
// (`git log`), die Queue baut ihren einen Commit aber aus PR-Titel+PR-Body
// (Repo-Einstellung squash = PR_TITLE + PR_BODY, s. Kopf squash-trailer.ts).
// Ein im PR-Body fehlendes oder verkürztes Verdikt war damit lokal/im
// Zweig-Commit grün und flog erst nach ~25 min aus der Queue.
//
// Diese Datei ist eine ZUSÄTZLICHE Bedingung, keine Ersetzung: der bestehende
// Zweig-Commit- + Register-Pfad in check-merge-schutz.ts bleibt unverändert
// bestehen (§6.7 — kein Aufweichen). pruefePrSchutz() liefert nur dann eine
// ROT-Meldung, wenn ein PR gefunden wurde UND dessen simulierter Queue-Squash
// kein formal taugliches Verdikt trägt; ohne `gh`/PR/Netz liefert sie `null`
// (sauberer Überspring, NIE rot deswegen — der bestehende Pfad greift dann
// unverändert weiter).
//
// Reine Textlogik (baueQueueSquash/pruefePrKoerper) + injizierbare gh-Holung
// (Parameter `holen` in pruefePrSchutz) — kein echtes Netz im Test.
import { execFileSync } from 'node:child_process';
import { leseGegenpruefungAusSquash, pruefeVerdiktForm } from './squash-trailer';

export interface PrKoerper { nummer: number; titel: string; body: string }

/**
 * Queue-Squash-Nachricht: PR-Titel, Leerzeile, PR-Body — dieselbe Form, die
 * GitHub beim Squash-Merge erzeugt (empirisch bestätigt: PR #921 landete
 * genau so auf main, inkl. 72-Zeichen-Umbruch — den entumbricht() in
 * squash-trailer.ts bereits toleriert, hier also unnötig zu simulieren).
 */
export function baueQueueSquash(titel: string, body: string): string {
  const t = (titel ?? '').trim();
  const b = (body ?? '').trim();
  return b ? `${t}\n\n${b}` : t;
}

export type PrKoerperUrteil =
  | { art: 'gueltig' }
  | { art: 'kein-verdikt' }
  | { art: 'mangel'; wert: string; grund: string };

/**
 * Prüft Titel+Body so, wie sie in der Queue gesquasht würden — über dieselbe
 * Lese-/Form-Logik wie der Zweig-Commit-Pfad (leseGegenpruefungAusSquash +
 * pruefeVerdiktForm aus squash-trailer.ts), keine eigene Zweitlogik.
 */
export function pruefePrKoerper(titel: string, body: string): PrKoerperUrteil {
  const treffer = leseGegenpruefungAusSquash(baueQueueSquash(titel, body));
  const maengel: { wert: string; grund: string }[] = [];
  for (const t of treffer) {
    const p = pruefeVerdiktForm(t);
    if (p.art === 'gueltig') return { art: 'gueltig' };
    if (p.art === 'mangel') maengel.push({ wert: t, grund: p.grund });
  }
  if (maengel.length > 0) return { art: 'mangel', ...maengel[0] };
  return { art: 'kein-verdikt' };
}

/**
 * Holt Titel+Body des offenen PR — `nr` explizit (`--pr <n>`) oder aus dem
 * aktuellen Branch (`gh pr view` ohne Nummer). Liefert `null` bei JEDEM
 * Fehler (kein `gh`-Binary, kein PR für den Branch, kein Netz, kein Token —
 * z. B. im `merge_group`-CI-Kontext ohne GH_TOKEN-Env für diesen Schritt):
 * nie werfen, der Aufrufer behandelt das als sauberen Überspring.
 */
export function holePrKoerperEcht(nr?: string): PrKoerper | null {
  try {
    const args = ['pr', 'view', ...(nr ? [nr] : []), '--json', 'number,title,body'];
    const out = execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).toString('utf8');
    const j = JSON.parse(out);
    if (!j || typeof j.title !== 'string') return null;
    return { nummer: j.number, titel: j.title, body: typeof j.body === 'string' ? j.body : '' };
  } catch {
    return null;
  }
}

/**
 * Vollständiger PR-Körper-Schutz für check-merge-schutz.ts: holt den PR
 * (Standard: holePrKoerperEcht, für Tests injizierbar über `holen`),
 * simuliert die Queue-Squash-Nachricht und liefert bei ungültigem Verdikt
 * die fertige ROT-Meldung — sonst `null` (kein PR gefunden, ODER PR gefunden
 * und Verdikt gültig: in beiden Fällen prüft der bestehende Pfad danach
 * unverändert weiter, diese Funktion ersetzt ihn nie).
 */
export function pruefePrSchutz(
  argv: string[],
  risikoAnzahl: number,
  bereich: string,
  holen: (nr?: string) => PrKoerper | null = holePrKoerperEcht,
): string | null {
  const i = argv.indexOf('--pr');
  const pr = holen(i >= 0 ? argv[i + 1] : undefined);
  if (!pr) return null;
  const urteil = pruefePrKoerper(pr.titel, pr.body);
  if (urteil.art === 'gueltig') return null;
  const grund = urteil.art === 'mangel'
    ? `formal untauglich (${urteil.grund}): «${urteil.wert.slice(0, 90)}»`
    : `kein 'Gegenpruefung:'-Verdikt im PR-Body`;
  return `check:merge-schutz ROT — PR #${pr.nummer}: Queue-Squash (Titel+Body) ${grund}.\n\n` +
    `  ${risikoAnzahl} Risiko-Datei(en) im committeten Bereich ${bereich}. Die Queue baut\n` +
    `  ihren Commit aus PR-Titel+PR-Body, nicht aus den Zweig-Commits — ein hier\n` +
    `  gültiger Zweig-Trailer reicht NICHT, wenn er im PR-Body fehlt oder verkürzt\n` +
    `  ist (Befund PRs #921/#923, Läufe 35449385978/35451221267/35458509735, 20.9.2026).\n\n` +
    `  Weg: gh pr edit ${pr.nummer} --body-file <datei mit vollem Verdikt als letztem Absatz>`;
}
