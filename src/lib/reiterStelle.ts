import type { StrukturMap } from './normtext/browse';
import { zitatKuerzel } from '../pages/gesetz-leser/artikelBezeichnung';
import { sicherDekodiert } from './sicherDekodieren';

// ═══ W2·17-UI-BEFUNDE (DFG-F01) · DIE STELLE IM REITER ═══════════════════════
//
// Der Reiter nennt die gelesene Stelle («Art. 336c OR»). Bis hierher baute
// `tabGruppen.artikelLabelVonPfad` sie aus dem ANKER-TOKEN im Hash: immer «Art. »
// davor, jeder `_` ersatzlos gestrichen. Gemessen am Bestand (2.10.2026):
//   #art-49_50          → «Art. 4950»        (amtlich «Art. 49–50»)
//   #art-scope_u1       → «Art. scopeu1»     (amtlich «Geltungsbereich am …»)
//   #art-annex_1        → «Art. annex1»      (amtlich «Anhang 1»)
//   #art-4 (ZH-211.11)  → «Art. 4»           (der Erlass zählt in «§ 4»)
//   #art-disp_u1_art_12 → «Art. 12 ZGB»      (gemeint: Art. 12 SchlT ZGB)
// Ein Token ist ein Schlüssel, keine Zitierangabe (§8): die Zitierweise gehört
// dem Erlass («Art.» oder «§»), die Gliederung dem Sidecar. Diese Datei leitet
// darum die Stelle aus DEMSELBEN Eintrag ab, den der Leser rendert
// (`artikelLabel`), und die Qualifikation des Übergangsartikels aus DERSELBEN
// Quelle wie das Panel-Zitat (`artikelBezeichnung.zitatKuerzel`, #1274) — keine
// zweite Ableitung (§5).
//
// OHNE DATEN (Reiter beim Start aus dem Speicher, Erlass lädt noch): eine
// Rückfallform, die nie einen Rohschlüssel zeigt und nie etwas behauptet, was
// der Eintrag nicht trägt — im Zweifel keine Stelle (`''`, der bestehende Wert
// «Stellung noch unbekannt»). «Art.» setzt der Rückfall nur dort, wo der Bund-
// Bestand es ausnahmslos so führt (gemessen am ganzen Korpus,
// `reiter-stelle-korpus-w217.test.ts`); bei kantonalen Erlassen lautet die
// Zitierweise je Erlass «Art.» oder «§», das weiss erst der Eintrag.

/** Was der Leser je Erlass kennt: die Einträge (Token + amtliches Label) und das
 *  Struktur-Sidecar (Gliederungs-Bezeichnung der Übergangsgruppen). */
export interface StelleDaten {
  eintraege: readonly { artikel: string; artikelLabel: string }[];
  struktur: StrukturMap | null;
}
/** Erlass-Schlüssel → Daten; hängt als `artikel` am `VerlaufManifeste`. */
export type StelleDatenMap = Readonly<Record<string, StelleDaten>>;

export interface ReiterStelle {
  /** Die Stelle im Reiter: «Art. 12», «§ 4», «Anhang 1», «Geltungsbereich»; `''` = unbekannt. */
  stelle: string;
  /** Das Kürzel, ggf. mit Gliederungs-Qualifikation: «ZGB», «SchlT ZGB». */
  kern: string;
  /** Die Stelle für Satz-Text («gelesen bis …»): Stelle, bei Qualifikation samt Kern. */
  gelesen: string;
}

/** Länge des Stellen-Slots im Reiter (`.rl-stelle`, wächst mit dem Text): lange
 *  amtliche Bezeichnungen («Vorbehalte und Erklärungen …») werden am Wortende
 *  gekürzt; das volle Label steht nicht im Reiter, sondern im Leser. */
const STELLE_MAX = 34;

function kurzLabel(label: string): string {
  // «Geltungsbereich am 16. September 2022»: das Datum ist der Stand der Liste,
  // nicht der Name der Stelle — der Reiter nennt die Stelle. «Geltungsbereich
  // des Übereinkommes» und «… der Änderung» (KRK) bleiben dabei unterscheidbar.
  label = label.replace(/^(Geltungsbereich\b.*?)\s+am\s+\d{1,2}\.\s+\p{L}+\s+\d{4}$/u, '$1');
  if (label.length <= STELLE_MAX) return label;
  const wort = label.slice(0, STELLE_MAX).replace(/\s+\S*$/, '').trim();
  return `${wort || label.slice(0, STELLE_MAX)}…`;
}

/** Artikel-Nummer aus dem Token-Rest: `49_50` → «49–50» (Bereich), `335_c` → «335c».
 *  Geteilt mit den Anzeige-Stellen, die nur einen Bund-Token haben (Kontext-Panel,
 *  Erläuterungen) — dieselbe Regel, am ganzen Korpus gemessen (§5). */
export const nummerAusToken = (rest: string): string => rest.replace(/_(?=\d)/g, '–').replace(/_/g, '');

/** Bund-Token, deren Rückfall dem amtlichen Label gleicht: Ganzzahl mit
 *  Buchstaben-Zusätzen oder Bereich. Alles andere braucht den Eintrag. */
const BUND_NUMMER = /^\d+(?:_[a-z]+)*(?:_\d+(?:_[a-z]+)*)?$/;

/** Rückfall ohne Daten: nur, was der Token allein sicher sagt. */
function stelleAusToken(token: string, ebene: string | undefined): string {
  const ueb = /^disp_u\d+_art_(.+)$/.exec(token);
  if (ueb && BUND_NUMMER.test(ueb[1])) return `Art. ${nummerAusToken(ueb[1])}`;
  if (/^scope_/.test(token)) return 'Geltungsbereich';
  const anhang = /^annex_(\d+(?:_\d+)*|[IVX]+)$/.exec(token);
  if (anhang) return `Anhang ${anhang[1].replace(/_/g, '.')}`;
  if (ebene === 'bund' && BUND_NUMMER.test(token)) return `Art. ${nummerAusToken(token)}`;
  return '';
}

/** Genügt der Token-Rückfall (`true`), oder braucht die Stelle den Eintrag?
 *  Steuert, für welche Reiter die Erlass-Datei überhaupt geladen wird (§15). */
export function stelleBrauchtDaten(anker: string | undefined, ebene: string | undefined): boolean {
  const token = tokenVonAnker(anker);
  if (token === null) return false;
  return !(ebene === 'bund' && BUND_NUMMER.test(token));
}

/** Token aus `#art-<token>`; `null` = kein Anker oder kaputtes %-Escape
 *  (PA-1-B01: dann lieber keine Stelle als eine falsche). */
function tokenVonAnker(anker: string | undefined): string | null {
  const m = anker ? /#art-(.+)$/.exec(anker) : null;
  return m ? sicherDekodiert(m[1]) || null : null;
}

/** Die Stelle eines Reiters. `anker` = `#art-<token>` (Lesestellung bzw. `wahl`),
 *  `kuerzel` = Erlass-Kürzel, `daten` = Einträge des Erlasses oder `null`, solange
 *  sie nicht geladen sind. `null` = der Reiter trägt keine Stelle. */
export function reiterStelle(
  anker: string | undefined,
  kuerzel: string,
  ebene: string | undefined,
  daten: StelleDaten | null | undefined,
): ReiterStelle | null {
  const token = tokenVonAnker(anker);
  if (token === null) return null;
  let stelle: string;
  let kern = kuerzel;
  if (daten) {
    const e = daten.eintraege.find((x) => x.artikel === token);
    // Token, den der Erlass nicht kennt (veralteter Reiter): keine Stelle statt
    // einer erfundenen.
    if (!e) return { stelle: '', kern, gelesen: '' };
    stelle = kurzLabel(e.artikelLabel);
    kern = zitatKuerzel(token, e.artikelLabel, kuerzel, daten.struktur, daten.eintraege);
  } else {
    stelle = stelleAusToken(token, ebene);
    if (stelle && /^disp_u\d+_/.test(token)) kern = zitatKuerzel(token, stelle, kuerzel, null, []);
  }
  return { stelle, kern, gelesen: stelle && kern !== kuerzel ? `${stelle} ${kern}` : stelle };
}
