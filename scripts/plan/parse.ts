// scripts/plan/parse.ts
import { existsSync, readFileSync } from 'node:fs';
import { parseEtikett, type Etikett } from './etikett';

export type Checkbox = '[ ]' | '[x]' | '[~]' | '[d]' | null;
export interface Einheit {
  id: string;
  etikett: Etikett;
  checkbox: Checkbox;
  sektion: string;
  /** 0-basierte Position in der ROADMAP-Dokumentreihenfolge = die Bau-Reihenfolge.
   *  Ohne dieses Feld sortiert next.ts lexikografisch und macht damit alle
   *  ready-Einheiten gleichrangig — «oberster offener Schritt» wird unbeantwortbar. */
  pos: number;
}

/** Erlaubte Kombinationen Checkbox × Status — die EINE Quelle (§5). check.ts
 *  Regel 2 prüft damit die Kopplung, set.ts entscheidet damit, ob der
 *  Checkbox-Nachzug überhaupt greifen muss. Lag bis 31.7.2026 nur in check.ts;
 *  set.ts führte mit CHECKBOX_FUER eine zweite, unvollständige Wahrheit
 *  (Fund R2-9/R2-15: der Legenden-Marker `[d]` ging beim Setzen still verloren). */
export const CHECKBOX_STATUS: Record<string, string[]> = {
  '[x]': ['done'],
  '[~]': ['wip'],
  '[ ]': ['ready', 'blocked', 'parked'],
  '[d]': ['parked', 'blocked'], // Legenden-Status «geparkt/zurückgestellt» — nie auf ready/wip/done
};

/** Listen-Bullet (auch im Blockquote), mit oder ohne Checkbox. */
export const BULLET_RE = /^[ \t]*(?:>[ \t]*)*[-*+][ \t]/;
/** Listen-Bullet MIT Checkbox — die Zeichenklasse spiegelt CHECKBOX_STATUS. */
export const CHECKBOX_RE = /^[ \t]*(?:>[ \t]*)*[-*+][ \t]*\[([ xX~Dd])\]/;

export function checkboxAus(zeile: string): Checkbox {
  const m = zeile.match(CHECKBOX_RE);
  return m ? (`[${m[1].toLowerCase()}]` as Checkbox) : null;
}

/** Einrückung einer Bullet-Zeile in Zeichen (Blockquote-Präfix zählt mit). */
export function bulletEinzug(zeile: string): number {
  return zeile.match(/^[ \t]*(?:>[ \t]*)*/)![0].length;
}

/**
 * Bindet die Checkbox-Zeile an ein @meta.
 *
 * Fund R2-1/R2-10 der QS-TOK-Endprüfung (31.7.2026, KRITISCH): Die frühere Regel
 * las die Checkbox aus der «nächsten nicht-leeren Zeile DARÜBER» und brach dort
 * ab. Steht zwischen Bullet und @meta auch nur EINE Prosa-Zeile — im Bestand bei
 * `W2·17-UI-BEFUNDE-B20` (5 Zeilen) und `W2·5g-ZEIT` (1 Zeile) —, blieb
 * `checkbox = null`. Da check.ts Regel 2 nur `if (e.checkbox && …)` prüft und
 * set.ts dieselbe Annahme spiegelte, schrieb `plan:set … status=done` das @meta,
 * liess die menschenlesbare Liste auf «offen» stehen, und KEIN Tor sah es (§6.7).
 *
 * Neue Regel: rückwärts bis zur ERSTEN Listen-Bullet-Zeile; deren Checkbox bindet
 * (trägt sie keine, bindet nichts — die Bullet gehört dann zu einer Liste ohne
 * Checkboxen, etwa dem Querschnitt-Band). Die «erste Bullet gewinnt»-Klausel ist
 * der Schutz gegen die Gegenrichtung: sonst bände ein checkbox-loser
 * Querschnitt-Eintrag an die Checkbox der darüberliegenden Nachbarliste.
 * Abbruch zusätzlich an Überschrift, Kommentar-Grenze (`<!--`/`-->`, damit auch
 * an einem fremden @meta) und an einer doppelten Leerzeile.
 *
 * Fund R3-7 (Endprüfung Runde 3, 31.7.2026): Der Bullet-Test steht seither VOR
 * der Kommentar-Grenze. `z.includes('-->')` trifft auch dann, wenn die
 * Zeichenfolge blosser Fliesstext der Bullet selbst ist — ein Pfeil im
 * Schritt-Titel genügte, um die Bindung zu kappen und check.ts Regel 10
 * falsch-positiv rot zu machen, mit einer Meldung, die auf die falsche Ursache
 * zeigt. Eine Bullet-Zeile ist nie eine Kommentar-Grenze. (Die ROADMAP trägt kein
 * @meta auf einer Bullet-Zeile — nachgemessen 0 Treffer —, die Umkehrung ist
 * darum auch am Bestand folgenlos.)
 */
export function bindeCheckbox(zeilen: string[], metaIdx: number): { checkbox: Checkbox; zeile: number | null } {
  const metaEinzug = (zeilen[metaIdx].match(/^[ \t]*/) ?? [''])[0].length;
  let leerFolge = 0;
  for (let j = metaIdx - 1; j >= 0; j--) {
    const z = zeilen[j];
    if (z.trim() === '') {
      if (++leerFolge >= 2) break;
      continue;
    }
    leerFolge = 0;
    if (/^[ \t]*(?:>[ \t]*)*#{1,6}[ \t]/.test(z)) break; // Überschrift
    if (BULLET_RE.test(z)) {
      // Entstückelungs-Folgefehler (8.8.2026, QS-AUDIT-VERWEISE): Dach-Schritte
      // tragen EINGERÜCKTE Checklisten-Positionen zwischen Schritt-Checkbox und
      // @meta — Checkbox-Bullets auf @meta-Tiefe. Die dem @meta nächste Checkbox
      // ist dann eine Position; plan:set toggelte real die letzte Checklisten-
      // Zeile statt der Schritt-Checkbox. Die Besitzer-Bullet liegt immer eine
      // Stufe ÜBER dem @meta (Konvention: @meta = Bullet-Einzug + 2). Darum:
      // Checkbox-Bullets auf oder unter @meta-Tiefe überspringen; checkbox-lose
      // Bullets kappen die Bindung weiterhin (Regel-10-Semantik unverändert).
      const einzug = (z.match(/^[ \t]*/) ?? [''])[0].length;
      if (einzug >= metaEinzug && checkboxAus(z)) continue;
      const cb = checkboxAus(z);
      return cb ? { checkbox: cb, zeile: j } : { checkbox: null, zeile: null };
    }
    if (z.includes('<!--') || z.includes('-->')) break; // fremdes @meta / Kommentar-Grenze
  }
  return { checkbox: null, zeile: null };
}

export function parseRoadmap(md: string): { einheiten: Einheit[]; blockers: Record<string, string>; queue: string[] } {
  const zeilen = md.split(/\r?\n/);
  const einheiten: Einheit[] = [];
  const blockers: Record<string, string> = {};
  /** `<!-- @queue: A, B, C -->` — die EINE maschinenlesbare Prioritäts-Quelle.
   *  Ohne sie behaupten Prosa-Dekrete eine Reihenfolge, die next.ts (pos-Sort)
   *  nie sieht — Befund 24.7.2026: vier gestapelte Dekrete, plan:next meldete
   *  einen Querschnitt-Schritt als «obersten». Integrität erzwingt check.ts Regel 8. */
  let queue: string[] = [];
  let sektion = '';
  let imBlockers = false;

  for (let i = 0; i < zeilen.length; i++) {
    const z = zeilen[i];
    if (z.startsWith('## ')) {
      // Sektion = Überschriftstext ohne Marker/Emoji und ohne Tail (— … / *(…)*)
      sektion = z.replace(/^##+\s+/, '').replace(/^[⚡🚀▶■\s]+/u, '').replace(/\s+—.*$/, '').replace(/\s+\*.*$/, '').trim();
    }
    const qm = z.match(/<!--\s*@queue:\s*(.*?)\s*-->/);
    if (qm) {
      queue = qm[1].split(',').map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (z.trim().startsWith('<!-- @blockers')) {
      imBlockers = !z.includes('-->');
      if (!imBlockers) {
        const innen = z.replace(/.*<!--\s*@blockers/, '').replace(/-->.*/, '');
        for (const teil of innen.split(/[;\n]/)) {
          const bm = teil.match(/^\s*([^:]+):\s*(.+)$/);
          if (bm) blockers[bm[1].trim()] = bm[2].trim();
        }
      }
      continue;
    }
    if (imBlockers) {
      if (z.trim().startsWith('-->')) { imBlockers = false; continue; }
      const bm = z.match(/^\s*([^:]+):\s*(.*)$/);
      if (bm) blockers[bm[1].trim()] = bm[2].trim();
      continue;
    }
    if (z.includes('<!-- @meta')) {
      const etikett = parseEtikett(z);
      const { checkbox } = bindeCheckbox(zeilen, i);
      einheiten.push({ id: etikett.id, etikett, checkbox, sektion, pos: einheiten.length });
    }
  }
  return { einheiten, blockers, queue };
}

/**
 * Die Chronik — `ROADMAP-CHRONIK.md`, das Wortlaut-Archiv erledigter Schritte.
 *
 * Sie ist die ZWEITE Fundstelle für eine Schritt-ID (die erste und massgebliche
 * bleibt `ROADMAP.md`). Ohne sie wäre der ROADMAP-Deckel von 120 KiB nicht mehr
 * senkbar: ein erledigter Schritt, auf den irgendein lebender Schritt noch `dep`
 * hält, müsste bis in alle Ewigkeit in der ROADMAP stehen bleiben, weil check.ts
 * Regel 4 seine ID sonst als «existiert nicht» meldet (Messung 14.9.2026: fünf
 * Bytes Luft unter dem Ceiling, vier Schritte durch genau diese Kante gesperrt).
 */
export const CHRONIK_DATEI = 'ROADMAP-CHRONIK.md';

/**
 * Was die Chronik über archivierte Schritt-IDs weiss.
 *
 * WARUM nicht einfach eine Menge erledigter IDs: die Chronik ist ein
 * WORTLAUT-Archiv, kein Status-Register. Sie friert den Text eines Schrittes
 * samt des damals gültigen `status:` ein und wird nie nachgeführt (Messung
 * 15.9.2026: 83 Anker, davon 16 mit `ready`/`wip` — historische Zwischenstände).
 * Wer sie als Status-Quelle liest, muss diesen Unterschied sehen können, sonst
 * gilt ein damals halbfertiger Schritt heute still als erledigt.
 */
export interface ChronikWissen {
  /** IDs, die die Chronik eindeutig als `done` archiviert — nur diese erfüllen ein `dep`. */
  done: ReadonlySet<string>;
  /** ID → archivierter Status, für die Fehlermeldung («steht als wip, nicht als done»). */
  status: ReadonlyMap<string, string>;
  /** IDs, die die Chronik MEHRFACH mit VERSCHIEDENEM Status führt — nicht auflösbar. */
  mehrdeutig: ReadonlySet<string>;
}

/**
 * Liest die `@meta`-Anker der Chronik.
 *
 * Dieselbe Erkennung wie `parseRoadmap` (`<!-- @meta`, `parseEtikett`) statt einer
 * eigenen Regex — zwei Leseregeln für dasselbe Format wären zwei Wahrheiten (§5),
 * und sie könnten nur still auseinanderlaufen.
 *
 * Eine NICHT parsebare Anker-Zeile wird übersprungen statt geworfen: die Chronik
 * ist ein halbe Megabyte grosses Archiv mit Anker-Formen aus einem Jahr Bauzeit
 * (der Parser toleriert gestrichene Felder ausdrücklich, s. etikett.ts), und ein
 * Absturz beim Lesen des ARCHIVS würde `plan:next`, `check:plan` und `plan:bild`
 * gleichzeitig lahmlegen. Die Folge eines übersprungenen Ankers ist die sichere
 * Richtung: sein `dep`-Ziel gilt als «existiert nicht» und wird laut gemeldet.
 */
export function chronikErledigte(md: string | null): ChronikWissen {
  const status = new Map<string, string>();
  const mehrdeutig = new Set<string>();
  if (!md) return { done: new Set(), status, mehrdeutig };
  for (const z of md.split(/\r?\n/)) {
    if (!z.includes('<!-- @meta')) continue;
    let e: Etikett;
    try {
      e = parseEtikett(z);
    } catch {
      continue;
    }
    const bisher = status.get(e.id);
    // Mehrfach mit GLEICHEM Status ist eindeutig (Bestandsform: `W2·23-STARTSEITE-V4`
    // steht 2× als done). Erst ein WIDERSPRUCH macht die Auflösung unmöglich.
    if (bisher !== undefined && bisher !== e.status) mehrdeutig.add(e.id);
    else status.set(e.id, e.status);
  }
  const done = new Set<string>();
  for (const [id, st] of status) if (st === 'done' && !mehrdeutig.has(id)) done.add(id);
  return { done, status, mehrdeutig };
}

/**
 * Datei-Leser der Plan-Werkzeuge: Inhalt oder `null`, wenn nicht lesbar.
 *
 * Lag bis 15.9.2026 in check.ts. Der Umzug ist kein Stil, sondern Notwehr: die
 * CLI-Einstiege (next.ts, set.ts, bildSeiten.ts, bildBau.ts) brauchen denselben
 * Leser, und ein Import aus check.ts zöge dessen CLI-Block als Nebenwirkung mit
 * — er liest ROADMAP.md und ruft bei Funden `process.exit(1)`, mitten in einem
 * fremden Werkzeug (dieselbe Falle, die marker.ts in ihrem Kopf beschreibt).
 * check.ts re-exportiert das Symbol, damit bestehende Importe gültig bleiben.
 */
export const dateiLeser = (p: string): string | null => (existsSync(p) ? readFileSync(p, 'utf8') : null);

/**
 * Die `done`-IDs der Chronik von der Platte — die eine Verkettung aus
 * `dateiLeser` + `CHRONIK_DATEI` + `chronikErledigte`, statt sie an jedem der
 * vier CLI-Einstiege zu wiederholen (§5). Genau diese Menge gehört in
 * `resolve(einheiten, queue, ...)`.
 */
export function ladeChronikDone(leser: (p: string) => string | null = dateiLeser): ReadonlySet<string> {
  return chronikErledigte(leser(CHRONIK_DATEI)).done;
}
