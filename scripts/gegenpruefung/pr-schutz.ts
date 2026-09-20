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
 * Löst `kopf` (z. B. 'HEAD', ein Kurz-SHA, ein Branchname — alles, was
 * `git rev-parse` versteht) zum vollen 40-Zeichen-SHA auf. Injizierbar über
 * `ausfuehren` (Default = echter `git rev-parse --verify <kopf>^{commit}`),
 * damit ein Test ohne echtes Repo eine feste Antwort vorgeben kann. Liefert
 * `null` bei JEDEM Fehler (ungültige Referenz, kein Repo) — der Aufrufer
 * behandelt das als sauberen Überspring, NIE als Rot (N2-Fix, Nach-Verdikt
 * 20.9.2026: `MERGE_SCHUTZ_KOPF=HEAD` oder ein anderer gültiger Nicht-Hex-Rev
 * traf per `startsWith` nie einen `headRefOid` und wurde still übersprungen —
 * `^{commit}` verlangt zusätzlich, dass die Referenz auf einen Commit zeigt,
 * nicht bloss irgendein Objekt).
 */
export function loeseKopfAufZuSha(
  kopf: string,
  ausfuehren: (kopf: string) => string = (k) =>
    execFileSync('git', ['rev-parse', '--verify', `${k}^{commit}`], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 8000,
    }).toString('utf8'),
): string | null {
  try {
    const sha = ausfuehren(kopf).trim();
    return sha || null;
  } catch {
    return null;
  }
}

/**
 * A1-Nachzug (Gegenprüfung 20.9.2026, «NICHT BESTANDEN»): holt den offenen PR
 * über seinen HEAD-SHA (`MERGE_SCHUTZ_KOPF`, vom Hook gesetzt), NICHT über den
 * aktuellen Branch-Checkout. Grund: der Merge-Hook läuft im HAUPT-Checkout auf
 * `main` (`cwd=CLAUDE_PROJECT_DIR`, `gh pr merge <n>` ohne Zweig-Wechsel) —
 * `gh pr view` ohne Nummer findet dort KEINEN PR (kein PR für `main`), der
 * PR-Körper-Schutz wurde also genau dort still übersprungen, wo er gebraucht
 * wird. `gh pr list` + Treffer auf `headRefOid` funktioniert unabhängig vom
 * lokalen Checkout. Liefert `null` bei JEDEM Fehler UND bei keinem Treffer
 * — nie werfen, der Aufrufer fällt dann NIE auf den Branch-Modus zurück (A2:
 * das läse sonst den PR eines fremden Branches).
 *
 * N2-Fix (Nach-Verdikt 20.9.2026): vorher verglich diese Funktion `kopf` per
 * `startsWith` DIREKT gegen `headRefOid` — `MERGE_SCHUTZ_KOPF=HEAD` (oder ein
 * anderer gültiger Nicht-Hex-Rev) traf so NIE, egal welcher PR gemeint war,
 * und wurde still übersprungen. Jetzt wird `kopf` zuerst über `aufloesen`
 * (Default `loeseKopfAufZuSha`, injizierbar für Tests) zum vollen SHA
 * aufgelöst und dann per GLEICHHEIT (nicht mehr Präfix) mit `headRefOid`
 * verglichen — ein Kurz-SHA trifft weiterhin, weil `git rev-parse` ihn selbst
 * zum vollen SHA auflöst.
 */
export function holePrKoerperFuerKopf(
  kopf: string,
  aufloesen: (kopf: string) => string | null = loeseKopfAufZuSha,
): PrKoerper | null {
  try {
    const vollerSha = aufloesen(kopf);
    if (!vollerSha) return null; // unauflösbar ⇒ sauberer Überspring, kein gh-Aufruf nötig
    // N3 (Nach-Verdikt 20.9.2026): 200 → 500 — bei mehreren offenen PRs mit
    // identischem Head gewinnt weiterhin der erste Treffer der Liste; > 500
    // offene PRs (bislang nie beobachtet) fallen aus der Liste und liefern
    // denselben sauberen Überspring wie ein fehlender Treffer, NIE ein Rot.
    const args = ['pr', 'list', '--state', 'open', '--json', 'number,title,body,headRefOid', '--limit', '500'];
    const out = execFileSync('gh', args, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).toString('utf8');
    const liste = JSON.parse(out);
    if (!Array.isArray(liste)) return null;
    const s = vollerSha.toLowerCase();
    const treffer = liste.find(
      (e) => e && typeof e.headRefOid === 'string' && e.headRefOid.toLowerCase() === s,
    );
    if (!treffer || typeof treffer.title !== 'string') return null;
    return { nummer: treffer.number, titel: treffer.title, body: typeof treffer.body === 'string' ? treffer.body : '' };
  } catch {
    return null;
  }
}

/**
 * Vollständiger PR-Körper-Schutz für check-merge-schutz.ts: holt den PR und
 * simuliert die Queue-Squash-Nachricht. Drei Modi, in dieser Reihenfolge
 * (A1/A2-Nachzug 20.9.2026):
 *   1. `--pr <n>` explizit in argv → `holen(n)` (unverändert).
 *   2. `MERGE_SCHUTZ_KOPF` gesetzt (Hook-Realfall) → `holenFuerKopf(kopf)`.
 *      Kein Treffer ⇒ sauberer Überspring, NIE Fallback auf Modus 3 (A2: der
 *      läse sonst den PR eines fremden Branches — Diff-Bereich und gelesener
 *      Body müssen zum selben PR gehören).
 *   3. Weder noch → `holen()` ohne Nummer (Branch-Modus, unverändert: lokale
 *      interaktive Session auf ihrem eigenen Feature-Branch).
 * Liefert bei ungültigem Verdikt die fertige ROT-Meldung — sonst `null`
 * (kein PR gefunden, ODER PR gefunden und Verdikt gültig: in beiden Fällen
 * prüft der bestehende Pfad danach unverändert weiter, diese Funktion ersetzt
 * ihn nie).
 */
export function pruefePrSchutz(
  argv: string[],
  risikoAnzahl: number,
  bereich: string,
  holen: (nr?: string) => PrKoerper | null = holePrKoerperEcht,
  holenFuerKopf: (kopf: string) => PrKoerper | null = holePrKoerperFuerKopf,
  umgebung: Record<string, string | undefined> = process.env,
): string | null {
  const i = argv.indexOf('--pr');
  let pr: PrKoerper | null;
  if (i >= 0) {
    pr = holen(argv[i + 1]);
  } else {
    const kopf = umgebung.MERGE_SCHUTZ_KOPF;
    pr = kopf ? holenFuerKopf(kopf) : holen();
  }
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
