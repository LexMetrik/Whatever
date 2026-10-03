import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArtikelInner, extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex';
import { ART_SUFFIXE } from '../lib/fedlex/nummer';

// ═══ W2·27-BUND-FERTIG P8 · Teil B — Absatz-Suffix «sexies» und höher ═══════════
//
// BEFUND (Messung 3.10.2026, 231 gepinnte Bund-HTMLs): der Extraktor kannte die Reihe der Absatz-Suffixe
// nur bis «quinquies» (fünf Handkopien in extrahiere-fedlex.ts, dazu anhang.ts, fussnoten-extrahiere.ts,
// segmente-/Invarianten-/p-Klassen-Tore). «<sup>1sexies</sup>» passte weder auf die Absatznummer noch auf
// den Strip: absatz=null, das Label «1sexies» stand im Fliesstext, der Anker fehlte. Filter «Text beginnt
// mit <Ziffer><Suffix ab sexies> und absatz=null»: 14 Absätze in 7 Erlassen (BPV, ELG, GwG, KVG, RPG, VStG,
// VZAE). Jetzt liest der Extraktor die EINE amtliche Reihe (src/lib/fedlex/nummer.ts, ART_SUFFIXE).
//
// Fixtures sind reale Fedlex-Absatzanfänge (Erlass/Artikel im Tabellen-Kopf, Konsolidierung = Pin vom
// 2./3.10.2026: BPV 20260701, ELG 20260101, GwG 20261001, KVG 20260701, RPG 20260701, VStG 20250101,
// VZAE 20261001) — Marke und Markup wörtlich, der Text nach dem Satzanfang gekürzt.
// Rot-Beweis gegen den alten Code: Ausgabe im PR-Text.

type Fall = { erlass: string; art: string; label: string; markup: string; textStart: string };
const FAELLE: Fall[] = [
  { erlass: 'BPV', art: '116m', label: '3sexies', markup: '<p class="absatz man-space-before-4"><sup>3sexies</sup>&nbsp;Als funktionsbezogene Mindestanforderung gelten:</p>', textStart: 'Als funktionsbezogene Mindestanforderung gelten:' },
  { erlass: 'BPV', art: '116m', label: '3septies', markup: '<p class="absatz man-space-before-4"><sup>3septies</sup>&nbsp;Unterschreitet bei Funktionen der Informations- und Kommunikationstechnologien die funktionsrelevante Erfahrung fünf Jahre, so erfolgt die Einreihung vorübergehend in der Lohnklasse&nbsp;15.</p>', textStart: 'Unterschreitet bei Funktionen' },
  { erlass: 'ELG', art: '10', label: '1sexies', markup: '<p class="absatz man-space-before-4"><sup>1sexies</sup>&nbsp;<span style="color: #221E1F;">Die Kantone können bean</span><span style="color: #221E1F;">tragen, die Höchstbeträge in einer Gemeinde um bis zu 10 Prozent zu senken oder zu erhöhen.</span><sup><a href="#fn-d141468e1389" id="fnbck-d141468e1389">3</a></sup></p>', textStart: 'Die Kantone können beantragen' },
  { erlass: 'ELG', art: '10', label: '1septies', markup: '<p class="absatz man-space-before-4"><sup>1septies</sup>&nbsp;<span style="color: #221E1F;">Der Bundesrat überprüft mindestens alle zehn Jahre, ob und in welchem Ausmass die Höchstbeträge die effektiven Mietzinse decken.</span></p>', textStart: 'Der Bundesrat überprüft mindestens' },
  { erlass: 'GwG', art: '9', label: '1sexies', markup: '<p class="absatz man-space-before-4"><sup>1sexies</sup>&nbsp;In den Fällen nach den Absätzen 1<sup>bis</sup> und 1<sup>ter</sup> gilt die Definition des begründeten Verdachts gemäss Absatz 1<sup>quinquies</sup> sinngemäss.<sup><a href="#fn-d275882e2650" id="fnbck-d275882e2650">84</a></sup></p>', textStart: 'In den Fällen nach den Absätzen 1bis und 1ter gilt die Definition des begründeten Verdachts gemäss Absatz 1quinquies sinngemäss.' },
  { erlass: 'KVG', art: '18', label: '2sexies', markup: '<p class="absatz man-space-before-4"><sup>2sexies</sup>&nbsp;Die gemeinsame Einrichtung kann von den Kantonen gegen Entschädigung weitere Vollzugsaufgaben übernehmen.<sup><a href="#fn-d403214e1646" id="fnbck-d403214e1646">52</a></sup></p>', textStart: 'Die gemeinsame Einrichtung kann' },
  { erlass: 'KVG', art: '18', label: '2septies', markup: '<p class="absatz man-space-before-4"><sup>2septies</sup>&nbsp;Sie führt den Lebendspende-Nachsorgefonds nach Artikel 15<i>b</i> des Transplantationsgesetzes vom 8. Oktober 2004<sup><a href="#fn-d403214e1672" id="fnbck-d403214e1672">53</a></sup>.</p>', textStart: 'Sie führt den Lebendspende-Nachsorgefonds' },
  { erlass: 'KVG', art: '65', label: '1sexies', markup: '<p class="absatz man-space-before-4"><sup>1sexies</sup>&nbsp;Die Berechnung des Mindestanteils stützt sich auf:</p>', textStart: 'Die Berechnung des Mindestanteils' },
  { erlass: 'KVG', art: '65', label: '1septies', markup: '<p class="absatz man-space-before-4"><sup>1septies</sup>&nbsp;Für die Beurteilung, ob ein Kanton den Mindestanteil erfüllt, werden alle Beträge berücksichtigt, die er für die Bezahlung der Prämien der Versicherten aufwendet.<sup><a href="#fn-d403214e9389" id="fnbck-d403214e9389">272</a></sup></p>', textStart: 'Für die Beurteilung, ob ein Kanton' },
  { erlass: 'KVG', art: '65', label: '1octies', markup: '<p class="absatz man-space-before-4"><sup>1octies</sup>&nbsp;Der Bundesrat legt nach Anhörung der Kantone die Einzelheiten der Berechnung der Bruttokosten und des Mindestanteils fest.<sup><a href="#fn-d403214e9412" id="fnbck-d403214e9412">273</a></sup></p>', textStart: 'Der Bundesrat legt nach Anhörung' },
  { erlass: 'RPG', art: '5', label: '1sexies', markup: '<p class="absatz man-space-before-4"><sup>1sexies</sup>&nbsp;Die bezahlte Abgabe ist bei der Bemessung einer allfälligen Grundstückgewinnsteuer als Teil der Aufwendungen vom Gewinn in Abzug zu bringen.<sup><a href="#fn-d163266e722" id="fnbck-d163266e722">21</a></sup></p>', textStart: 'Die bezahlte Abgabe ist' },
  { erlass: 'VStG', art: '5', label: '1sexies', markup: '<p class="absatz "><sup>1sexies</sup>&nbsp;<span style="color: #221E1F;">Die Absätze 1</span><sup>ter</sup>–<span style="color: #221E1F;">1</span><sup>quinquies</sup> <span style="color: #221E1F;">gelten sinngemäss auch für Reserven aus Kapitaleinlagen.</span><span style="color: #221E1F;"><sup><a href="#fn-d7e841" id="fnbck-d7e841">37</a></sup></span></p>', textStart: 'Die Absätze 1ter–1quinquies gelten sinngemäss' },
  { erlass: 'VStG', art: '5', label: '1septies', markup: '<p class="absatz "><sup>1septies</sup>&nbsp;Absatz 1<sup>bis</sup> gilt für Einlagen und Aufgelder, die während eines Kapitalbands nach den Artikeln 653<i>s </i>ff. des OR<sup><a href="#fn-d7e862" id="fnbck-d7e862">38</a></sup> geleistet werden.</p>', textStart: 'Absatz 1bis gilt für Einlagen' },
  { erlass: 'VZAE', art: '87', label: '1sexies', markup: '<p class="absatz man-space-before-4"><sup>1sexies</sup>&nbsp;Die biometrischen erkennungsdienstlichen Daten, die von den Behörden nach Artikel 4 Absatz 1 Buchstabe h der Verordnung vom 6. Dezember 2013 erhoben worden sind, werden nicht in das AFIS aufgenommen.<sup><a href="#fn-d219852e6993" id="fnbck-d219852e6993">224</a></sup></p>', textStart: 'Die biometrischen erkennungsdienstlichen Daten' },
];

describe('P8-B · Absatz-Suffix ab «sexies» (14 Fälle in 7 Erlassen)', () => {
  for (const f of FAELLE) {
    it(`${f.erlass} Art. ${f.art} Abs. ${f.label}: absatz gesetzt, Label nicht im Fliesstext`, () => {
      const b = parseArtikelInner(f.markup).bloecke;
      expect(b).toHaveLength(1);
      expect(b[0].absatz).toBe(f.label);
      expect(b[0].text.startsWith(f.textStart)).toBe(true);
      expect(b[0].text).not.toMatch(/^\d+(?:sexies|septies|octies)/);
    });
  }

  it('ganzer Artikel: GwG Art. 9 — Abs. 1sexies steht zwischen 1quinquies und 2 (Reihenfolge der Anker)', () => {
    // Auszug GwG SR 955.0 Art. 9, Konsolidierung 20261001 (die Absätze 1quinquies, 1sexies, 2).
    const html = '<article id="art_9"><a name="a9"></a><h6 class="heading" role="heading"><a href="#art_9"><b>Art. 9</b> Meldepflicht</a></h6><div class="collapseable">'
      + '<p class="absatz man-space-before-4"><sup>1quinquies</sup>&nbsp;Ein begründeter Verdacht liegt vor, wenn …</p>'
      + FAELLE[4].markup
      + '<p class="absatz man-space-before-4"><sup>2</sup>&nbsp;Wer als Anwältin oder Anwalt oder Notarin oder Notar handelt, ist nur dann zur Verdachtsmeldung verpflichtet.</p>'
      + '</div></article>';
    const r = extrahiereArtikel(html, '9')!;
    expect(r.bloecke.map((b) => b.absatz)).toEqual(['1quinquies', '1sexies', '2']);
  });

  it('SYNTHETISCH (kein Korpus-Vorkommen): gespaltene Nummer «<sup>1</sup><sup>sexies</sup>» und Plain-<p> mit führendem <sup>', () => {
    const gespalten = '<p class="absatz "><sup>1</sup><sup>sexies</sup>&nbsp;Der Bundesrat regelt die Einzelheiten.</p>';
    expect(parseArtikelInner(gespalten).bloecke[0]).toMatchObject({ absatz: '1sexies', text: 'Der Bundesrat regelt die Einzelheiten.' });
    const ohneKlasse = '<p><sup>2septies</sup>&nbsp;Die Kantone vollziehen diese Bestimmung.</p>';
    expect(parseArtikelInner(ohneKlasse).bloecke[0]).toMatchObject({ absatz: '2septies', text: 'Die Kantone vollziehen diese Bestimmung.' });
  });

  it('unverändert: «1bis»/«2ter» (alte Glieder) und das «bis» als gewöhnliches Wort am Satzanfang', () => {
    expect(parseArtikelInner('<p class="absatz "><sup>1bis</sup>&nbsp;Der Rat entscheidet.</p>').bloecke[0]).toMatchObject({ absatz: '1bis', text: 'Der Rat entscheidet.' });
    const wort = parseArtikelInner('<p class="absatz "><sup>1</sup>&nbsp;bis zum Ablauf der Frist gilt Folgendes.</p>').bloecke[0];
    expect(wort).toMatchObject({ absatz: '1', text: 'bis zum Ablauf der Frist gilt Folgendes.' });
  });
});

// ── Bestandsprobe gegen die committeten Snapshots (Daten-Stand dieses PR) ──────────
const BUND = join(process.cwd(), 'public/normtext/bund');
type Item = { text?: string; marke?: string };
type Block = { absatz?: string | null; text?: string; items?: Item[] };
type Eintrag = { id: string; bloecke?: Block[] };
const ladeBund = (key: string): Eintrag[] => (JSON.parse(readFileSync(join(BUND, `${key}.json`), 'utf8')) as { eintraege: Eintrag[] }).eintraege;

describe('P8-B · Bestandsprobe (public/normtext/bund)', () => {
  const NACH_QUINQUIES = ART_SUFFIXE.slice(ART_SUFFIXE.indexOf('quinquies') + 1);
  const LABEL_IM_TEXT = new RegExp(`^\\d+[a-z]?(?:${NACH_QUINQUIES.join('|')})\\b`);

  it('die 14 Absätze tragen absatz=«<Nr><Suffix>» im Snapshot, keiner mehr als Label im Text', () => {
    for (const f of FAELLE) {
      const key = f.erlass.toUpperCase(); // Dateiname/Id-Schlüssel gross (GwG → GWG, VStG → VSTG)
      const e = ladeBund(key).find((x) => x.id === `bund/${key}/art_${f.art.replace(/(\d+)([a-z])$/, '$1_$2')}`);
      expect(e, `${f.erlass} Art. ${f.art}`).toBeDefined();
      expect(e!.bloecke!.map((b) => b.absatz), `${f.erlass} Art. ${f.art}`).toContain(f.label);
    }
  });

  it('kein Block im ganzen Bund-Korpus (231 Erlasse) beginnt mit «<Ziffer><Suffix ab sexies>» bei absatz=null', () => {
    const treffer: string[] = [];
    for (const datei of readdirSync(BUND).filter((d) => d.endsWith('.json'))) {
      for (const e of ladeBund(datei.replace(/\.json$/, ''))) {
        for (const b of e.bloecke ?? []) {
          if ((b.absatz === null || b.absatz === undefined) && b.text && LABEL_IM_TEXT.test(b.text)) treffer.push(`${e.id}: ${b.text.slice(0, 40)}`);
        }
      }
    }
    expect(treffer).toEqual([]);
  });
});

// ── Tor: der Bund-Extraktionspfad trägt keine Handkopie der Reihe mehr (§5) ─────────
describe('P8-B · EINE Suffix-Reihe im Bund-Extraktionspfad', () => {
  // Kantonale/LexWork/PDF-Adapter haben eine eigene Grammatik (nummer.ts, Absatz «Diese Reihe gilt für die
  // BUND-Grammatik») und sind bewusst ausgenommen. `fedlex/listen.ts` (Marken-Reihe bis `decies`) wartet auf
  // die Landung von #1299 (gleiche Datei) — Nachzug dort, Zeile 198.
  const DATEIEN = [
    'extrahiere-fedlex.ts', 'fedlex/anhang.ts', 'fedlex/absatz-nr.ts', 'fussnoten-extrahiere.ts', 'ziffer-ebene.ts',
    'segmente-logik.ts', 'check-p-klassen.ts', 'check-invarianten-logik.ts', 'p3-drop-inventar.ts', 'drift-logik.ts',
  ];
  it('keine Alternation «…quater|quinquies…» im Quelltext dieser Dateien', () => {
    const verletzer = DATEIEN.filter((d) => /quater\|quinquies/.test(readFileSync(join(process.cwd(), 'scripts/normtext', d), 'utf8')));
    expect(verletzer).toEqual([]);
  });
});
