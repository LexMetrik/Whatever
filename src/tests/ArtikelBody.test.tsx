import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { trenneAenderungshistorie, labelMitBereich, absatzMarke } from '../lib/normtext/darstellung';
import type { NormSnapshot } from '../lib/normtext/typen';
// Kern-Probe (Block am Dateiende, S0 23.9.2026):
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NormSnapshotDatei } from '../lib/normtext/typen';

// ArtikelBody ist die aus NormPopover extrahierte Render-Komponente. Die
// Byte-Gleichheit gegenüber dem alten Popover-Body sichert NormPopover.test.tsx
// (unverändert). Hier nur die eigenständige Vertrags-Prüfung.

const bloecke: NormSnapshot['bloecke'] = [
  { absatz: '1', text: 'Erster Absatz mit Inhalt.' },
  { absatz: '2', text: 'Zweiter Absatz mit Inhalt.' },
  {
    absatz: '3', text: 'Dritter Absatz mit Liste:',
    items: [
      { marke: 'a', text: 'erster Buchstabe;' },
      { marke: 'b', text: 'zweiter Buchstabe.' },
    ],
  },
];

const render = (
  passus: { absatz: string | null; lit?: string; ziff?: string },
  artikel = '1',
  className?: string,
) => renderToString(<ArtikelBody bloecke={bloecke} artikel={artikel} passus={passus} className={className} />);

describe('ArtikelBody', () => {
  it('rendert alle Blöcke + Items', () => {
    const out = render({ absatz: null });
    expect(out).toContain('Erster Absatz mit Inhalt.');
    expect(out).toContain('Zweiter Absatz mit Inhalt.');
    expect(out).toContain('a.');
    expect(out).toContain('zweiter Buchstabe.');
    expect(out.match(/data-passus=/g)!.length).toBe(3);
  });

  it('Default-className ist das Popover-Padding (Byte-Gleichheit)', () => {
    const out = render({ absatz: null });
    expect(out).toContain('px-5 py-4 space-y-2.5');
  });

  it('eigene className überschreibt das Default-Padding (Lesesicht)', () => {
    const out = render({ absatz: null }, '1', 'space-y-4');
    expect(out).toContain('class="space-y-4"');
    expect(out).not.toContain('px-5 py-4 space-y-2.5');
  });

  it('markiert den zitierten Absatz (data-passus="true")', () => {
    const out = render({ absatz: '2' });
    expect(out.match(/data-passus="true"/g)!.length).toBe(1);
    expect(out.split('data-passus="true"')[1]).toContain('Zweiter Absatz');
  });

  it('markiert genau das zitierte Item (data-passus-item="true")', () => {
    const out = render({ absatz: '3', lit: 'b' });
    expect(out.match(/data-passus-item="true"/g)!.length).toBe(1);
    expect(out.split('data-passus-item="true"')[1]).toContain('zweiter Buchstabe');
  });

  it('aufgehobene Stelle («…») → «aufgehoben»', () => {
    const out = renderToString(
      <ArtikelBody bloecke={[{ absatz: '1', text: '…' }]} artikel="1" passus={{ absatz: null }} />,
    );
    expect(out).toContain('aufgehoben');
    expect(out).not.toContain('>…<');
  });

  // S3 (BS-Audit 23.6.2026): aufgehobene lit. werden mit Marke + LEEREM Text
  // gespeichert (kein fabrizierter «Aufgehoben.»-Text). Die Lesesicht zeigt das
  // leere item gedämpft, die Marke (hier «g.») bleibt sichtbar.
  //
  // RE-BLESS W2·27 (15.9.2026, §6.3 deklariert): der Ersatztext war
  // «aufgehoben» und ist jetzt «kein Text im Snapshot». Der Artikel hier LEBT
  // (Abs. 1 trägt Wortlaut) und trägt keinen amtlichen Aufhebungsvermerk — dass
  // lit. g aufgehoben sei, ist genau die Vermutung, die §8 verbietet. Mit
  // amtlichem Beleg (`artikelAufgehoben`) steht «aufgehoben» weiter da: der
  // Fall unmittelbar darunter.
  it('lit. mit Marke aber leerem Text → Marke sichtbar, Text «kein Text im Snapshot»', () => {
    const out = renderToString(
      <ArtikelBody
        artikel="35"
        passus={{ absatz: null }}
        bloecke={[
          {
            absatz: '1', text: 'Vom Einkommen werden abgezogen:',
            items: [
              { marke: 'f', text: '3300 Franken;' },
              { marke: 'g', text: '' },
              { marke: 'h', text: '18500 Franken.' },
            ],
          },
        ]}
      />,
    );
    expect(out).toContain('g.'); // Marke bleibt sichtbar (Lücke geschlossen)
    expect(out).toContain('kein Text im Snapshot'); // leeres item gedämpft, ohne Behauptung
    expect(out).not.toContain('>aufgehoben<');
  });

  // Gegenprobe zum Fall darüber (§6.7): MIT amtlichem Artikel-Beleg bleibt es
  // beim alten Wort — der Beleg deckt den leeren Block/das leere Item mit.
  it('leeres lit. IN einem amtlich aufgehobenen Artikel bleibt «aufgehoben»', () => {
    const out = renderToString(
      <ArtikelBody
        artikel="35"
        passus={{ absatz: null }}
        artikelAufgehoben
        bloecke={[{ absatz: '1', text: '', items: [{ marke: 'g', text: '' }] }]}
      />,
    );
    expect(out).toContain('aufgehoben');
    expect(out).not.toContain('kein Text im Snapshot');
  });

  // M6 §1: Bei invertierter Verschachtelung (Ziff. → lit.) muss das Zitat der
  // verschachtelten lit. ihre Eltern-Ziff. tragen, und die NACHFOLGENDE Ziff.
  // darf NICHT fälschlich unter die lit. genestet werden. Die explizite tiefe
  // steuert das; die frühere Markentyp-Heuristik hätte hier falsch zitiert.
  it('M6: invertierte Verschachtelung — Zitat lit. a = «Ziff. 1bis lit. a», Ziff. 2 bleibt top-level', () => {
    const out = renderToString(
      <ArtikelBody
        artikel="16"
        zitierKontext={{ artikelLabel: 'Art. 16', kuerzel: 'BankG' }}
        passus={{ absatz: null }}
        bloecke={[{
          absatz: null, text: 'Als Depotwerte gelten:',
          items: [
            { marke: '1', text: 'bewegliche Sachen;' },
            { marke: '1bis', text: 'kryptobasierte Vermögenswerte:' },
            { marke: 'a', text: 'individuell zugeordnet;', tiefe: 1 },
            { marke: 'b', text: 'einer Gemeinschaft zugeordnet;', tiefe: 1 },
            { marke: '2', text: 'fiduziarisch innegehaltene Werte;' },
            { marke: '3', text: 'frei verfügbare Lieferansprüche.' },
          ],
        }]}
      />,
    );
    // Verschachtelte lit. a trägt die Eltern-Ziff.
    expect(out).toContain('Art. 16 Ziff. 1bis lit. a BankG');
    expect(out).toContain('Art. 16 Ziff. 1bis lit. b BankG');
    // Die nachfolgende Ziff. 2 ist KORREKT top-level (nicht «lit. … Ziff. 2»).
    expect(out).toContain('Art. 16 Ziff. 2 BankG');
    expect(out).not.toContain('lit. 1bis Ziff. 2'); // der alte Heuristik-Fehler
  });

  it('autolink: verlinkt zitierte Normen im Wortlaut, aus = Klartext', () => {
    const bl = [{ absatz: '1', text: 'Der Schuldner haftet nach Art. 41 OR für den Schaden.' }];
    const mitLink = renderToString(<ArtikelBody bloecke={bl} artikel="1" passus={{ absatz: null }} autolink />);
    expect(mitLink).toContain('decoration-dotted'); // NormText-Inline-Anker
    expect(mitLink).toContain('Art. 41 OR');
    const ohneLink = renderToString(<ArtikelBody bloecke={bl} artikel="1" passus={{ absatz: null }} />);
    expect(ohneLink).not.toContain('decoration-dotted');
    expect(ohneLink).toContain('Art. 41 OR');
  });
});

// Auftrag David 26.6.2026 (H/I/J): In der Lesesicht (zitierKontext) gilt:
//  J — beim Hover «poppt» NUR die angewählte Bestimmung pro Element leicht
//      heraus (<p> bzw. <li> je einzeln, vertikaler Lift hover:-translate-y-0.5) —
//      NICHT der ganze Block-<div> (kein Ganz-Absatz-Pop). Vertikaler Lift statt
//      Breiten-scale, damit am overflow-x-clip-Container NICHTS abgeschnitten wird
//      (P6); OHNE -mx-2/will-change und OHNE Rahmen (kein ring/shadow, P7).
//  I — Marken-Nummern (Absatznr. + lit./Ziff.) kleiner (text-body-s).
//  H — zk-Absatzmarke als feste Rinnen-Box (inline-block w-9, kein mr-3),
//      damit «2bis/2ter» die erste Textzeile nicht verschiebt.
// Das Popover (kein zitierKontext) bleibt byte-gleich (NormPopover.test.tsx golden).
describe('Lesesicht H/I/J — Pop pro Element, kleinere Marken, feste Rinne', () => {
  const zk = { artikelLabel: 'Art. 1', kuerzel: 'ZGB' };
  const out = () => renderToString(
    <ArtikelBody bloecke={bloecke} artikel="1" passus={{ absatz: null }} zitierKontext={zk} className="space-y-3" />,
  );
  // ── §6.3-DEKLARATION · Ae8 (LESER-V3 H2b, 17.8.2026) ───────────────────────
  // DER FRUEHERE FALL: «J: Pop pro Element wieder da — <p>/<li> tragen den
  // vertikalen Lift (hover:-translate-y-0.5)». Er bewachte genau das, was der
  // Aesthetik-Review H1 als Befund Ae8 gemeldet hat: der Hover hob die Zeile um
  // 2 px an und fuellte 588 px Breite mit `brass-200/60` (gemessen an StPO 429).
  //
  // ZWEI REGELN DER DESIGN-GRUNDLAGE STANDEN DAGEGEN: Kap. 8 Nr. 3 «keine
  // Farbflaeche ohne Bedeutung — Brass ist Signal, nicht Tapete» (Brass traegt im
  // Leser die Treffer-Hervorhebung und die aktive Zeile; auf einem blossen
  // Mauskontakt entwertet es beide) und Kap. 7 «keine Animation ohne
  // Zustandswechsel» — ein Hover ist kein Zustand.
  //
  // DIESE ZWEI FAELLE SIND DARUM UMGEKEHRT, nicht gestrichen: der Apparat bewacht
  // weiter dieselbe Stelle, nur mit der neuen Regel. Ein blosses Loeschen haette
  // die Flaeche unbewacht gelassen, und der naechste Umbau haette den Lift
  // unbemerkt zurueckgebracht (§17-Gegengewicht: umkehren statt streichen, wenn
  // die Sorge bleibt).
  it('Ae8: KEIN vertikaler Lift am Hover — eine Bewegung ohne Zustandswechsel', () => {
    const o = out();
    expect(o, 'hover:-translate-y-* ist eine Animation ohne Zustandswechsel (Kap. 7)')
      .not.toContain('hover:-translate-y-');
    expect(o).not.toContain('hover:translate-');
  });
  it('J: der Block-<div> selbst poppt NICHT (kein Pop auf der Block-Klasse)', () => {
    // Bei passus=null sind alle Blöcke nicht zitiert → die Block-<div>-Klasse
    // trägt NUR die Farbe, keinen Lift/scale/ring/shadow.
    //
    // S2 · DEKLARIERTE FACHLICHE ÄNDERUNG (§6.3): hier stand
    // «leading-relaxed text-ink-700». Der `leading-relaxed`-Anteil ist im
    // LESESICHT-Zweig (`zitierKontext` gesetzt, wie hier) entfallen — er stand
    // unbedingt auf dem Block-Wrapper und schlug damit die Zeilenhöhe der
    // Fliesstext-Stufe: die Absätze liefen auf 1.625 statt auf die 1.55, die
    // David am 17.8.2026 mit F3 = V2 gewählt hat. Herleitung an der Stelle in
    // `ArtikelBody.tsx`. Ausserhalb der Lesesicht (Popover/Vorschau) ist
    // `leading-relaxed` unverändert vorhanden — das deckt `NormPopover.test.tsx`
    // (golden) ab, und genau darum bleibt dieser Fall auf die Lesesicht bezogen.
    expect(out()).toContain('class="text-ink-700"');
    // Die Zusicherung des Falls selbst, unverändert: kein Pop auf dem Block.
    expect(out()).not.toContain('class="leading-relaxed text-ink-700"');
  });
  it('J/P6: kein Clipping (kein scale, kein -mx-2, kein will-change-transform)', () => {
    const o = out();
    expect(o).not.toContain('hover:scale-');
    expect(o).not.toContain('-mx-2');
    expect(o).not.toContain('will-change-transform');
  });
  it('J/P7: kein Rahmen (kein hover:ring / hover:shadow)', () => {
    const o = out();
    expect(o).not.toContain('hover:ring-');
    expect(o).not.toContain('hover:shadow-');
  });
  // R5-D (5.9.2026) · DEKLARIERTE Test-Anpassung nach §6.3, Begruendung und
  // Beweis: die drei Aussagen dieses Falls sind unveraendert — nur ihre
  // Schreibweise ist es nicht mehr. Die neutrale Hover-Flaeche lag in der App
  // in FUENF Schreibweisen vor (`hover:bg-paper-sunken` voll/60 %/70 %,
  // `hover:bg-well`, `hover:bg-paper/60`) und laeuft seit R5-D ueber den
  // geteilten Baustein `.lc-hover-flaeche` (DESIGN-REGLEMENT §G-j: EINE Regel,
  // getragen von einer Rolle). GEMESSEN am Preview (`/gesetze/bund/OR`,
  // 5.9.2026): die Zeile ruht auf `rgba(0, 0, 0, 0)` und wird beim Ueberfahren
  // `rgb(246, 244, 238)` — Zeichen fuer Zeichen der Wert, den
  // `bg-paper-sunken` vorher lieferte (`--well: #f6f4ee`). Die WIRKUNG ist
  // also unveraendert; angepasst wird allein der Name, den der Fall zitiert.
  it('Ae8: der Hintergrund-Hover bleibt — aber in der ruhenden Flaeche, nicht in Brass', () => {
    const o = out();
    // Die Geste bleibt sichtbar (§8: der zitierbare Passus zeigt sich weiterhin) …
    expect(o, 'der Hover ist ganz verschwunden — die Zitierbarkeit waere unsichtbar')
      .toContain('lc-hover-flaeche');
    // … und Brass bleibt dem Signal vorbehalten (Treffer, aktive Zeile).
    expect(o, 'Brass als Hover-Flaeche entwertet die Treffer-Hervorhebung (Kap. 8 Nr. 3)')
      .not.toContain('hover:bg-brass-');
    // Absatz und Aufzaehlungszeile tragen DIESELBE Flaeche (§5) — und zwar die
    // des Bausteins: keine einzige eigene `hover:bg-`-Stufe bleibt uebrig.
    expect([...o.matchAll(/hover:bg-[a-z0-9/-]+/g)].map((t) => t[0]))
      .toEqual([]);
    expect([...o.matchAll(/lc-hover-flaeche/g)].length, 'beide Zeilen tragen den Baustein')
      .toBeGreaterThanOrEqual(1);
  });
  it('I/H: zk-Absatzmarke ist kleiner (text-body-s) und feste Rinnen-Box (inline-block w-9, kein mr-3)', () => {
    const o = renderToString(
      <ArtikelBody bloecke={[{ absatz: '2', text: 'Zweiter Absatz.' }]} artikel="1" passus={{ absatz: null }} zitierKontext={zk} />,
    );
    expect(o).toContain('text-body-s');
    expect(o).toContain('inline-block');
    expect(o).toContain('w-9');
    expect(o).not.toContain('mr-3');
  });
  it('I: zk-Item-Marke ist kleiner (text-body-s) bei erhaltener Rinnen-Breite', () => {
    const o = renderToString(
      <ArtikelBody
        artikel="1"
        passus={{ absatz: null }}
        zitierKontext={zk}
        bloecke={[{ absatz: '1', text: 'Liste:', items: [{ marke: 'a', text: 'erster Buchstabe;' }] }]}
      />,
    );
    expect(o).toContain('w-6 text-right !font-medium !text-ink-500 text-body-s');
  });
  it('non-zk (Popover): kein Pop/Clipping/Rahmen, kein zk-Item-Hover', () => {
    const o = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="1" passus={{ absatz: null }} />,
    );
    expect(o).not.toContain('hover:scale-');
    expect(o).not.toContain('hover:-translate-y-0.5');
    expect(o).not.toContain('hover:bg-brass-200/60');
    expect(o).not.toContain('hover:ring-');
    expect(o).not.toContain('hover:shadow-');
  });
});

// QS-UI (Gegenprüfung PR #658, gebaut PR #679, 4./5.9.2026): Fedlex setzt
// echte Aufzählungsmarken («<dt>a. </dt>») UND Label-Listen («<dt>BE: </dt>»)
// in dieselbe items[].marke-Struktur (extrahiere-fedlex.ts §Aufzählung).
// Label-Marken sind KEINE lit.-Position — Beschriftung ohne «lit.»-Präfix,
// mit «:» statt «.» wie im amtlichen <dt>. Real belegt: VZV Art. 3 Abs. 1,
// marke "BE" (public/normtext/bund/VZV.json) — «Der Führerausweis wird für
// folgende Kategorien erteilt: … BE Fahrzeugkombinationen …»; vorher zeigte
// der Leser «BE.» und das Zitat «Art. 3 Abs. 1 lit. BE VZV» (fachlich falsch,
// eine «lit. BE» gibt es in der VZV nicht).
describe('QS-UI Marken-Präfix — Label-Marken ohne lit., mit «:» (VZV Art. 3 Abs. 1)', () => {
  const vzvArt3Abs1: NormSnapshot['bloecke'] = [
    {
      absatz: '1', text: 'Der Führerausweis wird für folgende Kategorien erteilt:',
      items: [
        { marke: 'a', text: 'echte Aufzählungsposition;' },
        { marke: 'BE', text: 'Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie B und einem Anhänger …' },
      ],
    },
  ];
  it('Anzeige: echte Aufzählungsmarke «a.» unverändert, Label-Marke «BE:» statt «BE.»', () => {
    const out = renderToString(
      <ArtikelBody bloecke={vzvArt3Abs1} artikel="3" passus={{ absatz: null }} />,
    );
    expect(out).toContain('>a.<');
    expect(out).toContain('>BE:<');
    expect(out).not.toContain('>BE.<');
  });
  it('Zitat (Lesesicht): echte Marke «Art. 3 Abs. 1 lit. a VZV», Label-Marke OHNE «lit.» («Art. 3 Abs. 1 BE VZV»)', () => {
    const out = renderToString(
      <ArtikelBody
        bloecke={vzvArt3Abs1} artikel="3" passus={{ absatz: null }}
        zitierKontext={{ artikelLabel: 'Art. 3', kuerzel: 'VZV' }}
      />,
    );
    expect(out).toContain('Art. 3 Abs. 1 lit. a VZV — kopieren');
    expect(out).toContain('Art. 3 Abs. 1 BE VZV — kopieren');
    expect(out).not.toContain('Art. 3 Abs. 1 lit. BE VZV');
  });
});

describe('trenneAenderungshistorie (§3 — Extraktions-Artefakt-Trennung)', () => {
  it('in-Kraft-Artikel mit angehängter Fussnote: Wortlaut bleibt, Historie abgetrennt, doppelte Nr weg', () => {
    const t = 'Artikel 20 Absatz 3 ist sinngemäss anwendbar. 53 53 Fassung gemäss Ziff. I des BG vom 20. März 1998 (AS 2000 1569).';
    const { wortlaut, historie } = trenneAenderungshistorie(t);
    expect(wortlaut).toBe('Artikel 20 Absatz 3 ist sinngemäss anwendbar.');
    expect(historie).toBe('Fassung gemäss Ziff. I des BG vom 20. März 1998 (AS 2000 1569).');
    expect(wortlaut).not.toContain('53 53');
  });

  it('Ganzkörper-Aufhebung mit geleaktem Label-Rest: Wortlaut leer, Historie ohne Rest/Doppel-Nr', () => {
    const { wortlaut, historie } = trenneAenderungshistorie('– 274 g 113 113 Aufgehoben durch Anhang 1 Ziff. II 5 der ZPO.');
    expect(wortlaut).toBe('');
    expect(historie).toBe('Aufgehoben durch Anhang 1 Ziff. II 5 der ZPO.');
  });

  it('Buchstaben-Suffix-Leak («g 25 25 Eingefügt …») wird verworfen', () => {
    const { wortlaut, historie } = trenneAenderungshistorie('g 25 25 Eingefügt durch Ziff. I des BG vom 5. Okt. 1990.');
    expect(wortlaut).toBe('');
    expect(historie).toContain('Eingefügt durch');
  });

  it('normaler Normtext bleibt unangetastet (keine Doppel-Nr → keine Trennung)', () => {
    const t = 'Wer einem anderen widerrechtlich Schaden zufügt, wird ihm zum Ersatz verpflichtet.';
    const { wortlaut, historie } = trenneAenderungshistorie(t);
    expect(wortlaut).toBe(t);
    expect(historie).toBeNull();
  });

  // RE-BLESS W2·27 (15.9.2026, §6.3 deklariert): nach dem Abtrennen der
  // Historie bleibt ein LEERER Block ohne amtlichen Vermerk — der Ersatztext ist
  // darum «kein Text im Snapshot» statt «aufgehoben». Die eigentliche Aussage
  // des Falls (kein Artefakt im Wortlaut) ist unverändert.
  it('render: Ganzkörper-Leerstelle → Ersatztext, KEIN Artefakt im Wortlaut (Historie gehört an den Fuss)', () => {
    const out = renderToString(
      <ArtikelBody bloecke={[{ absatz: null, text: 'g 25 25 Eingefügt durch Ziff. I des BG vom 5. Okt. 1990.' }]}
        artikel="40_g" passus={{ absatz: null }} />,
    );
    expect(out).toContain('kein Text im Snapshot');
    expect(out).not.toContain('25 25');
    expect(out).not.toContain('Eingefügt durch'); // Historie nicht im Wortlaut-Block
    expect(out).not.toMatch(/>\s*g 25/);
  });

  it('render: in-Kraft-Artikel mit angehängter Fussnote → Wortlaut bleibt, Artefakt weg', () => {
    const out = renderToString(
      <ArtikelBody bloecke={[{ absatz: null, text: 'Der Arbeitnehmer hat Anspruch auf Ruhezeit. 53 53 Fassung gemäss Ziff. I des BG.' }]}
        artikel="21" passus={{ absatz: null }} />,
    );
    expect(out).toContain('Der Arbeitnehmer hat Anspruch auf Ruhezeit.');
    expect(out).not.toContain('53 53');
    expect(out).not.toContain('Fassung gemäss'); // Historie aus dem Wortlaut entfernt
  });
});

describe('labelMitBereich (Halbgeviert für Bereichs-Artikel)', () => {
  it('rekonstruiert das Halbgeviert aus der id', () => {
    expect(labelMitBereich('Art. 226a226d', '226_a_226_d')).toBe('Art. 226a–226d');
    expect(labelMitBereich('Art. 6770', '67_70')).toBe('Art. 67–70');
    expect(labelMitBereich('Art. 274274g', '274_274_g')).toBe('Art. 274–274g');
  });
  it('lässt Einzelartikel und Buchstaben-Suffixe unberührt', () => {
    expect(labelMitBereich('Art. 335c', '335_c')).toBe('Art. 335c');
    expect(labelMitBereich('Art. 40g', '40_g')).toBe('Art. 40g');
    expect(labelMitBereich('§ 11', '11')).toBe('§ 11');
  });
  it('erhält den Paragraphen-Präfix (Kanton)', () => {
    expect(labelMitBereich('§ 1215', '12_15')).toBe('§ 12–15');
  });
});

describe('TarifTabelle (block.tabelle → 2-Spalten-Tarif)', () => {
  it('rendert tabelle als 2-Spalten-Tarif (Beschreibung + Betrag)', () => {
    const bloeckeTabelle: NormSnapshot['bloecke'] = [{
      absatz: null, text: '',
      tabelle: [
        { beschreibung: 'Vorladung', betrag: '6.—' },
        { beschreibung: 'Mahnung', betrag: '10.— bis 50.—' },
      ],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloeckeTabelle} artikel="5" passus={{ absatz: null }} />,
    );
    expect(out).toContain('Vorladung');
    expect(out).toContain('6.—');
    expect(out).toContain('Mahnung');
    expect(out).toContain('10.— bis 50.—');
  });

  it('betrag ≥4 Stellen bekommt Schweizer Apostroph (§3 — Stufe-2-D)', () => {
    const bloeckeTabelle: NormSnapshot['bloecke'] = [{
      absatz: null, text: '',
      tabelle: [{ beschreibung: 'X', betrag: '2000.—' }],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloeckeTabelle} artikel="5" passus={{ absatz: null }} />,
    );
    // React SSR escapes U+0027 as &#x27; — check both forms
    expect(out).toMatch(/2&#x27;000\.—|2'000\.—/);
    expect(out).not.toContain('>2000.—<');
  });

  it('beschreibung-Spalte wird NICHT formatiert (§1: nur betrag)', () => {
    const bloeckeTabelle: NormSnapshot['bloecke'] = [{
      absatz: null, text: '',
      tabelle: [{ beschreibung: 'Streitwert bis 10000', betrag: '200.—' }],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloeckeTabelle} artikel="5" passus={{ absatz: null }} />,
    );
    // beschreibung bleibt literal (10000 nicht formatiert)
    expect(out).toContain('Streitwert bis 10000');
  });

  it('block ohne tabelle rendert byte-identisch (kein Fragment-Wrapper)', () => {
    // Normaler Block — kein tabelle → Render-Pfad unverändert.
    const bl: NormSnapshot['bloecke'] = [{ absatz: '1', text: 'Normaler Absatz.' }];
    const out = renderToString(<ArtikelBody bloecke={bl} artikel="1" passus={{ absatz: null }} />);
    expect(out).toContain('Normaler Absatz.');
    // Kein Fragment-Marker und keine table-spezifischen Klassen.
    expect(out).not.toContain('tabular-nums');
  });
});

describe('absatzMarke (bis/ter-Rekonstruktion, §3 — Wortlaut unangetastet)', () => {
  it('null-Absatz mit «1bis …» am Textanfang → Marke 1bis, Rest ohne Marke', () => {
    expect(absatzMarke(null, '1bis Wurde in einer Zivilsache …'))
      .toEqual({ marke: '1bis', rest: 'Wurde in einer Zivilsache …' });
  });
  it('geleakter Suffix («absatz=1», Text «bis Erfordert …») → 1bis', () => {
    expect(absatzMarke('1', 'bis Erfordert die Erstellung eines Schriftstücks …'))
      .toEqual({ marke: '1bis', rest: 'Erfordert die Erstellung eines Schriftstücks …' });
  });
  it('echtes Wort «bis» am Satzanfang («bis zum Ablauf …») bleibt UNANGETASTET', () => {
    expect(absatzMarke('1', 'bis zum Ablauf der Frist gilt das alte Recht.'))
      .toEqual({ marke: '1', rest: 'bis zum Ablauf der Frist gilt das alte Recht.' });
  });
  it('normaler Absatz unverändert', () => {
    expect(absatzMarke('2', 'Der Vertrag ist nichtig.')).toEqual({ marke: '2', rest: 'Der Vertrag ist nichtig.' });
  });
});

// ── M6 (Auftrag David): Fremdgesetz-Chapeau — bare Item-Verweise nicht intern
// fehl-verlinken (ZGB Art. 89a Abs. 6/7 zitieren BVG-Artikel, nicht ZGB). ───────
describe('M6 — Fremdgesetz-Chapeau unterdrückt falsche bare-Self-Links', () => {
  const intern = { tokenMap: new Map([['52', '52'], ['1', '1']]), basisPfad: '/gesetze/bund/ZGB', springeZu: () => {} };
  it('«Art. 52» in einem BVG-Chapeau-Item → KEIN interner #art-52-Sprunglink', () => {
    const bl: NormSnapshot['bloecke'] = [{
      absatz: '6',
      text: 'Für Personalfürsorgestiftungen … gelten überdies die folgenden Bestimmungen des Bundesgesetzes vom 25. Juni 1982 über die berufliche … Vorsorge (BVG) über:',
      items: [{ marke: '3', text: 'die Verantwortlichkeit (Art. 52);' }],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bl} artikel="89_a" passus={{ absatz: null }} autolink intern={intern}
        zitierKontext={{ artikelLabel: 'Art. 89a', kuerzel: 'ZGB' }} />,
    );
    expect(out).toContain('Art. 52'); // Wortlaut bleibt
    expect(out).not.toContain('#art-52'); // aber kein falscher Self-Link
  });
  it('Kontrolle: dasselbe «Art. 52» in einem NORMALEN Item bleibt intern verlinkt', () => {
    const bl: NormSnapshot['bloecke'] = [{
      absatz: '1', text: 'Es gelten folgende Regeln:',
      items: [{ marke: 'a', text: 'die Sache nach Art. 52;' }],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bl} artikel="1" passus={{ absatz: null }} autolink intern={intern}
        zitierKontext={{ artikelLabel: 'Art. 1', kuerzel: 'ZGB' }} />,
    );
    expect(out).toContain('#art-52'); // korrekter Self-Link
  });
});

// ── KERN-PROBE · Normtext-Körper byte-genau (W2·29-WERKBANK-LESER S0, 23.9.2026) ──
// WOFÜR: Der Werkbank-Umbau des Lesers (Fahrplan FAHRPLAN-WERKBANK-UMBAU §5a,
// S1–S5) darf den Normtext-KERN nicht berühren (`src/components/normtext/
// {ArtikelBody*,ArtikelTabellen,BildElemente,tarifText,wortverbinder}`). Das
// Golden (`golden/lexmetrik-golden.json`) deckt nur Rechner/Vorlagen, der
// Normtext-Snapshot nur Daten — für den gerenderten Körper gab es kein
// Instrument. Diese Probe rendert eine FESTE Stichprobe aus dem echten Korpus
// so, wie der Leser sie aufruft (`parts/ArtikelLeser.tsx`: autolink,
// zitierKontext, artikelAufgehoben, Lesesicht-Klassen), und hält zwei Hashes
// je Fall fest:
//   voll     = sha256 des vollständigen Markups (jede Klasse, jedes Zeichen);
//   struktur = sha256 des Markups OHNE class-Attribute (Elemente, Attribute,
//              Wortlaut) — ein reiner Klassen-Tausch lässt ihn stehen.
// Ändert sich ein Hash, ist das eine Änderung am Normtext-Körper: nie still
// nachführen (§6.3), sondern deklariert und begründet — oder den Umbau
// zurücknehmen. Korpus-Nachzüge (neuer Snapshot) ändern die Hashes legitim;
// dann steht der Nachzug im selben Commit (Korpus-Datei + neue Konstante).
//
// STICHPROBE (gewählt per Skript über public/normtext/{bund,kanton}/*.json,
// sortiert, erster Treffer je Klasse — Beleg im Commit-Body S0-B). Die
// Tabellen-Fälle bilden die Regel-Familien des Tabellen-Regelwerks T-A…T-F
// (archiv/FAHRPLAN-GESETZESDARSTELLUNG-BUND.md, Anhang 1) auf je einen
// gerenderten Korpus-Fall ab.
// `anker` = Werttreue-Stichwort (T-F7-Geist): die Probe rendert wirklich den
// Fall und nicht etwa eine Fehl- oder Leerseite.
type KernFall = { fall: string; ebene: 'bund' | 'kanton'; datei: string; artikel: string; label: string; kuerzel: string; anker: string };
const KERN_STICHPROBE: KernFall[] = [
  { fall: 'OR Art. 257d (Prosa, zwei Absätze)', ebene: 'bund', datei: 'OR', artikel: '257_d', label: 'Art. 257d', kuerzel: 'OR', anker: 'Ist der Mieter nach der Übernahme der Sache' },
  { fall: 'T-A Staffel-Spanne verdichtet (bereich)', ebene: 'bund', datei: 'AHVV', artikel: '28', label: 'Art. 28', kuerzel: 'AHVV', anker: 'role="columnheader"' },
  { fall: 'T-B mehrspaltig, ≥3 Zahlspalten', ebene: 'bund', datei: 'AHVG', artikel: '40_c', label: 'Art. 40c', kuerzel: 'AHVG', anker: 'role="columnheader"' },
  { fall: 'T-C Einzel-Leerzelle bleibt (T-C7)', ebene: 'bund', datei: 'AHVV', artikel: '52_d', label: 'Art. 52d', kuerzel: 'AHVV', anker: 'role="columnheader"' },
  { fall: 'T-D kopflos (T-D6)', ebene: 'bund', datei: 'ASYLV1', artikel: 'annex_2', label: 'Anhang 2', kuerzel: 'AsylV 1', anker: 'Verfolgungssichere Heimat- oder Herkunftsstaaten' },
  { fall: 'T-E Alt-Form ohne Spalten-Vektor (Rückfallpfad)', ebene: 'bund', datei: 'AHVV', artikel: '52', label: 'Art. 52', kuerzel: 'AHVV', anker: 'role="table"' },
  { fall: 'T-F Leitfall GebV SchKG Art. 20 (T-F4)', ebene: 'bund', datei: 'GEBV_SCHKG', artikel: '20', label: 'Art. 20', kuerzel: 'GebV SchKG', anker: 'über 100 bis 500' },
  { fall: 'T-B5 Kurzform tabelle (Kanton)', ebene: 'kanton', datei: 'SG-2808', artikel: '7', label: 'Art. 7', kuerzel: 'SG 2808', anker: 'Die Entscheidgebühren betragen:' },
  { fall: 'Formelbild (DBG Art. 22)', ebene: 'bund', datei: 'DBG', artikel: '22', label: 'Art. 22', kuerzel: 'DBG', anker: '<figure' },
  { fall: 'aufgehoben (ganzer Artikel)', ebene: 'bund', datei: 'AHVG', artikel: '17', label: 'Art. 17', kuerzel: 'AHVG', anker: 'aufgehoben' },
  { fall: 'leer, ungeklärt (Kanton, nicht aufgehoben)', ebene: 'kanton', datei: 'BS-153.100', artikel: '53', label: '§ 53', kuerzel: 'BS 153.100', anker: 'kein Text im Snapshot' },
  { fall: 'Kantonsartikel (Absätze + Items)', ebene: 'kanton', datei: 'AG-291.150', artikel: '3', label: '§ 3', kuerzel: 'AG 291.150', anker: 'Die Grundentschädigung für die Vertretung' },
];

const korpusCache = new Map<string, NormSnapshotDatei>();
function kernMarkup(f: KernFall): string {
  const pfad = join(process.cwd(), 'public', 'normtext', f.ebene, `${f.datei}.json`);
  let datei = korpusCache.get(pfad);
  if (!datei) { datei = JSON.parse(readFileSync(pfad, 'utf8')) as NormSnapshotDatei; korpusCache.set(pfad, datei); }
  const e = datei.eintraege.find((x) => x.artikel === f.artikel);
  if (!e) throw new Error(`Kern-Probe: ${f.datei} ${f.artikel} fehlt im Korpus`);
  return renderToStaticMarkup(
    <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }} autolink
      artikelAufgehoben={e.aufgehoben === true}
      zitierKontext={{ artikelLabel: f.label, kuerzel: f.kuerzel, fassung: e.stand, permalinkBasis: `/gesetze/${f.ebene}/${f.datei}#art-${e.artikel}` }}
      className="space-y-3.5 font-serif text-leser-text text-ink-800" />,
  );
}
const kernSha = (s: string) => createHash('sha256').update(s).digest('hex');
const ohneKlassen = (s: string) => s.replace(/ class="[^"]*"/g, '');

/** Erwartete Hashes [voll, struktur] je Fall — erzeugt 23.9.2026 auf dem
 *  Korpus-Stand des Commits S0-B (origin/main). */
const KERN_ERWARTET: Record<string, [string, string]> = {
  'OR Art. 257d (Prosa, zwei Absätze)': ['80c4117233e44537634636109af2975cd648d2acc82ffee28cd17dfc7868265f', '3781a2a8bb5f7c1daa9c37d11b4f302e27f2be3ec899ec2e3682c79387caf27e'],
  'T-A Staffel-Spanne verdichtet (bereich)': ['df91cbbf96992924c491b9601383234e0fcfc0628437a788115fdbdea1188339', 'ec2a8721ce88f5d6c910a387a13aff7057270edf91f752ce5560d3b97d2005f9'],
  'T-B mehrspaltig, ≥3 Zahlspalten': ['fb6708751ad0c9d578f668e86dd3dda4da8371bad0e485681faca86d1f8c8f7d', '1f2b0a7ddf4230f0d1e8ae2c070f0c7ff1d3d99164a536799d6f2bc9ee2f19dd'],
  'T-C Einzel-Leerzelle bleibt (T-C7)': ['1be2f0869943e633e460105d1f8c3d259cb99f76eff0c8b189192991589eab2d', '6740acc8ce7e3df0523dd5dbbe35cb814f28ed4c460f00f82a6de5ea8e2d0fde'],
  'T-D kopflos (T-D6)': ['1fbc23a33acd46c027f33cb489b1272aacf35fd10e5a7c85630a4ba07b2b04f4', '7249f22f596b249a3a532480e15bea9273d2d1c05c42b6ad2b0bef904c35bd72'],
  'T-E Alt-Form ohne Spalten-Vektor (Rückfallpfad)': ['de9e9d5c14d396e1ea93bff3a3e6dcc6985f7372cf77497c1b9b3b95b4e7eaa5', '7c1673da257ee42152116168dc9cf8fbf6b58bfde0180cf89fe914fc038700ef'],
  'T-F Leitfall GebV SchKG Art. 20 (T-F4)': ['2a353abb5a3aa8037bde36b36caab7d1f9b36d05b83efad0f7eab9626ead5faf', 'eb72abb30e66fb45f96e0ceef22f67955d5e579fcea1053ff76f0eb89c004c31'],
  'T-B5 Kurzform tabelle (Kanton)': ['adb4bc97974243eb3e51d199e590604cfdcc2918b36425450d44cad85c64f977', 'ad119a6f2413cb360f9570634315a99d7b3d075cd2ce7b220c1d670cc88b8be5'],
  'Formelbild (DBG Art. 22)': ['2dcfb0e99eaaed263e2e3d64df3812fffe0b961a85962be1069a4965374b2c2e', '63c572a17754ba935d4bbb1dd3099e5881fab13ca6797d2d72ed3c91be7c8346'],
  'aufgehoben (ganzer Artikel)': ['ccb9a533dab7cb8e116602b12048386d2e5421a81c30b26d0bf50ac621d194f8', '0bb7a81471bf6b806a44ee8102ca716f7053db3c43116dc6da5035acf455d79e'],
  'leer, ungeklärt (Kanton, nicht aufgehoben)': ['e36083544edc02902c2a3d9dbde46e80a12674334d556e00c83976c5a274046f', '24fbe7f50467e80e7215a0ac27186ced52b8557f55b60c74dd81f63c7b5d0f5b'],
  'Kantonsartikel (Absätze + Items)': ['1262314cb8c446e7feecb1a785f887de7863a1530b2296dbaf6882f741d8b0dd', 'cca846fd3519f717dc83252091bc3b4afedabd4e77cf27da200cd0cd2a1bceb9'],
};

describe('Kern-Probe · Normtext-Körper byte-genau (S0)', () => {
  for (const f of KERN_STICHPROBE) {
    it(`${f.fall} — ${f.kuerzel} ${f.label}`, () => {
      const markup = kernMarkup(f);
      expect(markup).toContain(f.anker);
      expect([kernSha(markup), kernSha(ohneKlassen(markup))]).toEqual(KERN_ERWARTET[f.fall]);
    });
  }
});
