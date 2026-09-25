// ─── Rechtsprechungs-Wochenlauf: PR-Bericht, Commit, Job-Summary (rein, §2) ──
//
// Aus wochenlauf-kern.ts herausgelöst (Schlankheit): hier wird nur formatiert,
// entschieden wird im Kern. Jeder Befund, den der Kern liefert, erscheint hier
// — Ausfälle, Guard-Befunde, rote Tore, Budget, Frische, Stichprobe.
import {
  budgetBefund, type BudgetZeile, type BsVollBilanz, type Entscheid, type FrischeZeile, type GuardBefund,
  type RegisterVergleich, type StichprobenZeile, type Tor,
} from './wochenlauf-kern';

export interface Schritt { name: string; befehl: string; code: number; ausfaelle: string[] }
export type Modus = 'woche' | 'bs-vollabgleich';
export interface BerichtDaten {
  datum: string;
  modus: Modus;
  baender: { vor: number; lauf: number };
  /** Aufbau-Basis: offener Auto-PR der Vorwoche (Branch/Nr.) oder main; verworfene Vorwoche mit Grund. */
  basis: { branch: string | null; nr: string | null; vorwocheVerworfen: string | null };
  quellen: Schritt[];
  nachbau: Schritt[];
  /** PR gesamt gegen origin/main (trägt eine Vorwoche mit). */
  vergleich: RegisterVergleich;
  /** Nur dieser Lauf (gegen die Basis). */
  dieseWoche: { neu: number; entfernt: number };
  bs: { aktualisiert: string[]; takedown: string[] };
  bsVoll: BsVollBilanz | null;
  guards: GuardBefund[];
  tore: Tor[];
  stichprobe: StichprobenZeile[];
  budget: BudgetZeile[];
  frische: FrischeZeile[];
  unerwartet: string[];
  entscheid: { entscheid: Entscheid; gruende: string[] };
  mergeSchutzSperrt: boolean;
  laufUrl: string | null;
}

export const TITEL = (datum: string) => `feat(rechtsprechung): Wochen-Nachzug ${datum} (QS-KORPUS)`;
/** Schlussabsatz: jede Zeile < 72 Zeichen; «ausstehend» ist KEIN taugliches Verdikt (squash-trailer.ts). */
export const SCHLUSS = [
  '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  '',
  'Roadmap: QS-KORPUS',
  'Gegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung',
].join('\n');

const liste = (xs: string[], max = 40) =>
  xs.length ? xs.slice(0, max).map((x) => `- ${x}`).join('\n') + (xs.length > max ? `\n- … und ${xs.length - max} weitere` : '') : '- keine';
const zelle = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const kb = (n: number | null) => (n === null ? '–' : `${(n / 1024).toFixed(1)} KB`);
const ausgefallen = (q: Schritt) => q.code !== 0 || q.ausfaelle.length > 0;

/** Kopfsatz: ehrlich — «alles grün» nur, wenn auch alle Quellen erreicht wurden. */
export function kopfsatz(d: BerichtDaten): string {
  if (d.entscheid.entscheid === 'entwurf') return `> **ENTWURF — rot:** ${d.entscheid.gruende.join(' · ')}`;
  return '> Alle Quellen erreicht, alle Tore grün, Stichprobe ohne Fehltreffer. Landung erst nach Gegenprüfung.';
}

export function baueBericht(d: BerichtDaten): string {
  const s = d.stichprobe;
  const tr = s.filter((x) => x.ergebnis === 'treffer').length;
  const pr = s.filter((x) => x.ergebnis !== 'nicht-pruefbar').length;
  const ausfall = [...d.quellen, ...d.nachbau].filter(ausgefallen);
  const bb = budgetBefund(d.budget);
  const reg = d.budget.find((z) => z.pfad === 'public/rechtsprechung/register.json');
  const regZu = reg && reg.vorher !== null && reg.nachher !== null ? reg.nachher - reg.vorher : null;
  const hinweise = d.frische.filter((f) => f.hinweis);
  return [
    `Automatischer Rechtsprechungs-${d.modus === 'bs-vollabgleich' ? 'Monatslauf (BS-Vollabgleich)' : 'Wochenlauf'} ${d.datum} (Entscheid David 25.9.2026: «Vorbereiten, Prüfung vor Live»). **Kein Auto-Merge.** Landung erst, wenn eine Session die Gegenprüfung gemacht hat (Skill korpus-werkstatt, «Wochen-Nachzug prüfen und landen»).`,
    '',
    kopfsatz(d),
    ...bb.warnung.map((w) => `> **Budget-Warnung (≥ 90 %):** ${w}`),
    '',
    d.basis.nr
      ? `Baut auf dem offenen Auto-PR #${d.basis.nr} (${d.basis.branch}) auf — Vorwoche plus main eingemergt; die Zahlen unten gelten für den ganzen PR gegen main.`
      : d.basis.vorwocheVerworfen
        ? `**Vorwoche verworfen:** ${d.basis.vorwocheVerworfen} — dieser PR baut auf main auf; die Einträge der Vorwoche müssen neu nachgezogen werden.`
        : 'Baut auf main auf (kein offener Auto-PR).',
    '',
    '## Zahlen je Gericht (PR gesamt gegen main)',
    '',
    '| Gericht | vorher | nachher | Δ | neuestes Datum |',
    '|---|---:|---:|---:|---|',
    ...d.vergleich.jeGericht.map((z) => `| ${z.gericht} | ${z.vorher} | ${z.nachher} | ${z.nachher - z.vorher >= 0 ? '+' : ''}${z.nachher - z.vorher} | ${z.neuestes ?? '–'} |`),
    '',
    `Neu: ${d.vergleich.neu.length} · entfernt: ${d.vergleich.entfernt.length} (davon dieser Lauf: +${d.dieseWoche.neu} / −${d.dieseWoche.entfernt}) · BGE-Bände ${d.baender.vor}+${d.baender.lauf}`,
    ...(d.bsVoll ? ['', `BS-Vollabgleich: **${d.bsVoll.geprueft} geprüft · ${d.bsVoll.inhalt + d.bsVoll.liste} geändert** (Inhalt ${d.bsVoll.inhalt}, Listenfelder ${d.bsVoll.liste}) · neu ${d.bsVoll.neu} · Takedown ${d.bsVoll.takedown}`] : []),
    '',
    '## Übersprungene Quellen und Ausfälle',
    '',
    ausfall.length
      ? ausfall.map((q) => `- **${q.name}** (Exit ${q.code}${q.code !== 0 ? ', Änderungen dieses Schritts verworfen' : ''})\n${q.ausfaelle.slice(0, 12).map((a) => `  - \`${a.slice(0, 160)}\``).join('\n')}`).join('\n')
      : '- keine',
    '',
    '## Befunde der Guards',
    '',
    'Einträge, die ein Generator-Schutz (§8) nicht aufgenommen, zurückgestuft oder bereinigt hat — kein Fehler, aber zu sichten.',
    '',
    d.guards.length
      ? d.guards.map((g) => `- \`${g.zeile.slice(0, 200)}\`${g.details.map((x) => `\n  - ${x.slice(0, 160)}`).join('')}`).join('\n')
      : '- keine',
    '',
    '## Basel-Stadt: Takedowns und aktualisierte Urteile',
    '',
    `Takedowns (aus dem Portal verschwunden, entfernt): ${d.bs.takedown.length}`,
    liste(d.bs.takedown),
    '',
    `Aktualisiert: ${d.bs.aktualisiert.length}`,
    liste(d.bs.aktualisiert),
    '',
    '## Tore (Prüfstrasse wie merge_group, ohne merge-schutz)',
    '',
    '| Tor | Ergebnis |',
    '|---|---|',
    ...d.tore.map((t) => `| \`${t.name}\` | ${t.code === 0 ? 'grün' : `**ROT** (Exit ${t.code}): ${zelle(t.auszug).slice(0, 300)}`} |`),
    '',
    `check:merge-schutz sperrt diesen Diff bis zum Verdikt: **${d.mergeSchutzSperrt ? 'ja' : 'NEIN'}**`,
    ...(d.unerwartet.length ? ['', `**Unerwartete Dateien — NICHT gestagt** (Positivliste, wochenlauf-kern.ts ERWARTETE_PFADE):`, liste(d.unerwartet, 20)] : []),
    '',
    '## Daten-Budget (gzip, DATEN_BUDGET)',
    '',
    '| Datei | Basis | nachher | Budget | Ausnutzung | reicht noch |',
    '|---|---:|---:|---:|---:|---|',
    ...d.budget.map((z) => `| ${z.pfad.replace('public/rechtsprechung/', '…/')} | ${kb(z.vorher)} | ${kb(z.nachher)} | ${kb(z.budget)} | ${z.anteil === null ? '–' : `${(100 * z.anteil).toFixed(1)} %`} | ${z.wochen === null ? '–' : `~${z.wochen} Wochen`} |`),
    ...(regZu !== null && d.dieseWoche.neu > 0 ? ['', `register.json: Zuwachs dieses Laufs ${regZu} B gzip für ${d.dieseWoche.neu} neue Einträge ≈ ${Math.round(regZu / d.dieseWoche.neu)} B je Eintrag (Mischung BGE/BS/übrige).`] : []),
    '',
    '## Frische je Gericht (OCL-Listing neueste zuerst ↔ Register)',
    '',
    '| Gericht | jüngstes Quelldatum | jüngstes Registerdatum | Lücke Tage | Hinweis |',
    '|---|---|---|---:|---|',
    ...d.frische.map((f) => `| ${f.gericht} | ${f.quelle ?? '–'} | ${f.register ?? '–'} | ${f.luecke ?? '–'} | ${f.hinweis ?? ''} |`),
    ...(hinweise.length ? ['', `Hinweis (kein Entwurf): ${hinweise.map((f) => `${f.gericht} — ${f.hinweis}`).join(' · ')}`] : []),
    '',
    `## Identitäts-Stichprobe (automatisch): ${tr}/${pr} Treffer${s.length - pr ? `, ${s.length - pr} nicht prüfbar` : ''}`,
    '',
    'BGE gegen bger.ch clir (Ausweichadresse search.bger.ch), BS gegen das Portal (Geschäftsnummer + Entscheiddatum), übrige gegen die Quelle als HTML- oder PDF-Text (Aktenzeichen mit Wortgrenze, BVGer über OCL `pdf_url`; Datum als Zusatzbeleg). PDF mit Textebene ohne Aktenzeichen = Fehltreffer.',
    '',
    '| Eintrag | Ergebnis | Beleg |',
    '|---|---|---|',
    ...s.map((x) => `| ${x.url ? `[${x.key}](${x.url})` : x.key} | ${x.ergebnis} | ${zelle(x.detail)} |`),
    '',
    '## Für die prüfende Session',
    '',
    `- In Prüfung nehmen: Label \`in-pruefung\` setzen (oder kommentieren/committen) — der nächste Lauf überschreibt den PR dann nicht.`,
    '- Korpus-Zahl-Pins in Tests/e2e reissen am Zuwachs; das Tor «npm test»/e2e oben zeigt sie schon hier.',
    d.laufUrl ? `- Lauf: ${d.laufUrl}` : '',
    '',
    SCHLUSS,
    '',
  ].filter((z, i, a) => !(z === '' && a[i - 1] === '')).join('\n');
}

/** Commit-Nachricht (Datei für `git commit -F`); Trailer als letzter Absatz. */
export function baueCommit(d: BerichtDaten): string {
  return [
    TITEL(d.datum),
    '',
    `Automatischer ${d.modus === 'bs-vollabgleich' ? 'BS-Vollabgleich' : 'Wochenlauf'}: ${d.dieseWoche.neu} neu, ${d.dieseWoche.entfernt} entfernt,`,
    `${d.bs.aktualisiert.length} BS aktualisiert. Entscheid: ${d.entscheid.entscheid}.`,
    '',
    'Roadmap: QS-KORPUS',
    'Gegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung',
    '',
  ].join('\n');
}

/** Job-Summary: der Kopf trägt das Rot-Signal (Punkt 15), der Rest ist der Bericht. */
export function baueSummary(d: BerichtDaten, bericht: string): string {
  const kopf = `## Rechtsprechungs-${d.modus === 'bs-vollabgleich' ? 'Monatslauf' : 'Wochenlauf'} ${d.datum}`;
  if (d.entscheid.entscheid !== 'kein-diff') {
    return `${kopf}: ${d.entscheid.entscheid === 'entwurf' ? '**ENTWURF — ROT**' : 'PR bereit zur Gegenprüfung'}\n\n${bericht}`;
  }
  const aus = d.quellen.filter(ausgefallen);
  return `${kopf}: keine neuen Entscheide\n\n${aus.length
    ? `**Achtung — Quellen ausgefallen, «nichts Neues» ist darum nicht belegt:**\n\n${aus.map((q) => `- ${q.name} (Exit ${q.code}): ${q.ausfaelle.slice(0, 5).join(' · ')}`).join('\n')}\n`
    : 'Alle Quellen erreicht, kein Inhalts-Diff — kein PR.\n'}`;
}
