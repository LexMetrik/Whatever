// scripts/plan/bildDaten.ts — Datensammler des Lagebild-Generators
// (Schritt QS-PLAN-BILD, Mehrseiten-Ausbau Go David 4.8.2026).
//
// Alle vier Seiten beziehen ihre Zahlen ausschliesslich von hier. Zwei Regeln
// gelten in dieser Datei ohne Ausnahme:
//
//  * **Keine zweite Wahrheit (§5).** Plan-Zahlen kommen aus `parseRoadmap`/
//    `resolve` (dieselben Funktionen wie `plan:next`), Werkzeug-Zahlen aus
//    `ALLE_KARTEN`, Korpus-Zahlen aus den Registern. Kein Regex-Nachbau über
//    Quelldateien, keine gepflegten Doppelzählungen.
//  * **Degradieren statt raten (§8).** Fällt eine Quelle aus (kein `gh`, kein
//    Register), liefert der Sammler `null`; die Seite zeigt dann sichtbar
//    «—» bzw. einen Hinweis — nie eine geschätzte Zahl.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { laufeEcht, parseWorktrees, type Laufe } from './lage';
import { BULLET_RE } from './parse';
import type { Einheit } from './parse';
import { kollidiert } from './aufloesen';
import { headings, trefferFuer } from '../fahrplanSlicerKern';
import { ALLE_KARTEN } from '../../src/lib/startseiteConfig';
import { SEKTIONEN, VORLAGE_SEKTIONEN, type Status as KartenStatus } from '../../src/lib/startseiteConfigTypen';

/** Kommando ausführen; scheitert es, ist das Ergebnis `null` (sichtbare Degradation). */
export function sh(cmd: string, args: string[]): string | null {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Plan-Schicht: Klartext-Titel, Fahrplan-Selbstbeschreibung
// ---------------------------------------------------------------------------
export const OHNE_FAHRPLAN = { name: 'Einzelposten ohne Fahrplan', zweck: 'Schritte, deren Detail direkt im Plan steht.' };

/** Liest `<!-- @lagebild name: … · zweck: … -->` aus dem Kopf der Fahrplan-Datei. */
export function baustellenInfo(fahrplanPfad: string): { name: string; zweck: string } {
  const basis = fahrplanPfad.replace(/^.*\//, '');
  const fallback = { name: basis.replace(/^FAHRPLAN-|\.md$/g, '').replace(/-/g, ' '), zweck: `Detailplan: ${basis}` };
  try {
    const kopf = readFileSync(fahrplanPfad, 'utf8').split('\n').slice(0, 12).join('\n');
    const m = kopf.match(/<!--\s*@lagebild\s+name:\s*(.+?)\s*·\s*zweck:\s*(.+?)\s*-->/);
    return m ? { name: m[1], zweck: m[2] } : fallback;
  } catch {
    return fallback;
  }
}

// Titel-Overrides für Schritte, deren ROADMAP-Block kein normales
// «Checkbox-Zeile mit Bold-Titel direkt über dem @meta»-Format hat
// (QS-TOK: Blockzitat-Dekret · W2·5k: Bold-Titel liegt mehrere Prosazeilen
// über dem Etikett). Nur Form-Ausnahmen — normale Schritte NIE hier eintragen.
const TITEL_OVERRIDE: Record<string, string> = {
  'QS-TOK': 'Token-Verbrauch minimieren (Doku- und Prozess-Diät)',
  'W2·5k-LINIEN-KONZEPT': 'Linienführung tiefer Kodifikationen neu konzipieren',
};

export interface SchrittInfo {
  titel: string;
  prosa: string;
  par: string | null;
  /** Pfade hinter `**Befunde:**`/`**Dossier:**` — Pflichtlektüre des Schritts. */
  pflicht: string[];
  /** Im ROADMAP genannter §-Anker, der im Ziel-Fahrplan NICHT auflöst.
   *  Wird im Prompt benannt statt still verschluckt (§8) — sonst bliebe der
   *  Plan-Datenfehler unsichtbar (§17). */
  ankerDefekt: string | null;
  /** true, wenn der Wortlaut gekappt wurde (der Prompt sagt das dann dazu). */
  gekuerzt: boolean;
  /** Checkliste eines Dach-Schritts (Entstückelung 8.8.2026): `- [ ]`-Positionen
   *  UNTER dem @meta. Ohne diese Erfassung wüsste weder Prompt noch Lagebild,
   *  dass ein Schritt aus Positionen besteht — der Prompt riete dann zu
   *  «Unterschritt bauen», den es nicht mehr gibt. */
  checkliste: { offen: number; gesamt: number; offenTexte: string[] } | null;
}

/** Offene Fragen an David aus dem `@david-fragen`-Block der ROADMAP.
 *  Bis 8.8.2026 waren diese Fragen als Konstante im Seiten-Code gepflegt —
 *  eine zweite Wahrheit (§5): beantwortet blieb dort stehen, bis jemand den
 *  Code anfasste. Jetzt gilt: Zeile im Plan gelöscht = Frage weg von der Seite. */
export function davidFragen(md: string): { frage: string; quelle: string }[] {
  const block = md.match(/<!--\s*@david-fragen\n([\s\S]*?)-->/);
  if (!block) return [];
  const out: { frage: string; quelle: string }[] = [];
  for (const zeile of block[1].split('\n')) {
    const m = zeile.match(/^\s*[\w§ÄÖÜäöü-]+:\s*(.+?)\s*·\s*quelle:\s*(.+?)\s*$/);
    if (m) out.push({ frage: m[1], quelle: m[2] });
  }
  return out;
}

/**
 * Zahl der `@david-fragen`-Zeilen, die `davidFragen` NICHT lesen konnte.
 *
 * Der Regex dort verlangt `<schlüssel>: <Frage> · quelle: <Ort>`; eine Zeile
 * ohne `· quelle:` fiel bisher stumm aus der Anzeige. Verifiziert 8.9.2026:
 * die einzige eingetragene Frage (`zgb-a36-anhang`, mit fertiger Empfehlung)
 * war David nie sichtbar — stumm schlucken ist die Fehlerklasse (§8, §17).
 * Diese Funktion macht den Verlust ZÄHLBAR, damit die Seite ihn ausweisen
 * kann; der tolerante Regex bzw. der `check:plan`-Wächter ist ein eigener,
 * deklarierter Schritt.
 */
export function davidFragenVerworfen(md: string): number {
  const block = md.match(/<!--\s*@david-fragen\n([\s\S]*?)-->/);
  if (!block) return 0;
  const roh = block[1].split('\n').filter((z) => /^\s*[\w§ÄÖÜäöü-]+:\s*\S/.test(z)).length;
  return Math.max(0, roh - davidFragen(md).length);
}

/** Marker, der eine Kappung im Prompt UNÜBERSEHBAR macht. Ein blosses «…»
 *  las sich wie ein Auslassungszeichen im Zitat — der Prüf-Agent 4.8.2026
 *  bemerkte darum nicht, dass QS-EXTQUELLEN die David-Lizenzfrage und
 *  QS-AUTOMATIK-PARITAET den am 4.8. erweiterten Scope verloren hatte. */
const GEKUERZT_MARKER = ' … [gekürzt — der Schritt-Wortlaut in ROADMAP.md ist massgeblich und MUSS vollständig gelesen werden]';

/** Löst der §-Anker im Ziel-Fahrplan tatsächlich auf?
 *
 *  Der Bau-Prompt druckt den Anker als fertigen Befehl. Ein Anker, der ins
 *  Leere zeigt, ist darum schlimmer als keiner: er schickt die Session in
 *  einen Slicer-Lauf mit Exit 1. Belegter Fall 4.8.2026 — `W2·5k` verweist auf
 *  «§L-3/A28», `FAHRPLAN-GESETZESDARSTELLUNG-V2.md` kennt weder L-3 noch A28
 *  (Plan-Datenfehler, nicht Generator-Fehler); der Prompt fällt jetzt auf den
 *  ehrlichen `<§>`-Platzhalter zurück.
 *
 *  Geprüft wird mit `trefferFuer()` aus `scripts/fahrplanSlicerKern.ts` — der
 *  Auflösungs-Logik des Slicers selbst, nicht mit einem Nachbau (§5). */
function ankerLoestAuf(fahrplanPfad: string, anker: string): boolean {
  try {
    return trefferFuer(headings(readFileSync(fahrplanPfad, 'utf8')), anker).length > 0;
  } catch {
    // Datei nicht lesbar: den Anker nicht behaupten (degradieren statt raten).
    return false;
  }
}

/** Kappungsgrenze — EINE für alle Schritte.
 *
 *  Die frühere Grenze 700 kappte acht Einheiten. Sie beruhte auf der Annahme,
 *  ein `fahrplan:`-Feld trage das Detail ohnehin ein zweites Mal. Die Annahme
 *  ist falsch: `QS-AUTOMATIK-PARITAET` HAT einen Fahrplan, aber der am
 *  4.8.2026 nachgetragene Scope (`check:suchindex`, `check:rss-oc`,
 *  `report:confidence`) stand damals NUR in ROADMAP.md (geprüft 4.8.2026;
 *  seither in `FAHRPLAN-BASIS-AUSBAU.md` §3-N.5 übernommen — Faktenkorrektur
 *  8.8.2026). Ein Prompt, der ihn wegschneidet, baut am Auftrag vorbei.
 *
 *  1600 ist kein Kompromiss, sondern gemessen: der längste Wortlaut im
 *  gesamten Plan hat 1534 Zeichen (QS-CI-VERCEL), die Grenze kappt heute
 *  also NICHTS. Sie bleibt als Sicherung gegen künftige Ausreisser stehen —
 *  zusammen mit dem Marker, der jede Kappung sichtbar macht. */
const KAPPUNG = 1600;

/** Auf Wortgrenze schneiden und die Kappung explizit ausweisen. */
function kappe(text: string, grenze: number): { text: string; gekuerzt: boolean } {
  if (text.length <= grenze) return { text, gekuerzt: false };
  const roh = text.slice(0, grenze);
  const letzteLuecke = roh.lastIndexOf(' ');
  // Wortgrenze nur nehmen, wenn sie nicht absurd weit vorne liegt (ein
  // einziges Riesenwort darf die Kappung nicht auf ein Fragment eindampfen).
  const geschnitten = letzteLuecke > grenze * 0.6 ? roh.slice(0, letzteLuecke) : roh;
  return { text: `${geschnitten.replace(/[\s,;:·—–-]+$/, '')}${GEKUERZT_MARKER}`, gekuerzt: true };
}

/**
 * Erster Satz eines Auftrags-Wortlauts — für die kompakte «1-Satz-Ziel»-Vorschau
 * der nächsten Schritte (Auftrag David 14.8.2026). Heuristik: bis zum ersten
 * Satzzeichen (. ! ?) gefolgt von Leerraum, sonst bis zu einer Wortgrenze
 * innerhalb `maxLen`. Kein Anspruch auf linguistische Korrektheit — eine
 * Abkürzung («z. B.») kann vorzeitig trennen. Für eine Ein-Satz-Vorschau ist
 * das Risiko ein zu kurzer statt ein falscher Satz, darum bewusst in Kauf
 * genommen (derselbe Kompromiss wie `kappe()` oben).
 */
export function ersterSatz(prosa: string, maxLen = 170): string {
  if (!prosa) return '';
  const m = prosa.match(/^.{8,}?[.!?](?=\s|$)/);
  if (m && m[0].length <= maxLen) return m[0];
  if (prosa.length <= maxLen) return prosa;
  const roh = prosa.slice(0, maxLen);
  const luecke = roh.lastIndexOf(' ');
  const geschnitten = luecke > maxLen * 0.6 ? roh.slice(0, luecke) : roh;
  return `${geschnitten.replace(/[\s,;:·—–-]+$/, '')}…`;
}

/**
 * Ein-Satz-Ziel für die Hauptseite: wie `ersterSatz`, aber OHNE den
 * Herkunfts-Vermerk, mit dem jeder Auftrags-Wortlaut im Bestand öffnet
 * («(W2·13-KANTONE-DATEN, Aufteilung 8.8.2026, sortenrein) Skill …»).
 *
 * Der Vermerk ist Plan-Buchhaltung: er nennt Schritt-ID und Entstehungsdatum.
 * Auf der Hauptseite ist er genau das Kürzel, das dort nicht stehen soll
 * (Auftrag David 8.9.2026) — und ohne ihn beginnt die Vorschau beim Ziel
 * statt bei der Herkunft. Gekappt wird nur, wenn die Klammer TATSÄCHLICH mit
 * der ID dieses Schritts öffnet: sonst schnitte die Funktion einem Wortlaut,
 * der mit einer inhaltlichen Klammer beginnt, den Anfang weg (§8).
 */
export function zielSatz(prosa: string, id: string, maxLen = 95): string | null {
  if (!prosa) return null;
  const vermerk = prosa.match(/^\(([^()]*)\)\s*/);
  const rest = vermerk && vermerk[1].startsWith(id) ? prosa.slice(vermerk[0].length) : prosa;
  return ersterSatz(rest, maxLen) || null;
}

/** Markdown-Zeile(n) → Klartext (Links auf ihren Text, Auszeichnung weg). */
export function klartext(s: string): string {
  return s
    .replace(/<!--.*?-->/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .replace(/^\s*-\s*\[.\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trägt Zeile `j` eine Plan-EINHEIT (Listen-Bullet, Überschrift, Dekret-Kopf)?
 *
 *  Der Rückwärts-Scan nahm bis 4.8.2026 die erste `**fett**`-Passage JEDER
 *  Zeile — auch aus Fliesstext. `QS-PERF` bekam so den Titel «protokolliertem
 *  SKIP» aus einer Fortsetzungszeile, während die echte Einheiten-Zeile
 *  («Geräte-Last / Performance») vier Zeilen höher stand. Die Bullet-Grammatik
 *  kommt aus `parse.ts` — dieselbe Wahrheit wie Parser und Wächter (§5), kein
 *  zweiter Regex.
 *
 *  Dritte Form: der **Dekret-Block** (`QS-TOK`) ist ein Blockzitat ohne Bullet.
 *  Sein Kopf ist die ERSTE Zeile des Zitat-Absatzes und beginnt mit einer
 *  Bold-Passage; die Fortsetzungszeilen desselben Absatzes beginnen teils
 *  ebenfalls fett (`> **\`ready\`** statt …`) und dürfen NICHT als Kopf gelten.
 *  Das unterscheidet die Absatz-Grenze: davor steht keine Zitatzeile. */
function istEinheitenZeile(zeilen: string[], j: number): boolean {
  const zeile = zeilen[j];
  if (BULLET_RE.test(zeile) || /^\s*#{1,6}\s/.test(zeile)) return true;
  const zitatKopf = /^\s*>\s*\*\*/.test(zeile);
  return zitatKopf && !/^\s*>/.test(zeilen[j - 1] ?? '');
}

/** Je Schritt aus ROADMAP.md: Klartext-Titel (Bold-Passage der EINHEITEN-Zeile),
 *  Auftrags-Wortlaut (Einheiten-Zeile bis zum @meta, an der Wortgrenze gekappt),
 *  der §-Anker hinter «Detail:»/«Bau-Spec:» und die Pflichtlektüre hinter
 *  «Befunde:»/«Dossier:». */
export function schrittInfoAusRoadmap(
  md: string,
  /** Offene Posten je Dach-ID (Titel-Liste), aus `plan/posten/`.
   *  Seit dem Posten-Modell (20.9.2026, QS-EFFIZIENZ) steht der Bestand eines
   *  Dach-Schritts NICHT mehr als eingerückte `- [ ]`-Zeile in ROADMAP.md,
   *  sondern je Posten in einer eigenen Datei. Ohne diesen Parameter zählte das
   *  Lagebild nach der Migration null Positionen und riete zu «Unterschritt
   *  bauen», den es in der Datei nicht mehr gibt — dieselbe Falle, gegen die
   *  die Entstückelungs-Erfassung 8.8.2026 gebaut wurde, nur andersherum. */
  postenTitel: ReadonlyMap<string, string[]> = new Map(),
): Map<string, SchrittInfo> {
  const zeilen = md.split('\n');
  const info = new Map<string, SchrittInfo>();
  for (let i = 0; i < zeilen.length; i++) {
    // Feld-Trenner ist « · » MIT Leerzeichen — die IDs selbst tragen den
    // Mittelpunkt (W2·13-…), er darf die Erfassung also nicht beenden.
    const m = zeilen[i].match(/@meta id:\s*(.+?)\s+·/);
    if (!m) continue;
    const id = m[1];
    let titel = '';
    let prosa = '';
    let par: string | null = null;
    let pflicht: string[] = [];
    let gekuerzt = false;
    let ankerDefekt: string | null = null;
    let checkliste: SchrittInfo['checkliste'] = null;
    for (let j = i - 1; j >= Math.max(0, i - 12); j--) {
      if (!istEinheitenZeile(zeilen, j)) continue;
      const fett = zeilen[j].match(/\*\*(.+?)\*\*/);
      if (!fett) continue;
      titel = fett[1]
        .replace(/`/g, '')
        .replace(new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*·\\s*`), '')
        .replace(/^[^·]{1,18}·\s*/, '') // Kurz-ID-Präfix («5-PRAXIS · …»)
        .replace(/^\+\s*/, '') // Fortsetzungs-Plus («+ Auftrags-Eingang …», W3·14-S)
        .trim();
      // NACHBLOCK (Entstückelung 8.8.2026): Beschreibung, Detail-Anker und
      // Checkliste eines Dach-Schritts stehen NACH dem @meta. Der frühere
      // Nur-Vorblock-Scan lieferte für solche Schritte einen fast leeren
      // «Auftrags-Wortlaut» (nur den Klammer-Zusatz der Titelzeile) — der
      // Prompt baute damit am Auftrag vorbei. Grenzen: nächstes @meta,
      // nächste Top-Level-Einheit, etikettierter Unterschritt, Überschrift.
      const nachProsa: string[] = [];
      let chkOffen = 0;
      let chkGesamt = 0;
      const chkOffenTexte: string[] = [];
      for (let k = i + 1; k < Math.min(zeilen.length, i + 60); k++) {
        const z = zeilen[k];
        if (/^\s*<!-- @meta/.test(z)) break;
        if (/^#{1,6}\s/.test(z) || /^---/.test(z) || /^- /.test(z)) break;
        if (/^\s+- /.test(z) && /@meta id:/.test(zeilen[k + 1] ?? '')) break;
        const chk = z.match(/^\s+-\s\[([ xX])\]\s*(.*)$/);
        if (chk) {
          chkGesamt++;
          if (chk[1] === ' ') {
            chkOffen++;
            if (chkOffenTexte.length < 12) chkOffenTexte.push(klartext(chk[2]));
          }
          continue;
        }
        if (z.trim()) nachProsa.push(z);
      }
      for (const t of postenTitel.get(id) ?? []) {
        chkGesamt++;
        chkOffen++;
        if (chkOffenTexte.length < 12) chkOffenTexte.push(klartext(t));
      }
      checkliste = chkGesamt > 0 ? { offen: chkOffen, gesamt: chkGesamt, offenTexte: chkOffenTexte } : null;
      const block = [...zeilen.slice(j, i), ...nachProsa].join(' ');
      // Die fette ID·Titel-Passage steht bereits im Einleitungssatz des
      // Bau-Prompts. Sie ein zweites Mal im Wortlaut mitzuschleppen kostete
      // bis zu 90 Zeichen der Kappungsgrenze — bei QS-EXTQUELLEN genau die,
      // die am Ende für die David-Lizenzfrage fehlten.
      const ohneTitel = block.replace(fett[0], '');
      const roh = klartext(ohneTitel).replace(/^[\s·—–-]+/, '');
      ({ text: prosa, gekuerzt } = kappe(roh, KAPPUNG));
      // §-Anker NUR aus dem eigenen Block (Einheiten-Zeile bis @meta) und nur
      // hinter einem ausdrücklichen «Detail:»/«Bau-Spec:» — ein weiteres
      // Fenster fischte im Test den §-Verweis des VORHERIGEN Schritts
      // (W2·13 bekam «§20»). Die Schreibweise «**Detail:** [Datei](…) §N»
      // ist Konvention (FAHRPLAN-PLAN-STEUERUNG.md, Lagebild-§): sie wird
      // hier maschinell gelesen und macht den Bau-Prompt konkret.
      const teile = block.split(/\*\*(?:Detail|Bau-Spec):\*\*|(?:Detail|Bau-Spec):/);
      if (teile.length > 1) {
        const nachDetail = teile[teile.length - 1];
        // §§-Bereiche («§§3–§7») nicht auf den ersten § verkürzen — dann
        // lieber der ehrliche Platzhalter als ein irreführender Teil-Slice.
        if (!/§§|–\s*§/.test(nachDetail)) {
          par =
            nachDetail.match(/§«([^»]+)»/)?.[1] ??
            nachDetail.match(/§\s*(\d+(?:\.\d+)*)/)?.[1] ??
            // Buchstaben-Anker («§S», «§STRANG»): die Fahrpläne nummerieren
            // Abschnitte teils mit Buchstaben; `fahrplan-slice.ts` löst sie
            // auf. Nur GROSS beginnend — sonst finge «§siehe» an zu ankern.
            nachDetail.match(/§\s*([A-ZÄÖÜ][A-Za-z0-9ÄÖÜäöü·-]*)/)?.[1] ??
            null;
        }
      }
      // Anker gegen den Ziel-Fahrplan verproben — ein nicht auflösender Anker
      // wird verworfen (s. ankerLoestAuf) und im Prompt benannt.
      const fahrplanPfad = zeilen[i].match(/·\s*fahrplan:\s*(\S+)/)?.[1] ?? null;
      if (par && (!fahrplanPfad || !ankerLoestAuf(fahrplanPfad, par))) {
        ankerDefekt = par;
        par = null;
      }
      // Pflichtlektüre: Dossiers/Befundlisten, die der Schritt voraussetzt.
      // Ohne diese Zeile ging der Link im gekappten Wortlaut verloren.
      pflicht = [...block.matchAll(/(?:\*\*)?(?:Befunde|Dossier):(?:\*\*)?\s*\[[^\]]*\]\(([^)]+)\)/g)].map((x) => x[1]);
      break;
    }
    if (titel) info.set(id, { titel, prosa, par, pflicht, gekuerzt, ankerDefekt, checkliste });
  }
  for (const [id, t] of Object.entries(TITEL_OVERRIDE)) {
    const alt = info.get(id);
    info.set(id, {
      titel: t,
      prosa: alt?.prosa ?? '',
      par: alt?.par ?? null,
      pflicht: alt?.pflicht ?? [],
      gekuerzt: alt?.gekuerzt ?? false,
      ankerDefekt: alt?.ankerDefekt ?? null,
      checkliste: alt?.checkliste ?? null,
    });
  }
  return info;
}

export function schrittIdInTitel(titel: string): string | null {
  const m = titel.match(/\b(QS-[A-ZÄÖÜ0-9-]+|W\d·[\wÄÖÜäöü·-]+)\b/);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Verknüpfungen — «was verbindet diesen Schritt mit anderen?» (Auftrag David
// 14.8.2026: «zeigen was miteinander verknüpft ist»). Drei Kanten je Schritt,
// alle aus bereits vorhandenen Etikett-Feldern — keine neue Datenquelle:
//
//  * dep (vorwärts UND rückwärts): `wartetAuf` sind die eigenen offenen
//    Voraussetzungen, `blockiert` die anderen offenen Schritte, die IHRERSEITS
//    auf diesen warten. Beides steckt in `etikett.dep`, nur die Blick-Richtung
//    dreht sich um.
//  * feldPartner: andere offene Schritte mit DEMSELBEN `feld:` — also NICHT
//    parallel bearbeitbar. Dieselbe Regel wie die Lane-Bildung in `resolve()`
//    (`kollidiert()` aus aufloesen.ts, §5), kein zweiter Nachbau. Ein Schritt
//    OHNE eigenes Feld bekommt keine Partner-Liste: `kollidiert(null, x)` gilt
//    konservativ als «kollidiert mit allem» (eigene Lane) — das für JEDEN
//    anderen Schritt einzeln aufzuzählen wäre keine Information, nur Lärm.
//  * fahrplanPartner: andere offene Schritte mit demselben `fahrplan:`-Wert —
//    dieselbe Baustelle, dasselbe Detail-Dokument.
// ---------------------------------------------------------------------------
export interface Verknuepfung {
  wartetAuf: string[];
  blockiert: string[];
  feldPartner: string[];
  fahrplanPartner: string[];
}

/** Verknüpfungen ALLER offenen Schritte in einem Durchlauf (§n² über `offen`,
 *  bei ~60 Schritten unmessbar — kein Cache nötig). */
export function verknuepfungenAusEinheiten(einheiten: Einheit[]): Map<string, Verknuepfung> {
  const offen = einheiten.filter((e) => e.etikett.status !== 'done');
  const doneIds = new Set(einheiten.filter((e) => e.etikett.status === 'done').map((e) => e.id));
  const out = new Map<string, Verknuepfung>();
  for (const e of offen) {
    const wartetAuf = e.etikett.dep.filter((d) => !doneIds.has(d));
    const blockiert = offen.filter((o) => o.id !== e.id && o.etikett.dep.includes(e.id)).map((o) => o.id);
    const feldPartner =
      e.etikett.feld === null
        ? []
        : offen
            .filter((o) => o.id !== e.id && o.etikett.feld !== null && kollidiert(e.etikett.feld, o.etikett.feld))
            .map((o) => o.id);
    const fahrplanPartner = e.etikett.fahrplan
      ? offen.filter((o) => o.id !== e.id && o.etikett.fahrplan === e.etikett.fahrplan).map((o) => o.id)
      : [];
    out.set(e.id, { wartetAuf, blockiert, feldPartner, fahrplanPartner });
  }
  return out;
}

// ---------------------------------------------------------------------------
// git / GitHub
// ---------------------------------------------------------------------------
/** origin-Remote → https-Basis für PR-Links (null, wenn nicht ableitbar). */
export function repoWebUrl(): string | null {
  const raw = sh('git', ['remote', 'get-url', 'origin']);
  if (!raw) return null;
  const m = raw.trim().match(/github\.com[:/](.+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}` : null;
}

export interface GelandetPr { number: number; title: string; mergedAt: string; roadmapId: string | null }
export function zuletztGelandet(): GelandetPr[] | null {
  const raw = sh('gh', ['pr', 'list', '--state', 'merged', '--limit', '5', '--json', 'number,title,mergedAt']);
  if (raw === null) return null;
  try {
    const prs = JSON.parse(raw) as { number: number; title: string; mergedAt: string }[];
    return prs.map((p) => ({ ...p, roadmapId: schrittIdInTitel(p.title) }));
  } catch {
    return null;
  }
}

/** Jüngster abgeschlossener Workflow-Lauf auf main — die «ist main gesund?»-Ampel. */
export function mainAmpel(): { gruen: boolean; name: string; wann: string } | null {
  const raw = sh('gh', ['run', 'list', '--branch', 'main', '--limit', '10', '--json', 'conclusion,status,workflowName,updatedAt']);
  if (raw === null) return null;
  try {
    const runs = JSON.parse(raw) as { conclusion: string | null; status: string; workflowName: string; updatedAt: string }[];
    // «cancelled» heisst «von einem neueren Push abgelöst», nicht «kaputt» —
    // solche Läufe überspringen, sonst zeigt die Ampel nach jeder schnellen
    // Push-Folge fälschlich rot (Befund David 4.8.2026, Ampel zeigte ROT bei
    // grünem jüngstem Voll-Lauf). «skipped» analog.
    const fertig = runs.find((r) => r.status === 'completed' && r.conclusion && !['cancelled', 'skipped'].includes(r.conclusion));
    if (!fertig) return null;
    return {
      gruen: fertig.conclusion === 'success',
      name: fertig.workflowName,
      wann: new Date(fertig.updatedAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' }),
    };
  } catch {
    return null;
  }
}

/** Seit wie vielen Tagen ein Blocker-String in ROADMAP.md steht (git-Historie). */
export function blockerSeitTagen(blocker: string): number | null {
  const raw = sh('git', ['log', '--format=%ct', '-S', blocker, '--', 'ROADMAP.md']);
  const aeltester = raw?.trim().split('\n').filter(Boolean).pop();
  if (!aeltester) return null;
  return Math.floor((Date.now() / 1000 - Number(aeltester)) / 86400);
}

export interface PrInfo { number: number; title: string; headRefName: string; roadmapId: string | null; checks: string }
export function offenePrs(): PrInfo[] | null {
  const raw = sh('gh', ['pr', 'list', '--state', 'open', '--json', 'number,title,headRefName,statusCheckRollup', '--limit', '30']);
  if (raw === null) return null;
  try {
    const prs = JSON.parse(raw) as { number: number; title: string; headRefName: string; statusCheckRollup: { conclusion?: string; status?: string }[] | null }[];
    return prs.map((p) => {
      const rollup = p.statusCheckRollup ?? [];
      const fertig = rollup.filter((c) => c.status === 'COMPLETED' || c.conclusion);
      const rot = rollup.some((c) => ['FAILURE', 'TIMED_OUT', 'CANCELLED'].includes(c.conclusion ?? ''));
      const checks = rollup.length === 0 ? 'keine Checks' : rot ? 'Checks ROT' : fertig.length === rollup.length ? 'Checks grün' : 'Checks laufen';
      return { number: p.number, title: p.title, headRefName: p.headRefName, roadmapId: schrittIdInTitel(p.title), checks };
    });
  } catch {
    return null;
  }
}

/** Nur was ein Leser wissen muss: aktive Worktrees (= laufende Bau-Plätze) und
 *  die ZAHL der übrigen Alt-Branches — die Langliste würde die Seite fluten
 *  (Übersichtlichkeits-Auflage David 4.8.2026; das Abräumen selbst ist
 *  QS-AUTOMATIK-BERICHT, nicht Sache dieser Anzeige). */
export function worktreesUndBranches(): { worktrees: string[]; altBranches: number } {
  const wt = (sh('git', ['worktree', 'list', '--porcelain']) ?? '')
    .split('\n\n')
    .map((b) => {
      const pfad = b.match(/^worktree (.+)$/m)?.[1] ?? '';
      if (!pfad || pfad.endsWith('/LexMetrik')) return '';
      return pfad.split('/').pop() ?? '';
    })
    .filter(Boolean);
  const alt = (sh('git', ['branch', '--format=%(refname:short)']) ?? '')
    .split('\n')
    .filter((b) => b && b !== 'main' && !wt.some((w) => b.endsWith(w))).length;
  return { worktrees: wt, altBranches: alt };
}

/** Alle lokalen Branch-Namen (für die wip-Verstoss-Sonde). */
export function branchNamen(): string[] {
  return (sh('git', ['branch', '--format=%(refname:short)']) ?? '').split('\n').filter(Boolean);
}

// ---------------------------------------------------------------------------
// Laien-Block «Was gerade passiert» — Zulieferung (Schritt QS-PLAN-BILD-LAGE)
//
// Beide Sammler nehmen ihren Kommando-Runner als Parameter und laufen per
// Default mit `laufeEcht` aus lage.ts — DEM Runner mit hartem Timeout (5 s).
// Zwei Gründe, warum hier nicht `sh()` genügt: (a) der Block steht ganz oben
// auf der Einstiegsseite, ein hängendes git dürfte sie nicht blockieren;
// (b) ein injizierbarer Runner macht die Sammler ohne echtes git testbar
// (§6.7 — ein Fehlerpfad, der nur auf einer kaputten Maschine auftritt, wird
// nie geprüft). Die Worktree-Zerlegung kommt aus `parseWorktrees` derselben
// Datei, nicht aus einem zweiten Regex (§5).
// ---------------------------------------------------------------------------

/**
 * Zahl paralleler Bau-Plätze (Worktrees ohne das Haupt-Repo).
 *
 * `null` heisst «nicht abfragbar», nie «keine» — `worktreesUndBranches()`
 * kann das nicht unterscheiden (`sh()` liefert dort bei Ausfall `''`, was zu
 * einer leeren Liste zerfällt). Für einen Laien-Satz ist der Unterschied
 * zwischen «keine parallelen Bauplätze» und «weiss ich gerade nicht» aber
 * genau der zwischen Aussage und Falschaussage (§8).
 */
export function bauPlaetze(laufe: Laufe = laufeEcht): number | null {
  try {
    return parseWorktrees(laufe('git', ['worktree', 'list', '--porcelain'])).filter((w) => !w.haupt).length;
  } catch {
    return null;
  }
}

/** Ein gelandeter Commit auf `main`: Datum (TT.MM.JJJJ) und Betreffzeile im Wortlaut. */
export interface MainCommit {
  datum: string;
  betreff: string;
}

/**
 * Die letzten `anzahl` Commits auf `main` — Datum + Betreff, sonst nichts.
 *
 * Gelesen wird `main` und nicht `HEAD`: die Frage des Blocks ist «was ist
 * FERTIG geworden», und fertig ist im Projekt, was auf `main` liegt (§9 —
 * Merge nach main IST der Deploy). In einem Feature-Worktree zeigte `HEAD`
 * dagegen auf unfertige eigene Arbeit.
 *
 * `null` heisst «git nicht abfragbar» (fehlt, Timeout, kein `main`) — die
 * Anzeige setzt dafür eine Hinweiszeile, statt eine leere Liste als «nichts
 * ist fertig geworden» misszuverstehen.
 */
export function letzteCommits(anzahl = 5, laufe: Laufe = laufeEcht): MainCommit[] | null {
  try {
    const roh = laufe('git', ['log', `-n${anzahl}`, '--date=format:%d.%m.%Y', '--format=%ad%x09%s', 'main']);
    const zeilen = roh.split('\n').filter((z) => z.includes('\t'));
    if (zeilen.length === 0) return null;
    return zeilen.map((z) => {
      const tab = z.indexOf('\t');
      return { datum: z.slice(0, tab), betreff: z.slice(tab + 1) };
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Werkzeug-Katalog (Rechner + Vorlagen) — SSoT ist `ALLE_KARTEN`
// ---------------------------------------------------------------------------
export interface KatalogKarte { titel: string; status: KartenStatus }
export interface KatalogGruppe { titel: string; karten: KatalogKarte[] }

/** Status-Verteilung über den GESAMTEN Katalog (beide Modi). */
export function katalogZaehlung(): Record<KartenStatus, number> {
  const out: Record<KartenStatus, number> = { entwurf: 0, 'geprüft': 0, geplant: 0 };
  for (const k of ALLE_KARTEN) out[k.status] += 1;
  return out;
}

/** Karten eines Modus, gruppiert nach Sektions-Titel (Reihenfolge = Sektionen). */
export function katalogGruppen(modus: 'rechner' | 'vorlage'): KatalogGruppe[] {
  const sektionen = modus === 'rechner' ? SEKTIONEN : VORLAGE_SEKTIONEN;
  return sektionen
    .map((s) => ({
      titel: s.title,
      karten: ALLE_KARTEN.filter((k) => k.modus === modus && k.art === s.art)
        .map((k) => ({ titel: k.title, status: k.status }))
        .sort((a, b) => a.titel.localeCompare(b.titel, 'de-CH')),
    }))
    .filter((g) => g.karten.length > 0);
}

// ---------------------------------------------------------------------------
// Norm-Korpus (`public/normtext/register.json`)
// ---------------------------------------------------------------------------
export interface NormErlass {
  key: string;
  ebene: 'bund' | 'kanton';
  kanton: string | null;
  kuerzel: string;
  titel: string;
  sr: string | null;
  rechtsgebiet: string | null;
  status: string;
  artikelAnzahl: number;
  stand: string | null;
  rang: number | null;
}

export function normRegister(): { erzeugt: string; erlasse: NormErlass[] } | null {
  try {
    return JSON.parse(readFileSync('public/normtext/register.json', 'utf8')) as { erzeugt: string; erlasse: NormErlass[] };
  } catch {
    return null;
  }
}

/** Kanton → Anzahl Erlasse; Kantone ohne Erlass fehlen (Seite zeigt «—»). */
export function normKantonZaehlung(erlasse: NormErlass[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of erlasse) if (e.ebene === 'kanton' && e.kanton) out[e.kanton] = (out[e.kanton] ?? 0) + 1;
  return out;
}

/** Status-Verteilung der Erlasse einer Ebene (`snapshot` = gespeicherter Volltext). */
export function normStatusZaehlung(erlasse: NormErlass[], ebene: 'bund' | 'kanton'): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of erlasse) if (e.ebene === ebene) out[e.status] = (out[e.status] ?? 0) + 1;
  return out;
}

/** Die 26 Kantonskürzel in fester Reihenfolge (Raster-Achse, immer vollzählig). */
export const KANTONE = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'] as const;

// ---------------------------------------------------------------------------
// Rechtsprechung (`public/rechtsprechung/register.json`)
// ---------------------------------------------------------------------------
export interface Entscheid {
  gerichtName: string;
  gerichtstyp: string;
  kanton: string | null;
  datum: string | null;
  leitcharakter: string | null;
  sprache: string | null;
  bgeReferenz: string | null;
}

export function rechtsprechungRegister(): { erzeugt: string; entscheide: Entscheid[] } | null {
  try {
    return JSON.parse(readFileSync('public/rechtsprechung/register.json', 'utf8')) as { erzeugt: string; entscheide: Entscheid[] };
  } catch {
    return null;
  }
}

/** Häufigkeits-Zählung über ein Feld; unbesetzte Werte fallen weg. */
export function zaehleNach<T>(items: T[], feld: (t: T) => string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) {
    const k = feld(i);
    if (k) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chronik (`ROADMAP-CHRONIK.md`) — Meilenstein-Zeitachse
// ---------------------------------------------------------------------------
export interface Meilenstein { titel: string; monat: string | null }

/** Erledigt-Einträge im Chronik-Archiv (##-Blöcke) — das ehrliche Gegenstück
 *  zu den kleinen done-Zahlen im Plan, der fast nur den offenen Rest führt. */
export function chronikErledigt(): number | null {
  try {
    return (readFileSync('ROADMAP-CHRONIK.md', 'utf8').match(/^## /gm) ?? []).length;
  } catch {
    return null;
  }
}

/** Je `## `-Block ein Meilenstein. Datierung ist eine deklarierte HEURISTIK:
 *  die ERSTE Datumsangabe in Überschrift + den folgenden 15 Zeilen. Blöcke
 *  ohne Datum bekommen `monat: null` und werden auf der Seite getrennt
 *  ausgewiesen — nie stillschweigend einem Monat zugeschlagen (§8). */
export function chronikMeilensteine(): Meilenstein[] | null {
  let zeilen: string[];
  try {
    zeilen = readFileSync('ROADMAP-CHRONIK.md', 'utf8').split('\n');
  } catch {
    return null;
  }
  const DATUM = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/;
  const out: Meilenstein[] = [];
  for (let i = 0; i < zeilen.length; i++) {
    if (!zeilen[i].startsWith('## ')) continue;
    const titel = klartext(zeilen[i].replace(/^##\s*/, '').replace(/\*\(.*?\)\*\s*$/, '').replace(/\((?:[^()]*,\s*)?done\)\s*$/i, ''))
      .replace(/\s*[—–-]\s*$/, '')
      .trim();
    const m = zeilen.slice(i, i + 16).join('\n').match(DATUM);
    out.push({ titel: titel || zeilen[i].replace(/^##\s*/, ''), monat: m ? `${m[3]}-${String(Number(m[2])).padStart(2, '0')}` : null });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Bau-Statistik — jede Zahl mechanisch, jede Ausfallquelle sichtbar
// ---------------------------------------------------------------------------
export interface BauStatistik {
  commits: number | null;
  gemergtePrs: number | null;
  pruefTore: number | null;
  testDateien: number | null;
}

export function bauStatistik(): BauStatistik {
  const commits = Number((sh('git', ['rev-list', '--count', 'HEAD']) ?? '').trim());
  const prRaw = sh('gh', ['pr', 'list', '--state', 'merged', '--limit', '1000', '--json', 'number']);
  let gemergtePrs: number | null = null;
  if (prRaw !== null) {
    try {
      gemergtePrs = (JSON.parse(prRaw) as unknown[]).length;
    } catch {
      gemergtePrs = null;
    }
  }
  let pruefTore: number | null;
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
    pruefTore = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('check:')).length;
  } catch {
    pruefTore = null;
  }
  const tests = sh('git', ['ls-files', 'src/tests/*', 'e2e/*']);
  const testDateien = tests === null ? null : tests.split('\n').filter((f) => /\.(test\.ts|e2e\.ts)$/.test(f)).length;
  return { commits: Number.isFinite(commits) && commits > 0 ? commits : null, gemergtePrs, pruefTore, testDateien };
}
