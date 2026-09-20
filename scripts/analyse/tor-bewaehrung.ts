// scripts/analyse/tor-bewaehrung.ts — Bewährungs-Register für Tore und Hooks
// (ROADMAP-Schritt `QS-BEWAEHRUNG`, Teil A Ziff. 1).
//
// ANLASS. Dossier `bibliothek/betrieb/rekursive-selbstverbesserung-
// gegenueberstellung-2026-09-15.md` §6/§7, Befund wörtlich: «Die Tore messen
// den Code; nichts misst die Tore. Jede Regel, jedes Tor und jeder Hook ist
// eine Behauptung über künftige Fehler, die nach ihrer Einführung nie wieder
// geprüft wird.» §8 Ziff. 1 leitet daraus den Bewährungs-Zähler ab: nie rot in
// ≥ 90 Tagen ⇒ Rückbau-Kandidat nach §17-Gegengewicht. Dieses Skript erhebt
// die Grundlage dafür — es entscheidet nichts, es legt offen.
//
// ZWEI MODI:
//   npm run tor:bewaehrung                  Bericht (Default, liest nur)
//   npm run tor:bewaehrung -- --import-ci   Belege holen (CI · lokales Log · Fang)
//
// Weitere Schalter: `--limit=<n>` (CI-Läufe, Default 1000), `--stichtag=<tag>`
// (statt heute — macht den Bericht reproduzierbar), `--ereignis-log=<pfad>`.
//
// WAS DIESES SKRIPT NICHT IST. Es ist ein BERICHT, kein Tor. Eine Einstufung
// `RÜCKBAU-KANDIDAT` färbt nichts rot — sie ist ein Vorschlag an die nächste
// Chronik-Überführung (`.claude/skills/bauschritt/aufraeumen.md`), und das
// Chesterton-Gegenargument (§17-Gegengewicht: «ausser die Stelle hat einen
// datierten Vorfall verhindert») ist von Hand zu führen, nicht zu rechnen.
//
// EINZIGE ROTE BEDINGUNG (§6.7 — ein Tor, das nicht scheitern kann, ist
// gefährlicher als keines). Das Register ist eine Projektion über package.json
// und `.claude/hooks/` (§5). Driftet es davon ab — ein Eintrag nennt ein Tor
// oder einen Hook, den es nicht mehr gibt, oder ein `check:*`-Skript bzw. ein
// Hook fehlt im Register —, ist die Auswertung wertlos, weil sie über eine
// falsche Grundmenge rechnet. Nur das ist Exit 1. Rot gezeigt beim Bau
// (15.9.2026): Testeintrag `check:phantom-tor` eingefügt → Exit 1 mit
// «kennt kein Skript»; Eintrag entfernt → Exit 0.
//
// ── ABBILDUNG CI-STEP → TOR ──────────────────────────────────────────────
// Die GitHub-API meldet Fehlschläge je *Step*, nicht je Tor. Ein Step trägt
// einen freien Namen («Normtext-Struktur (Tabellen · Grundart · Invarianten)»)
// und ruft in seiner `run:`-Zeile ein oder mehrere Tore auf
// (`npm run check:tabellen && npm run check:grundart && …`). Die Abbildung
// wird darum NICHT gepflegt, sondern bei jedem Lauf aus `.github/workflows/
// ci.yml` GELESEN: `schrittAbbildung()` läuft die Datei zeilenweise durch,
// merkt sich den jeweils letzten `- name:` und sammelt bis zum nächsten
// `- name:` alle `npm run check:*`-Vorkommen. Das ist dieselbe Mechanik, die
// `scripts/tor-paritaet-sonden.ts` für die Tor-Parität benutzt, nur zusätzlich
// nach Step-Namen gruppiert.
//
// DREI GRENZEN DIESER ABBILDUNG — offengelegt statt weggeglättet (§8):
//  (a) Ein Step, der in einem alten Lauf rot war und seither UMBENANNT wurde,
//      ist nicht zuordenbar. Solche Namen verschwinden nicht still: sie
//      erscheinen am Ende des Import-Laufs unter «nicht zuordenbar» mit Zahl.
//  (b) Ein Step mit mehreren Toren belegt ALLE seine Tore. Welches der drei
//      Tore in `check:tabellen && check:grundart && check:invarianten` rot war,
//      sagt die API nicht. Der Beleg trägt darum den Step-Namen im Hinweis —
//      wer ein Tor konkret zurückbauen will, liest den Lauf nach. Ein Beleg
//      zu viel macht ein Tor «bewährter» als es ist; das ist die konservative
//      Richtung (Rückbau wird gebremst, nie beschleunigt) und darum die
//      richtige Fehlerrichtung für ein Register, das Löschungen vorschlägt.
//  (c) Steps ohne `npm run check:*` (Build, Tests, Lint, e2e) bilden auf kein
//      Tor ab. Das ist korrekt: sie sind keine Tore im Sinn dieses Registers.
//
// ── QUELLEN EINES BELEGS ─────────────────────────────────────────────────
//   ci-run-URL    Lauf-URL aus `gh run list` + fehlgeschlagener Step
//   lokaler-lauf  rotes Tor-Ereignis aus `.selbstopt-ereignisse.jsonl`
//   commit-SHA    Fang-Vermerk aus einer Commit-Message
//   fang-vermerk  dito, aus Chronik/Fehlerbuch von Hand nachgetragen
//   manuell       von Hand gesetzt (z. B. bekanntes Rot ohne jede Spur)
//
// ABWEICHUNG VOM AUFTRAG, offengelegt (§7): der Auftrag nannte vier Quellen
// ohne `lokaler-lauf`. Ohne sie wäre das Register beim ersten Lauf fast
// beleglos gewesen — `gh run list` reicht selbst mit dem Maximum von 1000
// Läufen nur 15 Tage zurück (gemessen 15.9.2026: 2026-08-31 bis 2026-09-15;
// mit 300 Läufen sind es drei Tage), das lokale Ereignis-Log dagegen 36 Tage
// und enthält 58 rote Läufe, davon 23 auf `check:*`-Tore. Dossier §8 Ziff. 1 nennt als Quellen
// ausdrücklich «CI-Logs, lokale Läufe»; die Quelle fehlte im Auftrag, nicht
// in der Sache. Das Log schreibt `scripts/run-parallel.ts` (Konstante
// EREIGNIS_DATEI dort, seit 20.9.2026 lokal — s. Rückbau-Vermerk unten), es ist
// gitignoriert und darum MASCHINENLOKAL: auf einem anderen Rechner fehlt es,
// und der Import vermerkt das als Ausfall statt still 0 Belege zu behaupten.
// Pfad überschreibbar mit `--ereignis-log=<pfad>` (nötig im Worktree, wo das
// Log nicht liegt).
//
// ── FRÜHERE ABGRENZUNG GEGEN `retro:17` ENTFALLEN (20.9.2026) ───────────────
// `scripts/plan/retro17Kern.ts` kannte seit QS-SELBSTOPT eine eigene Regel
// «nie rot ⇒ Streich-PRÜFkandidat» über die Snapshots von `messwerte/
// selbstopt-zeitreihe.json`, mit derselben Schwelle 30 Läufe — von dort
// importiert, um eine doppelte Kalibrierung zu vermeiden (§5). Mit
// `retro:17`/`selbstopt:erheben` (Entscheid David, Rückbau QS-EFFIZIENZ: die
// Zeitreihe wurde seit 4.9.2026 nicht mehr erhoben, kein Vorschlag je
// umgesetzt) ist dieses Register der EINZIGE verbliebene Arbiter für «Tor nie
// rot»; die Schwelle steht jetzt lokal, s. `LAEUFE_SCHWELLE` unten.
//
// ── «RÜCKBAU-KANDIDAT» BRAUCHT EINEN BELEGTEN LAUF (Abweichung vom Auftrag,
//    §7) ────────────────────────────────────────────────────────────────────
// Der Auftrag stufte «nie belegt und seit >= 90 Tagen» als Rückbau-Kandidat
// ein. Das verwechselt «hat nichts gefangen» mit «wurde nie gemessen».
// Gemessen 15.9.2026 am lokalen Log: `check:smoke`, `check:sweep`,
// `check:verfall`, `check:normtext` liefen je 83-mal ohne ein einziges Rot —
// das sind belastbare Prüfkandidaten. `check:caches`, `check:netz`,
// `check:zitate`, `check:fedlex-versionen`, `check:normtext-netz` liefen im
// Fenster NULLMAL; über sie sagt die Erhebung schlicht nichts. Beide in
// denselben Topf zu werfen hiesse, fünf Rückbau-Vorschläge zu erzeugen, die
// nichts ausser einer Messlücke belegen. Sie bekommen darum die eigene Klasse
// `ungemessen (kein Lauf belegt)` — sichtbar, aber kein Streichvorschlag.
//
// ── HOOKS ────────────────────────────────────────────────────────────────
// Hooks führen KEIN Log: sie blockieren mit `sys.exit(2)`, und niemand
// protokolliert das. Ein Hook kann darum weder «bewährt» noch «Rückbau-
// Kandidat» sein — er ist `unbelegt (Hook ohne Log)`. Ihn mangels Belegen zum
// Rückbau-Kandidaten zu erklären wäre der Klassiker: aus fehlender Messung
// ein Messergebnis machen. Der Vorschlags-Diff für ein Hook-Log liegt als
// eigener Handgriff bei David (Berechtigungsschicht: Hooks sind für Agenten
// nicht editierbar).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { alleCheckSkripte, pkg } from '../tor-paritaet-sonden.ts';

export const REGISTER_DATEI = 'messwerte/tor-bewaehrung.json';
export const HOOK_VERZEICHNIS = '.claude/hooks';
export const CI_YML = '.github/workflows/ci.yml';
export const SCHEMA_VERSION = 1;
export const GENERIERT_MARKE =
  'scripts/analyse/tor-bewaehrung.ts — Belege maschinell ergänzt (--import-ci); ' +
  'Einträge der Quelle `manuell` dürfen von Hand stehen und werden nie überschrieben';
/** §8 Ziff. 1 des Dossiers: «nie rot in ≥ 90 Tagen ⇒ Rückbau-Kandidat». */
export const SCHWELLE_TAGE = 90;
/**
 * Mindestzahl belegter Läufe, bevor «nie rot» ein Rückbau-Vorschlag sein darf.
 * Bis 20.9.2026 aus `retro17Kern.ts` übernommen (§5, eine Kalibrierung) — mit
 * `retro:17` entfallen (Entscheid David, Rückbau QS-EFFIZIENZ); dieses
 * Register ist seither der einzige Ort, der die Frage stellt, und kalibriert
 * darum selbst, unverändert bei 30.
 */
export const LAEUFE_SCHWELLE = 30;

export type Quelle = 'ci-run-URL' | 'lokaler-lauf' | 'commit-SHA' | 'fang-vermerk' | 'manuell';
export type Beleg = { datum: string; quelle: Quelle; hinweis: string };
export type Art = 'tor' | 'hook';
export type Eintrag = {
  name: string;
  art: Art;
  /** Einführungsdatum (ISO-Tag) oder null, wenn git es nicht hergibt. */
  seit: string | null;
  letztesRot: string | null;
  /**
   * Belegte Läufe im Erhebungsfenster (aus dem lokalen Ereignis-Log, rot UND
   * grün). Trennt «lief oft und war nie rot» von «lief nie» — s. Kopf.
   * `null` = nicht erhoben (kein Log verfügbar).
   */
  laeufe: number | null;
  belege: Beleg[];
};
/**
 * Belegfenster — die WICHTIGSTE Zahl dieses Registers (Gegenprüfung des
 * eigenen Baus, 15.9.2026). `letztesRot: null` heisst NICHT «seit Einführung
 * nie rot», sondern «im abgerufenen CI-Fenster nicht rot». GitHub hält Läufe
 * nur begrenzt vor, und `gh run list --limit 1000` reichte beim ersten Import
 * gerade 15 Tage zurück. Ohne diese Angabe läse jeder die Spalte falsch —
 * und würde ein Tor zum Rückbau vorschlagen, dessen Rot schlicht ausserhalb
 * des Fensters liegt. Die Kennzahl steht darum in der Datei UND über der
 * Tabelle, nicht in einer Fussnote.
 */
export type CiFenster = {
  abgerufenAm: string;
  laeufeAbgerufen: number;
  fehlLaeufe: number;
  aeltesterLauf: string | null;
  juengsterLauf: string | null;
};
export type Register = { _generiert: string; schema: number; ciFenster: CiFenster | null; eintraege: Eintrag[] };

export type Klasse =
  | 'bewährt'
  | 'RÜCKBAU-KANDIDAT'
  | 'ungemessen (kein Lauf belegt)'
  | 'jung'
  | 'unbelegt (Hook ohne Log)';
export type Befund = {
  name: string;
  art: Art;
  seit: string | null;
  letztesRot: string | null;
  tageSeitRot: number | null;
  tageSeitEinfuehrung: number | null;
  laeufe: number | null;
  klasse: Klasse;
};

// ─────────────────────────── reine Funktionen ───────────────────────────

/** Tage zwischen zwei ISO-Tagen (UTC-Mitternacht, keine Zeitzonen-Drift). */
export function tageZwischen(vonIso: string, bisIso: string): number {
  const von = Date.parse(`${vonIso}T00:00:00Z`);
  const bis = Date.parse(`${bisIso}T00:00:00Z`);
  return Math.round((bis - von) / 86_400_000);
}

/**
 * `letztesRot` ist eine ABLEITUNG aus den Belegen — mit einer Ausnahme, die
 * §5 nicht verletzt: ein von Hand gesetztes Datum ohne Beleg (bekanntes Rot,
 * dessen Lauf nicht mehr auffindbar ist) bleibt erhalten. Die Verschmelzung
 * ist darum monoton — sie kann ein Datum nur nach VORNE schieben, nie löschen.
 * Sonst würde ein Import, der an die Beleg-Grenze von `gh` stösst, bekanntes
 * Wissen stillschweigend vernichten.
 */
export function letztesRotAus(eintrag: Eintrag): string | null {
  const kandidaten = [eintrag.letztesRot, ...eintrag.belege.map((b) => b.datum)].filter(
    (d): d is string => typeof d === 'string' && d.length > 0,
  );
  if (!kandidaten.length) return null;
  return kandidaten.sort()[kandidaten.length - 1];
}

/** Beleg-Identität: gleiches Datum + gleiche Quelle + gleicher Hinweis = derselbe Beleg. */
export function belegSchluessel(b: Beleg): string {
  return `${b.datum}${b.quelle}${b.hinweis}`;
}

/** Idempotent: bestehende Belege bleiben in Reihenfolge, neue kommen sortiert dazu. */
export function mischeBelege(vorhanden: Beleg[], neu: Beleg[]): Beleg[] {
  const bekannt = new Set(vorhanden.map(belegSchluessel));
  const ergaenzt = [...vorhanden];
  for (const b of neu) {
    const k = belegSchluessel(b);
    if (bekannt.has(k)) continue;
    bekannt.add(k);
    ergaenzt.push(b);
  }
  return ergaenzt.sort((a, b) => (a.datum === b.datum ? belegSchluessel(a).localeCompare(belegSchluessel(b)) : a.datum.localeCompare(b.datum)));
}

/**
 * Einstufung nach §8 Ziff. 1 des Dossiers, Stichtag explizit (nicht
 * `Date.now()` im Rechenweg — sonst wäre die Funktion im Test nicht prüfbar
 * und der Bericht nicht reproduzierbar, §2).
 */
export function stufeEin(eintrag: Eintrag, stichtag: string): Befund {
  const letztesRot = letztesRotAus(eintrag);
  const tageSeitRot = letztesRot ? tageZwischen(letztesRot, stichtag) : null;
  const tageSeitEinfuehrung = eintrag.seit ? tageZwischen(eintrag.seit, stichtag) : null;
  const gemeinsam = {
    name: eintrag.name,
    art: eintrag.art,
    seit: eintrag.seit,
    letztesRot,
    tageSeitRot,
    tageSeitEinfuehrung,
    laeufe: eintrag.laeufe ?? null,
  };

  // Hooks zuerst: für sie existiert gar keine Messreihe (s. Kopf).
  if (eintrag.art === 'hook') return { ...gemeinsam, klasse: 'unbelegt (Hook ohne Log)' };

  if (tageSeitRot !== null) {
    return { ...gemeinsam, klasse: tageSeitRot <= SCHWELLE_TAGE ? 'bewährt' : 'RÜCKBAU-KANDIDAT' };
  }
  // Nie rot belegt: jung (noch keine faire Chance) — unbekanntes `seit` zählt
  // NICHT als jung, ein Eintrag ohne Einführungsdatum ist alt genug, dass git
  // ihn nicht mehr auflösen kann.
  if (tageSeitEinfuehrung !== null && tageSeitEinfuehrung < SCHWELLE_TAGE) {
    return { ...gemeinsam, klasse: 'jung' };
  }
  // Alt und nie rot — aber nur dann ein Rückbau-Vorschlag, wenn das Tor
  // nachweislich oft genug GELAUFEN ist (fest kalibriert, s. Kopf).
  // Sonst belegt die Zahl eine Messlücke, keinen Befund.
  if ((eintrag.laeufe ?? 0) >= LAEUFE_SCHWELLE) {
    return { ...gemeinsam, klasse: 'RÜCKBAU-KANDIDAT' };
  }
  return { ...gemeinsam, klasse: 'ungemessen (kein Lauf belegt)' };
}

/**
 * Drift-Prüfung Register ↔ Wirklichkeit — die einzige rote Bedingung (s. Kopf).
 * Reine Funktion über drei Namenslisten, damit sie im Test ohne Repo läuft.
 */
export function paritaetsBefunde(register: Register, tore: string[], hooks: string[]): string[] {
  const fehler: string[] = [];
  const imRegister = new Map(register.eintraege.map((e) => [e.name, e.art] as const));
  const toreSoll = new Set(tore);
  const hooksSoll = new Set(hooks);

  for (const [name, art] of imRegister) {
    if (art === 'tor' && !toreSoll.has(name)) {
      fehler.push(`Register führt Tor «${name}», package.json kennt kein Skript dieses Namens — Eintrag entfernen oder Tor wiederherstellen.`);
    }
    if (art === 'hook' && !hooksSoll.has(name)) {
      fehler.push(`Register führt Hook «${name}», ${HOOK_VERZEICHNIS}/${name} existiert nicht — Eintrag entfernen.`);
    }
  }
  for (const t of tore) {
    if (imRegister.get(t) !== 'tor') fehler.push(`Tor «${t}» steht in package.json, fehlt aber im Register — mit \`--import-ci\` nachtragen.`);
  }
  for (const h of hooks) {
    if (imRegister.get(h) !== 'hook') fehler.push(`Hook «${h}» liegt in ${HOOK_VERZEICHNIS}/, fehlt aber im Register — mit \`--import-ci\` nachtragen.`);
  }
  return fehler.sort();
}

/**
 * ci.yml: Step-Name → Tore, die dieser Step aufruft (Begründung im Kopf).
 * Zeilenweise statt YAML-Parser, weil `run: |`-Blöcke, Kommentare und
 * Verkettungen sonst denselben Aufwand brauchen — und weil die Tor-Parität
 * seit 20.7.2026 mit genau dieser Mechanik zuverlässig arbeitet.
 */
export function schrittAbbildung(ciYml: string): Map<string, string[]> {
  const abbildung = new Map<string, string[]>();
  let aktuell: string | null = null;
  for (const zeile of ciYml.split('\n')) {
    const name = /^\s*-\s*name:\s*(.+?)\s*$/.exec(zeile);
    if (name) {
      aktuell = name[1].replace(/^['"]|['"]$/g, '');
      if (!abbildung.has(aktuell)) abbildung.set(aktuell, []);
      continue;
    }
    if (aktuell === null) continue;
    // Kommentarzeilen zählen nicht — ein im Kommentar erwähntes Tor läuft nicht.
    const ohneKommentar = zeile.replace(/^\s*#.*$/, '');
    for (const m of ohneKommentar.matchAll(/npm run (check:[a-z0-9:-]+)/g)) {
      const liste = abbildung.get(aktuell)!;
      if (!liste.includes(m[1])) liste.push(m[1]);
    }
  }
  return abbildung;
}

/** Zeichen links und rechts des Fang-Worts, in denen ein Tor-Name als Fänger gilt. */
export const FANG_FENSTER = 160;

/**
 * Fang-Vermerke aus einer Commit-Message (`.claude/skills/bauschritt/
 * aufraeumen.md` §Fang-Vermerk-Pflicht: «gefangen von `<spec/tor>`»).
 *
 * WARUM EIN FENSTER UND NICHT DIE GANZE NACHRICHT (Messung 15.9.2026): eine
 * Suche über die volle Message zog aus 47 Commits 168 Belege — die meisten
 * davon Tor-Namen, die im selben Commit bloss ERWÄHNT waren («Tor
 * check:materialien wieder grün», «jetzt Tor»). Das hätte fast jedes Tor als
 * «bewährt» geführt und damit genau die Frage wegdefiniert, für die dieses
 * Register gebaut wird. Es zählt darum nur ein Tor-Name im Umkreis von
 * ±FANG_FENSTER Zeichen um ein Fang-Wort.
 *
 * `\bgefangen\b` schliesst «abgefangen» aus (kein Wortanfang) — das ist
 * Absicht: «Timeout abgefangen» ist kein Tor-Fang, sondern ein Fix.
 */
export function fangTreffer(nachricht: string, hooks: string[]): string[] {
  const treffer = new Set<string>();
  const hookMuster = hooks.map(
    (h) => [h, new RegExp(`(^|[^\\w./-])${h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)] as const,
  );
  for (const m of nachricht.matchAll(/\bgefangen\b|\bfängt\b|\bFang(?:-\w+)?\b/gi)) {
    const von = Math.max(0, (m.index ?? 0) - FANG_FENSTER);
    const fenster = nachricht.slice(von, (m.index ?? 0) + m[0].length + FANG_FENSTER);
    for (const t of fenster.matchAll(/\b(check:[a-z0-9:-]+)/g)) treffer.add(t[1]);
    // Wortgrenze statt Substring-Präsenz (§7): `tor-schutz.py` darf nicht auf
    // `xtor-schutz.py` matchen.
    for (const [h, muster] of hookMuster) if (muster.test(fenster)) treffer.add(h);
  }
  return [...treffer].sort();
}

// ─────────────────────────── Beschaffung (I/O) ───────────────────────────

/** Nie hart scheitern: ein fehlendes `gh`/`git`-Ergebnis wird null, nie 0. */
function sh(cmd: string, args: string[], maxBuffer = 64 * 1024 * 1024): string | null {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

export function hooksAufPlatte(): string[] {
  if (!existsSync(HOOK_VERZEICHNIS)) return [];
  return readdirSync(HOOK_VERZEICHNIS).filter((d) => d.endsWith('.py')).sort();
}

export function leseRegister(): Register {
  if (!existsSync(REGISTER_DATEI)) return { _generiert: GENERIERT_MARKE, schema: SCHEMA_VERSION, ciFenster: null, eintraege: [] };
  const roh = JSON.parse(readFileSync(REGISTER_DATEI, 'utf8')) as Register;
  if (!Array.isArray(roh.eintraege)) throw new Error(`${REGISTER_DATEI}: Feld \`eintraege\` fehlt oder ist kein Array.`);
  if (roh.ciFenster === undefined) roh.ciFenster = null;
  return roh;
}

/**
 * Einführungsdatum. Für ein TOR ist das der Tag, an dem sein package.json-
 * Eintrag entstand — nicht der Tag der Skript-Datei: ein Skript ohne
 * scripts-Eintrag ist kein Tor, sondern ein Werkzeug. Findet die Pickaxe
 * nichts (Umbenennung, Verschiebung), gilt ersatzweise das Anlegedatum der
 * Skript-Datei; findet auch das nichts, bleibt `null` — «unbekannt» ist eine
 * ehrlichere Antwort als ein geratenes Datum (§8).
 */
export function ermittleSeit(name: string, art: Art): string | null {
  if (art === 'hook') {
    const roh = sh('git', ['log', '--diff-filter=A', '--format=%as', '--reverse', '--', `${HOOK_VERZEICHNIS}/${name}`]);
    return roh?.split('\n').filter(Boolean)[0] ?? null;
  }
  const ausPkg = sh('git', ['log', '-S', `"${name}":`, '--format=%as', '--reverse', '--', 'package.json']);
  const ersterPkg = ausPkg?.split('\n').filter(Boolean)[0];
  if (ersterPkg) return ersterPkg;
  const pfad = /(scripts\/\S+\.(?:ts|tsx|mjs|sh))\b/.exec(pkg.scripts[name] ?? '')?.[1];
  if (!pfad) return null;
  const ausDatei = sh('git', ['log', '--diff-filter=A', '--format=%as', '--reverse', '--', pfad]);
  return ausDatei?.split('\n').filter(Boolean)[0] ?? null;
}

type CiLauf = { databaseId: number; conclusion: string; createdAt: string; headSha: string; url: string };

/** Alle abgerufenen CI-Läufe (jüngste zuerst, wie `gh` sie liefert). */
function holeLaeufe(limit: number): CiLauf[] | null {
  const roh = sh('gh', ['run', 'list', '--workflow', 'ci.yml', '--limit', String(limit), '--json', 'databaseId,conclusion,createdAt,headSha,url']);
  if (roh === null) return null;
  try {
    const alle = JSON.parse(roh) as CiLauf[];
    return Array.isArray(alle) ? alle : null;
  } catch {
    return null;
  }
}

/** Fehlgeschlagene Step-Namen eines Laufs. */
function holeFehlSchritte(runId: number): string[] | null {
  const roh = sh('gh', ['api', `repos/{owner}/{repo}/actions/runs/${runId}/jobs?per_page=100`, '--jq', '[.jobs[].steps[]? | select(.conclusion=="failure") | .name] | unique | .[]']);
  if (roh === null) return null;
  return roh.split('\n').map((z) => z.trim()).filter(Boolean);
}

export type LokalesRot = { tor: string; ts: string };
export type LokalesErgebnis = { rot: LokalesRot[]; laeufe: Map<string, number>; verworfen: number };

/**
 * Rote Tor-Läufe aus dem lokalen Ereignis-Log (JSONL, eine Zeile je Lauf:
 * `{"ts":…,"tor":"check:x","ok":false}`). Zwei Umschreibungen:
 *
 *  - `gate:<x>` → `check:<x>`, sofern es dieses Tor gibt. `gate.sh` benennt
 *    seine Schritte ohne `check:`-Präfix; `gate:vitest`, `gate:lint`,
 *    `gate:tsc -b` bleiben dabei ohne Entsprechung — das sind Läufe, keine
 *    Tore, und sie fallen korrekt heraus.
 *  - Unbekannte Namen (z. B. `check:inventur`, seit einer Umbenennung ohne
 *    package.json-Eintrag) verfallen still — `belegeFuer` legt für sie keinen
 *    Eintrag an, weil ein Register-Eintrag ohne Tor die rote Bedingung
 *    auslösen würde.
 *
 * Unlesbare Zeilen werden gezählt, nicht verschwiegen.
 */
export function parseLokalesLog(inhalt: string, bekannteTore: Set<string>): LokalesErgebnis {
  const rot: LokalesRot[] = [];
  const laeufe = new Map<string, number>();
  let verworfen = 0;
  for (const zeile of inhalt.split('\n')) {
    if (!zeile.trim()) continue;
    let e: { ts?: unknown; tor?: unknown; ok?: unknown };
    try {
      e = JSON.parse(zeile) as typeof e;
    } catch {
      verworfen += 1;
      continue;
    }
    if (typeof e.ts !== 'string' || typeof e.tor !== 'string' || typeof e.ok !== 'boolean') {
      verworfen += 1;
      continue;
    }
    const name = e.tor.startsWith('gate:') ? `check:${e.tor.slice(5).trim()}` : e.tor;
    if (!bekannteTore.has(name)) continue;
    laeufe.set(name, (laeufe.get(name) ?? 0) + 1);
    if (e.ok) continue;
    rot.push({ tor: name, ts: e.ts });
  }
  return { rot, laeufe, verworfen };
}

type FangCommit = { sha: string; datum: string; nachricht: string };

/** Commits mit Fang-Vermerk (`.claude/skills/bauschritt/aufraeumen.md` §Fang-Vermerk-Pflicht). */
function holeFangCommits(seit: string): FangCommit[] | null {
  const roh = sh('git', ['log', `--since=${seit}`, '--grep=Fang', '--regexp-ignore-case', '--format=%x01%H%x09%as%x09%B']);
  if (roh === null) return null;
  const commits: FangCommit[] = [];
  for (const block of roh.split('')) {
    if (!block.trim()) continue;
    const trenner1 = block.indexOf('\t');
    const trenner2 = block.indexOf('\t', trenner1 + 1);
    if (trenner1 < 0 || trenner2 < 0) continue;
    commits.push({ sha: block.slice(0, trenner1), datum: block.slice(trenner1 + 1, trenner2), nachricht: block.slice(trenner2 + 1) });
  }
  return commits;
}

// ───────────────────────────────── Import ─────────────────────────────────

export type ImportBericht = {
  neueEintraege: string[];
  neueBelege: number;
  gepruefteLaeufe: number;
  lokaleRot: number;
  fangCommits: number;
  nichtZuordenbar: Map<string, number>;
  ausfaelle: string[];
};

const FANG_SEIT = '2026-08-01'; // Fang-Vermerk-Pflicht gilt seit 31.8.2026; Vorlauf bewusst.
export const LOKALES_LOG = '.selbstopt-ereignisse.jsonl';

export function importiere(limit: number, ereignisLog: string = LOKALES_LOG): { register: Register; bericht: ImportBericht } {
  const register = leseRegister();
  const bericht: ImportBericht = { neueEintraege: [], neueBelege: 0, gepruefteLaeufe: 0, lokaleRot: 0, fangCommits: 0, nichtZuordenbar: new Map(), ausfaelle: [] };
  const nachName = new Map(register.eintraege.map((e) => [e.name, e] as const));

  // (1) Grundmenge angleichen: jedes Tor, jeder Hook bekommt einen Eintrag.
  const hooks = hooksAufPlatte();
  const soll: Array<[string, Art]> = [
    ...alleCheckSkripte.map((t) => [t, 'tor'] as [string, Art]),
    ...hooks.map((h) => [h, 'hook'] as [string, Art]),
  ];
  for (const [name, art] of soll) {
    let e = nachName.get(name);
    if (!e) {
      e = { name, art, seit: null, letztesRot: null, laeufe: null, belege: [] };
      register.eintraege.push(e);
      nachName.set(name, e);
      bericht.neueEintraege.push(name);
    }
    e.art = art;
    if (e.seit === null) e.seit = ermittleSeit(name, art);
  }

  const belegeFuer = (name: string, beleg: Beleg) => {
    const e = nachName.get(name);
    if (!e) return; // Tor aus einem alten Lauf, das es nicht mehr gibt — kein Eintrag, kein Beleg.
    const vorher = e.belege.length;
    e.belege = mischeBelege(e.belege, [beleg]);
    if (e.belege.length > vorher) bericht.neueBelege += 1;
  };

  // (2) CI-Belege.
  const abbildung = schrittAbbildung(existsSync(CI_YML) ? readFileSync(CI_YML, 'utf8') : '');
  const alleLaeufe = holeLaeufe(limit);
  if (alleLaeufe === null) {
    bericht.ausfaelle.push('gh run list --workflow ci.yml (kein gh, kein Netz oder nicht authentisiert) — CI-Belege fehlen in diesem Lauf');
  } else {
    const laeufe = alleLaeufe.filter((l) => l.conclusion === 'failure');
    const daten = alleLaeufe.map((l) => l.createdAt).sort();
    register.ciFenster = {
      abgerufenAm: new Date().toISOString().slice(0, 10),
      laeufeAbgerufen: alleLaeufe.length,
      fehlLaeufe: laeufe.length,
      aeltesterLauf: daten[0]?.slice(0, 10) ?? null,
      juengsterLauf: daten[daten.length - 1]?.slice(0, 10) ?? null,
    };
    for (const lauf of laeufe) {
      const schritte = holeFehlSchritte(lauf.databaseId);
      if (schritte === null) {
        bericht.ausfaelle.push(`gh api .../runs/${lauf.databaseId}/jobs`);
        continue;
      }
      bericht.gepruefteLaeufe += 1;
      const datum = lauf.createdAt.slice(0, 10);
      for (const schritt of schritte) {
        const tore = abbildung.get(schritt) ?? [];
        if (!tore.length) {
          bericht.nichtZuordenbar.set(schritt, (bericht.nichtZuordenbar.get(schritt) ?? 0) + 1);
          continue;
        }
        for (const tor of tore) {
          belegeFuer(tor, { datum, quelle: 'ci-run-URL', hinweis: `${lauf.url} — Step «${schritt}» rot` });
        }
      }
    }
  }

  // (3) Lokale Gate-Läufe.
  if (!existsSync(ereignisLog)) {
    bericht.ausfaelle.push(`${ereignisLog} (maschinenlokales Ereignis-Log, hier nicht vorhanden) — lokale Rot-Belege fehlen in diesem Lauf`);
  } else {
    const bekannt = new Set(alleCheckSkripte);
    const { rot, laeufe, verworfen } = parseLokalesLog(readFileSync(ereignisLog, 'utf8'), bekannt);
    if (verworfen) bericht.ausfaelle.push(`${ereignisLog}: ${verworfen} unlesbare Zeile(n) übersprungen`);
    bericht.lokaleRot = rot.length;
    // Laufzahlen: 0 ist hier eine ECHTE Null (das Log lag vor und nannte das
    // Tor nicht), nicht «unbekannt» — darum wird sie gesetzt, nicht offen
    // gelassen. `null` bleibt nur, wenn gar kein Log da war.
    for (const [name, art] of soll) {
      if (art !== 'tor') continue;
      const e = nachName.get(name);
      if (e) e.laeufe = laeufe.get(name) ?? 0;
    }
    for (const r of rot) {
      belegeFuer(r.tor, { datum: r.ts.slice(0, 10), quelle: 'lokaler-lauf', hinweis: `lokaler Gate-/Tor-Lauf ${r.ts} rot` });
    }
  }

  // (4) Fang-Vermerke.
  const fang = holeFangCommits(FANG_SEIT);
  if (fang === null) {
    bericht.ausfaelle.push(`git log --since=${FANG_SEIT} --grep=Fang`);
  } else {
    for (const c of fang) {
      const treffer = fangTreffer(c.nachricht, hooks);
      if (!treffer.length) continue;
      bericht.fangCommits += 1;
      const betreff = c.nachricht.split('\n')[0].slice(0, 120);
      for (const name of treffer) {
        belegeFuer(name, { datum: c.datum, quelle: 'fang-vermerk', hinweis: `${c.sha.slice(0, 9)} — ${betreff}` });
      }
    }
  }

  // (5) Ableitung nachziehen und stabil sortieren.
  for (const e of register.eintraege) e.letztesRot = letztesRotAus(e);
  register.eintraege.sort((a, b) => (a.art === b.art ? a.name.localeCompare(b.name) : a.art.localeCompare(b.art)));
  register._generiert = GENERIERT_MARKE;
  register.schema = SCHEMA_VERSION;
  return { register, bericht };
}

// ───────────────────────────────── Bericht ─────────────────────────────────

function spalte(text: string, breite: number): string {
  return text.length >= breite ? text : text + ' '.repeat(breite - text.length);
}

export function fensterZeilen(f: CiFenster | null): string[] {
  if (f === null) {
    return [
      'BELEGFENSTER: unbekannt — noch kein `--import-ci` gelaufen. Jedes «—» in der Spalte',
      '«letztes Rot» heisst hier NUR «nicht gemessen», nicht «nie rot».',
    ];
  }
  return [
    `BELEGFENSTER CI: ${f.aeltesterLauf ?? '—'} bis ${f.juengsterLauf ?? '—'} ` +
      `(${f.laeufeAbgerufen} Läufe abgerufen, davon ${f.fehlLaeufe} rot; Abruf ${f.abgerufenAm}).`,
    'ACHTUNG: «—» in «letztes Rot» heisst «im Fenster nicht rot» — NICHT «seit Einführung nie',
    'rot». Wo `seit` vor dem Fensteranfang liegt, ist die Einstufung eine Untergrenze: ein Rot',
    'davor kann es gegeben haben, GitHub hält die Läufe nur begrenzt vor. Vor einem Rückbau',
    'darum immer zusätzlich die Chronik und das Fehlerbuch prüfen.',
  ];
}

export function berichtZeilen(befunde: Befund[], stichtag: string): string[] {
  const kopf = ['Tor / Hook', 'seit', 'letztes Rot', 'Tage', 'Läufe', 'Einstufung'];
  const breiten = [
    Math.max(kopf[0].length, ...befunde.map((b) => b.name.length)),
    10,
    11,
    5,
    5,
  ];
  const zeilen = [
    `Tor-Bewährung · Stichtag ${stichtag} · Schwelle ${SCHWELLE_TAGE} Tage (Dossier §8 Ziff. 1)`,
    '',
    [
      spalte(kopf[0], breiten[0]),
      spalte(kopf[1], breiten[1]),
      spalte(kopf[2], breiten[2]),
      spalte(kopf[3], breiten[3]),
      spalte(kopf[4], breiten[4]),
      kopf[5],
    ].join('  '),
    '─'.repeat(breiten.reduce((a, b) => a + b, 0) + 10 + 30),
  ];
  const rang: Record<Klasse, number> = {
    'RÜCKBAU-KANDIDAT': 0,
    'ungemessen (kein Lauf belegt)': 1,
    'unbelegt (Hook ohne Log)': 2,
    jung: 3,
    bewährt: 4,
  };
  const sortiert = [...befunde].sort((a, b) => {
    if (rang[a.klasse] !== rang[b.klasse]) return rang[a.klasse] - rang[b.klasse];
    const ta = a.tageSeitRot ?? a.tageSeitEinfuehrung ?? Number.MAX_SAFE_INTEGER;
    const tb = b.tageSeitRot ?? b.tageSeitEinfuehrung ?? Number.MAX_SAFE_INTEGER;
    return tb - ta || a.name.localeCompare(b.name);
  });
  for (const b of sortiert) {
    zeilen.push(
      [
        spalte(b.name, breiten[0]),
        spalte(b.seit ?? '—', breiten[1]),
        spalte(b.letztesRot ?? '—', breiten[2]),
        spalte(b.tageSeitRot === null ? '—' : String(b.tageSeitRot), breiten[3]),
        spalte(b.laeufe === null ? '—' : String(b.laeufe), breiten[4]),
        b.klasse,
      ].join('  '),
    );
  }
  const zaehle = (k: Klasse) => befunde.filter((b) => b.klasse === k).length;
  // Ein Hook bleibt IMMER «unbelegt (Hook ohne Log)» — auch wenn ein
  // Fang-Vermerk ihn nennt. Der Vermerk ist ein Zufallsfund aus einer
  // Commit-Message, keine Messreihe; aus ihm eine Bewährung zu machen hiesse,
  // aus einer Stichprobe der Grösse 1 eine Rate zu lesen. Er wird darum
  // ausgewiesen statt eingerechnet.
  const hooksMitFang = befunde.filter((b) => b.art === 'hook' && b.letztesRot !== null).length;
  zeilen.push(
    '',
    `Summe: ${befunde.length} Einträge — ${zaehle('bewährt')} bewährt · ${zaehle('RÜCKBAU-KANDIDAT')} Rückbau-Kandidaten · ` +
      `${zaehle('ungemessen (kein Lauf belegt)')} ungemessen · ` +
      `${zaehle('jung')} jung · ${zaehle('unbelegt (Hook ohne Log)')} Hooks ohne Log` +
      (hooksMitFang ? ` (davon ${hooksMitFang} mit Fang-Vermerk — ausgewiesen, nicht eingerechnet)` : ''),
    `Spalte «Läufe» = belegte Läufe im Fenster; ab ${LAEUFE_SCHWELLE} (fest kalibriert, s. Kopf)`,
    'wird «nie rot» zum Rückbau-Kandidaten, darunter nur zu «ungemessen».',
    'Einstufung ist ein VORSCHLAG, kein Urteil: vor jedem Rückbau das Chesterton-Gegenargument',
    'prüfen (§17-Gegengewicht — «ausser die Stelle hat einen datierten Vorfall verhindert»);',
    '«nie rot» belegt genauso gut, dass der Fehler nicht mehr gebaut wird, WEIL das Tor da ist.',
  );
  return zeilen;
}

// ─────────────────────────────────── CLI ───────────────────────────────────

function heute(): string {
  return new Date().toISOString().slice(0, 10);
}

function main(): void {
  const argv = process.argv.slice(2);
  const stichtag = /^--stichtag=(\d{4}-\d{2}-\d{2})$/.exec(argv.find((a) => a.startsWith('--stichtag=')) ?? '')?.[1] ?? heute();
  // Default 1000 (das Maximum von `gh run list`): bei unserer Lauf-Dichte
  // deckt 300 nur drei Tage ab, 1000 deckt gut zwei Wochen ab (gemessen
  // 15.9.2026). Preis: ein `gh api`-Aufruf je rotem Lauf, rund drei Minuten.
  const limit = Number(/^--limit=(\d+)$/.exec(argv.find((a) => a.startsWith('--limit=')) ?? '')?.[1] ?? 1000);

  const ereignisLog = /^--ereignis-log=(.+)$/.exec(argv.find((a) => a.startsWith('--ereignis-log=')) ?? '')?.[1] ?? LOKALES_LOG;

  if (argv.includes('--import-ci')) {
    const { register, bericht } = importiere(limit, ereignisLog);
    writeFileSync(REGISTER_DATEI, `${JSON.stringify(register, null, 2)}\n`, 'utf8');
    console.log(`Register geschrieben: ${REGISTER_DATEI} (${register.eintraege.length} Einträge)`);
    console.log(`  neue Einträge: ${bericht.neueEintraege.length}`);
    console.log(`  neue Belege:   ${bericht.neueBelege}`);
    console.log(`  CI-Läufe (nur conclusion=failure) ausgewertet: ${bericht.gepruefteLaeufe}`);
    console.log(`  lokale Rot-Ereignisse (${ereignisLog}): ${bericht.lokaleRot}`);
    console.log(`  Fang-Commits mit Treffer: ${bericht.fangCommits}`);
    if (bericht.nichtZuordenbar.size) {
      const top = [...bericht.nichtZuordenbar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
      console.log(`  nicht zuordenbare Step-Namen (${bericht.nichtZuordenbar.size} verschiedene — Grenze (a)/(c) im Kopf):`);
      for (const [name, zahl] of top) console.log(`    ${String(zahl).padStart(4)}×  ${name}`);
    }
    for (const a of bericht.ausfaelle) console.log(`  AUSFALL: ${a}`);
    console.log('');
  }

  const register = leseRegister();
  const fehler = paritaetsBefunde(register, alleCheckSkripte, hooksAufPlatte());
  const befunde = register.eintraege.map((e) => stufeEin(e, stichtag));
  for (const z of berichtZeilen(befunde, stichtag)) console.log(z);
  console.log('');
  for (const z of fensterZeilen(register.ciFenster)) console.log(z);

  if (fehler.length) {
    console.error('');
    console.error(`ROT — Register und Wirklichkeit driften auseinander (${fehler.length} Befund(e)):`);
    for (const f of fehler) console.error(`  - ${f}`);
    console.error('Solange die Grundmenge falsch ist, ist jede Einstufung oben wertlos.');
    process.exit(1);
  }
}

// CLI-Teil NICHT unter vitest ausführen — der Test importiert die reinen
// Funktionen, darf main()/process.exit aber nie als Seiteneffekt auslösen.
// Ein Abgleich auf `process.argv[1]` wäre hier STILL NIE WAHR: unter vite-node
// zeigt argv[1] auf das vite-node-Binary, nie auf diese Datei (gemessen
// 15.9.2026 — erster Lauf gab kommentarlos Exit 0 aus). Dieselbe Falle steht
// schon in scripts/analyse/kommentar-bilanz.ts protokolliert.
if (!process.env.VITEST) main();
