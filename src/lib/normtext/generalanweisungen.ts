// ─── Historie · Generalanweisungen als Artikel-Ereignis (W2·32-GENERALANWEISUNGEN, 5.10.2026) ──
//
// Ein Änderungserlass kann den Körper eines Artikels ändern, OHNE dass am Artikel eine Fussnote steht: «Ersatz von Ausdrücken»
// (Gesetzestechnische Richtlinien des Bundes, GTR Rz. 327–330: «In den Artikeln 28a Abs. 1, 299, … wird der Ausdruck «Gewalt» durch
// «Sorge» ersetzt») oder die Neufassung eines ganzen Buches («Das erste Buch des Strafgesetzbuches erhält die folgende neue
// Fassung»). Der Konsolidierungstext nennt die Anweisung dann nirgends — die Historie aus Fussnoten (historie-parse.ts) sieht
// sie nicht, «Gilt seit» bleibt auf einem älteren Datum (ZGB 299: 1978 statt 2000) oder fehlt ganz (StGB 52: 2004 statt 2007).
//
// Dieses Register führt solche Anweisungen als DATEN, jede mit Fundstelle im Amtsblatt (AS), amtlichem Link, In-Kraft-Datum und
// dem WORTLAUT der Artikelliste. Daraus leitet `anweisungsEreignisse` je Artikel ein Ereignis ab, das wie ein Fussnoten-Ereignis in
// «Gilt seit» eingeht (Maximum über die datierten Körper-Ereignisse). §2: reine Funktionen, kein Netz, kein Datum der Gegenwart.
// §7/§8: nur erfasst ist, was hier steht — jede andere Generalanweisung des Bundesrechts fehlt noch (bekannte Grenze, siehe
// bibliothek/normtext/generalanweisungen-gilt-seit-2026-10-05.md); das Register behauptet keine Vollständigkeit.
//
// Zwei Umfangsformen:
//   · `liste`        — die Artikelliste der Anweisung im Wortlaut («Art. 1 Abs. 2, 4, 28 Abs. 1, …»). `parseListe` zerlegt sie. Die
//                      Anweisung NENNT die Artikel: hier gilt sie, Ausnahmen (`ausser`) nur mit amtlichem Beleg.
//   · `ganzerErlass` — «Im ganzen Erlass wird …» (PATG: «Institut» → «IGE»). Die Anweisung nennt keine Artikel; betroffen ist ein
//                      Artikel, dessen HEUTIGER Text den neuen Ausdruck trägt (`erwartet`). Das ist abgeleitet, nicht genannt —
//                      darum mit Vorbehalt: ein jüngeres Überschrift-Ereignis (Neufassung/Einfügung des Abschnitts) kann den Artikel
//                      nach der Anweisung erst geschaffen oder neu gefasst haben (Vorgabe C), dann gibt es kein Ereignis.
// Eine Neufassung ganzer Artikel (StGB erstes Buch) ist eine `liste` mit art 'neufassung': die Artikelüberschriften der Ziffer I
// des AS-Erlasses, nicht ein Zahlenbereich — Artikel, die später dazukamen (Art. 66a–d, 67c–f, 79a/b, 92a), sind darin nicht.
// Nicht erfasst werden «Randtitel von Art. N» (Randtitel zählt nicht, Entscheid David 3.10.2026) und Schlusstitel-Artikel (kein
// Korpus-Schlüssel ableitbar).

import type { AnweisungsTreffer, HistorieEreignis } from './historie-parse';
import { ANWEISUNGEN, type Anweisung } from './generalanweisungen-register';


// ── Artikelliste → Stellen ─────────────────────────────────────────────────────────────────────────────────────

/** Eine Stelle einer Anweisung: ein Artikel (Label ohne Unterstrich: «28a») und der Absatz/die Ziffer, falls genannt. */
interface Stelle {
  /** Absatz-Angabe im Wortlaut («1», «2 und 3», «1–3»); null = der ganze Artikel (kein Absatz genannt). */
  absatz: string | null;
  /** Ziffer-Angabe («1», «1–4»); null = keine. */
  item: string | null;
}

/** Ergebnis von `parseListe`. */
export interface Liste {
  /** Artikel, deren KÖRPER die Anweisung nennt (Label → Stelle). */
  koerper: Map<string, Stelle>;
  /** Artikel, die nur mit «Randtitel von Art. N» genannt sind (Randtitel zählt nicht — kein Körper-Ereignis). */
  nurRandtitel: string[];
  /** Schlusstitel-Artikel (Korpus-Schlüssel hier nicht ableitbar). */
  schlusstitel: string[];
  /** Artikel, vor denen ein Gliederungstitel steht («Gliederungstitel vor den Artikeln 9, 32 und 57»): Überschrift, kein Körper. */
  nurGliederungstitel: string[];
}

const NUM = String.raw`\d+[a-z]*`;
// Buchstabe einer lit. («Buchstabe d», «Buchstabe abis»): kleinbuchstabig, kein Artikel.
const BST = String.raw`[a-z](?:bis|ter|quater)?`;
// Der nächste Posten beginnt mit Absatz-/Ziffer-Stichwort ⇒ «und 385 Abs. 3» ist ein neuer Artikel, kein weiterer Absatz.
const FOLGT_STICHWORT = /^\s+(?:Abs\.|Absatz|Absätze|Ziff\.|Ziffer|Ziffern|Randtitel)(?=\s|$)/;
// Absatz-/Ziffer-Nummern sind klein; eine grössere Zahl hinter «und» ist ein Artikel.
const KLEIN = (n: string): boolean => parseInt(n, 10) <= 20;

/** Absatz-/Ziffer-Gruppe ab `s` (hinter dem Stichwort): «2», «2 und 3», «1–3», bei Plural auch «2, 4 und 5». */
function gruppe(s: string, plural: boolean, num: string = NUM): { text: string; rest: string } {
  const erste = new RegExp(`^(${num})(?![\\w])`).exec(s);
  if (!erste) throw new Error(`Anweisungsliste: Absatz-/Ziffer-Nummer erwartet bei «${s.slice(0, 24)}»`);
  let text = erste[1];
  let rest = s.slice(erste[0].length);
  for (;;) {
    const bis = new RegExp(`^\\s*–\\s*(${NUM})`).exec(rest);
    if (bis) { text += `–${bis[1]}`; rest = rest.slice(bis[0].length); continue; }
    const komma = plural ? new RegExp(`^\\s*,\\s*(${NUM})`).exec(rest) : null;
    if (komma && KLEIN(komma[1]) && !FOLGT_STICHWORT.test(rest.slice(komma[0].length))) {
      text += `, ${komma[1]}`; rest = rest.slice(komma[0].length); continue;
    }
    const und = new RegExp(`^\\s+und\\s+(${NUM})`).exec(rest);
    if (und && KLEIN(und[1]) && !FOLGT_STICHWORT.test(rest.slice(und[0].length))) {
      text += ` und ${und[1]}`; rest = rest.slice(und[0].length);
      // «Absätze 2, 4 und 5»: «und» schliesst die Gruppe; «Abs. 2 und 3» ebenfalls.
      const nochBis = new RegExp(`^\\s*–\\s*(${NUM})`).exec(rest);
      if (nochBis) { text += `–${nochBis[1]}`; rest = rest.slice(nochBis[0].length); }
    }
    return { text, rest };
  }
}

/**
 * Zerlegt die Artikelliste einer Anweisung im AS-Wortlaut. Kennt beide amtlichen Schreibweisen («Abs.»/«Ziff.» wie in AS 1999 1118
 * und «Absatz»/«Absätze»/«Ziffer» wie in AS 2020 957); der Wortlaut muss vollständig verbraucht werden — ein unbekanntes Stück wirft.
 */
export function parseListe(wortlaut: string): Liste {
  let s = wortlaut.replace(/\s+/g, ' ').replace(/[−‒]/g, '–').trim().replace(/[.]$/, '');
  const koerper = new Map<string, Stelle>();
  const randtitel = new Set<string>();
  const schluss = new Set<string>();
  const titel = new Set<string>();
  let titelModus = false;
  const trenner = /^(?:\s|,|\bund\b|\bsowie\b)+/;
  while (s.length > 0) {
    const t = trenner.exec(s);
    if (t) { s = s.slice(t[0].length); continue; }
    const rtVon = /^Randtitel von\s+/.exec(s);
    if (rtVon) s = s.slice(rtVon[0].length);
    const schlussTitel = /^Schlusstitel\s+/.exec(s);
    if (schlussTitel) s = s.slice(schlussTitel[0].length);
    // «Gliederungstitel vor den Artikeln 9, 32 und 57»: die folgenden Nummern sind Überschriften, bis ein neuer Artikel-Kopf kommt.
    const glTitel = /^Gliederungstitel vor (?:den )?Artikeln?\s+/.exec(s);
    if (glTitel) { s = s.slice(glTitel[0].length); titelModus = true; }
    const artKopf = /^(?:in den\s+)?(?:Art\.|Artikeln?)\s*/.exec(s);
    if (artKopf) { s = s.slice(artKopf[0].length); titelModus = false; }
    const label = new RegExp(`^(${NUM})(?![\\w])`).exec(s);
    if (!label) throw new Error(`Anweisungsliste: Artikelnummer erwartet bei «${s.slice(0, 30)}»`);
    s = s.slice(label[0].length);
    let absaetze: string[] = [];
    let items: string[] = [];
    let koerperTreffer = !rtVon; // «Randtitel von Art. N» ohne weitere Angabe trifft nur den Randtitel
    for (;;) {
      const sp = /^\s+/.exec(s);
      const t2 = sp ? s.slice(sp[0].length) : s;
      // Hinter der Nummer: «Randtitel» allein (nur Randtitel, zählt nicht), «Randtitel und Text» (Körper ganz) oder «Randtitel und
      // Absätze 1 und 3» (Randtitel zählt nicht, die Absätze schon).
      const rtText = /^Randtitel(?:\s+und\s+(Text)\b|\s+und(?=\s+(?:Abs\.|Absatz|Absätze|Ziff\.|Ziffer|Ziffern)\s))?/.exec(t2);
      if (rtText && !/^Randtitel von\b/.test(t2)) {
        if (rtText[1]) koerperTreffer = true;
        else if (!/^Randtitel\s+und\b/.test(t2)) koerperTreffer = false;
        s = t2.slice(rtText[0].length);
        continue;
      }
      const abs = /^(Abs\.|Absatz|Absätze)\s+/.exec(t2);
      if (abs) {
        const g = gruppe(t2.slice(abs[0].length), abs[1] === 'Absätze');
        absaetze = [...absaetze, g.text]; koerperTreffer = true; s = g.rest; continue;
      }
      const zif = /^(Ziff\.|Ziffern?)\s+/.exec(t2);
      if (zif) {
        const g = gruppe(t2.slice(zif[0].length), zif[1] === 'Ziffern');
        items = [...items, g.text]; koerperTreffer = true; s = g.rest; continue;
      }
      const bst = new RegExp(`^(?:Bst\\.|Buchstaben?)\\s+(${BST})(?![\\w])`).exec(t2);
      if (bst) { items = [...items, bst[1]]; koerperTreffer = true; s = t2.slice(bst[0].length); continue; }
      // «erster Satz», «erster und zweiter Satz», «letzter Satz», «zweiter Teilsatz»
      const teil = /^(?:(?:erster|zweiter|dritter|vierter|letzter)\s+und\s+)?(?:erster|zweiter|dritter|vierter|letzter)\s+(?:Satz|Teilsatz|Halbsatz)\b/.exec(t2);
      if (teil) { koerperTreffer = true; s = t2.slice(teil[0].length); continue; }
      // «Ziffer 1 erster Satz und Ziffer 2 erster Satz»: «und» vor einem neuen Absatz-/Ziffer-Stichwort desselben Artikels
      const undStich = /^und\s+(?=(?:Abs\.|Absatz|Absätze|Ziff\.|Ziffer|Ziffern)\s)/.exec(t2);
      if (undStich) { s = t2.slice(undStich[0].length); continue; }
      break;
    }
    if (schlussTitel) { schluss.add(label[1]); continue; }
    if (titelModus) { titel.add(label[1]); continue; }
    if (!koerperTreffer) { randtitel.add(label[1]); continue; }
    const alt = koerper.get(label[1]);
    const neu: Stelle = {
      absatz: absaetze.length ? absaetze.join(' und ') : null,
      item: items.length ? items.join(' und ') : null,
    };
    if (!alt) koerper.set(label[1], neu);
    else {
      // Mehrere Nennungen desselben Artikels: ohne Absatz-Angabe gilt der ganze Artikel.
      koerper.set(label[1], {
        absatz: alt.absatz && neu.absatz ? `${alt.absatz} und ${neu.absatz}` : null,
        item: alt.item && neu.item ? `${alt.item} und ${neu.item}` : null,
      });
    }
  }
  // Ein Artikel, der auch im Körper steht, ist kein Nur-Randtitel-Artikel.
  return { koerper, nurRandtitel: [...randtitel].filter((l) => !koerper.has(l)), schlusstitel: [...schluss], nurGliederungstitel: [...titel] };
}

const listeCache = new Map<string, Liste>();
function listeVon(a: Anweisung): Liste | null {
  if (!('liste' in a.umfang)) return null;
  let l = listeCache.get(a.id);
  if (!l) listeCache.set(a.id, (l = parseListe(a.umfang.liste)));
  return l;
}

// ── Anweisung → Ereignis ───────────────────────────────────────────────────────────────────────────────────────

function ereignis(a: Anweisung, stelle: Stelle | null): HistorieEreignis {
  return {
    typ: a.art === 'ausdruck' ? 'ausdruck' : 'fassung',
    datum: a.inKraft,
    wirkung: false,
    quellen: [{ label: a.as, url: a.eli }],
    absatz: stelle?.absatz ?? null,
    item: stelle?.item ?? null,
    anweisung: a.art === 'ausdruck' ? `«${a.alt}» → «${a.neu}»` : `${a.bereichsname} neu gefasst`,
  };
}

/** Korpus-Token («28_a») → Artikel-Label der Listen («28a»). */
export const tokenZuLabel = (token: string): string => token.replace(/_/g, '');

/**
 * Die Anweisungs-Ereignisse EINES Artikels (nach In-Kraft-Datum aufsteigend). `koerperText` = der heutige Körper-Text des Artikels:
 * `ganzerErlass` trifft nur, wenn er den neuen Ausdruck trägt; bei `liste` mit `stamm` entfällt das Ereignis, wenn der heutige Text
 * den Ersatzausdruck nicht mehr trägt (der Artikel wurde danach neu gefasst, ohne Fussnote am Artikel). Ohne `koerperText` (Unit-Tests)
 * keine Textprüfung für `liste`. Leere Liste = keine erfasste Anweisung.
 */
export function anweisungsEreignisse(erlass: string, token: string, koerperText?: string): AnweisungsTreffer[] {
  const label = tokenZuLabel(token);
  const aus: AnweisungsTreffer[] = [];
  for (const a of ANWEISUNGEN) {
    if (a.erlass !== erlass) continue;
    if ('liste' in a.umfang) {
      const stelle = listeVon(a)?.koerper.get(label);
      if (!stelle || a.ausser?.some((x) => x.artikel === label)) continue;
      // Trägt der heutige Text den Ersatzausdruck nicht mehr, wurde der Artikel danach neu gefasst (ohne Fussnote am Artikel, nur
      // an der Überschrift: ZGB 410/368/383/385 Erwachsenenschutz 2013, ZGB 860/864 Schuldbrief 2012). Das Datum dieser Anweisung
      // sagt dann nichts über den heutigen Wortlaut — kein Ereignis, «Gilt seit» bleibt, wie es war (§8).
      if (koerperText !== undefined && a.stamm && !koerperText.toLowerCase().includes(a.stamm)) continue;
      aus.push({ ereignis: ereignis(a, stelle), ueberschriftVorbehalt: false });
    } else if (koerperText !== undefined && /^\d+(?:_[a-z]+)*$/.test(token) && !a.ausser?.some((x) => x.artikel === label) && new RegExp(`\\b${a.umfang.erwartet}\\b`).test(koerperText)) {
      // Nur echte Artikel («110», «140_a»), keine Schluss-/Übergangsbestimmungen («disp_u1_art_146»): deren Datum ist das des Erlasses.
      aus.push({ ereignis: ereignis(a, null), ueberschriftVorbehalt: true });
    }
  }
  return aus.sort((x, y) => (x.ereignis.datum ?? '').localeCompare(y.ereignis.datum ?? ''));
}
